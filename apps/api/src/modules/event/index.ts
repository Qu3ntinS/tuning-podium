import { Elysia } from "elysia";
import type { Env } from "../../lib/env.js";
import { createAdminAuthPlugin } from "../../plugins/admin-auth.js";
import { EventModel } from "./model.js";
import { EventService } from "./service.js";

const eventModels = new Elysia({ name: "event.models" })
  .model({
    configResponse: EventModel.configResponse,
    updateBody: EventModel.updateBody,
  })
  .prefix("model", "event.");

export const publicEventModule = new Elysia({ name: "event.public", prefix: "/api/event" })
  .get("/config", () => EventService.getPublicConfig());

export function createAdminEventModule(config: Env) {
  return new Elysia({ name: "event.admin", prefix: "/api/admin/event" })
    .use(createAdminAuthPlugin(config))
    .use(eventModels)
    .get("/config", () => EventService.getPublicConfig(), { requireAdmin: true })
    .patch("/config", ({ body }) => EventService.updateConfig(body), {
      requireAdmin: true,
      body: "event.UpdateBody",
    });
}
