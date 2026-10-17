/**
 * Shared, pure helpers for the spreadsheet export (workbook + CSV). No React Native imports.
 */

export type DateFormatId = "iso" | "us" | "eu";

export type ExportTransaction = {
  id: string;
  date: string;
  type: string;
  amount: number;
  merchant?: string | null;
  category?: string | null;
  description?: string | null;
  payment_method?: string | null;
  workspace?: string | null;
  accountId?: string | null;
  tags?: string[] | null;
  receipt_url?: string | null;
  receipt_data?: unknown;
  entry_source?: string | null;
  evidence_url?: string | null;
};

export type DocumentKind = "bank_statement" | "card_statement" | "receipt" | "invoice" | "spreadsheet" | "other";

/** One row of GET /api/documents. */
export type ExportDocument = {
  id: string;
  kind: DocumentKind | string;
  fileName: string;
  r2Key: string;
  mime?: string | null;
  size?: number | null;
  meta?: Record<string, unknown> | null;
  createdAt?: string | number | null;
};

export type ExportInvoice = {
  number: string;
  customer: string;
  issueDate: string;
  dueDate?: string | null;
  total: number;
  paid: number;
  status?: string | null;
};

export type ExportOptions = {
  businessName?: string;
  reportTitle?: string;
  /** ISO 4217, default USD. */
  currency?: string;
  dateFormat?: DateFormatId;
  /** User's number format id (standard, indian, european, space, swiss). Excel shows separators per computer region. */
  numberFormat?: string;
  /** YYYY-MM-DD, the person's local today. */
  generatedOn?: string;
  /** Overrides the period shown (default: first and last transaction date). */
  period?: { from?: string; to?: string };
  /** accountId -> display name */
  accountNames?: Record<string, string>;
  /** R2 key -> openable URL (from POST /api/receipts/links). */
  links?: Record<string, string>;
  documents?: ExportDocument[];
  invoices?: ExportInvoice[];
};

export const TEAL = "0F766E";

// ---- small value helpers ----

export function asRecord(v: unknown): Record<string, unknown> {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      if (p && typeof p === "object" && !Array.isArray(p)) return p as Record<string, unknown>;
    } catch {
      /* not JSON */
    }
  }
  return {};
}

const norm = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Look a field up by several spellings (snake_case, camelCase, spaces). */
export function pick(obj: Record<string, unknown> | null | undefined, ...names: string[]): unknown {
  if (!obj) return undefined;
  const want = names.map(norm);
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || v === "") continue;
    if (want.includes(norm(k))) return v;
  }
  return undefined;
}

export function toNumber(v: unknown): number | undefined {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.\-]/g, ""));
    return v.trim() && Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

export function toText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

export function toYmd(v: unknown): string {
  const s = toText(v);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
}

export function formatDateText(ymd: string, fmt: DateFormatId = "iso"): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd);
  if (!m) return ymd;
  if (fmt === "us") return `${m[2]}/${m[3]}/${m[1]}`;
  if (fmt === "eu") return `${m[3]}/${m[2]}/${m[1]}`;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

export function excelDateFormat(fmt: DateFormatId = "iso"): string {
  return fmt === "us" ? "mm/dd/yyyy" : fmt === "eu" ? "dd/mm/yyyy" : "yyyy-mm-dd";
}

const SYMBOLS: Record<string, string> = {
  USD: "$", CAD: "CA$", AUD: "A$", NZD: "NZ$", MXN: "MX$", EUR: "€", GBP: "£", JPY: "¥", CNY: "CN¥", INR: "₹", NGN: "₦",
  KRW: "₩", BRL: "R$", ZAR: "R", CHF: "CHF ", KES: "KSh ", GHS: "GH₵", PHP: "₱", ILS: "₪", TRY: "₺", VND: "₫", PLN: "zł ",
};
const ZERO_DECIMAL = new Set(["JPY", "KRW", "VND", "CLP", "ISK", "UGX", "XAF", "XOF"]);

/** Excel currency number format for a currency code, e.g. USD -> `"$"#,##0.00;[Red]-"$"#,##0.00`. */
export function currencyNumFmt(code?: string): string {
  const c = (code && /^[A-Za-z]{3}$/.test(code) ? code : "USD").toUpperCase();
  const sym = SYMBOLS[c] ?? `${c} `;
  const dec = ZERO_DECIMAL.has(c) ? "" : ".00";
  const q = `"${sym}"`;
  return `${q}#,##0${dec};[Red]-${q}#,##0${dec}`;
}

/** Date-only name of a month: 2026-03 -> "Mar 2026" */
export function monthLabel(ym: string): string {
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const m = /^(\d{4})-(\d{2})/.exec(ym);
  return m ? `${names[Number(m[2]) - 1] ?? m[2]} ${m[1]}` : ym;
}

