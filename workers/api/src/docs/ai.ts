/**
 * The only places a statement upload can spend AI money. Both are small and last-resort:
 *  - aiMapColumns: a spreadsheet whose headers could not be understood (about 12 rows of text)
 *  - aiExtractRows: free text the splitter could not read confidently (chunked, text model)
 *  - aiOcrPdf: a scanned PDF (page-capped; the one path that is not text-only)
 */
import type { Env } from "../types";
import { parseAmount, parseDate, round2 } from "./normalize";
import type { ColumnMapping, Grid, ParsedRow } from "./statement";

const model = (env: Env) => env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini";

async function chatJson(env: Env, messages: unknown[], maxTokens = 4096): Promise<Record<string, unknown>> {
  const key = env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("Add OPENAI_API_KEY to the API Worker for the AI helper.");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model(env),
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
  "Money leaving the account is an expense; money arriving is income. Ignore opening/closing balances, totals and page headers. Never invent rows.";

export const TEXT_CHUNK_CHARS = 12_000;
export const MAX_AI_CHUNKS = 15;

/** Free text to rows, chunked so a long statement is several small calls. */
export async function aiExtractRows(env: Env, text: string): Promise<{ rows: ParsedRow[]; calls: number; truncated: boolean }> {
  const flat = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  let start = 0;
  while (start < flat.length && chunks.length < MAX_AI_CHUNKS) {
    let end = Math.min(flat.length, start + TEXT_CHUNK_CHARS);
    if (end < flat.length) {
      // Cut on a space so a row is not split mid-word.
      const space = flat.lastIndexOf(" ", end);
      if (space > start) end = space;
    }
    chunks.push(flat.slice(start, end).trim());
    start = end;
  }
  const rows: ParsedRow[] = [];
  for (const chunk of chunks) {
    const out = await chatJson(env, [{ role: "system", content: EXTRACT_SYSTEM }, { role: "user", content: chunk }], 8192);
    rows.push(...validateRows(out.transactions));
  }
  return { rows, calls: chunks.length, truncated: start < flat.length };
}

/**
 * Scanned PDF to rows using the model's PDF file input. NOTE: written from OpenAI's documented
 * `file` content part; not exercised against the live API in tests (a stub is used).
 */
export async function aiOcrPdf(env: Env, bytes: Uint8Array): Promise<ParsedRow[]> {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const out = await chatJson(
    env,
    [
      { role: "system", content: EXTRACT_SYSTEM },
      {
        role: "user",
        content: [
          { type: "file", file: { filename: "statement.pdf", file_data: `data:application/pdf;base64,${btoa(bin)}` } },
          { type: "text", text: "Extract every transaction from this scanned statement." },
        ],
      },
    ],
    8192,
  );
  return validateRows(out.transactions);
}
