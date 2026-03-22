"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import {
  updateItineraryStopLocationAction,
  updateItineraryStopLocationCoordsOnlyAction,
  updateItineraryStopsLocationBulkAction,
  updateItineraryStopsLocationBulkCoordsOnlyAction,
} from "@/lib/actions/adminItinerary";
import { clusterStopsByMapPosition } from "@/lib/clusterStopsByMapPosition";
import { englishOrdinal } from "@/lib/englishOrdinal";

export type AdminStopsPickMapStop = {
  id: string;
  lat: number | null;
  lng: number | null;
  placeName: string;
  cityName: string;
  dayIndexInCity: number;
};

type Props = {
  itineraryId: string;
  stops: AdminStopsPickMapStop[];
  /** SINGLE_STOP cities use “stop” copy; legacy multi-day uses “day”. */
  pickerLabels?: "day" | "stop";
  /** Legacy multi-day only: pick several days that share the same map pin and place fields. */
  allowBulkDayTargets?: boolean;
};

let mapsLoaderOptionsApplied = false;

function ensureMapsLoaderOptions(apiKey: string) {
  if (!mapsLoaderOptionsApplied) {
    setOptions({ key: apiKey, v: "weekly" });
    mapsLoaderOptionsApplied = true;
  }
}

const DEFAULT_CENTER = { lat: 35.6762, lng: 139.6503 };

