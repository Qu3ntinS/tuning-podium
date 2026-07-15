import { Elysia, status } from "elysia";
import { EventModel } from "../event/model.js";
import { LiveService } from "./service.js";

export const liveModule = new Elysia({ name: "live", prefix: "/api/events" })
  .use(new Elysia().model({ slugParams: EventModel.slugParams }).prefix("model", "event."))
  .get("/:slug/live", async ({ params }) => {
    const revision = await LiveService.getRevision(params.slug);
    if (!revision) {
      return status(404, { error: "Event nicht gefunden." });
    }
    return revision;
  }, {
    params: "event.SlugParams",
  });
