/**
 * Statement reader: bytes in, clean transactions out, with the least AI that works. Runs in the
 * user's browser (so reading a big Excel or PDF costs the server nothing) and in tests.
 *
 *   1. anydoc reads the file locally: free.
 *   2. Code finds the table, maps its columns by header or value shape, converts the rows: free.
 *   3. Only if that fails does it spend AI, cheapest first: ~14 rows to map columns, then chunked
 *      text extraction, then (scanned PDFs only) the PDF-capable model.
 *
 * The anydoc engine and the AI helper are passed in, so this file has no browser, React Native or
 * Cloudflare dependencies.
 */
import { type DocEngine, type DocFormat, type DocShape, type OcrOutcome, type StatementAi, type ResultCache } from "./types";
import { rowsFromFlowingText } from "./pdfText";
import { findStatementPeriod, parseAmount, parseDate, parseYearlessMonthDay } from "./normalize";
import { type Grid, type ParsedRow, type StatementPeriod, annotateRows, mapColumns, reconcile, rowsFromGrid } from "./statement";

export type { DocEngine, DocFormat, StatementAi, ResultCache } from "./types";
export type { ParsedRow } from "./statement";
export { defaultSelection } from "./statement";

export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_ROWS = 5000;
export const MAX_OCR_PAGES = 10;
const MAX_OCR_BYTES = 10 * 1024 * 1024;
const CONFIDENT = 0.8;
export const TEXT_CHUNK_CHARS = 12_000;
export const MAX_AI_CHUNKS = 15;

/**
 * Scanned or photographed statements are NOT read by AI for now: in testing the model returned invented rows for them,
 * and wrong rows in a finance app are worse than none. Flip this on only after real-world accuracy checks pass.
 */
export const scannedPdfOcr = { enabled: false };

export type ParseStatus = "ok" | "needs_ocr" | "unreadable" | "unsupported" | "too_large" | "document";

export type ParseResult = {
  status: ParseStatus;
  fileType: string | null;
  rows: ParsedRow[];
  /** Rows found before the MAX_ROWS cap. */
  totalRows: number;
  truncated: boolean;
  /** "heuristic" means no AI was used at all. */
  source: "heuristic" | "ai";
  aiCalls: number;
  warnings: string[];
  message?: string;
  needsOcr?: { pages: number[]; pageCount: number };
  /** Do the rows add up to the statement's own opening and closing balance? Set only when the file prints both. */
  verification?: { opening: number; closing: number; ok: boolean };
  /** status "document": the text of an invoice or receipt PDF, to be read as one transaction instead of a statement. */
  documentText?: string;
  sheets?: { name: string; rows: number }[];
};

export type StatementResult = ParseResult & { fileHash: string; fileName: string; cached: boolean };

const SUPPORTED: DocFormat[] = ["csv", "xlsx", "ods", "pdf", "docx", "odt", "doc", "rtf"];
const TABULAR: DocFormat[] = ["csv", "xlsx", "ods", "docx", "odt", "doc", "rtf"];

type NamedGrid = { name: string; grid: Grid };

const inlineText = (inlines: DocShape["blocks"][number]["content"]): string =>
  (inlines ?? []).map((i) => (i.kind === "text" ? (i.text ?? "") : i.kind === "link" ? inlineText(i.content) : i.kind === "lineBreak" ? " " : "")).join("");

/** Data tables of a document, each labelled with the heading (Excel sheet name) above it. */
export function tablesOf(doc: DocShape): NamedGrid[] {
  const out: NamedGrid[] = [];
  let heading = "";
  for (const b of doc.blocks) {
    if (b.kind === "heading") heading = inlineText(b.content).trim();
    if (b.kind !== "table" || !b.table || b.table.kind !== "data") continue;
    const grid = b.table.grid.map((row) =>
      row.map((slot) => {
        if (slot.kind !== "origin" || !slot.cell) return "";
        return slot.cell.blocks.map((cb) => inlineText(cb.content)).join(" ").replace(/\s+/g, " ").trim();
      }),
    );
    out.push({ name: heading || `Table ${out.length + 1}`, grid });
  }
  return out;
}

