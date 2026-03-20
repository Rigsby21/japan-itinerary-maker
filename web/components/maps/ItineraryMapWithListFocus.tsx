"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ItineraryMapMarker } from "@/components/maps/ItineraryReadOnlyMap";
import { PublicItineraryRouteMap } from "@/components/maps/PublicItineraryRouteMap";

export type ItineraryMapShellContextValue = {
  focusOnCoords: (lat: number, lng: number) => void;
  isPoiOnMap: (poiId: string) => boolean;
  setPoiOnMap: (poiId: string, visible: boolean) => void;
  setManyPoiOnMap: (poiIds: string[], visible: boolean) => void;
};

export const ItineraryMapShellContext = createContext<ItineraryMapShellContextValue | null>(null);

export function PoiMapFocusArea({
  lat,
  lng,
  children,
}: {
  lat: number;
  lng: number;
  children: ReactNode;
}) {
  const ctx = useContext(ItineraryMapShellContext);
  const focusOn = ctx?.focusOnCoords ?? (() => {});
  return (
    <button
      type="button"
      className="w-full rounded-md text-left transition-colors hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:hover:bg-zinc-800/50 dark:focus-visible:ring-zinc-500"
      onClick={() => focusOn(lat, lng)}
    >
      {children}
    </button>
  );
}

type ShellProps = {
  markers: ItineraryMapMarker[];
  mapHeader: ReactNode;
  children: ReactNode;
};

/** Wraps the route map and itinerary list so POI rows can pan/zoom the map via `PoiMapFocusArea`. */
export function ItineraryMapWithListFocus({ markers, mapHeader, children }: ShellProps) {
  const [listFocusRequest, setListFocusRequest] = useState<{
    lat: number;
    lng: number;
    nonce: number;
  } | null>(null);

  const allPoiIds = useMemo(
    () =>
      markers
        .filter((m): m is ItineraryMapMarker & { poiId: string } => m.kind === "poi" && m.poiId != null)
        .map((m) => m.poiId),
    [markers],
  );

  const allPoiIdsKey = useMemo(() => [...allPoiIds].sort().join("\0"), [allPoiIds]);

  const [visiblePoiIds, setVisiblePoiIds] = useState<Set<string>>(() => new Set(allPoiIds));

  useEffect(() => {
    setVisiblePoiIds(new Set(allPoiIds));
  }, [allPoiIdsKey, allPoiIds]);

  const focusOnCoords = useCallback((lat: number, lng: number) => {
    setListFocusRequest({ lat, lng, nonce: Date.now() });
  }, []);

  const setPoiOnMap = useCallback((poiId: string, visible: boolean) => {
    setVisiblePoiIds((prev) => {
      const next = new Set(prev);
      if (visible) next.add(poiId);
      else next.delete(poiId);
      return next;
    });
  }, []);

  const setManyPoiOnMap = useCallback((poiIds: string[], visible: boolean) => {
    setVisiblePoiIds((prev) => {
      const next = new Set(prev);
      for (const id of poiIds) {
        if (visible) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  const markersForMap = useMemo(
    () =>
      markers.filter(
        (m) => m.kind === "stop" || (m.poiId != null && visiblePoiIds.has(m.poiId)),
      ),
    [markers, visiblePoiIds],
  );

  const shellValue = useMemo<ItineraryMapShellContextValue>(
    () => ({
      focusOnCoords,
      isPoiOnMap: (poiId: string) => visiblePoiIds.has(poiId),
      setPoiOnMap,
      setManyPoiOnMap,
    }),
    [focusOnCoords, visiblePoiIds, setPoiOnMap, setManyPoiOnMap],
  );

  return (
    <ItineraryMapShellContext.Provider value={shellValue}>
      <div className="mb-6">
        {mapHeader}
        <PublicItineraryRouteMap markers={markersForMap} listFocusRequest={listFocusRequest} />
      </div>
      {children}
    </ItineraryMapShellContext.Provider>
  );
}
