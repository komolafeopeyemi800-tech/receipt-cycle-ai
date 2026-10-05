/**
 * Upload pipeline: bytes in, clean transactions out, with the least AI that works.
 *
 *   1. anydoc reads the file (Excel, CSV, Word, PDF text) locally in the Worker: free.
 *   2. Code finds the table, maps its columns by header or value shape, converts the rows: free.
 *   3. Only if that fails does it spend AI, in this order of cost: ~12 rows to map columns,
 *      then chunked text extraction, then (scanned PDFs only) the PDF-capable model.
 */
import type { Env } from "../types";
import { aiExtractRows, aiMapColumns, aiOcrPdf } from "./ai";
import { type Document, type Format, detectFormat, formatForExtension, toDoc, toMarkdown } from "./anydoc";
import { rowsFromFlowingText } from "./pdfText";
import { type Grid, type ParsedRow, mapColumns, rowsFromGrid } from "./statement";

export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_ROWS = 5000;
export const MAX_OCR_PAGES = 10;
const MAX_OCR_BYTES = 10 * 1024 * 1024;
const CONFIDENT = 0.8;

export type ParseStatus = "ok" | "needs_ocr" | "unreadable" | "unsupported" | "too_large";

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
  sheets?: { name: string; rows: number }[];
};

const SUPPORTED: Format[] = ["csv", "xlsx", "ods", "pdf", "docx", "odt", "doc", "rtf"];
const TABULAR: Format[] = ["csv", "xlsx", "ods", "docx", "odt", "doc", "rtf"];

type NamedGrid = { name: string; grid: Grid };

const inlineText = (inlines: Document["blocks"][number]["content"]): string =>
  (inlines ?? []).map((i) => (i.kind === "text" ? (i.text ?? "") : i.kind === "link" ? inlineText(i.content) : i.kind === "lineBreak" ? " " : "")).join("");

