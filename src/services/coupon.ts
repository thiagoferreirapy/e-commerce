import type { CartItem, Coupon } from "@/types";
import { apiFetch } from "@/lib/api";

export interface CouponResult {
  coupon: Coupon;
  discount: number;
}

/**
 * Valida e calcula o desconto de um cupom (via API). Envia os itens do carrinho
 * para o servidor resolver subtotal, escopo e elegibilidade (fonte da verdade).
 */
export async function applyCoupon(code: string, items: CartItem[]): Promise<CouponResult> {
  return apiFetch<CouponResult>("/coupons/apply", {
    method: "POST",
    body: { code, items },
  });
}
