import { status } from "elysia";
import { prisma } from "../../lib/prisma.js";
import {
  ensureLegacyImageMigrated,
  replaceVehicleImages,
  vehicleImageSelect,
  type VehicleImageInput,
} from "../../lib/vehicle-images.js";
import {
  normalizeVehicleProfile,
  type VehicleProfileInput,
  vehiclePublicSelect,
} from "../../lib/vehicle-profile.js";

const adminVehicleSelect = {
  id: true,
  name: true,
  number: true,
  imageUrl: true,
  description: true,
  instagramUrl: true,
  tiktokUrl: true,
  youtubeUrl: true,
  websiteUrl: true,
  active: true,
  createdAt: true,
  updatedAt: true,
  images: {
    select: vehicleImageSelect,
    orderBy: { sortOrder: "asc" as const },
  },
} as const;

function imagesFromBody(
  images: VehicleImageInput[] | undefined,
  imageUrl: string | null | undefined,
): VehicleImageInput[] | null {
  if (images !== undefined) return images;
  if (imageUrl === undefined) return null;
  if (!imageUrl?.trim()) return [];
  return [{ url: imageUrl, isPrimary: true, sortOrder: 0 }];
}

async function loadAdminVehicle(id: string) {
  return prisma.vehicle.findUnique({
    where: { id },
    select: adminVehicleSelect,
  });
}

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
      select: adminVehicleSelect,
    });
    return { vehicles };
  }

  static async create(
    input: {
      name: string;
      number?: number | null;
      imageUrl?: string | null;
      images?: VehicleImageInput[];
      active?: boolean;
    } & VehicleProfileInput,
  ) {
    const profile = normalizeVehicleProfile(input);
    const imagePayload = imagesFromBody(input.images, input.imageUrl);

    const vehicle = await prisma.vehicle.create({
      data: {
        name: input.name.trim(),
        number: input.number ?? null,
        imageUrl: null,
        active: input.active ?? true,
        ...profile,
      },
      select: { id: true },
    });

    if (imagePayload) {
      await replaceVehicleImages(vehicle.id, imagePayload);
    }

    const created = await loadAdminVehicle(vehicle.id);
    return status(201, { vehicle: created });
  }

  static async update(
    id: string,
    input: Partial<{
      name: string;
      number: number | null;
      imageUrl: string | null;
      images: VehicleImageInput[];
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

    const imagePayload = imagesFromBody(input.images, input.imageUrl);

    await prisma.vehicle.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.number !== undefined ? { number: input.number } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
        ...(profile ?? {}),
      },
    });

    if (imagePayload) {
      await replaceVehicleImages(id, imagePayload);
    } else if (input.imageUrl === undefined && input.images === undefined) {
      await ensureLegacyImageMigrated(id, existing.imageUrl);
    }

    const vehicle = await loadAdminVehicle(id);
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
