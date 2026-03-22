"use client";

import { useState } from "react";
import { updateItineraryStopDetailsAction } from "@/lib/actions/adminItinerary";

type Props = {
  itineraryId: string;
  stopId: string;
  dayIndexInCity: number;
  placeName: string;
  stopAreaLabel: string | null;
  notes: string | null;
};

export function AdminStopDayDetailsPanel({
  itineraryId,
  stopId,
  dayIndexInCity,
  placeName,
  stopAreaLabel,
  notes,
}: Props) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="mb-3">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Day {dayIndexInCity}: {placeName}
          </div>
          {!editing && stopAreaLabel && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{stopAreaLabel}</p>
          )}
          {!editing && notes && (
            <p className="mt-1 whitespace-pre-wrap text-xs text-zinc-600 dark:text-zinc-400">
              {notes}
            </p>
          )}
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 text-xs font-medium text-zinc-700 underline decoration-zinc-400 underline-offset-2 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
          >
            Edit
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="shrink-0 text-xs font-medium text-zinc-700 underline decoration-zinc-400 underline-offset-2 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
          >
            Cancel
          </button>
        )}
      </div>

      {editing && (
        <form
          key={stopId}
          action={updateItineraryStopDetailsAction}
          className="mt-3 flex flex-col gap-2 rounded border border-zinc-100 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/40"
        >
          <input type="hidden" name="itineraryId" value={itineraryId} />
          <input type="hidden" name="stopId" value={stopId} />
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
              Place / day title
            </span>
            <input
              type="text"
              name="placeName"
              defaultValue={placeName}
              required
              className="rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
              Area label (optional)
            </span>
            <input
              type="text"
              name="stopAreaLabel"
              defaultValue={stopAreaLabel ?? ""}
              className="rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
              Notes (optional)
            </span>
            <textarea
              name="notes"
              rows={2}
              defaultValue={notes ?? ""}
              className="rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <button
            type="submit"
            className="self-start rounded bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Save day details
          </button>
        </form>
      )}
    </div>
  );
}
