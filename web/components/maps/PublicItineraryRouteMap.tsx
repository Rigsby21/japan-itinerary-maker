"use client";

import { ItineraryReadOnlyMap, type ItineraryMapMarker } from "@/components/maps/ItineraryReadOnlyMap";
import {
  publicItineraryPoiElementId,
  publicItineraryStopElementId,
} from "@/components/maps/publicItineraryPoiAnchor";

type Props = {
  markers: ItineraryMapMarker[];
};

function scrollListRowToCenter(el: HTMLElement | null) {
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

export function PublicItineraryRouteMap({ markers }: Props) {
  return (
    <ItineraryReadOnlyMap
      markers={markers}
      onStopMarkerClick={(stopId) => {
        scrollListRowToCenter(document.getElementById(publicItineraryStopElementId(stopId)));
      }}
      onPoiMarkerClick={(poiId) => {
        scrollListRowToCenter(document.getElementById(publicItineraryPoiElementId(poiId)));
      }}
    />
  );
}
