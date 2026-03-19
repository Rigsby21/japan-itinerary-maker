import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminPage() {
  await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Admin console
        </h1>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Only users with role <strong>ADMIN</strong> can see this page. You’ll
          manage featured itineraries and content here in a later phase.
        </p>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-zinc-900 underline dark:text-zinc-50"
        >
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
