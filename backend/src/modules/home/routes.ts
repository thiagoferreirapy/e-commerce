import { Router } from "express";
import { home } from "../products/controller";

export const homeRouter = Router();

// Vitrines da home em uma única chamada.
homeRouter.get("/", home);
