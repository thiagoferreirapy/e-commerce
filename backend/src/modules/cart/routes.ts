import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/errors";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth";
import * as service from "./service";

export const cartRouter = Router();

const itemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().nullable().default(null),
  quantity: z.number().int(),
});
const itemsSchema = z.object({ items: z.array(itemSchema) });
const removeSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().nullable().default(null),
});

/** Público: resolve itens do visitante em linhas com preço/estoque. */
cartRouter.post(
  "/resolve",
  validate({ body: itemsSchema }),
  asyncHandler(async (req, res) => {
    res.json(await service.resolveLines(req.body.items));
  }),
);

// As rotas abaixo exigem login.
cartRouter.use(requireAuth);

cartRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const items = await service.getCartItems(req.user!.id);
    res.json({ items, lines: await service.resolveLines(items) });
  }),
);

cartRouter.put(
  "/",
  validate({ body: itemsSchema }),
  asyncHandler(async (req, res) => {
    await service.replaceCart(req.user!.id, req.body.items);
    const items = await service.getCartItems(req.user!.id);
    res.json({ items, lines: await service.resolveLines(items) });
  }),
);

cartRouter.post(
  "/items",
  validate({ body: itemSchema }),
  asyncHandler(async (req, res) => {
    await service.setQuantity(req.user!.id, req.body);
    res.json({ items: await service.getCartItems(req.user!.id) });
  }),
);

cartRouter.patch(
  "/items",
  validate({ body: itemSchema }),
  asyncHandler(async (req, res) => {
    await service.setQuantity(req.user!.id, req.body);
    res.json({ items: await service.getCartItems(req.user!.id) });
  }),
);

cartRouter.delete(
  "/items",
  validate({ body: removeSchema }),
  asyncHandler(async (req, res) => {
    await service.removeItem(req.user!.id, req.body.productId, req.body.variantId);
    res.json({ items: await service.getCartItems(req.user!.id) });
  }),
);

cartRouter.post(
  "/merge",
  validate({ body: itemsSchema }),
  asyncHandler(async (req, res) => {
    const items = await service.mergeCart(req.user!.id, req.body.items);
    res.json({ items, lines: await service.resolveLines(items) });
  }),
);
