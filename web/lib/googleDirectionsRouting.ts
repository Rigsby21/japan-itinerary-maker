/** Mirrors public itinerary overview leg routing (driving → bus transit → train transit → walking). */

export type TravelPrefsForDirections = {
  driving: boolean;
  bus: boolean;
  train: boolean;
  walking: boolean;
};

export async function routeLegWithDirectionsService(
  directionsService: google.maps.DirectionsService,
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral,
  prefs: TravelPrefsForDirections,
  shouldCancel: () => boolean,
): Promise<google.maps.DirectionsResult | null> {
  const requestRoute = (
    travelMode: google.maps.TravelMode,
    transitOptions?: google.maps.TransitOptions,
  ): Promise<google.maps.DirectionsResult | null> =>
    new Promise((resolve) => {
      const request: google.maps.DirectionsRequest = {
        origin,
        destination,
        travelMode,
        region: "jp",
      };
      if (transitOptions && travelMode === google.maps.TravelMode.TRANSIT) {
        request.transitOptions = transitOptions;
      }
      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) resolve(result);
        else resolve(null);
      });
    });

  const trainModes = [
    google.maps.TransitMode.TRAIN,
    google.maps.TransitMode.SUBWAY,
    google.maps.TransitMode.RAIL,
    google.maps.TransitMode.TRAM,
  ];
  const busModes = [google.maps.TransitMode.BUS];

  const attempts: Array<{
    mode: google.maps.TravelMode;
    transitOptions?: google.maps.TransitOptions;
  }> = [];
  if (prefs.driving) {
    attempts.push({ mode: google.maps.TravelMode.DRIVING });
  }
  if (prefs.bus) {
    attempts.push({
      mode: google.maps.TravelMode.TRANSIT,
      transitOptions: { modes: busModes },
    });
  }
  if (prefs.train) {
    attempts.push({
      mode: google.maps.TravelMode.TRANSIT,
      transitOptions: { modes: trainModes },
    });
  }
  if (prefs.walking) {
    attempts.push({ mode: google.maps.TravelMode.WALKING });
  }

  for (const a of attempts) {
    if (shouldCancel()) return null;
    const r = await requestRoute(a.mode, a.transitOptions);
    if (r) return r;
  }
  return null;
}
