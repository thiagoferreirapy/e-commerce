import { z } from "zod";

// Carrega o .env (Node 20.6+). Sem dependência externa. Em produção sem arquivo,
// ignora e usa as variáveis do ambiente / defaults.
try {
  process.loadEnvFile();
} catch {
  /* sem arquivo .env — segue com process.env / defaults */
}

/** Lê e valida as variáveis de ambiente uma única vez na inicialização. */
const schema = z.object({
  DATABASE_URL: z.string().default("file:./dev.db"),
  PORT: z.coerce.number().default(3001),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  JWT_SECRET: z.string().min(8).default("dev-secret-torque-change-me"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  // URL pública da API — usada para montar a URL absoluta das imagens enviadas.
  PUBLIC_URL: z.string().default("http://localhost:3001"),
  // Asaas (Pix). Sem a chave, o Pix falha com erro claro (resto da API funciona).
  API_KEY_ASAAS: z.string().default(""),
  ASAAS_BASE_URL: z.string().default("https://sandbox.asaas.com/api/v3"),
  // Token que você define no painel Asaas para validar os webhooks recebidos.
  ASAAS_WEBHOOK_TOKEN: z.string().default(""),
});

export const env = schema.parse(process.env);
