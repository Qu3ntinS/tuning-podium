-- Drop vote-code based voting
DELETE FROM "VotePick";
DELETE FROM "Vote";

ALTER TABLE "Vote" DROP CONSTRAINT IF EXISTS "Vote_voteCodeId_fkey";
DROP INDEX IF EXISTS "Vote_voteCodeId_key";
ALTER TABLE "Vote" DROP COLUMN IF EXISTS "voteCodeId";

DROP TABLE IF EXISTS "VoteCode";

ALTER TABLE "Vote" ADD COLUMN IF NOT EXISTS "deviceToken" TEXT;
ALTER TABLE "Vote" ADD COLUMN IF NOT EXISTS "fingerprintHash" TEXT;

ALTER TABLE "Vote" ALTER COLUMN "deviceToken" SET NOT NULL;
ALTER TABLE "Vote" ALTER COLUMN "fingerprintHash" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Vote_deviceToken_key" ON "Vote"("deviceToken");
CREATE UNIQUE INDEX IF NOT EXISTS "Vote_fingerprintHash_key" ON "Vote"("fingerprintHash");
