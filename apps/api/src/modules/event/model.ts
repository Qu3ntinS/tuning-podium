import { t } from "elysia";
import { SharedModel } from "../shared/model.js";

export const EventModel = {
  slugParams: t.Object({
    slug: t.String({ minLength: 2, maxLength: 48 }),
  }),
  idParams: t.Object({
    eventId: t.String({ minLength: 1 }),
  }),
  event: t.Object({
    id: t.String(),
    slug: t.String(),
    name: t.String(),
    votingMode: SharedModel.votingMode,
    coinBudget: t.Integer(),
    swipeDuels: t.Integer(),
    active: t.Boolean(),
    updatedAt: t.String(),
  }),
  publicResponse: t.Object({
    event: t.Object({
      id: t.String(),
      slug: t.String(),
      name: t.String(),
      votingMode: SharedModel.votingMode,
      coinBudget: t.Integer(),
      swipeDuels: t.Integer(),
      active: t.Boolean(),
      updatedAt: t.String(),
    }),
  }),
  listResponse: t.Object({
    events: t.Array(
      t.Object({
        id: t.String(),
        slug: t.String(),
        name: t.String(),
        votingMode: SharedModel.votingMode,
        coinBudget: t.Integer(),
        swipeDuels: t.Integer(),
        active: t.Boolean(),
        updatedAt: t.String(),
      }),
    ),
  }),
  createBody: t.Object({
    name: t.String({ minLength: 1, maxLength: 120 }),
    slug: t.String({ minLength: 2, maxLength: 48 }),
  }),
  updateBody: t.Object({
    name: t.Optional(t.String({ minLength: 1, maxLength: 120 })),
    slug: t.Optional(t.String({ minLength: 2, maxLength: 48 })),
    votingMode: t.Optional(SharedModel.votingMode),
    coinBudget: t.Optional(t.Integer({ minimum: 3, maximum: 100 })),
    swipeDuels: t.Optional(t.Integer({ minimum: 4, maximum: 40 })),
    active: t.Optional(t.Boolean()),
  }),
} as const;

export type EventDto = typeof EventModel.event.static;
