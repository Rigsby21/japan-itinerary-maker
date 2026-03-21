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
import type { ItineraryListMapFocusRequest, ItineraryMapMarker } from "@/components/maps/ItineraryReadOnlyMap";
import {
  ItineraryOverviewRouteMap,
  type OverviewStopPin,
  type RoutingStopPoint,
} from "@/components/maps/ItineraryOverviewRouteMap";

export type ItineraryMapShellContextValue = {
  focusOnCoords: (lat: number, lng: number, poiId?: string) => void;
  listFocusRequest: ItineraryListMapFocusRequest | null;
  isPoiOnMap: (poiId: string) => boolean;
  setPoiOnMap: (poiId: string, visible: boolean) => void;
  setManyPoiOnMap: (poiIds: string[], visible: boolean) => void;
};

export const ItineraryMapShellContext = createContext<ItineraryMapShellContextValue | null>(null);

export function PoiMapFocusArea({
  lat,
  lng,
  poiId,
  children,
}: {
  lat: number;
  lng: number;
  /** When set, the stop POI mini-map for this stop can pan/zoom to this POI. */
  poiId?: string;
  children: ReactNode;
}) {
  const ctx = useContext(ItineraryMapShellContext);
  const focusOn = ctx?.focusOnCoords ?? (() => {});
  return (
    <button
      type="button"
      className="w-full rounded-md text-left transition-colors hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:hover:bg-zinc-800/50 dark:focus-visible:ring-zinc-500"
      onClick={() => focusOn(lat, lng, poiId)}
    >
      {children}
    </button>
  );
}

type ShellProps = {
  markers: ItineraryMapMarker[];
  overviewStops: OverviewStopPin[];
  routingStops: RoutingStopPoint[];
  mapHeader: ReactNode;
  children: ReactNode;
};

/** Wraps the overview route map, POI visibility, and list interactions for the public itinerary page. */
export function ItineraryMapWithListFocus({
  markers,
  overviewStops,
  routingStops,
  mapHeader,
  children,
}: ShellProps) {
  const [listFocusRequest, setListFocusRequest] = useState<ItineraryListMapFocusRequest | null>(null);

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

  const focusOnCoords = useCallback((lat: number, lng: number, poiId?: string) => {
    setListFocusRequest({ lat, lng, nonce: Date.now(), poiId });
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

  const shellValue = useMemo<ItineraryMapShellContextValue>(
    () => ({
      focusOnCoords,
      listFocusRequest,
      isPoiOnMap: (poiId: string) => visiblePoiIds.has(poiId),
      setPoiOnMap,
      setManyPoiOnMap,
    }),
    [focusOnCoords, listFocusRequest, visiblePoiIds, setPoiOnMap, setManyPoiOnMap],
  );

  return (
    <ItineraryMapShellContext.Provider value={shellValue}>
      <div className="mb-6">
        {mapHeader}
        {overviewStops.length > 0 ? (
          <ItineraryOverviewRouteMap stops={overviewStops} routingStops={routingStops} />
        ) : (
          <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-400">
            Add coordinates to stops to see the route overview with directions between them. POI maps below still work when
            stops have places to visit.
          </p>
        )}
      </div>
      {children}
    </ItineraryMapShellContext.Provider>
  );
}
