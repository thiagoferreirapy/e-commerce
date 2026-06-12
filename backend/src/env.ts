import { z } from "zod";

/** Lê e valida as variáveis de ambiente uma única vez na inicialização. */
const schema = z.object({
  DATABASE_URL: z.string().default("file:./dev.db"),
  PORT: z.coerce.number().default(3001),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  JWT_SECRET: z.string().min(8).default("dev-secret-torque-change-me"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  // URL pública da API — usada para montar a URL absoluta das imagens enviadas.
  PUBLIC_URL: z.string().default("http://localhost:3001"),
});

export const env = schema.parse(process.env);
