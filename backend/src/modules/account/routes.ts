import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler, NotFound } from "../../lib/errors";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth";
import { toAddressDTO, toUserDTO, userInclude } from "./mapper";

export const accountRouter = Router();
accountRouter.use(requireAuth);

/* ---- Perfil ---- */
accountRouter.get(
  "/profile",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.id },
      include: userInclude,
    });
    res.json(toUserDTO(user));
  }),
);

const profileSchema = z.object({
  name: z.string().min(3).optional(),
  cpf: z.string().optional(),
  phone: z.string().optional(),
});

accountRouter.put(
  "/profile",
  validate({ body: profileSchema }),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: req.body,
      include: userInclude,
    });
    res.json(toUserDTO(user));
  }),
);

/* ---- Endereços ---- */
const addressSchema = z.object({
  label: z.string().min(1),
  recipient: z.string().min(1),
  cep: z.string().min(8),
  street: z.string().min(1),
  number: z.string().min(1),
  complement: z.string().optional(),
  district: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(2),
  isDefault: z.boolean().optional(),
});

accountRouter.get(
  "/addresses",
  asyncHandler(async (req, res) => {
    const list = await prisma.address.findMany({
      where: { userId: req.user!.id },
      orderBy: { isDefault: "desc" },
    });
    res.json(list.map(toAddressDTO));
  }),
);

accountRouter.post(
  "/addresses",
  validate({ body: addressSchema }),
  asyncHandler(async (req, res) => {
    // Se marcado como padrão, desmarca os demais.
    if (req.body.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user!.id },
        data: { isDefault: false },
      });
    }
    const addr = await prisma.address.create({
      data: { ...req.body, userId: req.user!.id },
    });
    res.status(201).json(toAddressDTO(addr));
  }),
);

accountRouter.put(
  "/addresses/:id",
  validate({ body: addressSchema.partial() }),
  asyncHandler(async (req, res) => {
    const existing = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!existing) throw NotFound("Endereço não encontrado");
    if (req.body.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user!.id },
        data: { isDefault: false },
      });
    }
    const addr = await prisma.address.update({ where: { id: req.params.id }, data: req.body });
    res.json(toAddressDTO(addr));
  }),
);

accountRouter.delete(
  "/addresses/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!existing) throw NotFound("Endereço não encontrado");
    await prisma.address.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);
