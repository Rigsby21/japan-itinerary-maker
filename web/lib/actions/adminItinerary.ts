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

export async function createMarkerTypeAction(formData: FormData) {
  await requireAdmin();
  const itineraryId = formData.get("itineraryId");
  if (!itineraryId || typeof itineraryId !== "string") redirect("/admin");

  const rawName = formData.get("name");
  const rawColorHex = formData.get("colorHex");
  const name = typeof rawName === "string" ? rawName.trim() : "";
  const colorHex = typeof rawColorHex === "string" ? rawColorHex.trim() : "";

  if (!name) redirect(`/admin/itineraries/${encodeURIComponent(itineraryId)}?markerTypeError=missing-name`);
  if (!/^#[0-9a-fA-F]{6}$/.test(colorHex)) {
    redirect(`/admin/itineraries/${encodeURIComponent(itineraryId)}?markerTypeError=bad-color`);
  }

  const prisma = getPrisma();
  try {
    await prisma.markerType.create({
      data: { itineraryId, name, colorHex },
    });
  } catch {
    // likely unique constraint (same name within itinerary)
    redirect(`/admin/itineraries/${encodeURIComponent(itineraryId)}?markerTypeError=duplicate`);
  }

  redirect(`/admin/itineraries/${encodeURIComponent(itineraryId)}?markerTypeSaved=1`);
}

export async function deleteMarkerTypeAction(formData: FormData) {
  await requireAdmin();
  const itineraryId = formData.get("itineraryId");
  const markerTypeId = formData.get("markerTypeId");
  if (!itineraryId || typeof itineraryId !== "string") redirect("/admin");
  if (!markerTypeId || typeof markerTypeId !== "string") redirect(`/admin/itineraries/${encodeURIComponent(itineraryId)}`);

  const prisma = getPrisma();
  await prisma.markerType.delete({ where: { id: markerTypeId } });

  redirect(`/admin/itineraries/${encodeURIComponent(itineraryId)}?markerTypeDeleted=1`);
}

export async function createPoiAction(formData: FormData) {
  await requireAdmin();
  const itineraryId = formData.get("itineraryId");
  const stopId = formData.get("stopId");
  if (!itineraryId || typeof itineraryId !== "string") redirect("/admin");
  if (!stopId || typeof stopId !== "string") redirect(`/admin/itineraries/${encodeURIComponent(itineraryId)}`);

  const rawTitle = formData.get("title");
  const rawDescription = formData.get("description");
  const rawLat = formData.get("lat");
  const rawLng = formData.get("lng");
  const rawMarkerTypeId = formData.get("markerTypeId");

  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  const description = typeof rawDescription === "string" ? rawDescription.trim() : "";
  const lat = typeof rawLat === "string" ? Number(rawLat) : NaN;
  const lng = typeof rawLng === "string" ? Number(rawLng) : NaN;
  const markerTypeId =
    typeof rawMarkerTypeId === "string" && rawMarkerTypeId.trim() && rawMarkerTypeId !== "none"
      ? rawMarkerTypeId
      : null;

  if (!title) redirect(`/admin/itineraries/${encodeURIComponent(itineraryId)}?poiError=missing-title`);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    redirect(`/admin/itineraries/${encodeURIComponent(itineraryId)}?poiError=bad-coordinates`);
  }

  const prisma = getPrisma();

  // safety: ensure stop belongs to itinerary
  const stop = await prisma.itineraryStop.findUnique({ where: { id: stopId }, select: { itineraryId: true } });
  if (!stop || stop.itineraryId !== itineraryId) redirect(`/admin/itineraries/${encodeURIComponent(itineraryId)}?poiError=bad-stop`);

  await prisma.poi.create({
    data: {
      stopId,
      markerTypeId,
      title,
      description: description || null,
      lat,
      lng,
    },
  });

  redirect(`/admin/itineraries/${encodeURIComponent(itineraryId)}?poiSaved=1`);
}

export async function deletePoiAction(formData: FormData) {
  await requireAdmin();
  const itineraryId = formData.get("itineraryId");
  const poiId = formData.get("poiId");
  if (!itineraryId || typeof itineraryId !== "string") redirect("/admin");
  if (!poiId || typeof poiId !== "string") redirect(`/admin/itineraries/${encodeURIComponent(itineraryId)}`);

  const prisma = getPrisma();
  await prisma.poi.delete({ where: { id: poiId } });
  redirect(`/admin/itineraries/${encodeURIComponent(itineraryId)}?poiDeleted=1`);
}

export async function createPoiPhotoUrlAction(formData: FormData) {
  await requireAdmin();
  const itineraryId = formData.get("itineraryId");
  const poiId = formData.get("poiId");
  const urlRaw = formData.get("url");
  const captionRaw = formData.get("caption");
  if (!itineraryId || typeof itineraryId !== "string") redirect("/admin");
  if (!poiId || typeof poiId !== "string") redirect(`/admin/itineraries/${encodeURIComponent(itineraryId)}`);

  const url = typeof urlRaw === "string" ? urlRaw.trim() : "";
  const caption = typeof captionRaw === "string" ? captionRaw.trim() : "";

  if (!url) redirect(`/admin/itineraries/${encodeURIComponent(itineraryId)}?poiPhotoError=missing-url`);
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      redirect(`/admin/itineraries/${encodeURIComponent(itineraryId)}?poiPhotoError=bad-url`);
    }
  } catch {
    redirect(`/admin/itineraries/${encodeURIComponent(itineraryId)}?poiPhotoError=bad-url`);
  }

  const prisma = getPrisma();
  const currentMax = await prisma.poiPhoto.aggregate({
    where: { poiId },
    _max: { orderIndex: true },
  });
  const nextIndex = (currentMax._max.orderIndex ?? -1) + 1;

  await prisma.poiPhoto.create({
    data: {
      poiId,
      orderIndex: nextIndex,
      url,
      caption: caption || null,
    },
  });

  redirect(`/admin/itineraries/${encodeURIComponent(itineraryId)}?poiPhotoSaved=1`);
}

export async function deletePoiPhotoAction(formData: FormData) {
  await requireAdmin();
  const itineraryId = formData.get("itineraryId");
  const photoId = formData.get("photoId");
  if (!itineraryId || typeof itineraryId !== "string") redirect("/admin");
  if (!photoId || typeof photoId !== "string") redirect(`/admin/itineraries/${encodeURIComponent(itineraryId)}`);

  const prisma = getPrisma();
  await prisma.poiPhoto.delete({ where: { id: photoId } });
  redirect(`/admin/itineraries/${encodeURIComponent(itineraryId)}?poiPhotoDeleted=1`);
}

