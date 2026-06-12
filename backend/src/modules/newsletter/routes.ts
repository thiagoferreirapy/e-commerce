import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler, BadRequest } from "../../lib/errors";
import { validate } from "../../middleware/validate";

export const newsletterRouter = Router();

const subscribeSchema = z.object({ email: z.string().email("Digite um e-mail válido.") });

newsletterRouter.post(
  "/",
  validate({ body: subscribeSchema }),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw BadRequest("Digite um e-mail válido.");
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: {},
      create: { email },
    });
    res.json({ ok: true });
  }),
);
