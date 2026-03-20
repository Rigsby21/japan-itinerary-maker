export function publicPoiPhotoUrl(photo: {
  url: string | null;
  storagePath: string | null;
}): string | null {
  const direct = photo.url?.trim();
  if (direct) return direct;

  const path = photo.storagePath?.trim();
  if (!path) return null;

  const base = process.env.NEXT_PUBLIC_POI_PHOTO_STORAGE_BASE_URL?.replace(/\/$/, "");
  if (!base) return null;

  return `${base}/${path.replace(/^\//, "")}`;
}
