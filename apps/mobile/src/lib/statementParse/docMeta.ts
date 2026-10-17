/**
 * Document-level details of an uploaded statement, receipt or invoice, kept with the stored original file so an export can
 * list them. Only the LAST FOUR digits of an account or card number are ever kept. Pure functions, no I/O.
 */
import { parseAmount, parseDate, round2 } from "./normalize";
import type { ParsedRow } from "./statement";

export type DocMeta = Record<string, unknown>;
export type DocKind = "bank_statement" | "card_statement" | "receipt" | "invoice" | "spreadsheet" | "other";

const MONEY = String.raw`-?\$?\s?-?[0-9][0-9,]*\.[0-9]{2}`;
const MONTHS = "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const DATE_TOKEN = String.raw`(?:[0-9]{1,2}[/.-][0-9]{1,2}[/.-][0-9]{2,4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|${MONTHS}\.?\s+[0-9]{1,2}(?:st|nd|rd|th)?,?\s+[0-9]{4})`;

const flatten = (text: string) => text.replace(/\|/g, " | ").replace(/\s+/g, " ").trim();

/** Every money amount in the text right after a label, up to the next run of words (so "A $0.00 $4,567.51" gives both). */
function moneyAfter(flat: string, label: RegExp, window = 60): { values: number[]; before: string } | null {
  const m = new RegExp(label.source, "i").exec(flat);
  if (!m) return null;
  const tail = flat.slice(m.index + m[0].length, m.index + m[0].length + window);
  const values: number[] = [];
  // numbers directly after the label, stopping at the first run of 4+ letters (the next label)
  const stop = /[A-Za-z]{4,}/.exec(tail);
  const zone = stop ? tail.slice(0, stop.index) : tail;
  for (const t of zone.matchAll(new RegExp(MONEY, "g"))) {
    const n = parseAmount(t[0]);
    if (n !== null) values.push(n);
  }
  return values.length ? { values, before: flat.slice(Math.max(0, m.index - 24), m.index) } : null;
}

const first = (flat: string, label: RegExp) => moneyAfter(flat, label)?.values[0] ?? null;

function dateAfter(flat: string, label: RegExp): string | null {
  const m = new RegExp(`${label.source}[^0-9A-Za-z]{0,6}(${DATE_TOKEN})`, "i").exec(flat);
  return m ? parseDate(m[1]!.trim(), "mdy") : null;
}

function dateRange(flat: string): { start: string; end: string } | null {
  const m = new RegExp(`(?:statement\\s+period|billing\\s+(?:cycle|period)|period|activity\\s+from|from)[:\\s]*(${DATE_TOKEN})\\s*(?:through|thru|to|-|\\u2013|\\u2014)\\s*(${DATE_TOKEN})`, "i").exec(flat);
  if (!m) return null;
  const start = parseDate(m[1]!, "mdy");
  const end = parseDate(m[2]!, "mdy");
  return start && end ? { start, end } : null;
}

