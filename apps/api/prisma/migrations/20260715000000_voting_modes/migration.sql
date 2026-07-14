-- CreateEnum
CREATE TYPE "VotingMode" AS ENUM ('PODIUM', 'SWIPE', 'COINS');

-- CreateTable
CREATE TABLE "EventConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "votingMode" "VotingMode" NOT NULL DEFAULT 'PODIUM',
    "coinBudget" INTEGER NOT NULL DEFAULT 10,
    "swipeDuels" INTEGER NOT NULL DEFAULT 12,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventConfig_pkey" PRIMARY KEY ("id")
);

-- Seed default config
INSERT INTO "EventConfig" ("id", "votingMode", "coinBudget", "swipeDuels", "updatedAt")
VALUES ('default', 'PODIUM', 10, 12, CURRENT_TIMESTAMP);

-- DropIndex
DROP INDEX IF EXISTS "VotePick_voteId_rank_key";
