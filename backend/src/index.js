import { createApp } from "./app.js";
import { config } from "./config.js";
import { initDatabase } from "./db/init.js";

async function start() {
  await initDatabase();

  const app = createApp();

  app.listen(config.port, () => {
    console.log(`API demarree sur le port ${config.port}`);
  });
}

start().catch((error) => {
  console.error("Echec du demarrage de l'API :", error);
  process.exit(1);
});
