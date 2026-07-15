-- Create Event table and migrate from single EventConfig to multi-event model.

CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "votingMode" "VotingMode" NOT NULL DEFAULT 'PODIUM',
    "coinBudget" INTEGER NOT NULL DEFAULT 10,
    "swipeDuels" INTEGER NOT NULL DEFAULT 12,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Event" ("id", "slug", "name", "votingMode", "coinBudget", "swipeDuels", "active", "updatedAt")
SELECT
    'evt_main',
    'main',
    'Hauptevent',
    "votingMode",
    "coinBudget",
    "swipeDuels",
    true,
    "updatedAt"
FROM "EventConfig"
WHERE "id" = 'default';

-- Fallback if EventConfig row missing
INSERT INTO "Event" ("id", "slug", "name", "votingMode", "coinBudget", "swipeDuels", "active", "updatedAt")
SELECT 'evt_main', 'main', 'Hauptevent', 'PODIUM', 10, 12, true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Event" WHERE "id" = 'evt_main');

ALTER TABLE "Vehicle" ADD COLUMN "eventId" TEXT;

UPDATE "Vehicle" SET "eventId" = 'evt_main' WHERE "eventId" IS NULL;

ALTER TABLE "Vehicle" ALTER COLUMN "eventId" SET NOT NULL;

ALTER TABLE "Vote" ADD COLUMN "eventId" TEXT;

UPDATE "Vote" SET "eventId" = 'evt_main' WHERE "eventId" IS NULL;

ALTER TABLE "Vote" ALTER COLUMN "eventId" SET NOT NULL;

DROP INDEX IF EXISTS "Vote_deviceToken_key";
DROP INDEX IF EXISTS "Vote_fingerprintHash_key";

CREATE UNIQUE INDEX "Vote_eventId_deviceToken_key" ON "Vote"("eventId", "deviceToken");
CREATE UNIQUE INDEX "Vote_eventId_fingerprintHash_key" ON "Vote"("eventId", "fingerprintHash");
CREATE INDEX "Vote_eventId_idx" ON "Vote"("eventId");

CREATE INDEX "Vehicle_eventId_idx" ON "Vehicle"("eventId");
CREATE INDEX "Vehicle_eventId_active_idx" ON "Vehicle"("eventId", "active");

DROP INDEX IF EXISTS "Vehicle_active_idx";

CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");
CREATE INDEX "Event_active_idx" ON "Event"("active");

ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE "EventConfig";
