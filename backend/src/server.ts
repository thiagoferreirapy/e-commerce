import { createApp } from "./app";
import { env } from "./env";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`🏍️  TORQUE API rodando em http://localhost:${env.PORT}/api`);
});
