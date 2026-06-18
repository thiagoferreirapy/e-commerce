import type { Coupon } from "@/types";
import type { ResolvedCartLine } from "@/lib/cart";
import { round2 } from "@/lib/format";

/** Uma linha do carrinho é elegível ao cupom conforme o escopo. */
export function lineMatchesCoupon(coupon: Coupon, line: ResolvedCartLine): boolean {
  switch (coupon.scope) {
    case "category":
      return (
        line.product.categorySlug === coupon.scopeValue ||
        line.product.subcategorySlug === coupon.scopeValue
      );
    case "brand":
      return line.product.brandId === coupon.scopeValue;
    case "product":
      return line.product.id === coupon.scopeValue;
    default:
      return true; // all
  }
}

/** Soma dos itens elegíveis (base do desconto). */
function eligibleSubtotal(coupon: Coupon, lines: ResolvedCartLine[]): number {
  return round2(
    lines.filter((l) => lineMatchesCoupon(coupon, l)).reduce((acc, l) => acc + l.lineTotal, 0),
  );
}

/**
 * Desconto (sync) de um cupom já validado, dado o carrinho resolvido.
 * Incide somente sobre os itens elegíveis ao escopo do cupom.
 */
export function couponDiscount(coupon: Coupon, lines: ResolvedCartLine[]): number {
  const fullSubtotal = round2(lines.reduce((acc, l) => acc + l.lineTotal, 0));
  if (coupon.minSubtotal && fullSubtotal < coupon.minSubtotal) return 0;
  const base = eligibleSubtotal(coupon, lines);
  if (base <= 0) return 0;
  const value = coupon.type === "percent" ? base * (coupon.value / 100) : Math.min(coupon.value, base);
  return round2(value);
}
