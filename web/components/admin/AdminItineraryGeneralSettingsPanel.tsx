"use client";

import { useState } from "react";
import { updateItineraryVisibilityAction } from "@/lib/actions/adminItinerary";

type Props = {
  itineraryId: string;
  title: string;
  description: string | null;
  slug: string;
  tripStartDateInput: string;
  tripStartDisplay: string | null;
  isFeatured: boolean;
  isPublic: boolean;
  updatedAtLabel: string;
};

export function AdminItineraryGeneralSettingsPanel({
  itineraryId,
  title,
  description,
  slug,
  tripStartDateInput,
  tripStartDisplay,
  isFeatured,
  isPublic,
  updatedAtLabel,
}: Props) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="mb-6 rounded border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{title}</div>
          {!editing && (
            <>
              {description ? (
                <p className="mt-2 max-w-xl whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
                  {description}
                </p>
              ) : (
                <p className="mt-2 text-sm italic text-zinc-500 dark:text-zinc-500">No description</p>
              )}
              <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
                <span className="font-medium text-zinc-900 dark:text-zinc-50">Trip start: </span>
                {tripStartDisplay ?? "Not set"}
              </p>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                Public link:{" "}
                <span className="font-mono text-zinc-700 dark:text-zinc-400">/itineraries/{slug}</span>
              </p>
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                <span className="font-medium text-zinc-900 dark:text-zinc-50">Featured: </span>
                {isFeatured ? "Yes" : "No"}
                <span className="mx-2 text-zinc-400">·</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">Public: </span>
                {isPublic ? "Yes" : "No"}
              </p>
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">Updated: {updatedAtLabel}</p>
            </>
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
          key={itineraryId}
          action={updateItineraryVisibilityAction}
          className="mt-4 flex flex-col"
        >
          <input type="hidden" name="id" value={itineraryId} />
          <label className="mb-4 flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Title</span>
            <input
              name="title"
              type="text"
              required
              defaultValue={title}
              className="max-w-xl rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <label className="mb-4 flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Description</span>
            <textarea
              name="description"
              rows={4}
              placeholder="Short summary for listings and the public page…"
              defaultValue={description ?? ""}
              className="max-w-xl rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-500">
              Optional. Clear the field and save to remove it.
            </span>
          </label>
          <label className="mb-4 flex max-w-xl flex-col gap-1">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Trip start date <span className="font-normal text-zinc-500">(optional)</span>
            </span>
            <input
              type="date"
              name="tripStartDate"
              defaultValue={tripStartDateInput}
              className="max-w-xs rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-500">
              When set, each stop gets the next calendar day in trip order (cities top to bottom, then day numbers).
              Dates refresh when stops change. Clear the field and save to turn off auto mode — if a trip start was saved
              before, clearing it also clears every stop&apos;s calendar date.
            </span>
          </label>
          <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-500">
            The public link is built from the title when you save:{" "}
            <span className="font-mono text-zinc-700 dark:text-zinc-400">/itineraries/{slug}</span>. If you change the
            title, the link may change too — bookmarks and shared URLs for the old address will stop working.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-50">
              <input
                type="checkbox"
                name="isFeatured"
                defaultChecked={isFeatured}
                className="h-4 w-4"
              />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-50">
              <input type="checkbox" name="isPublic" defaultChecked={isPublic} className="h-4 w-4" />
              Public
            </label>
            <button
              type="submit"
              className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Save
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">Updated: {updatedAtLabel}</p>
        </form>
      )}
    </div>
  );
}
