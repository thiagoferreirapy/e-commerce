import type { CartItem, ShippingOption } from "@/types";
import { apiFetch } from "@/lib/api";

export interface ShippingQuote {
  cep: string;
  options: ShippingOption[];
}

/**
 * Cálculo de frete via API (métodos cadastrados no admin). Envia os itens para o
 * servidor decidir frete grátis (todos os itens com o selo) — fonte da verdade.
 */
export async function calculateShipping(
  cep: string,
  subtotal: number,
  items?: CartItem[],
): Promise<ShippingQuote> {
  return apiFetch<ShippingQuote>("/shipping/quote", {
    method: "POST",
    body: { cep, subtotal, items },
  });
}
