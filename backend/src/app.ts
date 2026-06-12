import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./env";
import { errorHandler, notFoundHandler } from "./middleware/error";

import { productsRouter } from "./modules/products/routes";
import { categoriesRouter } from "./modules/categories/routes";
import { brandsRouter } from "./modules/brands/routes";
import { homeRouter } from "./modules/home/routes";
import { shippingRouter } from "./modules/shipping/routes";
import { couponsRouter } from "./modules/coupons/routes";
import { cepRouter } from "./modules/cep/routes";
import { newsletterRouter } from "./modules/newsletter/routes";
import { authRouter } from "./modules/auth/routes";
import { accountRouter } from "./modules/account/routes";
import { ordersRouter } from "./modules/orders/routes";
import { cartRouter } from "./modules/cart/routes";
import { wishlistRouter } from "./modules/wishlist/routes";
import { adminRouter } from "./modules/admin/routes";
import { UPLOADS_DIR } from "./modules/admin/uploads";

export function createApp() {
  const app = express();

  // CORS com suporte a credenciais (cookies). Com credenciais não se pode usar
  // "*" literal — então refletimos a origem permitida.
  const allowed = env.CORS_ORIGIN.split(",").map((s) => s.trim());
  const allowAll = allowed.includes("*");
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || allowAll || allowed.includes(origin)) return cb(null, true);
        return cb(new Error("Origem não permitida pelo CORS"));
      },
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json());

  // Arquivos enviados (imagens de produto) servidos estaticamente.
  app.use("/uploads", express.static(UPLOADS_DIR));

  app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "torque-api" }));

  app.use("/api/products", productsRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/brands", brandsRouter);
  app.use("/api/home", homeRouter);
  app.use("/api/shipping", shippingRouter);
  app.use("/api/coupons", couponsRouter);
  app.use("/api/cep", cepRouter);
  app.use("/api/newsletter", newsletterRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/account", accountRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/cart", cartRouter);
  app.use("/api/wishlist", wishlistRouter);
  app.use("/api/admin", adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
