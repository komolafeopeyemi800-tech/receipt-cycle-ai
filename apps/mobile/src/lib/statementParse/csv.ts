/**
 * CSV text to a table, with no WebAssembly: this is what lets the phone read a CSV with the same column
 * mapping, sign, date and total-row rules as the web reader (see pipeline.ts / statement.ts).
 */
import { type ParseResult, parseGrid } from "./pipeline";
import type { Grid } from "./statement";
import type { StatementAi } from "./types";

const DELIMS = [",", ";", "\t", "|"] as const;

/** The delimiter that splits the first lines into the most (and most consistent) columns, ignoring quoted text. */
export function detectDelimiter(text: string): string {
  const lines = text.split(/\r?\n/).filter((l) => l.trim()).slice(0, 12);
  let best = ",";
  let bestScore = 0;
  for (const d of DELIMS) {
    const counts = lines.map((l) => {
      let n = 0;
      let q = false;
      for (const ch of l) {
        if (ch === '"') q = !q;
        else if (ch === d && !q) n++;
      }
      return n;
    });
    const min = Math.min(...counts, Infinity);
    const score = Number.isFinite(min) ? min : 0;
    if (score > bestScore) {
      best = d;
      bestScore = score;
    }
  }
  return best;
}

/** RFC 4180 style: quoted fields, doubled quotes, line breaks inside quotes. */
export function csvToGrid(input: string): Grid {
  const text = input.replace(/^\uFEFF/, "");
  const delim = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (q) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else q = false;
      } else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === delim) {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim());
      cell = "";
      rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell.length || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c));
}

const base = (message: string): ParseResult => ({ status: "unreadable", fileType: "csv", rows: [], totalRows: 0, truncated: false, source: "heuristic", aiCalls: 0, warnings: [], message });

/** A whole CSV file's text to transactions. `ai` is optional and only used when the columns cannot be worked out from the file. */
export async function parseCsvText(text: string, ai?: StatementAi): Promise<ParseResult> {
  if (!text.trim()) return base("This file is empty. Choose a file that has your transactions in it.");
  if (/[\u0000]/.test(text.slice(0, 2048))) return base("This file contains binary data, so it cannot be a CSV statement. Check that it is not damaged or renamed.");
  const grid = csvToGrid(text);
  if (grid.length < 2) return base("This file has a header but no transactions in it.");
  return parseGrid(grid, "csv", ai);
}
