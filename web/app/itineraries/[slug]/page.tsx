import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicItineraryBySlug } from "@/lib/itineraries";

export const dynamic = "force-dynamic";

export default async function ItineraryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const itinerary = await getPublicItineraryBySlug(slug);
  if (!itinerary) notFound();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-2xl rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{itinerary.title}</h1>
            {itinerary.description && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{itinerary.description}</p>
            )}
          </div>
          <Link href="/featured" className="text-sm font-medium text-zinc-900 underline dark:text-zinc-50">
            ← Featured
          </Link>
        </div>

        <div className="mb-6 text-xs text-zinc-500 dark:text-zinc-500">
          Created: {new Date(itinerary.createdAt).toLocaleDateString()}
        </div>

        {itinerary.stops.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">No stops added yet.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {itinerary.stops.map((s) => (
              <li key={s.id} className="rounded border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    Day {s.dayNumber} • Stop {s.orderIndex + 1}: {s.placeName}
                  </p>
                  {s.city && <p className="text-xs text-zinc-500 dark:text-zinc-500">{s.city}</p>}
                </div>
                {s.notes && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{s.notes}</p>}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

