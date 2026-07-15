import { t } from "elysia";
import { SharedModel } from "../shared/model.js";

const vehicleImage = t.Object({
  id: t.String(),
  url: t.String(),
  isPrimary: t.Boolean(),
  sortOrder: t.Integer(),
});

const vehiclePick = t.Object({
  id: t.String(),
  name: t.String(),
  number: t.Nullable(t.Integer()),
  imageUrl: t.Nullable(t.String()),
  description: t.Nullable(t.String()),
  instagramUrl: t.Nullable(t.String()),
  tiktokUrl: t.Nullable(t.String()),
  youtubeUrl: t.Nullable(t.String()),
  websiteUrl: t.Nullable(t.String()),
  images: t.Array(vehicleImage),
});

const votePick = t.Object({
  rank: t.Integer(),
  points: t.Integer(),
  vehicle: vehiclePick,
});

export const VoteModel = {
  pickInput: t.Object({
    vehicleId: t.String({ minLength: 1 }),
    rank: t.Optional(t.Integer({ minimum: 1, maximum: 3 })),
    points: t.Optional(t.Integer({ minimum: 0, maximum: 100 })),
  }),
  duelInput: t.Object({
    winnerId: t.String({ minLength: 1 }),
    loserId: t.String({ minLength: 1 }),
  }),
  submitBody: t.Object({
    deviceToken: t.String({ minLength: 16, maxLength: 64 }),
    fingerprintHash: t.String({ minLength: 64, maxLength: 64 }),
    picks: t.Optional(t.Array(
      t.Object({
        vehicleId: t.String({ minLength: 1 }),
        rank: t.Optional(t.Integer({ minimum: 1, maximum: 3 })),
        points: t.Optional(t.Integer({ minimum: 0, maximum: 100 })),
      }),
    )),
    duels: t.Optional(t.Array(
      t.Object({
        winnerId: t.String({ minLength: 1 }),
        loserId: t.String({ minLength: 1 }),
      }),
    )),
  }),
  sessionResponse: t.Object({
    deviceToken: t.String(),
    isNewDevice: t.Boolean(),
    hasVoted: t.Boolean(),
    vote: t.Nullable(
      t.Object({
        id: t.String(),
        createdAt: t.Union([t.String(), t.Date()]),
        picks: t.Array(votePick),
      }),
    ),
    config: t.Object({
      votingMode: SharedModel.votingMode,
      coinBudget: t.Integer(),
      swipeDuels: t.Integer(),
      updatedAt: t.String(),
    }),
  }),
  voteResponse: t.Object({
    vote: t.Object({
      id: t.String(),
      createdAt: t.Union([t.String(), t.Date()]),
      picks: t.Array(votePick),
    }),
  }),
  conflictResponse: t.Object({
    error: t.String(),
    vote: t.Optional(
      t.Object({
        id: t.String(),
        createdAt: t.Union([t.String(), t.Date()]),
        picks: t.Array(votePick),
      }),
    ),
  }),
} as const;

export type VoteSubmitBody = typeof VoteModel.submitBody.static;
