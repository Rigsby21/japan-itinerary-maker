import Link from "next/link";
import { getFeaturedItineraries } from "@/lib/itineraries";

export const dynamic = "force-dynamic";

export default async function FeaturedPage() {
  const itineraries = await getFeaturedItineraries();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-2xl rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Featured itineraries</h1>
          <Link href="/" className="text-sm font-medium text-zinc-900 underline dark:text-zinc-50">
            Home
          </Link>
        </div>

        {itineraries.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No featured itineraries yet. (Next: we’ll add an admin editor to create and feature them.)
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {itineraries.map((it) => (
              <li key={it.id} className="rounded border border-zinc-200 p-4 dark:border-zinc-800">
                <Link
                  href={`/itineraries/${encodeURIComponent(it.slug)}`}
                  className="text-base font-semibold text-zinc-900 underline dark:text-zinc-50"
                >
                  {it.title}
                </Link>
                {it.description && (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{it.description}</p>
                )}
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                  Stops: {it.stopsCount} • Created: {new Date(it.createdAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
