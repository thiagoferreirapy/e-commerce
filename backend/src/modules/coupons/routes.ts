import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/errors";
import { validate } from "../../middleware/validate";
import { applyCoupon } from "./service";

export const couponsRouter = Router();

const applySchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().nonnegative(),
});

couponsRouter.post(
  "/apply",
  validate({ body: applySchema }),
  asyncHandler(async (req, res) => {
    res.json(await applyCoupon(req.body.code, req.body.subtotal));
  }),
);
