import type { Request, Response } from "express";
import { asyncHandler, NotFound } from "../../lib/errors";
import { getQuery } from "../../middleware/validate";
import type { ProductTag } from "../../types";
import type { ProductQueryInput } from "./schema";
import * as service from "./service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = getQuery<ProductQueryInput>(req);
  res.json(await service.listProducts(query));
});

export const byIds = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = getQuery<{ ids: string[] }>(req);
  res.json(await service.getProductsByIds(ids));
});

export const bySlug = asyncHandler(async (req: Request, res: Response) => {
  const product = await service.getProductBySlug(req.params.slug);
  if (!product) throw NotFound("Produto não encontrado");
  res.json(product);
});

export const related = asyncHandler(async (req: Request, res: Response) => {
  res.json(await service.getRelatedProducts(req.params.slug));
});

export const addReview = asyncHandler(async (req: Request, res: Response) => {
  const product = await service.addReview(req.params.slug, req.user!.id, {
    rating: req.body.rating,
    title: req.body.title,
    comment: req.body.comment,
  });
  res.status(201).json(product);
});

export const home = asyncHandler(async (_req: Request, res: Response) => {
  const [ofertas, maisVendidos, novidades, descontos] = await Promise.all([
    service.getByTag("oferta-do-dia" as ProductTag, 10),
    service.getBestSellers(10),
    service.getNewArrivals(10),
    service.getBiggestDiscounts(10),
  ]);
  res.json({ ofertas, maisVendidos, novidades, descontos });
});
