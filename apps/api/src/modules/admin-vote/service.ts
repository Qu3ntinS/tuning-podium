import { prisma } from "../../lib/prisma.js";

export abstract class AdminVoteService {
  static async resetVotes() {
    const deleted = await prisma.vote.deleteMany();
    return {
      ok: true as const,
      deletedVotes: deleted.count,
    };
  }

  static async getStats() {
    const totalVotes = await prisma.vote.count();
    return { totalVotes };
  }
}
