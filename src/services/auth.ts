import { apiFetch } from "@/lib/api";

/** Encerra a sessão no servidor (limpa o cookie httpOnly). */
export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" });
}

/** Solicita recuperação de senha. Em dev a API devolve um token de teste. */
export async function forgotPassword(email: string): Promise<{ ok: true; devToken?: string }> {
  return apiFetch("/auth/forgot-password", { method: "POST", body: { email } });
}

/** Redefine a senha a partir do token recebido. */
export async function resetPassword(token: string, password: string): Promise<{ ok: true }> {
  return apiFetch("/auth/reset-password", { method: "POST", body: { token, password } });
}
