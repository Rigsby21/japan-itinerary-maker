"use client";

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { ItineraryMapShellContext } from "@/components/maps/ItineraryMapWithListFocus";
import type { ItineraryListMapFocusRequest } from "@/components/maps/ItineraryReadOnlyMap";
import {
  publicItineraryPoiElementId,
  scrollPublicItineraryRowIntoView,
} from "@/components/maps/publicItineraryPoiAnchor";
import { useItineraryRouteTravelPrefs } from "@/components/maps/ItineraryRouteTravelContext";
import { routeLegWithDirectionsService } from "@/lib/googleDirectionsRouting";
import {
  ITINERARY_ROUTE_LEG_COLORS,
  ITINERARY_STOP_PIN_COLOR,
  fillOpacityForZoom,
  itineraryDayTripDestLabel,
  itineraryMapCircleIcon,
  strokeOpacityForFillOpacity,
} from "@/lib/itineraryMapVisuals";
import type { StopPoiMiniMapPoi } from "@/components/maps/StopPoiMiniMap";

let mapsLoaderOptionsApplied = false;

function ensureMapsLoaderOptions(apiKey: string) {
  if (!mapsLoaderOptionsApplied) {
    setOptions({ key: apiKey, v: "weekly" });
    mapsLoaderOptionsApplied = true;
  }
}

export type StopPoiAndDayTripMapDayTrip = {
  id: string;
  orderIndex: number;
  title: string;
  destinations: Array<{
    id: string;
    orderIndex: number;
    lat: number;
    lng: number;
    placeName: string;
  }>;
};

type Props = {
  stopOrigin: { lat: number; lng: number; placeName: string };
  dayTrips: StopPoiAndDayTripMapDayTrip[];
  pois: StopPoiMiniMapPoi[];
};

/** Single directions request: this day’s base → first stop of a day trip (“main” excursion pin). */
type DirectionsLeg = {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
  color: string;
};

type DestinationPin = {
  lat: number;
  lng: number;
  label: string;
  title: string;
  color: string;
  /** First stop per trip: circle + route from base. Later stops: square only, like marker POIs. */
  shape: "circle" | "square";
};

function squarePoiIcon(fillColor: string, scale: number, fillOpacity: number): google.maps.Symbol {
  return {
    path: "M -1,-1 L 1,-1 L 1,1 L -1,1 Z",
    scale,
    fillColor,
    fillOpacity,
    strokeColor: "#ffffff",
    strokeOpacity: strokeOpacityForFillOpacity(fillOpacity),
    strokeWeight: 2,
  };
}

function applyListFocus(
  map: google.maps.Map,
  req: ItineraryListMapFocusRequest,
  poiFocusZoom: number,
) {
  map.panTo({ lat: req.lat, lng: req.lng });
  map.setZoom(poiFocusZoom);
}

