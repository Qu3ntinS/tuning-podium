import { t } from "elysia";

export const LiveModel = {
  revision: t.Object({
    revision: t.String(),
    totalVotes: t.Integer(),
    lastVoteAt: t.Nullable(t.String()),
    eventConfigAt: t.String(),
    vehiclesAt: t.Nullable(t.String()),
  }),
} as const;

export type LiveRevisionDto = typeof LiveModel.revision.static;
