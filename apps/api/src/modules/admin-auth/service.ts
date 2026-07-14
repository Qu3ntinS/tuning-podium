import { status } from "elysia";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { prisma } from "../../lib/prisma.js";
import type { AdminJwtPayload } from "../../plugins/admin-auth.js";
import { signAdminAccessToken } from "../../plugins/admin-auth.js";
import type { AdminLoginBody } from "./model.js";

const GENERIC_AUTH_ERROR = { error: "Ungültige Anmeldedaten." as const };

export abstract class AdminAuthService {
  static async login(
    body: AdminLoginBody,
    adminJwt: { sign: (payload: AdminJwtPayload) => Promise<string> },
  ) {
    const email = body.email.toLowerCase().trim();
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return status(401, GENERIC_AUTH_ERROR);
    }

    const valid = await verifyPassword(body.password, admin.passwordHash);
    if (!valid) {
      return status(401, GENERIC_AUTH_ERROR);
    }

    const accessToken = await signAdminAccessToken(adminJwt, admin);
    return {
      accessToken,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    };
  }

  static async ensureSeedAdmin(email: string, password: string, name?: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.admin.findUnique({ where: { email: normalizedEmail } });
    if (existing) return;

    await prisma.admin.create({
      data: {
        email: normalizedEmail,
        passwordHash: await hashPassword(password),
        name: name ?? "Organizer",
      },
    });
  }
}
