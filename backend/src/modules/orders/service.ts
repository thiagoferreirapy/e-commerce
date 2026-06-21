import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma";
import { BadRequest } from "../../lib/errors";
import { isValidCPF, pixPrice, round2 } from "../../lib/format";
import type { PaymentMethod } from "./schema";
import { applyCoupon } from "../coupons/service";
import { quoteShipping } from "../shipping/service";
import { getCartItems, replaceCart, resolveLines, type CartItemInput } from "../cart/service";
import {
  createPixCharge,
  getOrCreateCustomer,
  getPayment,
  getPixQrCode,
  isFailedStatus,
  isPaidStatus,
} from "../payments/asaas";

export interface OrderAddressInput {
  recipient: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  label?: string;
}

export interface CreateOrderInput {
  items?: CartItemInput[];
  address: OrderAddressInput;
  payment: PaymentMethod;
  installments?: number;
  shippingId: string;
  couponCode?: string | null;
  cpf?: string;
}

/** Status de pedido aguardando pagamento (Pix antes de confirmar). */
const PENDING = "aguardando_pagamento";

function orderNumber(seq: number): string {
  return `TQ-2026-${String(100 + seq).padStart(4, "0")}`;
}

interface OrderEnrich {
  slugByProduct: Map<string, string>;
  reviewed: Set<string>;
}