export function StopPoiAndDayTripMap({ stopOrigin, dayTrips, pois }: Props) {
  const ctx = useContext(ItineraryMapShellContext);
  const { prefs: travelPrefs } = useItineraryRouteTravelPrefs();

  const visiblePois = useMemo(() => {
    if (!ctx) return pois;
    return pois.filter((p) => ctx.isPoiOnMap(p.id));
  }, [pois, ctx]);

  const visiblePoiKey = useMemo(() => [...visiblePois].sort((a, b) => a.id.localeCompare(b.id)).map((p) => p.id).join("|"), [visiblePois]);

  const sortedTrips = useMemo(
    () => [...dayTrips].sort((a, b) => a.orderIndex - b.orderIndex),
    [dayTrips],
  );

  const { directionsLegs, destinationPins, destKey } = useMemo(() => {
    const legsOut: DirectionsLeg[] = [];
    const pinsOut: DestinationPin[] = [];
    const multiTrip = sortedTrips.length > 1;
    const base = { lat: stopOrigin.lat, lng: stopOrigin.lng };

    for (let tIdx = 0; tIdx < sortedTrips.length; tIdx++) {
      const trip = sortedTrips[tIdx];
      const dests = [...trip.destinations].sort((a, b) => a.orderIndex - b.orderIndex);
      const tripColor = ITINERARY_ROUTE_LEG_COLORS[tIdx % ITINERARY_ROUTE_LEG_COLORS.length];

      for (let dIdx = 0; dIdx < dests.length; dIdx++) {
        const d = dests[dIdx];
        const destLabel = multiTrip ? `${tIdx + 1}.${dIdx + 1}` : String(dIdx + 1);
        const title = `${destLabel}. ${d.placeName} (${trip.title})`;
        if (dIdx === 0) {
          legsOut.push({
            origin: base,
            destination: { lat: d.lat, lng: d.lng },
            color: tripColor,
          });
          pinsOut.push({
            lat: d.lat,
            lng: d.lng,
            label: destLabel,
            title,
            color: tripColor,
            shape: "circle",
          });
        } else {
          pinsOut.push({
            lat: d.lat,
            lng: d.lng,
            label: destLabel,
            title,
            color: tripColor,
            shape: "square",
          });
        }
      }
    }

    const destKey = sortedTrips
      .map((t) =>
        [...t.destinations]
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((d) => `${d.id}:${d.lat}:${d.lng}`)
          .join(","),
      )
      .join("|");

    return { directionsLegs: legsOut, destinationPins: pinsOut, destKey };
  }, [sortedTrips, stopOrigin.lat, stopOrigin.lng]);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const boundsRef = useRef<google.maps.LatLngBounds | null>(null);
  const deferredFocusRef = useRef<ItineraryListMapFocusRequest | null>(null);
  const [loadError, setLoadError] = useState<"failed" | null>(null);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routeNote, setRouteNote] = useState<string | null>(null);

  const listFocusRequest = ctx?.listFocusRequest ?? null;
  const focusForThisStop = useMemo(() => {
    if (!listFocusRequest?.poiId) return null;
    return pois.some((p) => p.id === listFocusRequest.poiId) ? listFocusRequest : null;
  }, [listFocusRequest, pois]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const POI_FOCUS_ZOOM = 16;
  const POI_DEFAULT_COLOR = "#7c3aed";

  useEffect(() => {
    const el = mapRef.current;
    if (!el || destinationPins.length === 0) return;

    const ro = new ResizeObserver(() => {
      const map = mapInstanceRef.current;
      const b = boundsRef.current;
      if (!map) return;
      const { width, height } = el.getBoundingClientRect();
      if (width < 32 || height < 32) return;
      google.maps.event.trigger(map, "resize");
      if (b && !b.isEmpty()) {
        map.fitBounds(b, { top: 48, right: 48, bottom: 48, left: 48 });
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [destKey, destinationPins.length]);

  useEffect(() => {
    if (!apiKey || destinationPins.length === 0) return;

    let cancelled = false;
    let raf1 = 0;
    let raf2 = 0;
    let zoomListener: google.maps.MapsEventListener | null = null;
    const disposables: { polylines: google.maps.Polyline[]; markers: google.maps.Marker[] } = {
      polylines: [],
      markers: [],
    };

    ensureMapsLoaderOptions(apiKey);

    const run = async () => {
      if (!cancelled) {
        setLoadError(null);
        setRoutesLoading(directionsLegs.length > 0);
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

      const circleMarkerStyles: Array<{
        marker: google.maps.Marker;
        fill: string;
        scale: number;
      }> = [];

      const squareMarkerStyles: Array<{
        marker: google.maps.Marker;
        fill: string;
        scale: number;
      }> = [];

      const applyCircleOpacities = () => {
        const z = map.getZoom() ?? 12;
        const fo = fillOpacityForZoom(z);
        for (const s of circleMarkerStyles) {
          s.marker.setIcon(itineraryMapCircleIcon(s.fill, s.scale, fo));
        }
      };

      const applySquareOpacities = () => {
        const z = map.getZoom() ?? 12;
        const fo = fillOpacityForZoom(z);
        for (const s of squareMarkerStyles) {
          s.marker.setIcon(squarePoiIcon(s.fill, s.scale, fo));
        }
      };

      const applyAllOpacities = () => {
        applyCircleOpacities();
        applySquareOpacities();
      };

      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: stopOrigin.lat, lng: stopOrigin.lng });

      const originScale = 12;
      const originFo = fillOpacityForZoom(map.getZoom() ?? 12);
      const originMarker = new google.maps.Marker({
        position: { lat: stopOrigin.lat, lng: stopOrigin.lng },
        map,
        title: `This day — ${stopOrigin.placeName}`,
        icon: itineraryMapCircleIcon(ITINERARY_STOP_PIN_COLOR, originScale, originFo),
        zIndex: 3,
      });
      disposables.markers.push(originMarker);
      circleMarkerStyles.push({ marker: originMarker, fill: ITINERARY_STOP_PIN_COLOR, scale: originScale });

      for (const pin of destinationPins) {
        bounds.extend({ lat: pin.lat, lng: pin.lng });
        const destFo = fillOpacityForZoom(map.getZoom() ?? 12);
        if (pin.shape === "circle") {
          const destScale = 10;
          const m = new google.maps.Marker({
            position: { lat: pin.lat, lng: pin.lng },
            map,
            title: pin.title,
            label: itineraryDayTripDestLabel(pin.label),
            icon: itineraryMapCircleIcon(pin.color, destScale, destFo),
            zIndex: 4,
          });
          disposables.markers.push(m);
          circleMarkerStyles.push({ marker: m, fill: pin.color, scale: destScale });
        } else {
          const scale = 8;
          const m = new google.maps.Marker({
            position: { lat: pin.lat, lng: pin.lng },
            map,
            title: pin.title,
            label: itineraryDayTripDestLabel(pin.label),
            icon: squarePoiIcon(pin.color, scale, destFo),
            zIndex: 5,
            cursor: "default",
          });
          disposables.markers.push(m);
          squareMarkerStyles.push({ marker: m, fill: pin.color, scale });
        }
      }

      for (const p of visiblePois) {
        bounds.extend({ lat: p.lat, lng: p.lng });
        const fill = p.markerType?.colorHex ?? POI_DEFAULT_COLOR;
        const scale = 8;
        const fo = fillOpacityForZoom(map.getZoom() ?? 12);
        const typeLabel = p.markerType ? `${p.markerType.name}: ` : "";
        const marker = new google.maps.Marker({
          position: { lat: p.lat, lng: p.lng },
          map,
          title: `${typeLabel}${p.title}`,
          icon: squarePoiIcon(fill, scale, fo),
          zIndex: 5,
          cursor: "pointer",
        });
        disposables.markers.push(marker);
        squareMarkerStyles.push({ marker, fill, scale });
        marker.addListener("click", () => {
          const pos = marker.getPosition();
          if (!pos) return;
          map.panTo(pos);
          map.setZoom(POI_FOCUS_ZOOM);
          scrollPublicItineraryRowIntoView(publicItineraryPoiElementId(p.id));
        });
      }

      zoomListener = map.addListener("zoom_changed", applyAllOpacities);

      const directionsService = new google.maps.DirectionsService();
      let anyRouteFailed = false;

      for (const leg of directionsLegs) {
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
          for (const pt of path) bounds.extend(pt);
          disposables.polylines.push(
            new google.maps.Polyline({
              path,
              strokeColor: leg.color,
              strokeOpacity: 0.92,
              strokeWeight: 5,
              map,
              zIndex: 1,
            }),
          );
        } else {
          anyRouteFailed = true;
          disposables.polylines.push(
            new google.maps.Polyline({
              path: [leg.origin, leg.destination],
              strokeColor: leg.color,
              strokeOpacity: 0.55,
              strokeWeight: 3,
              geodesic: true,
              map,
              zIndex: 1,
            }),
          );
        }
      }

      if (cancelled) return;

      boundsRef.current = bounds;
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
      } else {
        map.setCenter({ lat: stopOrigin.lat, lng: stopOrigin.lng });
        map.setZoom(12);
      }

      requestAnimationFrame(() => {
        if (cancelled || !mapInstanceRef.current) return;
        google.maps.event.trigger(mapInstanceRef.current, "resize");
        const b = boundsRef.current;
        if (b && !b.isEmpty()) {
          mapInstanceRef.current.fitBounds(b, { top: 48, right: 48, bottom: 48, left: 48 });
        }
      });

      applyAllOpacities();

      if (anyRouteFailed) {
        setRouteNote("A day-trip line couldn’t be fully routed — lighter straight lines show those gaps.");
      }
      setRoutesLoading(false);

      const pending = deferredFocusRef.current;
      if (pending) {
        applyListFocus(map, pending, POI_FOCUS_ZOOM);
        deferredFocusRef.current = null;
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- visiblePoiKey fingerprints visible POI set
  }, [apiKey, stopOrigin.lat, stopOrigin.lng, stopOrigin.placeName, destKey, travelPrefs, visiblePoiKey]);

  useEffect(() => {
    if (focusForThisStop == null) return;
    const map = mapInstanceRef.current;
    if (map) {
      applyListFocus(map, focusForThisStop, POI_FOCUS_ZOOM);
    } else {
      deferredFocusRef.current = focusForThisStop;
    }
  }, [focusForThisStop]);

  if (!ctx) return null;

  if (destinationPins.length === 0) return null;

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
    <div className="mt-3 space-y-2">
      <div>
        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">This day on the map</p>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Navy circle = this day&apos;s base. One colored line runs from base to each trip&apos;s first stop (same travel
          modes as the route overview). Extra day trip stops and marker POIs are squares only — no paths between them.
          {routesLoading ? " Drawing route…" : ""}
        </p>
      </div>
      <div
        ref={mapRef}
        className="relative h-72 w-full rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
        aria-label="Day map with day trip route and POIs"
      />
      {routeNote && <p className="text-xs text-amber-800 dark:text-amber-200/90">{routeNote}</p>}
    </div>
  );
}
