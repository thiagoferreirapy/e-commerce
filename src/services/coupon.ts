import type { Coupon } from "@/types";
import { apiFetch } from "@/lib/api";

export interface CouponResult {
  coupon: Coupon;
  discount: number;
}

/** Valida e calcula o desconto de um cupom (via API). */
export async function applyCoupon(code: string, subtotal: number): Promise<CouponResult> {
  return apiFetch<CouponResult>("/coupons/apply", {
    method: "POST",
    body: { code, subtotal },
  });
}
