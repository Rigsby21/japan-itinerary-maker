"use client";

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { ItineraryMapShellContext } from "@/components/maps/ItineraryMapWithListFocus";

const UNTYPED_GROUP_KEY = "__untagged__";

export type StopPoiMapFilterPoi = {
  id: string;
  title: string;
  markerType?: { id: string; name: string; colorHex?: string | null } | null;
};

type MarkerTypeGroup = {
  key: string;
  label: string;
  colorHex: string | null;
  poiIds: string[];
};

function buildMarkerTypeGroups(pois: StopPoiMapFilterPoi[]): MarkerTypeGroup[] {
  const byKey = new Map<string, { label: string; colorHex: string | null; poiIds: string[] }>();
  for (const p of pois) {
    const key = p.markerType?.id ?? UNTYPED_GROUP_KEY;
    const label = p.markerType?.name ?? "No marker type";
    const colorHex = p.markerType?.colorHex ?? null;
    const cur = byKey.get(key);
    if (cur) {
      cur.poiIds.push(p.id);
    } else {
      byKey.set(key, { label, colorHex, poiIds: [p.id] });
    }
  }
  const rows = Array.from(byKey.entries()).map(([key, v]) => ({
    key,
    label: v.label,
    colorHex: v.colorHex,
    poiIds: v.poiIds,
  }));
  rows.sort((a, b) => {
    if (a.key === UNTYPED_GROUP_KEY) return 1;
    if (b.key === UNTYPED_GROUP_KEY) return -1;
    return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
  });
  return rows;
}

export function StopPoiMapFilter({ pois }: { pois: StopPoiMapFilterPoi[] }) {
  const ctx = useContext(ItineraryMapShellContext);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => buildMarkerTypeGroups(pois), [pois]);
  const allIds = useMemo(() => pois.map((p) => p.id), [pois]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const el = rootRef.current;
      if (el && e.target instanceof Node && !el.contains(e.target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!ctx || pois.length === 0) return null;

  const { isPoiOnMap, setManyPoiOnMap } = ctx;

  const visibleCount = allIds.filter((id) => isPoiOnMap(id)).length;
  const allVisible = visibleCount === allIds.length;
  const noneVisible = visibleCount === 0;

  return (
    <div ref={rootRef} className="relative mt-3">
      <button
        type="button"
        className="flex w-full max-w-md items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-100 dark:hover:bg-zinc-800/60 dark:focus-visible:ring-zinc-500"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
      >
        <span>Marker types on map</span>
        <span className="flex shrink-0 items-center gap-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
          {visibleCount}/{allIds.length} shown
          <svg
            className={`h-4 w-4 text-zinc-500 transition-transform dark:text-zinc-400 ${open ? "rotate-180" : ""}`}
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
        </span>
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 z-30 mt-1 max-h-[min(22rem,70vh)] overflow-y-auto rounded-md border border-zinc-200 bg-white py-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          role="listbox"
          aria-multiselectable
        >
          <div className="flex flex-wrap gap-x-3 gap-y-1 border-b border-zinc-100 px-3 pb-2 dark:border-zinc-800">
            <button
              type="button"
              className="text-xs font-medium text-zinc-700 underline decoration-zinc-400 underline-offset-2 hover:text-zinc-900 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-40 dark:text-zinc-300 dark:hover:text-zinc-100"
              disabled={allVisible}
              onClick={(e) => {
                e.preventDefault();
                setManyPoiOnMap(allIds, true);
              }}
            >
              All
            </button>
            <button
              type="button"
              className="text-xs font-medium text-zinc-700 underline decoration-zinc-400 underline-offset-2 hover:text-zinc-900 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-40 dark:text-zinc-300 dark:hover:text-zinc-100"
              disabled={noneVisible}
              onClick={(e) => {
                e.preventDefault();
                setManyPoiOnMap(allIds, false);
              }}
            >
              None
            </button>
          </div>
          <ul className="space-y-0.5 px-2 pt-2">
            {groups.map((g) => {
              const allOn = g.poiIds.every((id) => isPoiOnMap(id));
              const inputId = `itinerary-poi-type-${g.key}`;
              return (
                <li key={g.key} role="option" aria-selected={allOn}>
                  <label
                    htmlFor={inputId}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
                  >
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={allOn}
                      onChange={() => setManyPoiOnMap(g.poiIds, !allOn)}
                      className="h-4 w-4 shrink-0 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                    {g.colorHex ? (
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-sm border border-zinc-300 dark:border-zinc-600"
                        style={{ backgroundColor: g.colorHex }}
                        aria-hidden
                      />
                    ) : (
                      <span className="h-3.5 w-3.5 shrink-0 rounded-sm border border-dashed border-zinc-300 dark:border-zinc-600" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1 leading-snug">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">{g.label}</span>
                      <span className="text-zinc-500 dark:text-zinc-500"> ({g.poiIds.length})</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
