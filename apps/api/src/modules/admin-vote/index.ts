import { Elysia, status } from "elysia";
import type { Env } from "../../lib/env.js";
import { createAdminAuthPlugin } from "../../plugins/admin-auth.js";
import { EventModel } from "../event/model.js";
import { AdminVoteService } from "./service.js";

export function createAdminVoteModule(config: Env) {
  return new Elysia({ name: "admin-vote", prefix: "/api/admin/events" })
    .use(createAdminAuthPlugin(config))
    .use(new Elysia().model({ idParams: EventModel.idParams }).prefix("model", "event."))
    .post("/:eventId/votes/reset", async ({ params }) => {
      const result = await AdminVoteService.resetVotes(params.eventId);
      if (!result) {
        return status(404, { error: "Event nicht gefunden." });
      }
      return result;
    }, { requireAdmin: true, params: "event.IdParams" })
    .get("/:eventId/votes/stats", async ({ params }) => {
      const result = await AdminVoteService.getStats(params.eventId);
      if (!result) {
        return status(404, { error: "Event nicht gefunden." });
      }
      return result;
    }, { requireAdmin: true, params: "event.IdParams" });
}
