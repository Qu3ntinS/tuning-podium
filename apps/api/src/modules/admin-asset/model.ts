import { t } from "elysia";
import { SharedModel } from "../shared/model.js";

export const AdminAssetModel = {
  uploadBody: t.Object({
    file: t.File({
      type: ["image/jpeg", "image/png", "image/webp"],
    }),
  }),
  uploadResponse: t.Object({
    asset: t.Object({
      url: t.String(),
      filename: t.String(),
    }),
  }),
  error: SharedModel.error,
  unauthorized: SharedModel.unauthorized,
} as const;
