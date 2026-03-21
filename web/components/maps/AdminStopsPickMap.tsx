"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { createItineraryStopAction } from "@/lib/actions/adminItinerary";
import { englishOrdinal } from "@/lib/englishOrdinal";

export type AdminStopsPickMapStop = {
  id: string;
  lat: number | null;
  lng: number | null;
  placeName: string;
  dayNumber: number;
};

type Props = {
  itineraryId: string;
  stops: AdminStopsPickMapStop[];
};

let mapsLoaderOptionsApplied = false;

function ensureMapsLoaderOptions(apiKey: string) {
  if (!mapsLoaderOptionsApplied) {
    setOptions({ key: apiKey, v: "weekly" });
    mapsLoaderOptionsApplied = true;
  }
}

const DEFAULT_CENTER = { lat: 35.6762, lng: 139.6503 };

export function AdminStopsPickMap({ itineraryId, stops }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<google.maps.Map | null>(null);
  const stopMarkersRef = useRef<google.maps.Marker[]>([]);
  const pickMarkerRef = useRef<google.maps.Marker | null>(null);
  const dragListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  const [pickLat, setPickLat] = useState<number | null>(null);
  const [pickLng, setPickLng] = useState<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState<"failed" | null>(null);

  const pins = useMemo(
    () =>
      stops.filter(
        (s): s is AdminStopsPickMapStop & { lat: number; lng: number } =>
          s.lat != null &&
          s.lng != null &&
          Number.isFinite(s.lat) &&
          Number.isFinite(s.lng),
      ),
    [stops],
  );

  const stopsKey = useMemo(() => pins.map((p) => `${p.id}:${p.lat}:${p.lng}`).join("|"), [pins]);

  const suggestedDay = useMemo(() => {
    if (stops.length === 0) return 1;
    return Math.max(...stops.map((s) => s.dayNumber));
  }, [stops]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey || !mapRef.current) return;
    let cancelled = false;
    setMapReady(false);

    ensureMapsLoaderOptions(apiKey);
    importLibrary("maps")
      .then(() => {
        if (cancelled || !mapRef.current) return;

        for (const m of stopMarkersRef.current) m.setMap(null);
        stopMarkersRef.current = [];
        pickMarkerRef.current?.setMap(null);
        pickMarkerRef.current = null;

        const map = new google.maps.Map(mapRef.current, {
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        mapInst.current = map;

        const bounds = new google.maps.LatLngBounds();
        for (let i = 0; i < stops.length; i++) {
          const p = stops[i];
          if (
            p.lat == null ||
            p.lng == null ||
            !Number.isFinite(p.lat) ||
            !Number.isFinite(p.lng)
          ) {
            continue;
          }
          bounds.extend({ lat: p.lat, lng: p.lng });
          const ord = englishOrdinal(i + 1);
          const m = new google.maps.Marker({
            position: { lat: p.lat, lng: p.lng },
            map,
            title: `${ord} stop — ${p.placeName} (day ${p.dayNumber})`,
            label: {
              text: ord,
              color: "#ffffff",
              fontSize: ord.length > 3 ? "8px" : "9px",
              fontWeight: "700",
            },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 11,
              fillColor: "#1e3a8a",
              fillOpacity: 0.9,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });
          stopMarkersRef.current.push(m);
        }

        if (pins.length === 0) {
          map.setCenter(DEFAULT_CENTER);
          map.setZoom(10);
        } else if (pins.length === 1) {
          map.setCenter({ lat: pins[0].lat, lng: pins[0].lng });
          map.setZoom(12);
        } else {
          map.fitBounds(bounds, 48);
        }

        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          setPickLat(e.latLng.lat());
          setPickLng(e.latLng.lng());
        });

        setMapReady(true);
      })
      .catch(() => {
        if (!cancelled) setLoadError("failed");
      });

    return () => {
      cancelled = true;
      dragListenerRef.current?.remove();
      dragListenerRef.current = null;
      pickMarkerRef.current?.setMap(null);
      pickMarkerRef.current = null;
      for (const m of stopMarkersRef.current) m.setMap(null);
      stopMarkersRef.current = [];
      mapInst.current = null;
      setMapReady(false);
    };
  }, [apiKey, stopsKey]);

  useEffect(() => {
    if (!mapReady || !mapInst.current) return;
    const map = mapInst.current;

    dragListenerRef.current?.remove();
    dragListenerRef.current = null;
    pickMarkerRef.current?.setMap(null);
    pickMarkerRef.current = null;

    if (pickLat == null || pickLng == null) return;

    const m = new google.maps.Marker({
      position: { lat: pickLat, lng: pickLng },
      map,
      draggable: true,
      title: "New stop — drag to adjust",
      zIndex: 1000,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 11,
        fillColor: "#b45309",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
    });
    pickMarkerRef.current = m;
    dragListenerRef.current = m.addListener("dragend", () => {
      const pos = m.getPosition();
      if (pos) {
        setPickLat(pos.lat());
        setPickLng(pos.lng());
      }
    });

    return () => {
      dragListenerRef.current?.remove();
      dragListenerRef.current = null;
      m.setMap(null);
      if (pickMarkerRef.current === m) pickMarkerRef.current = null;
    };
  }, [mapReady, pickLat, pickLng]);

  const hasPick = pickLat != null && pickLng != null;

  if (!apiKey) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
        <p className="font-medium">Map picker needs an API key</p>
        <p className="mt-1 text-amber-900/90 dark:text-amber-100/85">
          Add <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/80">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to{" "}
          <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/80">web/.env</code>, restart the dev server, then reload.
        </p>
      </div>
    );
  }

  if (loadError === "failed") {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
        Google Maps did not load. Check the key and that the Maps JavaScript API is enabled.
      </div>
    );
  }

  return (
    <form action={createItineraryStopAction} className="flex flex-col gap-3 rounded border border-zinc-200 p-4 dark:border-zinc-800">
      <input type="hidden" name="itineraryId" value={itineraryId} />
      <input type="hidden" name="lat" value={pickLat ?? ""} />
      <input type="hidden" name="lng" value={pickLng ?? ""} />

      <div>
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Add stop</div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          Click the map to place the stop (blue pins are existing stops). Drag the orange pin to fine-tune. Then fill in the
          details and save.
        </p>
      </div>

      <div
        ref={mapRef}
        className="h-80 w-full rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
        aria-label="Pick stop location on map"
      />

      {hasPick ? (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Selected: {pickLat!.toFixed(6)}, {pickLng!.toFixed(6)}
        </p>
      ) : (
        <p className="text-xs text-amber-800 dark:text-amber-200/90">Click the map to choose coordinates for this stop.</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Day number</span>
          <input
            name="dayNumber"
            type="number"
            min={1}
            defaultValue={suggestedDay}
            required
            className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Place name</span>
          <input
            name="placeName"
            type="text"
            required
            placeholder="e.g. Senso-ji"
            className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">City (optional)</span>
          <input
            name="city"
            type="text"
            placeholder="e.g. Tokyo"
            className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Notes (optional)</span>
          <textarea
            name="notes"
            rows={2}
            placeholder="Short note for this stop…"
            className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={!hasPick}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Save stop
        </button>
        {hasPick && (
          <button
            type="button"
            className="text-sm font-medium text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            onClick={() => {
              setPickLat(null);
              setPickLng(null);
            }}
          >
            Clear pin
          </button>
        )}
      </div>
    </form>
  );
}
