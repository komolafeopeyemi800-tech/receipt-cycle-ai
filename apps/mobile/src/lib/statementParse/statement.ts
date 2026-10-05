/**
 * Statement tables to transactions, without AI: find the header row, work out which column is
 * which from the headers (and, failing that, from the values), then convert every row in code.
 * An AI call is only ever needed when this module reports `mapping: null`.
 */
import { type DateOrder, detectDateOrder, parseAmount, parseDate, round2 } from "./normalize";

export type Grid = string[][];

export type ColumnMapping = {
  /** Index of the header row, or -1 when the sheet has none. */
  headerRow: number;
  date: number;
  description?: number;
  /** One signed column, or separate debit/credit columns. */
  amount?: number;
  debit?: number;
  credit?: number;
  type?: number;
  category?: number;
  balance?: number;
};

export type ParsedRow = {
  date: string;
  amount: number;
  type: "expense" | "income";
  category: string;
  merchant?: string;
  description?: string;
  payment_method?: string;
};

export type RowsResult = {
  rows: ParsedRow[];
  skipped: number;
  warnings: string[];
};

const HEADER_WORDS: Record<keyof Omit<ColumnMapping, "headerRow">, RegExp> = {
  date: /^(?:(?:transaction|trans\.?|txn|posting|posted|booking|value|entry)\s*)?date(?:\s*(?:&|and)?\s*time)?$|^posted$|^when$/i,
  description: /^(?:description|details?|narration|narrative|particulars?|memo|merchant|payee|beneficiary|transaction(?:\s+(?:details?|description))?|remarks?|reference|name|item|note)s?$/i,
  amount: /^(?:amount|amt|value|sum|total|transaction\s+amount)(?:\s*\(.*\))?$/i,
  debit: /^(?:debit|debits|withdrawal|withdrawals|money\s+out|paid\s+out|dr|spent|expense|out)(?:\s*(?:amount|amt))?(?:\s*\(.*\))?$/i,
  credit: /^(?:credit|credits|deposit|deposits|money\s+in|paid\s+in|cr|received|income|in)(?:\s*(?:amount|amt))?(?:\s*\(.*\))?$/i,
  type: /^(?:type|transaction\s+type|dr\s*\/\s*cr|cr\s*\/\s*dr|debit\s*\/\s*credit|direction)$/i,
  category: /^(?:category|categories|class)$/i,
  balance: /^(?:running\s+)?(?:balance|bal)(?:\s*\(.*\))?$/i,
};

const clean = (s: unknown) => String(s ?? "").replace(/\s+/g, " ").trim();

function headerHits(row: string[]): number {
  return row.reduce((n, c) => n + (Object.values(HEADER_WORDS).some((re) => re.test(clean(c))) ? 1 : 0), 0);
}

/** Header = the first of the top rows that names at least two known columns. */
export function findHeaderRow(grid: Grid): number {
  for (let i = 0; i < Math.min(grid.length, 20); i++) {
    if (headerHits(grid[i]!) >= 2) return i;
  }
  return -1;
}

function column(values: string[]): { dates: number; amounts: number; text: number; filled: number } {
  let dates = 0;
  let amounts = 0;
  let text = 0;
  let filled = 0;
  for (const v of values) {
    const s = clean(v);
    if (!s) continue;
    filled++;
    // A bare number such as 50000 is an amount here; Excel serial dates are only trusted in a column the
    // header names "Date" (guessing columns by value would otherwise turn big amounts into dates).
    if (!/^\d+(\.\d+)?$/.test(s) && parseDate(s)) dates++;
    else if (parseAmount(s) !== null) amounts++;
    else text++;
  }
  return { dates, amounts, text, filled };
}

