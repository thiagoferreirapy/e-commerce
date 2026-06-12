import { apiFetch } from "@/lib/api";

/** Captura de e-mail da newsletter (via API). */
export async function subscribeNewsletter(email: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>("/newsletter", { method: "POST", body: { email } });
}
