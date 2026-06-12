import rateLimit from "express-rate-limit";

/** Limite para endpoints sensíveis de autenticação (anti brute-force). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20, // 20 tentativas por IP por janela
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Muitas tentativas. Tente novamente em alguns minutos." } },
});
