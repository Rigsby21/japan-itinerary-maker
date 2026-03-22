-- CreateTable
CREATE TABLE "ItineraryCity" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ItineraryCity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ItineraryCity_itineraryId_idx" ON "ItineraryCity"("itineraryId");

ALTER TABLE "ItineraryCity" ADD CONSTRAINT "ItineraryCity_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "ItineraryStop" ADD COLUMN "cityId" TEXT,
ADD COLUMN "dayIndexInCity" INTEGER;

-- Backfill: one city per legacy (itineraryId, dayNumber)
INSERT INTO "ItineraryCity" ("id", "itineraryId", "name", "sortOrder")
SELECT
    'migcity_' || d."itineraryId" || '_' || d."dayNumber"::text,
    d."itineraryId",
    COALESCE(
        (SELECT s2.city FROM "ItineraryStop" s2
         WHERE s2."itineraryId" = d."itineraryId" AND s2."dayNumber" = d."dayNumber"
         AND s2.city IS NOT NULL AND TRIM(s2.city) <> '' LIMIT 1),
        'City (segment ' || d."dayNumber"::text || ')'
    ),
    (ROW_NUMBER() OVER (PARTITION BY d."itineraryId" ORDER BY d."dayNumber")) - 1
FROM (SELECT DISTINCT "itineraryId", "dayNumber" FROM "ItineraryStop") d;

UPDATE "ItineraryStop" SET
    "cityId" = 'migcity_' || "itineraryId" || '_' || "dayNumber"::text,
    "dayIndexInCity" = "orderIndex" + 1;

ALTER TABLE "ItineraryStop" ALTER COLUMN "cityId" SET NOT NULL;
ALTER TABLE "ItineraryStop" ALTER COLUMN "dayIndexInCity" SET NOT NULL;

ALTER TABLE "ItineraryStop" ADD CONSTRAINT "ItineraryStop_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "ItineraryCity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ItineraryStop_cityId_dayIndexInCity_key" ON "ItineraryStop"("cityId", "dayIndexInCity");

ALTER TABLE "ItineraryStop" DROP COLUMN "dayNumber";

CREATE INDEX "ItineraryStop_itineraryId_idx" ON "ItineraryStop"("itineraryId");
CREATE INDEX "ItineraryStop_cityId_idx" ON "ItineraryStop"("cityId");
