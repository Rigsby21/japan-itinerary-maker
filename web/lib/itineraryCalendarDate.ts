/** Parse HTML date input `YYYY-MM-DD` as a calendar date (UTC midnight). */
export function parseItineraryCalendarDateInput(raw: string | null | undefined): "empty" | "invalid" | Date {
  if (raw == null || typeof raw !== "string") return "empty";
  const t = raw.trim();
  if (t.length === 0) return "empty";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (!m) return "invalid";
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return "invalid";
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return "invalid";
  return dt;
}

/** Value for `<input type="date" />` from a Prisma `@db.Date` field. */
export function formatDateForDateInput(d: Date | null | undefined): string {
  if (!d) return "";
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

/** Reader-facing label; uses UTC so the stored calendar day matches what was picked in the admin date control. */
export function formatCalendarDateForPublic(d: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}
