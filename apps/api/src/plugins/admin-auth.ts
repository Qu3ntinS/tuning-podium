import { bearer } from "@elysiajs/bearer";
import { jwt } from "@elysiajs/jwt";
import { Elysia, status as httpStatus } from "elysia";
import type { Env } from "../lib/env.js";
import { prisma } from "../lib/prisma.js";

export type AdminJwtPayload = {
  sub: string;
  email: string;
};

export function createAdminAuthPlugin(config: Env) {
  return new Elysia({ name: "admin-auth" })
    .use(
      jwt({
        name: "adminJwt",
        secret: config.jwtSecret,
        exp: config.jwtExpiresIn,
      }),
    )
    .use(bearer())
    .derive({ as: "scoped" }, async ({ bearer: bearerToken, headers, adminJwt, set }) => {
      const token =
        bearerToken ?? (headers.authorization?.startsWith("Bearer ") ? headers.authorization.slice(7) : null);

      if (!token) {
        return { admin: null as null, isAdmin: false };
      }

      const payload = await adminJwt.verify(token);
      if (!payload || typeof payload.sub !== "string") {
        return { admin: null as null, isAdmin: false };
      }

      const admin = await prisma.admin.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, name: true },
      });

      if (!admin) {
        return { admin: null as null, isAdmin: false };
      }

      return { admin, isAdmin: true };
    })
    .macro({
      requireAdmin: {
        beforeHandle({ isAdmin }) {
          if (!isAdmin) {
            return httpStatus(401, { error: "Unauthorized" });
          }
        },
      },
    });
}

export function signAdminAccessToken(
  adminJwt: { sign: (payload: AdminJwtPayload) => Promise<string> },
  admin: { id: string; email: string },
): Promise<string> {
  return adminJwt.sign({ sub: admin.id, email: admin.email });
}
