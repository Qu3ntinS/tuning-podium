import { prisma } from "./prisma.js";

export type VehicleImageRecord = {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
};

export type VehicleImageInput = {
  id?: string;
  url: string;
  isPrimary?: boolean;
  sortOrder?: number;
};

export const vehicleImageSelect = {
  id: true,
  url: true,
  isPrimary: true,
  sortOrder: true,
} as const;

function normalizeImages(images: VehicleImageInput[]): VehicleImageInput[] {
  const cleaned = images
    .map((image, index) => ({
      id: image.id,
      url: image.url.trim(),
      isPrimary: image.isPrimary ?? false,
      sortOrder: image.sortOrder ?? index,
    }))
    .filter((image) => image.url.length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((image, index) => ({ ...image, sortOrder: index }));

  if (cleaned.length === 0) return [];

  const primaryIndex = cleaned.findIndex((image) => image.isPrimary);
  const resolvedPrimaryIndex = primaryIndex >= 0 ? primaryIndex : 0;

  return cleaned.map((image, index) => ({
    ...image,
    isPrimary: index === resolvedPrimaryIndex,
  }));
}

export async function replaceVehicleImages(
  vehicleId: string,
  images: VehicleImageInput[],
): Promise<VehicleImageRecord[]> {
  const normalized = normalizeImages(images);

  await prisma.vehicleImage.deleteMany({ where: { vehicleId } });

  if (normalized.length === 0) {
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { imageUrl: null },
    });
    return [];
  }

  const primary = normalized.find((image) => image.isPrimary) ?? normalized[0];

  const created = await prisma.$transaction(
    normalized.map((image) =>
      prisma.vehicleImage.create({
        data: {
          vehicleId,
          url: image.url,
          sortOrder: image.sortOrder,
          isPrimary: image.isPrimary,
        },
        select: vehicleImageSelect,
      }),
    ),
  );

  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { imageUrl: primary?.url ?? null },
  });

  return created;
}

export async function ensureLegacyImageMigrated(vehicleId: string, imageUrl: string | null) {
  const count = await prisma.vehicleImage.count({ where: { vehicleId } });
  if (count > 0 || !imageUrl?.trim()) return;

  await replaceVehicleImages(vehicleId, [{ url: imageUrl, isPrimary: true, sortOrder: 0 }]);
}
