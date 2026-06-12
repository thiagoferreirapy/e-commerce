import type { Coupon } from "@/types";
import { round2 } from "@/lib/format";

/** Desconto (sync) de um cupom já validado, para um subtotal qualquer. */
export function couponDiscount(coupon: Coupon, subtotal: number): number {
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) return 0;
  const value =
    coupon.type === "percent"
      ? subtotal * (coupon.value / 100)
      : Math.min(coupon.value, subtotal);
  return round2(value);
}
