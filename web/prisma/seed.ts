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
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: { passwordHash },
    create: {
      email: "test@example.com",
      displayName: "Test User",
      passwordHash,
      role: "USER",
    },
  });
  console.log("Seed done. You can sign in with:", user.email, "/ password");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
