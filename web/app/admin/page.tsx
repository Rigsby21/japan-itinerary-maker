import Link from "next/link";
import { AdminDeleteItineraryForm } from "@/components/admin/AdminDeleteItineraryForm";
import { requireAdmin } from "@/lib/auth";
import { createItineraryAction } from "@/lib/actions/adminItinerary";
import { getPrisma } from "@/lib/db";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    newItineraryError?: string;
    itineraryDeleted?: string;
    deletedTitle?: string;
    deleteItineraryError?: string;
  }>;
}) {
  await requireAdmin();
  const { newItineraryError, itineraryDeleted, deletedTitle, deleteItineraryError } =
    await searchParams;
  const deletedTitleTrimmed =
    typeof deletedTitle === "string" ? deletedTitle.trim() : "";
  const prisma = getPrisma();
  const itineraries = await prisma.itinerary.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      isFeatured: true,
      isPublic: true,
      updatedAt: true,
    },
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-2xl rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Admin console</h1>
          <Link href="/dashboard" className="text-sm font-medium text-zinc-900 underline dark:text-zinc-50">
            ← Back
          </Link>
        </div>

        <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Itineraries
        </h2>

        {itineraryDeleted && (
          <p className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-900 dark:bg-green-900/30 dark:text-green-200">
            {deletedTitleTrimmed ? (
              <>
                1 itinerary was deleted:{" "}
                <span className="font-semibold">“{deletedTitleTrimmed}”</span>.
              </>
            ) : (
              <>1 itinerary was deleted.</>
            )}
          </p>
        )}

        {deleteItineraryError && (
          <p className="mb-4 rounded bg-red-100 px-3 py-2 text-sm text-red-900 dark:bg-red-900/30 dark:text-red-200">
            {deleteItineraryError === "not-found"
              ? "That itinerary no longer exists."
              : deleteItineraryError === "missing"
                ? "Could not delete: missing itinerary id."
                : "Could not delete itinerary."}
          </p>
        )}

        {newItineraryError && (
          <p className="mb-4 rounded bg-red-100 px-3 py-2 text-sm text-red-900 dark:bg-red-900/30 dark:text-red-200">
            {newItineraryError === "missing-title"
              ? "Title is required."
              : newItineraryError === "title-needs-link"
                ? "Use letters or numbers in the title so a URL slug can be generated."
                : newItineraryError === "slug-taken"
                  ? "That URL slug is already in use. Try a different title."
                  : newItineraryError === "bad-trip-start-date"
                    ? "Trip start must be a valid date or left empty."
                    : newItineraryError === "no-user"
                      ? "Could not determine your account. Sign out and sign in again."
                      : "Could not create itinerary."}
          </p>
        )}

        <details
          className="group mb-6 rounded border border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/50"
          {...(newItineraryError ? { open: true } : {})}
        >
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-zinc-900 marker:content-none dark:text-zinc-50 [&::-webkit-details-marker]:hidden">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-white text-lg font-medium leading-none text-zinc-700 transition-transform group-open:rotate-45 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200"
              aria-hidden
            >
              +
            </span>
            <span>New itinerary</span>
          </summary>
          <div className="border-t border-zinc-200 px-4 pb-4 pt-3 dark:border-zinc-800">
            <p className="mb-3 text-xs text-zinc-600 dark:text-zinc-400">
              Add a title and optional description. You can add cities and days on the next screen.
            </p>
            <form action={createItineraryAction} className="flex flex-col gap-3">
              <div>
                <label htmlFor="new-it-title" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Title
                </label>
                <input
                  id="new-it-title"
                  name="title"
                  type="text"
                  required
                  maxLength={200}
                  placeholder="e.g. Two weeks in Kansai"
                  className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div>
                <label htmlFor="new-it-desc" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Description <span className="font-normal text-zinc-500">(optional)</span>
                </label>
                <textarea
                  id="new-it-desc"
                  name="description"
                  rows={2}
                  maxLength={4000}
                  placeholder="Short blurb for the public page"
                  className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div>
                <label htmlFor="new-it-trip-start" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Trip start date <span className="font-normal text-zinc-500">(optional)</span>
                </label>
                <input
                  id="new-it-trip-start"
                  name="tripStartDate"
                  type="date"
                  className="max-w-xs rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
                />
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  When you add stops, each gets the next day automatically. You can change this later in itinerary settings.
                </p>
              </div>
              <button
                type="submit"
                className="self-start rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Create itinerary
              </button>
            </form>
          </div>
        </details>

        {itineraries.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">No itineraries yet.</p>
        ) : (
          <div className="overflow-hidden rounded border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Title</th>
                  <th className="px-3 py-2 font-medium">Featured</th>
                  <th className="px-3 py-2 font-medium">Public</th>
                  <th className="px-3 py-2 font-medium">Updated</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {itineraries.map((it) => (
                  <tr key={it.id} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="px-3 py-2">
                      <div className="font-medium text-zinc-900 dark:text-zinc-50">{it.title}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-500">{it.slug}</div>
                    </td>
                    <td className="px-3 py-2">{it.isFeatured ? "Yes" : "No"}</td>
                    <td className="px-3 py-2">{it.isPublic ? "Yes" : "No"}</td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                      {new Date(it.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <Link
                          href={`/admin/itineraries/${encodeURIComponent(it.id)}`}
                          className="font-medium text-zinc-900 underline dark:text-zinc-50"
                        >
                          Manage
                        </Link>
                        <AdminDeleteItineraryForm itineraryId={it.id} title={it.title} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
