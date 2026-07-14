import { getEventConfig } from "../../lib/event-config.js";
import { prisma } from "../../lib/prisma.js";
import type { LiveRevisionDto } from "./model.js";

export abstract class LiveService {
  static async getRevision(): Promise<LiveRevisionDto> {
    const [lastVote, eventConfig, vehicleAgg, totalVotes] = await Promise.all([
      prisma.vote.findFirst({
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      getEventConfig(),
      prisma.vehicle.aggregate({ _max: { updatedAt: true } }),
      prisma.vote.count(),
    ]);

    const lastVoteAt = lastVote?.createdAt.toISOString() ?? null;
    const eventConfigAt = eventConfig.updatedAt.toISOString();
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
