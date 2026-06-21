import type { Request, Response } from "express";

export const AUTH_COOKIE = "torque_token";

const isProd = process.env.NODE_ENV === "production";

const cookieAttrs = (secure: boolean) =>
  ({
    httpOnly: true,
    // Cross-site (front e API em domínios diferentes, ex.: ngrok/produção) exige
    // SameSite=None + Secure. No localhost (http) usa Lax.
    sameSite: secure ? ("none" as const) : ("lax" as const),
    secure,
    path: "/",
  }) as const;

/** Define o cookie de sessão httpOnly (mitiga roubo de token por XSS). */
export function setAuthCookie(req: Request, res: Response, token: string) {
  // req.secure reflete o x-forwarded-proto quando "trust proxy" está ligado.
  const secure = req.secure || isProd;
  res.cookie(AUTH_COOKIE, token, {
    ...cookieAttrs(secure),
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
  });
}

export function clearAuthCookie(req: Request, res: Response) {
  res.clearCookie(AUTH_COOKIE, cookieAttrs(req.secure || isProd));
}
