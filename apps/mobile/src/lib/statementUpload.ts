import type { StatementRow } from "./api/types";

/** File types the server can read into transactions. */
export const STATEMENT_EXTENSIONS = ["csv", "xlsx", "ods", "pdf", "docx", "odt"] as const;

export function isStatementFile(name: string): boolean {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  return (STATEMENT_EXTENSIONS as readonly string[]).includes(ext) || ext === "xls" || ext === "xlsb"; // xls: the server explains how to convert
}

/** The server accepts 500 rows per import call; bigger files go up in several calls. */
export const IMPORT_CHUNK = 500;

export async function importInChunks(
  rows: StatementRow[],
  importChunk: (chunk: StatementRow[]) => Promise<{ inserted: number }>,
  onProgress?: (done: number, total: number) => void,
): Promise<{ inserted: number }> {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += IMPORT_CHUNK) {
    const res = await importChunk(rows.slice(i, i + IMPORT_CHUNK));
    inserted += res.inserted;
    onProgress?.(Math.min(i + IMPORT_CHUNK, rows.length), rows.length);
  }
  return { inserted };
}

/** One-line summary for the result message, e.g. "Read with the AI helper (1 call). Already read before." */
export function describeParse(r: { source: "heuristic" | "ai"; aiCalls: number; cached: boolean; warnings: string[] }): string {
  const parts: string[] = [];
  if (r.cached) parts.push("Read from your earlier upload of this file.");
  else if (r.source === "ai") parts.push(`Read with the AI helper (${r.aiCalls} call${r.aiCalls === 1 ? "" : "s"}).`);
  return [...parts, ...r.warnings].join(" ");
}
