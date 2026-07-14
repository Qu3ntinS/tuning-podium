import { t } from "elysia";
import { SharedModel } from "../shared/model.js";

export const AdminAuthModel = {
  loginBody: t.Object({
    email: t.String({ format: "email", minLength: 3, maxLength: 255 }),
    password: t.String({ minLength: 8, maxLength: 128 }),
  }),
  loginResponse: t.Object({
    accessToken: t.String(),
    admin: t.Object({
      id: t.String(),
      email: t.String(),
      name: t.Nullable(t.String()),
    }),
  }),
  meResponse: t.Object({
    admin: t.Object({
      id: t.String(),
      email: t.String(),
      name: t.Nullable(t.String()),
    }),
  }),
  authError: t.Object({
    error: t.Literal("Ungültige Anmeldedaten."),
  }),
  unauthorized: SharedModel.unauthorized,
} as const;

export type AdminLoginBody = typeof AdminAuthModel.loginBody.static;
