/**
 * The only places a statement upload can spend AI money. The browser reads the file; it calls these
 * (through the API, which enforces plan and daily budget) only when code could not solve it:
 *  - aiMapColumns: a spreadsheet whose headers could not be understood (about 14 rows of text)
 *  - aiExtractChunk: free text the splitter could not read confidently (one chunk per call)
 *  - aiOcrPdf: a scanned PDF (page-capped by the client; the one path that is not text-only)
 */
import { parseAmount, parseDate, round2 } from "../../../../apps/mobile/src/lib/statementParse/normalize";
import type { ColumnMapping, Grid, ParsedRow } from "../../../../apps/mobile/src/lib/statementParse/statement";
import type { Env } from "../types";
import { type AzureOptions, azureReadStatement } from "./azure";

const model = (env: Env) => env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini";

async function chatJson(env: Env, messages: unknown[], maxTokens = 4096, modelName?: string): Promise<Record<string, unknown>> {
  const key = env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("The AI helper is not configured on the server.");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: modelName ?? model(env),
      temperature: 0,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty model response.");
  return JSON.parse(content) as Record<string, unknown>;
}

const today = () => new Date().toISOString().slice(0, 10);

const idx = (v: unknown, width: number): number | undefined =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 && v < width ? v : undefined;

/** Ask which column is which. Costs a few hundred tokens however long the file is. */
export async function aiMapColumns(env: Env, grid: Grid): Promise<ColumnMapping | null> {
  const width = Math.max(...grid.map((r) => r.length), 0);
  const sample = grid.slice(0, 14).map((r) => r.slice(0, 20).map((c) => String(c ?? "").slice(0, 40)));
  const out = await chatJson(env, [
    {
      role: "system",
      content:
        "You look at the first rows of a bank statement or sales export (a JSON array of rows of cell text) and say which column holds what. " +
        'Reply with JSON: {"headerRow": number (0-based row index of the header, or -1 if none), "date": col, "description": col|null, "amount": col|null, "debit": col|null, "credit": col|null, "type": col|null, "category": col|null}. ' +
        "Columns are 0-based indexes. Use amount for one signed/positive amount column, or debit and credit when money out and money in are separate columns. Use null when absent.",
    },
    { role: "user", content: JSON.stringify(sample) },
  ]);
  const date = idx(out.date, width);
  const amount = idx(out.amount, width);
  const debit = idx(out.debit, width);
  const credit = idx(out.credit, width);
  const headerRow = typeof out.headerRow === "number" && Number.isInteger(out.headerRow) && out.headerRow >= -1 && out.headerRow < grid.length ? out.headerRow : -1;
  if (date === undefined || (amount === undefined && debit === undefined && credit === undefined)) return null;
  return {
    headerRow,
    date,
    amount,
    debit,
    credit,
    description: idx(out.description, width),
    type: idx(out.type, width),
    category: idx(out.category, width),
  };
}

function validateRows(list: unknown): ParsedRow[] {
  if (!Array.isArray(list)) return [];
  const rows: ParsedRow[] = [];
  for (const item of list) {
    const o = item as Record<string, unknown>;
    const date = parseDate(o.date);
    const raw = parseAmount(o.amount);
    if (!date || raw === null || raw === 0) continue;
    const description = String(o.description ?? o.merchant ?? "").trim();
    rows.push({
      date,
      amount: round2(Math.abs(raw)),
      type: o.type === "income" ? "income" : "expense",
      category: "Other",
      ...(description ? { merchant: description.slice(0, 120) } : {}),
    });
  }
  return rows;
}

const EXTRACT_SYSTEM =
  "You extract transactions from text taken from a bank statement or sales report. " +
  'Reply with JSON: {"transactions":[{"date":"YYYY-MM-DD","description":string,"amount":positive number,"type":"expense"|"income"}]}. ' +
  "Money leaving the account (withdrawals, debits, purchases, fees) is an expense; money arriving (deposits, credits, refunds, interest) is income. " +
  "On a credit card statement a purchase or fee is an expense and a payment or credit is income. Use the running balance to confirm direction when the text has one. " +
  "Dates are US month/day/year. If a date has no year, use the year given in the [Context] line; if there is none, use the most recent past year for that date (a statement never lists future dates). " +
  "Ignore opening/closing balances, totals, page headers and footers. Copy each row's description as printed. One output row per transaction, in the order printed. " +
  "Only output transactions that are really in the text. Never invent, merge or duplicate rows.";

/** One piece of statement text to rows. The browser splits long text and calls this per piece. */
export async function aiExtractChunk(env: Env, text: string): Promise<ParsedRow[]> {
  const out = await chatJson(env, [{ role: "system", content: `${EXTRACT_SYSTEM} Today is ${today()}.` }, { role: "user", content: text }], 8192);
  return validateRows(out.transactions);
}

/**
 * Scanned PDF (or a photo of a statement) to rows. Read by Azure Document Intelligence (see azure.ts), which reads the
 * printed text instead of guessing it: the OpenAI file reader that used to be here invented rows on scans.
 * Returns the opening and closing balance as well, so the caller can check that the rows add up.
 */
export async function aiOcrPdf(
  env: Env,
  fileBase64: string,
  opts: AzureOptions = {},
): Promise<{ rows: ParsedRow[]; opening: number | null; closing: number | null; warnings: string[]; pages: number }> {
  const out = await azureReadStatement(env, fileBase64, opts);
  return { rows: out.rows, opening: out.opening, closing: out.closing, warnings: out.warnings, pages: out.pages };
}
