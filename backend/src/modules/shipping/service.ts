import { prisma } from "../../lib/prisma";
import { BadRequest } from "../../lib/errors";

export interface ShippingOption {
  id: string;
  label: string;
  price: number;
  etaDays: number;
}
export interface ShippingQuote {
  cep: string;
  options: ShippingOption[];
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

export function isValidCEP(raw: string): boolean {
  return raw.replace(/\D/g, "").length === 8;
}

export interface QuoteInput {
  cep: string;
  subtotal: number;
  /** true quando TODOS os itens do carrinho têm frete grátis. */
  freeShipping?: boolean;
}

/**
 * Cotação de frete a partir dos métodos cadastrados (admin). O frete é zerado
 * quando o pedido é frete grátis (todos os itens) ou o subtotal atinge o
 * "freeAbove" do método.
 */
export async function quoteShipping({ cep, subtotal, freeShipping }: QuoteInput): Promise<ShippingQuote> {
  if (!isValidCEP(cep)) throw BadRequest("CEP inválido. Informe 8 dígitos.");
  const methods = await prisma.shippingMethod.findMany({
    where: { active: true },
    orderBy: [{ position: "asc" }, { price: "asc" }],
  });
  const options: ShippingOption[] = methods.map((m) => {
    const free = !!freeShipping || (m.freeAbove != null && subtotal >= m.freeAbove);
    return { id: m.id, label: m.name, price: free ? 0 : round(m.price), etaDays: m.etaDays };
  });
  return { cep, options };
}
