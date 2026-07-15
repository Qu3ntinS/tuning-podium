import { status } from "elysia";
import type { VotingMode } from "@prisma/client";
import {
  createEvent,
  deleteEvent,
  getEventById,
  getEventBySlug,
  listEvents,
  serializeEvent,
  updateEvent,
} from "../../lib/events.js";

export abstract class EventService {
  static async getPublicBySlug(slug: string) {
    const event = await getEventBySlug(slug);
    if (!event) {
      return status(404, { error: "Event nicht gefunden." });
    }
    return { event: serializeEvent(event) };
  }

  static async listAdmin() {
    const events = await listEvents();
    return { events: events.map(serializeEvent) };
  }

  static async getAdminById(id: string) {
    const event = await getEventById(id);
    if (!event) {
      return status(404, { error: "Event nicht gefunden." });
    }
    return { event: serializeEvent(event) };
  }

  static async create(data: { name: string; slug: string }) {
    try {
      const event = await createEvent(data);
      return status(201, { event: serializeEvent(event) });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Unique constraint")) {
        return status(409, { error: "Dieser Event-Slug ist bereits vergeben." });
      }
      if (error instanceof Error) {
        return status(400, { error: error.message });
      }
      return status(400, { error: "Event konnte nicht erstellt werden." });
    }
  }

  static async update(
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      votingMode: VotingMode;
      coinBudget: number;
      swipeDuels: number;
      active: boolean;
    }>,
  ) {
    try {
      const event = await updateEvent(id, data);
      return { event: serializeEvent(event) };
    } catch (error) {
      if (error instanceof Error && error.message.includes("Unique constraint")) {
        return status(409, { error: "Dieser Event-Slug ist bereits vergeben." });
      }
      if (error instanceof Error) {
        return status(400, { error: error.message });
      }
      return status(404, { error: "Event nicht gefunden." });
    }
  }

  static async remove(id: string) {
    try {
      await deleteEvent(id);
      return { ok: true as const };
    } catch (error) {
      if (error instanceof Error) {
        return status(400, { error: error.message });
      }
      return status(404, { error: "Event nicht gefunden." });
    }
  }
}
