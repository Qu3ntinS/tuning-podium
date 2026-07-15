import type { Event, VotingMode } from "@prisma/client";
import { prisma } from "./prisma.js";

export const DEFAULT_EVENT_SLUG = "main";

export type EventSettings = Pick<Event, "votingMode" | "coinBudget" | "swipeDuels">;

export type SerializedEvent = {
  id: string;
  slug: string;
  name: string;
  votingMode: VotingMode;
  coinBudget: number;
  swipeDuels: number;
  active: boolean;
  updatedAt: string;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidEventSlug(slug: string): boolean {
  return slug.length >= 2 && slug.length <= 48 && SLUG_PATTERN.test(slug);
}

export function normalizeEventSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function serializeEvent(event: Event): SerializedEvent {
  return {
    id: event.id,
    slug: event.slug,
    name: event.name,
    votingMode: event.votingMode,
    coinBudget: event.coinBudget,
    swipeDuels: event.swipeDuels,
    active: event.active,
    updatedAt: event.updatedAt.toISOString(),
  };
}

export async function ensureDefaultEvent(): Promise<Event> {
  const existing = await prisma.event.findUnique({ where: { slug: DEFAULT_EVENT_SLUG } });
  if (existing) return existing;

  return prisma.event.create({
    data: {
      id: "evt_main",
      slug: DEFAULT_EVENT_SLUG,
      name: "Hauptevent",
    },
  });
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  return prisma.event.findFirst({
    where: { slug, active: true },
  });
}

export async function getEventById(id: string): Promise<Event | null> {
  return prisma.event.findUnique({ where: { id } });
}

export async function listEvents(): Promise<Event[]> {
  return prisma.event.findMany({
    orderBy: [{ createdAt: "asc" }],
  });
}

export async function createEvent(data: { name: string; slug: string }): Promise<Event> {
  const slug = normalizeEventSlug(data.slug);
  if (!isValidEventSlug(slug)) {
    throw new Error("Ungültiger Event-Slug.");
  }

  return prisma.event.create({
    data: {
      name: data.name.trim(),
      slug,
    },
  });
}

export async function updateEvent(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    votingMode: VotingMode;
    coinBudget: number;
    swipeDuels: number;
    active: boolean;
  }>,
): Promise<Event> {
  const payload: Partial<{
    name: string;
    slug: string;
    votingMode: VotingMode;
    coinBudget: number;
    swipeDuels: number;
    active: boolean;
  }> = { ...data };

  if (data.slug !== undefined) {
    const slug = normalizeEventSlug(data.slug);
    if (!isValidEventSlug(slug)) {
      throw new Error("Ungültiger Event-Slug.");
    }
    payload.slug = slug;
  }

  if (data.name !== undefined) {
    payload.name = data.name.trim();
  }

  return prisma.event.update({
    where: { id },
    data: payload,
  });
}

export async function deleteEvent(id: string): Promise<void> {
  const count = await prisma.event.count();
  if (count <= 1) {
    throw new Error("Das letzte Event kann nicht gelöscht werden.");
  }

  await prisma.event.delete({ where: { id } });
}
