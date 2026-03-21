/** Must match `id` on public itinerary POI rows for map → list scroll. */
export function publicItineraryPoiElementId(poiId: string): string {
  return `itinerary-poi-${poiId}`;
}

/** Must match `id` on public itinerary stop cards for map → list scroll. */
export function publicItineraryStopElementId(stopId: string): string {
  return `itinerary-stop-${stopId}`;
}

/** Scrolls a public itinerary list row into view and briefly highlights it (map → list). */
export function scrollPublicItineraryRowIntoView(elementId: string) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.remove(
    "ring-2",
    "ring-amber-400/90",
    "ring-offset-2",
    "ring-offset-white",
    "dark:ring-offset-zinc-900",
  );
  void el.offsetWidth;
  el.classList.add(
    "ring-2",
    "ring-amber-400/90",
    "ring-offset-2",
    "ring-offset-white",
    "dark:ring-offset-zinc-900",
    "rounded-sm",
  );
  window.setTimeout(() => {
    el.classList.remove(
      "ring-2",
      "ring-amber-400/90",
      "ring-offset-2",
      "ring-offset-white",
      "dark:ring-offset-zinc-900",
      "rounded-sm",
    );
  }, 2000);
}
