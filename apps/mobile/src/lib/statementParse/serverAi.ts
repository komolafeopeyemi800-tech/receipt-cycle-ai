import { MAX_AI_CHUNKS, TEXT_CHUNK_CHARS, chunkText } from "./pipeline";
import type { ColumnMapping, Grid, ParsedRow } from "./statement";
import type { OcrOutcome, OcrRequest, ResultCache, StatementAi } from "./types";
import { findStatementPeriod } from "./normalize";

/** The three AI calls the API exposes. In the apps this is the HTTP client; in tests it can call the Worker directly. */
export interface AiTransport {
  mapColumns(grid: Grid): Promise<ColumnMapping | null>;
  extractChunk(text: string): Promise<ParsedRow[]>;
  ocrPdf(pdfBase64: string, opts?: OcrRequest): Promise<ParsedRow[] | OcrOutcome>;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

/** The statement's year and its table headings, repeated at the top of every piece of text sent to the AI. */
export function chunkContext(text: string): string {
  const lines: string[] = [];
  const period = findStatementPeriod(text);
  if (period) lines.push(`Statement year: ${period.endYear}${period.startYear !== period.endYear ? ` (the period starts in ${period.startYear})` : ""}. Dates printed without a year use it.`);
  const header = text.split(/\r?\n/).find((l) => /^\s*\|?\s*(?:date|trans|posted|post)/i.test(l) && /(?:description|details|amount|debit|credit|withdraw|deposit|balance)/i.test(l));
  if (header) lines.push(`Column headings: ${header.replace(/\s+/g, " ").trim().slice(0, 200)}`);
  return lines.length ? `[Context for this piece of the statement. ${lines.join(" ")}]` : "";
}

/** Builds the `StatementAi` the reader needs: long text is split into pieces and sent piece by piece. */
export function createStatementAi(transport: AiTransport): StatementAi {
  return {
    mapColumns: (grid) => transport.mapColumns(grid),
    async extractRows(text) {
      const { chunks, truncated } = chunkText(text, TEXT_CHUNK_CHARS, MAX_AI_CHUNKS);
      const context = chunkContext(text);
      const rows: ParsedRow[] = [];
      // Every piece carries the statement year and column headings: a later piece would otherwise have neither.
      for (const [i, chunk] of chunks.entries()) rows.push(...(await transport.extractChunk(i === 0 && !context ? chunk : `${context}
${chunk}`)));
      return { rows, calls: chunks.length, truncated };
    },
    ocrPdf: (bytes, opts) => transport.ocrPdf(bytesToBase64(bytes), opts),
  };
}

/** The cache the API keeps for AI-assisted results (GET/PUT /api/uploads/cache). */
export interface CacheTransport {
  get(hash: string): Promise<unknown | null>;
  put(hash: string, fileName: string, result: unknown): Promise<void>;
}
export const createResultCache = (t: CacheTransport): ResultCache => ({ get: t.get, put: t.put });
