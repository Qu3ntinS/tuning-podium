import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { Elysia, status } from "elysia";
import type { Env } from "./lib/env.js";
import { resolveUploadRoot } from "./lib/assets.js";
import { createAdminAssetModule } from "./modules/admin-asset/index.js";
import { createAdminAuthModule } from "./modules/admin-auth/index.js";
import { createAdminVoteModule } from "./modules/admin-vote/index.js";
import { createAdminEventModule, publicEventModule } from "./modules/event/index.js";
import { healthModule } from "./modules/health/index.js";
import { leaderboardModule } from "./modules/leaderboard/index.js";
import { liveModule } from "./modules/live/index.js";
import { createVoteModule } from "./modules/vote/index.js";
import { createAdminVehicleModule, publicVehicleModule } from "./modules/vehicle/index.js";
import { prismaPlugin } from "./plugins/prisma.js";
import { rateLimitPlugin } from "./plugins/rate-limit.js";

export function buildApp(config: Env) {
  return new Elysia({ name: "tuning-podium-api" })
    .use(prismaPlugin)
    .use(
      cors({
        origin: config.corsOrigin,
        credentials: true,
        methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      }),
    )
    .use(
      staticPlugin({
        assets: resolveUploadRoot(config),
        prefix: config.publicAssetsPath,
      }),
    )
    .use(
      rateLimitPlugin({
        max: config.voteRateLimitMax,
        windowMs: config.voteRateLimitWindowMs,
        prefix: "/api/events",
        trustProxy: config.trustProxy,
      }),
    )
    .use(healthModule)
    .use(liveModule)
    .use(publicEventModule)
    .use(publicVehicleModule)
    .use(createVoteModule(config))
    .use(leaderboardModule)
    .use(createAdminAuthModule(config))
    .use(createAdminVoteModule(config))
    .use(createAdminEventModule(config))
    .use(createAdminVehicleModule(config))
    .use(createAdminAssetModule(config))
    .onError(({ code, error }) => {
      if (code === "VALIDATION") {
        return status(400, { error: "Ungültige Anfrage.", details: error.all });
      }

      console.error(error);
      return status(500, { error: "Interner Serverfehler." });
    });
}
