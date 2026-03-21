"use client";

import { useEffect, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

export type ItineraryMapMarker = {
  lat: number;
  lng: number;
  title: string;
  kind: "stop" | "poi";
  /** POI pin color; stops ignore this and use the default stop color */
  colorHex?: string;
  /** POI only: id passed to onPoiMarkerClick for list scroll */
  poiId?: string;
  /** Stop only: id passed to onStopMarkerClick for list scroll */
  stopId?: string;
};

export type ItineraryListMapFocusRequest = {
  lat: number;
  lng: number;
  /** Bumps when the same coordinates should focus again (e.g. repeat clicks). */
  nonce: number;
  /** When set, only the stop’s POI mini-map for this POI should react. */
  poiId?: string;
};

type Props = {
  markers: ItineraryMapMarker[];
  onPoiMarkerClick?: (poiId: string) => void;
  onStopMarkerClick?: (stopId: string) => void;
  /** When set (e.g. from a POI row click), pan/zoom the map to these coordinates. */
  listFocusRequest?: ItineraryListMapFocusRequest | null;
  /** Pixel inset passed to `fitBounds` (larger = wider framing). Default 32. */
  fitBoundsPadding?: number;
  /** Zoom when there is exactly one marker. Default 14. */
  singleMarkerZoom?: number;
  /** After `fitBounds` with 2+ markers, subtract this many zoom levels on first idle (broader view). Ignored for a single marker. Default 0. */
  initialZoomOutLevels?: number;
  /**
   * When set, clicking a POI pin or using list focus uses this zoom level instead of `currentZoom + 2`
   * (keeps every mini-map consistent when initial zoom differs per stop).
   */
  poiFocusZoom?: number;
};

let mapsLoaderOptionsApplied = false;

function ensureMapsLoaderOptions(apiKey: string) {
  if (!mapsLoaderOptionsApplied) {
    setOptions({ key: apiKey, v: "weekly" });
    mapsLoaderOptionsApplied = true;
  }
}

/** Higher zoom → lower fill opacity so pins feel lighter when you’re close in. */
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

function applyListFocusToMap(map: google.maps.Map, lat: number, lng: number, poiFocusZoom?: number) {
  map.panTo({ lat, lng });
  if (poiFocusZoom != null) {
    map.setZoom(poiFocusZoom);
  } else {
    const z = map.getZoom() ?? 12;
    map.setZoom(Math.min(z + 2, 18));
  }
}

export function ItineraryReadOnlyMap({
  markers,
  onPoiMarkerClick,
  onStopMarkerClick,
  listFocusRequest,
  fitBoundsPadding = 32,
  singleMarkerZoom = 14,
  initialZoomOutLevels = 0,
  poiFocusZoom,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const deferredListFocusRef = useRef<ItineraryListMapFocusRequest | null>(null);
  const [loadError, setLoadError] = useState<"failed" | null>(null);
  const onPoiClickRef = useRef(onPoiMarkerClick);
  onPoiClickRef.current = onPoiMarkerClick;
  const onStopClickRef = useRef(onStopMarkerClick);
  onStopClickRef.current = onStopMarkerClick;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey || markers.length === 0 || !mapRef.current) return;

    let cancelled = false;

    ensureMapsLoaderOptions(apiKey);
    importLibrary("maps")
      .then(() => {
        if (cancelled || !mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        const STOP_PIN_COLOR = "#1e3a8a";
        const POI_DEFAULT_COLOR = "#7c3aed";

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

        /** Unit square centered on (0,0); scale sets half-side in pixels (matches circle “weight” at similar values). */
        const squareIcon = (
          fillColor: string,
          scale: number,
          fillOpacity: number,
        ): google.maps.Symbol => ({
          path: "M -1,-1 L 1,-1 L 1,1 L -1,1 Z",
          scale,
          fillColor,
          fillOpacity,
          strokeColor: "#ffffff",
          strokeOpacity: strokeOpacityForFillOpacity(fillOpacity),
          strokeWeight: 2,
        });

        const bounds = new google.maps.LatLngBounds();
        const zoomOnMarkerClick = () => {
          if (poiFocusZoom != null) {
            map.setZoom(poiFocusZoom);
          } else {
            const z = map.getZoom() ?? 12;
            map.setZoom(Math.min(z + 2, 18));
          }
        };

        const markerStyles: Array<{
          marker: google.maps.Marker;
          fill: string;
          scale: number;
          shape: "circle" | "square";
        }> = [];

        const applyMarkerOpacities = () => {
          const z = map.getZoom() ?? 12;
          const fo = fillOpacityForZoom(z);
          for (const s of markerStyles) {
            const icon =
              s.shape === "square"
                ? squareIcon(s.fill, s.scale, fo)
                : circleIcon(s.fill, s.scale, fo);
            s.marker.setIcon(icon);
          }
        };

        for (const m of markers) {
          bounds.extend({ lat: m.lat, lng: m.lng });
          const isStop = m.kind === "stop";
          const fill = isStop ? STOP_PIN_COLOR : (m.colorHex ?? POI_DEFAULT_COLOR);
          const scale = isStop ? 11 : 8;
          const shape = isStop ? "circle" : "square";
          const initialFo = fillOpacityForZoom(map.getZoom() ?? 12);
          const marker = new google.maps.Marker({
            position: { lat: m.lat, lng: m.lng },
            map,
            title: m.title,
            icon:
              shape === "square"
                ? squareIcon(fill, scale, initialFo)
                : circleIcon(fill, scale, initialFo),
            zIndex: isStop ? 1 : 2,
            cursor: "pointer",
          });
          markerStyles.push({ marker, fill, scale, shape });
          marker.addListener("click", () => {
            const pos = marker.getPosition();
            if (!pos) return;
            map.panTo(pos);
            zoomOnMarkerClick();
            if (m.kind === "poi" && m.poiId) {
              onPoiClickRef.current?.(m.poiId);
            }
            if (m.kind === "stop" && m.stopId) {
              onStopClickRef.current?.(m.stopId);
            }
          });
        }

        map.addListener("zoom_changed", applyMarkerOpacities);

        if (markers.length === 1) {
          map.setCenter({ lat: markers[0].lat, lng: markers[0].lng });
          map.setZoom(singleMarkerZoom);
        } else {
          map.fitBounds(bounds, {
            top: fitBoundsPadding,
            right: fitBoundsPadding,
            bottom: fitBoundsPadding,
            left: fitBoundsPadding,
          });
        }

        // Match admin POI map: only widen after fitBounds for multiple markers (single point keeps `singleMarkerZoom`).
        if (markers.length > 1 && initialZoomOutLevels > 0) {
          google.maps.event.addListenerOnce(map, "idle", () => {
            if (cancelled) return;
            const z = map.getZoom();
            if (z != null) map.setZoom(Math.max(1, z - initialZoomOutLevels));
          });
        }

        applyMarkerOpacities();

        mapInstanceRef.current = map;
        const pending = deferredListFocusRef.current;
        if (pending) {
          applyListFocusToMap(map, pending.lat, pending.lng, poiFocusZoom);
          deferredListFocusRef.current = null;
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError("failed");
      });

    return () => {
      cancelled = true;
      mapInstanceRef.current = null;
    };
  }, [apiKey, markers, fitBoundsPadding, singleMarkerZoom, initialZoomOutLevels, poiFocusZoom]);

  useEffect(() => {
    if (listFocusRequest == null) return;
    const map = mapInstanceRef.current;
    if (map) {
      applyListFocusToMap(map, listFocusRequest.lat, listFocusRequest.lng, poiFocusZoom);
    } else {
      deferredListFocusRef.current = listFocusRequest;
    }
  }, [listFocusRequest, poiFocusZoom]);

  if (markers.length === 0) return null;

  if (!apiKey) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
        <p className="font-medium">Map preview needs an API key</p>
        <p className="mt-1 text-amber-900/90 dark:text-amber-100/85">
          Add <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/80">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>{" "}
          to <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/80">web/.env</code>, restart the dev server, and reload this page.
        </p>
      </div>
    );
  }

  if (loadError === "failed") {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
        Google Maps did not load. Confirm the key is valid and the Maps JavaScript API is enabled for your Google Cloud project.
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="h-72 w-full rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
      aria-label="Itinerary map"
    />
  );
}
