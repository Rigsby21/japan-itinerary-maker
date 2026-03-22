-- CreateEnum
CREATE TYPE "ItineraryCityKind" AS ENUM ('SINGLE_STOP', 'LEGACY_MULTI_DAY');

-- AlterTable
ALTER TABLE "ItineraryCity" ADD COLUMN "kind" "ItineraryCityKind";

UPDATE "ItineraryCity" SET "kind" = 'LEGACY_MULTI_DAY';

ALTER TABLE "ItineraryCity" ALTER COLUMN "kind" SET NOT NULL;
ALTER TABLE "ItineraryCity" ALTER COLUMN "kind" SET DEFAULT 'SINGLE_STOP';
