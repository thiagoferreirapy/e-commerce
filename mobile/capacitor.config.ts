import type { CapacitorConfig } from "@capacitor/cli";

/**
 * App nativo (Android/iOS) como "shell" do site Next (SSR).
 *
 * Defina a URL do site rodando antes de `npx cap sync`:
 *   - Dev na rede local:  CAP_SERVER_URL=http://192.168.0.10:3000
 *   - Produção (deploy):  CAP_SERVER_URL=https://loja.seudominio.com
 *
 * Sem CAP_SERVER_URL, o app abre a tela de fallback em `www/` (offline).
 * Lembre de liberar essa origem no CORS do backend (CORS_ORIGIN) e apontar
 * o NEXT_PUBLIC_API_URL do front para uma API acessível pelo celular.
 */
// IP da máquina na rede local (dev). Sobrescreva com CAP_SERVER_URL quando quiser
// (ex.: a URL pública de produção).
const serverUrl = process.env.CAP_SERVER_URL ?? "http://192.168.15.2:3000";

const config: CapacitorConfig = {
  appId: "com.torque.app",
  appName: "TORQUE",
  webDir: "www",
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          // Permite http:// (necessário ao apontar para o IP local em dev).
          cleartext: serverUrl.startsWith("http://"),
        },
      }
    : {}),
  backgroundColor: "#16181d",
  android: { backgroundColor: "#16181d" },
  ios: { backgroundColor: "#16181d", contentInset: "always" },
};

export default config;
