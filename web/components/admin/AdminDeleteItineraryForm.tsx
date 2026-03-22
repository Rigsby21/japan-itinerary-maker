"use client";

import { deleteItineraryAction } from "@/lib/actions/adminItinerary";

export function AdminDeleteItineraryForm({
  itineraryId,
  title,
}: {
  itineraryId: string;
  title: string;
}) {
  return (
    <form
      action={deleteItineraryAction}
      className="inline"
      onSubmit={(e) => {
        const ok = window.confirm(
          `Delete “${title}” and all its cities, days, POIs, day trips, and tips? This cannot be undone.`,
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="itineraryId" value={itineraryId} />
      <button
        type="submit"
        className="text-sm font-medium text-red-600 underline hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
      >
        Delete
      </button>
    </form>
  );
}
