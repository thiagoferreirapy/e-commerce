import { Router } from "express";
import { asyncHandler, NotFound } from "../../lib/errors";
import { validate } from "../../middleware/validate";
import { optionalAuth, requireAuth } from "../../middleware/auth";
import { createOrderSchema } from "./schema";
import * as service from "./service";

export const ordersRouter = Router();

// Criação aceita visitante (optionalAuth) — totais recalculados no servidor.
ordersRouter.post(
  "/",
  optionalAuth,
  validate({ body: createOrderSchema }),
  asyncHandler(async (req, res) => {
    const result = await service.createOrder(req.body, req.user?.id);
    res.status(201).json(result);
  }),
);

ordersRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await service.listOrders(req.user!.id));
  }),
);

ordersRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const order = await service.getOrder(req.user!.id, req.params.id);
    if (!order) throw NotFound("Pedido não encontrado");
    res.json(order);
  }),
);
