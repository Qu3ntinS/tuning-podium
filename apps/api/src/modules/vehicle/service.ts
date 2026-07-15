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
import { getEventById } from "../../lib/events.js";

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

async function resolveEvent(eventId: string) {
  const event = await getEventById(eventId);
  if (!event) {
    return null;
  }
  return event;
}

export abstract class VehicleService {
  static async listActive(eventId: string) {
    const event = await resolveEvent(eventId);
    if (!event || !event.active) {
      return status(404, { error: "Event nicht gefunden." });
    }

    const vehicles = await prisma.vehicle.findMany({
      where: { eventId: event.id, active: true },
      orderBy: [{ number: "asc" }, { name: "asc" }],
      select: vehiclePublicSelect,
    });
    return { vehicles };
  }

  static async listActiveBySlug(slug: string) {
    const event = await prisma.event.findFirst({ where: { slug, active: true } });
    if (!event) {
      return status(404, { error: "Event nicht gefunden." });
    }
    return VehicleService.listActive(event.id);
  }

  static async getActiveBySlug(slug: string, id: string) {
    const event = await prisma.event.findFirst({ where: { slug, active: true } });
    if (!event) {
      return status(404, { error: "Event nicht gefunden." });
    }
    return VehicleService.getActiveById(event.id, id);
  }

  static async getActiveById(eventId: string, id: string) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, eventId, active: true },
      select: vehiclePublicSelect,
    });

    if (!vehicle) {
      return status(404, { error: "Fahrzeug nicht gefunden." });
    }

    return { vehicle };
  }

  static async listAll(eventId: string) {
    const event = await resolveEvent(eventId);
    if (!event) {
      return status(404, { error: "Event nicht gefunden." });
    }

    const vehicles = await prisma.vehicle.findMany({
      where: { eventId: event.id },
      orderBy: [{ number: "asc" }, { name: "asc" }],
      select: adminVehicleSelect,
    });
    return { vehicles };
  }

  static async create(
    eventId: string,
    input: {
      name: string;
      number?: number | null;
      imageUrl?: string | null;
      images?: VehicleImageInput[];
      active?: boolean;
    } & VehicleProfileInput,
  ) {
    const event = await resolveEvent(eventId);
    if (!event) {
      return status(404, { error: "Event nicht gefunden." });
    }

    const profile = normalizeVehicleProfile(input);
    const imagePayload = imagesFromBody(input.images, input.imageUrl);

    const vehicle = await prisma.vehicle.create({
      data: {
        eventId: event.id,
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
    eventId: string,
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
    const existing = await prisma.vehicle.findFirst({ where: { id, eventId } });
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

  static async remove(eventId: string, id: string) {
    const existing = await prisma.vehicle.findFirst({ where: { id, eventId } });
    if (!existing) {
      return status(404, { error: "Fahrzeug nicht gefunden." });
    }

    await prisma.vehicle.delete({ where: { id } });
    return { ok: true as const };
  }
}
