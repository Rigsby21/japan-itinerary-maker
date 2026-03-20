import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicItineraryRouteMap } from "@/components/maps/PublicItineraryRouteMap";
import {
  publicItineraryPoiElementId,
  publicItineraryStopElementId,
} from "@/components/maps/publicItineraryPoiAnchor";
import type { ItineraryMapMarker } from "@/components/maps/ItineraryReadOnlyMap";
import { getPublicItineraryBySlug } from "@/lib/itineraries";

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

  let stopNumber = 0;
  for (const s of itinerary.stops) {
    stopNumber += 1;
    const ordinalLabel = englishOrdinal(stopNumber);
    if (s.lat != null && s.lng != null) {
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

        {mapMarkers.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Route map</h2>
            <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
              Click a navy circle (stop) or colored square (POI) to scroll to that spot in the list below; hover circles for full stop titles.
            </p>
            <PublicItineraryRouteMap markers={mapMarkers} />
          </div>
        )}

        {itinerary.stops.length === 0 ? (
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
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {s.pois.map((p) => (
                      <li
                        key={p.id}
                        id={publicItineraryPoiElementId(p.id)}
                        className="scroll-mt-8"
                      >
                        {p.markerType && (
                          <span className="mr-1 font-medium text-zinc-800 dark:text-zinc-200">
                            [{p.markerType.name}]
                          </span>
                        )}
                        {p.title}
                        {p.description && (
                          <span className="text-zinc-500 dark:text-zinc-500"> — {p.description}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

