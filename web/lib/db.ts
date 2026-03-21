/**
 * Single Prisma client instance for the app.
 * Use getPrisma() in API routes and server code.
 * Prisma 7 requires the pg adapter; connection string comes from DATABASE_URL.
 * Created lazily so the app can start even before you have a database.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import type { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaClient as PrismaClientConstructor } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/** Stale global client from before `prisma generate` → missing delegates / unknown select fields. */
function prismaClientMatchesGeneratedSchema(p: PrismaClient): boolean {
  const anyP = p as unknown as {
    itineraryBudgetLine?: unknown;
    itineraryTravelTip?: unknown;
    dayTrip?: unknown;
  };
  return (
    anyP.itineraryBudgetLine != null &&
    anyP.itineraryTravelTip != null &&
    anyP.dayTrip != null
  );
}

export function getPrisma(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached) {
    if (prismaClientMatchesGeneratedSchema(cached)) return cached;
    // Dev: Next/Turbopack can keep a global PrismaClient from before `prisma generate`.
    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = undefined;
    else return cached;
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and add your database URL.");
  }
  const adapter = new PrismaPg({ connectionString: url });
  const client = new PrismaClientConstructor({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
  // Only cache a client that matches the generated schema; avoids a dev loop if generate is missing.
  if (process.env.NODE_ENV !== "production" && prismaClientMatchesGeneratedSchema(client)) {
    globalForPrisma.prisma = client;
  }
  return client;
}
