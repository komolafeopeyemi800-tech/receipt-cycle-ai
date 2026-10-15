import { data as ISO_CURRENCY_DATA } from "currency-codes";

/** AsyncStorage keys for regional & lists (also mirrored to Convex when signed in) */
export const PREF_KEYS = {
  currency: "pref_currency_iso",
  dateFormat: "pref_date_format",
  numberFormat: "pref_number_format",
  locationsJson: "pref_locations_json",
  merchantsJson: "pref_merchants_json",
} as const;

/** Feature toggles from Settings (mirrored to Convex when signed in) */
export const SETTINGS_STORAGE_KEYS = {
  reimbursements: "settings_reimbursements",
  txnNumber: "settings_txn_number",
  scanPayment: "settings_scan_payment",
  requirePay: "settings_require_pay",
  requireNotes: "settings_require_notes",
  voiceInputLanguage: "settings_voice_input_language",
} as const;

/**
 * Whisper / voice transcription language (ISO-639-1 where applicable).
 * `auto` lets the model detect the spoken language.
 */
export const VOICE_INPUT_LANGUAGE_OPTIONS: { id: string; label: string }[] = [
  { id: "auto", label: "Auto-detect" },
  { id: "en", label: "English" },
  { id: "es", label: "Spanish" },
  { id: "fr", label: "French" },
  { id: "de", label: "German" },
  { id: "it", label: "Italian" },
  { id: "pt", label: "Portuguese" },
  { id: "nl", label: "Dutch" },
  { id: "pl", label: "Polish" },
  { id: "ru", label: "Russian" },
  { id: "ja", label: "Japanese" },
  { id: "ko", label: "Korean" },
  { id: "zh", label: "Chinese" },
  { id: "ar", label: "Arabic" },
  { id: "hi", label: "Hindi" },
  { id: "tr", label: "Turkish" },
  { id: "sv", label: "Swedish" },
  { id: "da", label: "Danish" },
  { id: "fi", label: "Finnish" },
  { id: "no", label: "Norwegian" },
  { id: "vi", label: "Vietnamese" },
  { id: "th", label: "Thai" },
  { id: "id", label: "Indonesian" },
  { id: "sw", label: "Swahili" },
  { id: "yo", label: "Yoruba" },
  { id: "ig", label: "Igbo" },
  { id: "ha", label: "Hausa" },
];

const VOICE_LANG_IDS = new Set(VOICE_INPUT_LANGUAGE_OPTIONS.map((o) => o.id));

export function normalizeVoiceInputLanguage(raw: string | undefined | null): string {
  const s = (raw ?? "auto").trim().toLowerCase();
  if (s === "" || s === "auto") return "auto";
  return VOICE_LANG_IDS.has(s) ? s : "auto";
}

export type DateFormatId = "iso" | "us" | "eu";

export const CURRENCY_OPTIONS: Array<{ code: string; label: string }> = ISO_CURRENCY_DATA.map((c) => ({
  code: c.code,
  label: `${c.currency} (${c.code})`,
})).sort((a, b) => a.label.localeCompare(b.label));

export const DATE_FORMAT_OPTIONS: { id: DateFormatId; label: string }[] = [
  { id: "iso", label: "YYYY-MM-DD (ISO)" },
  { id: "us", label: "MM/DD/YYYY (US)" },
  { id: "eu", label: "DD/MM/YYYY (EU)" },
];

export type SavedLocation = { id: string; label: string; address: string };

export type NumberFormatId = "standard" | "indian" | "european" | "space" | "swiss";

export const NUMBER_FORMAT_OPTIONS: { id: NumberFormatId; label: string; example: string }[] = [
  { id: "standard", label: "Standard (default)", example: "1,000,000.00" },
  { id: "indian", label: "Indian (lakh and crore)", example: "10,00,000.00" },
  { id: "european", label: "European", example: "1.000.000,00" },
  { id: "space", label: "Space separated", example: "1 000 000,00" },
  { id: "swiss", label: "Swiss", example: "1’000’000.00" },
];

