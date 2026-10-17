/** Keeping the original uploaded file (and the details read from it) next to the imported transactions. */
import type { UploadFile } from "../api/types";
import { type DocKind, type DocMeta, buildStatementMeta, documentMeta } from "./docMeta";
import type { ParseResult } from "./pipeline";
import type { ParsedRow } from "./statement";

export const ORIGINAL_NOT_SAVED = "The original file could not be saved, but your transactions were imported.";

export type StoreDocument = (a: { file: UploadFile; fileName: string; kind: DocKind; meta: DocMeta }) => Promise<{ id: string; key: string }>;

/**
 * Uploads the original. Never throws: a failure to store the file must not block the import, so the caller gets
 * `key: null` and a short note to show instead.
 */
export async function storeOriginal(store: StoreDocument, file: UploadFile, fileName: string, kind: DocKind, meta: DocMeta): Promise<{ key: string | null; note: string | null }> {
  try {
    const out = await store({ file, fileName, kind, meta });
    return { key: out.key, note: null };
  } catch {
    return { key: null, note: ORIGINAL_NOT_SAVED };
  }
}

/** Kind and details of an imported statement file (what it prints, plus period, totals and count from the rows). */
export function statementDocument(parsed: Pick<ParseResult, "rows" | "warnings" | "printed" | "verification">, rows: ParsedRow[] = parsed.rows): { kind: DocKind; meta: DocMeta } {
  return buildStatementMeta({ rows, warnings: parsed.warnings, printed: parsed.printed, opening: parsed.verification?.opening ?? null, closing: parsed.verification?.closing ?? null });
}

/** Kind and details of a receipt or invoice read as one transaction. */
export function receiptDocument(extracted: Record<string, unknown> | null | undefined): { kind: DocKind; meta: DocMeta } {
  const isInvoice = extracted?.document_type === "invoice" || typeof extracted?.invoice_number === "string";
  return { kind: isInvoice ? "invoice" : "receipt", meta: documentMeta(extracted) };
}
