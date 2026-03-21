/** Shared map styling for itinerary overview and day-trip route maps (featured-style). */

export const ITINERARY_ROUTE_LEG_COLORS = [
  "#2563eb",
  "#16a34a",
  "#ca8a04",
  "#dc2626",
  "#9333ea",
  "#0891b2",
  "#c026d3",
  "#4f46e5",
] as const;

export const ITINERARY_STOP_PIN_COLOR = "#1e3a8a";

export function fillOpacityForZoom(zoom: number): number {
  const fullAtOrBelow = 12;
  const fadedAtOrAbove = 18;
  const min = 0.34;
  const max = 1;
  if (zoom <= fullAtOrBelow) return max;
  if (zoom >= fadedAtOrAbove) return min;
  const t = (zoom - fullAtOrBelow) / (fadedAtOrAbove - fullAtOrBelow);
  return max - t * (max - min);
}

export function strokeOpacityForFillOpacity(fillOpacity: number): number {
  return Math.min(1, 0.35 + fillOpacity * 0.65);
}

export function itineraryMapCircleIcon(
  fillColor: string,
  scale: number,
  fillOpacity: number,
): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale,
    fillColor,
    fillOpacity,
    strokeColor: "#ffffff",
    strokeOpacity: strokeOpacityForFillOpacity(fillOpacity),
    strokeWeight: 2,
  };
}

export function itineraryOverviewStopLabel(text: string): google.maps.MarkerLabel {
  return {
    text,
    color: "#ffffff",
    fontSize: text.length > 3 ? "8px" : "9px",
    fontWeight: "700",
  };
}

export function itineraryDayTripDestLabel(text: string): google.maps.MarkerLabel {
  return {
    text,
    color: "#ffffff",
    fontSize: text.length > 1 ? "8px" : "9px",
    fontWeight: "700",
  };
}
