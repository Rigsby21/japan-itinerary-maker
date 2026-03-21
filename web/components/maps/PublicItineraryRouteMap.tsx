"use client";

import {
  ItineraryReadOnlyMap,
  type ItineraryListMapFocusRequest,
  type ItineraryMapMarker,
} from "@/components/maps/ItineraryReadOnlyMap";
import {
  publicItineraryPoiElementId,
  publicItineraryStopElementId,
  scrollPublicItineraryRowIntoView,
} from "@/components/maps/publicItineraryPoiAnchor";

type Props = {
  markers: ItineraryMapMarker[];
  listFocusRequest?: ItineraryListMapFocusRequest | null;
};

export function PublicItineraryRouteMap({ markers, listFocusRequest }: Props) {
  return (
    <ItineraryReadOnlyMap
      markers={markers}
      listFocusRequest={listFocusRequest}
      onStopMarkerClick={(stopId) => {
        scrollPublicItineraryRowIntoView(publicItineraryStopElementId(stopId));
      }}
      onPoiMarkerClick={(poiId) => {
        scrollPublicItineraryRowIntoView(publicItineraryPoiElementId(poiId));
      }}
    />
  );
}
