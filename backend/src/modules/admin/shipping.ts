import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler, NotFound } from "../../lib/errors";
import { validate } from "../../middleware/validate";

export const adminShippingRouter = Router();

const methodSchema = z.object({
  name: z.string().min(2),
  price: z.coerce.number().min(0),
  etaDays: z.coerce.number().int().min(1),
  freeAbove: z.coerce.number().min(0).nullable().optional(),
  active: z.boolean().default(true),
  position: z.coerce.number().int().min(0).default(0),
});
type MethodBody = z.infer<typeof methodSchema>;

function toData(b: MethodBody) {
  return {
    name: b.name,
    price: b.price,
    etaDays: b.etaDays,
    freeAbove: b.freeAbove ?? null,
    active: b.active,
    position: b.position,
  };
}

adminShippingRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(
      await prisma.shippingMethod.findMany({ orderBy: [{ position: "asc" }, { price: "asc" }] }),
    );
  }),
);

adminShippingRouter.post(
  "/",
  validate({ body: methodSchema }),
  asyncHandler(async (req, res) => {
    const method = await prisma.shippingMethod.create({ data: toData(req.body as MethodBody) });
    res.status(201).json(method);
  }),
);

adminShippingRouter.put(
  "/:id",
  validate({ body: methodSchema }),
  asyncHandler(async (req, res) => {
    if (!(await prisma.shippingMethod.findUnique({ where: { id: req.params.id } }))) {
      throw NotFound("Método de entrega não encontrado");
    }
    const method = await prisma.shippingMethod.update({
      where: { id: req.params.id },
      data: toData(req.body as MethodBody),
    });
    res.json(method);
  }),
);

adminShippingRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    if (!(await prisma.shippingMethod.findUnique({ where: { id: req.params.id } }))) {
      throw NotFound("Método de entrega não encontrado");
    }
    await prisma.shippingMethod.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);
