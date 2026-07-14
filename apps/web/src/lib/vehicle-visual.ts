import type { Vehicle } from "@/lib/api";

const VEHICLE_COLORS = [
  "vehicle-tone-cyan",
  "vehicle-tone-violet",
  "vehicle-tone-rose",
  "vehicle-tone-teal",
  "vehicle-tone-emerald",
  "vehicle-tone-indigo",
] as const;

export function vehicleColorClass(vehicleId: string): string {
  let hash = 0;
  for (let i = 0; i < vehicleId.length; i += 1) {
    hash = (hash + vehicleId.charCodeAt(i) * (i + 1)) % VEHICLE_COLORS.length;
  }
  return VEHICLE_COLORS[hash] ?? VEHICLE_COLORS[0];
}

export function vehicleDisplayName(vehicle: Vehicle): string {
  return vehicle.number ? `#${vehicle.number} · ${vehicle.name}` : vehicle.name;
}

export function vehicleShortLabel(vehicle: Vehicle): string {
  return vehicle.number ? `#${vehicle.number}` : vehicle.name.slice(0, 2).toUpperCase();
}

export const RANK_META = [
  {
    rank: 1,
    label: "Platz 1",
    points: 5,
    emoji: "🥇",
    tone: "rank-surface-1",
    ringClass: "rank-ring-1",
    badgeClass: "rank-badge-1",
    accentClass: "accent-cool-text",
  },
  {
    rank: 2,
    label: "Platz 2",
    points: 3,
    emoji: "🥈",
    tone: "rank-surface-2",
    ringClass: "rank-ring-2",
    badgeClass: "rank-badge-2",
    accentClass: "accent-violet-text",
  },
  {
    rank: 3,
    label: "Platz 3",
    points: 1,
    emoji: "🥉",
    tone: "rank-surface-3",
    ringClass: "rank-ring-3",
    badgeClass: "rank-badge-3",
    accentClass: "accent-mint-text",
  },
] as const;

export function rankAccentClass(rank: number): string {
  return RANK_META.find((meta) => meta.rank === rank)?.accentClass ?? "text-foreground";
}
