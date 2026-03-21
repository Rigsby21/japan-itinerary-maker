"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { createPoiAction } from "@/lib/actions/adminItinerary";

export type AdminPoiPickMarkerType = { id: string; name: string; colorHex: string };

export type AdminPoiPickExistingPoi = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  colorHex: string | null;
};

type Props = {
  itineraryId: string;
  stopId: string;
  stopLat: number | null;
  stopLng: number | null;
  stopPlaceName: string;
  markerTypes: AdminPoiPickMarkerType[];
  existingPois: AdminPoiPickExistingPoi[];
};

let mapsLoaderOptionsApplied = false;

function ensureMapsLoaderOptions(apiKey: string) {
  if (!mapsLoaderOptionsApplied) {
    setOptions({ key: apiKey, v: "weekly" });
    mapsLoaderOptionsApplied = true;
  }
}

function paddedBoundsAroundStop(lat: number, lng: number, pad = 0.18): google.maps.LatLngBounds {
  const b = new google.maps.LatLngBounds();
  b.extend({ lat: lat + pad, lng: lng + pad });
  b.extend({ lat: lat - pad, lng: lng - pad });
  return b;
}

const DEFAULT_CENTER = { lat: 35.6762, lng: 139.6503 };
const POI_DEFAULT_COLOR = "#7c3aed";

export function AdminPoiPickMapForm({
  itineraryId,
  stopId,
  stopLat,
  stopLng,
  stopPlaceName,
  markerTypes,
  existingPois,
}: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          Add <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/80">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> for a
          clickable map. For now, enter coordinates manually.
        </div>
        <form action={createPoiAction} className="flex flex-col gap-3">
          <input type="hidden" name="itineraryId" value={itineraryId} />
          <input type="hidden" name="stopId" value={stopId} />
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Title</span>
              <input
                name="title"
                placeholder="Ramen shop, viewpoint…"
                className="w-56 rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Marker type</span>
              <select
                name="markerTypeId"
                className="w-44 rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                defaultValue="none"
              >
                <option value="none">None</option>
                {markerTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.colorHex})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Lat</span>
              <input
                name="lat"
                placeholder="35.710063"
                inputMode="decimal"
                className="w-32 rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Lng</span>
              <input
                name="lng"
                placeholder="139.810700"
                inputMode="decimal"
                className="w-32 rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Description (optional)</span>
            <input
              name="description"
              placeholder="What to do / tips…"
              className="max-w-xl rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <button
            type="submit"
            className="w-fit rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Add POI
          </button>
        </form>
      </div>
    );
  }

  return (
    <MapPoiFormInner
      itineraryId={itineraryId}
      stopId={stopId}
      stopLat={stopLat}
      stopLng={stopLng}
      stopPlaceName={stopPlaceName}
      markerTypes={markerTypes}
      existingPois={existingPois}
      apiKey={apiKey}
    />
  );
}

