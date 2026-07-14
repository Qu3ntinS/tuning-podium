import { Elysia, status } from "elysia";
import type { Env } from "../../lib/env.js";
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
  return new Elysia({ name: "vote", prefix: "/api/votes" })
    .use(voteModels)
    .get("/session", async ({ request, set }) => {
      const result = await VoteService.getSession(request, config);
      applyCookie(set, result.cookie);
      return result.body;
    })
    .post(
      "/",
      async ({ body, request, set }) => {
        const result = await VoteService.submit(body, request, config);
        applyCookie(set, result.cookie);
        return status(result.status, result.body);
      },
      {
        body: "vote.SubmitBody",
      },
    );
}
