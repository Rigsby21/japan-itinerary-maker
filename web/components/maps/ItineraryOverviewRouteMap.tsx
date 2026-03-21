"use client";

import { useEffect, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import {
  publicItineraryStopElementId,
  scrollPublicItineraryRowIntoView,
} from "@/components/maps/publicItineraryPoiAnchor";

export type OverviewStopPin = {
  id: string;
  lat: number;
  lng: number;
  title: string;
};

export type RoutingStopPoint = {
  lat: number | null;
  lng: number | null;
};

const LEG_COLORS = [
  "#2563eb",
  "#16a34a",
  "#ca8a04",
  "#dc2626",
  "#9333ea",
  "#0891b2",
  "#c026d3",
  "#4f46e5",
];

let mapsLoaderOptionsApplied = false;

function ensureMapsLoaderOptions(apiKey: string) {
  if (!mapsLoaderOptionsApplied) {
    setOptions({ key: apiKey, v: "weekly" });
    mapsLoaderOptionsApplied = true;
  }
}

function fillOpacityForZoom(zoom: number): number {
  const fullAtOrBelow = 12;
  const fadedAtOrAbove = 18;
  const min = 0.34;
  const max = 1;
  if (zoom <= fullAtOrBelow) return max;
  if (zoom >= fadedAtOrAbove) return min;
  const t = (zoom - fullAtOrBelow) / (fadedAtOrAbove - fullAtOrBelow);
  return max - t * (max - min);
}

function strokeOpacityForFillOpacity(fillOpacity: number): number {
  return Math.min(1, 0.35 + fillOpacity * 0.65);
}

/** Checkboxes; routing tries modes in order until one succeeds: driving → buses → trains → walking. */
export type OverviewTravelPrefs = {
  driving: boolean;
  bus: boolean;
  train: boolean;
  walking: boolean;
};

function countTravelPrefsOn(p: OverviewTravelPrefs): number {
  return (p.driving ? 1 : 0) + (p.bus ? 1 : 0) + (p.train ? 1 : 0) + (p.walking ? 1 : 0);
}

type Props = {
  stops: OverviewStopPin[];
  /** Full itinerary order; legs are drawn between consecutive entries that both have coordinates. */
  routingStops: RoutingStopPoint[];
};

function buildOverviewLegs(routingStops: RoutingStopPoint[]): Array<{
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
  color: string;
}> {
  const legs: Array<{
    origin: google.maps.LatLngLiteral;
    destination: google.maps.LatLngLiteral;
    color: string;
  }> = [];
  let colorIdx = 0;
  for (let i = 0; i < routingStops.length - 1; i++) {
    const a = routingStops[i];
    const b = routingStops[i + 1];
    if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) continue;
    legs.push({
      origin: { lat: a.lat, lng: a.lng },
      destination: { lat: b.lat, lng: b.lng },
      color: LEG_COLORS[colorIdx % LEG_COLORS.length],
    });
    colorIdx += 1;
  }
  return legs;
}

