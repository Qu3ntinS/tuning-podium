import { Elysia } from "elysia";
import type { Env } from "../../lib/env.js";
import { createAdminAuthPlugin } from "../../plugins/admin-auth.js";
import { EventModel } from "./model.js";
import { EventService } from "./service.js";

const eventModels = new Elysia({ name: "event.models" })
  .model({
    slugParams: EventModel.slugParams,
    idParams: EventModel.idParams,
    createBody: EventModel.createBody,
    updateBody: EventModel.updateBody,
  })
  .prefix("model", "event.");

export const publicEventModule = new Elysia({ name: "event.public", prefix: "/api/events" })
  .use(eventModels)
  .get("/:slug", ({ params }) => EventService.getPublicBySlug(params.slug), {
    params: "event.SlugParams",
  });

export function createAdminEventModule(config: Env) {
  return new Elysia({ name: "event.admin", prefix: "/api/admin/events" })
    .use(createAdminAuthPlugin(config))
    .use(eventModels)
    .get("/", () => EventService.listAdmin(), { requireAdmin: true })
    .post("/", ({ body }) => EventService.create(body), {
      requireAdmin: true,
      body: "event.CreateBody",
    })
    .get("/:eventId", ({ params }) => EventService.getAdminById(params.eventId), {
      requireAdmin: true,
      params: "event.IdParams",
    })
    .patch("/:eventId", ({ params, body }) => EventService.update(params.eventId, body), {
      requireAdmin: true,
      params: "event.IdParams",
      body: "event.UpdateBody",
    })
    .delete("/:eventId", ({ params }) => EventService.remove(params.eventId), {
      requireAdmin: true,
      params: "event.IdParams",
    });
}