/** Last four digits of an account or card number mentioned in the text, never more. */
export function last4Of(flat: string): string | null {
  const patterns = [
    /(?:account|acct\.?|card)\s*(?:number|no\.?|#)?\s*(?:ending(?:\s+in)?|ends\s+in|:)?\s*(?:[*xX•.#-]+\s*)*([0-9]{4,20})\b/i,
    /(?:ending\s+in|ends\s+in)\s*([0-9]{4,20})\b/i,
    /[*xX•]{3,}\s?([0-9]{4,20})\b/,
  ];
  for (const re of patterns) {
    const m = re.exec(flat);
    if (m) return m[1]!.slice(-4);
  }
  return null;
}

function firstHeading(text: string): string | null {
  const h = /^#{1,3}\s+(.+)$/m.exec(text)?.[1]?.trim();
  if (h && !/account\s+statement|summary|activity/i.test(h)) return h.slice(0, 80);
  const line = text.split(/\r?\n/).map((l) => l.trim()).find((l) => /^[A-Z][A-Za-z&.' -]{3,60}(?:bank|credit union|card services|financial|savings|trust|national|federal)/i.test(l));
  return line ? line.slice(0, 80) : null;
}

const CARD_SIGNALS = [/minimum\s+payment\s+due/i, /payment\s+due\s+date/i, /credit\s+limit/i, /\bcredit\s+card\b/i, /new\s+balance/i, /\bpurchase\s+apr\b/i];

export function looksLikeCardStatement(text: string): boolean {
  return CARD_SIGNALS.filter((re) => re.test(text)).length >= 2;
}

export function rowTotals(rows: ParsedRow[]) {
  let moneyIn = 0;
  let moneyOut = 0;
  let start = "";
  let end = "";
  for (const r of rows) {
    if (r.type === "income") moneyIn += r.amount;
    else moneyOut += r.amount;
    if (!start || r.date < start) start = r.date;
    if (!end || r.date > end) end = r.date;
  }
  return { moneyIn: round2(moneyIn), moneyOut: round2(moneyOut), start, end, count: rows.length };
}

const clean = (m: DocMeta): DocMeta => Object.fromEntries(Object.entries(m).filter(([, v]) => v !== null && v !== undefined && v !== ""));

/** Details printed on a statement (the text a PDF or scan yielded). */
export function statementTextMeta(text: string): { kind: "bank_statement" | "card_statement"; meta: DocMeta } {
  const flat = flatten(text);
  const card = looksLikeCardStatement(flat);
  const range = dateRange(flat);
  const common: DocMeta = {
    currency: /€/.test(flat) ? "EUR" : /£/.test(flat) ? "GBP" : "USD",
    periodStart: range?.start ?? null,
    periodEnd: range?.end ?? null,
  };
  if (!card) {
    const opening = first(flat, /(?:beginning|opening|previous|starting)\s+balance/);
    const closing = first(flat, /(?:ending|closing)\s+balance/);
    return {
      kind: "bank_statement",
      meta: clean({
        ...common,
        bankName: firstHeading(text),
        accountHolder: /(?:account\s+holder|prepared\s+for|primary\s+account\s+holder|statement\s+for)[:\s]+([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){0,3})/.exec(flat)?.[1] ?? null,
        accountLast4: last4Of(flat),
        openingBalance: opening,
        totalDeposits: first(flat, /total\s+(?:deposits|credits)(?:\s+and\s+(?:other\s+)?(?:credits|deposits))?/),
        totalWithdrawals: first(flat, /total\s+(?:withdrawals|debits)(?:\s+and\s+(?:other\s+)?(?:debits|withdrawals))?/),
        closingBalance: closing,
      }),
    };
  }
  const previous = first(flat, /previous\s+balance/);
  const payments = first(flat, /payments?\s*(?:,|and|&)\s*(?:other\s+)?credits?/) ?? first(flat, /payments?\s+received/);
  const charges = first(flat, /(?:new\s+charges|new\s+purchases|purchases(?:\s*,\s*fees\s*(?:&|and)\s*interest)?)/);
  const fees = first(flat, /fees\s+charged/);
  const interest = first(flat, /interest\s+charged/);
  // "Interest Charged New Balance | $0.00 $4,567.51": two labels share one cell; pick the value that makes the summary add up.
  const nb = moneyAfter(flat, /new\s+balance/);
  let newBalance: number | null = nb?.values[0] ?? null;
  if (nb && nb.values.length > 1) {
    const expected = previous !== null ? round2(previous + (charges ?? 0) + (fees ?? 0) + (interest ?? 0) - (payments ?? 0)) : null;
    newBalance = expected !== null ? (nb.values.find((v) => Math.abs(v - expected) < 0.02) ?? nb.values[nb.values.length - 1]!) : nb.values[nb.values.length - 1]!;
  }
  const apr = /(?:purchase\s+)?apr[^0-9]{0,20}([0-9]{1,2}\.[0-9]{1,3})\s*%/i.exec(flat)?.[1] ?? /([0-9]{1,2}\.[0-9]{2})\s*%\s*\(?v?\)?/.exec(flat)?.[1] ?? null;
  const cardName = flat.match(/([A-Z][A-Za-z+&' ]{3,50}(?:Visa|Mastercard|MasterCard|American Express|Amex|Discover)[A-Za-z ]{0,30}?)(?:\s+(?:Credit\s+)?Card\s+Statement|\s+Statement|\s+Account)/)?.[1]?.trim() ?? null;
  return {
    kind: "card_statement",
    meta: clean({
      ...common,
      issuer: firstHeading(text),
      cardName,
      last4: last4Of(flat),
      closingDate: dateAfter(flat, /statement\s+closing\s+date/) ?? dateAfter(flat, /closing\s+date/),
      paymentDueDate: dateAfter(flat, /payment\s+due\s+date/) ?? dateAfter(flat, /due\s+date/),
      previousBalance: previous,
      paymentsAndCredits: payments,
      newCharges: charges,
      feesCharged: fees,
      interestCharged: interest,
      newBalance,
      minimumPaymentDue: first(flat, /minimum\s+payment\s+(?:due|amount)?/),
      creditLimit: first(flat, /credit\s+(?:limit|line)/),
      availableCredit: first(flat, /available\s+credit/),
      apr: apr !== null ? Number(apr) : null,
    }),
  };
}

/**
 * The details to store with an imported statement: what the document prints (when text is available) plus period, totals and
 * count worked out from the rows, so a CSV or Excel file gets them too.
 */
export function buildStatementMeta(args: { rows: ParsedRow[]; text?: string; printed?: { kind: "bank_statement" | "card_statement"; meta: DocMeta }; warnings?: string[]; opening?: number | null; closing?: number | null }): { kind: DocKind; meta: DocMeta } {
  const t = args.printed ?? (args.text ? statementTextMeta(args.text) : null);
  const totals = rowTotals(args.rows);
  const warnings = args.warnings ?? [];
  const kind: DocKind = t ? t.kind : warnings.some((w) => /credit card style/.test(w)) ? "card_statement" : warnings.some((w) => /Every amount is positive/.test(w)) ? "spreadsheet" : "bank_statement";
  const printed: DocMeta = { ...(t?.meta ?? {}) };
  const out: DocMeta = { currency: "USD", ...printed };
  if (!out.periodStart && totals.start) out.periodStart = totals.start;
  if (!out.periodEnd && totals.end) out.periodEnd = totals.end;
  out.transactionCount = totals.count;
  if (kind === "card_statement") {
    if (out.newCharges === undefined) out.newCharges = totals.moneyOut;
    if (out.paymentsAndCredits === undefined) out.paymentsAndCredits = totals.moneyIn;
  } else {
    if (out.totalDeposits === undefined) out.totalDeposits = totals.moneyIn;
    if (out.totalWithdrawals === undefined) out.totalWithdrawals = totals.moneyOut;
    if (out.openingBalance === undefined && typeof args.opening === "number") out.openingBalance = args.opening;
    if (out.closingBalance === undefined && typeof args.closing === "number") out.closingBalance = args.closing;
  }
  return { kind, meta: clean(out) };
}

/** Everything the receipt / invoice reader returned (address, country, tax, tip, payment, invoice fields, every line item). */
export function documentMeta(e: Record<string, unknown> | null | undefined): DocMeta {
  if (!e) return {};
  const keep: DocMeta = {};
  const copy = ["merchant_name", "merchant_address", "country", "currency", "date", "time", "subtotal", "tax_amount", "tip", "total_amount", "payment_method", "card_type", "card_last4", "receipt_number", "invoice_number", "due_date", "po_number", "payment_terms", "bill_to", "document_type", "category", "taxes", "description"];
  for (const k of copy) if (e[k] !== undefined && e[k] !== null && e[k] !== "") keep[k] = e[k];
  if (Array.isArray(e.items)) keep.items = (e.items as unknown[]).slice(0, 300);
  if (typeof keep.card_last4 === "string") keep.card_last4 = String(keep.card_last4).replace(/\D/g, "").slice(-4);
  return keep;
}


const METHODS: Array<[RegExp, string]> = [
  [/apple\s*pay/i, "Apple Pay"],
  [/google\s*pay|g\s*pay\b/i, "Google Pay"],
  [/paypal/i, "PayPal"],
  [/american\s*express|\bamex\b|\bamx\b/i, "Amex"],
  [/master\s*card|\bmc\b|\bmastercard\b/i, "Mastercard"],
  [/\bvisa\b/i, "Visa"],
  [/discover|\bdisc\b/i, "Discover"],
  [/\bdebit\b/i, "Debit"],
  [/credit\s*card|\bcredit\b/i, "Credit"],
  [/\bcheck\b|\bcheque\b/i, "Check"],
  [/\bcash\b/i, "Cash"],
];

const MASK = String.raw`(?:\*+|x+|•+|\.{2,}|…)`;

/**
 * How a receipt was paid, from the text printed on it: the card brand or "Cash" / "Check" / "Debit", and the last four
 * digits of the card only (from "****1234", "XXXX1234", "ending in 1234", "Acct #...1234", "Card: ...1234").
 */
export function paymentFromText(text: string): { method?: string; last4?: string } {
  const flat = text.replace(/\s+/g, " ");
  let last4: string | undefined;
  const patterns = [
    new RegExp(String.raw`(?:ending|ends)\s+in\s+(\d{4})\b`, "i"),
    new RegExp(String.raw`(?:visa|mastercard|master\s*card|mc|amex|american\s+express|discover|debit|credit|card|acct|account)\s*(?:card)?\s*(?:#|no\.?|number)?\s*[:#]?\s*${MASK}\s?(\d{4})\b`, "i"),
    new RegExp(String.raw`${MASK}\s?(\d{4})\b`, "i"),
  ];
  for (const re of patterns) {
    const m = re.exec(flat);
    if (m) {
      last4 = m[1];
      break;
    }
  }
  let method: string | undefined;
  for (const [re, label] of METHODS) {
    if (re.test(flat)) {
      method = label;
      break;
    }
  }
  // a masked card number with no brand printed is still a card payment
  if (!method && last4) method = "Card";
  // "CASH" next to a card brand is usually "cash back" / "cashier": a brand or a card number wins over cash
  if (method === "Cash" && last4) method = "Card";
  return { ...(method ? { method } : {}), ...(last4 ? { last4 } : {}) };
}
