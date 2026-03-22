"use client";

import Link from "next/link";
import { useState } from "react";
import { createItineraryCityWithDaysAction } from "@/lib/actions/adminItinerary";
import { adminItineraryHref } from "@/lib/adminItineraryUrl";

type Props = {
  itineraryId: string;
};

export function AdminAddCityPanel({ itineraryId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-6">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-lg font-light leading-none text-white dark:bg-zinc-100 dark:text-zinc-900">
            +
          </span>
          Add city
        </button>
      ) : (
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-zinc-600 underline decoration-zinc-400 underline-offset-2 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Cancel
            </button>
          </div>
          <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-500">
            <strong>Default:</strong> each new city is a <strong>single stop</strong> (one map below that city). Add another
            city for the next place, and use{" "}
            <Link
              href={adminItineraryHref(itineraryId, "markers")}
              className="font-medium text-zinc-700 underline dark:text-zinc-300"
            >
              marker POIs
            </Link>{" "}
            and{" "}
            <Link
              href={adminItineraryHref(itineraryId, "day-trips")}
              className="font-medium text-zinc-700 underline dark:text-zinc-300"
            >
              day trips
            </Link>{" "}
            for extra locations. <strong>Legacy multi-day</strong> cities can still have multiple numbered days in one city.
          </p>

          <form action={createItineraryCityWithDaysAction} className="flex flex-col gap-3">
            <input type="hidden" name="itineraryId" value={itineraryId} />
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">City name</span>
              <input
                name="cityName"
                required
                placeholder="e.g. Kyoto"
                className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>
            <fieldset className="flex flex-col gap-2 border-0 p-0">
              <legend className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">City type</legend>
              <label className="flex cursor-pointer items-start gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                <input
                  type="radio"
                  name="cityCreationMode"
                  value="single"
                  defaultChecked
                  className="mt-1"
                />
                <span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">Single stop</span> — one main row (Day 1).
                  Recommended.
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                <input type="radio" name="cityCreationMode" value="legacy" className="mt-1" />
                <span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">Legacy multi-day</span> — several numbered
                  days in this city (older itineraries).
                </span>
              </label>
            </fieldset>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Number of days (legacy multi-day only)
              </span>
              <select
                name="daysCount"
                defaultValue={3}
                className="max-w-xs rounded border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              >
                {Array.from({ length: 21 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "day" : "days"}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="w-fit rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Create city
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
