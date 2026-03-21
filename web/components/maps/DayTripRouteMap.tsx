"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useItineraryRouteTravelPrefs } from "@/components/maps/ItineraryRouteTravelContext";
import { TravelPrefCheckboxes } from "@/components/maps/TravelPrefCheckboxes";
import type { OverviewTravelPrefs } from "@/components/maps/ItineraryRouteTravelContext";
import { routeLegWithDirectionsService } from "@/lib/googleDirectionsRouting";
import {
  ITINERARY_ROUTE_LEG_COLORS,
  ITINERARY_STOP_PIN_COLOR,
  fillOpacityForZoom,
  itineraryDayTripDestLabel,
  itineraryMapCircleIcon,
} from "@/lib/itineraryMapVisuals";

let mapsLoaderOptionsApplied = false;

function ensureMapsLoaderOptions(apiKey: string) {
  if (!mapsLoaderOptionsApplied) {
    setOptions({ key: apiKey, v: "weekly" });
    mapsLoaderOptionsApplied = true;
  }
}

export type DayTripRouteMapDestination = {
  id: string;
  lat: number;
  lng: number;
  placeName: string;
  orderIndex: number;
};

type Props = {
  origin: { lat: number; lng: number };
  /** Ordered: first leg origin→destinations[0], then chained */
  destinations: DayTripRouteMapDestination[];
  /** Use the same travel prefs as the public itinerary overview (requires provider). */
  travelPrefsSource?: "shared" | "local";
  /** When `travelPrefsSource` is local, initial checkboxes state */
  className?: string;
};

function useTravelPrefsPair(source: "shared" | "local"): {
  prefs: OverviewTravelPrefs;
  setPref: (k: keyof OverviewTravelPrefs, v: boolean) => void;
} {
  const shared = useItineraryRouteTravelPrefs();
  const [localPrefs, setLocalPrefs] = useState<OverviewTravelPrefs>({
    driving: true,
    bus: true,
    train: true,
    walking: true,
  });
  const setLocalPref = (key: keyof OverviewTravelPrefs, on: boolean) => {
    setLocalPrefs((m) => {
      const next = { ...m, [key]: on };
      const n =
        (next.driving ? 1 : 0) +
        (next.bus ? 1 : 0) +
        (next.train ? 1 : 0) +
        (next.walking ? 1 : 0);
      if (n === 0) return m;
      return next;
    });
  };
  if (source === "shared") return shared;
  return { prefs: localPrefs, setPref: setLocalPref };
}

