import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import {
  createBudgetLineAction,
  createPoiPhotoUrlAction,
  createMarkerTypeAction,
  createTravelTipAction,
  deleteItineraryStopAction,
  deleteBudgetLineAction,
  deletePoiPhotoAction,
  deleteMarkerTypeAction,
  deletePoiAction,
  deleteTravelTipAction,
  updateBudgetCurrencyAction,
  updateBudgetLineAction,
  updateItineraryVisibilityAction,
  updateTravelTipAction,
} from "@/lib/actions/adminItinerary";
import { BUDGET_CURRENCIES } from "@/lib/budgetCurrencies";
import { englishOrdinal } from "@/lib/englishOrdinal";
import { MAX_DAY_TRIP_PHOTOS, MAX_POI_PHOTOS_PER_POI } from "@/lib/poiPhotoLimits";
import { loadItineraryTipsBudgetAndCurrency } from "@/lib/itineraries";
import {
  adminItineraryHref,
  resolveAdminItineraryTab,
  type AdminItineraryTab,
} from "@/lib/adminItineraryUrl";
import { AdminDayTripsPanel } from "@/components/admin/AdminDayTripsPanel";
import { AdminPoiPickMapForm } from "@/components/maps/AdminPoiPickMapForm";
import { AdminStopsPickMap } from "@/components/maps/AdminStopsPickMap";

export const dynamic = "force-dynamic";

