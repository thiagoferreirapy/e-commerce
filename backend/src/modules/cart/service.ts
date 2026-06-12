import { prisma } from "../../lib/prisma";
import { round2 } from "../../lib/format";
import type { ProductDTO, ProductVariantDTO } from "../../types";
import { productInclude, toProductDTO } from "../products/mapper";

export interface CartItemInput {
  productId: string;
  variantId: string | null;
  quantity: number;
}

export interface ResolvedCartLine {
  key: string;
  product: ProductDTO;
  variant: ProductVariantDTO | null;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  available: number;
  image: string;
}

function variantLabel(product: ProductDTO, variant: ProductVariantDTO | null): string {
  if (!variant) return "";
  return product.variantAxes
    .map((axis) => axis.options.find((o) => o.value === variant.options[axis.axis])?.label)
    .filter(Boolean)
    .join(" · ");
}

/** Resolve itens crus em linhas com produto/preço/estoque (público — serve o visitante). */
export async function resolveLines(items: CartItemInput[]): Promise<ResolvedCartLine[]> {
  const ids = [...new Set(items.map((i) => i.productId))];
  if (!ids.length) return [];
  const rows = await prisma.product.findMany({ where: { id: { in: ids } }, include: productInclude });
  const byId = new Map(rows.map((r) => [r.id, toProductDTO(r)]));

  const lines: ResolvedCartLine[] = [];
  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) continue;
    const variant = item.variantId
      ? product.variants.find((v) => v.id === item.variantId) ?? null
      : null;
    const image = variant?.imageUrl ?? product.images[0];
    const available = variant ? variant.stock : product.totalStock;
    lines.push({
      key: `${item.productId}:${item.variantId ?? "_"}`,
      product,
      variant,
      variantLabel: variantLabel(product, variant),
      quantity: item.quantity,
      unitPrice: product.price,
      lineTotal: round2(product.price * item.quantity),
      available,
      image,
    });
  }
  return lines;
}

/* ---- Carrinho persistido (por usuário) ----
   Em SQLite, NULLs são distintos em índices únicos; para o índice composto
   (userId, productId, variantId) funcionar, normalizamos "sem variante" para "". */
const norm = (v: string | null) => v ?? "";
const denorm = (v: string | null) => (v ? v : null);

export async function getCartItems(userId: string): Promise<CartItemInput[]> {
  const rows = await prisma.cartItem.findMany({ where: { userId } });
  return rows.map((r) => ({
    productId: r.productId,
    variantId: denorm(r.variantId),
    quantity: r.quantity,
  }));
}

/** Substitui todo o carrinho do usuário pelos itens informados. */
export async function replaceCart(userId: string, items: CartItemInput[]): Promise<void> {
  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { userId } }),
    ...items
      .filter((i) => i.quantity > 0)
      .map((i) =>
        prisma.cartItem.create({
          data: { userId, productId: i.productId, variantId: norm(i.variantId), quantity: i.quantity },
        }),
      ),
  ]);
}

export async function upsertItem(userId: string, item: CartItemInput): Promise<void> {
  await prisma.cartItem.upsert({
    where: {
      userId_productId_variantId: {
        userId,
        productId: item.productId,
        variantId: norm(item.variantId),
      },
    },
    update: { quantity: item.quantity },
    create: {
      userId,
      productId: item.productId,
      variantId: norm(item.variantId),
      quantity: item.quantity,
    },
  });
}

export async function setQuantity(userId: string, item: CartItemInput): Promise<void> {
  if (item.quantity <= 0) {
    await removeItem(userId, item.productId, item.variantId);
    return;
  }
  await upsertItem(userId, item);
}

export async function removeItem(
  userId: string,
  productId: string,
  variantId: string | null,
): Promise<void> {
  await prisma.cartItem.deleteMany({ where: { userId, productId, variantId: norm(variantId) } });
}

/** Mescla os itens do visitante no carrinho do usuário (soma quantidades). */
export async function mergeCart(userId: string, items: CartItemInput[]): Promise<CartItemInput[]> {
  for (const i of items.filter((x) => x.quantity > 0)) {
    const existing = await prisma.cartItem.findUnique({
      where: {
        userId_productId_variantId: { userId, productId: i.productId, variantId: norm(i.variantId) },
      },
    });
    await upsertItem(userId, {
      ...i,
      quantity: (existing?.quantity ?? 0) + i.quantity,
    });
  }
  return getCartItems(userId);
}
