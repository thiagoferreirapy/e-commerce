import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors";

/** 404 para rotas não encontradas. */
export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { message: "Rota não encontrada" } });
}

/** Handler central de erros — formato consistente { error: { message, details } }. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // next é obrigatório para o Express reconhecer como error handler
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { message: err.message, details: err.details } });
    return;
  }
  console.error("[unhandled]", err);
  res.status(500).json({ error: { message: "Erro interno do servidor" } });
}