/** All paragraph-like text of a document, for files that are prose rather than tables. */
function plainText(doc: DocShape): string {
  const parts: string[] = [];
  const walk = (blocks: DocShape["blocks"]) => {
    for (const b of blocks) {
      if (b.kind === "paragraph" || b.kind === "heading") parts.push(inlineText(b.content));
      if (b.kind === "list") b.list?.items.forEach((it) => walk(it.blocks));
      if (b.kind === "blockQuote" && b.blocks) walk(b.blocks);
    }
  };
  walk(doc.blocks);
  return parts.join(" ");
}

/** Pipe tables inside Markdown text (what anydoc emits for PDFs that have table structure). */
export function gridsFromMarkdown(md: string): Grid[] {
  const grids: Grid[] = [];
  let cur: Grid = [];
  for (const line of md.split(/\r?\n/)) {
    const t = line.trim();
    if (t.startsWith("|") && t.endsWith("|")) {
      if (/^\|[\s:|-]+\|$/.test(t)) continue; // the --- separator row
      cur.push(t.slice(1, -1).split("|").map((c) => c.trim()));
    } else if (cur.length) {
      grids.push(cur);
      cur = [];
    }
  }
  if (cur.length) grids.push(cur);
  return grids;
}

/** Split long text into pieces of at most `size` characters, cutting on spaces. */
export function chunkText(text: string, size = TEXT_CHUNK_CHARS, maxChunks = MAX_AI_CHUNKS): { chunks: string[]; truncated: boolean } {
  const flat = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  let start = 0;
  while (start < flat.length && chunks.length < maxChunks) {
    let end = Math.min(flat.length, start + size);
    if (end < flat.length) {
      const space = flat.lastIndexOf(" ", end);
      if (space > start) end = space;
    }
    chunks.push(flat.slice(start, end).trim());
    start = end;
  }
  return { chunks, truncated: start < flat.length };
}

function looksLikeText(bytes: Uint8Array): boolean {
  const head = bytes.subarray(0, Math.min(bytes.length, 2048));
  return head.length > 0 && !head.includes(0);
}

function pickFormat(engine: DocEngine, bytes: Uint8Array, fileName: string): DocFormat | undefined {
  const ext = fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : "";
  const byExt = ext ? engine.formatForExtension(ext) : undefined;
  const bySignature = engine.detectFormat(bytes);
  if (byExt === "csv" || ext === "tsv" || ext === "txt") return looksLikeText(bytes) ? "csv" : undefined;
  // Trust the file's contents over its name: a CSV saved as ".xlsx" (or the reverse) still opens.
  return bySignature ?? (looksLikeText(bytes) && (!byExt || byExt === "xlsx" || byExt === "ods") ? "csv" : byExt);
}

const base = (over: Partial<ParseResult>): ParseResult => ({
  status: "unreadable",
  fileType: null,
  rows: [],
  totalRows: 0,
  truncated: false,
  source: "heuristic",
  aiCalls: 0,
  warnings: [],
  ...over,
});

function finish(r: ParseResult): ParseResult {
  const totalRows = r.rows.length;
  const rows = totalRows > MAX_ROWS ? r.rows.slice(0, MAX_ROWS) : r.rows;
  const annotated = annotateRows(rows);
  const warnings = [...r.warnings, ...annotated.warnings];
  if (totalRows > MAX_ROWS) warnings.push(`This file has ${totalRows} rows; the first ${MAX_ROWS} were read. Split the file to import the rest.`);
  return { ...r, rows: annotated.rows, totalRows, truncated: totalRows > MAX_ROWS, warnings, status: rows.length ? "ok" : r.status === "ok" ? "unreadable" : r.status };
}

export type ParseOptions = {
  fileName: string;
  engine: DocEngine;
  /** Omit to forbid any AI use. A helper that refuses (plan, daily cap) just makes the file "unreadable". */
  ai?: StatementAi;
};

const errText = (e: unknown) => (e instanceof Error ? e.message : "error");

