import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/errors";
import { validate } from "../../middleware/validate";
import { quoteShipping } from "./service";

export const shippingRouter = Router();

const quoteSchema = z.object({
  cep: z.string(),
  subtotal: z.number().nonnegative(),
});

shippingRouter.post(
  "/quote",
  validate({ body: quoteSchema }),
  asyncHandler(async (req, res) => {
    res.json(quoteShipping(req.body.cep, req.body.subtotal));
  }),
);
