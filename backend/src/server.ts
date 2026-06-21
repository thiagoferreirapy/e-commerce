import { createApp } from "./app";
import { env } from "./env";

const app = createApp();

// Bind em "::" (IPv6 dual-stack) para aceitar tanto ::1 quanto 127.0.0.1 — o ngrok
// resolve "localhost" para IPv6 (::1), então sem isso o túnel pode dar ERR_NGROK_8012.
app.listen(env.PORT, "::", () => {
  console.log(`🏍️  TORQUE API rodando em http://localhost:${env.PORT}/api`);
});
