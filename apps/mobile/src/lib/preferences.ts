import { data as ISO_CURRENCY_DATA } from "currency-codes";

/** AsyncStorage keys for regional & lists (also mirrored to Convex when signed in) */
export const PREF_KEYS = {
  currency: "pref_currency_iso",
  dateFormat: "pref_date_format",
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

export function formatMoneyAmount(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode.length === 3 ? currencyCode : "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
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
