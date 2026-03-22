"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { createDayTripDestinationInlineAction } from "@/lib/actions/adminItinerary";
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

export type PlannerDayTrip = {
  id: string;
  title: string;
  orderIndex: number;
  destinations: Array<{
    id: string;
    orderIndex: number;
    placeName: string;
    lat: number;
    lng: number;
  }>;
};

type Props = {
  itineraryId: string;
  cityName: string;
  dayIndexInCity: number;
  stopPlaceName: string;
  originLat: number;
  originLng: number;
  dayTrips: PlannerDayTrip[];
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

export function AdminDayTripPlannerMap({
  itineraryId,
  cityName,
  dayIndexInCity,
  stopPlaceName,
  originLat,
  originLng,
  dayTrips,
}: Props) {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const boundsRef = useRef<google.maps.LatLngBounds | null>(null);
  const savingRef = useRef(false);

  const [loadError, setLoadError] = useState<"failed" | null>(null);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routeNote, setRouteNote] = useState<string | null>(null);
  const [travelPrefs, setTravelPrefs] = useState<OverviewTravelPrefs>({
    driving: true,
    bus: true,
    train: true,
    walking: true,
  });
  const setPref = (key: keyof OverviewTravelPrefs, on: boolean) => {
    setTravelPrefs((m) => {
      const next = { ...m, [key]: on };
      const n =
        (next.driving ? 1 : 0) + (next.bus ? 1 : 0) + (next.train ? 1 : 0) + (next.walking ? 1 : 0);
      if (n === 0) return m;
      return next;
    });
  };

  const [savingClick, setSavingClick] = useState(false);
  const [clickError, setClickError] = useState<string | null>(null);

  const sortedTrips = useMemo(
    () => [...dayTrips].sort((a, b) => a.orderIndex - b.orderIndex),
    [dayTrips],
  );

  const [selectedDayTripId, setSelectedDayTripId] = useState<string | null>(null);

  useEffect(() => {
    if (sortedTrips.length === 0) {
      setSelectedDayTripId(null);
      return;
    }
    setSelectedDayTripId((prev) => {
      if (prev && sortedTrips.some((t) => t.id === prev)) return prev;
      return sortedTrips[0].id;
    });
  }, [sortedTrips]);

  const selectedTrip = sortedTrips.find((t) => t.id === selectedDayTripId) ?? null;
  const orderedDest = useMemo(() => {
    if (!selectedTrip) return [];
    return [...selectedTrip.destinations].sort((a, b) => a.orderIndex - b.orderIndex);
  }, [selectedTrip]);

  const destKey = useMemo(
    () => orderedDest.map((d) => `${d.id}:${d.orderIndex}:${d.lat}:${d.lng}`).join("|"),
    [orderedDest],
  );

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    const el = mapRef.current;
    if (!el || !apiKey) return;

    const ro = new ResizeObserver(() => {
      const map = mapInstanceRef.current;
      const b = boundsRef.current;
      if (!map) return;
      const { width, height } = el.getBoundingClientRect();
      if (width < 32 || height < 32) return;
      google.maps.event.trigger(map, "resize");
      if (b && !b.isEmpty()) {
        map.fitBounds(b, { top: 40, right: 40, bottom: 40, left: 40 });
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [apiKey, destKey, selectedDayTripId]);

  useEffect(() => {
    if (!apiKey || !mapRef.current) return;

    let cancelled = false;
    let raf1 = 0;
    let raf2 = 0;
    let zoomListener: google.maps.MapsEventListener | null = null;
    let clickListener: google.maps.MapsEventListener | null = null;

    const disposables: { polylines: google.maps.Polyline[]; markers: google.maps.Marker[] } = {
      polylines: [],
      markers: [],
    };

    const legs: Array<{
      origin: google.maps.LatLngLiteral;
      destination: google.maps.LatLngLiteral;
      color: string;
    }> = [];
    let prev: google.maps.LatLngLiteral = { lat: originLat, lng: originLng };
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
        setClickError(null);
      }

      try {
        await importLibrary("maps");
        await google.maps.importLibrary("routes");
        await google.maps.importLibrary("geocoding");
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

      const canClickToAdd = Boolean(selectedDayTripId);
      map.setOptions({
        draggableCursor: canClickToAdd ? "crosshair" : "",
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
          s.marker.setIcon(itineraryMapCircleIcon(s.fill, s.scale, fo));
        }
      };

      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: originLat, lng: originLng });

      const originScale = 12;
      const originFo = fillOpacityForZoom(map.getZoom() ?? 12);
      const originMarker = new google.maps.Marker({
        position: { lat: originLat, lng: originLng },
        map,
        title: `This day — ${cityName} · Day ${dayIndexInCity}: ${stopPlaceName}`,
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

      const tripIdForClicks = selectedDayTripId;
      if (tripIdForClicks) {
        const geocoder = new google.maps.Geocoder();
        clickListener = map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (savingRef.current || !tripIdForClicks) return;
          const ll = e.latLng;
          if (!ll) return;
          const lat = ll.lat();
          const lng = ll.lng();
          void (async () => {
            savingRef.current = true;
            setSavingClick(true);
            setClickError(null);
            try {
              const placeName = await geocodeLabel(geocoder, lat, lng);
              const res = await createDayTripDestinationInlineAction({
                itineraryId,
                dayTripId: tripIdForClicks,
                placeName,
                lat,
                lng,
              });
              if (!res.ok) {
                setClickError(
                  res.error === "bad-trip"
                    ? "Could not attach destination to this trip."
                    : "Could not save this point. Check coordinates or try again.",
                );
                return;
              }
              router.refresh();
            } catch {
              setClickError("Save failed. Check your connection and try again.");
            } finally {
              savingRef.current = false;
              if (!cancelled) setSavingClick(false);
            }
          })();
        });
      }

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
            zIndex: 0,
          });
          disposables.polylines.push(poly);
          bounds.extend(leg.origin);
          bounds.extend(leg.destination);
        }
      }

      if (cancelled) return;

      applyMarkerOpacities();
      boundsRef.current = bounds;

      if (orderedDest.length === 0) {
        map.setCenter({ lat: originLat, lng: originLng });
        map.setZoom(12);
      } else if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
      }

      requestAnimationFrame(() => {
        if (cancelled || !mapInstanceRef.current) return;
        google.maps.event.trigger(mapInstanceRef.current, "resize");
        const b = boundsRef.current;
        if (b && !b.isEmpty() && orderedDest.length > 0) {
          mapInstanceRef.current.fitBounds(b, { top: 40, right: 40, bottom: 40, left: 40 });
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
      if (clickListener) google.maps.event.removeListener(clickListener);
      mapInstanceRef.current = null;
      boundsRef.current = null;
      for (const p of disposables.polylines) p.setMap(null);
      for (const m of disposables.markers) m.setMap(null);
    };
  }, [
    apiKey,
    originLat,
    originLng,
    destKey,
    selectedDayTripId,
    travelPrefs,
    itineraryId,
    cityName,
    dayIndexInCity,
    stopPlaceName,
    router,
  ]);

  if (!apiKey) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
        Add <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to use the planner map.
      </div>
    );
  }

  if (loadError === "failed") {
    return (
      <p className="text-xs text-red-700 dark:text-red-300">
        Map failed to load. Enable Maps JavaScript, Geocoding, and Directions APIs for your key.
      </p>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/20">
      <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Route planner (this itinerary day)</div>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        Same colored legs and navy start pin as the public overview. Choose which day trip you are building, then{" "}
        <strong>click the map</strong> to add the next destination in order (this day → 1 → 2 → …). Enable{" "}
        <strong>Geocoding API</strong> for automatic place names.
      </p>

      {sortedTrips.length === 0 ? (
        <p className="text-xs text-amber-800 dark:text-amber-200/90">
          Create a day trip below first, then return here to add destinations by clicking the map.
        </p>
      ) : (
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Add clicks to this day trip</span>
          <select
            value={selectedDayTripId ?? ""}
            onChange={(e) => setSelectedDayTripId(e.target.value || null)}
            className="max-w-md rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          >
            {sortedTrips.map((t, i) => (
              <option key={t.id} value={t.id}>
                Trip {i + 1}: {t.title}
              </option>
            ))}
          </select>
        </label>
      )}

      <TravelPrefCheckboxes prefs={travelPrefs} setPref={setPref} routesLoading={routesLoading} />

      <div
        ref={mapRef}
        className="relative h-80 w-full rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
        aria-label="Day trip planner map"
      />

      {savingClick && <p className="text-xs text-zinc-500">Saving destination…</p>}
      {clickError && <p className="text-xs text-red-700 dark:text-red-300">{clickError}</p>}
      {routeNote && <p className="text-xs text-amber-800 dark:text-amber-200/90">{routeNote}</p>}
    </div>
  );
}
