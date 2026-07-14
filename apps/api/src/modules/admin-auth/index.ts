import { Elysia } from "elysia";
import type { Env } from "../../lib/env.js";
import { createAdminAuthPlugin } from "../../plugins/admin-auth.js";
import { AdminAuthModel } from "./model.js";
import { AdminAuthService } from "./service.js";

const adminAuthModels = new Elysia({ name: "admin-auth.models" })
  .model({
    loginBody: AdminAuthModel.loginBody,
    loginResponse: AdminAuthModel.loginResponse,
    meResponse: AdminAuthModel.meResponse,
    authError: AdminAuthModel.authError,
    unauthorized: AdminAuthModel.unauthorized,
  })
  .prefix("model", "auth.");

export function createAdminAuthModule(config: Env) {
  return new Elysia({ name: "admin-auth", prefix: "/api/admin/auth" })
    .use(createAdminAuthPlugin(config))
    .use(adminAuthModels)
    .post("/login", ({ body, adminJwt }) => AdminAuthService.login(body, adminJwt), {
      body: "auth.LoginBody",
    })
    .get(
      "/me",
      ({ admin }) => ({ admin }),
      {
        requireAdmin: true,
      },
    );
}

export { AdminAuthService };
