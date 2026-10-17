import { formatDateText, normalizeTransactions, type ExportOptions, type ExportTransaction } from "./exportModel";

/** One CSV cell. Text that starts with = + - @ is prefixed so Excel can never run it as a formula. */
export function csvCell(v: unknown, isText = true): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
  let raw = String(v).replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
  if (isText && /^[=+\-@]/.test(raw) && !/^[+-]?\d[\d.,]*$/.test(raw)) raw = `'${raw}`;
  return /[",]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

export const CSV_HEADER = [
  "Date", "Type", "Merchant / payee", "Category", "Description", "Amount", "Currency", "Payment method", "Account", "Card last 4",
  "Subtotal", "Tax", "Tip", "Tags", "Entry source", "Reimbursable", "Notes", "Document link", "Document type",
];

/** The same columns as the Transactions sheet, as CSV with a UTF-8 BOM so Excel opens it cleanly. */
export function buildTransactionsCsv(transactions: ExportTransaction[], options: ExportOptions = {}): string {
  const rows = normalizeTransactions(transactions, options);
  const fmt = options.dateFormat ?? "iso";
  const body = rows.map((t) =>
    [
      csvCell(formatDateText(t.date, fmt), false), csvCell(t.type), csvCell(t.merchant), csvCell(t.category), csvCell(t.description),
      csvCell(t.amount), csvCell(t.currency), csvCell(t.paymentMethod), csvCell(t.account), csvCell(t.cardLast4),
      csvCell(t.subtotal), csvCell(t.tax), csvCell(t.tip), csvCell(t.tags), csvCell(t.source), csvCell(t.reimbursable), csvCell(t.notes),
      csvCell(t.docLink, false), csvCell(t.docType),
    ].join(","),
  );
  return `﻿${[CSV_HEADER.join(","), ...body].join("\r\n")}`;
}
