import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { updateItineraryVisibilityAction } from "@/lib/actions/adminItinerary";

export const dynamic = "force-dynamic";

export default async function AdminItineraryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
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
        },
      },
    },
  });

  if (!itinerary) notFound();

  const saved = query?.saved === "1";

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
                  POIs, marker types, and photos will be added next.
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