/** Guess the mapping from headers; fall back to value shapes when there is no header. */
export function mapColumns(grid: Grid): ColumnMapping | null {
  if (grid.length < 2) return null;
  let headerRow = findHeaderRow(grid);
  if (headerRow < 0) {
    // Header names we do not recognise ("Col A", "Tarikh"): a first row with no date or number in it is
    // still a header, so keep it out of the value-shape checks below.
    const first = grid.findIndex((r) => r.some((c) => clean(c)));
    if (first >= 0 && grid[first]!.every((c) => !clean(c) || (!parseDate(c) && parseAmount(c) === null))) headerRow = first;
  }
  const width = Math.max(...grid.map((r) => r.length));
  const body = grid.slice(headerRow + 1).filter((r) => r.some((c) => clean(c)));
  if (body.length === 0) return null;

  const found: Partial<Record<keyof Omit<ColumnMapping, "headerRow">, number>> = {};
  if (headerRow >= 0) {
    const header = grid[headerRow]!.map(clean);
    (Object.keys(HEADER_WORDS) as (keyof typeof HEADER_WORDS)[]).forEach((role) => {
      const idx = header.findIndex((h, i) => HEADER_WORDS[role].test(h) && !Object.values(found).includes(i));
      if (idx >= 0) found[role] = idx;
    });
  }

  const cols = Array.from({ length: width }, (_, c) => column(body.map((r) => r[c] ?? "")));
  const taken = () => new Set(Object.values(found));

  // Value-based fallbacks for roles the headers did not settle.
  if (found.date === undefined) {
    const best = cols
      .map((c, i) => ({ i, share: c.filled ? c.dates / c.filled : 0 }))
      .filter((c) => c.share >= 0.7 && !taken().has(c.i))
      .sort((a, b) => b.share - a.share)[0];
    if (best) found.date = best.i;
  }
  if (found.amount === undefined && found.debit === undefined && found.credit === undefined) {
    const candidates = cols
      .map((c, i) => ({ i, share: c.filled ? c.amounts / c.filled : 0 }))
      .filter((c) => c.share >= 0.7 && !taken().has(c.i));
    // With a header the last numeric column is usually the balance, so prefer the first.
    if (candidates[0]) found.amount = candidates[0].i;
  }
  if (found.description === undefined) {
    const best = cols
      .map((c, i) => ({ i, text: c.text }))
      .filter((c) => c.text > 0 && !taken().has(c.i))
      .sort((a, b) => b.text - a.text)[0];
    if (best) found.description = best.i;
  }

  const hasMoney = found.amount !== undefined || found.debit !== undefined || found.credit !== undefined;
  if (found.date === undefined || !hasMoney) return null;
  return { headerRow, ...found, date: found.date };
}

const EXPENSE_WORDS = /^(?:debit|dr|expense|withdrawal|out|payment|purchase|sent|spent|paid|d)$/i;
const INCOME_WORDS = /^(?:credit|cr|income|deposit|in|received|refund|c)$/i;

/** Convert the body of a table using a mapping. Rows without a usable date and amount are skipped. */
export function rowsFromGrid(grid: Grid, m: ColumnMapping, defaultCategory = "Other"): RowsResult {
  const body = grid.slice(m.headerRow + 1);
  const warnings: string[] = [];
  const order: DateOrder = detectDateOrder(body.map((r) => clean(r[m.date]))) ?? "dmy";
  if (detectDateOrder(body.map((r) => clean(r[m.date]))) === null && body.some((r) => /^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/.test(clean(r[m.date])))) {
    warnings.push("Dates like 03/04/2026 could be day/month or month/day; read as day/month/year.");
  }

  const singleColumn = m.amount !== undefined && m.debit === undefined && m.credit === undefined;
  const signed = singleColumn ? body.map((r) => parseAmount(r[m.amount!])).filter((n): n is number => n !== null) : [];
  // Expense exports list spending as positive numbers; only treat as income-vs-expense when negatives exist.
  const allPositive = singleColumn && signed.length > 0 && signed.every((n) => n >= 0) && m.type === undefined;
  if (allPositive) warnings.push("Every amount is positive, so all rows were treated as expenses.");

  const rows: ParsedRow[] = [];
  let skipped = 0;
  for (const r of body) {
    if (!r.some((c) => clean(c))) continue;
    const date = parseDate(r[m.date], order);
    let amount: number | null = null;
    let type: "expense" | "income" = "expense";

    if (m.debit !== undefined || m.credit !== undefined) {
      const debit = m.debit !== undefined ? parseAmount(r[m.debit]) : null;
      const credit = m.credit !== undefined ? parseAmount(r[m.credit]) : null;
      if (debit !== null && debit !== 0) {
        amount = Math.abs(debit);
        type = "expense";
      } else if (credit !== null && credit !== 0) {
        amount = Math.abs(credit);
        type = "income";
      }
    } else if (m.amount !== undefined) {
      const v = parseAmount(r[m.amount]);
      if (v !== null && v !== 0) {
        amount = Math.abs(v);
        if (m.type !== undefined) {
          const t = clean(r[m.type]);
          type = INCOME_WORDS.test(t) ? "income" : EXPENSE_WORDS.test(t) ? "expense" : v < 0 ? "expense" : "income";
        } else {
          type = allPositive ? "expense" : v < 0 ? "expense" : "income";
        }
      }
    }

    if (!date || amount === null) {
      skipped++;
      continue;
    }
    const description = m.description !== undefined ? clean(r[m.description]) : "";
    const category = m.category !== undefined ? clean(r[m.category]) : "";
    rows.push({
      date,
      amount: round2(amount),
      type,
      category: category || defaultCategory,
      ...(description ? { merchant: description.slice(0, 120) } : {}),
    });
  }
  if (skipped > 0) warnings.push(`${skipped} row${skipped === 1 ? "" : "s"} without a date or amount were left out (totals, notes or blanks).`);
  return { rows, skipped, warnings };
}
