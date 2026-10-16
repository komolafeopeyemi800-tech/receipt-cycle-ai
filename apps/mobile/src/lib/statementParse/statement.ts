/**
 * Statement tables to transactions, without AI: find the header row, work out which column is
 * which from the headers (and, failing that, from the values), then convert every row in code.
 * An AI call is only ever needed when this module reports `mapping: null`.
 */
import { type DateOrder, dateWithPeriodYear, detectDateOrder, parseAmount, parseDate, parseYearlessMonthDay, round2 } from "./normalize";

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
  /** Same date, amount, direction and text as an earlier row in this file: left unticked in the preview. */
  duplicate?: true;
  /** Moves money between the person's own accounts (transfer, card payment): not real income or spending. */
  transfer?: true;
  /** Dated well in the future (or an implausible year): left unticked until the person confirms the date. */
  future?: true;
};

/** Where in time a statement sits: yearless "03/05" dates take their year from here. */
export type StatementPeriod = { startYear: number; startMonth: number; endYear: number };

export type RowsResult = {
  rows: ParsedRow[];
  skipped: number;
  warnings: string[];
  /** Rows whose amount could be checked against the running balance, and how many agreed. */
  balanceCheck?: { checked: number; agreed: number };
};

const HEADER_WORDS: Record<keyof Omit<ColumnMapping, "headerRow">, RegExp> = {
  date: /^(?:(?:transaction|trans\.?|txn|posting|posted|post|booking|value|entry|pay|payment|purchase|expense)\s*)?date(?:\s*(?:&|and)?\s*time)?$|^posted$|^when$/i,
  description: /^(?:description|details?|narration|narrative|particulars?|memo|merchant|payee|beneficiary|transaction(?:\s+(?:details?|description))?|remarks?|reference|name|item|note|vendor|supplier|paid\s+to|activity(?:\s+description)?|store|business|company)s?(?:\s*(?:\/|&|and)\s*(?:details?|description|name|memo))?(?:\s+name)?$/i,
  amount: /^(?:amount|amt|value|sum|total|transaction\s+amount)(?:\s*\(.*\))?$/i,
  debit: /^(?:debit|debits|withdrawal|withdrawals|money\s+out|paid\s+out|dr|spent|expense|out)(?:\s*(?:amount|amt))?(?:\s*\(.*\))?$/i,
  credit: /^(?:credit|credits|deposit|deposits|money\s+in|paid\s+in|cr|received|income|in)(?:\s*(?:amount|amt))?(?:\s*\(.*\))?$/i,
  type: /^(?:type|transaction\s+type|dr\s*\/\s*cr|cr\s*\/\s*dr|debit\s*\/\s*credit|direction)$/i,
  category: /^(?:cat\.?|category|categories|class)$/i,
  balance: /^(?:running\s+)?(?:balance|bal)(?:\s*\(.*\))?$/i,
};

const STRONG_DESCRIPTION = /^(?:merchant|payee|vendor|supplier|paid\s+to|beneficiary|description|narration)s?(?:\s*(?:\/|&|and)\s*\w+)?(?:\s+name)?$/i;

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

  // A column that names who was paid beats a vague one (memo, note, reference) that happens to sit to its left.
  if (headerRow >= 0 && found.description !== undefined) {
    const header = grid[headerRow]!.map(clean);
    const strong = header.findIndex((h, i) => STRONG_DESCRIPTION.test(h) && !Object.entries(found).some(([k, v]) => k !== "description" && v === i));
    if (strong >= 0) found.description = strong;
  }

  const cols = Array.from({ length: width }, (_, c) => column(body.map((r) => r[c] ?? "")));
  const taken = () => new Set(Object.values(found));

  // An unnamed numeric column beside a named money column: PDF tables often lose a header such as "WITHDRAWALS".
  if (headerRow >= 0) {
    const header = grid[headerRow]!.map(clean);
    header.forEach((h, i) => {
      const c = cols[i];
      if (h || !c || c.filled === 0 || c.amounts / c.filled < 0.8 || taken().has(i)) return;
      const rightmostMoney = Math.max(found.amount ?? -1, found.debit ?? -1, found.credit ?? -1);
      if (found.credit !== undefined && found.debit === undefined && found.amount === undefined && i < found.credit) found.debit = i;
      else if (found.debit !== undefined && found.credit === undefined && found.amount === undefined && i > found.debit) found.credit = i;
      else if (found.balance === undefined && rightmostMoney >= 0 && i > rightmostMoney) found.balance = i;
    });
  }

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

