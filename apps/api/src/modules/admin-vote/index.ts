import { Elysia } from "elysia";
import type { Env } from "../../lib/env.js";
import { createAdminAuthPlugin } from "../../plugins/admin-auth.js";
import { AdminVoteService } from "./service.js";

export function createAdminVoteModule(config: Env) {
  return new Elysia({ name: "admin-vote", prefix: "/api/admin/votes" })
    .use(createAdminAuthPlugin(config))
    .post("/reset", () => AdminVoteService.resetVotes(), { requireAdmin: true })
    .get("/stats", () => AdminVoteService.getStats(), { requireAdmin: true });
}
