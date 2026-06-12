import { Router } from "express";
import { requireAdmin } from "../../middleware/auth";
import { adminProductsRouter } from "./products";
import { adminOrdersRouter } from "./orders";
import { adminCouponsRouter } from "./coupons";
import { adminStatsRouter } from "./stats";
import { adminUploadsRouter } from "./uploads";

export const adminRouter = Router();

// Tudo aqui exige papel admin.
adminRouter.use(requireAdmin);

adminRouter.use("/stats", adminStatsRouter);
adminRouter.use("/products", adminProductsRouter);
adminRouter.use("/orders", adminOrdersRouter);
adminRouter.use("/coupons", adminCouponsRouter);
adminRouter.use("/uploads", adminUploadsRouter);
