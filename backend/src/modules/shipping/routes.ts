import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/errors";
import { validate } from "../../middleware/validate";
import { resolveLines } from "../cart/service";
import { quoteShipping } from "./service";

export const shippingRouter = Router();

const quoteSchema = z.object({
  cep: z.string(),
  subtotal: z.number().nonnegative(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().nullable().default(null),
        quantity: z.number().int().positive(),
      }),
    )
    .optional(),
});

shippingRouter.post(
  "/quote",
  validate({ body: quoteSchema }),
  asyncHandler(async (req, res) => {
    // Frete grátis do pedido = todos os itens têm o selo (fonte da verdade: servidor).
    let freeShipping = false;
    if (req.body.items?.length) {
      const lines = await resolveLines(req.body.items);
      freeShipping = lines.length > 0 && lines.every((l) => l.product.freeShipping);
    }
    res.json(await quoteShipping({ cep: req.body.cep, subtotal: req.body.subtotal, freeShipping }));
  }),
);
