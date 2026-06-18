import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler, Conflict, NotFound } from "../../lib/errors";
import { validate } from "../../middleware/validate";

export const adminCouponsRouter = Router();

const couponSchema = z
  .object({
    code: z.string().min(3).regex(/^[A-Za-z0-9]+$/, "Use apenas letras e números."),
    type: z.enum(["percent", "fixed"]),
    value: z.coerce.number().positive(),
    minSubtotal: z.coerce.number().min(0).nullable().optional(),
    description: z.string().min(3),
    scope: z.enum(["all", "category", "brand", "product"]).default("all"),
    scopeValue: z.string().nullable().optional(),
    maxUses: z.coerce.number().int().positive().nullable().optional(),
    startsAt: z.string().datetime().nullable().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
  })
  .refine((c) => c.scope === "all" || !!c.scopeValue, {
    message: "Selecione a categoria, marca ou produto do cupom.",
    path: ["scopeValue"],
  })
  .refine((c) => !c.startsAt || !c.expiresAt || new Date(c.startsAt) < new Date(c.expiresAt), {
    message: "A data de início deve ser anterior à de expiração.",
    path: ["expiresAt"],
  });

type CouponBody = z.infer<typeof couponSchema>;

/** Mapeia o corpo validado para os dados do Prisma (campos de escopo são normalizados). */
function toData(body: CouponBody) {
  const isAll = body.scope === "all";
  return {
    type: body.type,
    value: body.value,
    minSubtotal: body.minSubtotal ?? null,
    description: body.description,
    scope: body.scope,
    scopeValue: isAll ? null : (body.scopeValue ?? null),
    maxUses: body.maxUses ?? null,
    startsAt: body.startsAt ? new Date(body.startsAt) : null,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
  };
}

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
    const body = req.body as CouponBody;
    const code = body.code.toUpperCase();
    if (await prisma.coupon.findUnique({ where: { code } })) throw Conflict("Cupom já existe.");
    const coupon = await prisma.coupon.create({ data: { code, ...toData(body) } });
    res.status(201).json(coupon);
  }),
);

adminCouponsRouter.put(
  "/:code",
  validate({ body: couponSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as CouponBody;
    const code = req.params.code.toUpperCase();
    if (!(await prisma.coupon.findUnique({ where: { code } }))) throw NotFound("Cupom não encontrado");
    // usedCount é preservado (não vem do form).
    const coupon = await prisma.coupon.update({ where: { code }, data: toData(body) });
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
