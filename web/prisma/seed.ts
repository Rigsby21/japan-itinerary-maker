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

  const admin = await prisma.user.findUnique({ where: { email: "admin@example.com" } });
  if (!admin) throw new Error("Admin user missing after seed.");

  const featuredSlug = "tokyo-3-days-first-timer";
  const itinerary = await prisma.itinerary.upsert({
    where: { slug: featuredSlug },
    update: {
      title: "Tokyo: 3 days (first-timer)",
      description: "A simple starter itinerary with a few iconic spots and easy logistics.",
      isFeatured: true,
      isPublic: true,
      authorId: admin.id,
    },
    create: {
      title: "Tokyo: 3 days (first-timer)",
      slug: featuredSlug,
      description: "A simple starter itinerary with a few iconic spots and easy logistics.",
      isFeatured: true,
      isPublic: true,
      authorId: admin.id,
    },
    select: { id: true },
  });

  await prisma.itineraryStop.deleteMany({ where: { itineraryId: itinerary.id } });
  await prisma.itineraryStop.createMany({
    data: [
      {
        itineraryId: itinerary.id,
        dayNumber: 1,
        orderIndex: 0,
        placeName: "Senso-ji",
        city: "Tokyo",
        notes: "Start early; explore Asakusa and grab snacks on Nakamise-dori.",
        lat: 35.714765,
        lng: 139.796655,
      },
      {
        itineraryId: itinerary.id,
        dayNumber: 1,
        orderIndex: 1,
        placeName: "Tokyo Skytree",
        city: "Tokyo",
        notes: "Great sunset views if the weather is clear.",
        lat: 35.710063,
        lng: 139.8107,
      },
      {
        itineraryId: itinerary.id,
        dayNumber: 2,
        orderIndex: 0,
        placeName: "Meiji Jingu",
        city: "Tokyo",
        notes: "Quiet shrine walk; then head into Harajuku/Omotesando.",
        lat: 35.676397,
        lng: 139.699325,
      },
      {
        itineraryId: itinerary.id,
        dayNumber: 2,
        orderIndex: 1,
        placeName: "Shibuya Crossing",
        city: "Tokyo",
        notes: "Iconic crossing; consider Shibuya Sky nearby for views.",
        lat: 35.659485,
        lng: 139.700556,
      },
      {
        itineraryId: itinerary.id,
        dayNumber: 3,
        orderIndex: 0,
        placeName: "Tsukiji Outer Market",
        city: "Tokyo",
        notes: "Breakfast and street food; go early for the best selection.",
        lat: 35.665491,
        lng: 139.770833,
      },
      {
        itineraryId: itinerary.id,
        dayNumber: 3,
        orderIndex: 1,
        placeName: "Ueno Park",
        city: "Tokyo",
        notes: "Museums and a relaxed walk; great flexible afternoon spot.",
        lat: 35.716667,
        lng: 139.773333,
      },
    ],
  });

  console.log(
    "Seed done. Sign in with: test@example.com / password (USER) or admin@example.com / password (ADMIN). Featured itinerary slug:",
    featuredSlug
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
