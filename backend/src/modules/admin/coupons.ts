import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler, Conflict, NotFound } from "../../lib/errors";
import { validate } from "../../middleware/validate";

export const adminCouponsRouter = Router();

const couponSchema = z.object({
  code: z.string().min(3).regex(/^[A-Za-z0-9]+$/, "Use apenas letras e números."),
  type: z.enum(["percent", "fixed"]),
  value: z.coerce.number().positive(),
  minSubtotal: z.coerce.number().min(0).nullable().optional(),
  description: z.string().min(3),
});

adminCouponsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await prisma.coupon.findMany({ orderBy: { code: "asc" } }));
  }),
);

adminCouponsRouter.post(
  "/",
  validate({ body: couponSchema }),
  asyncHandler(async (req, res) => {
    const code = req.body.code.toUpperCase();
    if (await prisma.coupon.findUnique({ where: { code } })) throw Conflict("Cupom já existe.");
    const coupon = await prisma.coupon.create({
      data: {
        code,
        type: req.body.type,
        value: req.body.value,
        minSubtotal: req.body.minSubtotal ?? null,
        description: req.body.description,
      },
    });
    res.status(201).json(coupon);
  }),
);

adminCouponsRouter.put(
  "/:code",
  validate({ body: couponSchema.partial() }),
  asyncHandler(async (req, res) => {
    const code = req.params.code.toUpperCase();
    if (!(await prisma.coupon.findUnique({ where: { code } }))) throw NotFound("Cupom não encontrado");
    const data: Record<string, unknown> = {};
    if (req.body.type !== undefined) data.type = req.body.type;
    if (req.body.value !== undefined) data.value = req.body.value;
    if (req.body.minSubtotal !== undefined) data.minSubtotal = req.body.minSubtotal;
    if (req.body.description !== undefined) data.description = req.body.description;
    const coupon = await prisma.coupon.update({ where: { code }, data });
    res.json(coupon);
  }),
);

adminCouponsRouter.delete(
  "/:code",
  asyncHandler(async (req, res) => {
    const code = req.params.code.toUpperCase();
    if (!(await prisma.coupon.findUnique({ where: { code } }))) throw NotFound("Cupom não encontrado");
    await prisma.coupon.delete({ where: { code } });
    res.status(204).end();
  }),
);