/** Data tables of a document, each labelled with the heading (Excel sheet name) above it. */
export function tablesOf(doc: Document): NamedGrid[] {
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
function plainText(doc: Document): string {
  const parts: string[] = [];
  const walk = (blocks: Document["blocks"]) => {
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

function looksLikeText(bytes: Uint8Array): boolean {
  const head = bytes.subarray(0, Math.min(bytes.length, 2048));
  return head.length > 0 && !head.includes(0);
}

function pickFormat(bytes: Uint8Array, fileName: string): Format | undefined {
  const ext = fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : "";
  const byExt = ext ? formatForExtension(ext) : undefined;
  const bySignature = detectFormat(bytes);
  if (byExt === "csv" || ext === "tsv" || ext === "txt") return "csv";
  return bySignature ?? byExt ?? (looksLikeText(bytes) ? "csv" : undefined);
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
  const warnings = [...r.warnings];
  if (totalRows > MAX_ROWS) warnings.push(`This file has ${totalRows} rows; the first ${MAX_ROWS} were read. Split the file to import the rest.`);
  return { ...r, rows, totalRows, truncated: totalRows > MAX_ROWS, warnings, status: rows.length ? "ok" : r.status === "ok" ? "unreadable" : r.status };
}

type Opts = { fileName: string; env: Env; allowAi: boolean };

async function fromTables(tables: NamedGrid[], opts: Opts, fileType: string): Promise<ParseResult> {
  const warnings: string[] = [];
  const rows: ParsedRow[] = [];
  const sheets: { name: string; rows: number }[] = [];
  let aiCalls = 0;
  let usedAi = false;

  for (const t of tables) {
    let mapping = mapColumns(t.grid);
    if (!mapping && opts.allowAi && t.grid.length >= 2) {
      try {
        mapping = await aiMapColumns(opts.env, t.grid);
        aiCalls++;
        usedAi = usedAi || mapping !== null;
      } catch (e) {
        warnings.push(`AI helper unavailable: ${e instanceof Error ? e.message : "error"}`);
      }
    }
    if (!mapping) continue;
    const res = rowsFromGrid(t.grid, mapping);
    if (res.rows.length === 0) continue;
    rows.push(...res.rows);
    sheets.push({ name: t.name, rows: res.rows.length });
    warnings.push(...res.warnings.map((w) => (tables.length > 1 ? `${t.name}: ${w}` : w)));
  }
  if (tables.length > 1 && sheets.length < tables.length) warnings.push(`${tables.length - sheets.length} sheet(s) had no transactions and were skipped.`);

  const result = base({ fileType, rows, warnings, aiCalls, sheets, source: usedAi ? "ai" : "heuristic" });
  if (rows.length === 0) {
    result.message = opts.allowAi
      ? "Could not find a table of transactions in this file."
      : "Could not tell which columns are the date and amount. Use a file with headers like Date, Description and Amount, or upgrade to let the AI helper read it.";
  }
  return finish(result);
}

async function fromText(text: string, opts: Opts, fileType: string): Promise<ParseResult> {
  const warnings: string[] = [];
  const tables = gridsFromMarkdown(text).map((grid, i) => ({ name: `Table ${i + 1}`, grid }));
  if (tables.length) {
    const viaTables = await fromTables(tables, opts, fileType);
    if (viaTables.rows.length) return viaTables;
  }

  const flowing = rowsFromFlowingText(text);
  warnings.push(...flowing.warnings);
  if (flowing.confidence >= CONFIDENT) return finish(base({ fileType, rows: flowing.rows, warnings }));

  if (opts.allowAi) {
    try {
      const ai = await aiExtractRows(opts.env, text);
      // Trust the model only if it found at least as many rows as the splitter did.
      if (ai.rows.length >= flowing.rows.length * 0.8 && ai.rows.length > 0) {
        const w = ai.truncated ? ["The file was long; only the first part was read by the AI helper."] : [];
        return finish(base({ fileType, rows: ai.rows, warnings: w, aiCalls: ai.calls, source: "ai" }));
      }
    } catch (e) {
      warnings.push(`AI helper unavailable: ${e instanceof Error ? e.message : "error"}`);
    }
  } else if (flowing.rows.length) {
    warnings.push("Low confidence: please check these rows. Upgrade or start a trial to let the AI helper double-check statements like this.");
  }
  const result = base({ fileType, rows: flowing.rows, warnings });
  if (!flowing.rows.length) result.message = "Could not find transactions in this document.";
  return finish(result);
}

export async function parseStatement(bytes: Uint8Array, opts: Opts): Promise<ParseResult> {
  if (bytes.length > MAX_FILE_BYTES) {
    return base({ status: "too_large", message: `Files up to ${MAX_FILE_BYTES / 1024 / 1024} MB are supported.` });
  }
  if (/\.(xls|xlsb)$/i.test(opts.fileName)) {
    return base({
      status: "unsupported",
      message: "Old Excel files (.xls) are not supported. Open it in Excel and save as .xlsx, then upload again.",
    });
  }
  const fmt = pickFormat(bytes, opts.fileName);
  if (!fmt || !SUPPORTED.includes(fmt)) {
    return base({ status: "unsupported", message: "This file type is not supported. Use Excel (.xlsx), CSV or PDF." });
  }

  try {
    if (TABULAR.includes(fmt)) {
      const doc = toDoc(bytes, fmt);
      const tables = tablesOf(doc);
      if (tables.length) return await fromTables(tables, opts, fmt);
      return await fromText(plainText(doc), opts, fmt);
    }
    // PDF
    return await fromText(toMarkdown(bytes, "pdf"), opts, "pdf");
  } catch (e) {
    const err = e as Error & { code?: string; pages?: number[]; pageCount?: number };
    if (err.code === "needsOcr") {
      const needsOcr = { pages: err.pages ?? [], pageCount: err.pageCount ?? 0 };
      if (opts.allowAi && needsOcr.pageCount > 0 && needsOcr.pageCount <= MAX_OCR_PAGES && bytes.length <= MAX_OCR_BYTES) {
        try {
          const rows = await aiOcrPdf(opts.env, bytes);
          return finish(base({ fileType: "pdf", rows, aiCalls: 1, source: "ai", needsOcr, warnings: ["This is a scanned PDF, so it was read with the AI helper. Please check the rows."] }));
        } catch (ocrError) {
          return base({ status: "needs_ocr", fileType: "pdf", needsOcr, message: `Could not read the scanned PDF: ${ocrError instanceof Error ? ocrError.message : "error"}` });
        }
      }
      const tooLong = needsOcr.pageCount > MAX_OCR_PAGES;
      return base({
        status: "needs_ocr",
        fileType: "pdf",
        needsOcr,
        message: tooLong
          ? `This PDF is scanned and has ${needsOcr.pageCount} pages (the limit for scanned PDFs is ${MAX_OCR_PAGES}). Download the statement as Excel/CSV from your bank, or split the PDF.`
          : opts.allowAi
            ? "This PDF is scanned. Try uploading photos of the pages with the camera scanner instead."
            : "This PDF is scanned (pictures of text). Reading it needs the AI helper: upgrade or start a trial, or upload an Excel/CSV version.",
      });
    }
    const message =
      err.code === "encrypted" ? "This file is password protected. Remove the password and upload it again."
      : err.code === "resourceLimit" ? "This file is too complex to read safely."
      : "Could not read this file. Make sure it is not damaged.";
    return base({ status: "unreadable", fileType: fmt, message });
  }
}
