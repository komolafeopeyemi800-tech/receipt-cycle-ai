import { csvCell } from "./exportCsv";
import { asRecord, formatDateText, normalizeTransactions, pick, toNumber, toText, type ExportOptions, type ExportTransaction } from "./exportModel";

export const ITEMS_CSV_HEADER = [
  "Item", "Date", "Merchant / payee", "Category", "Quantity", "Unit price", "Item total", "Change vs previous purchase", "Change %",
  "Receipt total", "Currency", "Document link",
];

type ItemRow = {
  name: string;
  key: string;
  date: string;
  merchant: string;
  category: string;
  quantity: number | undefined;
  unit: number | undefined;
  total: number | undefined;
  receiptTotal: number;
  currency: string;
  docLink: string;
  order: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const itemKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** The line items of one transaction's scanned receipt (empty when it was typed in or has no itemised lines). */
function itemsOf(receiptData: unknown): Record<string, unknown>[] {
  const data = asRecord(receiptData);
  const raw = pick(data, "items", "line_items", "lineItems");
  return Array.isArray(raw) ? raw.filter((x): x is Record<string, unknown> => !!x && typeof x === "object") : [];
}

/**
 * One row per item bought, for the filtered receipts, sorted by item and then date so a change in an item's price
 * between visits reads straight down the column (for example milk across grocery receipts). A receipt with no itemised
 * lines still gets one row, so nothing silently disappears from the export.
 */
export function buildItemsCsv(transactions: ExportTransaction[], options: ExportOptions = {}): string {
  const normalized = normalizeTransactions(transactions, options);
  const byId = new Map(transactions.map((t) => [t.id, t]));
  const rows: ItemRow[] = [];
  normalized.forEach((n, order) => {
    const lines = itemsOf(byId.get(n.id)?.receipt_data);
    const base = { date: n.date, merchant: n.merchant, category: n.category, receiptTotal: n.amount, currency: n.currency, docLink: n.docLink, order };
    if (lines.length === 0) {
      rows.push({ ...base, name: "(no itemised lines)", key: "", quantity: undefined, unit: undefined, total: undefined });
      return;
    }
    for (const line of lines) {
      const name = toText(pick(line, "name", "description", "item")) || "Item";
      const quantity = toNumber(pick(line, "quantity", "qty"));
      const total = toNumber(pick(line, "total", "amount", "line_total", "price"));
      const unit = toNumber(pick(line, "unit_price", "unitPrice")) ?? (total !== undefined && quantity ? round2(total / quantity) : toNumber(pick(line, "price")));
      rows.push({ ...base, name, key: itemKey(name), quantity, unit, total: total ?? (unit !== undefined ? round2(unit * (quantity ?? 1)) : undefined) });
    }
  });

  rows.sort((a, b) => {
    if (!a.key !== !b.key) return a.key ? -1 : 1; // unitemised receipts go last
    if (a.key !== b.key) return a.key < b.key ? -1 : 1;
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.order - b.order;
  });

  const fmt = options.dateFormat ?? "iso";
  const last = new Map<string, number>();
  const body = rows.map((r) => {
    let change: number | undefined;
    let pct: number | undefined;
    if (r.key && r.unit !== undefined) {
      const prev = last.get(r.key);
      if (prev !== undefined) {
        change = round2(r.unit - prev);
        pct = prev !== 0 ? round2(((r.unit - prev) / prev) * 100) : undefined;
      }
      last.set(r.key, r.unit);
    }
    return [
      csvCell(r.name), csvCell(formatDateText(r.date, fmt), false), csvCell(r.merchant), csvCell(r.category), csvCell(r.quantity),
      csvCell(r.unit), csvCell(r.total), csvCell(change), csvCell(pct), csvCell(r.receiptTotal), csvCell(r.currency), csvCell(r.docLink, false),
    ].join(",");
  });
  return `﻿${[ITEMS_CSV_HEADER.join(","), ...body].join("\r\n")}`;
}
