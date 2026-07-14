import { Elysia } from "elysia";
import { LeaderboardService } from "./service.js";

export const leaderboardModule = new Elysia({ name: "leaderboard", prefix: "/api/leaderboard" }).get(
  "/",
  () => LeaderboardService.getSnapshot(),
);
