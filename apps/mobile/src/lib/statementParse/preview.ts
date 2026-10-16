/** The review step between "file read" and "saved": pure helpers shared by the phone and the web page. */
import type { ParsedRow } from "./statement";

export type PreviewRow = ParsedRow & { id: number; selected: boolean };

/**
 * A readable merchant name from a raw bank description: "POS PURCHASE 0302 CHEVRON 44792210 SAN JOSE CA" -> "Chevron".
 * The raw text is kept as the description, so nothing is lost.
 */
export function cleanMerchant(raw: string): string {
  let s = raw.replace(/\s+/g, " ").trim();
  if (!s) return s;
  s = s.replace(/^(?:pos\s+(?:purchase|debit|withdrawal)|debit\s+card\s+(?:purchase|pmt|payment)?|check\s*card|purchase(?:\s+authorized\s+on)?|recurring\s+payment|ach\s+(?:debit|credit|pmt|payment|withdrawal|deposit)|online\s+payment\s+to|sq\s*\*|tst\s*\*|paypal\s*\*)\s*/i, "");
  s = s.replace(/^(?:\d{2}\/\d{2}|\d{4})\s+/, "");
  s = s.replace(/\s*\*.*$/, ""); // "UBER *TRIP 3853" -> "UBER"; "AMAZON.COM*4236AB12" -> "AMAZON.COM"
  s = s.replace(/\s+(?:web\s+id:.*|ppd\b.*|ccd\b.*|confirmation#.*|store\s+\d+.*)$/i, "");
  s = s.replace(/\s+\S*(?:#|\d{3,})\S*.*$/, ""); // from the first store number / reference onwards
  s = s.replace(/\s+(?:inv|invoice|ref|trn|id|no)$/i, "");
  s = s.replace(/[\s,.;:-]+$/, "").trim();
  if (s.length < 2) return raw.trim();
  const letters = s.replace(/[^A-Za-z]/g, "");
  if (letters.length > 2 && letters === letters.toUpperCase()) {
    s = s.toLowerCase().replace(/(^|[\s/&-])([a-z])/g, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
  }
  return s.slice(0, 120);
}

/** Ticked by default: everything except exact duplicates, own-account transfers and future-dated rows. */
export function toPreviewRows(rows: ParsedRow[]): PreviewRow[] {
  return rows.map((r, id) => {
    const raw = r.description ?? r.merchant ?? "";
    const merchant = r.merchant ? cleanMerchant(r.merchant) : undefined;
    return { ...r, ...(merchant ? { merchant } : {}), ...(raw ? { description: raw } : {}), id, selected: !r.duplicate && !r.transfer && !r.future };
  });
}

export const toggleRow = (rows: PreviewRow[], id: number): PreviewRow[] => rows.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r));

export const setRowType = (rows: PreviewRow[], id: number, type: "expense" | "income"): PreviewRow[] =>
  rows.map((r) => (r.id === id ? { ...r, type } : r));

/** "Flip sign": money in becomes money out and the reverse, for every row (a card export that lists charges as positive, say). */
export const swapDirections = (rows: PreviewRow[]): PreviewRow[] => rows.map((r) => ({ ...r, type: r.type === "expense" ? "income" : "expense" }));

export const setAllSelected = (rows: PreviewRow[], selected: boolean): PreviewRow[] => rows.map((r) => ({ ...r, selected }));

/** Tick or untick one kind of flagged row at once ("include transfers"). */
export const setFlagged = (rows: PreviewRow[], flag: "transfer" | "duplicate" | "future", selected: boolean): PreviewRow[] =>
  rows.map((r) => (r[flag] ? { ...r, selected } : r));

export type PreviewTotals = { selected: number; total: number; moneyIn: number; moneyOut: number; transfers: number; duplicates: number; future: number };

export function previewTotals(rows: PreviewRow[]): PreviewTotals {
  const t: PreviewTotals = { selected: 0, total: rows.length, moneyIn: 0, moneyOut: 0, transfers: 0, duplicates: 0, future: 0 };
  for (const r of rows) {
    if (r.transfer) t.transfers++;
    if (r.duplicate) t.duplicates++;
    if (r.future) t.future++;
    if (!r.selected) continue;
    t.selected++;
    if (r.type === "income") t.moneyIn += r.amount;
    else t.moneyOut += r.amount;
  }
  t.moneyIn = Math.round(t.moneyIn * 100) / 100;
  t.moneyOut = Math.round(t.moneyOut * 100) / 100;
  return t;
}

const defaultCategory = (type: "expense" | "income") => (type === "expense" ? "Other" : "Salary");

/** Only the ticked rows, in the shape the import API takes (no preview flags). */
export function importPayload(rows: PreviewRow[]) {
  return rows
    .filter((r) => r.selected)
    .map((r) => ({
      amount: r.amount,
      type: r.type,
      category: r.category && r.category !== "Other" ? r.category : defaultCategory(r.type),
      date: r.date,
      merchant: r.merchant,
      description: r.description ?? r.merchant,
    }));
}

/** Money text for the preview: 1234.5 -> "$1,234.50". */
export const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const updateRow = (rows: PreviewRow[], id: number, patch: Partial<Pick<PreviewRow, "date" | "merchant" | "amount" | "type" | "category">>): PreviewRow[] =>
  rows.map((r) => (r.id === id ? { ...r, ...patch } : r));

/** The slice of the receipt/invoice scan result needed to make one transaction from a document. */
export type ScannedDocument = {
  merchant_name?: string;
  total_amount?: number;
  date?: string;
  transaction_type?: "expense" | "income";
  description?: string;
  category?: string;
};

/** An invoice or receipt read as one transaction (its total). Null when no total could be read. */
export function documentToRow(e: ScannedDocument | null | undefined, today: string): { row: ParsedRow; warnings: string[] } | null {
  const total = typeof e?.total_amount === "number" ? e.total_amount : Number.NaN;
  if (!e || !Number.isFinite(total) || total <= 0) return null;
  const warnings: string[] = [];
  let date = typeof e.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.date) ? e.date : "";
  if (!date) {
    date = today;
    warnings.push("No date could be read from this document, so today's date was filled in. Change it before importing.");
  }
  return {
    row: {
      date,
      amount: Math.round(total * 100) / 100,
      type: e.transaction_type === "income" ? "income" : "expense",
      category: e.category && e.category.trim() ? e.category.trim() : "Other",
      ...(e.merchant_name?.trim() ? { merchant: e.merchant_name.trim().slice(0, 120) } : {}),
    },
    warnings,
  };
}
