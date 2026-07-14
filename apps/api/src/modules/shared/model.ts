import { t } from "elysia";

export const SharedModel = {
  error: t.Object({
    error: t.String(),
  }),
  errorWithDetails: t.Object({
    error: t.String(),
    details: t.Optional(t.Any()),
  }),
  unauthorized: t.Object({
    error: t.Literal("Unauthorized"),
  }),
  notFound: t.Object({
    error: t.String(),
  }),
  ok: t.Object({
    ok: t.Literal(true),
  }),
  votingMode: t.Union([t.Literal("PODIUM"), t.Literal("SWIPE"), t.Literal("COINS")]),
} as const;

export type SharedError = typeof SharedModel.error.static;
