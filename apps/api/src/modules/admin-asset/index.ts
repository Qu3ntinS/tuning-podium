import { Elysia, status, t } from "elysia";
import type { Env } from "../../lib/env.js";
import { createAdminAuthPlugin } from "../../plugins/admin-auth.js";
import { AdminAssetModel } from "./model.js";
import { AdminAssetService } from "./service.js";

export function createAdminAssetModule(config: Env) {
  return new Elysia({ name: "admin-asset", prefix: "/api/admin/assets" })
    .use(createAdminAuthPlugin(config))
    .post(
      "/upload",
      async ({ body }) => {
        const result = await AdminAssetService.upload(config, body.file);
        return status(result.status, result.body);
      },
      {
        requireAdmin: true,
        body: t.Object({
          file: t.File({
            maxSize: config.maxUploadBytes,
            type: ["image/jpeg", "image/png", "image/webp"],
          }),
        }),
      },
    );
}
