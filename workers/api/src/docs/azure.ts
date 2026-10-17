/**
 * Scanned statements (PDF or a photo) read with Azure AI Document Intelligence v4 (api-version 2024-11-30).
 *
 *  1. prebuilt-bankStatement.us: structured Transactions (date, description, deposit / withdrawal) plus the statement's
 *     beginning / ending balance and period.
 *  2. If that finds nothing (or is unsure), prebuilt-layout: the recognised tables go through the same text-to-rows code
 *     the browser uses for text PDFs (signs, US dates, total lines, multi-page tables, balance check).
 *
 * The Worker only does fetch and small JSON handling. Never returns a partial statement: if Azure analysed fewer pages
 * than the PDF has (free F0 tier reads 2 pages), it fails with a clear message and logs the real cause.
 *
 * Env: AZURE_DI_ENDPOINT (https://<name>.cognitiveservices.azure.com), AZURE_DI_KEY.
 */
import { dateWithPeriodYear, parseAmount, parseDate, parseYearlessMonthDay, round2 } from "../../../../apps/mobile/src/lib/statementParse/normalize";
import { statementTextMeta } from "../../../../apps/mobile/src/lib/statementParse/docMeta";
import { parseExtractedDocument } from "../../../../apps/mobile/src/lib/statementParse/pipeline";
import { type Grid, type ParsedRow, type StatementPeriod, isSummaryText, reconcile } from "../../../../apps/mobile/src/lib/statementParse/statement";
import type { Env } from "../types";

const API_VERSION = "2024-11-30";
const POLL_MS = 1500;
const TIMEOUT_MS = 45_000;
/** The Workers free plan allows 50 subrequests per request: stay well under it across both models. */
const MAX_SUBREQUESTS = 40;
const LOW_CONFIDENCE = 0.6;

export const AZURE_TOO_LONG = "This PDF is too long to read right now. Upload a CSV or Excel version.";
const UNAVAILABLE = "Scanned statements cannot be read right now. Please try again later, or upload a CSV or Excel version.";

/** An error whose `userMessage` is safe to show; `detail` goes to the server log only. */
export class AzureError extends Error {
  constructor(
    public userMessage: string,
    public status = 503,
    detail?: string,
  ) {
    super(detail ?? userMessage);
  }
}

export type AzureOptions = {
  /** "pdf" (default) or "statement" (a photo / image of a statement). */
  kind?: "pdf" | "statement";
  /** The PDF's real page count from our own parser; used to catch a tier that reads only part of it. */
  expectedPages?: number;
  pollMs?: number;
  timeoutMs?: number;
  sleep?: (ms: number) => Promise<void>;
};

export type AzureStatement = {
  rows: ParsedRow[];
  opening: number | null;
  closing: number | null;
  warnings: string[];
  pages: number;
  model: "prebuilt-bankStatement.us" | "prebuilt-layout" | "prebuilt-read";
  /** Details printed on the statement (bank, last 4 digits only, period, balances, totals ...). */
  meta?: Record<string, unknown>;
  metaKind?: "bank_statement" | "card_statement";
};

export type Json = Record<string, any>;

export function azureConfigured(env: Env): boolean {
  return !!(env.AZURE_DI_ENDPOINT?.trim() && env.AZURE_DI_KEY?.trim());
}

class Budget {
  used = 0;
  readonly start = Date.now();
  constructor(
    readonly timeoutMs: number,
    readonly pollMs: number,
    readonly sleep: (ms: number) => Promise<void>,
  ) {}
  take() {
    if (++this.used > MAX_SUBREQUESTS) throw new AzureError("Reading this document took too long. Try again, or upload a CSV or Excel version.", 504, "Azure DI: subrequest budget used up");
  }
  expired() {
    return Date.now() - this.start > this.timeoutMs;
  }
}

function endpointOf(env: Env): URL {
  const raw = env.AZURE_DI_ENDPOINT?.trim() ?? "";
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new AzureError(UNAVAILABLE, 503, "Azure DI: AZURE_DI_ENDPOINT is not a valid URL");
  }
  if (url.protocol !== "https:") throw new AzureError(UNAVAILABLE, 503, "Azure DI: endpoint must be https");
  return url;
}

