export type AdminItineraryTab = "stops" | "markers" | "budget" | "tips";

export function adminItineraryHref(
  itineraryId: string,
  tab: AdminItineraryTab,
  query?: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  params.set("tab", tab);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== "") params.set(k, v);
    }
  }
  return `/admin/itineraries/${encodeURIComponent(itineraryId)}?${params.toString()}`;
}

type TabQuery = {
  tab?: string;
  saved?: string;
  markerTypeSaved?: string;
  markerTypeDeleted?: string;
  markerTypeError?: string;
  poiSaved?: string;
  poiDeleted?: string;
  poiError?: string;
  poiPhotoSaved?: string;
  poiPhotoDeleted?: string;
  poiPhotoError?: string;
  tipSaved?: string;
  tipUpdated?: string;
  tipDeleted?: string;
  tipError?: string;
  budgetCurrencySaved?: string;
  budgetLineSaved?: string;
  budgetLineUpdated?: string;
  budgetLineDeleted?: string;
  budgetError?: string;
  stopSaved?: string;
  stopDeleted?: string;
  stopError?: string;
  itineraryError?: string;
};

/** URL `tab` wins; else infer from flash params so old links still open the right section. */
export function resolveAdminItineraryTab(query: TabQuery): AdminItineraryTab {
  const t = query.tab;
  if (t === "stops" || t === "markers" || t === "budget" || t === "tips") return t;

  if (query.stopSaved || query.stopDeleted || query.stopError || query.itineraryError) return "stops";

  if (
    query.markerTypeSaved ||
    query.markerTypeDeleted ||
    query.markerTypeError ||
    query.poiSaved ||
    query.poiDeleted ||
    query.poiError ||
    query.poiPhotoSaved ||
    query.poiPhotoDeleted ||
    query.poiPhotoError
  ) {
    return "markers";
  }
  if (query.tipSaved || query.tipUpdated || query.tipDeleted || query.tipError) return "tips";
  if (
    query.budgetCurrencySaved ||
    query.budgetLineSaved ||
    query.budgetLineUpdated ||
    query.budgetLineDeleted ||
    query.budgetError
  ) {
    return "budget";
  }
  return "stops";
}
