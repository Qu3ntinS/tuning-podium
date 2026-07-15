import { prisma } from "../../lib/prisma.js";
import { getEventById } from "../../lib/events.js";

export abstract class AdminVoteService {
  static async resetVotes(eventId: string) {
    const event = await getEventById(eventId);
    if (!event) {
      return null;
    }

    const deleted = await prisma.vote.deleteMany({ where: { eventId: event.id } });
    return {
      ok: true as const,
      deletedVotes: deleted.count,
    };
  }

  static async getStats(eventId: string) {
    const event = await getEventById(eventId);
    if (!event) {
      return null;
    }

    const totalVotes = await prisma.vote.count({ where: { eventId: event.id } });
    return { totalVotes };
  }
}