function mapOrder(order: Awaited<ReturnType<typeof loadOrder>>, enrich?: OrderEnrich) {
  if (!order) return null;
  return {
    id: order.id,
    number: order.number,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    items: order.items.map((i) => ({
      productId: i.productId,
      name: i.name,
      imageUrl: i.imageUrl,
      variantLabel: i.variantLabel ?? undefined,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      // Habilita a ação "Avaliar" em Minha conta (precisa do slug do produto).
      slug: enrich?.slugByProduct.get(i.productId),
      reviewed: enrich?.reviewed.has(i.productId) ?? false,
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    total: order.total,
    payment: order.payment,
    installments: order.installments,
    shippingLabel: order.shippingLabel,
    address: JSON.parse(order.addressSnapshot),
    pix: order.pixPayload
      ? {
          payload: order.pixPayload,
          encodedImage: order.pixEncodedImage ?? "",
          expiresAt: order.pixExpiresAt ? order.pixExpiresAt.toISOString() : null,
        }
      : undefined,
  };
}

function loadOrder(id: string) {
  return prisma.order.findUnique({ where: { id }, include: { items: true } });
}

/**
 * Cria a cobrança Pix na Asaas (cliente + cobrança + QR) e devolve os dados a
 * serem gravados no pedido. Chamado ANTES de criar o pedido — se falhar (ex.: CPF
 * inválido), o erro propaga e nenhum pedido órfão é criado.
 */
async function createPixForOrder(order: {
  id: string;
  number: string;
  total: number;
  payer: { name: string; cpf: string; email?: string; phone?: string };
}) {
  const customerId = await getOrCreateCustomer({
    name: order.payer.name,
    cpfCnpj: order.payer.cpf,
    email: order.payer.email,
    phone: order.payer.phone,
  });
  const charge = await createPixCharge({
    customerId,
    value: order.total,
    externalReference: order.id,
    description: `Pedido ${order.number}`,
  });
  const qr = await getPixQrCode(charge.id);
  return {
    asaasCustomerId: customerId,
    asaasPaymentId: charge.id,
    pixPayload: qr.payload,
    pixEncodedImage: qr.encodedImage,
    pixExpiresAt: qr.expirationDate ? new Date(qr.expirationDate) : null,
  };
}

export async function createOrder(input: CreateOrderInput, userId?: string) {
  // Origem dos itens: corpo (visitante) ou carrinho do servidor (logado).
  const rawItems =
    input.items && input.items.length
      ? input.items
      : userId
        ? await getCartItems(userId)
        : [];

  if (!rawItems.length) throw BadRequest("Carrinho vazio.");

  const lines = await resolveLines(rawItems);
  if (!lines.length) throw BadRequest("Itens inválidos.");

  // Validação de estoque (servidor é a fonte da verdade).
  for (const l of lines) {
    if (l.quantity > l.available) {
      throw BadRequest(`Estoque insuficiente para "${l.product.name}".`);
    }
  }

  const isPix = input.payment === "pix";

  // Dados do pagador (Pix exige CPF e cliente na Asaas).
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, phone: true, cpf: true },
      })
    : null;
  let payerCpf = "";
  if (isPix) {
    payerCpf = (input.cpf || user?.cpf || "").replace(/\D/g, "");
    if (!isValidCPF(payerCpf)) {
      throw BadRequest("Informe um CPF válido para pagar com Pix.");
    }
  }

  const subtotal = round2(lines.reduce((acc, l) => acc + l.lineTotal, 0));

  // Cupom (revalidado no servidor): escopo, validade, limite de usos e mínimo.
  let discount = 0;
  let appliedCouponCode: string | null = null;
  if (input.couponCode) {
    const couponLines = lines.map((l) => ({
      productId: l.product.id,
      categorySlug: l.product.categorySlug,
      subcategorySlug: l.product.subcategorySlug ?? null,
      brandId: l.product.brandId,
      lineTotal: l.lineTotal,
    }));
    const result = await applyCoupon(input.couponCode, subtotal, couponLines);
    discount = result.discount;
    appliedCouponCode = result.coupon.code;
  }

  // Frete grátis se todos os itens têm o selo; cota a partir dos métodos cadastrados.
  const freeShipping = lines.length > 0 && lines.every((l) => l.product.freeShipping);
  const quote = await quoteShipping({ cep: input.address.cep, subtotal, freeShipping });
  const option = quote.options.find((o) => o.id === input.shippingId);
  if (!option) throw BadRequest("Opção de frete inválida.");
  const shipping = option.price;

  const net = round2(subtotal - discount);
  const total = isPix ? round2(pixPrice(net) + shipping) : round2(net + shipping);

  const count = await prisma.order.count();
  const number = orderNumber(count + 1);
  const orderId = randomUUID();

  // Pix: cria a cobrança na Asaas ANTES do pedido. Se falhar (CPF inválido etc.),
  // o erro propaga e nada é gravado (sem pedido órfão nem estoque reservado).
  let pixData: Awaited<ReturnType<typeof createPixForOrder>> | null = null;
  if (isPix) {
    pixData = await createPixForOrder({
      id: orderId,
      number,
      total,
      payer: {
        name: input.address.recipient,
        cpf: payerCpf,
        email: user?.email ?? undefined,
        phone: user?.phone ?? undefined,
      },
    });
  }

  const created = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        id: orderId,
        number,
        userId: userId ?? null,
        // Pix entra como pendente; cartão/boleto seguem mock (pago direto).
        status: isPix ? PENDING : "pago",
        subtotal,
        discount,
        shipping,
        total,
        payment: input.payment,
        installments: input.payment === "cartao" ? (input.installments ?? 1) : 1,
        shippingLabel: option.label,
        ...(pixData ?? {}),
        addressSnapshot: JSON.stringify({
          id: "order-addr",
          label: input.address.label ?? "Entrega",
          recipient: input.address.recipient,
          cep: input.address.cep,
          street: input.address.street,
          number: input.address.number,
          complement: input.address.complement,
          district: input.address.district,
          city: input.address.city,
          state: input.address.state,
        }),
        items: {
          create: lines.map((l) => ({
            productId: l.product.id,
            variantId: l.variant?.id ?? null,
            name: l.product.name,
            imageUrl: l.image,
            variantLabel: l.variantLabel || null,
            unitPrice: l.unitPrice,
            quantity: l.quantity,
          })),
        },
      },
      include: { items: true },
    });

    // Baixa de estoque (reserva, inclusive para Pix pendente).
    for (const l of lines) {
      if (l.variant) {
        await tx.variant.update({
          where: { id: l.variant.id },
          data: { stock: { decrement: l.quantity } },
        });
      }
      await tx.product.update({
        where: { id: l.product.id },
        data: { totalStock: { decrement: l.quantity }, soldCount: { increment: l.quantity } },
      });
    }

    // Contabiliza o resgate do cupom (limite de usos).
    if (appliedCouponCode) {
      await tx.coupon.update({
        where: { code: appliedCouponCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    return order;
  });

  // Limpa o carrinho do usuário autenticado.
  if (userId) await replaceCart(userId, []);

  return { orderNumber: created.number, order: mapOrder(created) };
}

/* ----------------------- Pagamento (Pix) ----------------------- */

/** Devolve o estoque (e soldCount) dos itens de um pedido. Idempotência fica no chamador. */
async function restoreStock(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return;
  const ops = order.items.flatMap((i) => {
    const list = [
      prisma.product.updateMany({
        where: { id: i.productId },
        data: { totalStock: { increment: i.quantity }, soldCount: { decrement: i.quantity } },
      }),
    ];
    if (i.variantId) {
      list.push(
        prisma.variant.updateMany({
          where: { id: i.variantId },
          data: { stock: { increment: i.quantity } },
        }),
      );
    }
    return list;
  });
  if (ops.length) await prisma.$transaction(ops);
}

/** Marca como pago (só se estava pendente). Retorna true se mudou. Idempotente. */
export async function markOrderPaid(orderId: string): Promise<boolean> {
  const r = await prisma.order.updateMany({
    where: { id: orderId, status: PENDING },
    data: { status: "pago" },
  });
  return r.count > 0;
}

/** Cancela um pedido pendente e devolve o estoque. Idempotente. */
export async function cancelPendingOrder(orderId: string): Promise<boolean> {
  const r = await prisma.order.updateMany({
    where: { id: orderId, status: PENDING },
    data: { status: "cancelado" },
  });
  if (r.count > 0) await restoreStock(orderId);
  return r.count > 0;
}

/** Acha o id do pedido pelo id da cobrança Asaas (fallback do webhook). */
export async function findOrderIdByAsaasPayment(paymentId: string): Promise<string | null> {
  const o = await prisma.order.findFirst({ where: { asaasPaymentId: paymentId }, select: { id: true } });
  return o?.id ?? null;
}

/**
 * Consulta a Asaas e reconcilia o status do pedido (mecanismo do polling em dev).
 * Retorna o status atual, ou null se o pedido não existir.
 */
export async function reconcilePixStatus(orderId: string): Promise<string | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, asaasPaymentId: true },
  });
  if (!order) return null;
  if (order.status === PENDING && order.asaasPaymentId) {
    try {
      const p = await getPayment(order.asaasPaymentId);
      if (isPaidStatus(p.status)) {
        await markOrderPaid(order.id);
        return "pago";
      }
      if (isFailedStatus(p.status)) {
        await cancelPendingOrder(order.id);
        return "cancelado";
      }
    } catch {
      /* erro de rede com a Asaas — mantém o status atual */
    }
  }
  return order.status;
}

