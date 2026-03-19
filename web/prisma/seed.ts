/**
 * Phase 1 Move 2 — Seed a test user so you can sign in with the database.
 * Run: npx prisma db seed (from the web folder).
 * Then sign in with: test@example.com / password
 */
import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Add it to .env and try again.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("password", 10);

  await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: { passwordHash },
    create: {
      email: "test@example.com",
      displayName: "Test User",
      passwordHash,
      role: "USER",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { passwordHash },
    create: {
      email: "admin@example.com",
      displayName: "Admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Seed done. Sign in with: test@example.com / password (USER) or admin@example.com / password (ADMIN)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
