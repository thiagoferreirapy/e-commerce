import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodTypeAny } from "zod";
import { BadRequest } from "../lib/errors";

interface Schemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Valida body/query/params com Zod. Em sucesso, substitui os valores pelos
 * dados parseados (com coerção/transform aplicados).
 */
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) {
        // req.query é somente-leitura em alguns setups; reatribui de forma segura.
        const parsed = schemas.query.parse(req.query);
        Object.defineProperty(req, "validatedQuery", { value: parsed, configurable: true });
      }
      if (schemas.params) req.params = schemas.params.parse(req.params);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(BadRequest("Dados inválidos", err.flatten()));
      } else {
        next(err);
      }
    }
  };
}

/** Recupera a query validada (definida por validate()). */
export function getQuery<T>(req: Request): T {
  return (req as unknown as { validatedQuery: T }).validatedQuery;
}
