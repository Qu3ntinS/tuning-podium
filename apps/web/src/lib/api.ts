export type VehicleImage = {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
};

export type Vehicle = {
  id: string;
  name: string;
  number: number | null;
  imageUrl: string | null;
  images?: VehicleImage[];
  description?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  youtubeUrl?: string | null;
  websiteUrl?: string | null;
  active?: boolean;
};

export type VehicleImageInput = {
  id?: string;
  url: string;
  isPrimary?: boolean;
  sortOrder?: number;
};

export type VehicleProfileInput = {
  description?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  youtubeUrl?: string | null;
  websiteUrl?: string | null;
};

export type VotingMode = "PODIUM" | "SWIPE" | "COINS" | "DUEL";

export type PodiumEvent = {
  id: string;
  slug: string;
  name: string;
  votingMode: VotingMode;
  coinBudget: number;
  swipeDuels: number;
  active: boolean;
  updatedAt: string;
};

/** @deprecated Use PodiumEvent */
export type EventConfig = PodiumEvent;

export type VotePick = {
  rank: number;
  points: number;
  vehicle: Pick<
    Vehicle,
    | "id"
    | "name"
    | "number"
    | "imageUrl"
    | "images"
    | "description"
    | "instagramUrl"
    | "tiktokUrl"
    | "youtubeUrl"
    | "websiteUrl"
  >;
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

export type LeaderboardEntry = {
  vehicle: Vehicle;
  totalPoints: number;
  voteCount: number;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
};

export type VoteSession = {
  deviceToken: string;
  isNewDevice: boolean;
  hasVoted: boolean;
  vote: { picks: VotePick[] } | null;
  event: PodiumEvent;
};

const API_BASE = import.meta.env.VITE_API_URL ?? "";

const API_ERROR_TRANSLATIONS: Record<string, string> = {
  "Expected string length greater or equal to 8": "Passwort muss mindestens 8 Zeichen haben.",
  "Expected string to match 'email' format": "Bitte eine gültige E-Mail eingeben.",
  "Property 'email' should be email": "Bitte eine gültige E-Mail eingeben.",
};

function localizeApiError(message: string): string {
  return API_ERROR_TRANSLATIONS[message] ?? message;
}

function parseApiError(data: Record<string, unknown>, fallback: string): string {
  if (typeof data.error === "string") return localizeApiError(data.error);
  if (typeof data.message === "string") return localizeApiError(data.message);
  if (typeof data.summary === "string") return localizeApiError(data.summary);
  const errors = data.errors;
  if (Array.isArray(errors)) {
    const first = errors.find((entry) => typeof entry === "object" && entry && "message" in entry) as
      | { message?: string; summary?: string }
      | undefined;
    if (typeof first?.message === "string") return localizeApiError(first.message);
    if (typeof first?.summary === "string") return localizeApiError(first.summary);
  }
  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {}),
    },
  });

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(parseApiError(data, "Anfrage fehlgeschlagen."));
  }
  return data as T;
}

function authHeaders(token?: string): HeadersInit | undefined {
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export function apiGet<T>(path: string, token?: string): Promise<T> {
  return request<T>(path, { headers: authHeaders(token) });
}

export function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
    headers: authHeaders(token),
  });
}

export function apiPatch<T>(path: string, body: unknown, token: string): Promise<T> {
  return request<T>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: authHeaders(token),
  });
}

