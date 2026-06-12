import { BadRequest } from "../../lib/errors";

/** Frete mockado por região (1º dígito do CEP) + faixa de subtotal. */
export const FREE_SHIPPING_THRESHOLD = 299;

export interface ShippingOption {
  id: string;
  label: string;
  price: number;
  etaDays: number;
}
export interface ShippingQuote {
  cep: string;
  regionLabel: string;
  options: ShippingOption[];
}

interface Region {
  label: string;
  pacBase: number;
  sedexBase: number;
  etaPac: number;
  etaSedex: number;
}

const REGIONS: Record<string, Region> = {
  "0": { label: "Grande SP", pacBase: 18.9, sedexBase: 29.9, etaPac: 4, etaSedex: 2 },
  "1": { label: "Interior SP", pacBase: 22.9, sedexBase: 34.9, etaPac: 5, etaSedex: 3 },
  "2": { label: "RJ/ES", pacBase: 26.9, sedexBase: 39.9, etaPac: 6, etaSedex: 3 },
  "3": { label: "MG", pacBase: 27.9, sedexBase: 41.9, etaPac: 6, etaSedex: 4 },
  "4": { label: "BA/SE", pacBase: 34.9, sedexBase: 54.9, etaPac: 9, etaSedex: 5 },
  "5": { label: "PE/PB/RN/AL", pacBase: 38.9, sedexBase: 59.9, etaPac: 10, etaSedex: 6 },
  "6": { label: "CE/PI/MA/Norte", pacBase: 42.9, sedexBase: 66.9, etaPac: 12, etaSedex: 7 },
  "7": { label: "DF/GO/TO", pacBase: 29.9, sedexBase: 44.9, etaPac: 7, etaSedex: 4 },
  "8": { label: "PR/SC", pacBase: 25.9, sedexBase: 38.9, etaPac: 6, etaSedex: 3 },
  "9": { label: "RS", pacBase: 31.9, sedexBase: 47.9, etaPac: 8, etaSedex: 4 },
};

function round(n: number) {
  return Math.round(n * 100) / 100;
}

export function isValidCEP(raw: string): boolean {
  return raw.replace(/\D/g, "").length === 8;
}

export function quoteShipping(cep: string, subtotal: number): ShippingQuote {
  if (!isValidCEP(cep)) throw BadRequest("CEP inválido. Informe 8 dígitos.");
  const digits = cep.replace(/\D/g, "");
  const region = REGIONS[digits[0]] ?? REGIONS["1"];
  const surcharge = subtotal > 1500 ? 12 : 0;
  const freeSedex = subtotal >= FREE_SHIPPING_THRESHOLD;

  const options: ShippingOption[] = [
    { id: "pac", label: "PAC", price: round(region.pacBase + surcharge), etaDays: region.etaPac },
    {
      id: "sedex",
      label: "SEDEX",
      price: freeSedex ? 0 : round(region.sedexBase + surcharge),
      etaDays: region.etaSedex,
    },
    {
      id: "expressa",
      label: "Entrega Expressa",
      price: round(region.sedexBase * 1.6 + surcharge),
      etaDays: Math.max(1, region.etaSedex - 1),
    },
  ];
  return { cep, regionLabel: region.label, options };
}
