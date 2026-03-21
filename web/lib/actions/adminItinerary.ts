"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@/app/generated/prisma/client";
import { adminItineraryHref } from "@/lib/adminItineraryUrl";
import { isBudgetCurrency } from "@/lib/budgetCurrencies";
import { allocateUniqueItinerarySlug } from "@/lib/itinerarySlug";
import { getPrisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { MAX_POI_PHOTOS_PER_POI } from "@/lib/poiPhotoLimits";

function parseMoneyAmount(raw: string): number | null {
  const s = raw.trim().replace(/,/g, "");
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

export async function createItineraryStopAction(formData: FormData) {
  await requireAdmin();
  const itineraryId = formData.get("itineraryId");
  if (!itineraryId || typeof itineraryId !== "string") redirect("/admin");

  const rawDay = formData.get("dayNumber");
  const rawPlace = formData.get("placeName");
  const rawCity = formData.get("city");
  const rawNotes = formData.get("notes");
  const rawLat = formData.get("lat");
  const rawLng = formData.get("lng");

  const dayNumber = typeof rawDay === "string" ? Number.parseInt(rawDay, 10) : NaN;
  const placeName = typeof rawPlace === "string" ? rawPlace.trim() : "";
  const city = typeof rawCity === "string" ? rawCity.trim() : "";
  const notes = typeof rawNotes === "string" ? rawNotes.trim() : "";
  const lat = typeof rawLat === "string" ? Number(rawLat) : NaN;
  const lng = typeof rawLng === "string" ? Number(rawLng) : NaN;

  if (!placeName) {
    redirect(adminItineraryHref(itineraryId, "stops", { stopError: "missing-place" }));
  }
  if (!Number.isFinite(dayNumber) || dayNumber < 1) {
    redirect(adminItineraryHref(itineraryId, "stops", { stopError: "bad-day" }));
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    redirect(adminItineraryHref(itineraryId, "stops", { stopError: "bad-coordinates" }));
  }

  const prisma = getPrisma();
  const itinerary = await prisma.itinerary.findUnique({ where: { id: itineraryId }, select: { id: true } });
  if (!itinerary) redirect("/admin");

  const maxIx = await prisma.itineraryStop.aggregate({
    where: { itineraryId, dayNumber },
    _max: { orderIndex: true },
  });
  const orderIndex = (maxIx._max.orderIndex ?? -1) + 1;

  await prisma.itineraryStop.create({
    data: {
      itineraryId,
      dayNumber,
      orderIndex,
      placeName,
      city: city || null,
      lat,
      lng,
      notes: notes || null,
    },
  });

  redirect(adminItineraryHref(itineraryId, "stops", { stopSaved: "1" }));
}

export async function deleteItineraryStopAction(formData: FormData) {
  await requireAdmin();
  const itineraryId = formData.get("itineraryId");
  const stopId = formData.get("stopId");
  if (!itineraryId || typeof itineraryId !== "string") redirect("/admin");
  if (!stopId || typeof stopId !== "string") {
    redirect(adminItineraryHref(itineraryId, "stops"));
  }

  const prisma = getPrisma();
  const stop = await prisma.itineraryStop.findUnique({
    where: { id: stopId },
    select: { itineraryId: true },
  });
  if (!stop || stop.itineraryId !== itineraryId) {
    redirect(adminItineraryHref(itineraryId, "stops"));
  }

  await prisma.itineraryStop.delete({ where: { id: stopId } });
  redirect(adminItineraryHref(itineraryId, "stops", { stopDeleted: "1" }));
}

export async function updateItineraryVisibilityAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (!id || typeof id !== "string") redirect("/admin");

  const rawTitle = formData.get("title");
  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  if (!title) {
    redirect(adminItineraryHref(id, "stops", { itineraryError: "missing-title" }));
  }

  const rawDescription = formData.get("description");
  const description =
    typeof rawDescription === "string" ? rawDescription.trim() : "";
  const descriptionValue = description.length > 0 ? description : null;

  const isFeatured = formData.get("isFeatured") === "on";
  const isPublic = formData.get("isPublic") === "on";

  const prisma = getPrisma();
  const existing = await prisma.itinerary.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!existing) redirect("/admin");

  const slug = await allocateUniqueItinerarySlug(title, id, async (candidate) => {
    const row = await prisma.itinerary.findFirst({
      where: { slug: candidate, NOT: { id } },
      select: { id: true },
    });
    return row != null;
  });
  if (!slug) {
    redirect(adminItineraryHref(id, "stops", { itineraryError: "title-needs-link" }));
  }

  try {
    await prisma.itinerary.update({
      where: { id },
      data: { title, slug, description: descriptionValue, isFeatured, isPublic },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      redirect(adminItineraryHref(id, "stops", { itineraryError: "slug-taken" }));
    }
    throw e;
  }

  redirect(adminItineraryHref(id, "stops", { saved: "1" }));
}

export async function createMarkerTypeAction(formData: FormData) {
  await requireAdmin();
  const itineraryId = formData.get("itineraryId");
  if (!itineraryId || typeof itineraryId !== "string") redirect("/admin");

  const rawName = formData.get("name");
  const rawColorHex = formData.get("colorHex");
  const name = typeof rawName === "string" ? rawName.trim() : "";
  const colorHex = typeof rawColorHex === "string" ? rawColorHex.trim() : "";

  if (!name) {
    redirect(adminItineraryHref(itineraryId, "markers", { markerTypeError: "missing-name" }));
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(colorHex)) {
    redirect(adminItineraryHref(itineraryId, "markers", { markerTypeError: "bad-color" }));
  }

  const prisma = getPrisma();
  try {
    await prisma.markerType.create({
      data: { itineraryId, name, colorHex },
    });
  } catch {
    // likely unique constraint (same name within itinerary)
    redirect(adminItineraryHref(itineraryId, "markers", { markerTypeError: "duplicate" }));
  }

  redirect(adminItineraryHref(itineraryId, "markers", { markerTypeSaved: "1" }));
}

export async function deleteMarkerTypeAction(formData: FormData) {
  await requireAdmin();
  const itineraryId = formData.get("itineraryId");
  const markerTypeId = formData.get("markerTypeId");
  if (!itineraryId || typeof itineraryId !== "string") redirect("/admin");
  if (!markerTypeId || typeof markerTypeId !== "string") {
    redirect(adminItineraryHref(itineraryId, "markers"));
  }

  const prisma = getPrisma();
  await prisma.markerType.delete({ where: { id: markerTypeId } });

  redirect(adminItineraryHref(itineraryId, "markers", { markerTypeDeleted: "1" }));
}

export async function createPoiAction(formData: FormData) {
  await requireAdmin();
  const itineraryId = formData.get("itineraryId");
  const stopId = formData.get("stopId");
  if (!itineraryId || typeof itineraryId !== "string") redirect("/admin");
  if (!stopId || typeof stopId !== "string") {
    redirect(adminItineraryHref(itineraryId, "markers"));
  }

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

  if (!title) {
    redirect(adminItineraryHref(itineraryId, "markers", { poiError: "missing-title" }));
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    redirect(adminItineraryHref(itineraryId, "markers", { poiError: "bad-coordinates" }));
  }

  const prisma = getPrisma();

  // safety: ensure stop belongs to itinerary
  const stop = await prisma.itineraryStop.findUnique({ where: { id: stopId }, select: { itineraryId: true } });
  if (!stop || stop.itineraryId !== itineraryId) {
    redirect(adminItineraryHref(itineraryId, "markers", { poiError: "bad-stop" }));
  }

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

  redirect(adminItineraryHref(itineraryId, "markers", { poiSaved: "1" }));
}

export async function deletePoiAction(formData: FormData) {
  await requireAdmin();
  const itineraryId = formData.get("itineraryId");
  const poiId = formData.get("poiId");
  if (!itineraryId || typeof itineraryId !== "string") redirect("/admin");
  if (!poiId || typeof poiId !== "string") {
    redirect(adminItineraryHref(itineraryId, "markers"));
  }

  const prisma = getPrisma();
  await prisma.poi.delete({ where: { id: poiId } });
  redirect(adminItineraryHref(itineraryId, "markers", { poiDeleted: "1" }));
}

export async function createPoiPhotoUrlAction(formData: FormData) {
  await requireAdmin();
  const itineraryId = formData.get("itineraryId");
  const poiId = formData.get("poiId");
  const urlRaw = formData.get("url");
  const captionRaw = formData.get("caption");
  if (!itineraryId || typeof itineraryId !== "string") redirect("/admin");
  if (!poiId || typeof poiId !== "string") {
    redirect(adminItineraryHref(itineraryId, "markers"));
  }

  const url = typeof urlRaw === "string" ? urlRaw.trim() : "";
  const caption = typeof captionRaw === "string" ? captionRaw.trim() : "";

  if (!url) {
    redirect(adminItineraryHref(itineraryId, "markers", { poiPhotoError: "missing-url" }));
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      redirect(adminItineraryHref(itineraryId, "markers", { poiPhotoError: "bad-url" }));
    }
  } catch {
    redirect(adminItineraryHref(itineraryId, "markers", { poiPhotoError: "bad-url" }));
  }

  const prisma = getPrisma();

  const existingCount = await prisma.poiPhoto.count({ where: { poiId } });
  if (existingCount >= MAX_POI_PHOTOS_PER_POI) {
    redirect(adminItineraryHref(itineraryId, "markers", { poiPhotoError: "max-photos" }));
  }

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

  redirect(adminItineraryHref(itineraryId, "markers", { poiPhotoSaved: "1" }));
}

