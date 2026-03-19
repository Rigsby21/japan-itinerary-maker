import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

export default async function AdminPage() {
  await requireAdmin();
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
                  <th className="px-3 py-2 font-medium">Action</th>
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
                      <Link
                        href={`/admin/itineraries/${encodeURIComponent(it.id)}`}
                        className="font-medium text-zinc-900 underline dark:text-zinc-50"
                      >
                        Manage
                      </Link>
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
