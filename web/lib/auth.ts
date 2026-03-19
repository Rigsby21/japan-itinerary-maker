/**
 * Phase 1 Move 4 — Helpers for protected pages (require login or role).
 */
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Get session; redirect to sign-in if not logged in. */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=" + encodeURIComponent("/dashboard"));
  }
  return session;
}

/** Require admin role; redirect to home if not admin. */
export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user?.role !== "ADMIN") {
    redirect("/?error=admin-required");
  }
  return session;
}