async function fromTables(tables: NamedGrid[], opts: ParseOptions, fileType: string, period: StatementPeriod | null = null): Promise<ParseResult & { balanceCheck?: { checked: number; agreed: number } }> {
  const warnings: string[] = [];
  const rows: ParsedRow[] = [];
  let checked = 0;
  let agreed = 0;
  const sheets: { name: string; rows: number }[] = [];
  let aiCalls = 0;
  let usedAi = false;
  let aiNote = "";

  for (const t of tables) {
    let mapping = mapColumns(t.grid);
    if (!mapping && opts.ai && t.grid.length >= 2) {
      try {
        mapping = await opts.ai.mapColumns(t.grid);
        aiCalls++;
        usedAi = usedAi || mapping !== null;
      } catch (e) {
        aiNote = errText(e);
        warnings.push(`AI helper unavailable: ${aiNote}`);
      }
    }
    if (!mapping) continue;
    const res = rowsFromGrid(t.grid, mapping, { period });
    if (res.rows.length === 0) continue;
    rows.push(...res.rows);
    checked += res.balanceCheck?.checked ?? 0;
    agreed += res.balanceCheck?.agreed ?? 0;
    sheets.push({ name: t.name, rows: res.rows.length });
    warnings.push(...res.warnings.map((w) => (tables.length > 1 ? `${t.name}: ${w}` : w)));
  }
  if (tables.length > 1 && sheets.length < tables.length) warnings.push(`${tables.length - sheets.length} sheet(s) had no transactions and were skipped.`);

  const result = base({ fileType, rows, warnings, aiCalls, sheets, source: usedAi ? "ai" : "heuristic" });
  if (rows.length === 0) {
    const hasBody = tables.some((t) => t.grid.slice(1).some((r) => r.some((c) => String(c ?? "").trim())));
    if (!hasBody) result.message = "This file has a header row but no transactions in it.";
    else result.message = opts.ai && !aiNote
      ? "Could not find a table of transactions in this file."
      : "Could not tell which columns are the date and amount. Use a file with headers such as Date, Description and Amount.";
  }
  return { ...finish(result), ...(checked > 0 ? { balanceCheck: { checked, agreed } } : {}) };
}

const cellText = (c: unknown) => String(c ?? "").replace(/\s+/g, " ").trim();

/** A statement table that runs over several pages arrives as several tables: join the ones that continue each other. */
export function mergePageTables(grids: Grid[]): Grid[] {
  const out: Grid[] = [];
  for (const g of grids) {
    const last = out[out.length - 1];
    const width = g[0]?.length ?? 0;
    if (last && width > 2 && (last[0]?.length ?? 0) === width) {
      const sameHeader = g[0]!.map(cellText).join("|").toLowerCase() === last[0]!.map(cellText).join("|").toLowerCase();
      const startsWithDate = parseDate(cellText(g[0]![0])) !== null || parseYearlessMonthDay(cellText(g[0]![0])) !== null;
      if (sameHeader || startsWithDate) {
        last.push(...(sameHeader ? g.slice(1) : g));
        continue;
      }
    }
    out.push(g.map((r) => [...r]));
  }
  return out;
}

/** Opening and closing balance as printed in a statement's summary box. */
export function findStatementBalances(text: string): { opening: number; closing: number } | null {
  const flat = text.replace(/\s+/g, " ");
  const num = String.raw`[^0-9-]{0,24}(-?\$?\s?-?[0-9][0-9,]*\.[0-9]{2})`;
  const o = new RegExp(String.raw`(?:beginning|opening|previous|starting)\s+balance` + num, "i").exec(flat);
  const c = new RegExp(String.raw`(?:ending|closing|new)\s+balance` + num, "i").exec(flat);
  if (!o || !c) return null;
  const opening = parseAmount(o[1]);
  const closing = parseAmount(c[1]);
  return opening === null || closing === null ? null : { opening, closing };
}

