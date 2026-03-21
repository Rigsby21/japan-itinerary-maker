/** Lowercase kebab-case for public `/itineraries/[slug]` URLs. */
export function normalizeItinerarySlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/_+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export type ItinerarySlugValidation = "missing" | "bad" | "long" | null;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MAX = 120;

export function validateItinerarySlug(slug: string): ItinerarySlugValidation {
  if (!slug) return "missing";
  if (slug.length > SLUG_MAX) return "long";
  if (!SLUG_RE.test(slug)) return "bad";
  return null;
}

/** Truncated, normalized slug used as the base for `/itineraries/[slug]`. */
export function slugFromTitle(title: string): string {
  let s = normalizeItinerarySlug(title);
  if (s.length > SLUG_MAX) {
    s = s.slice(0, SLUG_MAX).replace(/-+$/g, "");
  }
  return s;
}

/**
 * Picks a unique slug from the title: tries the base, then `base-2`, `base-3`, …
 * `slugTakenByOther` should be true when another itinerary (not `itineraryId`) already uses that slug.
 */
export async function allocateUniqueItinerarySlug(
  title: string,
  itineraryId: string,
  slugTakenByOther: (slug: string) => Promise<boolean>,
): Promise<string | null> {
  const baseMax = slugFromTitle(title);
  if (!baseMax) return null;

  let candidate = baseMax;
  for (let n = 2; ; n++) {
    const v = validateItinerarySlug(candidate);
    if (v === "bad" || v === "long") return null;
    const taken = await slugTakenByOther(candidate);
    if (!taken) return candidate;
    const suffix = `-${n}`;
    const room = SLUG_MAX - suffix.length;
    if (room < 1) return null;
    candidate = `${baseMax.slice(0, room).replace(/-+$/g, "")}${suffix}`;
    if (n > 999) return null;
  }
}
