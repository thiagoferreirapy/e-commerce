import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/errors";
import { validate } from "../../middleware/validate";
import { round2 } from "../../lib/format";
import { resolveLines, type CartItemInput } from "../cart/service";
import { applyCoupon, type CouponCartLine } from "./service";

export const couponsRouter = Router();

const applySchema = z.object({
  code: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().nullable().default(null),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, "Carrinho vazio."),
});

/** Resolve itens crus em linhas de cupom (subtotal e categoria/marca da fonte da verdade). */
async function toCouponLines(items: CartItemInput[]): Promise<{
  lines: CouponCartLine[];
  subtotal: number;
}> {
  const resolved = await resolveLines(items);
  const lines = resolved.map((l) => ({
    productId: l.product.id,
    categorySlug: l.product.categorySlug,
    subcategorySlug: l.product.subcategorySlug ?? null,
    brandId: l.product.brandId,
    lineTotal: l.lineTotal,
  }));
  const subtotal = round2(lines.reduce((acc, l) => acc + l.lineTotal, 0));
  return { lines, subtotal };
}

couponsRouter.post(
  "/apply",
  validate({ body: applySchema }),
  asyncHandler(async (req, res) => {
    const { lines, subtotal } = await toCouponLines(req.body.items);
    res.json(await applyCoupon(req.body.code, subtotal, lines));
  }),
);
