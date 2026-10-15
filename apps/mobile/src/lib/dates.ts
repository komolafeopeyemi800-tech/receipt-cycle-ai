/**
 * Dates in this app are calendar days written YYYY-MM-DD, always in the phone's own time zone.
 * Never use `toISOString()` for a calendar day: it converts to UTC and shows the wrong day late in the evening
 * (or early in the morning) for anyone not on UTC.
 */
const pad = (n: number) => String(n).padStart(2, "0");

/** The calendar day of a moment as the person sees it on their phone. */
export function ymdOf(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Today on the phone's clock. */
export const todayLocalYmd = () => ymdOf(new Date());

/** True only for a real calendar day such as 2026-02-28 (not 2026-02-30 or 2026-13-01). */
export function isRealYmd(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const probe = new Date(y!, m! - 1, d!);
  return probe.getFullYear() === y && probe.getMonth() === m! - 1 && probe.getDate() === d;
}

/**
 * A date read from a receipt, voice note or file: returned only when it is a real day that makes sense for a
 * transaction (after 2000, not more than a day ahead of today). Otherwise null, so the caller can say that
 * no reliable date was found instead of silently inventing one.
 */
export function trustedTransactionDate(value: unknown, today: string = todayLocalYmd()): string | null {
  if (!isRealYmd(value)) return null;
  if (value < "2000-01-01") return null;
  const limit = new Date(`${today}T12:00:00`);
  limit.setDate(limit.getDate() + 1);
  return value <= ymdOf(limit) ? value : null;
}
