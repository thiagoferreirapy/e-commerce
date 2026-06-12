import type { ShippingOption } from "@/types";
import { apiFetch } from "@/lib/api";

export const FREE_SHIPPING_THRESHOLD = 299;

export interface ShippingQuote {
  cep: string;
  regionLabel: string;
  options: ShippingOption[];
}

/** Cálculo de frete via API (regras por região + faixa de subtotal). */
export async function calculateShipping(
  cep: string,
  subtotal: number,
): Promise<ShippingQuote> {
  return apiFetch<ShippingQuote>("/shipping/quote", {
    method: "POST",
    body: { cep, subtotal },
  });
}
