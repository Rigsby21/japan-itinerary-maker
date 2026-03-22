"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminDayTripAddDestinationForm } from "@/components/admin/AdminDayTripAddDestinationForm";
import { AdminDayTripPlannerMap } from "@/components/admin/AdminDayTripPlannerMap";
import {
  createDayTripAction,
  createDayTripPhotoUrlAction,
  deleteDayTripAction,
  deleteDayTripDestinationAction,
  deleteDayTripPhotoAction,
  moveDayTripAction,
  moveDayTripDestinationAction,
  updateDayTripAction,
} from "@/lib/actions/adminItinerary";
import { adminItineraryHref } from "@/lib/adminItineraryUrl";
import { MAX_DAY_TRIP_PHOTOS } from "@/lib/poiPhotoLimits";

type Stop = {
  id: string;
  cityName: string;
  dayIndexInCity: number;
  orderIndex: number;
  placeName: string;
  lat: number | null;
  lng: number | null;
  dayTrips: Array<{
    id: string;
    orderIndex: number;
    title: string;
    shortDescription: string | null;
    description: string | null;
    durationText: string | null;
    costNote: string | null;
    destinations: Array<{
      id: string;
      orderIndex: number;
      placeName: string;
      lat: number;
      lng: number;
      notes: string | null;
    }>;
    photos: Array<{
      id: string;
      url: string | null;
      storagePath: string | null;
      caption: string | null;
      orderIndex: number;
    }>;
  }>;
};

function stopHasCoords(s: Stop): boolean {
  return s.lat != null && s.lng != null && Number.isFinite(s.lat) && Number.isFinite(s.lng);
}

function defaultStopId(stops: Stop[]): string {
  const withCoords = stops.find(stopHasCoords);
  return (withCoords ?? stops[0])?.id ?? "";
}