export async function deletePoiPhotoAction(formData: FormData) {
  await requireAdmin();
  const itineraryId = formData.get("itineraryId");
  const photoId = formData.get("photoId");
  if (!itineraryId || typeof itineraryId !== "string") redirect("/admin");
  if (!photoId || typeof photoId !== "string") {
    redirect(adminItineraryHref(itineraryId, "markers"));
  }

  const prisma = getPrisma();
  await prisma.poiPhoto.delete({ where: { id: photoId } });
  redirect(adminItineraryHref(itineraryId, "markers", { poiPhotoDeleted: "1" }));
}

export async function createTravelTipAction(formData: FormData) {
  await requireAdmin();
  const itineraryId = formData.get("itineraryId");
  if (!itineraryId || typeof itineraryId !== "string") redirect("/admin");

  const rawTitle = formData.get("title");
  const rawBody = formData.get("body");
  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  const body = typeof rawBody === "string" ? rawBody.trim() : "";
  if (!title) {
    redirect(adminItineraryHref(itineraryId, "tips", { tipError: "missing-title" }));
  }

  const prisma = getPrisma();
  const maxIx = await prisma.itineraryTravelTip.aggregate({
    where: { itineraryId },
    _max: { orderIndex: true },
  });
  const orderIndex = (maxIx._max.orderIndex ?? -1) + 1;

  await prisma.itineraryTravelTip.create({
    data: { itineraryId, orderIndex, title, body: body || "" },
  });

  redirect(adminItineraryHref(itineraryId, "tips", { tipSaved: "1" }));
}

