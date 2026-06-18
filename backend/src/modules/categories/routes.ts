import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/errors";
import type { CategoryDTO } from "../../types";

export const categoriesRouter = Router();

categoriesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const cats = await prisma.category.findMany({
      orderBy: [{ featured: "desc" }, { position: "asc" }, { name: "asc" }],
    });
    const dto: CategoryDTO[] = cats.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentSlug: c.parentSlug ?? undefined,
      imageUrl: c.imageUrl,
      description: c.description ?? undefined,
      featured: c.featured,
      position: c.position,
    }));
    res.json(dto);
  }),
);
