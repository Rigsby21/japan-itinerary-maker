/** Must match `id` on public itinerary POI rows for map → list scroll. */
export function publicItineraryPoiElementId(poiId: string): string {
  return `itinerary-poi-${poiId}`;
}

/** Must match `id` on public itinerary stop cards for map → list scroll. */
export function publicItineraryStopElementId(stopId: string): string {
  return `itinerary-stop-${stopId}`;
}
