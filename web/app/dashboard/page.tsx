import Link from "next/link";
import { requireAuth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await requireAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          This page is protected — only logged-in users can see it. Your role:{" "}
          <strong>{session.user?.role ?? "USER"}</strong>
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-900 underline dark:text-zinc-50"
          >
            ← Back to home
          </Link>
          {session.user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="text-sm font-medium text-zinc-900 underline dark:text-zinc-50"
            >
              Admin console →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
