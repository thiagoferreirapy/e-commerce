import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/jwt";
import { Forbidden, Unauthorized } from "../lib/errors";
import { AUTH_COOKIE } from "../lib/cookies";
import { prisma } from "../lib/prisma";

/** Usuário autenticado anexado à requisição. */
export interface AuthUser {
  id: string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function extractToken(req: Request): string | null {
  // 1) Cookie httpOnly (preferencial). 2) Header Authorization (fallback/API).
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.[AUTH_COOKIE];
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return null;
}

/** Exige autenticação; popula req.user ou lança 401. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return next(Unauthorized());
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(Unauthorized("Sessão inválida ou expirada"));
  }
}

/** Exige usuário autenticado E com papel admin. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  requireAuth(req, _res, async (err?: unknown) => {
    if (err) return next(err);
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { role: true },
      });
      if (user?.role !== "admin") return next(Forbidden("Acesso restrito a administradores."));
      next();
    } catch (e) {
      next(e);
    }
  });
}

/** Popula req.user se houver token válido, mas não bloqueia. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    try {
      const payload = verifyToken(token);
      req.user = { id: payload.sub, email: payload.email };
    } catch {
      /* token inválido é ignorado em rotas opcionais */
    }
  }
  next();
}
