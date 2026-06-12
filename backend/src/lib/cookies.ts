import type { Response } from "express";

export const AUTH_COOKIE = "torque_token";

const isProd = process.env.NODE_ENV === "production";

/** Define o cookie de sessão httpOnly (mitiga roubo de token por XSS). */
export function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd, // em produção (HTTPS) exige conexão segura
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    path: "/",
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE, { path: "/" });
}