/** Rows that agree with the statement's own balances are very likely complete and right; rows that do not are worth a warning. */
function withVerification(result: ParseResult, text: string): ParseResult {
  if (result.rows.length === 0) return result;
  const bal = findStatementBalances(text);
  if (!bal) return result;
  const ok = reconcile(result.rows, bal.opening, bal.closing);
  const warnings = [...result.warnings];
  warnings.push(
    ok
      ? "Checked: these transactions add up exactly to the opening and closing balance printed on the statement."
      : `These transactions do not add up to the statement's balances (opening ${bal.opening.toFixed(2)}, closing ${bal.closing.toFixed(2)}). Some rows may be missing or wrong, so check them carefully before importing.`,
  );
  return { ...result, warnings, verification: { ...bal, ok } };
}

async function fromText(text: string, opts: ParseOptions, fileType: string, grids?: Grid[]): Promise<ParseResult> {
  return withVerification(await fromTextRows(text, opts, fileType, grids), text);
}

async function fromTextRows(text: string, opts: ParseOptions, fileType: string, grids?: Grid[]): Promise<ParseResult> {
  const warnings: string[] = [];
  const period = findStatementPeriod(text);
  const tables = mergePageTables(grids ?? gridsFromMarkdown(text)).map((grid, i) => ({ name: `Table ${i + 1}`, grid }));
  const flowing = rowsFromFlowingText(text);
  let viaTables: Awaited<ReturnType<typeof fromTables>> | null = null;
  if (tables.length) {
    viaTables = await fromTables(tables, opts, fileType, period);
    if (viaTables.rows.length) {
      const bc = viaTables.balanceCheck;
      const balanceDisagrees = !!bc && bc.checked >= 5 && bc.agreed / bc.checked < 0.8;
      // The text has far more dated lines than rows were found (the table was only partly understood).
      const missedRows = flowing.dateCount >= 8 && viaTables.rows.length < (flowing.dateCount - 4) * 0.8;
      if (!balanceDisagrees && !missedRows) return viaTables;
      warnings.push(...viaTables.warnings);
    }
  }
  if (!viaTables?.rows.length) {
    warnings.push(...flowing.warnings);
    if (flowing.confidence >= CONFIDENT) return finish(base({ fileType, rows: flowing.rows, warnings }));
  }
  const fallbackRows = viaTables?.rows.length ? viaTables.rows : flowing.rows;

  let aiRefused = false;
  if (opts.ai) {
    try {
      const ai = await opts.ai.extractRows(text);
      // Trust the model only if it found at least as many rows as the splitter did.
      if (ai.rows.length >= fallbackRows.length * 0.8 && ai.rows.length > 0) {
        const w = [...warnings, ...(ai.truncated ? ["The file was long; only the first part was read by the AI helper."] : [])];
        return finish(base({ fileType, rows: ai.rows, warnings: w, aiCalls: ai.calls, source: "ai" }));
      }
    } catch (e) {
      aiRefused = true;
      warnings.push(`AI helper unavailable: ${errText(e)}`);
    }
  }
  if (fallbackRows.length && (!opts.ai || aiRefused)) {
    warnings.push("Low confidence: please check these rows carefully before importing them.");
  }
  const result = base({ fileType, rows: fallbackRows, warnings });
  if (!fallbackRows.length) result.message = "Could not find transactions in this document.";
  return finish(result);
}

