import { getPrisma } from "@/lib/db";

export type FeaturedItineraryListItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  stopsCount: number;
};

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
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    description: r.description,
    createdAt: r.createdAt,
    stopsCount: r.stops.length,
  }));
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
      markerType: { name: string; colorHex: string } | null;
      photos: Array<{
        id: string;
        url: string | null;
        storagePath: string | null;
        orderIndex: number;
        caption: string | null;
      }>;
    }>;
  }>;
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
              markerType: { select: { name: true, colorHex: true } },
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
  return {
    id: itinerary.id,
    title: itinerary.title,
    slug: itinerary.slug,
    description: itinerary.description,
    createdAt: itinerary.createdAt,
    stops: itinerary.stops,
  };
}
