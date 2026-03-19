-- CreateTable
CREATE TABLE "MarkerType" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarkerType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Poi" (
    "id" TEXT NOT NULL,
    "stopId" TEXT NOT NULL,
    "markerTypeId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Poi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoiPhoto" (
    "id" TEXT NOT NULL,
    "poiId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "url" TEXT,
    "storagePath" TEXT,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PoiPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarkerType_itineraryId_name_key" ON "MarkerType"("itineraryId", "name");

-- CreateIndex
CREATE INDEX "Poi_stopId_idx" ON "Poi"("stopId");

-- CreateIndex
CREATE INDEX "Poi_markerTypeId_idx" ON "Poi"("markerTypeId");

-- CreateIndex
CREATE INDEX "PoiPhoto_poiId_idx" ON "PoiPhoto"("poiId");

-- AddForeignKey
ALTER TABLE "MarkerType" ADD CONSTRAINT "MarkerType_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poi" ADD CONSTRAINT "Poi_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "ItineraryStop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poi" ADD CONSTRAINT "Poi_markerTypeId_fkey" FOREIGN KEY ("markerTypeId") REFERENCES "MarkerType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoiPhoto" ADD CONSTRAINT "PoiPhoto_poiId_fkey" FOREIGN KEY ("poiId") REFERENCES "Poi"("id") ON DELETE CASCADE ON UPDATE CASCADE;
