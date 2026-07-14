import { t } from "elysia";
import { SharedModel } from "../shared/model.js";

export const EventModel = {
  config: t.Object({
    votingMode: SharedModel.votingMode,
    coinBudget: t.Integer(),
    swipeDuels: t.Integer(),
    updatedAt: t.String(),
  }),
  configResponse: t.Object({
    config: t.Object({
      votingMode: SharedModel.votingMode,
      coinBudget: t.Integer(),
      swipeDuels: t.Integer(),
      updatedAt: t.String(),
    }),
  }),
  updateBody: t.Object({
    votingMode: t.Optional(SharedModel.votingMode),
    coinBudget: t.Optional(t.Integer({ minimum: 3, maximum: 100 })),
    swipeDuels: t.Optional(t.Integer({ minimum: 4, maximum: 40 })),
  }),
} as const;

export type EventConfigDto = typeof EventModel.config.static;
export type EventConfigUpdateBody = typeof EventModel.updateBody.static;
