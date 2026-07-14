-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" INTEGER,
    "imageUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "visitorKey" TEXT NOT NULL,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VotePick" (
    "id" TEXT NOT NULL,
    "voteId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,

    CONSTRAINT "VotePick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vehicle_active_idx" ON "Vehicle"("active");

-- CreateIndex
CREATE INDEX "Vehicle_number_idx" ON "Vehicle"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_visitorKey_key" ON "Vote"("visitorKey");

-- CreateIndex
CREATE INDEX "VotePick_vehicleId_idx" ON "VotePick"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "VotePick_voteId_rank_key" ON "VotePick"("voteId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "VotePick_voteId_vehicleId_key" ON "VotePick"("voteId", "vehicleId");

-- AddForeignKey
ALTER TABLE "VotePick" ADD CONSTRAINT "VotePick_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES "Vote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VotePick" ADD CONSTRAINT "VotePick_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