export function AdminStopsPickMap({
  itineraryId,
  stops,
  pickerLabels = "day",
  allowBulkDayTargets = false,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<google.maps.Map | null>(null);
  const stopMarkersRef = useRef<google.maps.Marker[]>([]);
  const pickMarkerRef = useRef<google.maps.Marker | null>(null);
  const dragListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  const [pickLat, setPickLat] = useState<number | null>(null);
  const [pickLng, setPickLng] = useState<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState<"failed" | null>(null);
  const [stopId, setStopId] = useState<string>("");

  const useBulkUi = allowBulkDayTargets && stops.length > 1;

  const allStopsHaveCoordinates =
    stops.length > 0 &&
    stops.every(
      (s) =>
        s.lat != null &&
        s.lng != null &&
        Number.isFinite(s.lat) &&
        Number.isFinite(s.lng),
    );

  const saveAction = allStopsHaveCoordinates
    ? useBulkUi
      ? updateItineraryStopsLocationBulkCoordsOnlyAction
      : updateItineraryStopLocationCoordsOnlyAction
    : useBulkUi
      ? updateItineraryStopsLocationBulkAction
      : updateItineraryStopLocationAction;

  const stopIdsKey = useMemo(() => stops.map((s) => s.id).join(","), [stops]);
  const [bulkTargetIds, setBulkTargetIds] = useState<Set<string>>(() => new Set(stops.map((s) => s.id)));

  useEffect(() => {
    setBulkTargetIds(new Set(stops.map((s) => s.id)));
  }, [stopIdsKey]);

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

  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.dayIndexInCity - b.dayIndexInCity),
    [stops],
  );

  const stopsMetaKey = useMemo(
    () => stops.map((s) => `${s.id}:${s.dayIndexInCity}:${s.placeName}:${s.lat}:${s.lng}`).join("|"),
    [stops],
  );

  useEffect(() => {
    if (stops.length > 0 && !stops.some((s) => s.id === stopId)) {
      setStopId(stops[0].id);
    }
  }, [stops, stopId]);

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
        const clusters = clusterStopsByMapPosition(stops);

        clusters.forEach((cluster, ci) => {
          const ord = englishOrdinal(ci + 1);
          const { lat, lng } = cluster;
          bounds.extend({ lat, lng });
          const first = cluster.stops[0];
          const cityName = first.cityName;
          let dayOrStop: string;
          if (pickerLabels === "stop") {
            dayOrStop =
              cluster.stops.length > 1
                ? `${ord} — ${cityName} · ${cluster.stops.length} stops (same place)`
                : `${ord} — ${cityName} · Stop: ${first.placeName}`;
          } else if (cluster.stops.length > 1) {
            const days = cluster.stops.map((s) => s.dayIndexInCity).join(", ");
            dayOrStop = `${ord} — ${cityName} · Days ${days} (same place) — ${first.placeName}`;
          } else {
            dayOrStop = `${ord} — ${cityName} · Day ${first.dayIndexInCity}: ${first.placeName}`;
          }

          const m = new google.maps.Marker({
            position: { lat, lng },
            map,
            title: dayOrStop,
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
        });

        if (clusters.length === 0) {
          map.setCenter(DEFAULT_CENTER);
          map.setZoom(10);
        } else if (clusters.length === 1) {
          map.setCenter({ lat: clusters[0].lat, lng: clusters[0].lng });
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
  }, [apiKey, stopsKey, stopsMetaKey, pickerLabels]);

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
      title: "New location — drag to adjust",
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

  if (stops.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Add a city first — then you can place {pickerLabels === "stop" ? "its stop" : "each day"} on the map.
      </p>
    );
  }

  return (
    <form action={saveAction} className="flex flex-col gap-3 rounded border border-zinc-200 p-4 dark:border-zinc-800">
      <input type="hidden" name="itineraryId" value={itineraryId} />
      {!useBulkUi && <input type="hidden" name="stopId" value={stopId} />}
      {useBulkUi &&
        Array.from(bulkTargetIds).map((id) => <input key={id} type="hidden" name="stopIds" value={id} />)}
      <input type="hidden" name="lat" value={pickLat ?? ""} />
      <input type="hidden" name="lng" value={pickLng ?? ""} />

      <div>
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {pickerLabels === "stop" ? "Set location for this city’s stop" : "Set location for day(s)"}
        </div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          {pickerLabels === "stop" ? (
            <>
              Choose the stop if there is more than one row, click the map (navy pins already have coordinates), drag the
              orange pin to fine-tune, then save. Use day trips and marker POIs for extra places.
            </>
          ) : useBulkUi ? (
            <>
              Click the map to place the pin (navy markers show days that already have coordinates). Choose which days get
              this <strong>same</strong> location and place details — all checked days update together. Uncheck any day
              that should stay unchanged.
            </>
          ) : (
            <>
              Choose which day you are editing, click the map (navy pins are days that already have coordinates), drag the
              orange pin to fine-tune, then save.
            </>
          )}
        </p>
      </div>

      {useBulkUi ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Apply to days</span>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                className="font-medium text-zinc-700 underline dark:text-zinc-300"
                onClick={() => setBulkTargetIds(new Set(stops.map((s) => s.id)))}
              >
                Select all
              </button>
              <button
                type="button"
                className="font-medium text-zinc-700 underline dark:text-zinc-300"
                onClick={() => setBulkTargetIds(new Set())}
              >
                Clear
              </button>
            </div>
          </div>
          <ul className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded border border-zinc-200 p-2 dark:border-zinc-800">
            {sortedStops.map((s) => (
              <li key={s.id}>
                <label className="flex cursor-pointer items-start gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={bulkTargetIds.has(s.id)}
                    onChange={(e) => {
                      setBulkTargetIds((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(s.id);
                        else next.delete(s.id);
                        return next;
                      });
                    }}
                  />
                  <span>
                    Day {s.dayIndexInCity}
                    <span className="text-zinc-500 dark:text-zinc-500"> — {s.placeName}</span>
                    {s.lat != null && s.lng != null ? null : (
                      <span className="text-amber-700 dark:text-amber-300"> (no pin yet)</span>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {bulkTargetIds.size === 0 && (
            <p className="text-xs text-amber-800 dark:text-amber-200/90">Select at least one day to save.</p>
          )}
        </div>
      ) : (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {pickerLabels === "stop" ? "Which stop?" : "Which day?"}
          </span>
          <select
            required
            value={stopId}
            onChange={(e) => setStopId(e.target.value)}
            className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
          >
            {stops.map((s) => (
              <option key={s.id} value={s.id}>
                {pickerLabels === "stop"
                  ? `${s.cityName} · ${s.placeName}${s.lat != null && s.lng != null ? "" : " (no pin yet)"}`
                  : `${s.cityName} · Day ${s.dayIndexInCity}${s.lat != null && s.lng != null ? ` — ${s.placeName}` : ` — ${s.placeName} (no pin yet)`}`}
              </option>
            ))}
          </select>
        </label>
      )}

      <div
        ref={mapRef}
        className="h-80 w-full rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
        aria-label={pickerLabels === "stop" ? "Pick stop location on map" : "Pick day location on map"}
      />

      {hasPick ? (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Selected: {pickLat!.toFixed(6)}, {pickLng!.toFixed(6)}
        </p>
      ) : (
        <p className="text-xs text-amber-800 dark:text-amber-200/90">
          Click the map to set coordinates for this {pickerLabels === "stop" ? "stop" : "day"}.
        </p>
      )}

      {allStopsHaveCoordinates ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          Every {pickerLabels === "stop" ? "stop" : "day"} here already has a pin. Edit the title, area, and notes from each
          day&apos;s card above — this map only moves coordinates.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Area / neighborhood (optional)</span>
            <input
              name="stopAreaLabel"
              type="text"
              placeholder="e.g. Asakusa"
              className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Notes (optional)</span>
            <textarea
              name="notes"
              rows={2}
              placeholder={pickerLabels === "stop" ? "Short note for this stop…" : "Short note for this day…"}
              className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={!hasPick || (useBulkUi && bulkTargetIds.size === 0)}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pickerLabels === "stop"
            ? "Save stop location"
            : useBulkUi
              ? `Save to ${bulkTargetIds.size} day${bulkTargetIds.size === 1 ? "" : "s"}`
              : "Save day location"}
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