export const KIND_LABELS: Record<string, string> = {
  bank_statement: "Bank statement",
  card_statement: "Card statement",
  receipt: "Receipt",
  invoice: "Invoice",
  spreadsheet: "Spreadsheet",
  other: "Other file",
};
export const kindLabel = (kind: string) => KIND_LABELS[kind] ?? (kind ? kind.replace(/_/g, " ") : "Other file");

// ---- transactions ----

export type NormalizedTransaction = {
  id: string;
  date: string;
  isIncome: boolean;
  type: "Income" | "Expense";
  amount: number;
  merchant: string;
  category: string;
  description: string;
  paymentMethod: string;
  account: string;
  cardLast4: string;
  subtotal?: number;
  tax?: number;
  tip?: number;
  currency: string;
  tags: string;
  source: string;
  reimbursable: string;
  notes: string;
  /** Stored file key (R2) when there is one. */
  fileKey: string;
  docLink: string;
  docType: string;
};

const SOURCE_LABELS: Record<string, string> = { manual: "Manual", camera: "Camera scan", upload: "Upload", voice: "Voice" };

const isHttp = (s: string) => /^https?:\/\//i.test(s);

/** Is this receipt_url an R2 key that can be given a signed link (as opposed to a legacy URL)? */
export function isStoredKey(s: string | null | undefined): s is string {
  return !!s && !isHttp(s) && s.startsWith("receipts/") && !s.includes("..");
}

export function normalizeTransactions(rows: ExportTransaction[], opts: ExportOptions): NormalizedTransaction[] {
  const docByKey = new Map<string, ExportDocument>();
  for (const d of opts.documents ?? []) if (d.r2Key) docByKey.set(d.r2Key, d);
  const defaultCurrency = (opts.currency || "USD").toUpperCase();
  const out = rows.map((t, idx) => {
    const data = asRecord(t.receipt_data);
    const key = t.receipt_url ?? "";
    const doc = key ? docByKey.get(key) : undefined;
    const linkFromMap = key ? opts.links?.[key] : undefined;
    const docLink = linkFromMap || (key && isHttp(key) ? key : "") || t.evidence_url || "";
    const rdDesc = toText(pick(data, "description"));
    const txDesc = toText(t.description);
    const voice =
      toText(t.entry_source).toLowerCase() === "voice" ||
      toText(pick(data, "entry_source", "input_method", "source")).toLowerCase() === "voice" ||
      (Array.isArray(data.tags) && (data.tags as unknown[]).includes("voice"));
    const srcKey = voice ? "voice" : toText(t.entry_source).toLowerCase();
    const reimb = pick(data, "reimbursable", "is_reimbursable", "reimbursement");
    const isIncome = toText(t.type).toLowerCase() === "income";
    const hasFile = !!key || !!t.evidence_url;
    return {
      idx,
      row: {
        id: t.id,
        date: toYmd(t.date),
        isIncome,
        type: isIncome ? "Income" : "Expense",
        amount: Number.isFinite(t.amount) ? t.amount : 0,
        merchant: toText(t.merchant),
        category: toText(t.category) || "Uncategorized",
        description: rdDesc || txDesc,
        paymentMethod: toText(t.payment_method) || toText(pick(data, "payment_method")),
        account: (t.accountId && opts.accountNames?.[t.accountId]) || "",
        cardLast4: toText(pick(data, "card_last4", "cardLast4")).replace(/\D/g, "").slice(-4),
        subtotal: toNumber(pick(data, "subtotal")),
        tax: toNumber(pick(data, "tax_amount", "tax")),
        tip: toNumber(pick(data, "tip_amount", "tip")),
        currency: (toText(pick(data, "currency")) || defaultCurrency).toUpperCase(),
        tags: Array.isArray(t.tags) ? t.tags.join(", ") : "",
        source: SOURCE_LABELS[srcKey] ?? (srcKey ? srcKey[0]!.toUpperCase() + srcKey.slice(1) : "Manual"),
        reimbursable: reimb === undefined ? "" : reimb === true || /^(y|yes|true|1)$/i.test(String(reimb)) ? "Yes" : "No",
        notes: rdDesc && txDesc && rdDesc !== txDesc ? txDesc : toText(pick(data, "notes")),
        fileKey: isStoredKey(key) ? key : "",
        docLink,
        docType: doc ? kindLabel(doc.kind) : hasFile ? "Receipt" : "",
      } as NormalizedTransaction,
    };
  });
  // Oldest first; keep the original order for the same day.
  out.sort((a, b) => (a.row.date < b.row.date ? -1 : a.row.date > b.row.date ? 1 : a.idx - b.idx));
  return out.map((x) => x.row);
}

export function exportFileName(prefix: string, ymd: string, ext: "xlsx" | "csv"): string {
  return `${prefix}-${ymd}.${ext}`;
}
