/**
 * Phase 0: Simple API to verify DB connection.
 * GET /api/db → { ok: true, itinerariesCount: number }
 * Once you set DATABASE_URL and run prisma migrate dev, this will work.
 */
import { getPrisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const prisma = getPrisma();
    const count = await prisma.itinerary.count();
    return NextResponse.json({ ok: true, itinerariesCount: count });
  } catch (e) {
    console.error("DB error:", e);
    const message =
      process.env.DATABASE_URL
        ? "Database not connected. Run: npx prisma migrate dev"
        : "Set DATABASE_URL in .env (copy from .env.example) and run: npx prisma migrate dev";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
