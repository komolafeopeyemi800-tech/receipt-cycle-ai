/**
 * Builds the Receipt Cycle bookkeeping workbook (.xlsx): Summary, Transactions, Documents, Line items and,
 * when invoice data is supplied, Invoices & Payments. Pure TypeScript, shared by the phone and the web app.
 */
import { cellRef, colLetter, sheetRef, ymdToSerial, Workbook, type CellStyle, type SheetBuilder } from "./xlsxWriter";
import {
  asRecord,
  currencyNumFmt,
  excelDateFormat,
  formatDateText,
  kindLabel,
  monthLabel,
  normalizeTransactions,
  pick,
  TEAL,
  toNumber,
  toText,
  toYmd,
  type ExportDocument,
  type ExportOptions,
  type ExportTransaction,
} from "./exportModel";

const C = {
  teal: TEAL,
  tealDark: "134E4A",
  tealMid: "115E59",
  tealSoft: "CCFBF1",
  zebra: "F0FDFA",
  line: "CBD5E1",
  hair: "E2E8F0",
  ink: "0F172A",
  muted: "64748B",
  link: "0563C1",
  income: "15803D",
  expense: "B91C1C",
  white: "FFFFFF",
};

const FOOTER = "Prepared with Receipt Cycle";
const TX_FIRST_ROW = 4; // 0-based row of first transaction row on the Transactions sheet

/** Width in characters a formatted money value needs: digits, separators, decimals, a currency symbol or code and a sign, plus padding. */
function moneyChars(n: number): number {
  const whole = String(Math.floor(Math.abs(n)));
  const commas = Math.floor((whole.length - 1) / 3);
  return whole.length + commas + 3 + 5;
}
/** A column wide enough for its longest number (never narrower than `min`), so nothing ever shows as ####. */
function fitMoney(min: number, values: Array<number | null | undefined>): number {
  let w = min;
  for (const v of values) if (typeof v === "number" && Number.isFinite(v)) w = Math.max(w, moneyChars(v));
  return w;
}
/** A column wide enough for its longest text, within a sensible range. */
function fitText(min: number, values: Array<string | null | undefined>, max = 60): number {
  let w = min;
  for (const v of values) if (v) w = Math.max(w, Math.min(max, v.length + 3));
  return w;
}

export type BuiltWorkbook = { bytes: Uint8Array; sheetNames: string[] };

// ---- styles ----

const base: CellStyle = { color: C.ink, align: { v: "center" } };
const bottomHair: CellStyle["border"] = { style: "hair", color: C.hair, sides: ["bottom"] };

function headerStyle(h: "left" | "center" | "right" = "left"): CellStyle {
  return { bold: true, color: C.white, fill: C.teal, size: 11, align: { h, v: "center", wrap: true }, border: { style: "thin", color: C.tealDark, sides: ["bottom"] } };
}

function banner(sheet: SheetBuilder, lastCol: number, title: string, subtitle: string) {
  sheet.set(0, 0, title, { bold: true, size: 20, color: C.white, fill: C.tealDark, align: { v: "center", indent: 1 } });
  sheet.paint(0, 0, 0, lastCol, { fill: C.tealDark });
  sheet.merge(0, 0, 0, lastCol).height(0, 36);
  sheet.set(1, 0, subtitle, { size: 11, color: C.white, fill: C.tealMid, align: { v: "center", indent: 1 } });
  sheet.paint(1, 0, 1, lastCol, { fill: C.tealMid });
  sheet.merge(1, 0, 1, lastCol).height(1, 22);
}

function sectionTitle(sheet: SheetBuilder, row: number, col: number, lastCol: number, text: string) {
  const s: CellStyle = { bold: true, size: 13, color: C.teal, border: { style: "medium", color: C.teal, sides: ["bottom"] }, align: { v: "center" } };
  sheet.set(row, col, text, s);
  sheet.paint(row, col, row, lastCol, s);
  sheet.height(row, 22);
}

function noteRow(sheet: SheetBuilder, row: number, lastCol: number, text: string) {
  sheet.set(row, 0, text, { italic: true, color: C.muted, align: { v: "center", indent: 1 } });
  sheet.merge(row, 0, row, lastCol);
}

// ---- document normalisation ----

type DocRow = {
  doc: ExportDocument;
  link: string;
  type: string;
  provider: string;
  account: string;
  start: string;
  end: string;
  due: string;
  opening?: number;
  credits?: number;
  debits?: number;
  subtotal?: number;
  tax?: number;
  tip?: number;
  total?: number;
  currency: string;
  txCount?: number;
  details: string;
  uploaded: string;
  size: string;
};

type LineItem = { docName: string; link: string; vendor: string; date: string; item: string; qty?: number; unit?: number; amount?: number };

const prettyLabel = (k: string) => k.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase());
const IGNORED_DETAIL_KEYS = new Set(["lineitems", "items", "transactions", "rows", "raw", "text", "formattedreceipttext", "warnings", "tags", "documenttype", "kind"]);

function fmtSize(n: unknown): string {
  const b = toNumber(n);
  if (b === undefined) return "";
  return b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
}

function last4Text(v: unknown): string {
  const d = toText(v).replace(/\D/g, "").slice(-4);
  return d ? `••${d}` : "";
}

function createdYmd(v: unknown): string {
  if (typeof v === "number") return Number.isFinite(v) ? new Date(v).toISOString().slice(0, 10) : "";
  return toYmd(v);
}

