import { mkdir } from "node:fs/promises";
import { loadEnv } from "./lib/env.js";
import { resolveUploadRoot } from "./lib/assets.js";
import { disconnectPrisma } from "./lib/prisma.js";
import { buildApp } from "./app.js";
import { AdminAuthService } from "./modules/admin-auth/index.js";
import { getEventConfig } from "./lib/event-config.js";

async function main() {
  const config = loadEnv();

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    await AdminAuthService.ensureSeedAdmin(adminEmail, adminPassword, "Organizer");
  }

  await mkdir(resolveUploadRoot(config), { recursive: true });
  await mkdir(`${resolveUploadRoot(config)}/vehicles`, { recursive: true });
  await getEventConfig();

  const app = buildApp(config);

  app.listen({
    port: config.port,
    hostname: "0.0.0.0",
  });

  console.log(
    JSON.stringify({
      level: "info",
      msg: "Server listening",
      port: config.port,
      trustProxy: config.trustProxy,
    }),
  );

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(JSON.stringify({ level: "info", msg: "Shutting down", signal }));
    try {
      await app.stop?.();
    } catch {
      // already stopped
    }
    await disconnectPrisma();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
