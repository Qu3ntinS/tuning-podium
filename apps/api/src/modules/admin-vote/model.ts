import { t } from "elysia";
import { SharedModel } from "../shared/model.js";

export const AdminVoteModel = {
  resetResponse: t.Object({
    ok: t.Literal(true),
    deletedVotes: t.Integer(),
  }),
  statsResponse: t.Object({
    totalVotes: t.Integer(),
  }),
  unauthorized: SharedModel.unauthorized,
} as const;
