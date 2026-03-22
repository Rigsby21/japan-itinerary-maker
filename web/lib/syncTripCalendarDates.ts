import type { PrismaClient } from "@/app/generated/prisma/client";

/** Add whole calendar days in UTC (matches `@db.Date` / HTML date inputs). */
export function addUtcCalendarDays(d: Date, days: number): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

/** Recompute every stop’s `calendarDate` from `tripStartDate` and trip order (city sortOrder, then day index). */
export async function syncStopCalendarDatesFromTripStart(
  prisma: PrismaClient,
  itineraryId: string,
): Promise<void> {
  const it = await prisma.itinerary.findUnique({
    where: { id: itineraryId },
    select: { tripStartDate: true },
  });
  if (!it?.tripStartDate) return;

  const stops = await prisma.itineraryStop.findMany({
    where: { itineraryId },
    orderBy: [{ city: { sortOrder: "asc" } }, { dayIndexInCity: "asc" }],
    select: { id: true },
  });

  const start = it.tripStartDate;
  const updates = stops.map((s, i) =>
    prisma.itineraryStop.update({
      where: { id: s.id },
      data: { calendarDate: addUtcCalendarDays(start, i) },
    }),
  );
  if (updates.length > 0) {
    await prisma.$transaction(updates);
  }
}

export async function clearAllStopCalendarDates(prisma: PrismaClient, itineraryId: string): Promise<void> {
  await prisma.itineraryStop.updateMany({
    where: { itineraryId },
    data: { calendarDate: null },
  });
}
