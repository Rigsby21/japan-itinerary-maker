"use client";

import { useContext } from "react";
import { ItineraryMapShellContext } from "@/components/maps/ItineraryMapWithListFocus";

export type StopPoiMapFilterPoi = {
  id: string;
  title: string;
  markerType?: { name: string } | null;
};

export function StopPoiMapFilter({ pois }: { pois: StopPoiMapFilterPoi[] }) {
  const ctx = useContext(ItineraryMapShellContext);
  if (!ctx || pois.length === 0) return null;

  const { isPoiOnMap, setPoiOnMap, setManyPoiOnMap } = ctx;
  const ids = pois.map((p) => p.id);

  return (
    <details className="group mt-3 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900/40">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium text-zinc-900 [&::-webkit-details-marker]:hidden dark:text-zinc-100">
        <span>Markers on map</span>
        <svg
          className="h-4 w-4 shrink-0 text-zinc-500 transition-transform group-open:rotate-180 dark:text-zinc-400"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </summary>
      <div className="space-y-2 border-t border-zinc-200 px-3 py-3 dark:border-zinc-700">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
          <button
            type="button"
            className="font-medium text-zinc-700 underline decoration-zinc-400 underline-offset-2 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            onClick={(e) => {
              e.preventDefault();
              setManyPoiOnMap(ids, true);
            }}
          >
            All
          </button>
          <button
            type="button"
            className="font-medium text-zinc-700 underline decoration-zinc-400 underline-offset-2 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            onClick={(e) => {
              e.preventDefault();
              setManyPoiOnMap(ids, false);
            }}
          >
            None
          </button>
        </div>
        <ul className="space-y-2.5">
          {pois.map((p) => {
            const on = isPoiOnMap(p.id);
            const inputId = `itinerary-poi-map-${p.id}`;
            return (
              <li key={p.id}>
                <label
                  htmlFor={inputId}
                  className="flex cursor-pointer items-start gap-2.5 rounded-md py-0.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
                >
                  <input
                    id={inputId}
                    type="checkbox"
                    checked={on}
                    onChange={(e) => setPoiOnMap(p.id, e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                  <span className="min-w-0 leading-snug">
                    {p.markerType && (
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">[{p.markerType.name}] </span>
                    )}
                    {p.title}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}
