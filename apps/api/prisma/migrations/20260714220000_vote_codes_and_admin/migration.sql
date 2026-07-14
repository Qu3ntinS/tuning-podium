-- Reset voting data (dev-safe schema evolution)
DELETE FROM "VotePick";
DELETE FROM "Vote";

-- Admin accounts
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- Single-use vote codes
CREATE TABLE "VoteCode" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "batchLabel" TEXT,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoteCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VoteCode_codeHash_key" ON "VoteCode"("codeHash");
CREATE INDEX "VoteCode_usedAt_idx" ON "VoteCode"("usedAt");
CREATE INDEX "VoteCode_batchLabel_idx" ON "VoteCode"("batchLabel");

-- Vote now references a single-use code
DROP INDEX "Vote_visitorKey_key";
ALTER TABLE "Vote" DROP COLUMN "visitorKey";
ALTER TABLE "Vote" ADD COLUMN "voteCodeId" TEXT NOT NULL;
CREATE UNIQUE INDEX "Vote_voteCodeId_key" ON "Vote"("voteCodeId");
CREATE INDEX "Vote_ipHash_idx" ON "Vote"("ipHash");

ALTER TABLE "Vote" ADD CONSTRAINT "Vote_voteCodeId_fkey" FOREIGN KEY ("voteCodeId") REFERENCES "VoteCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