const EXPENSE_WORDS = /^(?:debit|dr|expense|withdrawal|out|purchase|sale|sent|spent|paid|fee|d)$/i;
const INCOME_WORDS = /^(?:credit|cr|income|deposit|in|received|refund|return|c)$/i;

/** Total / balance lines that sit among the transactions and must never be imported. */
const SUMMARY_TEXT = [
  /^\s*(?:grand\s+|sub[\s-]?)?totals?\s*(?:expenses?|income|debits?|credits?|deposits?|withdrawals?|spent|paid|amount)?\s*[:=]?\s*$/i,
  /\b(?:beginning|opening|ending|closing|starting|previous|prior|new|statement)\s+balance\b/i,
  /\bbalance\s+(?:forward|brought\s+forward|carried\s+forward|b\/?f|c\/?f)\b/i,
  /^\s*balance\s*[:=]?\s*$/i,
  /\b(?:total|subtotal)\s+(?:for\s+(?:the\s+)?(?:period|month|statement)|this\s+(?:period|month|statement))\b/i,
];
const TRAILING_BALANCE = /\s+(?:ending|closing|new)\s+balance\s*$/i;
export const isSummaryText = (text: string) => SUMMARY_TEXT.some((re) => re.test(text));

/** Money that moves between the person's own accounts, or pays off a card: kept, but flagged. */
const TRANSFER_RE =
  /\b(?:online\s+transfer|transfer\s+(?:to|from)\s+(?:my\s+)?(?:chk|checking|sav|savings|account|acct|brokerage)|xfer\s+(?:to|from)|internal\s+transfer|account\s+transfer|funds\s+transfer|between\s+accounts|(?:automatic\s+|online\s+|mobile\s+)?payment[\s,-]+thank\s*you|thank\s*you\s+payment|payment\s+received|credit\s+card\s+payment|cc\s+payment|crcardpmt|epayment)\b/i;
/** Payments that clear a credit card balance: seen with a negative sign, they show a card export (charges positive). */
const CARD_PAYMENT_RE = /payment[\s,-]+thank\s*you|thank\s*you\s+payment|autopay|auto[\s-]?pay|online\s+payment|mobile\s+payment|web\s+payment|payment\s+received|statement\s+credit/i;

/** In a list where every amount is positive: a category or wording that says the money came in. */
const INCOME_CATEGORY = /^(?:income|revenue|sales|deposit|salary|wages|refund)s?$/i;
const INCOME_DESCRIPTION = /\b(?:deposit|salary|payroll|refund|interest\s+(?:paid|earned)|transfer\s+from|received|direct\s+dep)\b/i;

export const isTransferText = (text: string) => TRANSFER_RE.test(text);

export type RowsOptions = {
  defaultCategory?: string;
  /** Statement period, for rows whose dates have no year. */
  period?: StatementPeriod | null;
  /** Used when a date has no year and there is no period. */
  fallbackYear?: number;
  /** Force day/month reading. Default: learned from the data, otherwise US month/day. */
  dateOrder?: DateOrder;
};

type Draft = {
  date: string | null;
  signed: number | null;
  debit: number | null;
  credit: number | null;
  balance: number | null;
  description: string;
  category: string;
  typeText: string;
  hasMoneyCell: boolean;
};

/** "1,234.56 5,000.00" (two numbers in one cell) to both numbers; used when a PDF merged two rows into one. */
const numbersIn = (cell: unknown): number[] => {
  const out: number[] = [];
  for (const t of clean(cell).match(/\(?-?\$?\d[\d,]*\.\d{2}\)?/g) ?? []) {
    const n = parseAmount(t);
    if (n !== null) out.push(n);
  }
  return out;
};

/** One amount; on a row with a glued "ending balance" tail the cell may hold the amount and then the balance: take the first. */
const moneyCell = (cell: unknown, glued: boolean): number | null => (glued ? (numbersIn(cell)[0] ?? parseAmount(cell)) : parseAmount(cell));

