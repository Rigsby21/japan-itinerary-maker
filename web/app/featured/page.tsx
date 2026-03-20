import Image from "next/image";
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
          <ul className="flex flex-col gap-4">
            {itineraries.map((it) => (
              <li
                key={it.id}
                className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                <Link
                  href={`/itineraries/${encodeURIComponent(it.slug)}`}
                  className="group flex flex-col sm:flex-row"
                >
                  <div className="relative aspect-[16/10] w-full shrink-0 bg-zinc-100 sm:aspect-auto sm:h-36 sm:w-48 dark:bg-zinc-800">
                    {it.coverImageUrl ? (
                      <Image
                        src={it.coverImageUrl}
                        alt=""
                        fill
                        className="object-cover transition-opacity group-hover:opacity-95"
                        sizes="(max-width: 640px) 100vw, 12rem"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full min-h-[10rem] items-center justify-center px-4 text-center text-xs text-zinc-400 dark:text-zinc-500 sm:min-h-0">
                        No photo yet
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-center p-4">
                    <span className="text-base font-semibold text-zinc-900 underline-offset-2 group-hover:underline dark:text-zinc-50">
                      {it.title}
                    </span>
                    {it.description && (
                      <p className="mt-1 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {it.description}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                      Stops: {it.stopsCount} • Created: {new Date(it.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