export function ItineraryOverviewRouteMap({ stops, routingStops }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState<"failed" | null>(null);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routeNote, setRouteNote] = useState<string | null>(null);
  const [travelPrefs, setTravelPrefs] = useState<OverviewTravelPrefs>({
    driving: true,
    bus: true,
    train: true,
    walking: true,
  });

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const setPref = (key: keyof OverviewTravelPrefs, on: boolean) => {
    setTravelPrefs((m) => {
      const next = { ...m, [key]: on };
      if (countTravelPrefsOn(next) === 0) return m;
      return next;
    });
  };

  useEffect(() => {
    if (!apiKey || stops.length === 0 || !mapRef.current) return;

    let cancelled = false;
    const disposables: { polylines: google.maps.Polyline[]; markers: google.maps.Marker[] } = {
      polylines: [],
      markers: [],
    };

    const legs = buildOverviewLegs(routingStops);

    ensureMapsLoaderOptions(apiKey);

    const run = async () => {
      if (!cancelled) {
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

      if (cancelled || !mapRef.current) {
        if (!cancelled) setRoutesLoading(false);
        return;
      }

      const map = new google.maps.Map(mapRef.current, {
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      const STOP_PIN_COLOR = "#1e3a8a";
      const circleIcon = (
        fillColor: string,
        scale: number,
        fillOpacity: number,
      ): google.maps.Symbol => ({
        path: google.maps.SymbolPath.CIRCLE,
        scale,
        fillColor,
        fillOpacity,
        strokeColor: "#ffffff",
        strokeOpacity: strokeOpacityForFillOpacity(fillOpacity),
        strokeWeight: 2,
      });

      const markerStyles: Array<{
        marker: google.maps.Marker;
        fill: string;
        scale: number;
      }> = [];

      const applyMarkerOpacities = () => {
        const z = map.getZoom() ?? 12;
        const fo = fillOpacityForZoom(z);
        for (const s of markerStyles) {
          s.marker.setIcon(circleIcon(s.fill, s.scale, fo));
        }
      };

      const bounds = new google.maps.LatLngBounds();
      for (const s of stops) {
        if (cancelled) break;
        bounds.extend({ lat: s.lat, lng: s.lng });
        const scale = 11;
        const initialFo = fillOpacityForZoom(map.getZoom() ?? 12);
        const marker = new google.maps.Marker({
          position: { lat: s.lat, lng: s.lng },
          map,
          title: s.title,
          icon: circleIcon(STOP_PIN_COLOR, scale, initialFo),
          zIndex: 3,
          cursor: "pointer",
        });
        disposables.markers.push(marker);
        markerStyles.push({ marker, fill: STOP_PIN_COLOR, scale });
        marker.addListener("click", () => {
          const pos = marker.getPosition();
          if (!pos) return;
          map.panTo(pos);
          const z = map.getZoom() ?? 12;
          map.setZoom(Math.min(z + 2, 18));
          scrollPublicItineraryRowIntoView(publicItineraryStopElementId(s.id));
        });
      }

      map.addListener("zoom_changed", applyMarkerOpacities);

      const directionsService = new google.maps.DirectionsService();
      let anyRouteFailed = false;

      const requestRoute = (
        origin: google.maps.LatLngLiteral,
        destination: google.maps.LatLngLiteral,
        travelMode: google.maps.TravelMode,
        transitOptions?: google.maps.TransitOptions,
      ): Promise<google.maps.DirectionsResult | null> =>
        new Promise((resolve) => {
          const request: google.maps.DirectionsRequest = {
            origin,
            destination,
            travelMode,
            region: "jp",
          };
          if (transitOptions && travelMode === google.maps.TravelMode.TRANSIT) {
            request.transitOptions = transitOptions;
          }
          directionsService.route(request, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) resolve(result);
            else resolve(null);
          });
        });

      const tryLegRoute = async (
        origin: google.maps.LatLngLiteral,
        destination: google.maps.LatLngLiteral,
      ): Promise<google.maps.DirectionsResult | null> => {
        const p = travelPrefs;
        const trainModes = [
          google.maps.TransitMode.TRAIN,
          google.maps.TransitMode.SUBWAY,
          google.maps.TransitMode.RAIL,
          google.maps.TransitMode.TRAM,
        ];
        const busModes = [google.maps.TransitMode.BUS];

        const attempts: Array<{
          mode: google.maps.TravelMode;
          transitOptions?: google.maps.TransitOptions;
        }> = [];
        if (p.driving) {
          attempts.push({ mode: google.maps.TravelMode.DRIVING });
        }
        if (p.bus) {
          attempts.push({
            mode: google.maps.TravelMode.TRANSIT,
            transitOptions: { modes: busModes },
          });
        }
        if (p.train) {
          attempts.push({
            mode: google.maps.TravelMode.TRANSIT,
            transitOptions: { modes: trainModes },
          });
        }
        if (p.walking) {
          attempts.push({ mode: google.maps.TravelMode.WALKING });
        }

        for (const a of attempts) {
          if (cancelled) return null;
          const r = await requestRoute(origin, destination, a.mode, a.transitOptions);
          if (r) return r;
        }
        return null;
      };

      for (const leg of legs) {
        if (cancelled) break;
        const result = await tryLegRoute(leg.origin, leg.destination);

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
            zIndex: 0,
          });
          disposables.polylines.push(poly);
          bounds.extend(leg.origin);
          bounds.extend(leg.destination);
        }
      }

      if (cancelled) return;

      if (stops.length === 1 && legs.length === 0) {
        map.setCenter({ lat: stops[0].lat, lng: stops[0].lng });
        map.setZoom(13);
      } else if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
      }
      applyMarkerOpacities();
      if (anyRouteFailed) {
        setRouteNote("Some legs couldn’t be routed — lighter straight lines show those gaps.");
      }
      setRoutesLoading(false);
    };

    void run();

    return () => {
      cancelled = true;
      for (const p of disposables.polylines) p.setMap(null);
      for (const m of disposables.markers) m.setMap(null);
      disposables.polylines.length = 0;
      disposables.markers.length = 0;
    };
  }, [apiKey, stops, routingStops, travelPrefs]);

  if (stops.length === 0) return null;

  if (!apiKey) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
        <p className="font-medium">Map preview needs an API key</p>
        <p className="mt-1 text-amber-900/90 dark:text-amber-100/85">
          Add <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/80">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to{" "}
          <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/80">web/.env</code>, enable the{" "}
          <strong>Directions API</strong> for your Google Cloud project, restart the dev server, and reload.
        </p>
      </div>
    );
  }

  if (loadError === "failed") {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
        Google Maps or Directions did not load. Confirm the key is valid and the Maps JavaScript API and Directions API
        are enabled.
      </div>
    );
  }

  const legsCount = buildOverviewLegs(routingStops).length;

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/40">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-medium text-zinc-800 dark:text-zinc-200">Travel preference</span>
        <label className="flex cursor-pointer items-center gap-2 text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={travelPrefs.driving}
            onChange={(e) => setPref("driving", e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-900"
          />
          Driving
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={travelPrefs.bus}
            onChange={(e) => setPref("bus", e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-900"
          />
          Buses
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={travelPrefs.train}
            onChange={(e) => setPref("train", e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-900"
          />
          Trains
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={travelPrefs.walking}
            onChange={(e) => setPref("walking", e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-900"
          />
          Walking
        </label>
        {routesLoading && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Updating routes…</span>
        )}
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          At least one option must stay selected so the map can route between stops.
        </p>
      </div>

      <div
        ref={mapRef}
        className="relative h-72 w-full rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
        aria-label="Itinerary overview map"
      />

      {stops.length === 1 && legsCount === 0 && (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Add another stop with a location to see directions between stops. Each leg uses the next color in the sequence
          on the map.
        </p>
      )}

      {routeNote && <p className="text-xs text-amber-800 dark:text-amber-200/90">{routeNote}</p>}

      {legsCount > 1 && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Each colored segment is one leg to the next stop. For each leg we try your selected modes in order:{" "}
          <span className="font-medium text-zinc-600 dark:text-zinc-300">driving → buses → trains → walking</span>{" "}
          (skipping any you turned off). Buses and trains use Google transit with preferred vehicle types; exact lines
          still depend on what Google returns.
        </p>
      )}
    </div>
  );
}
