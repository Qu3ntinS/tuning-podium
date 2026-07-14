import { Elysia } from "elysia";

export const healthModule = new Elysia({ name: "health", prefix: "/health" }).get("/", () => ({
  ok: true,
  service: "tuning-podium-api",
}));
