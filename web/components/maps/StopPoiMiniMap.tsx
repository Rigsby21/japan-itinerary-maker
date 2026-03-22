"use client";

import { useContext, useMemo } from "react";
import { ItineraryMapShellContext } from "@/components/maps/ItineraryMapWithListFocus";
import { ItineraryReadOnlyMap, type ItineraryMapMarker } from "@/components/maps/ItineraryReadOnlyMap";
import {
  publicItineraryPoiElementId,
  scrollPublicItineraryRowIntoView,
} from "@/components/maps/publicItineraryPoiAnchor";

export type StopPoiMiniMapPoi = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  markerType?: { id: string; name: string; colorHex?: string | null } | null;
};

type Props = {
  pois: StopPoiMiniMapPoi[];
};

function toMarkers(pois: StopPoiMiniMapPoi[]): ItineraryMapMarker[] {
  return pois.map((p) => {
    const typeLabel = p.markerType ? `${p.markerType.name}: ` : "";
    return {
      kind: "poi",
      lat: p.lat,
      lng: p.lng,
      title: `${typeLabel}${p.title}`,
      colorHex: p.markerType?.colorHex ?? undefined,
      poiId: p.id,
    };
  });
}

export function StopPoiMiniMap({ pois }: Props) {
  const ctx = useContext(ItineraryMapShellContext);

  const visiblePois = useMemo(() => {
    if (!ctx) return pois;
    return pois.filter((p) => ctx.isPoiOnMap(p.id));
  }, [pois, ctx]);

  const markers = useMemo(() => toMarkers(visiblePois), [visiblePois]);

  const listFocusRequest = ctx?.listFocusRequest ?? null;

  const focusForThisStop = useMemo(() => {
    if (!listFocusRequest?.poiId) return null;
    return pois.some((p) => p.id === listFocusRequest.poiId) ? listFocusRequest : null;
  }, [listFocusRequest, pois]);

  if (pois.length === 0) return null;

  if (!ctx) return null;

  if (markers.length === 0) {
    return (
      <div className="mt-3 rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-4 text-center text-xs text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800/40 dark:text-zinc-400">
        No POIs shown on the map for this day. Choose one or more marker types in{" "}
        <span className="font-medium text-zinc-800 dark:text-zinc-200">Marker types on map</span> below.
      </div>
    );
  }

  return (
    <div className="mt-3">
      <p className="mb-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">POIs on map (this day)</p>
      <ItineraryReadOnlyMap
        markers={markers}
        listFocusRequest={focusForThisStop}
        fitBoundsPadding={64}
        singleMarkerZoom={12}
        initialZoomOutLevels={1}
        poiFocusZoom={16}
        onPoiMarkerClick={(poiId) => {
          scrollPublicItineraryRowIntoView(publicItineraryPoiElementId(poiId));
        }}
      />
    </div>
  );
}
