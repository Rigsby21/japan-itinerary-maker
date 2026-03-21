-- AlterTable
ALTER TABLE "Itinerary" ADD COLUMN     "budgetCurrency" TEXT NOT NULL DEFAULT 'USD';

-- CreateTable
CREATE TABLE "ItineraryTravelTip" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItineraryTravelTip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItineraryBudgetLine" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "note" TEXT,

    CONSTRAINT "ItineraryBudgetLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItineraryTravelTip_itineraryId_idx" ON "ItineraryTravelTip"("itineraryId");

-- CreateIndex
CREATE INDEX "ItineraryBudgetLine_itineraryId_idx" ON "ItineraryBudgetLine"("itineraryId");

-- AddForeignKey
ALTER TABLE "ItineraryTravelTip" ADD CONSTRAINT "ItineraryTravelTip_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryBudgetLine" ADD CONSTRAINT "ItineraryBudgetLine_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
