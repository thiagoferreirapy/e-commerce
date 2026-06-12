import type { NextFunction, Request, Response } from "express";

/** Erro de aplicação com status HTTP. */
export class AppError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const NotFound = (msg = "Recurso não encontrado") => new AppError(404, msg);
export const BadRequest = (msg: string, details?: unknown) => new AppError(400, msg, details);
export const Unauthorized = (msg = "Não autenticado") => new AppError(401, msg);
export const Forbidden = (msg = "Acesso negado") => new AppError(403, msg);
export const Conflict = (msg: string) => new AppError(409, msg);

/** Envolve handlers async para encaminhar erros ao middleware central. */
export function asyncHandler<
  Req extends Request = Request,
  Res extends Response = Response,
>(fn: (req: Req, res: Res, next: NextFunction) => Promise<unknown>) {
  return (req: Req, res: Res, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
