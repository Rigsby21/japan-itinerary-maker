"use client";

import { PoiPhotoCarousel } from "@/components/PoiPhotoCarousel";
import { DayTripRouteMap } from "@/components/maps/DayTripRouteMap";
import { useItineraryRouteTravelPrefs } from "@/components/maps/ItineraryRouteTravelContext";
import { TravelPrefCheckboxes } from "@/components/maps/TravelPrefCheckboxes";
import { publicItineraryStopElementId } from "@/components/maps/publicItineraryPoiAnchor";
import { publicDayTripPhotoUrl } from "@/lib/dayTripPhotoUrl";
import type { PublicItineraryDetail } from "@/lib/itineraries";

type Stop = PublicItineraryDetail["stops"][number];

export function PublicDayTripsSection({ stops }: { stops: Stop[] }) {
  const { prefs, setPref } = useItineraryRouteTravelPrefs();

  const stopsWithTrips = stops.filter((s) => s.dayTrips.length > 0);
  if (stopsWithTrips.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No day trips yet for this itinerary.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <TravelPrefCheckboxes prefs={prefs} setPref={setPref} compactNote />
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Routes use the same mode order as the itinerary overview (driving → buses → trains → walking). Navy circle = your
          stop; numbered pins use the same leg colors as the overview, in order.
        </p>
      </div>

      {stopsWithTrips.map((s) => (
        <section
          key={s.id}
          id={publicItineraryStopElementId(s.id)}
          className="scroll-mt-8 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Day {s.dayNumber} • Stop {s.orderIndex + 1}: {s.placeName}
          </h2>
          {s.lat == null || s.lng == null ? (
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-200/90">
              This stop needs coordinates to show day trip maps on the public page.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-6">
              {s.dayTrips.map((dt, tripIdx) => (
                <li
                  key={dt.id}
                  className="rounded-md border border-zinc-100 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/30"
                >
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Trip {tripIdx + 1}: {dt.title}
                  </h3>
                  {dt.shortDescription && (
                    <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{dt.shortDescription}</p>
                  )}
                  {dt.description && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">{dt.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {dt.durationText && <span>Duration: {dt.durationText}</span>}
                    {dt.costNote && <span>Cost: {dt.costNote}</span>}
                  </div>

                  {dt.destinations.length > 0 && (
                    <div className="mt-4">
                      <DayTripRouteMap
                        origin={{ lat: s.lat!, lng: s.lng! }}
                        destinations={dt.destinations.map((d) => ({
                          id: d.id,
                          lat: d.lat,
                          lng: d.lng,
                          placeName: d.placeName,
                          orderIndex: d.orderIndex,
                        }))}
                        travelPrefsSource="shared"
                      />
                      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
                        {dt.destinations.map((d) => (
                          <li key={d.id}>
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">{d.placeName}</span>
                            {d.notes && <span className="text-zinc-500"> — {d.notes}</span>}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {(() => {
                    const photoItems = dt.photos
                      .map((ph) => {
                        const url = publicDayTripPhotoUrl(ph);
                        if (!url) return null;
                        return { url, caption: ph.caption };
                      })
                      .filter((x): x is { url: string; caption: string | null } => x != null);
                    if (photoItems.length === 0) return null;
                    const carouselPhotos = photoItems.map((item, idx) => {
                      const caption = item.caption?.trim();
                      const label =
                        caption || (photoItems.length > 1 ? `${dt.title} (photo ${idx + 1})` : dt.title);
                      return { url: item.url, label };
                    });
                    return (
                      <div className="mt-4">
                        <PoiPhotoCarousel photos={carouselPhotos} />
                      </div>
                    );
                  })()}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
