import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { asyncHandler, BadRequest, Conflict, Unauthorized } from "../../lib/errors";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth";
import { authLimiter } from "../../middleware/rateLimit";
import { signToken } from "../../lib/jwt";
import { setAuthCookie, clearAuthCookie } from "../../lib/cookies";
import { toUserDTO, userInclude } from "../account/mapper";

export const authRouter = Router();

const strongPassword = z
  .string()
  .min(8, "A senha deve ter ao menos 8 caracteres.")
  .regex(/[0-9]/, "A senha deve conter ao menos um número.");

const registerSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: strongPassword,
});
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
const forgotSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({ token: z.string().min(10), password: strongPassword });

authRouter.post(
  "/register",
  authLimiter,
  validate({ body: registerSchema }),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw Conflict("Já existe uma conta com este e-mail.");
    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const user = await prisma.user.create({
      data: { name: req.body.name, email, passwordHash },
      include: userInclude,
    });
    const token = signToken({ sub: user.id, email: user.email });
    setAuthCookie(req, res, token);
    res.status(201).json({ user: toUserDTO(user), token });
  }),
);

authRouter.post(
  "/login",
  authLimiter,
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email }, include: userInclude });
    if (!user) throw Unauthorized("E-mail ou senha incorretos.");
    const ok = await bcrypt.compare(req.body.password, user.passwordHash);
    if (!ok) throw Unauthorized("E-mail ou senha incorretos.");
    const token = signToken({ sub: user.id, email: user.email });
    setAuthCookie(req, res, token);
    res.json({ user: toUserDTO(user), token });
  }),
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    clearAuthCookie(req, res);
    res.json({ ok: true });
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: userInclude,
    });
    if (!user) throw Unauthorized();
    res.json(toUserDTO(user));
  }),
);

/* ---- Recuperação de senha ---- */
authRouter.post(
  "/forgot-password",
  authLimiter,
  validate({ body: forgotSchema }),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    // Resposta neutra (não revela se o e-mail existe).
    const response: { ok: true; devToken?: string } = { ok: true };

    if (user) {
      const token = randomUUID() + randomUUID().replace(/-/g, "");
      await prisma.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
      });
      // Em produção, enviaríamos por e-mail. Em dev, devolvemos o token para teste.
      if (process.env.NODE_ENV !== "production") response.devToken = token;
    }
    res.json(response);
  }),
);

authRouter.post(
  "/reset-password",
  authLimiter,
  validate({ body: resetSchema }),
  asyncHandler(async (req, res) => {
    const record = await prisma.passwordResetToken.findUnique({ where: { token: req.body.token } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw BadRequest("Link de recuperação inválido ou expirado.");
    }
    const passwordHash = await bcrypt.hash(req.body.password, 10);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);
    res.json({ ok: true });
  }),
);
