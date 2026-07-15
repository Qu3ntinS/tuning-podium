import type { VotingMode } from "@prisma/client";
import type { EventSettings } from "./events.js";

const PODIUM_POINTS_BY_RANK: Record<number, number> = {
  1: 5,
  2: 3,
  3: 1,
};

export type VotePickInput = {
  vehicleId: string;
  rank?: number;
  points?: number;
};

export type DuelInput = {
  winnerId: string;
  loserId: string;
};

export type NormalizedVotePick = {
  vehicleId: string;
  rank: number;
  points: number;
};

export function pointsForRank(rank: number): number {
  return PODIUM_POINTS_BY_RANK[rank] ?? 0;
}

export function validatePodiumPicks(picks: VotePickInput[]): string | null {
  if (picks.length !== 3) {
    return "Genau drei Plätze (1, 2, 3) sind erforderlich.";
  }

  const ranks = picks.map((p) => p.rank ?? 0).sort((a, b) => a - b);
  if (ranks[0] !== 1 || ranks[1] !== 2 || ranks[2] !== 3) {
    return "Plätze müssen 1, 2 und 3 sein.";
  }

  const vehicleIds = picks.map((p) => p.vehicleId);
  if (new Set(vehicleIds).size !== vehicleIds.length) {
    return "Jedes Fahrzeug darf nur einmal gewählt werden.";
  }

  for (const pick of picks) {
    if (!pick.vehicleId?.trim()) return "Ungültige Fahrzeug-ID.";
    if (!PODIUM_POINTS_BY_RANK[pick.rank ?? 0]) return "Ungültiger Platz.";
  }

  return null;
}

export function normalizePodiumPicks(picks: VotePickInput[]): NormalizedVotePick[] {
  return picks.map((pick) => ({
    vehicleId: pick.vehicleId,
    rank: pick.rank!,
    points: pointsForRank(pick.rank!),
  }));
}

export function validateCoinsPicks(picks: VotePickInput[], coinBudget: number): string | null {
  if (picks.length < 1 || picks.length > 3) {
    return "Verteile Münzen auf 1 bis 3 Fahrzeuge.";
  }

  const vehicleIds = picks.map((p) => p.vehicleId);
  if (new Set(vehicleIds).size !== vehicleIds.length) {
    return "Jedes Fahrzeug darf nur einmal gewählt werden.";
  }

  let total = 0;
  for (const pick of picks) {
    if (!pick.vehicleId?.trim()) return "Ungültige Fahrzeug-ID.";
    const coins = pick.points ?? 0;
    if (!Number.isInteger(coins) || coins < 1) {
      return "Jedes Fahrzeug braucht mindestens 1 Münze.";
    }
    total += coins;
  }

  if (total !== coinBudget) {
    return `Alle ${coinBudget} Münzen müssen vergeben werden.`;
  }

  return null;
}

export function normalizeCoinsPicks(picks: VotePickInput[]): NormalizedVotePick[] {
  const sorted = [...picks].sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
  return sorted.map((pick, index) => ({
    vehicleId: pick.vehicleId,
    rank: index + 1,
    points: pick.points!,
  }));
}

export function validateSwipeLikes(
  picks: VotePickInput[],
  activeVehicleCount: number,
): string | null {
  if (activeVehicleCount < 1) {
    return "Keine aktiven Fahrzeuge verfügbar.";
  }

  if (picks.length !== activeVehicleCount) {
    return `Alle ${activeVehicleCount} Fahrzeuge müssen bewertet werden.`;
  }

  const vehicleIds = picks.map((pick) => pick.vehicleId);
  if (new Set(vehicleIds).size !== vehicleIds.length) {
    return "Jedes Fahrzeug darf nur einmal bewertet werden.";
  }

  for (const pick of picks) {
    if (!pick.vehicleId?.trim()) return "Ungültige Fahrzeug-ID.";
    const points = pick.points ?? -1;
    if (points !== 0 && points !== 1) {
      return "Bewertung muss Like (1) oder Dislike (0) sein.";
    }
  }

  return null;
}

export function normalizeSwipeLikes(picks: VotePickInput[]): NormalizedVotePick[] {
  return picks
    .filter((pick) => (pick.points ?? 0) > 0)
    .map((pick, index) => ({
      vehicleId: pick.vehicleId,
      rank: index + 1,
      points: 1,
    }));
}

/** Duel-based pairwise swipe voting. */
export function validateSwipeDuels(duels: DuelInput[], swipeDuels: number): string | null {
  if (duels.length !== swipeDuels) {
    return `Genau ${swipeDuels} Duelle sind erforderlich.`;
  }

  for (const duel of duels) {
    if (!duel.winnerId?.trim() || !duel.loserId?.trim()) {
      return "Ungültiges Duell.";
    }
    if (duel.winnerId === duel.loserId) {
      return "Gewinner und Verlierer müssen unterschiedlich sein.";
    }
  }

  return null;
}

export function normalizeSwipeDuels(duels: DuelInput[]): NormalizedVotePick[] {
  const wins = new Map<string, number>();
  for (const duel of duels) {
    wins.set(duel.winnerId, (wins.get(duel.winnerId) ?? 0) + 1);
  }

  return [...wins.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([vehicleId, points], index) => ({
      vehicleId,
      rank: index + 1,
      points,
    }));
}

export function validateVoteSubmission(
  settings: EventSettings,
  input: { picks?: VotePickInput[]; duels?: DuelInput[]; activeVehicleCount?: number },
): { error: string | null; normalized: NormalizedVotePick[] } {
  if (settings.votingMode === "PODIUM") {
    const picks = input.picks ?? [];
    const error = validatePodiumPicks(picks);
    if (error) return { error, normalized: [] };
    return { error: null, normalized: normalizePodiumPicks(picks) };
  }

  if (settings.votingMode === "COINS") {
    const picks = input.picks ?? [];
    const error = validateCoinsPicks(picks, settings.coinBudget);
    if (error) return { error, normalized: [] };
    return { error: null, normalized: normalizeCoinsPicks(picks) };
  }

  if (settings.votingMode === "DUEL") {
    const duels = input.duels ?? [];
    const error = validateSwipeDuels(duels, settings.swipeDuels);
    if (error) return { error, normalized: [] };
    return { error: null, normalized: normalizeSwipeDuels(duels) };
  }

  if (settings.votingMode === "SWIPE") {
    const picks = input.picks ?? [];
    const activeVehicleCount = input.activeVehicleCount ?? 0;
    const error = validateSwipeLikes(picks, activeVehicleCount);
    if (error) return { error, normalized: [] };
    return { error: null, normalized: normalizeSwipeLikes(picks) };
  }

  return { error: "Unbekannter Abstimmungsmodus.", normalized: [] };
}

export function votingModeLabel(mode: VotingMode): string {
  switch (mode) {
    case "PODIUM":
      return "Podium (5/3/1)";
    case "COINS":
      return "Münzen verteilen";
    case "DUEL":
      return "Vergleichsduelle";
    case "SWIPE":
      return "Tinder (Like/Dislike)";
    default:
      return mode;
  }
}
