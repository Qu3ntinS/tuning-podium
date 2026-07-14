import type { VotingMode } from "@/lib/api";

export const VOTING_MODE_META: Record<VotingMode, { label: string; description: string; hint: string }> = {
  PODIUM: {
    label: "Podium",
    description: "Top 3 vergeben.",
    hint: "Platz 1–3 wählen",
  },
  COINS: {
    label: "Punkteverteilung",
    description: "Punkte auf bis zu 3 Fahrzeuge.",
    hint: "Punkte verteilen",
  },
  SWIPE: {
    label: "Vergleichsabstimmung",
    description: "Paarweise Favoriten wählen.",
    hint: "Rechts = Favorit",
  },
};

export function votingModeLabel(mode: VotingMode, coinBudget?: number, swipeDuels?: number): string {
  if (mode === "COINS" && coinBudget) return `Punkteverteilung (${coinBudget})`;
  if (mode === "SWIPE" && swipeDuels) return `Vergleichsabstimmung (${swipeDuels})`;
  return VOTING_MODE_META[mode].label;
}

export function buildSwipeDuels<T extends { id: string }>(vehicles: T[], count: number): [T, T][] {
  if (vehicles.length < 2 || count < 1) return [];

  const pairs: [T, T][] = [];
  for (let i = 0; i < count; i += 1) {
    const left = vehicles[Math.floor(Math.random() * vehicles.length)]!;
    let right = vehicles[Math.floor(Math.random() * vehicles.length)]!;
    let guard = 0;
    while (right.id === left.id && guard < 24) {
      right = vehicles[Math.floor(Math.random() * vehicles.length)]!;
      guard += 1;
    }
    if (right.id === left.id) {
      right = vehicles.find((vehicle) => vehicle.id !== left.id) ?? right;
    }
    pairs.push([left, right]);
  }
  return pairs;
}
