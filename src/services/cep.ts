import { apiFetch } from "@/lib/api";

export interface CepLookup {
  cep: string;
  street: string;
  district: string;
  city: string;
  state: string;
}

/** Busca de endereço por CEP (via API). */
export async function lookupCEP(cep: string): Promise<CepLookup> {
  const digits = cep.replace(/\D/g, "");
  return apiFetch<CepLookup>(`/cep/${digits}`);
}
