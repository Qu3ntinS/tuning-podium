import { Elysia } from "elysia";
import { LiveModel } from "./model.js";
import { LiveService } from "./service.js";

const liveModels = new Elysia({ name: "live.models" })
  .model({
    revision: LiveModel.revision,
  })
  .prefix("model", "live.");

export const liveModule = new Elysia({ name: "live", prefix: "/api/live" })
  .use(liveModels)
  .get("/", () => LiveService.getRevision());
