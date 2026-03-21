"use client";

import { useEffect, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { createDayTripDestinationAction } from "@/lib/actions/adminItinerary";
import { ITINERARY_STOP_PIN_COLOR, itineraryMapCircleIcon } from "@/lib/itineraryMapVisuals";

type Props = {
  itineraryId: string;
  dayTripId: string;
  originLat: number;
  originLng: number;
};

let mapsLoaderOptionsApplied = false;

function ensureMapsLoaderOptions(apiKey: string) {
  if (!mapsLoaderOptionsApplied) {
    setOptions({ key: apiKey, v: "weekly" });
    mapsLoaderOptionsApplied = true;
  }
}

function geocodeLabel(geocoder: google.maps.Geocoder, lat: number, lng: number): Promise<string> {
  return new Promise((resolve) => {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const r = results[0];
        const name = r.address_components?.[0]?.long_name;
        resolve(r.formatted_address || name || `Map point (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      } else {
        resolve(`Map point (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      }
    });
  });
}

export function AdminDayTripAddDestinationForm({
  itineraryId,
  dayTripId,
  originLat,
  originLng,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<google.maps.Map | null>(null);
  const pickMarkerRef = useRef<google.maps.Marker | null>(null);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  const [pickLat, setPickLat] = useState<number | null>(null);
  const [pickLng, setPickLng] = useState<number | null>(null);
  const [placeName, setPlaceName] = useState("");
  const placeTouchedRef = useRef(false);
  const [mapHint, setMapHint] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey || !mapRef.current) return;

    let cancelled = false;
    ensureMapsLoaderOptions(apiKey);

    void (async () => {
      try {
        await importLibrary("maps");
        await google.maps.importLibrary("geocoding");
      } catch {
        if (!cancelled) setLoadError(true);
        return;
      }
      if (cancelled || !mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      mapInst.current = map;

      new google.maps.Marker({
        position: { lat: originLat, lng: originLng },
        map,
        title: "This stop (start of day trip)",
        icon: itineraryMapCircleIcon(ITINERARY_STOP_PIN_COLOR, 11, 0.95),
        zIndex: 3,
      });

      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: originLat, lng: originLng });
      map.fitBounds(bounds, { top: 24, right: 24, bottom: 24, left: 24 });
      const z = map.getZoom();
      if (z != null && z > 14) map.setZoom(14);

      const geocoder = new google.maps.Geocoder();

      clickListenerRef.current = map.addListener("click", (e: google.maps.MapMouseEvent) => {
        const ll = e.latLng;
        if (!ll) return;
        const lat = ll.lat();
        const lng = ll.lng();
        placeTouchedRef.current = false;
        setPickLat(lat);
        setPickLng(lng);
        setMapHint(null);

        if (pickMarkerRef.current) {
          pickMarkerRef.current.setPosition({ lat, lng });
        } else {
          pickMarkerRef.current = new google.maps.Marker({
            position: { lat, lng },
            map,
            title: "New destination",
            icon: itineraryMapCircleIcon("#2563eb", 10, 0.92),
            zIndex: 4,
          });
        }

        void (async () => {
          const label = await geocodeLabel(geocoder, lat, lng);
          if (cancelled) return;
          if (!placeTouchedRef.current) setPlaceName(label);
        })();
      });
    })();

    return () => {
      cancelled = true;
      if (clickListenerRef.current) {
        google.maps.event.removeListener(clickListenerRef.current);
        clickListenerRef.current = null;
      }
      pickMarkerRef.current?.setMap(null);
      pickMarkerRef.current = null;
      mapInst.current = null;
    };
  }, [apiKey, originLat, originLng, dayTripId]);

  if (!apiKey) {
    return (
      <p className="text-xs text-amber-800 dark:text-amber-200/90">
        Set <code className="rounded bg-amber-100/60 px-1 dark:bg-amber-900/50">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to pick
        locations on a map.
      </p>
    );
  }

  if (loadError) {
    return <p className="text-xs text-red-600 dark:text-red-300">Map could not load. Check your API key and enabled APIs.</p>;
  }

  return (
    <form
      action={createDayTripDestinationAction}
      className="mt-3 flex flex-col gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800"
      onSubmit={(e) => {
        if (pickLat == null || pickLng == null) {
          e.preventDefault();
          setMapHint("Click the map where this destination should be, then submit again.");
        }
      }}
    >
      <input type="hidden" name="itineraryId" value={itineraryId} />
      <input type="hidden" name="dayTripId" value={dayTripId} />
      <input type="hidden" name="lat" value={pickLat ?? ""} />
      <input type="hidden" name="lng" value={pickLng ?? ""} />

      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Add destination</span>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Click the map to set the pin (navy = this stop). Place name fills from the address when possible; edit if you
        like.
      </p>

      <div
        ref={mapRef}
        className="h-44 w-full rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
        aria-label="Click map to set destination location"
      />

      {mapHint && <p className="text-xs text-amber-800 dark:text-amber-200/90">{mapHint}</p>}
      {pickLat != null && pickLng != null && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Selected: {pickLat.toFixed(5)}, {pickLng.toFixed(5)}
        </p>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Place name</span>
        <input
          name="placeName"
          required
          value={placeName}
          onChange={(e) => {
            placeTouchedRef.current = true;
            setPlaceName(e.target.value);
          }}
          placeholder="Click the map or type a name"
          className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Optional notes</span>
        <textarea
          name="notes"
          rows={2}
          placeholder="Optional notes"
          className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>

      <button
        type="submit"
        className="w-fit rounded bg-zinc-800 px-3 py-1.5 text-sm text-white dark:bg-zinc-200 dark:text-zinc-900"
      >
        Add destination
      </button>
    </form>
  );
}