/** Dados do Pix de um pedido (para a tela/QR). null se inexistente ou sem Pix. */
export async function getOrderPix(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { pixPayload: true, pixEncodedImage: true, pixExpiresAt: true, status: true },
  });
  if (!order || !order.pixPayload) return null;
  return {
    status: order.status,
    payload: order.pixPayload,
    encodedImage: order.pixEncodedImage ?? "",
    expiresAt: order.pixExpiresAt ? order.pixExpiresAt.toISOString() : null,
  };
}

/* ----------------------- Consultas (Minha conta) ----------------------- */

/** Monta os mapas de slug + avaliados do usuário para um conjunto de pedidos. */
async function buildEnrich(
  userId: string,
  orders: { items: { productId: string }[] }[],
): Promise<OrderEnrich> {
  const ids = [...new Set(orders.flatMap((o) => o.items.map((i) => i.productId)))];
  if (!ids.length) return { slugByProduct: new Map(), reviewed: new Set() };

  const [products, reviews] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, slug: true } }),
    prisma.review.findMany({
      where: { userId, productId: { in: ids } },
      select: { productId: true },
    }),
  ]);
  return {
    slugByProduct: new Map(products.map((p) => [p.id, p.slug])),
    reviewed: new Set(reviews.map((r) => r.productId)),
  };
}

export async function listOrders(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  const enrich = await buildEnrich(userId, orders);
  return orders.map((o) => mapOrder(o, enrich));
}

export async function getOrder(userId: string, id: string) {
  const order = await prisma.order.findFirst({ where: { id, userId }, include: { items: true } });
  if (!order) return null;
  const enrich = await buildEnrich(userId, [order]);
  return mapOrder(order, enrich);
}
