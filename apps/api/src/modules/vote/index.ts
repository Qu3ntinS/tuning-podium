import { Elysia, status } from "elysia";
import type { Env } from "../../lib/env.js";
import { EventModel } from "../event/model.js";
import { VoteModel } from "./model.js";
import { VoteService } from "./service.js";

const voteModels = new Elysia({ name: "vote.models" })
  .model({
    submitBody: VoteModel.submitBody,
    sessionResponse: VoteModel.sessionResponse,
    voteResponse: VoteModel.voteResponse,
    conflictResponse: VoteModel.conflictResponse,
  })
  .prefix("model", "vote.");

function applyCookie(set: { headers: Record<string, string | number | string[]> }, cookie?: string) {
  if (cookie) {
    set.headers["set-cookie"] = cookie;
  }
}

export function createVoteModule(config: Env) {
  return new Elysia({ name: "vote", prefix: "/api/events" })
    .use(voteModels)
    .use(new Elysia().model({ slugParams: EventModel.slugParams }).prefix("model", "event."))
    .get("/:slug/votes/session", async ({ params, request, set }) => {
      const result = await VoteService.getSession(params.slug, request, config);
      applyCookie(set, result.cookie);
      return status(result.status, result.body);
    }, {
      params: "event.SlugParams",
    })
    .post(
      "/:slug/votes",
      async ({ params, body, request, set }) => {
        const result = await VoteService.submit(params.slug, body, request, config);
        applyCookie(set, result.cookie);
        return status(result.status, result.body);
      },
      {
        params: "event.SlugParams",
        body: "vote.SubmitBody",
      },
    );
}
