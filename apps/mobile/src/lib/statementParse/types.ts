import type { ColumnMapping, Grid, ParsedRow } from "./statement";

/** The document formats the reader accepts (a subset of what anydoc can open). */
export type DocFormat = "csv" | "xlsx" | "ods" | "pdf" | "docx" | "odt" | "doc" | "rtf" | (string & {});

// The slice of anydoc's document model the reader uses. anydoc's own types are a superset, so its
// output can be passed straight in.
export type DocInline = { kind: string; text?: string; content?: DocInline[] };
export type DocBlock = {
  kind: string;
  content?: DocInline[];
  list?: { items: { blocks: DocBlock[] }[] };
  table?: { kind: string; grid: { kind: string; cell?: { blocks: DocBlock[] } }[][] };
  blocks?: DocBlock[];
};
export type DocShape = { blocks: DocBlock[] };

/** Reads documents. Production: anydoc WASM in the browser. Tests: anydoc WASM in workerd. */
export interface DocEngine {
  detectFormat(bytes: Uint8Array): DocFormat | undefined;
  formatForExtension(ext: string): DocFormat | undefined;
  toDocument(bytes: Uint8Array, format: DocFormat): DocShape;
  toMarkdown(bytes: Uint8Array, format: DocFormat): string;
}

/** The only places a statement can cost AI money. Each call goes to the API, which enforces plan and daily cap. */
export interface StatementAi {
  mapColumns(grid: Grid): Promise<ColumnMapping | null>;
  extractRows(text: string): Promise<{ rows: ParsedRow[]; calls: number; truncated: boolean }>;
  ocrPdf(bytes: Uint8Array, opts?: OcrRequest): Promise<ParsedRow[] | OcrOutcome>;
}

/** What a scanned-PDF read returns: the rows, plus the opening and closing balance the model could read (to check the rows against). */
export type OcrOutcome = { rows: ParsedRow[]; opening?: number | null; closing?: number | null; warnings?: string[] };

/** "pdf" (default) or "statement" (a photo of a statement); pageCount is the PDF's real page count from our own parser. */
export type OcrRequest = { kind?: "pdf" | "statement"; mimeType?: string; pageCount?: number };

/** Remembers AI-assisted results by file hash so the same file is never paid for twice. */
export interface ResultCache {
  get(fileHash: string): Promise<unknown | null>;
  put(fileHash: string, fileName: string, result: unknown): Promise<void>;
}