export function apiDelete<T>(path: string, token: string): Promise<T> {
  return request<T>(path, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export async function adminLogin(email: string, password: string) {
  return apiPost<{ accessToken: string; admin: AdminUser }>("/api/admin/auth/login", {
    email,
    password,
  });
}

export async function fetchAdminMe(token: string) {
  return apiGet<{ admin: AdminUser }>("/api/admin/auth/me", token);
}

export async function fetchEvent(slug: string): Promise<PodiumEvent> {
  const data = await request<{ event: PodiumEvent }>(`/api/events/${slug}`, { cache: "no-store" });
  return data.event;
}

export async function fetchVehicles(slug: string): Promise<Vehicle[]> {
  const data = await request<{ vehicles: Vehicle[] }>(`/api/events/${slug}/vehicles`, { cache: "no-store" });
  return data.vehicles;
}

export async function fetchVoteSession(slug: string): Promise<VoteSession> {
  return request<VoteSession>(`/api/events/${slug}/votes/session`, { cache: "no-store" });
}

export async function submitVote(
  slug: string,
  deviceToken: string,
  fingerprintHash: string,
  payload: { picks?: VotePickInput[]; duels?: DuelInput[] },
) {
  return apiPost<{ vote: { picks: VotePick[] } }>(`/api/events/${slug}/votes`, {
    deviceToken,
    fingerprintHash,
    ...payload,
  });
}

export async function fetchAdminEvents(token: string): Promise<PodiumEvent[]> {
  const data = await request<{ events: PodiumEvent[] }>("/api/admin/events", {
    cache: "no-store",
    headers: authHeaders(token),
  });
  return data.events;
}

export async function createAdminEvent(token: string, payload: { name: string; slug: string }) {
  const data = await apiPost<{ event: PodiumEvent }>("/api/admin/events", payload, token);
  return data.event;
}

export async function updateAdminEvent(
  token: string,
  eventId: string,
  payload: Partial<Pick<PodiumEvent, "name" | "slug" | "votingMode" | "coinBudget" | "swipeDuels" | "active">>,
) {
  const data = await apiPatch<{ event: PodiumEvent }>(`/api/admin/events/${eventId}`, payload, token);
  return data.event;
}

export async function deleteAdminEvent(token: string, eventId: string) {
  return apiDelete<{ ok: boolean }>(`/api/admin/events/${eventId}`, token);
}

export async function fetchAdminVoteStats(token: string, eventId: string) {
  return request<{ totalVotes: number }>(`/api/admin/events/${eventId}/votes/stats`, {
    cache: "no-store",
    headers: authHeaders(token),
  });
}

export async function resetAdminVotes(token: string, eventId: string) {
  return apiPost<{ ok: boolean; deletedVotes: number }>(`/api/admin/events/${eventId}/votes/reset`, {}, token);
}

export type LiveRevision = {
  revision: string;
  totalVotes: number;
  lastVoteAt: string | null;
  eventConfigAt: string;
  vehiclesAt: string | null;
};

export async function fetchLiveRevision(slug: string): Promise<LiveRevision> {
  return request<LiveRevision>(`/api/events/${slug}/live`, { cache: "no-store" });
}

export async function fetchLeaderboard(slug: string) {
  return request<{
    event: PodiumEvent;
    updatedAt: string;
    totalVotes: number;
    votingMode: VotingMode;
    entries: LeaderboardEntry[];
  }>(`/api/events/${slug}/leaderboard`, { cache: "no-store" });
}

export async function fetchAdminVehicles(token: string, eventId: string): Promise<Vehicle[]> {
  const data = await request<{ vehicles: Vehicle[] }>(`/api/admin/events/${eventId}/vehicles`, {
    cache: "no-store",
    headers: authHeaders(token),
  });
  return data.vehicles;
}

export async function createVehicle(
  token: string,
  eventId: string,
  payload: {
    name: string;
    number?: number | null;
    imageUrl?: string | null;
    images?: VehicleImageInput[];
  } & VehicleProfileInput,
) {
  return apiPost<{ vehicle: Vehicle }>(`/api/admin/events/${eventId}/vehicles`, payload, token);
}

export async function updateVehicle(
  token: string,
  eventId: string,
  id: string,
  payload: Partial<{
    name: string;
    number: number | null;
    imageUrl: string | null;
    images: VehicleImageInput[];
    active: boolean;
  }> & VehicleProfileInput,
) {
  return apiPatch<{ vehicle: Vehicle }>(`/api/admin/events/${eventId}/vehicles/${id}`, payload, token);
}

export async function deleteVehicle(token: string, eventId: string, id: string) {
  return apiDelete<{ ok: boolean }>(`/api/admin/events/${eventId}/vehicles/${id}`, token);
}

export async function uploadVehicleImage(token: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return request<{ asset: { url: string; filename: string } }>("/api/admin/assets/upload", {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
}

export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path}`;
}

import {
  copyTextToClipboard,
  DEFAULT_EVENT_SLUG,
  eventLeaderboardUrl,
  eventShareText,
  eventVoteUrl,
  getPublicAppBase,
  getPublicAppUrlOverride,
  isUnshareableAppUrl,
  setPublicAppUrlOverride,
  shareEventLinks,
  canUseNativeShare,
} from "@/lib/event-share";

export {
  copyTextToClipboard,
  DEFAULT_EVENT_SLUG,
  eventLeaderboardUrl,
  eventShareText,
  eventVoteUrl,
  getPublicAppBase,
  getPublicAppUrlOverride,
  isUnshareableAppUrl,
  setPublicAppUrlOverride,
  shareEventLinks,
  canUseNativeShare,
};

export function normalizeEventSlugInput(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** @deprecated Use fetchEvent */
export async function fetchEventConfig(slug: string = DEFAULT_EVENT_SLUG): Promise<PodiumEvent> {
  return fetchEvent(slug);
}

/** @deprecated Use updateAdminEvent */
export async function updateAdminEventConfig(
  token: string,
  eventId: string,
  payload: Partial<Pick<PodiumEvent, "votingMode" | "coinBudget" | "swipeDuels">>,
) {
  return updateAdminEvent(token, eventId, payload);
}

/** @deprecated Use fetchAdminEvents */
export async function fetchAdminEventConfig(token: string, eventId: string): Promise<PodiumEvent> {
  const events = await fetchAdminEvents(token);
  const event = events.find((entry) => entry.id === eventId);
  if (!event) throw new Error("Event nicht gefunden.");
  return event;
}
