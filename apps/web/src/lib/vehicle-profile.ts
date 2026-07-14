import type { Vehicle } from "@/lib/api";

export type SocialLink = {
  key: "instagram" | "tiktok" | "youtube" | "website";
  label: string;
  href: string;
  toneClass: string;
};

export function hasVehicleProfile(vehicle: Vehicle): boolean {
  return Boolean(
    vehicle.description?.trim() ||
      vehicle.instagramUrl?.trim() ||
      vehicle.tiktokUrl?.trim() ||
      vehicle.youtubeUrl?.trim() ||
      vehicle.websiteUrl?.trim(),
  );
}

export function vehicleSocialLinks(vehicle: Vehicle): SocialLink[] {
  const links: SocialLink[] = [];

  if (vehicle.instagramUrl?.trim()) {
    links.push({
      key: "instagram",
      label: "Instagram",
      href: vehicle.instagramUrl,
      toneClass: "vehicle-social-instagram",
    });
  }
  if (vehicle.tiktokUrl?.trim()) {
    links.push({
      key: "tiktok",
      label: "TikTok",
      href: vehicle.tiktokUrl,
      toneClass: "vehicle-social-tiktok",
    });
  }
  if (vehicle.youtubeUrl?.trim()) {
    links.push({
      key: "youtube",
      label: "YouTube",
      href: vehicle.youtubeUrl,
      toneClass: "vehicle-social-youtube",
    });
  }
  if (vehicle.websiteUrl?.trim()) {
    links.push({
      key: "website",
      label: "Website",
      href: vehicle.websiteUrl,
      toneClass: "vehicle-social-website",
    });
  }

  return links;
}

export const EMPTY_VEHICLE_PROFILE = {
  description: "",
  instagramUrl: "",
  tiktokUrl: "",
  youtubeUrl: "",
  websiteUrl: "",
};

export function vehicleProfileFromVehicle(vehicle: Vehicle) {
  return {
    description: vehicle.description ?? "",
    instagramUrl: vehicle.instagramUrl ?? "",
    tiktokUrl: vehicle.tiktokUrl ?? "",
    youtubeUrl: vehicle.youtubeUrl ?? "",
    websiteUrl: vehicle.websiteUrl ?? "",
  };
}

export function vehicleProfilePayload(profile: {
  description: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  websiteUrl: string;
}) {
  return {
    description: profile.description.trim() || null,
    instagramUrl: profile.instagramUrl.trim() || null,
    tiktokUrl: profile.tiktokUrl.trim() || null,
    youtubeUrl: profile.youtubeUrl.trim() || null,
    websiteUrl: profile.websiteUrl.trim() || null,
  };
}
