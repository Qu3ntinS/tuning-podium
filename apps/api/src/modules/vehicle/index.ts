import { Elysia } from "elysia";
import type { Env } from "../../lib/env.js";
import { createAdminAuthPlugin } from "../../plugins/admin-auth.js";
import { EventModel } from "../event/model.js";
import { VehicleModel } from "./model.js";
import { VehicleService } from "./service.js";

const vehicleModels = new Elysia({ name: "vehicle.models" })
  .model({
    createBody: VehicleModel.createBody,
    updateBody: VehicleModel.updateBody,
    idParams: VehicleModel.idParams,
    eventVehicleParams: VehicleModel.eventVehicleParams,
    adminEventVehicleParams: VehicleModel.adminEventVehicleParams,
  })
  .prefix("model", "vehicle.");

export const publicVehicleModule = new Elysia({ name: "vehicle.public", prefix: "/api/events" })
  .use(vehicleModels)
  .use(new Elysia().model({ slugParams: EventModel.slugParams }).prefix("model", "event."))
  .get("/:slug/vehicles", ({ params }) => VehicleService.listActiveBySlug(params.slug), {
    params: "event.SlugParams",
  })
  .get("/:slug/vehicles/:id", ({ params }) => VehicleService.getActiveBySlug(params.slug, params.id), {
    params: "vehicle.EventVehicleParams",
  });

export function createAdminVehicleModule(config: Env) {
  return new Elysia({ name: "vehicle.admin", prefix: "/api/admin/events" })
    .use(createAdminAuthPlugin(config))
    .use(vehicleModels)
    .use(new Elysia().model({ idParams: EventModel.idParams }).prefix("model", "event."))
    .get("/:eventId/vehicles", ({ params }) => VehicleService.listAll(params.eventId), {
      requireAdmin: true,
      params: "event.IdParams",
    })
    .post("/:eventId/vehicles", ({ params, body }) => VehicleService.create(params.eventId, body), {
      requireAdmin: true,
      params: "event.IdParams",
      body: "vehicle.CreateBody",
    })
    .patch("/:eventId/vehicles/:id", ({ params, body }) => VehicleService.update(params.eventId, params.id, body), {
      requireAdmin: true,
      params: "vehicle.AdminEventVehicleParams",
      body: "vehicle.UpdateBody",
    })
    .delete("/:eventId/vehicles/:id", ({ params }) => VehicleService.remove(params.eventId, params.id), {
      requireAdmin: true,
      params: "vehicle.AdminEventVehicleParams",
    });
}
