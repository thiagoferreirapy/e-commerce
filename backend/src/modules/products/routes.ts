import { Router } from "express";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth";
import { byIdsQuerySchema, productQuerySchema, reviewSchema } from "./schema";
import * as ctrl from "./controller";

export const productsRouter = Router();

productsRouter.get("/", validate({ query: productQuerySchema }), ctrl.list);
productsRouter.get("/by-ids", validate({ query: byIdsQuerySchema }), ctrl.byIds);
productsRouter.get("/:slug/related", ctrl.related);
// Avaliar exige login + ter comprado o produto (verificado no service).
productsRouter.post("/:slug/reviews", requireAuth, validate({ body: reviewSchema }), ctrl.addReview);
productsRouter.get("/:slug", ctrl.bySlug);