export default async function AdminItineraryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    tab?: string;
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
    tipSaved?: string;
    tipUpdated?: string;
    tipDeleted?: string;
    tipError?: string;
    budgetCurrencySaved?: string;
    budgetLineSaved?: string;
    budgetLineUpdated?: string;
    budgetLineDeleted?: string;
    budgetError?: string;
    stopSaved?: string;
    stopDeleted?: string;
    stopError?: string;
    itineraryError?: string;
    dayTripSaved?: string;
    dayTripUpdated?: string;
    dayTripDeleted?: string;
    dayTripMoved?: string;
    dayTripError?: string;
    dayTripDestSaved?: string;
    dayTripDestDeleted?: string;
    dayTripDestMoved?: string;
    dayTripDestError?: string;
    dayTripPhotoSaved?: string;
    dayTripPhotoDeleted?: string;
    dayTripPhotoError?: string;
  }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const query = await searchParams;

  const prisma = getPrisma();
  const base = await prisma.itinerary.findUnique({
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
          notes: true,
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
          dayTrips: {
            orderBy: { orderIndex: "asc" },
            select: {
              id: true,
              orderIndex: true,
              title: true,
              shortDescription: true,
              description: true,
              durationText: true,
              costNote: true,
              destinations: {
                orderBy: { orderIndex: "asc" },
                select: {
                  id: true,
                  orderIndex: true,
                  placeName: true,
                  lat: true,
                  lng: true,
                  notes: true,
                },
              },
              photos: {
                orderBy: { orderIndex: "asc" },
                select: {
                  id: true,
                  url: true,
                  storagePath: true,
                  caption: true,
                  orderIndex: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!base) notFound();

  const { budgetCurrency, travelTips, budgetLines } = await loadItineraryTipsBudgetAndCurrency(id);
  const itinerary = { ...base, budgetCurrency, travelTips, budgetLines };

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
  const tipSaved = query?.tipSaved === "1";
  const tipUpdated = query?.tipUpdated === "1";
  const tipDeleted = query?.tipDeleted === "1";
  const tipError = query?.tipError ?? null;
  const budgetCurrencySaved = query?.budgetCurrencySaved === "1";
  const budgetLineSaved = query?.budgetLineSaved === "1";
  const budgetLineUpdated = query?.budgetLineUpdated === "1";
  const budgetLineDeleted = query?.budgetLineDeleted === "1";
  const budgetError = query?.budgetError ?? null;
  const stopSaved = query?.stopSaved === "1";
  const stopDeleted = query?.stopDeleted === "1";
  const stopError = query?.stopError ?? null;
  const itineraryError = query?.itineraryError ?? null;
  const dayTripSaved = query?.dayTripSaved === "1";
  const dayTripUpdated = query?.dayTripUpdated === "1";
  const dayTripDeleted = query?.dayTripDeleted === "1";
  const dayTripMoved = query?.dayTripMoved === "1";
  const dayTripError = query?.dayTripError ?? null;
  const dayTripDestSaved = query?.dayTripDestSaved === "1";
  const dayTripDestDeleted = query?.dayTripDestDeleted === "1";
  const dayTripDestMoved = query?.dayTripDestMoved === "1";
  const dayTripDestError = query?.dayTripDestError ?? null;
  const dayTripPhotoSaved = query?.dayTripPhotoSaved === "1";
  const dayTripPhotoDeleted = query?.dayTripPhotoDeleted === "1";
  const dayTripPhotoError = query?.dayTripPhotoError ?? null;
  const activeTab = resolveAdminItineraryTab(query);

  const tabItems: { id: AdminItineraryTab; label: string }[] = [
    { id: "stops", label: "Stops" },
    { id: "markers", label: "Marker points" },
    { id: "day-trips", label: "Day trips" },
    { id: "budget", label: "Budget" },
    { id: "tips", label: "Travel tips" },
  ];

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
                : poiPhotoError === "max-photos"
                  ? `Each POI allows at most ${MAX_POI_PHOTOS_PER_POI} photos. Delete one to add another.`
                  : "Could not save photo."}
          </p>
        )}

        {tipSaved && (
          <p className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-900 dark:bg-green-900/30 dark:text-green-200">
            Travel tip added.
          </p>
        )}
        {tipUpdated && (
          <p className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-900 dark:bg-green-900/30 dark:text-green-200">
            Travel tip updated.
          </p>
        )}
        {tipDeleted && (
          <p className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-900 dark:bg-green-900/30 dark:text-green-200">
            Travel tip deleted.
          </p>
        )}
        {tipError && (
          <p className="mb-4 rounded bg-red-100 px-3 py-2 text-sm text-red-900 dark:bg-red-900/30 dark:text-red-200">
            {tipError === "missing-title" ? "Tip title is required." : "Could not save tip."}
          </p>
        )}
        {budgetCurrencySaved && (
          <p className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-900 dark:bg-green-900/30 dark:text-green-200">
            Budget currency saved.
          </p>
        )}
        {budgetLineSaved && (
          <p className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-900 dark:bg-green-900/30 dark:text-green-200">
            Budget line added.
          </p>
        )}
        {budgetLineUpdated && (
          <p className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-900 dark:bg-green-900/30 dark:text-green-200">
            Budget line updated.
          </p>
        )}
        {budgetLineDeleted && (
          <p className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-900 dark:bg-green-900/30 dark:text-green-200">
            Budget line deleted.
          </p>
        )}
        {budgetError && (
          <p className="mb-4 rounded bg-red-100 px-3 py-2 text-sm text-red-900 dark:bg-red-900/30 dark:text-red-200">
            {budgetError === "bad-currency"
              ? "Pick a currency from the list."
              : budgetError === "missing-category"
                ? "Budget category is required."
                : budgetError === "bad-amount"
                  ? "Enter a valid amount (0 or greater)."
                  : "Could not save budget."}
          </p>
        )}
        {stopSaved && (
          <p className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-900 dark:bg-green-900/30 dark:text-green-200">
            Stop added.
          </p>
        )}
        {stopError && (
          <p className="mb-4 rounded bg-red-100 px-3 py-2 text-sm text-red-900 dark:bg-red-900/30 dark:text-red-200">
            {stopError === "missing-place"
              ? "Place name is required."
              : stopError === "bad-day"
                ? "Day number must be 1 or greater."
                : stopError === "bad-coordinates"
                  ? "Click the map to set a location before saving."
                  : "Could not save stop."}
          </p>
        )}
        {itineraryError && (
          <p className="mb-4 rounded bg-red-100 px-3 py-2 text-sm text-red-900 dark:bg-red-900/30 dark:text-red-200">
            {itineraryError === "missing-title"
              ? "Itinerary title is required."
              : itineraryError === "title-needs-link"
                ? "Use a title with letters or numbers so we can build a web address (emoji-only titles won’t work)."
                : itineraryError === "slug-taken"
                  ? "Could not assign a unique address — try a slightly different title."
                  : "Could not save itinerary settings."}
          </p>
        )}

        {dayTripSaved && (
          <p className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-900 dark:bg-green-900/30 dark:text-green-200">
            Day trip created.
          </p>
        )}
        {dayTripUpdated && (
          <p className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-900 dark:bg-green-900/30 dark:text-green-200">
            Day trip updated.
          </p>
        )}
        {dayTripDeleted && (
          <p className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-900 dark:bg-green-900/30 dark:text-green-200">
            Day trip deleted.
          </p>
        )}
        {dayTripMoved && (
          <p className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-900 dark:bg-green-900/30 dark:text-green-200">
            Day trip order updated.
          </p>
        )}
        {dayTripError && (
          <p className="mb-4 rounded bg-red-100 px-3 py-2 text-sm text-red-900 dark:bg-red-900/30 dark:text-red-200">
            {dayTripError === "missing-title"
              ? "Day trip title is required."
              : dayTripError === "stop-needs-coords"
                ? "Add coordinates to the stop before creating a day trip."
                : dayTripError === "bad-stop" || dayTripError === "bad-trip"
                  ? "Invalid stop or day trip."
                  : "Could not save day trip."}
          </p>
        )}
        {dayTripDestSaved && (
          <p className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-900 dark:bg-green-900/30 dark:text-green-200">
            Destination added.
          </p>
        )}
        {dayTripDestDeleted && (
          <p className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-900 dark:bg-green-900/30 dark:text-green-200">
            Destination removed.
          </p>
        )}
        {dayTripDestMoved && (
          <p className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-900 dark:bg-green-900/30 dark:text-green-200">
            Destination order updated.
          </p>
        )}
        {dayTripDestError && (
          <p className="mb-4 rounded bg-red-100 px-3 py-2 text-sm text-red-900 dark:bg-red-900/30 dark:text-red-200">
            {dayTripDestError === "missing-place"
              ? "Destination name is required."
              : dayTripDestError === "bad-coords"
                ? "Enter valid latitude and longitude."
                : "Could not save destination."}
          </p>
        )}
        {dayTripPhotoSaved && (
          <p className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-900 dark:bg-green-900/30 dark:text-green-200">
            Day trip photo added.
          </p>
        )}
        {dayTripPhotoDeleted && (
          <p className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-900 dark:bg-green-900/30 dark:text-green-200">
            Day trip photo deleted.
          </p>
        )}
        {dayTripPhotoError && (
          <p className="mb-4 rounded bg-red-100 px-3 py-2 text-sm text-red-900 dark:bg-red-900/30 dark:text-red-200">
            {dayTripPhotoError === "missing-url"
              ? "Photo URL is required."
              : dayTripPhotoError === "bad-url"
                ? "Photo URL must start with http:// or https://"
                : dayTripPhotoError === "max-photos"
                  ? `Each day trip allows at most ${MAX_DAY_TRIP_PHOTOS} photos.`
                  : "Could not save photo."}
          </p>
        )}

        <form action={updateItineraryVisibilityAction} className="mb-6 rounded border border-zinc-200 p-4 dark:border-zinc-800">
          <input type="hidden" name="id" value={itinerary.id} />
          <label className="mb-4 flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Title</span>
            <input
              name="title"
              type="text"
              required
              defaultValue={itinerary.title}
              className="max-w-xl rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <label className="mb-4 flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Description</span>
            <textarea
              name="description"
              rows={4}
              placeholder="Short summary for listings and the public page…"
              defaultValue={itinerary.description ?? ""}
              className="max-w-xl rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-500">Optional. Clear the field and save to remove it.</span>
          </label>
          <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-500">
            The public link is built from the title when you save:{" "}
            <span className="font-mono text-zinc-700 dark:text-zinc-400">/itineraries/{itinerary.slug}</span>. If you change
            the title, the link may change too — bookmarks and shared URLs for the old address will stop working.
          </p>
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

        <nav
          className="mb-4 flex flex-wrap gap-1 border-b border-zinc-200 dark:border-zinc-700"
          aria-label="Itinerary editor sections"
        >
          {tabItems.map(({ id: tabId, label }) => {
            const isActive = activeTab === tabId;
            return (
              <Link
                key={tabId}
                href={adminItineraryHref(itinerary.id, tabId)}
                className={`rounded-t px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "border border-b-0 border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                    : "border border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {activeTab === "tips" && (
          <>
        <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Travel tips</div>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-500">
          Shown on the public itinerary as cards. The Travel tips tab appears only when at least one tip exists.
        </p>
        <div className="mb-6 rounded border border-zinc-200 p-4 dark:border-zinc-800">
          <form
            action={createTravelTipAction}
            className="mb-4 flex flex-col gap-2 border-b border-zinc-200 pb-4 dark:border-zinc-700"
          >
            <input type="hidden" name="itineraryId" value={itinerary.id} />
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Add tip</span>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Title</span>
              <input
                name="title"
                placeholder="e.g. Suica / PASMO"
                className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Body</span>
              <textarea
                name="body"
                rows={3}
                placeholder="Short advice for travelers…"
                className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>
            <button
              type="submit"
              className="w-fit rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Add tip
            </button>
          </form>
          {itinerary.travelTips.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">No saved tips yet.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {itinerary.travelTips.map((tip) => (
                <li key={tip.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
                  <form action={updateTravelTipAction} className="flex flex-col gap-2">
                    <input type="hidden" name="itineraryId" value={itinerary.id} />
                    <input type="hidden" name="tipId" value={tip.id} />
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Title</span>
                      <input
                        name="title"
                        defaultValue={tip.title}
                        className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Body</span>
                      <textarea
                        name="body"
                        rows={4}
                        defaultValue={tip.body}
                        className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        className="rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                      >
                        Save tip
                      </button>
                    </div>
                  </form>
                  <form action={deleteTravelTipAction} className="mt-2">
                    <input type="hidden" name="itineraryId" value={itinerary.id} />
                    <input type="hidden" name="tipId" value={tip.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-red-700 underline hover:text-red-800 dark:text-red-300 dark:hover:text-red-200"
                    >
                      Delete tip
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
          </>
        )}

        {activeTab === "budget" && (
          <>
        <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Budget</div>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-500">
          Line items and currency appear on the public Budget tab when at least one line exists.
        </p>
        <div className="mb-6 rounded border border-zinc-200 p-4 dark:border-zinc-800">
          <form action={updateBudgetCurrencyAction} className="mb-4 flex flex-wrap items-end gap-3">
            <input type="hidden" name="itineraryId" value={itinerary.id} />
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Currency</span>
              <select
                name="budgetCurrency"
                defaultValue={itinerary.budgetCurrency}
                className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              >
                {BUDGET_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Save currency
            </button>
          </form>

          <form
            action={createBudgetLineAction}
            className="mb-4 flex flex-col gap-2 border-b border-zinc-200 pb-4 dark:border-zinc-700"
          >
            <input type="hidden" name="itineraryId" value={itinerary.id} />
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Add budget line</span>
            <div className="flex flex-wrap gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Category</span>
                <input
                  name="category"
                  placeholder="Lodging, Food, Transit…"
                  className="w-48 rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Amount</span>
                <input
                  name="amount"
                  placeholder="0.00"
                  inputMode="decimal"
                  className="w-32 rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Note (optional)</span>
              <input
                name="note"
                className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>
            <button
              type="submit"
              className="w-fit rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Add line
            </button>
          </form>

          {itinerary.budgetLines.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">No saved budget lines yet.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {itinerary.budgetLines.map((line) => (
                <li key={line.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
                  <form action={updateBudgetLineAction} className="flex flex-col gap-2">
                    <input type="hidden" name="itineraryId" value={itinerary.id} />
                    <input type="hidden" name="lineId" value={line.id} />
                    <div className="flex flex-wrap gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Category</span>
                        <input
                          name="category"
                          defaultValue={line.category}
                          className="w-48 rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Amount</span>
                        <input
                          name="amount"
                          defaultValue={line.amount.toString()}
                          inputMode="decimal"
                          className="w-32 rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                        />
                      </label>
                    </div>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Note (optional)</span>
                      <input
                        name="note"
                        defaultValue={line.note ?? ""}
                        className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        className="rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                      >
                        Save line
                      </button>
                    </div>
                  </form>
                  <form action={deleteBudgetLineAction} className="mt-2">
                    <input type="hidden" name="itineraryId" value={itinerary.id} />
                    <input type="hidden" name="lineId" value={line.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-red-700 underline hover:text-red-800 dark:text-red-300 dark:hover:text-red-200"
                    >
                      Delete line
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
          </>
        )}

        {activeTab === "markers" && (
          <>
        <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Marker types</div>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-500">
          Types label POIs on the map. Add and edit points per stop below.
        </p>
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

        <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Points by stop</div>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-500">
          POIs and photos are grouped under each stop.
        </p>
        {itinerary.stops.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No stops yet. When stops exist for this itinerary, add markers here.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {itinerary.stops.map((s, stopIndex) => (
              <li key={s.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800">
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    Day {s.dayNumber} • Stop {s.orderIndex + 1}: {s.placeName}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-500">
                    {s.city ?? "—"} • {s.lat?.toFixed(5) ?? "—"}, {s.lng?.toFixed(5) ?? "—"}
                  </div>
                </div>

                <div className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
                  <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">POIs</div>

                  <AdminPoiPickMapForm
                    itineraryId={itinerary.id}
                    stopId={s.id}
                    stopLat={s.lat}
                    stopLng={s.lng}
                    stopPlaceName={s.placeName}
                    stopOrdinalLabel={englishOrdinal(stopIndex + 1)}
                    markerTypes={itinerary.markerTypes}
                    existingPois={s.pois.map((p) => ({
                      id: p.id,
                      title: p.title,
                      lat: p.lat,
                      lng: p.lng,
                      colorHex: p.markerType?.colorHex ?? null,
                    }))}
                  />

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
                              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                                <span>Photos</span>
                                <span className="font-normal text-zinc-500 dark:text-zinc-400">
                                  {p.photos.length} / {MAX_POI_PHOTOS_PER_POI}
                                </span>
                              </div>

                              {p.photos.length < MAX_POI_PHOTOS_PER_POI ? (
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
                              ) : (
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                  Maximum {MAX_POI_PHOTOS_PER_POI} photos per POI. Delete a photo below to add a different one.
                                </p>
                              )}

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
          </>
        )}

        {activeTab === "day-trips" && (
          <AdminDayTripsPanel itineraryId={itinerary.id} stops={itinerary.stops} />
        )}

        {activeTab === "stops" && (
          <>
            <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Stops</div>
            <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-500">
              Add day-by-day places using the map below. POIs, marker types, and photos are on the{" "}
              <Link
                href={adminItineraryHref(itinerary.id, "markers")}
                className="font-medium text-zinc-700 underline dark:text-zinc-300"
              >
                Marker points
              </Link>
              . Multi-leg day trips:{" "}
              <Link
                href={adminItineraryHref(itinerary.id, "day-trips")}
                className="font-medium text-zinc-700 underline dark:text-zinc-300"
              >
                Day trips
              </Link>
              .
            </p>
            <div className="mb-6">
              <AdminStopsPickMap
                itineraryId={itinerary.id}
                stops={itinerary.stops.map((s) => ({
                  id: s.id,
                  lat: s.lat,
                  lng: s.lng,
                  placeName: s.placeName,
                  dayNumber: s.dayNumber,
                }))}
              />
            </div>
            <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Saved stops</div>
            {itinerary.stops.length === 0 ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">No stops yet — add one with the map above.</p>
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
                    {s.notes && (
                      <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">{s.notes}</p>
                    )}
                    <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
                      Map markers and gallery photos for this stop:{" "}
                      <Link
                        href={adminItineraryHref(itinerary.id, "markers")}
                        className="font-medium text-zinc-900 underline dark:text-zinc-200"
                      >
                        Marker points
                      </Link>
                      .
                    </p>
                    <form action={deleteItineraryStopAction} className="mt-3">
                      <input type="hidden" name="itineraryId" value={itinerary.id} />
                      <input type="hidden" name="stopId" value={s.id} />
                      <button
                        type="submit"
                        className="text-xs font-medium text-red-700 underline hover:text-red-800 dark:text-red-300 dark:hover:text-red-200"
                      >
                        Delete stop
                      </button>
                      <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-500">
                        (removes all POIs and photos for this stop)
                      </span>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}

