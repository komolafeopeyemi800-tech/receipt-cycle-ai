/** Turning messy statement cells into clean dates and amounts. Pure functions, no I/O. */

export type DateOrder = "dmy" | "mdy";

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5, jun: 6, june: 6,
  jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10,
  nov: 11, november: 11, dec: 12, december: 12,
};

const pad = (n: number) => String(n).padStart(2, "0");

function validYmd(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1990 || y > 2100) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1) return null; // e.g. 31 Feb
  return `${y}-${pad(m)}-${pad(d)}`;
}

const fullYear = (y: number) => (y < 100 ? (y >= 70 ? 1900 + y : 2000 + y) : y);

/** Excel stores dates as days since 1899-12-30. Only plausible modern serials are accepted. */
export function excelSerialToIso(serial: number): string | null {
  if (!Number.isFinite(serial) || serial < 25_569 /* 1970 */ || serial > 80_000 /* ~2118 */) return null;
  const ms = Date.UTC(1899, 11, 30) + Math.floor(serial) * 86_400_000;
  const d = new Date(ms);
  return validYmd(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** Which of dd/mm or mm/dd a whole column uses; `null` when the values cannot tell. */
export function detectDateOrder(values: string[]): DateOrder | null {
  let dmy = false;
  let mdy = false;
  for (const v of values) {
    const m = /^\s*(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/.exec(v);
    if (!m) continue;
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a > 12 && b <= 12) dmy = true;
    if (b > 12 && a <= 12) mdy = true;
  }
  if (dmy && !mdy) return "dmy";
  if (mdy && !dmy) return "mdy";
  return null;
}

/** Parses one date cell to YYYY-MM-DD, or null. `order` resolves 03/04/2026. */
export function parseDate(raw: unknown, order: DateOrder = "dmy"): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;

  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s].*)?$/.exec(s);
  if (m) return validYmd(Number(m[1]), Number(m[2]), Number(m[3]));

  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})(?:\s.*)?$/.exec(s);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    const y = fullYear(Number(m[3]));
    // A part above 12 can only be the day, whatever the column's usual order.
    if (a > 12) return validYmd(y, b, a);
    if (b > 12) return validYmd(y, a, b);
    return order === "dmy" ? validYmd(y, b, a) : validYmd(y, a, b);
  }

  // 5 Oct 2026, 05-Oct-26, 5th October 2026
  m = /^(\d{1,2})(?:st|nd|rd|th)?[\s-]+([A-Za-z]{3,9})\.?,?[\s-]+(\d{2,4})(?:\s.*)?$/.exec(s);
  if (m && MONTHS[m[2]!.toLowerCase()]) return validYmd(fullYear(Number(m[3])), MONTHS[m[2]!.toLowerCase()]!, Number(m[1]));

  // Oct 5, 2026 / October 5 2026
  m = /^([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{2,4})(?:\s.*)?$/.exec(s);
  if (m && MONTHS[m[1]!.toLowerCase()]) return validYmd(fullYear(Number(m[3])), MONTHS[m[1]!.toLowerCase()]!, Number(m[2]));

  if (/^\d{5}(\.\d+)?$/.test(s)) return excelSerialToIso(Number(s));
  return null;
}

/**
 * Parses money text: "$1,234.50", "(45.00)", "45.00-", "1.234,50", "₦ 2 500", "12.5 CR".
 * Returns a signed number (negative for brackets, trailing minus or DR), or null.
 */
export function parseAmount(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  let s = String(raw ?? "").trim();
  if (!s) return null;

  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (/(^|\s)(dr|debit)\.?$/i.test(s)) negative = true;
  s = s.replace(/(^|\s)(cr|credit|dr|debit)\.?$/i, "");
  s = s.replace(/[^\d.,\-+]/g, ""); // currency symbols, letters, spaces
  if (s.endsWith("-")) {
    negative = true;
    s = s.slice(0, -1);
  }
  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1);
  } else if (s.startsWith("+")) {
    s = s.slice(1);
  }
  if (!/\d/.test(s)) return null;

  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  if (lastDot >= 0 && lastComma >= 0) {
    // Both present: the right-most one is the decimal mark.
    s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma >= 0) {
    // "1,234" is thousands; "12,50" (1-2 digits after a single comma) is a decimal comma.
    const after = s.length - lastComma - 1;
    const commas = (s.match(/,/g) ?? []).length;
    s = commas === 1 && after <= 2 ? s.replace(",", ".") : s.replace(/,/g, "");
  } else if (lastDot >= 0) {
    const dots = (s.match(/\./g) ?? []).length;
    const after = s.length - lastDot - 1;
    // "1.234.567" (several dots) or "1.234" with three digits after one dot is ambiguous; treat several dots as thousands.
    if (dots > 1 && after === 3) s = s.replace(/\./g, "");
  }
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** First money-looking tokens inside free text ("Coffee Shop -4.50 1,200.00"). */
export const MONEY_TOKEN = /\(?[-+]?[$€£₦]?\s?\d{1,3}(?:[,.\s]\d{3})*(?:[.,]\d{2})\)?(?:\s?(?:CR|DR))?|\(?[-+]?[$€£₦]?\d+[.,]\d{2}\)?(?:\s?(?:CR|DR))?/gi;
