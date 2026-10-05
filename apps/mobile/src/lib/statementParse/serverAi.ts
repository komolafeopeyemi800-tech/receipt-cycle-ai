import { MAX_AI_CHUNKS, TEXT_CHUNK_CHARS, chunkText } from "./pipeline";
import type { ColumnMapping, Grid, ParsedRow } from "./statement";
import type { ResultCache, StatementAi } from "./types";

/** The three AI calls the API exposes. In the apps this is the HTTP client; in tests it can call the Worker directly. */
export interface AiTransport {
  mapColumns(grid: Grid): Promise<ColumnMapping | null>;
  extractChunk(text: string): Promise<ParsedRow[]>;
  ocrPdf(pdfBase64: string): Promise<ParsedRow[]>;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

/** Builds the `StatementAi` the reader needs: long text is split into pieces and sent piece by piece. */
export function createStatementAi(transport: AiTransport): StatementAi {
  return {
    mapColumns: (grid) => transport.mapColumns(grid),
    async extractRows(text) {
      const { chunks, truncated } = chunkText(text, TEXT_CHUNK_CHARS, MAX_AI_CHUNKS);
      const rows: ParsedRow[] = [];
      for (const chunk of chunks) rows.push(...(await transport.extractChunk(chunk)));
      return { rows, calls: chunks.length, truncated };
    },
    ocrPdf: (bytes) => transport.ocrPdf(bytesToBase64(bytes)),
  };
}

/** The cache the API keeps for AI-assisted results (GET/PUT /api/uploads/cache). */
export interface CacheTransport {
  get(hash: string): Promise<unknown | null>;
  put(hash: string, fileName: string, result: unknown): Promise<void>;
}
export const createResultCache = (t: CacheTransport): ResultCache => ({ get: t.get, put: t.put });
