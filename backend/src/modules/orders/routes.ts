import { Router } from "express";
import { asyncHandler, BadRequest, NotFound } from "../../lib/errors";
import { validate } from "../../middleware/validate";
import { optionalAuth, requireAuth } from "../../middleware/auth";
import { createOrderSchema } from "./schema";
import * as service from "./service";

export const ordersRouter = Router();

// Status do pagamento (público pelo id — cuid não-adivinhável). Reconcilia com a Asaas
// (mecanismo do polling em dev) e devolve só o status.
ordersRouter.get(
  "/:id/payment-status",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const status = await service.reconcilePixStatus(req.params.id);
    if (status === null) throw NotFound("Pedido não encontrado");
    res.json({ status });
  }),
);

// QR/copia-e-cola do Pix de um pedido (para a tela de pagamento / rever depois).
ordersRouter.get(
  "/:id/pix",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const pix = await service.getOrderPix(req.params.id);
    if (!pix) throw BadRequest("Pix indisponível para este pedido.");
    res.json(pix);
  }),
);

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
