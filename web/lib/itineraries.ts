import { Prisma } from "@/app/generated/prisma/client";
import { getPrisma } from "@/lib/db";

export type FeaturedItineraryListItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  stopsCount: number;
  hasTravelTips: boolean;
  hasBudget: boolean;
};

/**
 * Featured list avoids `travelTips` / `budgetLines` on `Itinerary` in Prisma `select` so a stale
 * generated client (before `npx prisma generate` in `web/`) still runs. Tips/budget flags use raw SQL.
 */
export async function getFeaturedItineraries(): Promise<FeaturedItineraryListItem[]> {
  const prisma = getPrisma();
  const rows = await prisma.itinerary.findMany({
    where: { isFeatured: true, isPublic: true },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      createdAt: true,
      stops: { select: { id: true } },
    },
  });

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const hasTips = new Set<string>();
  const hasBudget = new Set<string>();

  try {
    const tipRows = await prisma.$queryRaw<Array<{ itineraryId: string }>>(
      Prisma.sql`
        SELECT DISTINCT "itineraryId"
        FROM "ItineraryTravelTip"
        WHERE "itineraryId" IN (${Prisma.join(ids)})
      `,
    );
    for (const t of tipRows) hasTips.add(t.itineraryId);
  } catch {
    /* table missing or DB not migrated */
  }

  try {
    const budgetRows = await prisma.$queryRaw<Array<{ itineraryId: string }>>(
      Prisma.sql`
        SELECT DISTINCT "itineraryId"
        FROM "ItineraryBudgetLine"
        WHERE "itineraryId" IN (${Prisma.join(ids)})
      `,
    );
    for (const b of budgetRows) hasBudget.add(b.itineraryId);
  } catch {
    /* table missing or DB not migrated */
  }

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    description: r.description,
    createdAt: r.createdAt,
    stopsCount: r.stops.length,
    hasTravelTips: hasTips.has(r.id),
    hasBudget: hasBudget.has(r.id),
  }));
}

/** Tips, budget lines, and currency via SQL so admin/public pages work even if `Itinerary` Prisma select is outdated. */
export async function loadItineraryTipsBudgetAndCurrency(itineraryId: string): Promise<{
  budgetCurrency: string;
  travelTips: Array<{ id: string; title: string; body: string; orderIndex: number }>;
  budgetLines: Array<{ id: string; category: string; amount: string; note: string | null; orderIndex: number }>;
}> {
  const prisma = getPrisma();
  let budgetCurrency = "USD";
  let travelTips: Array<{ id: string; title: string; body: string; orderIndex: number }> = [];
  let budgetLines: Array<{ id: string; category: string; amount: string; note: string | null; orderIndex: number }> =
    [];

  try {
    const cur = await prisma.$queryRaw<Array<{ budgetCurrency: string }>>(
      Prisma.sql`
        SELECT "budgetCurrency"
        FROM "Itinerary"
        WHERE id = ${itineraryId}
        LIMIT 1
      `,
    );
    if (cur[0]?.budgetCurrency) budgetCurrency = cur[0].budgetCurrency;
  } catch {
    /* missing column / DB */
  }

  try {
    travelTips = await prisma.$queryRaw(
      Prisma.sql`
        SELECT id, title, body, "orderIndex"
        FROM "ItineraryTravelTip"
        WHERE "itineraryId" = ${itineraryId}
        ORDER BY "orderIndex" ASC
      `,
    );
  } catch {
    travelTips = [];
  }

  try {
    const rawLines = await prisma.$queryRaw<
      Array<{
        id: string;
        category: string;
        amount: unknown;
        note: string | null;
        orderIndex: number;
      }>
    >(
      Prisma.sql`
        SELECT id, category, amount, note, "orderIndex"
        FROM "ItineraryBudgetLine"
        WHERE "itineraryId" = ${itineraryId}
        ORDER BY "orderIndex" ASC
      `,
    );
    budgetLines = rawLines.map((l) => ({
      id: l.id,
      category: l.category,
      amount: String(l.amount),
      note: l.note,
      orderIndex: l.orderIndex,
    }));
  } catch {
    budgetLines = [];
  }

  return { budgetCurrency, travelTips, budgetLines };
}

export type PublicItineraryDetail = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  stops: Array<{
    id: string;
    dayNumber: number;
    orderIndex: number;
    placeName: string;
    city: string | null;
    notes: string | null;
    lat: number | null;
    lng: number | null;
    pois: Array<{
      id: string;
      title: string;
      description: string | null;
      lat: number;
      lng: number;
      markerType: { id: string; name: string; colorHex: string } | null;
      photos: Array<{
        id: string;
        url: string | null;
        storagePath: string | null;
        orderIndex: number;
        caption: string | null;
      }>;
    }>;
  }>;
  budgetCurrency: string;
  travelTips: Array<{ id: string; title: string; body: string; orderIndex: number }>;
  budgetLines: Array<{ id: string; category: string; amount: string; note: string | null; orderIndex: number }>;
};

export async function getPublicItineraryBySlug(slug: string): Promise<PublicItineraryDetail | null> {
  const prisma = getPrisma();
  const itinerary = await prisma.itinerary.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      createdAt: true,
      isPublic: true,
      stops: {
        orderBy: [{ dayNumber: "asc" }, { orderIndex: "asc" }],
        select: {
          id: true,
          dayNumber: true,
          orderIndex: true,
          placeName: true,
          city: true,
          notes: true,
          lat: true,
          lng: true,
          pois: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              title: true,
              description: true,
              lat: true,
              lng: true,
              markerType: { select: { id: true, name: true, colorHex: true } },
              photos: {
                orderBy: { orderIndex: "asc" },
                select: {
                  id: true,
                  url: true,
                  storagePath: true,
                  orderIndex: true,
                  caption: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!itinerary?.isPublic) return null;

  const { budgetCurrency, travelTips, budgetLines } = await loadItineraryTipsBudgetAndCurrency(itinerary.id);

  return {
    id: itinerary.id,
    title: itinerary.title,
    slug: itinerary.slug,
    description: itinerary.description,
    createdAt: itinerary.createdAt,
    budgetCurrency,
    travelTips,
    budgetLines,
    stops: itinerary.stops,
  };
}