export function describeDocument(doc: ExportDocument, opts: ExportOptions): { row: DocRow; items: LineItem[] } {
  const meta = asRecord(doc.meta);
  const used = new Set<string>();
  const norm = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, "");
  const take = (...names: string[]) => {
    names.forEach((n) => used.add(norm(n)));
    return pick(meta, ...names);
  };
  const fmtD = (ymd: string) => formatDateText(ymd, opts.dateFormat ?? "iso");
  const extra: string[] = [];
  const addExtra = (label: string, v: unknown, kind: "text" | "money" | "date" = "text") => {
    if (v === undefined || v === null || v === "") return;
    const val = kind === "money" ? String(toNumber(v) ?? v) : kind === "date" ? fmtD(toYmd(v)) : toText(v);
    if (val) extra.push(`${label}: ${val}`);
  };
  const kind = doc.kind;
  const r: DocRow = {
    doc,
    link: opts.links?.[doc.r2Key] ?? "",
    type: kindLabel(kind),
    provider: "",
    account: "",
    start: "",
    end: "",
    due: "",
    currency: (toText(take("currency")) || opts.currency || "USD").toUpperCase(),
    details: "",
    uploaded: createdYmd(doc.createdAt),
    size: fmtSize(doc.size),
  };
  if (kind === "bank_statement") {
    r.provider = toText(take("bank_name", "bank", "institution"));
    const name = toText(take("account_name", "account"));
    r.account = [name, last4Text(take("account_last4", "last4", "account_number"))].filter(Boolean).join(" ");
    r.start = toYmd(take("statement_start_date", "statement_start", "period_start", "start_date"));
    r.end = toYmd(take("statement_end_date", "statement_end", "period_end", "end_date"));
    r.opening = toNumber(take("opening_balance", "beginning_balance"));
    r.credits = toNumber(take("total_deposits", "deposits", "total_credits"));
    r.debits = toNumber(take("total_withdrawals", "withdrawals", "total_debits"));
    r.total = toNumber(take("closing_balance", "ending_balance"));
    r.txCount = toNumber(take("transaction_count", "transactions_count", "row_count"));
  } else if (kind === "card_statement") {
    r.provider = toText(take("issuer", "card_issuer", "bank_name"));
    r.account = [toText(take("card_name", "card", "account_name")), last4Text(take("account_last4", "card_last4", "last4"))].filter(Boolean).join(" ");
    r.start = toYmd(take("statement_start_date", "statement_start", "period_start"));
    r.end = toYmd(take("statement_end_date", "statement_end", "period_end"));
    r.due = toYmd(take("payment_due_date", "due_date"));
    r.opening = toNumber(take("previous_balance", "prior_balance"));
    r.credits = toNumber(take("payments", "payments_credits", "total_payments"));
    r.debits = toNumber(take("new_charges", "purchases", "total_charges"));
    r.total = toNumber(take("new_balance", "closing_balance", "statement_balance"));
    r.txCount = toNumber(take("transaction_count", "transactions_count", "row_count"));
    addExtra("Minimum payment due", take("minimum_payment_due", "minimum_payment", "min_payment"), "money");
    addExtra("Credit limit", take("credit_limit"), "money");
  } else if (kind === "invoice") {
    r.provider = toText(take("vendor", "vendor_name", "supplier", "from"));
    r.account = toText(take("invoice_number", "invoice_no", "number"));
    r.start = toYmd(take("issue_date", "invoice_date", "date"));
    r.due = toYmd(take("due_date"));
    r.subtotal = toNumber(take("subtotal"));
    r.tax = toNumber(take("tax", "tax_amount", "total_tax"));
    r.total = toNumber(take("total", "total_amount", "amount_due"));
    addExtra("PO number", take("po_number", "purchase_order", "po"));
    addExtra("Payment terms", take("payment_terms", "terms"));
    addExtra("Bill to", take("bill_to", "billed_to", "customer"));
  } else if (kind === "receipt") {
    r.provider = toText(take("merchant", "merchant_name", "vendor", "store"));
    r.account = toText(take("receipt_number", "receipt_no", "reference"));
    r.start = toYmd(take("date", "receipt_date", "purchase_date"));
    r.subtotal = toNumber(take("subtotal"));
    r.tax = toNumber(take("tax", "tax_amount"));
    r.tip = toNumber(take("tip", "tip_amount"));
    r.total = toNumber(take("total", "total_amount", "amount"));
    addExtra("Address", take("address", "merchant_address"));
    addExtra("City", take("city"));
    addExtra("State", take("state", "region", "province"));
    addExtra("Country", take("country"));
    addExtra("Payment method", take("payment_method"));
    const l4 = last4Text(take("card_last4", "last4", "card_last_4"));
    if (l4) extra.push(`Card: ${l4}`);
  } else {
    r.provider = toText(take("provider", "vendor", "merchant", "bank_name", "name"));
    r.start = toYmd(take("date", "start_date", "issue_date"));
    r.total = toNumber(take("total", "total_amount", "amount"));
    r.txCount = toNumber(take("transaction_count", "row_count"));
  }
  // Anything else a document carries that has no column of its own.
  for (const [k, v] of Object.entries(meta)) {
    const nk = norm(k);
    if (used.has(nk) || IGNORED_DETAIL_KEYS.has(nk)) continue;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      const text = /date/i.test(k) && toYmd(v) ? fmtD(toYmd(v)) : toText(v);
      if (text) extra.push(`${prettyLabel(k)}: ${text}`);
    }
  }
  r.details = extra.join("; ");

  const items: LineItem[] = [];
  const rawItems = pick(meta, "line_items", "lineItems", "items");
  if (Array.isArray(rawItems)) {
    for (const it of rawItems) {
      const o = asRecord(it);
      const name = toText(pick(o, "name", "description", "item", "title"));
      if (!name) continue;
      const qty = toNumber(pick(o, "quantity", "qty"));
      const unit = toNumber(pick(o, "unit_price", "unitPrice", "price", "rate"));
      const amount = toNumber(pick(o, "amount", "total", "line_total")) ?? (qty !== undefined && unit !== undefined ? Math.round(qty * unit * 100) / 100 : unit);
      items.push({ docName: doc.fileName, link: r.link, vendor: r.provider, date: r.start, item: name, qty, unit, amount });
    }
  }
  return { row: r, items };
}

