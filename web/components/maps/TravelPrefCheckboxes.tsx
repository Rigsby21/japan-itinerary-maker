"use client";

import type { OverviewTravelPrefs } from "@/components/maps/ItineraryRouteTravelContext";

type Props = {
  prefs: OverviewTravelPrefs;
  setPref: (key: keyof OverviewTravelPrefs, on: boolean) => void;
  routesLoading?: boolean;
  /** Shorter copy when shown away from the main overview map */
  compactNote?: boolean;
};

export function TravelPrefCheckboxes({
  prefs,
  setPref,
  routesLoading,
  compactNote,
}: Props) {
  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/40">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-medium text-zinc-800 dark:text-zinc-200">Travel preference</span>
        <label className="flex cursor-pointer items-center gap-2 text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={prefs.driving}
            onChange={(e) => setPref("driving", e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-900"
          />
          Driving
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={prefs.bus}
            onChange={(e) => setPref("bus", e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-900"
          />
          Buses
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={prefs.train}
            onChange={(e) => setPref("train", e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-900"
          />
          Trains
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={prefs.walking}
            onChange={(e) => setPref("walking", e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-900"
          />
          Walking
        </label>
        {routesLoading && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Updating routes…</span>
        )}
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {compactNote
          ? "Same settings as the Route overview on the Itinerary tab. At least one mode must stay on."
          : "At least one option must stay selected so the map can route between stops."}
      </p>
    </div>
  );
}
