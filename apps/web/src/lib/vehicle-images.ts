import type { Vehicle } from "@/lib/api";

export type VehicleImage = {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
};

export type VehicleImageDraft = {
  id?: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
};

type VehicleWithImages = Pick<Vehicle, "imageUrl"> & {
  images?: VehicleImage[];
};

export function vehicleImages(vehicle: VehicleWithImages | null | undefined): VehicleImage[] {
  if (!vehicle) return [];

  if (vehicle.images?.length) {
    return [...vehicle.images].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  if (vehicle.imageUrl?.trim()) {
    return [
      {
        id: "legacy",
        url: vehicle.imageUrl,
        isPrimary: true,
        sortOrder: 0,
      },
    ];
  }

  return [];
}

export function primaryVehicleImage(vehicle: VehicleWithImages | null | undefined): VehicleImage | null {
  const images = vehicleImages(vehicle);
  return images.find((image) => image.isPrimary) ?? images[0] ?? null;
}

export function primaryVehicleImageUrl(vehicle: VehicleWithImages | null | undefined): string | null {
  return primaryVehicleImage(vehicle)?.url ?? null;
}

export function vehicleImagesFromVehicle(vehicle: Vehicle): VehicleImageDraft[] {
  return vehicleImages(vehicle).map((image) => ({
    id: image.id.startsWith("legacy") ? undefined : image.id,
    url: image.url,
    isPrimary: image.isPrimary,
    sortOrder: image.sortOrder,
  }));
}

export function normalizeVehicleImageDrafts(images: VehicleImageDraft[]): VehicleImageDraft[] {
  const cleaned = images
    .filter((image) => image.url.trim().length > 0)
    .map((image, index) => ({
      ...image,
      url: image.url.trim(),
      sortOrder: index,
    }));

  if (cleaned.length === 0) return [];

  const primaryIndex = cleaned.findIndex((image) => image.isPrimary);
  const resolvedPrimaryIndex = primaryIndex >= 0 ? primaryIndex : 0;

  return cleaned.map((image, index) => ({
    ...image,
    isPrimary: index === resolvedPrimaryIndex,
  }));
}

export function setPrimaryVehicleImage(
  images: VehicleImageDraft[],
  targetUrl: string,
): VehicleImageDraft[] {
  return images.map((image) => ({
    ...image,
    isPrimary: image.url === targetUrl,
  }));
}

export function removeVehicleImage(images: VehicleImageDraft[], targetUrl: string): VehicleImageDraft[] {
  return normalizeVehicleImageDrafts(images.filter((image) => image.url !== targetUrl));
}

export function appendVehicleImages(
  images: VehicleImageDraft[],
  urls: string[],
): VehicleImageDraft[] {
  const existing = new Set(images.map((image) => image.url));
  const next = [...images];

  for (const url of urls) {
    if (!url.trim() || existing.has(url)) continue;
    existing.add(url);
    next.push({
      url,
      isPrimary: next.length === 0,
      sortOrder: next.length,
    });
  }

  return normalizeVehicleImageDrafts(next);
}
