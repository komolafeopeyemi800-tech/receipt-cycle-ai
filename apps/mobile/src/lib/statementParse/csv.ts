/**
 * CSV text to a table, with no WebAssembly: this is what lets the phone read a CSV with the same column
 * mapping, sign, date and total-row rules as the web reader (see pipeline.ts / statement.ts).
 */
import { type ParseResult, parseGrid } from "./pipeline";
import type { Grid } from "./statement";
import type { StatementAi } from "./types";

const CP1252_HIGH = [
  0x20ac, 0x81, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152, 0x8d, 0x017d, 0x8f,
  0x90, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x9d, 0x017e, 0x0178,
];

function chunked(codes: ArrayLike<number>): string {
  let out = "";
  for (let i = 0; i < codes.length; i += 0x2000) out += String.fromCharCode(...Array.prototype.slice.call(codes, i, i + 0x2000));
  return out;
}

/** Strict UTF-8 to UTF-16 code units, or null when the bytes are not valid UTF-8 (used where TextDecoder is missing). */
export function utf8Strict(bytes: Uint8Array): number[] | null {
  const out: number[] = [];
  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i]!;
    const need = b < 0x80 ? 0 : b >= 0xc2 && b < 0xe0 ? 1 : b >= 0xe0 && b < 0xf0 ? 2 : b >= 0xf0 && b < 0xf5 ? 3 : -1;
    if (need < 0 || i + need >= bytes.length + (need === 0 ? 1 : 0)) return null;
    let cp = need === 0 ? b : b & (0x3f >> need);
    for (let k = 1; k <= need; k++) {
      const c = bytes[i + k]!;
      if ((c & 0xc0) !== 0x80) return null;
      cp = (cp << 6) | (c & 0x3f);
    }
    if (cp > 0xffff) {
      cp -= 0x10000;
      out.push(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
    } else out.push(cp);
    i += need + 1;
  }
  return out;
}

/** UTF-8 if the bytes are valid UTF-8, otherwise Windows-1252 (what Excel and many US banks write): curly quotes survive either way. */
export function decodeText(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    const units: number[] = [];
    for (let i = 2; i + 1 < bytes.length; i += 2) units.push(bytes[i]! | (bytes[i + 1]! << 8));
    return chunked(units);
  }
  let ascii = true;
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i]! > 0x7f) {
      ascii = false;
      break;
    }
  }
  if (ascii) return chunked(bytes);
  const Decoder = (globalThis as { TextDecoder?: new (label: string, opts?: { fatal: boolean }) => { decode(b: Uint8Array): string } }).TextDecoder;
  if (Decoder) {
    try {
      return new Decoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      /* not UTF-8 */
    }
  } else {
    const strict = utf8Strict(bytes);
    if (strict) return chunked(strict);
  }
  const codes = Array.from(bytes, (b) => (b >= 0x80 && b < 0xa0 ? CP1252_HIGH[b - 0x80]! : b));
  return chunked(codes);
}

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
