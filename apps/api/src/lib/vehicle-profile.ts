export type SocialPlatform = "instagram" | "tiktok" | "youtube" | "website";

const URL_MAX = 500;
const DESCRIPTION_MAX = 2000;

function trimOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeSocialUrl(
  value: string | null | undefined,
  platform: SocialPlatform,
): string | null {
  const raw = trimOrNull(value);
  if (!raw) return null;
  if (raw.length > URL_MAX) return null;

  if (isValidHttpUrl(raw)) return raw;

  const handle = raw.replace(/^@/, "").replace(/^\//, "");
  if (!handle) return null;

  switch (platform) {
    case "instagram":
      return `https://instagram.com/${handle}`;
    case "tiktok":
      return `https://tiktok.com/@${handle}`;
    case "youtube":
      if (handle.startsWith("channel/") || handle.startsWith("c/") || handle.startsWith("@")) {
        return `https://youtube.com/${handle.startsWith("@") ? handle : handle}`;
      }
      return `https://youtube.com/@${handle}`;
    case "website":
      return `https://${handle}`;
    default:
      return null;
  }
}

export function normalizeDescription(value: string | null | undefined): string | null {
  const raw = trimOrNull(value);
  if (!raw) return null;
  return raw.slice(0, DESCRIPTION_MAX);
}

export type VehicleProfileInput = {
  description?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  youtubeUrl?: string | null;
  websiteUrl?: string | null;
};

export function normalizeVehicleProfile(input: VehicleProfileInput): {
  description: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  websiteUrl: string | null;
} {
  return {
    description: normalizeDescription(input.description),
    instagramUrl: normalizeSocialUrl(input.instagramUrl, "instagram"),
    tiktokUrl: normalizeSocialUrl(input.tiktokUrl, "tiktok"),
    youtubeUrl: normalizeSocialUrl(input.youtubeUrl, "youtube"),
    websiteUrl: normalizeSocialUrl(input.websiteUrl, "website"),
  };
}

import { vehicleImageSelect } from "./vehicle-images.js";

export const vehiclePublicSelect = {
  id: true,
  name: true,
  number: true,
  imageUrl: true,
  description: true,
  instagramUrl: true,
  tiktokUrl: true,
  youtubeUrl: true,
  websiteUrl: true,
  images: {
    select: vehicleImageSelect,
    orderBy: { sortOrder: "asc" as const },
  },
} as const;
