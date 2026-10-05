/**
 * Rows from the flowing text of a statement PDF. anydoc returns PDF text as one run with the line
 * breaks lost, so rows are cut at each date. Money in versus money out is read from the running
 * balance when the statement has one, which is far more reliable than guessing from words.
 */
import { MONEY_TOKEN, type DateOrder, detectDateOrder, parseAmount, parseDate, round2 } from "./normalize";
import type { ParsedRow } from "./statement";

const DATE_RE = new RegExp(
  [
    String.raw`\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b`,
    String.raw`\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b`,
    String.raw`\b\d{1,2}(?:st|nd|rd|th)?[\s-]+[A-Za-z]{3,9}\.?,?[\s-]+\d{2,4}\b`,
    String.raw`\b[A-Za-z]{3,9}\.?\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b`,
  ].join("|"),
  "g",
);

const INCOME_HINT = /\b(salary|payroll|deposit|credit(?:ed)?|transfer\s+from|refund|received|interest|inflow|cashback|reversal)\b/i;

export type TextRowsResult = {
  rows: ParsedRow[];
  /** 0..1. Below ~0.8 the rows should be double-checked (the pipeline asks the AI helper if allowed). */
  confidence: number;
  warnings: string[];
  dateCount: number;
};

type Segment = { date: string; text: string };

function segments(text: string): Segment[] {
  const flat = text.replace(/\s+/g, " ").trim();
  const found: { index: number; end: number; raw: string }[] = [];
  for (const m of flat.matchAll(DATE_RE)) found.push({ index: m.index!, end: m.index! + m[0].length, raw: m[0] });
  const order: DateOrder = detectDateOrder(found.map((f) => f.raw)) ?? "dmy";

  const valid = found.filter((f) => parseDate(f.raw, order) !== null);
  const out: Segment[] = [];
  for (let i = 0; i < valid.length; i++) {
    const cur = valid[i]!;
    const next = valid[i + 1];
    const body = flat.slice(cur.end, next ? next.index : flat.length).trim();
    // Two dates back to back are posting + value date: keep the first, the next one carries the text.
    if (!body && next) continue;
    out.push({ date: parseDate(cur.raw, order)!, text: body });
  }
  return out;
}

type Candidate = { date: string; description: string; tokens: number[]; raw: string };

function candidates(segs: Segment[]): Candidate[] {
  const out: Candidate[] = [];
  for (const s of segs) {
    const raws = s.text.match(MONEY_TOKEN) ?? [];
    const tokens = raws.map((t) => parseAmount(t)).filter((n): n is number => n !== null);
    if (tokens.length === 0) continue;
    let description = s.text;
    for (const t of raws) description = description.replace(t, " ");
    out.push({ date: s.date, description: description.replace(/\s+/g, " ").trim(), tokens, raw: s.text });
  }
  return out;
}

export function rowsFromFlowingText(text: string): TextRowsResult {
  const segs = segments(text);
  const cands = candidates(segs);
  const warnings: string[] = [];
  if (cands.length === 0) return { rows: [], confidence: 0, warnings, dateCount: segs.length };

  const rows: ParsedRow[] = [];
  const withBalance = cands.every((c) => c.tokens.length >= 2);
  let verified = 0;
  let checked = 0;
  let signedHints = 0;

  cands.forEach((c, i) => {
    let amount = Math.abs(c.tokens[0]!);
    let type: "expense" | "income" | null = null;

    if (withBalance && i > 0) {
      const balance = c.tokens[c.tokens.length - 1]!;
      const prev = cands[i - 1]!.tokens[cands[i - 1]!.tokens.length - 1]!;
      const delta = round2(balance - prev);
      const hit = c.tokens.slice(0, -1).find((t) => Math.abs(Math.abs(t) - Math.abs(delta)) < 0.011);
      checked++;
      if (hit !== undefined && delta !== 0) {
        amount = Math.abs(hit);
        type = delta > 0 ? "income" : "expense";
        verified++;
      }
    }
    if (type === null) {
      const first = c.tokens[0]!;
      if (first < 0 || /\bDR\b|\(.*\)/i.test(c.raw)) {
        type = "expense";
        signedHints++;
      } else if (/\bCR\b/.test(c.raw)) {
        type = "income";
        signedHints++;
      } else {
        type = INCOME_HINT.test(c.description) ? "income" : "expense";
      }
    }
    rows.push({
      date: c.date,
      amount: round2(amount),
      type,
      category: "Other",
      ...(c.description ? { merchant: c.description.slice(0, 120) } : {}),
    });
  });

  let confidence: number;
  if (withBalance && checked > 0 && verified / checked >= 0.8) {
    confidence = 0.95;
  } else if (signedHints / cands.length >= 0.5) {
    confidence = 0.85;
    warnings.push("Money in and money out were read from the signs in the statement.");
  } else {
    confidence = 0.6;
    warnings.push("This statement does not show whether each row is money in or out; types were guessed from the wording.");
  }
  // Many dates but few rows suggests table content the splitter missed.
  if (segs.length > 0 && cands.length / segs.length < 0.7) confidence = Math.min(confidence, 0.7);
  return { rows, confidence, warnings, dateCount: segs.length };
}