export async function updateTravelTipAction(formData: FormData) {
  await requireAdmin();
  const itineraryId = formData.get("itineraryId");
  const tipId = formData.get("tipId");
  if (!itineraryId || typeof itineraryId !== "string") redirect("/admin");
  if (!tipId || typeof tipId !== "string") {
    redirect(adminItineraryHref(itineraryId, "tips"));
  }

  const rawTitle = formData.get("title");
  const rawBody = formData.get("body");
  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  const body = typeof rawBody === "string" ? rawBody.trim() : "";
  if (!title) {
    redirect(adminItineraryHref(itineraryId, "tips", { tipError: "missing-title" }));
  }

  const prisma = getPrisma();
  const tip = await prisma.itineraryTravelTip.findUnique({ where: { id: tipId } });
  if (!tip || tip.itineraryId !== itineraryId) {
    redirect(adminItineraryHref(itineraryId, "tips"));
  }

  await prisma.itineraryTravelTip.update({
    where: { id: tipId },
    data: { title, body: body || "" },
  });

  redirect(adminItineraryHref(itineraryId, "tips", { tipUpdated: "1" }));
}

export async function deleteTravelTipAction(formData: FormData) {
  await requireAdmin();
  const itineraryId = formData.get("itineraryId");
  const tipId = formData.get("tipId");
  if (!itineraryId || typeof itineraryId !== "string") redirect("/admin");
  if (!tipId || typeof tipId !== "string") {
    redirect(adminItineraryHref(itineraryId, "tips"));
  }

  const prisma = getPrisma();
  const tip = await prisma.itineraryTravelTip.findUnique({ where: { id: tipId } });
  if (!tip || tip.itineraryId !== itineraryId) {
    redirect(adminItineraryHref(itineraryId, "tips"));
  }

  await prisma.itineraryTravelTip.delete({ where: { id: tipId } });
  redirect(adminItineraryHref(itineraryId, "tips", { tipDeleted: "1" }));
}

