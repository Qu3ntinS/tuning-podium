import type { VotingMode } from "@prisma/client";
import { getEventConfig, serializeEventConfig, updateEventConfig } from "../../lib/event-config.js";

export abstract class EventService {
  static async getPublicConfig() {
    const config = await getEventConfig();
    return { config: serializeEventConfig(config) };
  }

  static async updateConfig(data: Partial<{
    votingMode: VotingMode;
    coinBudget: number;
    swipeDuels: number;
  }>) {
    const config = await updateEventConfig(data);
    return { config: serializeEventConfig(config) };
  }
}
