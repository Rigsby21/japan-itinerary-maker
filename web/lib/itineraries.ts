import { getPrisma } from "@/lib/db";
import { publicPoiPhotoUrl } from "@/lib/poiPhotoUrl";

export type FeaturedItineraryListItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  stopsCount: number;
  /** First resolvable POI photo URL in stop → POI → photo order, for card thumbnails */
  coverImageUrl: string | null;
};

function firstCoverUrlFromStops(
  stops: Array<{
    pois: Array<{
      photos: Array<{ url: string | null; storagePath: string | null }>;
    }>;
  }>,
): string | null {
  for (const stop of stops) {
    for (const poi of stop.pois) {
      for (const photo of poi.photos) {
        const url = publicPoiPhotoUrl(photo);
        if (url) return url;
      }
    }
  }
  return null;
}

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
      stops: {
        orderBy: [{ dayNumber: "asc" }, { orderIndex: "asc" }],
        select: {
          id: true,
          pois: {
            orderBy: { createdAt: "asc" },
            select: {
              photos: {
                orderBy: { orderIndex: "asc" },
                select: { url: true, storagePath: true },
              },
            },
          },
        },
      },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    description: r.description,
    createdAt: r.createdAt,
    stopsCount: r.stops.length,
    coverImageUrl: firstCoverUrlFromStops(r.stops),
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
