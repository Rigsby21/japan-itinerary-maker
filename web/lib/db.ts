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

export function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and add your database URL.");
  }
  const adapter = new PrismaPg({ connectionString: url });
  const client = new PrismaClientConstructor({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}