const SEPARATORS: Record<NumberFormatId, { group: string; decimal: string }> = {
  standard: { group: ",", decimal: "." },
  indian: { group: ",", decimal: "." },
  european: { group: ".", decimal: "," },
  space: { group: " ", decimal: "," },
  swiss: { group: "’", decimal: "." },
};

let activeNumberFormat: NumberFormatId = "standard";
export function setActiveNumberFormat(id: NumberFormatId) {
  activeNumberFormat = id;
}
export function isNumberFormatId(v: unknown): v is NumberFormatId {
  return typeof v === "string" && v in SEPARATORS;
}

/** Groups the whole-number digits of a non-negative integer string, e.g. "1000000" -> "1,000,000" or "10,00,000". */
function groupDigits(digits: string, format: NumberFormatId): string {
  const { group } = SEPARATORS[format];
  if (digits.length <= 3) return digits;
  if (format === "indian") {
    const last3 = digits.slice(-3);
    const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, group);
    return `${rest}${group}${last3}`;
  }
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, group);
}

/** Formats a plain number with the person's chosen grouping, e.g. 1234567.5 -> "1,234,567.50". */
export function formatNumberGrouped(value: number, fractionDigits = 2, format: NumberFormatId = activeNumberFormat): string {
  if (!Number.isFinite(value)) return "0";
  const fixed = Math.abs(value).toFixed(fractionDigits);
  const [whole, frac] = fixed.split(".");
  const { decimal } = SEPARATORS[format];
  return `${value < 0 && Number(fixed) !== 0 ? "-" : ""}${groupDigits(whole, format)}${frac ? `${decimal}${frac}` : ""}`;
}

function currencySymbol(code: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: code, currencyDisplay: "narrowSymbol" })
      .formatToParts(0).find((p) => p.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
}

export function formatMoneyAmount(amount: number, currencyCode: string): string {
  const code = currencyCode.length === 3 ? currencyCode : "USD";
  const symbol = currencySymbol(code);
  const body = formatNumberGrouped(Math.abs(amount), 2);
  const sign = amount < 0 && Number(Math.abs(amount).toFixed(2)) !== 0 ? "-" : "";
  return `${sign}${symbol}${body}`;
}

/**
 * Compact currency for tight headers (large amounts stay on one line).
 * Uses `notation: "compact"` when supported; otherwise M/K/B style with currency symbol.
 */
export function formatMoneyCompact(amount: number, currencyCode: string): string {
  const code = currencyCode.length === 3 ? currencyCode : "USD";
  try {
    const nf = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      notation: "compact",
      maximumFractionDigits: 2,
    });
    return nf.format(amount);
  } catch {
    /* Hermes / older engines */
  }
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  let core: string;
  if (abs >= 1e9) core = `${(abs / 1e9).toFixed(2)}B`;
  else if (abs >= 1e6) core = `${(abs / 1e6).toFixed(2)}M`;
  else if (abs >= 1e5) core = `${(abs / 1e3).toFixed(1)}K`;
  else return formatMoneyAmount(amount, code);
  try {
    const sym =
      new Intl.NumberFormat(undefined, { style: "currency", currency: code, currencyDisplay: "narrowSymbol" })
        .formatToParts(0)
        .find((p) => p.type === "currency")?.value ?? code;
    return `${sign}${sym}${core}`;
  } catch {
    return `${sign}${code} ${core}`;
  }
}

/** Format stored YYYY-MM-DD for display using user date preference */
export function formatDateYmd(ymd: string, fmt: DateFormatId): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return ymd;
  const y = m[1]!;
  const mo = m[2]!;
  const d = m[3]!;
  if (fmt === "iso") return `${y}-${mo}-${d}`;
  if (fmt === "us") return `${mo}/${d}/${y}`;
  return `${d}/${mo}/${y}`;
}
