"use client";

import { useContext, useMemo } from "react";
import { PoiPhotoCarousel } from "@/components/PoiPhotoCarousel";
import { ItineraryMapShellContext, PoiMapFocusArea } from "@/components/maps/ItineraryMapWithListFocus";
import { publicItineraryPoiElementId } from "@/components/maps/publicItineraryPoiAnchor";
import { StopPoiMapFilter, type StopPoiMapFilterPoi } from "@/components/maps/StopPoiMapFilter";
import { StopPoiMiniMap, type StopPoiMiniMapPoi } from "@/components/maps/StopPoiMiniMap";
import {
  StopPoiAndDayTripMap,
  type StopPoiAndDayTripMapDayTrip,
} from "@/components/maps/StopPoiAndDayTripMap";
import { publicPoiPhotoUrl } from "@/lib/poiPhotoUrl";

export type StopPoiBlockPoi = {
  id: string;
  title: string;
  description: string | null;
  lat: number;
  lng: number;
  markerType: { id: string; name: string; colorHex: string } | null;
  photos: Array<{
    url: string | null;
    storagePath: string | null;
    caption: string | null;
  }>;
};

type Props = {
  pois: StopPoiBlockPoi[];
  /** When set and day trips have destinations, the map draws one route from this pin to each trip’s first stop only. */
  stopBase?: { lat: number; lng: number; placeName: string } | null;
  dayTrips?: StopPoiAndDayTripMapDayTrip[];
};

function dayTripsHaveDestinations(trips: StopPoiAndDayTripMapDayTrip[] | undefined): boolean {
  return (trips ?? []).some((t) => t.destinations.length > 0);
}

export function StopPoiBlock({ pois, stopBase, dayTrips }: Props) {
  const ctx = useContext(ItineraryMapShellContext);

  const filterPois: StopPoiMapFilterPoi[] = useMemo(
    () =>
      pois.map((p) => ({
        id: p.id,
        title: p.title,
        markerType: p.markerType
          ? { id: p.markerType.id, name: p.markerType.name, colorHex: p.markerType.colorHex }
          : null,
      })),
    [pois],
  );

  const miniPois: StopPoiMiniMapPoi[] = useMemo(
    () =>
      pois.map((p) => ({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        title: p.title,
        markerType: p.markerType
          ? { id: p.markerType.id, name: p.markerType.name, colorHex: p.markerType.colorHex }
          : null,
      })),
    [pois],
  );

  const visiblePois = useMemo(() => {
    if (!ctx) return pois;
    return pois.filter((p) => ctx.isPoiOnMap(p.id));
  }, [pois, ctx]);

  const useDayTripLayer =
    stopBase != null && dayTrips != null && dayTripsHaveDestinations(dayTrips);

  if (pois.length === 0 && !useDayTripLayer) return null;

  return (
    <>
      {useDayTripLayer ? (
        <StopPoiAndDayTripMap stopOrigin={stopBase!} dayTrips={dayTrips!} pois={miniPois} />
      ) : (
        <StopPoiMiniMap pois={miniPois} />
      )}
      {filterPois.length > 0 && <StopPoiMapFilter pois={filterPois} />}
      {ctx && pois.length > 0 && visiblePois.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          No POIs match the selected marker types. Turn types back on below the map to see details and photos.
        </p>
      ) : (
        <ul className="mt-3 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          {visiblePois.map((p) => {
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
      )}
    </>
  );
}
