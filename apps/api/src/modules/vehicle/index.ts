import { Elysia } from "elysia";
import type { Env } from "../../lib/env.js";
import { createAdminAuthPlugin } from "../../plugins/admin-auth.js";
import { VehicleModel } from "./model.js";
import { VehicleService } from "./service.js";

const vehicleModels = new Elysia({ name: "vehicle.models" })
  .model({
    createBody: VehicleModel.createBody,
    updateBody: VehicleModel.updateBody,
    idParams: VehicleModel.idParams,
  })
  .prefix("model", "vehicle.");

export const publicVehicleModule = new Elysia({ name: "vehicle.public", prefix: "/api/vehicles" })
  .use(vehicleModels)
  .get("/", () => VehicleService.listActive())
  .get("/:id", ({ params }) => VehicleService.getActiveById(params.id), {
    params: "vehicle.IdParams",
  });

export function createAdminVehicleModule(config: Env) {
  return new Elysia({ name: "vehicle.admin", prefix: "/api/admin/vehicles" })
    .use(createAdminAuthPlugin(config))
    .use(vehicleModels)
    .get("/", () => VehicleService.listAll(), { requireAdmin: true })
    .post("/", ({ body }) => VehicleService.create(body), {
      requireAdmin: true,
      body: "vehicle.CreateBody",
    })
    .patch("/:id", ({ params, body }) => VehicleService.update(params.id, body), {
      requireAdmin: true,
      params: "vehicle.IdParams",
      body: "vehicle.UpdateBody",
    })
    .delete("/:id", ({ params }) => VehicleService.remove(params.id), {
      requireAdmin: true,
      params: "vehicle.IdParams",
    });
}
