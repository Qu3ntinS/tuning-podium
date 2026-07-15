import { prisma } from "../../lib/prisma.js";
import { getEventBySlug, serializeEvent } from "../../lib/events.js";

export abstract class LeaderboardService {
  static async getSnapshot(slug: string) {
    const event = await getEventBySlug(slug);
    if (!event) {
      return null;
    }

    const [picks, stats, lastVote] = await Promise.all([
      prisma.votePick.groupBy({
        by: ["vehicleId"],
        where: { vote: { eventId: event.id } },
        _sum: { points: true },
        _count: { _all: true },
      }),
      prisma.vote.count({ where: { eventId: event.id } }),
      prisma.vote.findFirst({
        where: { eventId: event.id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    const vehicleIds = picks.map((p) => p.vehicleId);
    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: vehicleIds }, eventId: event.id },
      select: { id: true, name: true, number: true, imageUrl: true },
    });
    const vehicleById = new Map(vehicles.map((v) => [v.id, v]));

    const entries = picks
      .map((row) => {
        const vehicle = vehicleById.get(row.vehicleId);
        if (!vehicle) return null;
        return {
          vehicle,
          totalPoints: row._sum.points ?? 0,
          voteCount: row._count._all,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .sort((a, b) => b.totalPoints - a.totalPoints || b.voteCount - a.voteCount);

    return {
      event: serializeEvent(event),
      updatedAt: (lastVote?.createdAt ?? event.updatedAt).toISOString(),
      totalVotes: stats,
      votingMode: event.votingMode,
      entries,
    };
  }
}