export function DayTripRouteMap({
  origin,
  destinations,
  travelPrefsSource = "shared",
  className = "",
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const boundsRef = useRef<google.maps.LatLngBounds | null>(null);
  const [loadError, setLoadError] = useState<"failed" | null>(null);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routeNote, setRouteNote] = useState<string | null>(null);
  const { prefs: travelPrefs, setPref } = useTravelPrefsPair(travelPrefsSource);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const orderedDest = useMemo(
    () => [...destinations].sort((a, b) => a.orderIndex - b.orderIndex),
    [destinations],
  );

  const destKey = useMemo(
    () => orderedDest.map((d) => `${d.id}:${d.orderIndex}:${d.lat}:${d.lng}`).join("|"),
    [orderedDest],
  );

  /** Maps created while the container had display:none need a resize once layout is real. */
  useEffect(() => {
    const el = mapRef.current;
    if (!el || orderedDest.length === 0) return;

    const ro = new ResizeObserver(() => {
      const map = mapInstanceRef.current;
      const b = boundsRef.current;
      if (!map) return;
      const { width, height } = el.getBoundingClientRect();
      if (width < 32 || height < 32) return;
      google.maps.event.trigger(map, "resize");
      if (b && !b.isEmpty()) {
        map.fitBounds(b, { top: 36, right: 36, bottom: 36, left: 36 });
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [destKey, orderedDest.length]);

  useEffect(() => {
    if (!apiKey || orderedDest.length === 0) return;

    let cancelled = false;
    let raf1 = 0;
    let raf2 = 0;
    let zoomListener: google.maps.MapsEventListener | null = null;
    const disposables: { polylines: google.maps.Polyline[]; markers: google.maps.Marker[] } = {
      polylines: [],
      markers: [],
    };

    const legs: Array<{
      origin: google.maps.LatLngLiteral;
      destination: google.maps.LatLngLiteral;
      color: string;
    }> = [];
    let prev: google.maps.LatLngLiteral = { lat: origin.lat, lng: origin.lng };
    for (let i = 0; i < orderedDest.length; i++) {
      const d = orderedDest[i];
      legs.push({
        origin: prev,
        destination: { lat: d.lat, lng: d.lng },
        color: ITINERARY_ROUTE_LEG_COLORS[i % ITINERARY_ROUTE_LEG_COLORS.length],
      });
      prev = { lat: d.lat, lng: d.lng };
    }

    ensureMapsLoaderOptions(apiKey);

    const run = async () => {
      if (!cancelled) {
        setLoadError(null);
        setRoutesLoading(legs.length > 0);
        setRouteNote(null);
      }

      try {
        await importLibrary("maps");
        await google.maps.importLibrary("routes");
      } catch {
        if (!cancelled) {
          setLoadError("failed");
          setRoutesLoading(false);
        }
        return;
      }

      if (cancelled) return;

      const el = mapRef.current;
      if (!el) {
        if (!cancelled) setRoutesLoading(false);
        return;
      }

      const map = new google.maps.Map(el, {
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });
      mapInstanceRef.current = map;

      const markerStyles: Array<{
        marker: google.maps.Marker;
        fill: string;
        scale: number;
      }> = [];

      const applyMarkerOpacities = () => {
        const z = map.getZoom() ?? 12;
        const fo = fillOpacityForZoom(z);
        for (const s of markerStyles) {
          s.marker.setIcon(itineraryMapCircleIcon(s.fill, s.scale, fo));
        }
      };

      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: origin.lat, lng: origin.lng });

      const originScale = 12;
      const originFo = fillOpacityForZoom(map.getZoom() ?? 12);
      const originMarker = new google.maps.Marker({
        position: { lat: origin.lat, lng: origin.lng },
        map,
        title: "Start (this stop)",
        icon: itineraryMapCircleIcon(ITINERARY_STOP_PIN_COLOR, originScale, originFo),
        zIndex: 3,
      });
      disposables.markers.push(originMarker);
      markerStyles.push({ marker: originMarker, fill: ITINERARY_STOP_PIN_COLOR, scale: originScale });

      orderedDest.forEach((d, idx) => {
        bounds.extend({ lat: d.lat, lng: d.lng });
        const label = String(idx + 1);
        const legColor = ITINERARY_ROUTE_LEG_COLORS[idx % ITINERARY_ROUTE_LEG_COLORS.length];
        const destScale = 10;
        const destFo = fillOpacityForZoom(map.getZoom() ?? 12);
        const m = new google.maps.Marker({
          position: { lat: d.lat, lng: d.lng },
          map,
          title: `${label}. ${d.placeName}`,
          label: itineraryDayTripDestLabel(label),
          icon: itineraryMapCircleIcon(legColor, destScale, destFo),
          zIndex: 4,
        });
        disposables.markers.push(m);
        markerStyles.push({ marker: m, fill: legColor, scale: destScale });
      });

      zoomListener = map.addListener("zoom_changed", applyMarkerOpacities);

      const directionsService = new google.maps.DirectionsService();
      let anyRouteFailed = false;

      for (const leg of legs) {
        if (cancelled) break;
        const result = await routeLegWithDirectionsService(
          directionsService,
          leg.origin,
          leg.destination,
          travelPrefs,
          () => cancelled,
        );
        if (cancelled) break;

        if (result?.routes[0]?.overview_path) {
          const path = result.routes[0].overview_path;
          for (const p of path) bounds.extend(p);
          const poly = new google.maps.Polyline({
            path,
            strokeColor: leg.color,
            strokeOpacity: 0.92,
            strokeWeight: 5,
            map,
            zIndex: 1,
          });
          disposables.polylines.push(poly);
        } else {
          anyRouteFailed = true;
          const poly = new google.maps.Polyline({
            path: [leg.origin, leg.destination],
            strokeColor: leg.color,
            strokeOpacity: 0.55,
            strokeWeight: 3,
            geodesic: true,
            map,
            zIndex: 1,
          });
          disposables.polylines.push(poly);
          bounds.extend(leg.origin);
          bounds.extend(leg.destination);
        }
      }

      if (cancelled) return;

      boundsRef.current = bounds;
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { top: 36, right: 36, bottom: 36, left: 36 });
      } else {
        map.setCenter({ lat: origin.lat, lng: origin.lng });
        map.setZoom(12);
      }

      requestAnimationFrame(() => {
        if (cancelled || !mapInstanceRef.current) return;
        google.maps.event.trigger(mapInstanceRef.current, "resize");
        const b = boundsRef.current;
        if (b && !b.isEmpty()) {
          mapInstanceRef.current.fitBounds(b, { top: 36, right: 36, bottom: 36, left: 36 });
        }
      });

      if (anyRouteFailed) {
        setRouteNote("Some legs couldn’t be routed — lighter straight lines show those gaps.");
      }
      setRoutesLoading(false);
    };

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (!cancelled) void run();
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      if (zoomListener) google.maps.event.removeListener(zoomListener);
      mapInstanceRef.current = null;
      boundsRef.current = null;
      for (const p of disposables.polylines) p.setMap(null);
      for (const m of disposables.markers) m.setMap(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- destKey fingerprints orderedDest contents
  }, [apiKey, origin.lat, origin.lng, destKey, travelPrefs]);

  if (orderedDest.length === 0) {
    return (
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Add at least one destination to see the route on the map.
      </p>
    );
  }

  if (!apiKey) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
        Add <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to preview this map.
      </div>
    );
  }

  if (loadError === "failed") {
    return (
      <p className="text-xs text-red-700 dark:text-red-300">Map failed to load. Check your API key and Directions API.</p>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {travelPrefsSource === "local" && (
        <TravelPrefCheckboxes prefs={travelPrefs} setPref={setPref} routesLoading={routesLoading} />
      )}
      <div
        ref={mapRef}
        className="relative h-72 w-full rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
        aria-label="Day trip route map"
      />
      {routeNote && <p className="text-xs text-amber-800 dark:text-amber-200/90">{routeNote}</p>}
    </div>
  );
}
