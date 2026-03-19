import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import {
  createPoiPhotoUrlAction,
  createPoiAction,
  createMarkerTypeAction,
  deletePoiPhotoAction,
  deleteMarkerTypeAction,
  deletePoiAction,
  updateItineraryVisibilityAction,
} from "@/lib/actions/adminItinerary";

export const dynamic = "force-dynamic";

export default async function AdminItineraryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
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
  }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const query = await searchParams;

  const prisma = getPrisma();
  const itinerary = await prisma.itinerary.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      isFeatured: true,
      isPublic: true,
      updatedAt: true,
      markerTypes: {
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, colorHex: true },
      },
      stops: {
        orderBy: [{ dayNumber: "asc" }, { orderIndex: "asc" }],
        select: {
          id: true,
          dayNumber: true,
          orderIndex: true,
          placeName: true,
          city: true,
          lat: true,
          lng: true,
          pois: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              title: true,
              description: true,
              lat: true,
              lng: true,
              markerType: { select: { id: true, name: true, colorHex: true } },
              photos: {
                orderBy: { orderIndex: "asc" },
                select: { id: true, url: true, caption: true, orderIndex: true },
              },
            },
          },
        },
      },
    },
  });

  if (!itinerary) notFound();

  const saved = query?.saved === "1";
  const markerTypeSaved = query?.markerTypeSaved === "1";
  const markerTypeDeleted = query?.markerTypeDeleted === "1";
  const markerTypeError = query?.markerTypeError ?? null;
  const poiSaved = query?.poiSaved === "1";
  const poiDeleted = query?.poiDeleted === "1";
  const poiError = query?.poiError ?? null;
  const poiPhotoSaved = query?.poiPhotoSaved === "1";
  const poiPhotoDeleted = query?.poiPhotoDeleted === "1";
  const poiPhotoError = query?.poiPhotoError ?? null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-3xl rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Manage itinerary
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {itinerary.title} <span className="text-zinc-400">({itinerary.slug})</span>
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm font-medium text-zinc-900 underline dark:text-zinc-50"
          >
            ← Back to admin
          </Link>
        </div>

        {saved && (
          <p className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-900 dark:bg-green-900/30 dark:text-green-200">
            Saved.
          </p>
        )}

        {markerTypeSaved && (
          <p className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-900 dark:bg-green-900/30 dark:text-green-200">
            Marker type saved.
          </p>
        )}

        {markerTypeDeleted && (
          <p className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-900 dark:bg-green-900/30 dark:text-green-200">
            Marker type deleted.
          </p>
        )}

        {poiSaved && (
          <p className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-900 dark:bg-green-900/30 dark:text-green-200">
            POI saved.
          </p>
        )}

        {poiDeleted && (
          <p className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-900 dark:bg-green-900/30 dark:text-green-200">
            POI deleted.
          </p>
        )}

        {poiPhotoSaved && (
          <p className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-900 dark:bg-green-900/30 dark:text-green-200">
            POI photo saved.
          </p>
        )}

        {poiPhotoDeleted && (
          <p className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-900 dark:bg-green-900/30 dark:text-green-200">
            POI photo deleted.
          </p>
        )}

        {markerTypeError && (
          <p className="mb-4 rounded bg-red-100 px-3 py-2 text-sm text-red-900 dark:bg-red-900/30 dark:text-red-200">
            {markerTypeError === "missing-name"
              ? "Marker type name is required."
              : markerTypeError === "bad-color"
                ? "Color must be a hex value like #FF0000."
                : markerTypeError === "duplicate"
                  ? "That marker type name already exists for this itinerary."
                  : "Could not save marker type."}
          </p>
        )}

        {poiError && (
          <p className="mb-4 rounded bg-red-100 px-3 py-2 text-sm text-red-900 dark:bg-red-900/30 dark:text-red-200">
            {poiError === "missing-title"
              ? "POI title is required."
              : poiError === "bad-coordinates"
                ? "POI lat/lng must be valid numbers."
                : poiError === "bad-stop"
                  ? "That stop doesn't belong to this itinerary."
                  : "Could not save POI."}
          </p>
        )}

        {poiPhotoError && (
          <p className="mb-4 rounded bg-red-100 px-3 py-2 text-sm text-red-900 dark:bg-red-900/30 dark:text-red-200">
            {poiPhotoError === "missing-url"
              ? "Photo URL is required."
              : poiPhotoError === "bad-url"
                ? "Photo URL must start with http:// or https://"
                : "Could not save photo."}
          </p>
        )}

        <form action={updateItineraryVisibilityAction} className="mb-6 rounded border border-zinc-200 p-4 dark:border-zinc-800">
          <input type="hidden" name="id" value={itinerary.id} />
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-50">
              <input
                type="checkbox"
                name="isFeatured"
                defaultChecked={itinerary.isFeatured}
                className="h-4 w-4"
              />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-50">
              <input
                type="checkbox"
                name="isPublic"
                defaultChecked={itinerary.isPublic}
                className="h-4 w-4"
              />
              Public
            </label>
            <button
              type="submit"
              className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Save
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
            Updated: {new Date(itinerary.updatedAt).toLocaleString()}
          </p>
        </form>

        <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Marker types</div>
        <div className="mb-6 rounded border border-zinc-200 p-4 dark:border-zinc-800">
          <form action={createMarkerTypeAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="itineraryId" value={itinerary.id} />
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Name</span>
              <input
                name="name"
                placeholder="Food, Shrine, Hotel…"
                className="w-56 rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Color</span>
              <input
                name="colorHex"
                type="color"
                defaultValue="#FF0000"
                className="h-10 w-16 cursor-pointer rounded border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950"
                aria-label="Pick a color"
              />
            </label>
            <button
              type="submit"
              className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Add type
            </button>
          </form>

          {itinerary.markerTypes.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              No marker types yet. Add one above.
            </p>
          ) : (
            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {itinerary.markerTypes.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded border border-zinc-200 px-3 py-2 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: t.colorHex }}
                      aria-hidden
                    />
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {t.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 dark:text-zinc-500">{t.colorHex}</span>
                    <form action={deleteMarkerTypeAction}>
                      <input type="hidden" name="itineraryId" value={itinerary.id} />
                      <input type="hidden" name="markerTypeId" value={t.id} />
                      <button
                        type="submit"
                        className="text-xs font-medium text-red-700 underline hover:text-red-800 dark:text-red-300 dark:hover:text-red-200"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Stops
        </div>
        {itinerary.stops.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">No stops yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {itinerary.stops.map((s) => (
              <li key={s.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    Day {s.dayNumber} • Stop {s.orderIndex + 1}: {s.placeName}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-500">
                    {s.city ?? "—"} • {s.lat?.toFixed(5) ?? "—"}, {s.lng?.toFixed(5) ?? "—"}
                  </div>
                </div>
                <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                  Add POIs (markers) under this stop.
                </div>

                <div className="mt-3 rounded border border-zinc-200 p-3 dark:border-zinc-800">
                  <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">POIs</div>

                  <form action={createPoiAction} className="flex flex-wrap items-end gap-3">
                    <input type="hidden" name="itineraryId" value={itinerary.id} />
                    <input type="hidden" name="stopId" value={s.id} />

                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Title</span>
                      <input
                        name="title"
                        placeholder="Ramen shop, viewpoint…"
                        className="w-56 rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Marker type</span>
                      <select
                        name="markerTypeId"
                        className="w-44 rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                        defaultValue="none"
                      >
                        <option value="none">None</option>
                        {itinerary.markerTypes.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.colorHex})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Lat</span>
                      <input
                        name="lat"
                        placeholder="35.710063"
                        inputMode="decimal"
                        className="w-32 rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Lng</span>
                      <input
                        name="lng"
                        placeholder="139.810700"
                        inputMode="decimal"
                        className="w-32 rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Description (optional)</span>
                      <input
                        name="description"
                        placeholder="What to do / tips…"
                        className="w-72 rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                      />
                    </label>

                    <button
                      type="submit"
                      className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      Add POI
                    </button>
                  </form>

                  {s.pois.length === 0 ? (
                    <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">No POIs yet.</p>
                  ) : (
                    <ul className="mt-3 flex flex-col gap-2">
                      {s.pois.map((p) => (
                        <li
                          key={p.id}
                          className="flex flex-wrap items-start justify-between gap-3 rounded border border-zinc-200 px-3 py-2 dark:border-zinc-800"
                        >
                          <div className="min-w-[240px] flex-1">
                            <div className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                              {p.markerType ? (
                                <span
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: p.markerType.colorHex }}
                                  aria-hidden
                                />
                              ) : (
                                <span className="h-3 w-3 rounded-full bg-zinc-300 dark:bg-zinc-700" aria-hidden />
                              )}
                              {p.title}
                              {p.markerType && (
                                <span className="text-xs font-normal text-zinc-500 dark:text-zinc-500">
                                  ({p.markerType.name})
                                </span>
                              )}
                            </div>
                            {p.description && (
                              <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{p.description}</div>
                            )}
                            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                              {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                            </div>

                            <div className="mt-3 rounded border border-zinc-200 p-3 dark:border-zinc-800">
                              <div className="mb-2 text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                                Photos
                              </div>

                              <form action={createPoiPhotoUrlAction} className="flex flex-wrap items-end gap-2">
                                <input type="hidden" name="itineraryId" value={itinerary.id} />
                                <input type="hidden" name="poiId" value={p.id} />
                                <label className="flex flex-col gap-1">
                                  <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Image URL</span>
                                  <input
                                    name="url"
                                    placeholder="https://..."
                                    className="w-80 rounded border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                                  />
                                </label>
                                <label className="flex flex-col gap-1">
                                  <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Caption (optional)</span>
                                  <input
                                    name="caption"
                                    placeholder="e.g. Entrance"
                                    className="w-44 rounded border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                                  />
                                </label>
                                <button
                                  type="submit"
                                  className="rounded bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                >
                                  Add photo
                                </button>
                              </form>

                              {p.photos.length === 0 ? (
                                <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">No photos yet.</p>
                              ) : (
                                <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                  {p.photos.map((ph) => (
                                    <li key={ph.id} className="rounded border border-zinc-200 p-2 dark:border-zinc-800">
                                      {ph.url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={ph.url}
                                          alt={ph.caption ?? p.title}
                                          className="h-24 w-full rounded object-cover"
                                          loading="lazy"
                                        />
                                      ) : (
                                        <div className="h-24 w-full rounded bg-zinc-100 dark:bg-zinc-950" />
                                      )}
                                      <div className="mt-1 flex items-center justify-between gap-2">
                                        <div className="min-w-0 text-[11px] text-zinc-600 dark:text-zinc-400">
                                          {ph.caption ?? " "}
                                        </div>
                                        <form action={deletePoiPhotoAction}>
                                          <input type="hidden" name="itineraryId" value={itinerary.id} />
                                          <input type="hidden" name="photoId" value={ph.id} />
                                          <button
                                            type="submit"
                                            className="text-[11px] font-medium text-red-700 underline hover:text-red-800 dark:text-red-300 dark:hover:text-red-200"
                                          >
                                            Delete
                                          </button>
                                        </form>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>

                          <form action={deletePoiAction}>
                            <input type="hidden" name="itineraryId" value={itinerary.id} />
                            <input type="hidden" name="poiId" value={p.id} />
                            <button
                              type="submit"
                              className="text-xs font-medium text-red-700 underline hover:text-red-800 dark:text-red-300 dark:hover:text-red-200"
                            >
                              Delete
                            </button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

