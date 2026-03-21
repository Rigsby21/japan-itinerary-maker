-- CreateTable
CREATE TABLE "DayTrip" (
    "id" TEXT NOT NULL,
    "stopId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "shortDescription" TEXT,
    "description" TEXT,
    "durationText" TEXT,
    "costNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DayTrip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayTripDestination" (
    "id" TEXT NOT NULL,
    "dayTripId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "placeName" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,

    CONSTRAINT "DayTripDestination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayTripPhoto" (
    "id" TEXT NOT NULL,
    "dayTripId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "url" TEXT,
    "storagePath" TEXT,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DayTripPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DayTrip_stopId_idx" ON "DayTrip"("stopId");

-- CreateIndex
CREATE INDEX "DayTripDestination_dayTripId_idx" ON "DayTripDestination"("dayTripId");

-- CreateIndex
CREATE INDEX "DayTripPhoto_dayTripId_idx" ON "DayTripPhoto"("dayTripId");

-- AddForeignKey
ALTER TABLE "DayTrip" ADD CONSTRAINT "DayTrip_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "ItineraryStop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DayTripDestination" ADD CONSTRAINT "DayTripDestination_dayTripId_fkey" FOREIGN KEY ("dayTripId") REFERENCES "DayTrip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DayTripPhoto" ADD CONSTRAINT "DayTripPhoto_dayTripId_fkey" FOREIGN KEY ("dayTripId") REFERENCES "DayTrip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
