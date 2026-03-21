import Link from "next/link";
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
  dayNumber: number;
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

export function AdminDayTripsPanel({
  itineraryId,
  stops,
}: {
  itineraryId: string;
  stops: Stop[];
}) {
  return (
    <>
      <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Day trips</div>
      <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-500">
        Each day trip belongs to a stop with coordinates. Use the <strong>route planner map</strong> on each stop to choose a
        trip and <strong>click the map</strong> to add destinations in order (or add lat/lng manually below). Routes match the
        public <strong>Day trips</strong> tab and use the same travel modes as the itinerary overview.
      </p>
      <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-500">
        Stops need lat/lng — set them on the{" "}
        <Link href={adminItineraryHref(itineraryId, "stops")} className="font-medium underline">
          Stops
        </Link>{" "}
        tab first.
      </p>

      <ul className="flex flex-col gap-6">
        {stops.map((s) => (
          <li key={s.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Day {s.dayNumber} • Stop {s.orderIndex + 1}: {s.placeName}
            </h3>
            {s.lat == null || s.lng == null ? (
              <p className="mt-2 text-sm text-amber-800 dark:text-amber-200/90">
                Add coordinates for this stop before creating day trips.
              </p>
            ) : (
              <>
                <form action={createDayTripAction} className="mt-4 space-y-2 border-b border-zinc-100 pb-4 dark:border-zinc-800">
                  <input type="hidden" name="itineraryId" value={itineraryId} />
                  <input type="hidden" name="stopId" value={s.id} />
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">New day trip</span>
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

                <ul className="mt-4 flex flex-col gap-4">
                  {s.dayTrips.map((dt, tIdx) => (
                    <li key={dt.id} className="rounded border border-zinc-100 p-3 dark:border-zinc-800">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          Trip {tIdx + 1} (order {dt.orderIndex + 1})
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
                          originLat={s.lat!}
                          originLng={s.lng!}
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
              </>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