export function AdminDayTripsPanel({
  itineraryId,
  stops,
}: {
  itineraryId: string;
  stops: Stop[];
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedStopId, setSelectedStopId] = useState<string>(() => defaultStopId(stops));
  /** When this day already has trips, the create form stays hidden until "+ Add another day trip". */
  const [showNewTripForm, setShowNewTripForm] = useState(false);

  const stopIdsKey = useMemo(() => stops.map((s) => s.id).join(","), [stops]);

  useEffect(() => {
    setSelectedStopId((prev) => (stops.some((s) => s.id === prev) ? prev : defaultStopId(stops)));
  }, [stopIdsKey, stops]);

  useEffect(() => {
    setShowNewTripForm(false);
  }, [selectedStopId]);

  const totalTrips = useMemo(() => stops.reduce((n, s) => n + s.dayTrips.length, 0), [stops]);

  /** Collapsed-tab list: itinerary order of stops, then trip order within each day. */
  const tripSummaries = useMemo(() => {
    const rows: Array<{
      stopId: string;
      cityName: string;
      dayIndexInCity: number;
      tripId: string;
      title: string;
      shortDescription: string | null;
    }> = [];
    for (const s of stops) {
      const sorted = [...s.dayTrips].sort((a, b) => a.orderIndex - b.orderIndex);
      for (const dt of sorted) {
        rows.push({
          stopId: s.id,
          cityName: s.cityName,
          dayIndexInCity: s.dayIndexInCity,
          tripId: dt.id,
          title: dt.title,
          shortDescription: dt.shortDescription,
        });
      }
    }
    return rows;
  }, [stops]);

  const selectedStop = stops.find((s) => s.id === selectedStopId) ?? null;

  return (
    <>
      <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Day trips</div>

      {!panelOpen ? (
        <>
          <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-500">
            Day trips attach to a <strong>city</strong> and <strong>day</strong> that already has map coordinates. Set pins on{" "}
            <Link href={adminItineraryHref(itineraryId, "cities")} className="font-medium underline">
              Cities &amp; days
            </Link>{" "}
            first.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedStopId(defaultStopId(stops));
              setPanelOpen(true);
            }}
            disabled={stops.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-lg font-light leading-none text-white dark:bg-zinc-100 dark:text-zinc-900">
              +
            </span>
            Add day trip
          </button>
          {stops.length === 0 && (
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">Add at least one city and day before creating day trips.</p>
          )}

          {tripSummaries.length > 0 && (
            <div className="mt-6">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                  Your day trips
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-500">
                  {totalTrips} total — click one to edit
                </span>
              </div>
              <ul className="flex flex-col gap-2">
                {tripSummaries.map((row) => (
                  <li key={row.tripId}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStopId(row.stopId);
                        setPanelOpen(true);
                      }}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-left transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900/80"
                    >
                      <div className="font-medium text-zinc-900 dark:text-zinc-50">{row.title}</div>
                      <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {row.cityName} · Day {row.dayIndexInCity}
                      </div>
                      {row.shortDescription ? (
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">{row.shortDescription}</p>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                Choose which <strong>city</strong> and <strong>day</strong> this work applies to, then add or edit trips for that
                day.
              </p>
              <label className="mt-3 flex max-w-xl flex-col gap-1">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">City &amp; day</span>
                <select
                  value={selectedStopId}
                  onChange={(e) => setSelectedStopId(e.target.value)}
                  className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                >
                  {stops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.cityName} · Day {s.dayIndexInCity}: {s.placeName}
                      {stopHasCoords(s) ? "" : " (needs coordinates)"}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="shrink-0 text-xs font-medium text-zinc-600 underline decoration-zinc-400 underline-offset-2 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Close
            </button>
          </div>

          {selectedStop == null ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">No stops on this itinerary.</p>
          ) : !stopHasCoords(selectedStop) ? (
            <p className="text-sm text-amber-800 dark:text-amber-200/90">
              Add coordinates for <strong>{selectedStop.cityName} · Day {selectedStop.dayIndexInCity}</strong> on{" "}
              <Link href={adminItineraryHref(itineraryId, "cities")} className="font-medium underline">
                Cities &amp; days
              </Link>{" "}
              before creating day trips.
            </p>
          ) : (
            <>
              {selectedStop.dayTrips.length > 0 ? (
                <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-500">
                  Use the <strong>route planner map</strong> to choose which day trip you&apos;re building, then{" "}
                  <strong>click the map</strong> to add more stops in order. Edit titles, descriptions, and photos in each card
                  below. Routes match the public Day trips tab.
                </p>
              ) : (
                <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-500">
                  Create your <strong>first day trip</strong> with the form below the map, then use the <strong>route planner</strong>{" "}
                  to add destinations by clicking the map. Each trip starts from this day&apos;s pin.
                </p>
              )}

              <div className="border-b border-zinc-100 pb-4 dark:border-zinc-800">
                <AdminDayTripPlannerMap
                  itineraryId={itineraryId}
                  cityName={selectedStop.cityName}
                  dayIndexInCity={selectedStop.dayIndexInCity}
                  stopPlaceName={selectedStop.placeName}
                  originLat={selectedStop.lat!}
                  originLng={selectedStop.lng!}
                  dayTrips={selectedStop.dayTrips.map((dt) => ({
                    id: dt.id,
                    title: dt.title,
                    orderIndex: dt.orderIndex,
                    destinations: dt.destinations.map((d) => ({
                      id: d.id,
                      orderIndex: d.orderIndex,
                      placeName: d.placeName,
                      lat: d.lat,
                      lng: d.lng,
                    })),
                  }))}
                />
              </div>

              {selectedStop.dayTrips.length === 0 && (
                <div className="mt-4 space-y-2 border-b border-zinc-100 pb-4 dark:border-zinc-800">
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">New day trip</span>
                  <form action={createDayTripAction} className="space-y-2">
                    <input type="hidden" name="itineraryId" value={itineraryId} />
                    <input type="hidden" name="stopId" value={selectedStop.id} />
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Title *</span>
                      <input
                        name="title"
                        required
                        className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Short description</span>
                      <input
                        name="shortDescription"
                        className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Long description</span>
                      <textarea
                        name="description"
                        rows={3}
                        className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                      />
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Duration</span>
                        <input
                          name="durationText"
                          placeholder="e.g. ~3 hours"
                          className="w-44 rounded border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Cost note</span>
                        <input
                          name="costNote"
                          placeholder="e.g. ¥500 train"
                          className="w-52 rounded border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                        />
                      </label>
                    </div>
                    <button
                      type="submit"
                      className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                    >
                      Create day trip
                    </button>
                  </form>
                </div>
              )}

              <ul className="mt-4 flex flex-col gap-4">
                {selectedStop.dayTrips.map((dt, tIdx) => (
                  <li key={dt.id} className="rounded border border-zinc-100 p-3 dark:border-zinc-800">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Day trip {tIdx + 1} (order {dt.orderIndex + 1})
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <form action={moveDayTripAction}>
                          <input type="hidden" name="itineraryId" value={itineraryId} />
                          <input type="hidden" name="dayTripId" value={dt.id} />
                          <input type="hidden" name="direction" value="up" />
                          <button
                            type="submit"
                            className="text-xs font-medium text-zinc-600 underline dark:text-zinc-400"
                          >
                            Up
                          </button>
                        </form>
                        <form action={moveDayTripAction}>
                          <input type="hidden" name="itineraryId" value={itineraryId} />
                          <input type="hidden" name="dayTripId" value={dt.id} />
                          <input type="hidden" name="direction" value="down" />
                          <button
                            type="submit"
                            className="text-xs font-medium text-zinc-600 underline dark:text-zinc-400"
                          >
                            Down
                          </button>
                        </form>
                        <form action={deleteDayTripAction}>
                          <input type="hidden" name="itineraryId" value={itineraryId} />
                          <input type="hidden" name="dayTripId" value={dt.id} />
                          <button
                            type="submit"
                            className="text-xs font-medium text-red-700 underline dark:text-red-300"
                          >
                            Delete trip
                          </button>
                        </form>
                      </div>
                    </div>

                    <form action={updateDayTripAction} className="mt-3 space-y-2">
                      <input type="hidden" name="itineraryId" value={itineraryId} />
                      <input type="hidden" name="dayTripId" value={dt.id} />
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Title</span>
                        <input
                          name="title"
                          required
                          defaultValue={dt.title}
                          className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Short description</span>
                        <input
                          name="shortDescription"
                          defaultValue={dt.shortDescription ?? ""}
                          className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Long description</span>
                        <textarea
                          name="description"
                          rows={3}
                          defaultValue={dt.description ?? ""}
                          className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                        />
                      </label>
                      <div className="flex flex-wrap gap-3">
                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Duration</span>
                          <input
                            name="durationText"
                            defaultValue={dt.durationText ?? ""}
                            className="w-44 rounded border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Cost note</span>
                          <input
                            name="costNote"
                            defaultValue={dt.costNote ?? ""}
                            className="w-52 rounded border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                          />
                        </label>
                      </div>
                      <button
                        type="submit"
                        className="rounded border border-zinc-300 px-3 py-1.5 text-sm font-medium dark:border-zinc-600"
                      >
                        Save trip details
                      </button>
                    </form>

                    <div className="mt-4">
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Destinations (in order)</span>
                      <ul className="mt-2 space-y-2">
                        {dt.destinations.map((d, dIdx) => (
                          <li
                            key={d.id}
                            className="flex flex-col gap-1 rounded border border-zinc-100 px-2 py-2 text-sm dark:border-zinc-800"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span>
                                {dIdx + 1}. {d.placeName}{" "}
                                <span className="text-xs text-zinc-500">
                                  {d.lat.toFixed(4)}, {d.lng.toFixed(4)}
                                </span>
                              </span>
                              <div className="flex gap-2">
                                <form action={moveDayTripDestinationAction}>
                                  <input type="hidden" name="itineraryId" value={itineraryId} />
                                  <input type="hidden" name="destinationId" value={d.id} />
                                  <input type="hidden" name="direction" value="up" />
                                  <button type="submit" className="text-xs underline">
                                    Up
                                  </button>
                                </form>
                                <form action={moveDayTripDestinationAction}>
                                  <input type="hidden" name="itineraryId" value={itineraryId} />
                                  <input type="hidden" name="destinationId" value={d.id} />
                                  <input type="hidden" name="direction" value="down" />
                                  <button type="submit" className="text-xs underline">
                                    Down
                                  </button>
                                </form>
                                <form action={deleteDayTripDestinationAction}>
                                  <input type="hidden" name="itineraryId" value={itineraryId} />
                                  <input type="hidden" name="destinationId" value={d.id} />
                                  <button type="submit" className="text-xs text-red-700 underline dark:text-red-300">
                                    Remove
                                  </button>
                                </form>
                              </div>
                            </div>
                            {d.notes && <p className="text-xs text-zinc-600 dark:text-zinc-400">{d.notes}</p>}
                          </li>
                        ))}
                      </ul>

                      <AdminDayTripAddDestinationForm
                        key={dt.id}
                        itineraryId={itineraryId}
                        dayTripId={dt.id}
                        originLat={selectedStop.lat!}
                        originLng={selectedStop.lng!}
                      />
                    </div>

                    <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        Photos ({dt.photos.length}/{MAX_DAY_TRIP_PHOTOS})
                      </span>
                      <ul className="mt-2 space-y-2">
                        {dt.photos.map((ph) => (
                          <li key={ph.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="truncate text-zinc-600 dark:text-zinc-400">
                              {ph.url ?? ph.storagePath ?? ph.id}
                              {ph.caption ? ` — ${ph.caption}` : ""}
                            </span>
                            <form action={deleteDayTripPhotoAction}>
                              <input type="hidden" name="itineraryId" value={itineraryId} />
                              <input type="hidden" name="photoId" value={ph.id} />
                              <button type="submit" className="text-red-700 underline dark:text-red-300">
                                Delete
                              </button>
                            </form>
                          </li>
                        ))}
                      </ul>
                      {dt.photos.length < MAX_DAY_TRIP_PHOTOS && (
                        <form action={createDayTripPhotoUrlAction} className="mt-2 flex flex-col gap-2">
                          <input type="hidden" name="itineraryId" value={itineraryId} />
                          <input type="hidden" name="dayTripId" value={dt.id} />
                          <input
                            name="url"
                            type="url"
                            placeholder="https://…"
                            required
                            className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                          />
                          <input
                            name="caption"
                            placeholder="Caption (optional)"
                            className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                          />
                          <button
                            type="submit"
                            className="w-fit rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600"
                          >
                            Add photo URL
                          </button>
                        </form>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {selectedStop.dayTrips.length > 0 && showNewTripForm && (
                <div className="mt-4 space-y-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">New day trip</span>
                    <button
                      type="button"
                      onClick={() => setShowNewTripForm(false)}
                      className="text-xs font-medium text-zinc-600 underline dark:text-zinc-400"
                    >
                      Cancel
                    </button>
                  </div>
                  <form action={createDayTripAction} className="space-y-2">
                    <input type="hidden" name="itineraryId" value={itineraryId} />
                    <input type="hidden" name="stopId" value={selectedStop.id} />
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Title *</span>
                      <input
                        name="title"
                        required
                        className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Short description</span>
                      <input
                        name="shortDescription"
                        className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Long description</span>
                      <textarea
                        name="description"
                        rows={3}
                        className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                      />
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Duration</span>
                        <input
                          name="durationText"
                          placeholder="e.g. ~3 hours"
                          className="w-44 rounded border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Cost note</span>
                        <input
                          name="costNote"
                          placeholder="e.g. ¥500 train"
                          className="w-52 rounded border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                        />
                      </label>
                    </div>
                    <button
                      type="submit"
                      className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                    >
                      Create day trip
                    </button>
                  </form>
                </div>
              )}

              {selectedStop.dayTrips.length > 0 && !showNewTripForm && (
                <button
                  type="button"
                  onClick={() => setShowNewTripForm(true)}
                  className="mt-4 text-xs font-medium text-zinc-700 underline decoration-zinc-400 underline-offset-2 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                >
                  + Add another day trip
                </button>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