/** Heuristic cut of two transactions that were joined into one description. */
const TX_START =
  /(?=\b(?:POS\s+PURCHASE|ACH\s+(?:CREDIT|DEBIT)|DIRECT\s+DEP|ONLINE\s+TRANSFER|ATM\s+(?:WITHDRAWAL|DEPOSIT)|WIRE\s+(?:IN|OUT|TRANSFER)|CHECK\s+#?\d|ZELLE|VENMO|PAYPAL|STRIPE|DEBIT\s+CARD|MONTHLY\s+SERVICE|INTEREST\s+(?:PAID|EARNED|CHARGE)|OVERDRAFT)\b)/gi;
function splitJoinedDescription(desc: string, parts: number): string[] {
  if (parts < 2) return [desc];
  const cuts = [0];
  for (const m of desc.matchAll(TX_START)) if (m.index! > 0) cuts.push(m.index!);
  if (cuts.length !== parts) return Array.from({ length: parts }, () => desc);
  return cuts.map((c, i) => desc.slice(c, cuts[i + 1] ?? desc.length).trim());
}

/** Convert the body of a table using a mapping. Rows without a usable date and amount are skipped. */
export function rowsFromGrid(grid: Grid, m: ColumnMapping, opts: RowsOptions | string = {}): RowsResult {
  const o: RowsOptions = typeof opts === "string" ? { defaultCategory: opts } : opts;
  const defaultCategory = o.defaultCategory ?? "Other";
  const body = grid.slice(m.headerRow + 1);
  const warnings: string[] = [];
  const dateCells = body.map((r) => clean(r[m.date]));
  const learned = detectDateOrder(dateCells);
  // US month/day unless the data says otherwise; a column of dotted dates (05.10.2026) is day.month by convention.
  const dotted = dateCells.filter((c) => /^\d{1,2}\.\d{1,2}\.\d{2,4}/.test(c)).length;
  const order: DateOrder = o.dateOrder ?? learned ?? (dotted > 0 && dotted >= dateCells.filter(Boolean).length / 2 ? "dmy" : "mdy");
  if (!o.dateOrder && learned === null && order === "mdy" && body.some((r) => /^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/.test(clean(r[m.date])))) {
    warnings.push("Dates like 03/04/2026 could be day/month or month/day; read as month/day/year (US).");
  }
  let yearless = 0;
  const readDate = (raw: unknown): string | null => {
    const full = parseDate(raw, order);
    if (full) return full;
    const md = parseYearlessMonthDay(raw, order);
    if (!md) return null;
    yearless++;
    return dateWithPeriodYear(md, o.period ?? null, o.fallbackYear);
  };

  // 1. Cells to drafts. Two transactions that a PDF joined into one table row are pulled apart first.
  const drafts: Draft[] = [];
  let summaryRows = 0;
  let mergedLines = 0;
  let splitRows = 0;
  for (const r of body) {
    if (!r.some((c) => clean(c))) continue;
    const description = m.description !== undefined ? clean(r[m.description]) : "";
    const category = m.category !== undefined ? clean(r[m.category]) : "";
    const typeText = m.type !== undefined ? clean(r[m.type]) : "";
    if (headerHits(r) >= 2) continue; // the header repeated at the top of every PDF page
    // The last row of a PDF table often has the "ENDING BALANCE" line glued on: keep the transaction, drop the tail.
    const trimmed = description.replace(TRAILING_BALANCE, "").trim();
    const gluedTail = trimmed !== description && trimmed.length > 0;
    if (!gluedTail && r.map(clean).some((c) => c && isSummaryText(c))) {
      summaryRows++;
      continue;
    }
    // Several dates in the date cell and several balances = joined rows.
    const dateParts = clean(r[m.date]).match(/\d{1,2}[/.-]\d{1,2}(?:[/.-]\d{2,4})?/g) ?? [];
    const balances = m.balance !== undefined ? numbersIn(r[m.balance]) : [];
    if (dateParts.length >= 2 && balances.length === dateParts.length && m.amount === undefined) {
      const descs = splitJoinedDescription(description, dateParts.length);
      const debitCell = m.debit !== undefined ? parseAmount(r[m.debit]) : null;
      dateParts.forEach((dp, k) => {
        drafts.push({
          date: readDate(dp),
          signed: null,
          // The amount printed in the row belongs to the first of the joined transactions only.
          debit: k === 0 ? debitCell : null,
          credit: null,
          balance: balances[k]!,
          description: descs[k] ?? description,
          category,
          typeText,
          hasMoneyCell: true,
        });
      });
      splitRows++;
      continue;
    }
    const d: Draft = {
      date: readDate(r[m.date]),
      signed: m.amount !== undefined ? moneyCell(r[m.amount], gluedTail) : null,
      debit: m.debit !== undefined ? moneyCell(r[m.debit], gluedTail) : null,
      credit: m.credit !== undefined ? moneyCell(r[m.credit], gluedTail) : null,
      balance: m.balance !== undefined ? (numbersIn(r[m.balance])[0] ?? parseAmount(r[m.balance])) : null,
      description: gluedTail ? trimmed : description,
      category,
      typeText,
      hasMoneyCell: false,
    };
    d.hasMoneyCell = [d.signed, d.debit, d.credit].some((v) => v !== null && v !== 0);
    // A line with text but no date and no amount continues the description above it (multi-line descriptions).
    if (!d.date && !d.hasMoneyCell && description && drafts.length > 0 && !r.some((c, i) => i !== m.description && clean(c) && parseAmount(c) !== null)) {
      const prev = drafts[drafts.length - 1]!;
      prev.description = `${prev.description} ${description}`.trim();
      mergedLines++;
      continue;
    }
    drafts.push(d);
  }

  // 2. Sign convention of a single signed column.
  const singleColumn = m.amount !== undefined && m.debit === undefined && m.credit === undefined;
  const signedValues = singleColumn ? drafts.map((d) => d.signed).filter((n): n is number => n !== null && n !== 0) : [];
  const positives = signedValues.filter((n) => n > 0).length;
  const negatives = signedValues.filter((n) => n < 0).length;
  const allPositive = singleColumn && signedValues.length > 0 && negatives === 0 && m.type === undefined;
  let positiveIsExpense = false;
  if (singleColumn && !allPositive && negatives > 0) {
    const pay = drafts.filter((d) => d.signed && CARD_PAYMENT_RE.test(d.description));
    const payNeg = pay.filter((d) => d.signed! < 0).length;
    const payPos = pay.length - payNeg;
    if (payNeg > payPos && positives > negatives) {
      positiveIsExpense = true;
      warnings.push("Charges are listed as positive amounts (credit card style), so payments and refunds were read as money in.");
    }
  }

  // 3. Drafts to rows. A running balance, when there is one, settles money in versus out.
  const rows: ParsedRow[] = [];
  let skipped = 0;
  let prevBalance: number | null = null;
  let checked = 0;
  let agreed = 0;

  // Opening balance: the balance on the "beginning balance" line, which was dropped as a summary row above.
  if (m.balance !== undefined) {
    for (const r of body) {
      if (r.some((c) => /\b(?:beginning|opening|starting|previous)\s+balance\b/i.test(clean(c)))) {
        prevBalance = numbersIn(r[m.balance])[0] ?? parseAmount(r[m.balance]);
        break;
      }
    }
  }

  for (const d of drafts) {
    let amount: number | null = null;
    let type: "expense" | "income" = "expense";

    if (singleColumn) {
      const v = d.signed;
      if (v !== null && v !== 0) {
        amount = Math.abs(v);
        const t = d.typeText;
        const bySign = positiveIsExpense ? (v > 0 ? "expense" : "income") : v < 0 ? "expense" : "income";
        if (m.type !== undefined && INCOME_WORDS.test(t)) type = "income";
        else if (m.type !== undefined && EXPENSE_WORDS.test(t)) type = "expense";
        else if (allPositive) type = INCOME_CATEGORY.test(d.category) || (m.balance !== undefined && INCOME_DESCRIPTION.test(d.description)) ? "income" : "expense";
        else type = bySign;
      }
    } else if (d.debit !== null && d.debit !== 0) {
      amount = Math.abs(d.debit);
      type = "expense";
    } else if (d.credit !== null && d.credit !== 0) {
      amount = Math.abs(d.credit);
      type = "income";
    }
    if (d.balance !== null) {
      if (prevBalance !== null) {
        const delta = round2(d.balance - prevBalance);
        if (delta !== 0) {
          if (amount === null) {
            // The amount column was lost (PDF text): the change in balance is the amount.
            amount = Math.abs(delta);
            type = delta > 0 ? "income" : "expense";
          } else {
            checked++;
            if (Math.abs(Math.abs(delta) - amount) < 0.011) {
              agreed++;
              type = delta > 0 ? "income" : "expense";
            }
          }
        }
      }
      prevBalance = d.balance;
    }

    if (!d.date || amount === null) {
      if (d.description || d.hasMoneyCell) skipped++;
      continue;
    }
    const merchant = d.description.slice(0, 120);
    const row: ParsedRow = {
      date: d.date,
      amount: round2(amount),
      type,
      category: d.category || defaultCategory,
      ...(merchant ? { merchant } : {}),
    };
    rows.push(row);
  }

  if (allPositive && rows.length > 0 && rows.every((r) => r.type === "expense")) warnings.push("Every amount is positive, so all rows were treated as expenses.");
  const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
  if (skipped > 0) warnings.push(`${skipped} row${skipped === 1 ? " has" : "s have"} no date or amount and ${skipped === 1 ? "was" : "were"} left out (notes or blanks).`);
  if (summaryRows > 0) warnings.push(`${summaryRows} total or balance line${summaryRows === 1 ? " was" : "s were"} left out.`);
  if (mergedLines > 0) warnings.push(`${mergedLines} description line${plural(mergedLines, " that wrapped was", "s that wrapped were")} joined to the row above.`);
  if (splitRows > 0) warnings.push(`${splitRows} row${plural(splitRows, " that the PDF had run together was", "s that the PDF had run together were")} separated using the running balance; check the descriptions.`);
  if (yearless > 0 && !o.period) warnings.push("The dates in this file have no year, and no statement period was found, so the most recent past year was used. Check the dates.");
  return { rows, skipped, warnings, ...(checked > 0 ? { balanceCheck: { checked, agreed } } : {}) };
}

/**
 * Flags, across the whole file, rows that repeat an earlier row exactly and rows that move money between the
 * person's own accounts. Nothing is removed: the preview starts duplicates unticked and lets people leave out transfers.
 */
export function annotateRows(rows: ParsedRow[]): { rows: ParsedRow[]; warnings: string[] } {
  const seen = new Set<string>();
  let duplicates = 0;
  let transfers = 0;
  let future = 0;
  const futureLimit = new Date(Date.now() + 31 * 86_400_000).toISOString().slice(0, 10);
  const out = rows.map((r) => {
    const next: ParsedRow = { ...r };
    delete next.duplicate;
    delete next.transfer;
    delete next.future;
    if (r.date > futureLimit) {
      next.future = true;
      future++;
    }
    if (isTransferText(`${r.merchant ?? ""} ${r.description ?? ""}`)) {
      next.transfer = true;
      transfers++;
    }
    const key = `${r.date}|${r.amount}|${r.type}|${(r.merchant ?? r.description ?? "").toLowerCase().replace(/\s+/g, " ")}`;
    if (seen.has(key)) {
      next.duplicate = true;
      duplicates++;
    } else seen.add(key);
    return next;
  });
  const warnings: string[] = [];
  if (future > 0) warnings.push(`${future} row${future === 1 ? " is" : "s are"} dated in the future (check the date or year); ${future === 1 ? "it is" : "they are"} unticked until you confirm.`);
  if (duplicates > 0) warnings.push(`${duplicates} row${duplicates === 1 ? " looks like a duplicate of an earlier row and is" : "s look like duplicates of earlier rows and are"} unticked.`);
  if (transfers > 0) warnings.push(`${transfers} row${transfers === 1 ? " looks like a transfer or card payment" : "s look like transfers or card payments"} between your own accounts; marked so you can leave ${transfers === 1 ? "it" : "them"} out.`);
  return { rows: out, warnings };
}

/** The rows ticked by default: everything except exact duplicates, own-account transfers and future-dated rows. */
export const defaultSelection = (rows: ParsedRow[]) => rows.filter((r) => !r.duplicate && !r.transfer && !r.future);

/** Opening balance plus the net movement equals the closing balance (bank: in minus out; card: charges minus payments). */
export function reconcile(rows: ParsedRow[], opening: number, closing: number): boolean {
  let moneyIn = 0;
  let moneyOut = 0;
  for (const r of rows) {
    if (r.type === "income") moneyIn += r.amount;
    else moneyOut += r.amount;
  }
  return Math.abs(opening + moneyIn - moneyOut - closing) < 0.015 || Math.abs(opening + moneyOut - moneyIn - closing) < 0.015;
}
