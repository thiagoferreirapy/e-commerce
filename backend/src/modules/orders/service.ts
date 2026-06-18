import { prisma } from "../../lib/prisma";
import { BadRequest } from "../../lib/errors";
import { pixPrice, round2 } from "../../lib/format";
import type { PaymentMethod } from "./schema";
import { applyCoupon } from "../coupons/service";
import { quoteShipping } from "../shipping/service";
import { getCartItems, replaceCart, resolveLines, type CartItemInput } from "../cart/service";

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
}

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
  };
}

function loadOrder(id: string) {
  return prisma.order.findUnique({ where: { id }, include: { items: true } });
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

  // Frete a partir do CEP + opção escolhida.
  const quote = quoteShipping(input.address.cep, subtotal);
  const option = quote.options.find((o) => o.id === input.shippingId);
  if (!option) throw BadRequest("Opção de frete inválida.");
  const shipping = option.price;

  const net = round2(subtotal - discount);
  const total =
    input.payment === "pix" ? round2(pixPrice(net) + shipping) : round2(net + shipping);

  const count = await prisma.order.count();

  const created = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        number: orderNumber(count + 1),
        userId: userId ?? null,
        status: "pago",
        subtotal,
        discount,
        shipping,
        total,
        payment: input.payment,
        installments: input.payment === "cartao" ? (input.installments ?? 1) : 1,
        shippingLabel: option.label,
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

    // Baixa de estoque.
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
