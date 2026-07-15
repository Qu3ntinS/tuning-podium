import { Elysia, status } from "elysia";
import { EventModel } from "../event/model.js";
import { LeaderboardService } from "./service.js";

export const leaderboardModule = new Elysia({ name: "leaderboard", prefix: "/api/events" })
  .use(new Elysia().model({ slugParams: EventModel.slugParams }).prefix("model", "event."))
  .get("/:slug/leaderboard", async ({ params }) => {
    const snapshot = await LeaderboardService.getSnapshot(params.slug);
    if (!snapshot) {
      return status(404, { error: "Event nicht gefunden." });
    }
    return snapshot;
  }, {
    params: "event.SlugParams",
  });
