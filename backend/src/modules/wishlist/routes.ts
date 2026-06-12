import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/errors";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth";

export const wishlistRouter = Router();
wishlistRouter.use(requireAuth);

async function ids(userId: string): Promise<string[]> {
  const rows = await prisma.wishlistItem.findMany({ where: { userId }, select: { productId: true } });
  return rows.map((r) => r.productId);
}

wishlistRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json({ ids: await ids(req.user!.id) });
  }),
);

wishlistRouter.post(
  "/:productId",
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId, productId: req.params.productId } },
      update: {},
      create: { userId, productId: req.params.productId },
    });
    res.json({ ids: await ids(userId) });
  }),
);

wishlistRouter.delete(
  "/:productId",
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    await prisma.wishlistItem.deleteMany({ where: { userId, productId: req.params.productId } });
    res.json({ ids: await ids(userId) });
  }),
);

const mergeSchema = z.object({ ids: z.array(z.string()) });

wishlistRouter.post(
  "/merge",
  validate({ body: mergeSchema }),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    for (const productId of req.body.ids) {
      await prisma.wishlistItem.upsert({
        where: { userId_productId: { userId, productId } },
        update: {},
        create: { userId, productId },
      });
    }
    res.json({ ids: await ids(userId) });
  }),
);
