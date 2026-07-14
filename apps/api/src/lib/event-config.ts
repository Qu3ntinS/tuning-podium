import type { EventConfig, VotingMode } from "@prisma/client";
import { prisma } from "./prisma.js";

export const EVENT_CONFIG_ID = "default";

export type EventSettings = Pick<EventConfig, "votingMode" | "coinBudget" | "swipeDuels">;

export function serializeEventConfig(config: EventConfig) {
  return {
    votingMode: config.votingMode,
    coinBudget: config.coinBudget,
    swipeDuels: config.swipeDuels,
    updatedAt: config.updatedAt.toISOString(),
  };
}

export async function getEventConfig(): Promise<EventConfig> {
  return prisma.eventConfig.upsert({
    where: { id: EVENT_CONFIG_ID },
    create: { id: EVENT_CONFIG_ID },
    update: {},
  });
}

export async function updateEventConfig(data: Partial<{
  votingMode: VotingMode;
  coinBudget: number;
  swipeDuels: number;
}>): Promise<EventConfig> {
  await getEventConfig();
  return prisma.eventConfig.update({
    where: { id: EVENT_CONFIG_ID },
    data,
  });
}
