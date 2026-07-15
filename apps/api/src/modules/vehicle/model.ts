import { t } from "elysia";
import { SharedModel } from "../shared/model.js";

const profileFields = {
  description: t.Optional(t.Nullable(t.String({ maxLength: 2000 }))),
  instagramUrl: t.Optional(t.Nullable(t.String({ maxLength: 500 }))),
  tiktokUrl: t.Optional(t.Nullable(t.String({ maxLength: 500 }))),
  youtubeUrl: t.Optional(t.Nullable(t.String({ maxLength: 500 }))),
  websiteUrl: t.Optional(t.Nullable(t.String({ maxLength: 500 }))),
};

const imageFields = {
  id: t.String(),
  url: t.String(),
  isPrimary: t.Boolean(),
  sortOrder: t.Integer(),
};

const imageInputFields = {
  id: t.Optional(t.String()),
  url: t.String({ minLength: 1 }),
  isPrimary: t.Optional(t.Boolean()),
  sortOrder: t.Optional(t.Integer({ minimum: 0 })),
};

export const VehicleModel = {
  image: t.Object(imageFields),
  public: t.Object({
    id: t.String(),
    name: t.String(),
    number: t.Nullable(t.Integer()),
    imageUrl: t.Nullable(t.String()),
    description: t.Nullable(t.String()),
    instagramUrl: t.Nullable(t.String()),
    tiktokUrl: t.Nullable(t.String()),
    youtubeUrl: t.Nullable(t.String()),
    websiteUrl: t.Nullable(t.String()),
    images: t.Array(t.Object(imageFields)),
  }),
  listResponse: t.Object({
    vehicles: t.Array(
      t.Object({
        id: t.String(),
        name: t.String(),
        number: t.Nullable(t.Integer()),
        imageUrl: t.Nullable(t.String()),
        description: t.Nullable(t.String()),
        instagramUrl: t.Nullable(t.String()),
        tiktokUrl: t.Nullable(t.String()),
        youtubeUrl: t.Nullable(t.String()),
        websiteUrl: t.Nullable(t.String()),
        images: t.Array(t.Object(imageFields)),
      }),
    ),
  }),
  detailResponse: t.Object({
    vehicle: t.Object({
      id: t.String(),
      name: t.String(),
      number: t.Nullable(t.Integer()),
      imageUrl: t.Nullable(t.String()),
      description: t.Nullable(t.String()),
      instagramUrl: t.Nullable(t.String()),
      tiktokUrl: t.Nullable(t.String()),
      youtubeUrl: t.Nullable(t.String()),
      websiteUrl: t.Nullable(t.String()),
      images: t.Array(t.Object(imageFields)),
    }),
  }),
  createBody: t.Object({
    name: t.String({ minLength: 1, maxLength: 120 }),
    number: t.Optional(t.Nullable(t.Integer({ minimum: 1 }))),
    imageUrl: t.Optional(t.Nullable(t.String())),
    images: t.Optional(t.Array(t.Object(imageInputFields))),
    active: t.Optional(t.Boolean()),
    ...profileFields,
  }),
  updateBody: t.Object({
    name: t.Optional(t.String({ minLength: 1, maxLength: 120 })),
    number: t.Optional(t.Nullable(t.Integer({ minimum: 1 }))),
    imageUrl: t.Optional(t.Nullable(t.String())),
    images: t.Optional(t.Array(t.Object(imageInputFields))),
    active: t.Optional(t.Boolean()),
    ...profileFields,
  }),
  vehicleResponse: t.Object({
    vehicle: t.Any(),
  }),
  idParams: t.Object({
    id: t.String({ minLength: 1 }),
  }),
  notFound: SharedModel.notFound,
} as const;

export type VehicleCreateBody = typeof VehicleModel.createBody.static;
export type VehicleUpdateBody = typeof VehicleModel.updateBody.static;
