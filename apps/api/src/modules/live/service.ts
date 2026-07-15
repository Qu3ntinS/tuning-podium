import { prisma } from "../../lib/prisma.js";
import { getEventBySlug } from "../../lib/events.js";
import type { LiveRevisionDto } from "./model.js";

export abstract class LiveService {
  static async getRevision(slug: string): Promise<LiveRevisionDto | null> {
    const event = await getEventBySlug(slug);
    if (!event) {
      return null;
    }

    const [lastVote, vehicleAgg, totalVotes] = await Promise.all([
      prisma.vote.findFirst({
        where: { eventId: event.id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      prisma.vehicle.aggregate({
        where: { eventId: event.id },
        _max: { updatedAt: true },
      }),
      prisma.vote.count({ where: { eventId: event.id } }),
    ]);

    const lastVoteAt = lastVote?.createdAt.toISOString() ?? null;
    const eventConfigAt = event.updatedAt.toISOString();
    const vehiclesAt = vehicleAgg._max.updatedAt?.toISOString() ?? null;

    return {
      revision: [lastVoteAt, eventConfigAt, vehiclesAt, String(totalVotes)].join("|"),
      totalVotes,
      lastVoteAt,
      eventConfigAt,
      vehiclesAt,
    };
  }
}