async function failFromResponse(res: Response, what: string): Promise<never> {
  const body = (await res.text().catch(() => "")).slice(0, 300);
  if (res.status === 401 || res.status === 403) throw new AzureError(UNAVAILABLE, 503, `Azure DI rejected the key (${res.status}) during ${what}: ${body}`);
  if (res.status === 429) throw new AzureError("The document reader is busy. Please try again in a minute.", 503, `Azure DI rate limited (429) during ${what}`);
  if (res.status === 400 || res.status === 413 || res.status === 415) {
    throw new AzureError("This file could not be read. Use a clear PDF, JPG or PNG under 4 MB, or upload a CSV or Excel version.", 400, `Azure DI ${res.status} during ${what}: ${body}`);
  }
  throw new AzureError(UNAVAILABLE, 503, `Azure DI ${res.status} during ${what}: ${body}`);
}

/** Submits a document and polls until Azure finishes. Returns analyzeResult. */
async function analyze(env: Env, model: string, base64: string, budget: Budget, query = ""): Promise<Json> {
  const endpoint = endpointOf(env);
  const key = env.AZURE_DI_KEY!.trim();
  const headers = { "Ocp-Apim-Subscription-Key": key };
  budget.take();
  const submit = await fetch(`${endpoint.origin}/documentintelligence/documentModels/${model}:analyze?api-version=${API_VERSION}${query}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ base64Source: base64 }),
  });
  if (submit.status !== 202) return failFromResponse(submit, `${model} submit`);
  const op = submit.headers.get("Operation-Location");
  // Only ever send the key back to the same Azure resource.
  if (!op || new URL(op).origin !== endpoint.origin) throw new AzureError(UNAVAILABLE, 503, "Azure DI: missing or foreign Operation-Location");
  for (;;) {
    if (budget.expired()) throw new AzureError("Reading this document took too long. Try again, or upload a CSV or Excel version.", 504, `Azure DI: ${model} did not finish in ${budget.timeoutMs} ms`);
    await budget.sleep(budget.pollMs);
    budget.take();
    const poll = await fetch(op, { headers });
    if (!poll.ok) return failFromResponse(poll, `${model} poll`);
    const body = (await poll.json()) as Json;
    if (body.status === "succeeded") return (body.analyzeResult ?? {}) as Json;
    if (body.status === "failed") {
      const err = body.error as Json | undefined;
      throw new AzureError("This file could not be read. Use a clear PDF, JPG or PNG, or upload a CSV or Excel version.", 422, `Azure DI ${model} failed: ${err?.code ?? ""} ${String(err?.message ?? "").slice(0, 200)}`);
    }
    // notStarted / running: keep polling
  }
}

export const field = (obj: Json | undefined, name: string): Json | undefined => obj?.[name];
export const text = (f: Json | undefined): string => String(f?.valueString ?? f?.content ?? "").replace(/\s+/g, " ").trim();
export const amount = (f: Json | undefined): number | null => {
  if (!f) return null;
  if (typeof f.valueNumber === "number") return f.valueNumber;
  if (typeof f.valueCurrency?.amount === "number") return f.valueCurrency.amount;
  return f.content ? parseAmount(f.content) : null;
};

function periodOf(fields: Json | undefined): StatementPeriod | null {
  const s = field(fields, "StatementStartDate")?.valueDate as string | undefined;
  const e = field(fields, "StatementEndDate")?.valueDate as string | undefined;
  const sd = s ? /^(\d{4})-(\d{2})/.exec(s) : null;
  const ed = e ? /^(\d{4})-(\d{2})/.exec(e) : null;
  if (!ed && !sd) return null;
  const end = ed ?? sd!;
  const start = sd ?? ed!;
  return { startYear: Number(start[1]), startMonth: Number(start[2]), endYear: Number(end[1]) };
}

/** Azure's date, corrected to the statement period when a yearless "03/05" came back with some other year. */
function dateOf(f: Json | undefined, period: StatementPeriod | null): string | null {
  let iso = typeof f?.valueDate === "string" ? f.valueDate : parseDate(f?.content ?? "");
  if (!iso) {
    const md = parseYearlessMonthDay(f?.content ?? "");
    return md ? dateWithPeriodYear(md, period) : null;
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (m && period && Number(m[1]) !== period.startYear && Number(m[1]) !== period.endYear) {
    iso = dateWithPeriodYear({ month: Number(m[2]), day: Number(m[3]) }, period) ?? iso;
  }
  return iso;
}

function fromBankModel(result: Json): { rows: ParsedRow[]; opening: number | null; closing: number | null; warnings: string[]; meta: Record<string, unknown> } {
  const doc = (result.documents as Json[] | undefined)?.[0];
  const fields = doc?.fields as Json | undefined;
  const period = periodOf(fields);
  const accounts = (field(fields, "Accounts")?.valueArray as Json[] | undefined) ?? [];
  const rows: ParsedRow[] = [];
  const doubtful: number[] = [];
  let opening: number | null = null;
  let closing: number | null = null;
  let accountNumber = "";
  let accountType = "";
  for (const acct of accounts) {
    const a = acct.valueObject as Json | undefined;
    if (!accountNumber) accountNumber = text(field(a, "AccountNumber"));
    if (!accountType) accountType = text(field(a, "AccountType"));
    if (opening === null) opening = amount(field(a, "BeginningBalance"));
    if (closing === null) closing = amount(field(a, "EndingBalance"));
    for (const t of ((field(a, "Transactions")?.valueArray as Json[] | undefined) ?? [])) {
      const o = t.valueObject as Json | undefined;
      const date = dateOf(field(o, "Date"), period);
      const deposit = amount(field(o, "DepositAmount"));
      const withdrawal = amount(field(o, "WithdrawalAmount"));
      const isIncome = deposit !== null && deposit !== 0;
      const value = isIncome ? deposit : withdrawal;
      if (!date || value === null || value === 0) continue;
      const description = text(field(o, "Description"));
      if (isSummaryText(description)) continue; // "BEGINNING BALANCE" / "ENDING BALANCE" lines are not transactions
      rows.push({
        date,
        amount: round2(Math.abs(value)),
        type: isIncome ? "income" : "expense",
        category: "Other",
        ...(description ? { merchant: description.slice(0, 120) } : {}),
      });
      const conf = [field(o, "Date"), field(o, isIncome ? "DepositAmount" : "WithdrawalAmount"), field(o, "Description")]
        .map((f) => (typeof f?.confidence === "number" ? f.confidence : 1))
        .reduce((a2, b2) => Math.min(a2, b2), 1);
      if (conf < LOW_CONFIDENCE) doubtful.push(rows.length);
    }
  }
  const warnings: string[] = [];
  if (doubtful.length) {
    warnings.push(`The scanner was unsure about ${doubtful.length} row${doubtful.length === 1 ? "" : "s"} (row ${doubtful.slice(0, 10).join(", ")}${doubtful.length > 10 ? ", ..." : ""}). Check the date and amount on ${doubtful.length === 1 ? "it" : "them"}.`);
  }
  const digits = accountNumber.replace(/\D/g, "");
  const meta: Record<string, unknown> = {
    currency: "USD",
    bankName: text(field(fields, "BankName")) || undefined,
    accountHolder: text(field(fields, "AccountHolderName")) || undefined,
    // only the last four digits of an account number are ever kept
    accountLast4: digits.length >= 4 ? digits.slice(-4) : undefined,
    accountType: accountType || undefined,
    periodStart: (field(fields, "StatementStartDate")?.valueDate as string | undefined) || undefined,
    periodEnd: (field(fields, "StatementEndDate")?.valueDate as string | undefined) || undefined,
    openingBalance: opening ?? undefined,
    closingBalance: closing ?? undefined,
  };
  return { rows, opening, closing, warnings, meta: Object.fromEntries(Object.entries(meta).filter(([, v]) => v !== undefined)) };
}

function gridsOf(result: Json): Grid[] {
  const grids: Grid[] = [];
  for (const t of (result.tables as Json[] | undefined) ?? []) {
    const rows = Number(t.rowCount) || 0;
    const cols = Number(t.columnCount) || 0;
    if (rows < 2 || cols < 2) continue;
    const grid: Grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ""));
    for (const c of (t.cells as Json[] | undefined) ?? []) {
      const r = Number(c.rowIndex);
      const k = Number(c.columnIndex);
      if (r >= 0 && r < rows && k >= 0 && k < cols) grid[r]![k] = String(c.content ?? "").replace(/\s+/g, " ").trim();
    }
    grids.push(grid);
  }
  return grids;
}

/** Azure's markdown output draws tables as HTML (and adds comments such as PageBreak): keep only the words. */
export function plainText(content: string): string {
  return content
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/?(?:table|thead|tbody|tr|figure|figcaption)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ");
}

const pageCount = (result: Json): number => (Array.isArray(result.pages) ? result.pages.length : 0);

function checkPages(analysed: number, opts: AzureOptions) {
  const expected = opts.expectedPages ?? (opts.kind === "statement" ? 1 : undefined);
  if (expected && analysed > 0 && analysed < expected) {
    console.error(`Azure DI: only the first ${analysed} of ${expected} pages could be read; upgrade the Azure tier (the free F0 tier reads 2 pages per document).`);
    throw new AzureError(AZURE_TOO_LONG, 422);
  }
  if (!expected && analysed === 2) {
    console.warn("Azure DI: 2 pages analysed and the PDF's own page count is unknown; if the resource is on the free F0 tier longer PDFs are cut at 2 pages.");
  }
}

export const SCAN_UNRELIABLE =
  "We could not read this scan reliably. Try again with the page flat on a table, bright even light, and the page filling the frame. Or upload the CSV or Excel version from your bank.";
export const SCAN_NO_BALANCES = "We could not find the opening and closing balances on this statement, so the scan cannot be checked. Upload a CSV or Excel version.";

/**
 * Scanned statements are accepted only when the rows add up exactly to the opening and closing balance printed on the
 * statement. Anything else is refused, so wrong rows are never shown.
 */
function gate(r: AzureStatement): AzureStatement {
  if (r.opening === null || r.closing === null) throw new AzureError(SCAN_NO_BALANCES, 422, `Azure DI: refused, no printed balances (${r.model}, ${r.rows.length} rows)`);
  if (!reconcile(r.rows, r.opening, r.closing)) throw new AzureError(SCAN_UNRELIABLE, 422, `Azure DI: refused, ${r.rows.length} rows do not add up to ${r.opening} -> ${r.closing} (${r.model})`);
  return r;
}

export async function azureReadStatement(env: Env, base64: string, opts: AzureOptions = {}): Promise<AzureStatement> {
  return gate(await readUngated(env, base64, opts));
}

async function readUngated(env: Env, base64: string, opts: AzureOptions = {}): Promise<AzureStatement> {
  if (!azureConfigured(env)) throw new AzureError(UNAVAILABLE, 503, "Azure DI is not configured (AZURE_DI_ENDPOINT / AZURE_DI_KEY)");
  const budget = new Budget(opts.timeoutMs ?? TIMEOUT_MS, opts.pollMs ?? POLL_MS, opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms))));

  // Cheapest first (opt-in): the plain text read, through the same text-to-rows code as a text PDF, accepted only when its
  // rows add up to the printed balances. Anything else falls through to the statement model, so accuracy is unchanged.
  if (env.AZURE_READ_FIRST === "true" && opts.kind !== "statement") {
    const plain = await analyze(env, "prebuilt-read", base64, budget);
    checkPages(pageCount(plain), opts);
    const content = plainText(String(plain.content ?? ""));
    const read = content.trim() ? await parseExtractedDocument(content, []) : null;
    const opening = read?.verification?.opening ?? null;
    const closing = read?.verification?.closing ?? null;
    if (read && read.rows.length > 0 && opening !== null && closing !== null && reconcile(read.rows, opening, closing)) {
      const printed = statementTextMeta(content);
      return { rows: read.rows, opening, closing, warnings: read.warnings.filter((w) => !/^Checked:|do not add up/.test(w)), pages: pageCount(plain), model: "prebuilt-read", meta: printed.meta, metaKind: printed.kind };
    }
  }

  const bank = await analyze(env, "prebuilt-bankStatement.us", base64, budget);
  checkPages(pageCount(bank), opts);
  const parsed = fromBankModel(bank);
  const docConfidence = typeof (bank.documents as Json[] | undefined)?.[0]?.confidence === "number" ? (bank.documents as Json[])[0]!.confidence : 1;
  const { meta: bankMeta, ...bankRest } = parsed;
  const bankResult: AzureStatement = { ...bankRest, meta: bankMeta, metaKind: "bank_statement", pages: pageCount(bank), model: "prebuilt-bankStatement.us" };
  const bankAddsUp = parsed.opening !== null && parsed.closing !== null ? reconcile(parsed.rows, parsed.opening, parsed.closing) : null;
  if (parsed.rows.length > 0 && docConfidence >= 0.3 && bankAddsUp !== false) return bankResult;

  // The statement model found nothing, was unsure, or its rows do not add up to the printed balances (typical for a
  // skewed photo, where amounts slide out of line): read the tables with the layout model instead. Its running-balance
  // column lets the shared reader recover each amount from the balances.
  const hadBankRows = parsed.rows.length > 0 && docConfidence >= 0.3;
  let layoutResult: AzureStatement | null = null;
  try {
    layoutResult = await readLayout(env, base64, budget, opts);
  } catch (e) {
    if (!hadBankRows || (e instanceof AzureError && e.status !== 422)) throw e; // keep the statement model's rows (the browser warns that they do not add up)
  }
  if (layoutResult && hadBankRows) {
    const opening = layoutResult.opening ?? parsed.opening;
    const closing = layoutResult.closing ?? parsed.closing;
    if (opening !== null && closing !== null && reconcile(layoutResult.rows, opening, closing)) return { ...layoutResult, opening, closing };
    return bankResult;
  }
  if (!layoutResult) throw new AzureError("No transactions could be found in this document. Upload a CSV or Excel version.", 422, "Azure DI: no transactions found");
  return layoutResult;
}

async function readLayout(env: Env, base64: string, budget: Budget, opts: AzureOptions): Promise<AzureStatement> {
  const layout = await analyze(env, "prebuilt-layout", base64, budget, "&outputContentFormat=markdown");
  const pages = pageCount(layout);
  checkPages(pages, opts);
  const content = plainText(String(layout.content ?? ""));
  const read = await parseExtractedDocument(content, gridsOf(layout));
  if (read.rows.length === 0) throw new AzureError("No transactions could be found in this document. Upload a CSV or Excel version.", 422, "Azure DI: layout fallback found no transactions");
  const printed = statementTextMeta(content);
  return {
    meta: printed.meta,
    metaKind: printed.kind,
    rows: read.rows,
    opening: read.verification?.opening ?? null,
    closing: read.verification?.closing ?? null,
    // The browser re-checks the balances itself; pass on only the reader's own notes.
    warnings: read.warnings.filter((w) => !/^Checked:|do not add up/.test(w)),
    pages,
    model: "prebuilt-layout",
  };
}

/** One Azure analysis (any prebuilt model) with the same auth, polling, subrequest budget and page-count check. */
export async function azureAnalyze(env: Env, model: string, base64: string, opts: AzureOptions = {}, query = ""): Promise<Json> {
  if (!azureConfigured(env)) throw new AzureError(UNAVAILABLE, 503, "Azure DI is not configured (AZURE_DI_ENDPOINT / AZURE_DI_KEY)");
  const budget = new Budget(opts.timeoutMs ?? TIMEOUT_MS, opts.pollMs ?? POLL_MS, opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms))));
  const result = await analyze(env, model, base64, budget, query);
  checkPages(pageCount(result), opts);
  return result;
}