/** An invoice, bill or receipt (one purchase with line items and a total), as opposed to a statement (many dated transactions). */
export function looksLikeInvoice(text: string): boolean {
  const t = text.slice(0, 20000);
  const statement = /(?:beginning|opening|previous|ending|closing)\s+balance|statement\s+period|account\s+activity|transactions?\s+for\s+the\s+period/i;
  if (statement.test(t)) return false;
  const signals = [/\binvoice\b/i, /bill\s+to/i, /due\s+date|payment\s+terms|net\s+\d{1,3}/i, /amount\s+due|balance\s+due|total\s+due/i, /sub-?total/i, /purchase\s+order|PO\s*(?:#|number)/i, /invoice\s*(?:#|no|number)/i];
  return /\binvoice\b/i.test(t) && signals.filter((re) => re.test(t)).length >= 3;
}

/** A scanned statement read by the OCR service, checked against the balances it printed. */
function scannedResult(out: ParsedRow[] | OcrOutcome, fileType: string, needsOcr?: ParseResult["needsOcr"]): ParseResult {
  const rows = Array.isArray(out) ? out : out.rows;
  const warnings = [`This is a ${fileType === "pdf" ? "scanned PDF" : "photo"}, so it was read by text recognition. Check every row against your statement.`];
  if (!Array.isArray(out) && out.warnings) warnings.push(...out.warnings);
  let verification: ParseResult["verification"];
  if (!Array.isArray(out) && typeof out.opening === "number" && typeof out.closing === "number" && rows.length > 0) {
    const ok = reconcile(rows, out.opening, out.closing);
    verification = { opening: out.opening, closing: out.closing, ok };
    warnings.push(
      ok
        ? "Checked: these transactions add up exactly to the opening and closing balance on the scan."
        : `These transactions do NOT add up to the balances on the scan (opening ${out.opening.toFixed(2)}, closing ${out.closing.toFixed(2)}), so rows are missing or misread. Do not import without checking, or upload the CSV/Excel version from your bank.`,
    );
  } else if (rows.length > 0) {
    warnings.push("The scan has no balances to check the rows against, so every row needs a look.");
  }
  return finish(base({ fileType, rows, aiCalls: 1, source: "ai", ...(needsOcr ? { needsOcr } : {}), warnings, ...(verification ? { verification } : {}) }));
}

/** A photo (png / jpeg) of a multi-row statement, read as a statement rather than as one receipt. Used by the phone. */
export async function readStatementPhoto(bytes: Uint8Array, mimeType: string, ai: StatementAi): Promise<ParseResult> {
  if (bytes.length > MAX_OCR_BYTES) return base({ status: "too_large", message: "Photos up to 10 MB are supported. Take the photo again at a lower quality." });
  try {
    return scannedResult(await ai.ocrPdf(bytes, { kind: "statement", mimeType }), "image");
  } catch (e) {
    return base({ status: "unreadable", fileType: "image", message: errText(e) });
  }
}

/** A PDF read on the server, for devices that cannot run the text reader (the phone). The page count is unknown here. */
export async function readPdfOnServer(bytes: Uint8Array, ai: StatementAi): Promise<ParseResult> {
  if (bytes.length > MAX_OCR_BYTES) return base({ status: "too_large", message: "PDFs up to 10 MB are supported on the phone. Upload a CSV or Excel version." });
  try {
    return scannedResult(await ai.ocrPdf(bytes, { kind: "pdf" }), "pdf");
  } catch (e) {
    return base({ status: "unreadable", fileType: "pdf", message: errText(e) });
  }
}

export async function parseStatement(bytes: Uint8Array, opts: ParseOptions): Promise<ParseResult> {
  if (bytes.length > MAX_FILE_BYTES) {
    return base({ status: "too_large", message: `Files up to ${MAX_FILE_BYTES / 1024 / 1024} MB are supported. Split the file or export a smaller date range.` });
  }
  if (bytes.length === 0 || (looksLikeText(bytes) && bytes.length < 4096 && !new TextDecoder().decode(bytes).trim())) {
    return base({ status: "unreadable", message: "This file is empty. Choose a file that has your transactions in it." });
  }
  if (/\.(xls|xlsb)$/i.test(opts.fileName)) {
    return base({
      status: "unsupported",
      message: "Old Excel files (.xls) are not supported. Open it in Excel and save as .xlsx, then upload again.",
    });
  }
  const fmt = pickFormat(opts.engine, bytes, opts.fileName);
  if (!fmt && /\.(csv|tsv|txt)$/i.test(opts.fileName)) {
    return base({ status: "unreadable", message: "This file is named like a text or CSV file but contains binary data, so it cannot be a statement. Check that it is not damaged or renamed." });
  }
  if (!fmt || !SUPPORTED.includes(fmt)) {
    return base({ status: "unsupported", message: "This file type is not supported. Use Excel (.xlsx), CSV or PDF." });
  }

  try {
    if (TABULAR.includes(fmt)) {
      const doc = opts.engine.toDocument(bytes, fmt);
      const tables = tablesOf(doc);
      if (tables.length) return await fromTables(tables, opts, fmt);
      return await fromText(plainText(doc), opts, fmt);
    }
    const markdown = opts.engine.toMarkdown(bytes, "pdf");
    if (looksLikeInvoice(markdown)) {
      return base({
        status: "document",
        fileType: "pdf",
        documentText: markdown,
        message: "This looks like an invoice or bill rather than a statement, so it is read as one transaction (its total).",
      });
    }
    return await fromText(markdown, opts, "pdf");
  } catch (e) {
    const err = e as Error & { code?: string; pages?: number[]; pageCount?: number };
    if (err.code === "needsOcr") {
      const needsOcr = { pages: err.pages ?? [], pageCount: err.pageCount ?? 0 };
      if (scannedPdfOcr.enabled && opts.ai && needsOcr.pageCount > 0 && needsOcr.pageCount <= MAX_OCR_PAGES && bytes.length <= MAX_OCR_BYTES) {
        try {
          const out = await opts.ai.ocrPdf(bytes, { kind: "pdf", pageCount: needsOcr.pageCount });
          return scannedResult(out, "pdf", needsOcr);
        } catch (ocrError) {
          return base({ status: "needs_ocr", fileType: "pdf", needsOcr, message: errText(ocrError) });
        }
      }
      const tooLong = needsOcr.pageCount > MAX_OCR_PAGES;
      return base({
        status: "needs_ocr",
        fileType: "pdf",
        needsOcr,
        message: tooLong
          ? `This PDF is scanned and has ${needsOcr.pageCount} pages (the limit for scanned PDFs is ${MAX_OCR_PAGES}). Download the statement as Excel/CSV from your bank, or split the PDF.`
          : "This PDF is a scan or photo of a statement, which we cannot read reliably yet. Download the statement from your bank as a CSV or Excel file (or the regular PDF, not a scan) and upload that instead.",
      });
    }
    const message =
      err.code === "encrypted" ? "This file is password protected. Remove the password and upload it again."
      : err.code === "resourceLimit" ? "This file is too complex to read safely."
      : "Could not read this file. Make sure it is not damaged.";
    return base({ status: "unreadable", fileType: fmt, message });
  }
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as unknown as ArrayBuffer);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * The entry point apps use: hashes the file, serves a saved AI result if this exact file was read
 * before (so it is never paid for twice), otherwise parses, and saves the result when AI was used.
 */
export async function readStatement(
  bytes: Uint8Array,
  opts: ParseOptions & { cache?: ResultCache; refresh?: boolean },
): Promise<StatementResult> {
  const fileHash = await sha256Hex(bytes);
  if (opts.cache && !opts.refresh) {
    try {
      const hit = await opts.cache.get(fileHash);
      if (hit) return { ...(hit as ParseResult), fileHash, fileName: opts.fileName, cached: true };
    } catch {
      /* a cache outage must never block an import */
    }
  }
  const result = await parseStatement(bytes, opts);
  if (opts.cache && result.status === "ok" && result.source === "ai") {
    try {
      await opts.cache.put(fileHash, opts.fileName, result);
    } catch {
      /* best effort */
    }
  }
  return { ...result, fileHash, fileName: opts.fileName, cached: false };
}

/** A table the caller already has (e.g. a CSV read on the phone): same column mapping and row conversion as every other file type. */
export async function parseGrid(grid: Grid, fileType: string, ai?: StatementAi): Promise<ParseResult> {
  const opts: ParseOptions = { fileName: `statement.${fileType}`, engine: null as unknown as DocEngine, ai };
  return fromTables([{ name: "Table 1", grid }], opts, fileType);
}

/**
 * Text and tables an OCR service already recognised (Azure layout), through the same rules as a text PDF:
 * signs, US dates, total lines, multi-page tables and the opening/closing balance check. No AI is used.
 */
export async function parseExtractedDocument(text: string, grids: Grid[]): Promise<ParseResult> {
  return fromText(text, { fileName: "scan.pdf", engine: null as unknown as DocEngine }, "pdf", grids);
}
