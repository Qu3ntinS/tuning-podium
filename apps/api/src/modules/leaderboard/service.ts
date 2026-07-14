import { getEventConfig } from "../../lib/event-config.js";
import { prisma } from "../../lib/prisma.js";

export abstract class LeaderboardService {
  static async getSnapshot() {
    const [picks, stats, eventConfig, lastVote] = await Promise.all([
      prisma.votePick.groupBy({
        by: ["vehicleId"],
        _sum: { points: true },
        _count: { _all: true },
      }),
      prisma.vote.count(),
      getEventConfig(),
      prisma.vote.findFirst({
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    const vehicleIds = picks.map((p) => p.vehicleId);
    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: vehicleIds } },
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
      updatedAt: (lastVote?.createdAt ?? eventConfig.updatedAt).toISOString(),
      totalVotes: stats,
      votingMode: eventConfig.votingMode,
      entries,
    };
  }
}