function MapPoiFormInner({
  itineraryId,
  stopId,
  stopLat,
  stopLng,
  stopPlaceName,
  markerTypes,
  existingPois,
  apiKey,
}: Props & { apiKey: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<google.maps.Map | null>(null);
  const staticMarkersRef = useRef<google.maps.Marker[]>([]);
  const dragListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const pickMarkerRef = useRef<google.maps.Marker | null>(null);
  const placeSearchInputRef = useRef<HTMLInputElement>(null);

  const [pickLat, setPickLat] = useState<number | null>(null);
  const [pickLng, setPickLng] = useState<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState<"failed" | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const hasStopCoords =
    stopLat != null && stopLng != null && Number.isFinite(stopLat) && Number.isFinite(stopLng);

  const poisKey = useMemo(
    () => existingPois.map((p) => `${p.id}:${p.lat}:${p.lng}`).join("|"),
    [existingPois],
  );

  const mapDepsKey = `${stopId}:${hasStopCoords ? `${stopLat},${stopLng}` : "n"}:${poisKey}`;

  useEffect(() => {
    if (!apiKey || !mapRef.current) return;
    let cancelled = false;
    setMapReady(false);

    ensureMapsLoaderOptions(apiKey);
    importLibrary("maps")
      .then(() => {
        if (cancelled || !mapRef.current) return;

        for (const m of staticMarkersRef.current) m.setMap(null);
        staticMarkersRef.current = [];
        pickMarkerRef.current?.setMap(null);
        pickMarkerRef.current = null;

        const map = new google.maps.Map(mapRef.current, {
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        mapInst.current = map;

        const bounds = new google.maps.LatLngBounds();

        if (hasStopCoords) {
          bounds.extend({ lat: stopLat!, lng: stopLng! });
          const m = new google.maps.Marker({
            position: { lat: stopLat!, lng: stopLng! },
            map,
            title: `Stop: ${stopPlaceName}`,
            zIndex: 1,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: "#1e3a8a",
              fillOpacity: 0.95,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });
          staticMarkersRef.current.push(m);
        }

        for (const p of existingPois) {
          bounds.extend({ lat: p.lat, lng: p.lng });
          const fill = p.colorHex ?? POI_DEFAULT_COLOR;
          const m = new google.maps.Marker({
            position: { lat: p.lat, lng: p.lng },
            map,
            title: p.title,
            zIndex: 2,
            icon: {
              path: "M -1,-1 L 1,-1 L 1,1 L -1,1 Z",
              scale: 7,
              fillColor: fill,
              fillOpacity: 0.92,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });
          staticMarkersRef.current.push(m);
        }

        const nPoints = (hasStopCoords ? 1 : 0) + existingPois.length;
        const fitPadding = 64;
        if (nPoints === 0) {
          map.setCenter(DEFAULT_CENTER);
          map.setZoom(11);
        } else if (nPoints === 1) {
          const c = hasStopCoords
            ? { lat: stopLat!, lng: stopLng! }
            : { lat: existingPois[0].lat, lng: existingPois[0].lng };
          map.setCenter(c);
          // Wider than before so admins see surrounding streets (was 15).
          map.setZoom(12);
        } else {
          map.fitBounds(bounds, fitPadding);
          google.maps.event.addListenerOnce(map, "idle", () => {
            if (cancelled) return;
            const z = map.getZoom();
            if (z != null) map.setZoom(Math.max(1, z - 1));
          });
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
      for (const m of staticMarkersRef.current) m.setMap(null);
      staticMarkersRef.current = [];
      mapInst.current = null;
      setMapReady(false);
    };
  }, [apiKey, mapDepsKey]); // mapDepsKey = stop + POI positions

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
      title: "New POI — drag to adjust",
      zIndex: 1000,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
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

  useEffect(() => {
    if (!mapReady || !mapInst.current) return;
    const input = placeSearchInputRef.current;
    if (!input) return;

    let cancelled = false;
    let placeListener: google.maps.MapsEventListener | null = null;
    let autocomplete: google.maps.places.Autocomplete | null = null;

    ensureMapsLoaderOptions(apiKey);
    importLibrary("places")
      .then(() => {
        if (cancelled || placeSearchInputRef.current !== input || !mapInst.current) return;

        const ac = new google.maps.places.Autocomplete(input, {
          fields: ["geometry", "formatted_address", "name"],
          ...(hasStopCoords && stopLat != null && stopLng != null
            ? { bounds: paddedBoundsAroundStop(stopLat, stopLng), strictBounds: false }
            : {}),
        });
        ac.bindTo("bounds", mapInst.current);
        autocomplete = ac;
        placeListener = ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          const loc = place.geometry?.location;
          if (!loc) {
            setSearchError("Pick a suggestion from the list, or use Search.");
            return;
          }
          setSearchError(null);
          mapInst.current?.panTo(loc);
          mapInst.current?.setZoom(16);
          setPickLat(loc.lat());
          setPickLng(loc.lng());
        });
      })
      .catch(() => {
        if (!cancelled) setSearchError("Could not load place suggestions. Check Places API for this key.");
      });

    return () => {
      cancelled = true;
      placeListener?.remove();
      if (autocomplete) google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [mapReady, apiKey, hasStopCoords, stopLat, stopLng, mapDepsKey]);

  const runPlaceSearch = () => {
    const q = placeSearchInputRef.current?.value.trim() ?? "";
    setSearchError(null);
    if (!q) {
      setSearchError("Enter a place or address.");
      return;
    }
    const map = mapInst.current;
    if (!map) {
      setSearchError("Map is still loading.");
      return;
    }
    setSearching(true);
    ensureMapsLoaderOptions(apiKey);
    importLibrary("geocoding")
      .then(() => {
        const geocoder = new google.maps.Geocoder();
        const req: google.maps.GeocoderRequest = { address: q };
        if (hasStopCoords && stopLat != null && stopLng != null) {
          req.bounds = paddedBoundsAroundStop(stopLat, stopLng);
        }
        geocoder.geocode(req, (results, status) => {
          setSearching(false);
          if (status !== "OK" || !results?.[0]?.geometry?.location) {
            setSearchError(
              status === "ZERO_RESULTS"
                ? "No matches. Try a different search."
                : status === "REQUEST_DENIED"
                  ? "Geocoding blocked — enable Geocoding API for this key in Google Cloud."
                  : "Search failed. Check the address and try again.",
            );
            return;
          }
          const loc = results[0].geometry.location;
          const lat = loc.lat();
          const lng = loc.lng();
          map.panTo(loc);
          map.setZoom(16);
          setPickLat(lat);
          setPickLng(lng);
        });
      })
      .catch(() => {
        setSearching(false);
        setSearchError("Could not load search.");
      });
  };

  const hasPick = pickLat != null && pickLng != null;

  if (loadError === "failed") {
    return (
      <p className="text-sm text-red-700 dark:text-red-300">
        Map did not load. Check your Maps API key, then refresh.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-zinc-500 dark:text-zinc-500">
        Type to see place suggestions, pick one or use Search, or click the map (blue = this stop, squares = existing POIs).
        Drag the orange pin to adjust.
      </p>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Search map</span>
        <div className="flex flex-wrap items-stretch gap-2">
          <input
            ref={placeSearchInputRef}
            type="search"
            placeholder={
              hasStopCoords
                ? `e.g. café near ${stopPlaceName}…`
                : "Address, landmark, or place name…"
            }
            className="min-w-[200px] flex-1 rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            aria-label="Search for a place on the map"
            aria-autocomplete="list"
            disabled={searching}
          />
          <button
            type="button"
            onClick={runPlaceSearch}
            disabled={!mapReady || searching}
            className="rounded border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700"
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </div>
        {searchError && <p className="text-xs text-red-700 dark:text-red-300">{searchError}</p>}
      </div>

      <div
        ref={mapRef}
        className="h-64 w-full rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
        aria-label={`Pick POI location for ${stopPlaceName}`}
      />

      <form action={createPoiAction} className="flex flex-col gap-3">
        <input type="hidden" name="itineraryId" value={itineraryId} />
        <input type="hidden" name="stopId" value={stopId} />
        <input type="hidden" name="lat" value={pickLat ?? ""} />
        <input type="hidden" name="lng" value={pickLng ?? ""} />

        {hasPick ? (
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Selected: {pickLat!.toFixed(6)}, {pickLng!.toFixed(6)}
          </p>
        ) : (
          <p className="text-xs text-amber-800 dark:text-amber-200/90">Click the map to set coordinates.</p>
        )}

        <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Title</span>
          <input
            name="title"
            placeholder="Ramen shop, viewpoint…"
            className="w-56 rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Marker type</span>
          <select
            name="markerTypeId"
            className="w-44 rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            defaultValue="none"
          >
            <option value="none">None</option>
            {markerTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.colorHex})
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Description (optional)</span>
        <input
          name="description"
          placeholder="What to do / tips…"
          className="max-w-xl rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={!hasPick}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Add POI
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
    </div>
  );
}