export async function updateBudgetCurrencyAction(formData: FormData) {
  await requireAdmin();
  const itineraryId = formData.get("itineraryId");
  const rawCurrency = formData.get("budgetCurrency");
  const currency =
    typeof rawCurrency === "string" ? rawCurrency.trim().toUpperCase() : "";
  if (!itineraryId || typeof itineraryId !== "string") redirect("/admin");
  if (!isBudgetCurrency(currency)) {
    redirect(adminItineraryHref(itineraryId, "budget", { budgetError: "bad-currency" }));
  }

  const prisma = getPrisma();
  await prisma.itinerary.update({
    where: { id: itineraryId },
    data: { budgetCurrency: currency },
  });

  redirect(adminItineraryHref(itineraryId, "budget", { budgetCurrencySaved: "1" }));
}

export async function createBudgetLineAction(formData: FormData) {
  await requireAdmin();
  const itineraryId = formData.get("itineraryId");
  if (!itineraryId || typeof itineraryId !== "string") redirect("/admin");

  const rawCategory = formData.get("category");
  const rawNote = formData.get("note");
  const rawAmountField = formData.get("amount");
  const category = typeof rawCategory === "string" ? rawCategory.trim() : "";
  const note = typeof rawNote === "string" ? rawNote.trim() : "";
  const rawAmount = typeof rawAmountField === "string" ? rawAmountField : "";
  const amount = parseMoneyAmount(rawAmount);

  if (!category) {
    redirect(adminItineraryHref(itineraryId, "budget", { budgetError: "missing-category" }));
  }
  if (amount == null) {
    redirect(adminItineraryHref(itineraryId, "budget", { budgetError: "bad-amount" }));
  }

  const prisma = getPrisma();
  const maxIx = await prisma.itineraryBudgetLine.aggregate({
    where: { itineraryId },
    _max: { orderIndex: true },
  });
  const orderIndex = (maxIx._max.orderIndex ?? -1) + 1;

  await prisma.itineraryBudgetLine.create({
    data: {
      itineraryId,
      orderIndex,
      category,
      amount: new Prisma.Decimal(amount.toFixed(2)),
      note: note || null,
    },
  });

  redirect(adminItineraryHref(itineraryId, "budget", { budgetLineSaved: "1" }));
}

export async function updateBudgetLineAction(formData: FormData) {
  await requireAdmin();
  const itineraryId = formData.get("itineraryId");
  const lineId = formData.get("lineId");
  if (!itineraryId || typeof itineraryId !== "string") redirect("/admin");
  if (!lineId || typeof lineId !== "string") {
    redirect(adminItineraryHref(itineraryId, "budget"));
  }

  const rawCategory = formData.get("category");
  const rawNote = formData.get("note");
  const rawAmountField = formData.get("amount");
  const category = typeof rawCategory === "string" ? rawCategory.trim() : "";
  const note = typeof rawNote === "string" ? rawNote.trim() : "";
  const rawAmount = typeof rawAmountField === "string" ? rawAmountField : "";
  const amount = parseMoneyAmount(rawAmount);

  if (!category) {
    redirect(adminItineraryHref(itineraryId, "budget", { budgetError: "missing-category" }));
  }
  if (amount == null) {
    redirect(adminItineraryHref(itineraryId, "budget", { budgetError: "bad-amount" }));
  }

  const prisma = getPrisma();
  const line = await prisma.itineraryBudgetLine.findUnique({ where: { id: lineId } });
  if (!line || line.itineraryId !== itineraryId) {
    redirect(adminItineraryHref(itineraryId, "budget"));
  }

  await prisma.itineraryBudgetLine.update({
    where: { id: lineId },
    data: {
      category,
      amount: new Prisma.Decimal(amount.toFixed(2)),
      note: note || null,
    },
  });

  redirect(adminItineraryHref(itineraryId, "budget", { budgetLineUpdated: "1" }));
}

export async function deleteBudgetLineAction(formData: FormData) {
  await requireAdmin();
  const itineraryId = formData.get("itineraryId");
  const lineId = formData.get("lineId");
  if (!itineraryId || typeof itineraryId !== "string") redirect("/admin");
  if (!lineId || typeof lineId !== "string") {
    redirect(adminItineraryHref(itineraryId, "budget"));
  }

  const prisma = getPrisma();
  const line = await prisma.itineraryBudgetLine.findUnique({ where: { id: lineId } });
  if (!line || line.itineraryId !== itineraryId) {
    redirect(adminItineraryHref(itineraryId, "budget"));
  }

  await prisma.itineraryBudgetLine.delete({ where: { id: lineId } });
  redirect(adminItineraryHref(itineraryId, "budget", { budgetLineDeleted: "1" }));
}