// ---- main builder ----

export function buildBookkeepingWorkbook(transactions: ExportTransaction[], options: ExportOptions = {}): BuiltWorkbook {
  const opts: ExportOptions = { ...options };
  const currency = (opts.currency || "USD").toUpperCase();
  const money = currencyNumFmt(currency);
  const dateFmt = excelDateFormat(opts.dateFormat ?? "iso");
  const fmtD = (ymd: string) => formatDateText(ymd, opts.dateFormat ?? "iso");
  const docs = opts.documents ?? [];
  const rows = normalizeTransactions(transactions, opts);
  const generatedOn = opts.generatedOn || new Date().toISOString().slice(0, 10);
  const business = opts.businessName?.trim() || "Receipt Cycle";
  const reportTitle = opts.reportTitle?.trim() || "Income & Expense Report";

  const dates = rows.map((r) => r.date).filter(Boolean);
  const from = opts.period?.from || dates[0] || "";
  const to = opts.period?.to || dates[dates.length - 1] || "";
  const periodText = from && to ? `${fmtD(from)} to ${fmtD(to)}` : "All dates";

  const wb = new Workbook({
    title: `${business} - ${reportTitle}`,
    subject: "Bookkeeping export",
    creator: "Receipt Cycle",
    company: business,
    description: `Transactions ${periodText}. Prepared with Receipt Cycle.`,
    created: new Date(`${generatedOn}T12:00:00Z`),
  });
  const summary = wb.addSheet("Summary");
  const tx = wb.addSheet("Transactions");
  const evSheet = wb.addSheet("Evidence links");
  const docSheet = wb.addSheet("Documents");
  const itemSheet = wb.addSheet("Line items");
  const invSheet = opts.invoices?.length ? wb.addSheet("Invoices & Payments") : null;
  summary.tabColor = C.teal;
  tx.tabColor = "2563EB";
  docSheet.tabColor = "F59E0B";
  evSheet.tabColor = "0EA5E9";
  itemSheet.tabColor = "8B5CF6";
  if (invSheet) invSheet.tabColor = "EC4899";
  for (const s of wb.sheets) s.print = { landscape: true, fitToWidth: true, footer: FOOTER };

  // ================= Transactions =================
  const TX = ["Date", "Type", "Merchant / payee", "Category", "Description", "Amount", "Currency", "Payment method", "Account", "Card last 4", "Subtotal", "Tax", "Tip", "Tags", "Entry source", "Reimbursable", "Notes", "Document", "Document type", "Document link (copy and paste)"];
  const lastTxCol = TX.length - 1;
  const first = TX_FIRST_ROW;
  const lastRow = Math.max(first, first + rows.length - 1);
  const col = { date: 0, type: 1, amount: 5, subtotal: 10, tax: 11, tip: 12 };
  const range = (c: number) => `${sheetRef("Transactions")}!${cellRef(first, c, true)}:${cellRef(lastRow, c, true)}`;

  banner(tx, lastTxCol, `${business}: Transactions`, `${periodText}  |  ${rows.length} transaction${rows.length === 1 ? "" : "s"}  |  ${currency}  |  Oldest first. Use the filter arrows on the header row.`);
  TX.forEach((h, c) => tx.set(3, c, h, headerStyle(c === 5 || (c >= 10 && c <= 12) ? "right" : "left")));
  tx.height(3, 28);
  rows.forEach((t, i) => {
    const r = first + i;
    const text: CellStyle = { ...base, border: bottomHair };
    const numeric: CellStyle = { ...text, numFmt: money, align: { h: "right", v: "center" } };
    tx.set(r, 0, t.date ? { date: t.date } : "", { ...text, numFmt: dateFmt, align: { h: "left", v: "center" } });
    tx.set(r, 1, t.type, { ...text, bold: true, color: t.isIncome ? C.income : C.expense });
    tx.set(r, 2, t.merchant, text);
    tx.set(r, 3, t.category, text);
    tx.set(r, 4, t.description, { ...text, align: { v: "center", wrap: true } });
    tx.set(r, 5, t.amount, { ...numeric, bold: true });
    tx.set(r, 6, t.currency, { ...text, align: { h: "center", v: "center" } });
    tx.set(r, 7, t.paymentMethod, text);
    tx.set(r, 8, t.account, text);
    tx.set(r, 9, t.cardLast4, { ...text, align: { h: "center", v: "center" } });
    tx.set(r, 10, t.subtotal ?? null, numeric);
    tx.set(r, 11, t.tax ?? null, numeric);
    tx.set(r, 12, t.tip ?? null, numeric);
    tx.set(r, 13, t.tags, text);
    tx.set(r, 14, t.source, text);
    tx.set(r, 15, t.reimbursable, { ...text, align: { h: "center", v: "center" } });
    tx.set(r, 16, t.notes, { ...text, align: { v: "center", wrap: true } });
    if (t.docLink) tx.set(r, 17, { v: "View document", link: t.docLink, linkTip: "Opens the stored receipt or file" }, { ...text, color: C.link, underline: true });
    else tx.set(r, 17, null, text);
    tx.set(r, 18, t.docType, text);
    // The full address as plain text so it can be copied, and left as the last column so it never gets cut off.
    tx.set(r, 19, t.docLink || null, { ...text, color: C.muted });
  });
  if (rows.length) tx.zebra(first, 0, lastRow, lastTxCol, C.zebra);
  tx.setAutoFilter(3, 0, lastRow, lastTxCol);
  tx.freeze = { rows: 4, cols: 1 };
  tx.print.repeatRows = [3, 3];

  // totals under the table
  const sum = (key: "amount" | "subtotal" | "tax" | "tip") => rows.reduce((a, t) => a + (t[key] ?? 0), 0);
  const totalRow = lastRow + 1;
  const totalStyle: CellStyle = { bold: true, color: C.tealDark, fill: C.tealSoft, border: { style: "medium", color: C.teal, sides: ["top"] }, align: { v: "center" } };
  tx.set(totalRow, 0, "Total (visible rows)", totalStyle);
  tx.paint(totalRow, 0, totalRow, lastTxCol, totalStyle);
  const totalNum: CellStyle = { ...totalStyle, numFmt: money, align: { h: "right", v: "center" } };
  for (const [c, key] of [[col.amount, "amount"], [col.subtotal, "subtotal"], [col.tax, "tax"], [col.tip, "tip"]] as const) {
    tx.set(totalRow, c, { f: `SUBTOTAL(109,${cellRef(first, c)}:${cellRef(lastRow, c)})`, cached: sum(key), s: totalNum });
  }
  const income = rows.filter((t) => t.isIncome).reduce((a, t) => a + t.amount, 0);
  const expenses = rows.filter((t) => !t.isIncome).reduce((a, t) => a + t.amount, 0);
  const sumifs = (type: string) => `SUMIFS(${cellRef(first, col.amount, true)}:${cellRef(lastRow, col.amount, true)},${cellRef(first, col.type, true)}:${cellRef(lastRow, col.type, true)},"${type}")`;
  const plain: CellStyle = { bold: true, color: C.ink, align: { v: "center" } };
  tx.set(totalRow + 1, 0, "Income (all rows)", plain);
  tx.set(totalRow + 1, 5, { f: sumifs("Income"), cached: income, s: { ...plain, numFmt: money, color: C.income, align: { h: "right", v: "center" } } });
  tx.set(totalRow + 2, 0, "Expenses (all rows)", plain);
  tx.set(totalRow + 2, 5, { f: sumifs("Expense"), cached: expenses, s: { ...plain, numFmt: money, color: C.expense, align: { h: "right", v: "center" } } });
  tx.set(totalRow + 3, 0, "Net (income minus expenses)", plain);
  tx.set(totalRow + 3, 5, { f: `${cellRef(totalRow + 1, 5)}-${cellRef(totalRow + 2, 5)}`, cached: income - expenses, s: { ...plain, numFmt: money, align: { h: "right", v: "center" } } });
  tx.set(totalRow + 5, 0, "Tip: filter the Type column to total only income or only expenses with the first total row.", { italic: true, color: C.muted });

  const txTotals = [sum("amount"), sum("subtotal"), sum("tax"), sum("tip"), income, expenses, income - expenses];
  const widths = [
    14, 10, fitText(26, rows.map((t) => t.merchant), 40), fitText(20, rows.map((t) => t.category), 32), 34,
    fitMoney(16, [...rows.map((t) => t.amount), ...txTotals]), 10, fitText(18, rows.map((t) => t.paymentMethod), 28), fitText(18, rows.map((t) => t.account), 28), 11,
    fitMoney(14, [...rows.map((t) => t.subtotal), ...txTotals]), fitMoney(13, [...rows.map((t) => t.tax), ...txTotals]), fitMoney(13, rows.map((t) => t.tip)),
    20, 14, 13, 28, 16, 16, 60,
  ];
  widths.forEach((w, c) => tx.width(c, w));
  tx.height(totalRow, 22);

  // ================= Evidence links (one row per transaction, with the stored file) =================
  const docNameByKey = new Map(docs.map((d) => [d.r2Key, d.fileName]));
  const EV = ["No.", "Date", "Type", "Merchant / payee", "Category", "Amount", "Currency", "Document type", "File name", "Download", "Link (select the cell and copy it, then paste it in your browser)"];
  const lastEvCol = EV.length - 1;
  const withFile = rows.filter((t) => t.docLink).length;
  banner(evSheet, lastEvCol, `${business}: Evidence links`, `${rows.length} transaction${rows.length === 1 ? "" : "s"}  |  ${withFile} with a stored document  |  Click Download, or copy the full link in the last column.`);
  EV.forEach((h, c) => evSheet.set(3, c, h, headerStyle(c === 5 ? "right" : "left")));
  evSheet.height(3, 42);
  rows.forEach((t, i) => {
    const r = 4 + i;
    const text: CellStyle = { ...base, border: bottomHair };
    evSheet.set(r, 0, i + 1, { ...text, numFmt: "0", align: { h: "left", v: "center" } });
    evSheet.set(r, 1, t.date ? { date: t.date } : "", { ...text, numFmt: dateFmt, align: { h: "left", v: "center" } });
    evSheet.set(r, 2, t.type, { ...text, bold: true, color: t.isIncome ? C.income : C.expense });
    evSheet.set(r, 3, t.merchant, text);
    evSheet.set(r, 4, t.category, text);
    evSheet.set(r, 5, t.amount, { ...text, numFmt: money, bold: true, align: { h: "right", v: "center" } });
    evSheet.set(r, 6, t.currency, { ...text, align: { h: "center", v: "center" } });
    evSheet.set(r, 7, t.docType || "", text);
    evSheet.set(r, 8, (t.fileKey && docNameByKey.get(t.fileKey)) || (t.docLink ? "Stored file" : ""), text);
    if (t.docLink) {
      evSheet.set(r, 9, { v: "Download", link: t.docLink, linkTip: "Opens the stored receipt or file" }, { ...text, color: C.link, underline: true });
      evSheet.set(r, 10, t.docLink, { ...text, color: C.muted });
    } else {
      evSheet.set(r, 9, "No document", { ...text, italic: true, color: C.muted });
      evSheet.set(r, 10, null, text);
    }
  });
  if (!rows.length) noteRow(evSheet, 4, lastEvCol, "No transactions in this export.");
  else {
    const lastEv = 3 + rows.length;
    evSheet.zebra(4, 0, lastEv, lastEvCol, C.zebra);
    evSheet.setAutoFilter(3, 0, lastEv, lastEvCol);
  }
  [7, 14, 10, fitText(26, rows.map((t) => t.merchant), 40), fitText(20, rows.map((t) => t.category), 32), fitMoney(16, rows.map((t) => t.amount)), 10, 16, fitText(26, rows.map((t) => (t.fileKey && docNameByKey.get(t.fileKey)) || ""), 44), 14, 70].forEach((w, c) => evSheet.width(c, w));
  evSheet.freeze = { rows: 4, cols: 0 };
  evSheet.print.repeatRows = [3, 3];

  // ================= Documents + Line items =================
  const described = docs.map((d) => describeDocument(d, opts));
  const docRows = described.map((d) => d.row);
  const items: LineItem[] = described.flatMap((d) => d.items);
  // Receipts scanned straight from the camera carry their own line items; keep them unless an uploaded document already did.
  const keysWithItems = new Set(described.filter((d) => d.items.length).map((d) => d.row.doc.r2Key));
  const txById = new Map(transactions.map((x) => [x.id, x]));
  rows.forEach((t) => {
    if (t.fileKey && keysWithItems.has(t.fileKey)) return;
    const data = asRecord(txById.get(t.id)?.receipt_data);
    const raw = data.items;
    if (!Array.isArray(raw)) return;
    for (const it of raw) {
      const o = asRecord(it);
      const name = toText(pick(o, "name", "description", "item"));
      if (!name) continue;
      const qty = toNumber(pick(o, "quantity", "qty"));
      const unit = toNumber(pick(o, "unit_price", "unitPrice"));
      const amount = toNumber(pick(o, "total", "price", "amount")) ?? (qty !== undefined && unit !== undefined ? qty * unit : unit);
      items.push({ docName: t.merchant ? `${t.merchant} (${fmtD(t.date)})` : `Receipt ${fmtD(t.date)}`, link: t.docLink, vendor: t.merchant, date: t.date, item: name, qty, unit, amount });
    }
  });

  const DOC = ["Document", "Type", "Provider / vendor", "Account / reference", "Start / issue date", "End date", "Due date", "Opening / previous balance", "Credits / payments in", "Debits / charges out", "Subtotal", "Tax", "Tip", "Total / closing balance", "Currency", "Transactions", "Details", "Uploaded", "Size"];
  const lastDocCol = DOC.length - 1;
  banner(docSheet, lastDocCol, `${business}: Documents`, `${docRows.length} uploaded document${docRows.length === 1 ? "" : "s"}  |  Click a file name to open the original.`);
  DOC.forEach((h, c) => docSheet.set(3, c, h, headerStyle(c >= 7 && c <= 13 ? "right" : "left")));
  docSheet.height(3, 42);
  if (!docRows.length) {
    noteRow(docSheet, 4, lastDocCol, "No uploaded documents. Bank statements, card statements, invoices and receipts you upload will be listed here.");
  }
  docRows.forEach((d, i) => {
    const r = 4 + i;
    const text: CellStyle = { ...base, border: bottomHair, align: { v: "center", wrap: true } };
    const num: CellStyle = { ...text, numFmt: money, align: { h: "right", v: "center" } };
    const dt: CellStyle = { ...text, numFmt: dateFmt, align: { h: "left", v: "center" } };
    if (d.link) docSheet.set(r, 0, { v: d.doc.fileName, link: d.link, linkTip: "Open the original file" }, { ...text, color: C.link, underline: true });
    else docSheet.set(r, 0, d.doc.fileName, text);
    docSheet.set(r, 1, d.type, text);
    docSheet.set(r, 2, d.provider, text);
    docSheet.set(r, 3, d.account, text);
    docSheet.set(r, 4, d.start ? { date: d.start } : null, dt);
    docSheet.set(r, 5, d.end ? { date: d.end } : null, dt);
    docSheet.set(r, 6, d.due ? { date: d.due } : null, dt);
    docSheet.set(r, 7, d.opening ?? null, num);
    docSheet.set(r, 8, d.credits ?? null, num);
    docSheet.set(r, 9, d.debits ?? null, num);
    docSheet.set(r, 10, d.subtotal ?? null, num);
    docSheet.set(r, 11, d.tax ?? null, num);
    docSheet.set(r, 12, d.tip ?? null, num);
    docSheet.set(r, 13, d.total ?? null, { ...num, bold: true });
    docSheet.set(r, 14, d.currency, { ...text, align: { h: "center", v: "center" } });
    docSheet.set(r, 15, d.txCount ?? null, { ...text, numFmt: "#,##0", align: { h: "right", v: "center" } });
    docSheet.set(r, 16, d.details, text);
    docSheet.set(r, 17, d.uploaded ? { date: d.uploaded } : null, dt);
    docSheet.set(r, 18, d.size, text);
  });
  if (docRows.length) {
    docSheet.zebra(4, 0, 3 + docRows.length, lastDocCol, C.zebra);
    docSheet.setAutoFilter(3, 0, 3 + docRows.length, lastDocCol);
  }
  [
    fitText(30, docRows.map((d) => d.doc.fileName), 46), 15, fitText(22, docRows.map((d) => d.provider), 34), fitText(24, docRows.map((d) => d.account), 34), 15, 15, 15,
    fitMoney(18, docRows.map((d) => d.opening)), fitMoney(18, docRows.map((d) => d.credits)), fitMoney(18, docRows.map((d) => d.debits)),
    fitMoney(14, docRows.map((d) => d.subtotal)), fitMoney(13, docRows.map((d) => d.tax)), fitMoney(12, docRows.map((d) => d.tip)), fitMoney(20, docRows.map((d) => d.total)),
    11, 14, 60, 14, 12,
  ].forEach((w, c) => docSheet.width(c, w));
  docSheet.freeze = { rows: 4, cols: 1 };
  docSheet.print.repeatRows = [3, 3];

  const IT = ["Document", "Vendor / merchant", "Date", "Item", "Qty", "Unit price", "Amount"];
  banner(itemSheet, IT.length - 1, `${business}: Line items`, `${items.length} line${items.length === 1 ? "" : "s"} from invoices and receipts`);
  IT.forEach((h, c) => itemSheet.set(3, c, h, headerStyle(c >= 4 ? "right" : "left")));
  itemSheet.height(3, 28);
  if (!items.length) noteRow(itemSheet, 4, IT.length - 1, "No line items. Itemised invoices and receipts will be listed here.");
  items.forEach((it, i) => {
    const r = 4 + i;
    const text: CellStyle = { ...base, border: bottomHair };
    if (it.link) itemSheet.set(r, 0, { v: it.docName, link: it.link }, { ...text, color: C.link, underline: true });
    else itemSheet.set(r, 0, it.docName, text);
    itemSheet.set(r, 1, it.vendor, text);
    itemSheet.set(r, 2, it.date ? { date: it.date } : null, { ...text, numFmt: dateFmt, align: { h: "left", v: "center" } });
    itemSheet.set(r, 3, it.item, { ...text, align: { v: "center", wrap: true } });
    itemSheet.set(r, 4, it.qty ?? null, { ...text, numFmt: "#,##0.##", align: { h: "right", v: "center" } });
    itemSheet.set(r, 5, it.unit ?? null, { ...text, numFmt: money, align: { h: "right", v: "center" } });
    itemSheet.set(r, 6, it.amount ?? null, { ...text, numFmt: money, bold: true, align: { h: "right", v: "center" } });
  });
  if (items.length) {
    const lastItem = 3 + items.length;
    itemSheet.zebra(4, 0, lastItem, IT.length - 1, C.zebra);
    itemSheet.setAutoFilter(3, 0, lastItem, IT.length - 1);
    const ts: CellStyle = { ...totalStyle, numFmt: money, align: { h: "right", v: "center" } };
    itemSheet.set(lastItem + 1, 0, "Total (visible rows)", totalStyle);
    itemSheet.paint(lastItem + 1, 0, lastItem + 1, IT.length - 1, totalStyle);
    itemSheet.set(lastItem + 1, 6, { f: `SUBTOTAL(109,G5:G${lastItem + 1})`, cached: items.reduce((a, it) => a + (it.amount ?? 0), 0), s: ts });
  }
  [fitText(34, items.map((i) => i.docName), 46), fitText(24, items.map((i) => i.vendor), 34), 15, 40, 10, fitMoney(16, items.map((i) => i.unit)), fitMoney(16, items.map((i) => i.amount))].forEach((w, c) => itemSheet.width(c, w));
  itemSheet.freeze = { rows: 4, cols: 0 };
  itemSheet.print.repeatRows = [3, 3];

  // ================= Invoices & Payments (optional) =================
  if (invSheet && opts.invoices) {
    const IN = ["Invoice #", "Customer", "Issue date", "Due date", "Total", "Paid", "Balance", "Status"];
    banner(invSheet, IN.length - 1, `${business}: Invoices & Payments`, `${opts.invoices.length} invoice${opts.invoices.length === 1 ? "" : "s"}`);
    IN.forEach((h, c) => invSheet.set(3, c, h, headerStyle(c >= 4 && c <= 6 ? "right" : "left")));
    invSheet.height(3, 28);
    opts.invoices.forEach((inv, i) => {
      const r = 4 + i;
      const text: CellStyle = { ...base, border: bottomHair };
      const num: CellStyle = { ...text, numFmt: money, align: { h: "right", v: "center" } };
      invSheet.set(r, 0, inv.number, { ...text, bold: true });
      invSheet.set(r, 1, inv.customer, text);
      invSheet.set(r, 2, inv.issueDate ? { date: inv.issueDate } : null, { ...text, numFmt: dateFmt, align: { h: "left", v: "center" } });
      invSheet.set(r, 3, inv.dueDate ? { date: inv.dueDate } : null, { ...text, numFmt: dateFmt, align: { h: "left", v: "center" } });
      invSheet.set(r, 4, inv.total, num);
      invSheet.set(r, 5, inv.paid, num);
      invSheet.set(r, 6, { f: `${cellRef(r, 4)}-${cellRef(r, 5)}`, cached: inv.total - inv.paid, s: { ...num, bold: true } });
      invSheet.set(r, 7, inv.status ?? "", text);
    });
    const lastInv = 3 + opts.invoices.length;
    invSheet.zebra(4, 0, lastInv, IN.length - 1, C.zebra);
    invSheet.setAutoFilter(3, 0, lastInv, IN.length - 1);
    invSheet.set(lastInv + 1, 0, "Total (visible rows)", totalStyle);
    invSheet.paint(lastInv + 1, 0, lastInv + 1, IN.length - 1, totalStyle);
    for (const c of [4, 5, 6]) {
      const L = colLetter(c);
      const key = c === 4 ? (inv: { total: number; paid: number }) => inv.total : c === 5 ? (inv: { total: number; paid: number }) => inv.paid : (inv: { total: number; paid: number }) => inv.total - inv.paid;
      invSheet.set(lastInv + 1, c, { f: `SUBTOTAL(109,${L}5:${L}${lastInv + 1})`, cached: opts.invoices.reduce((a, inv) => a + key(inv), 0), s: { ...totalStyle, numFmt: money, align: { h: "right", v: "center" } } });
    }
    const invAll = opts.invoices.flatMap((inv) => [inv.total, inv.paid, inv.total - inv.paid]);
    [14, fitText(28, opts.invoices.map((inv) => inv.customer), 40), 15, 15, fitMoney(16, invAll), fitMoney(16, invAll), fitMoney(16, invAll), 14].forEach((w, c) => invSheet.width(c, w));
    invSheet.freeze = { rows: 4, cols: 0 };
    invSheet.print.repeatRows = [3, 3];
  }

  // ================= Summary =================
  summary.showGridLines = false;
  const lastSumCol = 8;
  banner(summary, lastSumCol, business, reportTitle);
  const label: CellStyle = { color: C.muted, bold: true, align: { v: "center", indent: 1 } };
  const value: CellStyle = { color: C.ink, align: { v: "center" } };
  const info: [string, string][] = [["Period", periodText], ["Currency", currency], ["Generated", fmtD(generatedOn)]];
  info.forEach(([k, v], i) => {
    summary.set(3 + i, 0, k, label);
    summary.set(3 + i, 1, v, value);
    summary.merge(3 + i, 1, 3 + i, 3);
  });

  const amt = range(col.amount);
  const typ = range(col.type);
  const dat = range(col.date);
  const cat = range(3);
  const kpiRow = 7;
  sectionTitle(summary, kpiRow, 0, 3, "Totals");
  const kpiNum = (bold = false, color: string = C.ink): CellStyle => ({ numFmt: money, bold, color, size: bold ? 12 : 11, align: { h: "right", v: "center" }, border: bottomHair });
  const kpiLabel: CellStyle = { ...label, border: bottomHair };
  const kpis: [string, string, number, CellStyle][] = [
    ["Total income", `SUMIFS(${amt},${typ},"Income")`, income, kpiNum(true, C.income)],
    ["Total expenses", `SUMIFS(${amt},${typ},"Expense")`, expenses, kpiNum(true, C.expense)],
    ["Net (income minus expenses)", `B${kpiRow + 2}-B${kpiRow + 3}`, income - expenses, { ...kpiNum(true, C.tealDark), fill: C.tealSoft }],
    ["Transactions", `COUNTA(${typ})`, rows.length, { ...kpiNum(), numFmt: "#,##0" }],
    ["Uploaded documents", docRows.length ? `COUNTA(${sheetRef("Documents")}!$A$5:$A$${4 + docRows.length})` : "", docRows.length, { ...kpiNum(), numFmt: "#,##0" }],
  ];
  kpis.forEach(([k, f, cached, st], i) => {
    const r = kpiRow + 1 + i;
    summary.set(r, 0, k, kpiLabel);
    if (f) summary.set(r, 1, { f, cached, s: st });
    else summary.set(r, 1, cached, st);
    summary.height(r, 22);
  });

  // category tables
  const byCat = (isIncome: boolean) => {
    const m = new Map<string, { amount: number; n: number }>();
    for (const t of rows) {
      if (t.isIncome !== isIncome) continue;
      const e = m.get(t.category) ?? { amount: 0, n: 0 };
      e.amount += t.amount;
      e.n += 1;
      m.set(t.category, e);
    }
    return [...m].sort((a, b) => b[1].amount - a[1].amount || a[0].localeCompare(b[0]));
  };
  const categoryTable = (r0: number, c0: number, title: string, type: "Income" | "Expense", color: string) => {
    sectionTitle(summary, r0, c0, c0 + 3, title);
    ["Category", "Amount", "% of total", "Count"].forEach((h, i) => summary.set(r0 + 1, c0 + i, h, headerStyle(i === 0 ? "left" : "right")));
    const list = byCat(type === "Income");
    const total = list.reduce((a, [, v]) => a + v.amount, 0);
    const n = list.reduce((a, [, v]) => a + v.n, 0);
    const firstR = r0 + 2;
    const lastR = firstR + Math.max(list.length, 1) - 1;
    const totR = lastR + 1;
    const A = colLetter(c0);
    const B = colLetter(c0 + 1);
    const D = colLetter(c0 + 3);
    if (!list.length) summary.set(firstR, c0, `No ${type.toLowerCase()} yet`, { ...base, italic: true, color: C.muted });
    list.forEach(([name, v], i) => {
      const r = firstR + i;
      const st: CellStyle = { ...base, border: bottomHair };
      summary.set(r, c0, name, st);
      summary.set(r, c0 + 1, { f: `SUMIFS(${amt},${typ},"${type}",${cat},${A}${r + 1})`, cached: v.amount, s: { ...st, numFmt: money, align: { h: "right", v: "center" } } });
      summary.set(r, c0 + 2, { f: `IF($${B}$${totR + 1}=0,0,${B}${r + 1}/$${B}$${totR + 1})`, cached: total ? v.amount / total : 0, s: { ...st, numFmt: "0.0%", align: { h: "right", v: "center" } } });
      summary.set(r, c0 + 3, { f: `COUNTIFS(${typ},"${type}",${cat},${A}${r + 1})`, cached: v.n, s: { ...st, numFmt: "#,##0", align: { h: "right", v: "center" } } });
    });
    if (list.length) summary.zebra(firstR, c0, lastR, c0 + 3, C.zebra);
    const ts: CellStyle = { ...totalStyle, color };
    summary.set(totR, c0, `Total ${type.toLowerCase()}`, ts);
    summary.set(totR, c0 + 1, { f: `SUM(${B}${firstR + 1}:${B}${lastR + 1})`, cached: total, s: { ...ts, numFmt: money, align: { h: "right", v: "center" } } });
    summary.set(totR, c0 + 2, { f: `SUM(${colLetter(c0 + 2)}${firstR + 1}:${colLetter(c0 + 2)}${lastR + 1})`, cached: total ? 1 : 0, s: { ...ts, numFmt: "0.0%", align: { h: "right", v: "center" } } });
    summary.set(totR, c0 + 3, { f: `SUM(${D}${firstR + 1}:${D}${lastR + 1})`, cached: n, s: { ...ts, numFmt: "#,##0", align: { h: "right", v: "center" } } });
    return totR;
  };
  const expEnd = categoryTable(kpiRow + 7, 0, "Expenses by category", "Expense", C.expense);
  const incEnd = categoryTable(kpiRow, 5, "Income by category", "Income", C.income);

  // by month
  const monthStart = Math.max(expEnd, incEnd) + 2;
  sectionTitle(summary, monthStart, 0, 3, "By month");
  ["Month", "Income", "Expenses", "Net"].forEach((h, i) => summary.set(monthStart + 1, i, h, headerStyle(i === 0 ? "left" : "right")));
  const months = new Map<string, { inc: number; exp: number }>();
  for (const t of rows) {
    const ym = t.date.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(ym)) continue;
    const e = months.get(ym) ?? { inc: 0, exp: 0 };
    if (t.isIncome) e.inc += t.amount;
    else e.exp += t.amount;
    months.set(ym, e);
  }
  const monthList = [...months].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const mFirst = monthStart + 2;
  monthList.forEach(([ym, v], i) => {
    const r = mFirst + i;
    const st: CellStyle = { ...base, border: bottomHair };
    const num: CellStyle = { ...st, numFmt: money, align: { h: "right", v: "center" } };
    summary.set(r, 0, { v: ymdToSerial(`${ym}-01`), s: { ...st, numFmt: "mmm yyyy", align: { h: "left", v: "center" } } });
    summary.set(r, 1, { f: `SUMIFS(${amt},${typ},"Income",${dat},">="&$A${r + 1},${dat},"<"&EDATE($A${r + 1},1))`, cached: v.inc, s: num });
    summary.set(r, 2, { f: `SUMIFS(${amt},${typ},"Expense",${dat},">="&$A${r + 1},${dat},"<"&EDATE($A${r + 1},1))`, cached: v.exp, s: num });
    summary.set(r, 3, { f: `B${r + 1}-C${r + 1}`, cached: v.inc - v.exp, s: { ...num, bold: true } });
  });
  const mEnd = mFirst + Math.max(monthList.length, 1) - 1;
  if (!monthList.length) summary.set(mFirst, 0, "No dated transactions yet", { ...base, italic: true, color: C.muted });
  else summary.zebra(mFirst, 0, mEnd, 3, C.zebra);
  const mTot = mEnd + 1;
  summary.set(mTot, 0, "Total", totalStyle);
  for (const [c, k] of [[1, "inc"], [2, "exp"]] as const) {
    summary.set(mTot, c, { f: `SUM(${colLetter(c)}${mFirst + 1}:${colLetter(c)}${mEnd + 1})`, cached: monthList.reduce((a, [, v]) => a + v[k], 0), s: { ...totalStyle, numFmt: money, align: { h: "right", v: "center" } } });
  }
  summary.set(mTot, 3, { f: `B${mTot + 1}-C${mTot + 1}`, cached: income - expenses, s: { ...totalStyle, numFmt: money, align: { h: "right", v: "center" } } });

  const noteStart = mTot + 3;
  summary.set(noteStart, 0, { v: "Prepared with Receipt Cycle", link: "https://receiptcycle.com", linkTip: "receiptcycle.com" }, { italic: true, color: C.link, underline: true });
  summary.set(noteStart + 1, 0, "Totals on this sheet are live formulas that read the Transactions sheet. Amounts are in " + currency + ".", { italic: true, color: C.muted });
  const expCats = byCat(false);
  const incCats = byCat(true);
  const monthNums = monthList.flatMap(([, v]) => [v.inc, v.exp, v.inc - v.exp]);
  const leftNums = [income, expenses, income - expenses, ...expCats.map(([, v]) => v.amount), ...monthNums];
  const rightNums = [...incCats.map(([, v]) => v.amount), income];
  [
    fitText(32, ["Net (income minus expenses)", ...expCats.map(([n]) => n), "Uploaded documents"], 44),
    fitMoney(20, leftNums),
    fitMoney(20, leftNums),
    fitMoney(20, leftNums),
    3,
    fitText(30, incCats.map(([n]) => n), 44),
    fitMoney(20, rightNums),
    16,
    14,
  ].forEach((w, c) => summary.width(c, w));
  summary.print.landscape = false;
  summary.zoom = 100;

  return { bytes: wb.build(), sheetNames: wb.sheets.map((s) => s.name) };
}
