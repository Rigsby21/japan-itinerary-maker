import Link from "next/link";
import { notFound } from "next/navigation";
import { PoiPhotoCarousel } from "@/components/PoiPhotoCarousel";
import {
  ItineraryMapWithListFocus,
  PoiMapFocusArea,
} from "@/components/maps/ItineraryMapWithListFocus";
import type { OverviewStopPin, RoutingStopPoint } from "@/components/maps/ItineraryOverviewRouteMap";
import { StopPoiMapFilter } from "@/components/maps/StopPoiMapFilter";
import { StopPoiMiniMap } from "@/components/maps/StopPoiMiniMap";
import {
  publicItineraryPoiElementId,
  publicItineraryStopElementId,
} from "@/components/maps/publicItineraryPoiAnchor";
import type { ItineraryMapMarker } from "@/components/maps/ItineraryReadOnlyMap";
import { getPublicItineraryBySlug } from "@/lib/itineraries";
import { publicPoiPhotoUrl } from "@/lib/poiPhotoUrl";

export const dynamic = "force-dynamic";

function englishOrdinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export default async function ItineraryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const itinerary = await getPublicItineraryBySlug(slug);
  if (!itinerary) notFound();

  const mapMarkers: ItineraryMapMarker[] = [];
  const overviewStops: OverviewStopPin[] = [];

  let stopNumber = 0;
  for (const s of itinerary.stops) {
    stopNumber += 1;
    const ordinalLabel = englishOrdinal(stopNumber);
    if (s.lat != null && s.lng != null) {
      overviewStops.push({
        id: s.id,
        lat: s.lat,
        lng: s.lng,
        title: `${ordinalLabel} stop — ${s.placeName} (Day ${s.dayNumber})`,
      });
      mapMarkers.push({
        kind: "stop",
        lat: s.lat,
        lng: s.lng,
        title: `${ordinalLabel} stop — ${s.placeName} (Day ${s.dayNumber})`,
        stopId: s.id,
      });
    }
    for (const p of s.pois) {
      const typeLabel = p.markerType ? `${p.markerType.name}: ` : "";
      mapMarkers.push({
        kind: "poi",
        lat: p.lat,
        lng: p.lng,
        title: `${typeLabel}${p.title}`,
        colorHex: p.markerType?.colorHex,
        poiId: p.id,
      });
    }
  }

  const routingStops: RoutingStopPoint[] = itinerary.stops.map((s) => ({
    lat: s.lat,
    lng: s.lng,
  }));

  const mapHeader = (
    <>
      <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Route overview</h2>
      <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
        Stops appear as navy pins; colored lines follow Google Directions between consecutive stops (one color per leg).
        Choose driving, buses, trains, and/or walking above the map. Each stop below has its own POI map — use{" "}
        <span className="font-medium text-zinc-600 dark:text-zinc-300">Markers on map</span> to show or hide POIs there
        and on the mini-map. Click a stop pin to jump to that stop in the list; click POI text to zoom its stop’s POI map.
      </p>
    </>
  );

  const stopsSection =
    itinerary.stops.length === 0 ? (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">No stops added yet.</p>
    ) : (
      <ol className="flex flex-col gap-3">
        {itinerary.stops.map((s) => (
          <li
            key={s.id}
            id={publicItineraryStopElementId(s.id)}
            className="scroll-mt-8 rounded border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                Day {s.dayNumber} • Stop {s.orderIndex + 1}: {s.placeName}
              </p>
              {s.city && <p className="text-xs text-zinc-500 dark:text-zinc-500">{s.city}</p>}
            </div>
            {s.notes && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{s.notes}</p>}
            {s.pois.length > 0 && (
              <>
                <StopPoiMapFilter
                  pois={s.pois.map((p) => ({
                    id: p.id,
                    title: p.title,
                    markerType: p.markerType,
                  }))}
                />
                <StopPoiMiniMap
                  pois={s.pois.map((p) => ({
                    id: p.id,
                    lat: p.lat,
                    lng: p.lng,
                    title: p.title,
                    markerType: p.markerType,
                  }))}
                />
              <ul className="mt-3 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                {s.pois.map((p) => {
                  const photoItems = p.photos
                    .map((ph) => {
                      const url = publicPoiPhotoUrl(ph);
                      if (!url) return null;
                      return { url, caption: ph.caption };
                    })
                    .filter((x): x is { url: string; caption: string | null } => x != null);
                  const carouselPhotos = photoItems.map((item, idx) => {
                    const caption = item.caption?.trim();
                    const label =
                      caption || (photoItems.length > 1 ? `${p.title} (photo ${idx + 1})` : p.title);
                    return { url: item.url, label };
                  });
                  return (
                    <li
                      key={p.id}
                      id={publicItineraryPoiElementId(p.id)}
                      className="scroll-mt-8 flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <PoiMapFocusArea poiId={p.id} lat={p.lat} lng={p.lng}>
                          <p>
                            {p.markerType && (
                              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                [{p.markerType.name}]{" "}
                              </span>
                            )}
                            <span className="text-zinc-900 dark:text-zinc-50">{p.title}</span>
                            {p.description && (
                              <span className="text-zinc-500 dark:text-zinc-500">
                                {" "}
                                — {p.description}
                              </span>
                            )}
                          </p>
                        </PoiMapFocusArea>
                      </div>
                      {carouselPhotos.length > 0 && (
                        <div className="flex shrink-0 flex-wrap content-start sm:justify-end">
                          <PoiPhotoCarousel photos={carouselPhotos} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              </>
            )}
          </li>
        ))}
      </ol>
    );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-2xl rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{itinerary.title}</h1>
            {itinerary.description && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{itinerary.description}</p>
            )}
          </div>
          <Link href="/featured" className="text-sm font-medium text-zinc-900 underline dark:text-zinc-50">
            ← Featured
          </Link>
        </div>

        <div className="mb-6 text-xs text-zinc-500 dark:text-zinc-500">
          Created: {new Date(itinerary.createdAt).toLocaleDateString()}
        </div>

        {mapMarkers.length > 0 ? (
          <ItineraryMapWithListFocus
            markers={mapMarkers}
            overviewStops={overviewStops}
            routingStops={routingStops}
            mapHeader={mapHeader}
          >
            {stopsSection}
          </ItineraryMapWithListFocus>
        ) : (
          stopsSection
        )}
      </div>
    </div>
  );
}

