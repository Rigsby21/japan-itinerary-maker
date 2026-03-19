"use server";

import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function updateItineraryVisibilityAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (!id || typeof id !== "string") redirect("/admin");

  const isFeatured = formData.get("isFeatured") === "on";
  const isPublic = formData.get("isPublic") === "on";

  const prisma = getPrisma();
  await prisma.itinerary.update({
    where: { id },
    data: { isFeatured, isPublic },
  });

  redirect(`/admin/itineraries/${encodeURIComponent(id)}?saved=1`);
}

