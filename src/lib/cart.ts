import type { CartItem, Product, ProductVariant } from "@/types";
import { pixPrice, round2 } from "@/lib/format";

export interface ResolvedCartLine {
  key: string;
  product: Product;
  variant: ProductVariant | null;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  available: number;
  image: string;
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  pixTotal: number;
}

function variantLabelFor(product: Product, variant: ProductVariant | null): string {
  if (!variant) return "";
  return product.variantAxes
    .map((axis) => {
      const val = variant.options[axis.axis];
      const opt = axis.options.find((o) => o.value === val);
      return opt?.label;
    })
    .filter(Boolean)
    .join(" · ");
}

/**
 * Resolve os itens crus do carrinho em linhas. Recebe um mapa de produtos
 * (carregado da API por id) — sem dependência da camada de dados local.
 */
export function resolveCartLines(
  items: CartItem[],
  productsById: Map<string, Product>,
): ResolvedCartLine[] {
  const lines: ResolvedCartLine[] = [];
  for (const item of items) {
    const product = productsById.get(item.productId);
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
      variantLabel: variantLabelFor(product, variant),
      quantity: item.quantity,
      unitPrice: product.price,
      lineTotal: round2(product.price * item.quantity),
      available,
      image,
    });
  }
  return lines;
}

export function cartTotals(lines: ResolvedCartLine[]): CartTotals {
  const subtotal = round2(lines.reduce((acc, l) => acc + l.lineTotal, 0));
  return {
    itemCount: lines.reduce((acc, l) => acc + l.quantity, 0),
    subtotal,
    pixTotal: pixPrice(subtotal),
  };
}
