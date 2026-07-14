import { status } from "elysia";
import { prisma } from "../../lib/prisma.js";
import {
  normalizeVehicleProfile,
  type VehicleProfileInput,
  vehiclePublicSelect,
} from "../../lib/vehicle-profile.js";

export abstract class VehicleService {
  static async listActive() {
    const vehicles = await prisma.vehicle.findMany({
      where: { active: true },
      orderBy: [{ number: "asc" }, { name: "asc" }],
      select: vehiclePublicSelect,
    });
    return { vehicles };
  }

  static async getActiveById(id: string) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, active: true },
      select: vehiclePublicSelect,
    });

    if (!vehicle) {
      return status(404, { error: "Fahrzeug nicht gefunden." });
    }

    return { vehicle };
  }

  static async listAll() {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: [{ number: "asc" }, { name: "asc" }],
    });
    return { vehicles };
  }

  static async create(input: {
    name: string;
    number?: number | null;
    imageUrl?: string | null;
    active?: boolean;
  } & VehicleProfileInput) {
    const profile = normalizeVehicleProfile(input);
    const vehicle = await prisma.vehicle.create({
      data: {
        name: input.name.trim(),
        number: input.number ?? null,
        imageUrl: input.imageUrl?.trim() || null,
        active: input.active ?? true,
        ...profile,
      },
    });
    return status(201, { vehicle });
  }

  static async update(
    id: string,
    input: Partial<{
      name: string;
      number: number | null;
      imageUrl: string | null;
      active: boolean;
    }> &
      VehicleProfileInput,
  ) {
    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing) {
      return status(404, { error: "Fahrzeug nicht gefunden." });
    }

    const profile =
      input.description !== undefined ||
      input.instagramUrl !== undefined ||
      input.tiktokUrl !== undefined ||
      input.youtubeUrl !== undefined ||
      input.websiteUrl !== undefined
        ? normalizeVehicleProfile({
            description: input.description,
            instagramUrl: input.instagramUrl,
            tiktokUrl: input.tiktokUrl,
            youtubeUrl: input.youtubeUrl,
            websiteUrl: input.websiteUrl,
          })
        : null;

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.number !== undefined ? { number: input.number } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl?.trim() || null } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
        ...(profile ?? {}),
      },
    });

    return { vehicle };
  }

  static async remove(id: string) {
    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing) {
      return status(404, { error: "Fahrzeug nicht gefunden." });
    }

    await prisma.vehicle.delete({ where: { id } });
    return { ok: true as const };
  }
}
