import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/errors";

export const brandsRouter = Router();

brandsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });
    res.json(brands);
  }),
);
