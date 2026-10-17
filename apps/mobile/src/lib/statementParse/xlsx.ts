/**
 * .xlsx on the phone with no WebAssembly: unzip (fflate), read the sheet XML, shared strings and date styles, and hand the
 * tables to the same column mapping and row conversion every other file type uses.
 */
import { strFromU8, unzipSync } from "fflate";
import { excelSerialToIso } from "./normalize";
import { decodeText, parseCsvText } from "./csv";
import { readLegacySheets } from "./legacySheets";
import { type ParseResult, parseTables } from "./pipeline";
import type { Grid } from "./statement";
import type { StatementAi } from "./types";

export type SheetGrid = { name: string; grid: Grid };

const unescapeXml = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_m, n: string) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, n: string) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&");

const attr = (tag: string, name: string): string | undefined => new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(tag)?.[1];

/** Text of the <t> elements of a shared string or inline string (phonetic runs skipped). */
function textOf(xml: string): string {
  const cleaned = xml.replace(/<rPh[\s\S]*?<\/rPh>/g, "");
  let out = "";
  for (const m of cleaned.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)) out += m[1]!;
  return unescapeXml(out);
}

const BUILTIN_DATE_FORMATS = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 45, 46, 47]);

function dateStyleSet(styles: string | undefined): Set<number> {
  const dateStyles = new Set<number>();
  if (!styles) return dateStyles;
  const custom = new Map<number, string>();
  for (const m of styles.matchAll(/<numFmt\s[^>]*>/g)) {
    const id = Number(attr(m[0], "numFmtId"));
    const code = attr(m[0], "formatCode");
    if (Number.isFinite(id) && code !== undefined) custom.set(id, unescapeXml(code));
  }
  const cellXfs = /<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/.exec(styles)?.[1] ?? "";
  let i = 0;
  for (const m of cellXfs.matchAll(/<xf\s[^>]*?(?:\/>|>)/g)) {
    const id = Number(attr(m[0], "numFmtId"));
    const code = custom.get(id);
    const isDate = BUILTIN_DATE_FORMATS.has(id) || (code !== undefined && /[dmy]/i.test(code.replace(/"[^"]*"|\[[^\]]*\]|\\./g, "")) && !/^general$/i.test(code));
    if (isDate) dateStyles.add(i);
    i++;
  }
  return dateStyles;
}

const colIndex = (ref: string): number => {
  let n = 0;
  for (const ch of /^[A-Za-z]+/.exec(ref)?.[0] ?? "A") n = n * 26 + (ch.toUpperCase().charCodeAt(0) - 64);
  return n - 1;
};

function sheetGrid(xml: string, shared: string[], dateStyles: Set<number>): Grid {
  const grid: Grid = [];
  for (const rowMatch of xml.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const rowIdx = Number(attr(rowMatch[1]!, "r")) - 1;
    const row: string[] = [];
    for (const c of (rowMatch[2] ?? "").matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const tag = c[1]!;
      const inner = c[2] ?? "";
      const ref = attr(tag, "r") ?? "";
      const type = attr(tag, "t");
      const v = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1];
      let value = "";
      if (type === "s") value = v === undefined ? "" : (shared[Number(v)] ?? "");
      else if (type === "inlineStr") value = textOf(inner);
      else if (type === "str" || type === "e") value = v === undefined ? "" : unescapeXml(v);
      else if (type === "b") value = v === "1" ? "TRUE" : "FALSE";
      else if (v !== undefined) {
        const style = Number(attr(tag, "s"));
        const serial = Number(v);
        value = dateStyles.has(style) && Number.isFinite(serial) ? (excelSerialToIso(serial) ?? v) : v;
      }
      const col = ref ? colIndex(ref) : row.length;
      while (row.length < col) row.push("");
      row[col] = value.replace(/\s+/g, " ").trim();
    }
    const at = Number.isFinite(rowIdx) && rowIdx >= 0 ? rowIdx : grid.length;
    while (grid.length < at) grid.push([]);
    grid[at] = row;
  }
  return grid;
}

/** Every sheet of a workbook as a table, in workbook order. Throws Error("encrypted" | "not a workbook"). */
export function readXlsx(bytes: Uint8Array): SheetGrid[] {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes, { filter: (f) => /^xl\/(?:workbook\.xml|_rels\/workbook\.xml\.rels|sharedStrings\.xml|styles\.xml|worksheets\/[^/]+\.xml)$/.test(f.name) });
  } catch {
    throw new Error("not a workbook");
  }
  const get = (name: string) => (files[name] ? strFromU8(files[name]!) : undefined);
  const workbook = get("xl/workbook.xml");
  if (!workbook) throw new Error("not a workbook");
  const rels = new Map<string, string>();
  for (const m of (get("xl/_rels/workbook.xml.rels") ?? "").matchAll(/<Relationship\b[^>]*>/g)) {
    const id = attr(m[0], "Id");
    const target = attr(m[0], "Target");
    if (id && target) rels.set(id, target.startsWith("/") ? target.slice(1) : `xl/${target}`);
  }
  const shared: string[] = [];
  for (const m of (get("xl/sharedStrings.xml") ?? "").matchAll(/<si\b[^>]*?(?:\/>|>([\s\S]*?)<\/si>)/g)) shared.push(textOf(m[1] ?? ""));
  const dateStyles = dateStyleSet(get("xl/styles.xml"));

  const sheets: SheetGrid[] = [];
  let n = 0;
  for (const m of workbook.matchAll(/<sheet\b[^>]*>/g)) {
    n++;
    const name = unescapeXml(attr(m[0], "name") ?? `Sheet ${n}`);
    const rid = attr(m[0], "r:id") ?? attr(m[0], "id");
    const path = (rid && rels.get(rid)) || `xl/worksheets/sheet${n}.xml`;
    const xml = get(path);
    if (xml) sheets.push({ name, grid: sheetGrid(xml, shared, dateStyles) });
  }
  return sheets;
}

const refuse = (message: string, status: ParseResult["status"] = "unreadable"): ParseResult => ({ status, fileType: "xlsx", rows: [], totalRows: 0, truncated: false, source: "heuristic", aiCalls: 0, warnings: [], message });

/**
 * A spreadsheet picked on the phone or the web. .xlsx is read with fflate; old .xls and .ods are read with SheetJS (loaded
 * only when needed); a file named .xlsx that is really text is read as CSV. All of them go through the same column mapping.
 */
export async function parseXlsxBytes(bytes: Uint8Array, fileName: string, ai?: StatementAi): Promise<ParseResult> {
  if (bytes.length === 0) return refuse("This file is empty. Choose a file that has your transactions in it.");
  const ole = bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0;
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  const looksOds = /\.ods$/i.test(fileName);
  if (/\.xlsb$/i.test(fileName)) return refuse("Binary Excel (.xlsb) files cannot be read. Open it in Excel, save as .xlsx or CSV, and upload again.", "unsupported");
  if (ole || /\.xls$/i.test(fileName) || looksOds) {
    if (!ole && !isZip) {
      // an .xls / .ods name on plain text (a CSV saved with the wrong name)
      const head = bytes.subarray(0, Math.min(bytes.length, 2048));
      if (!head.includes(0)) return parseCsvText(decodeText(bytes), ai);
    }
    let sheets: SheetGrid[];
    try {
      sheets = await readLegacySheets(bytes);
    } catch {
      return refuse(`Could not read this ${looksOds ? "OpenDocument" : "Excel"} file. If it is password protected, remove the password; otherwise make sure it is not damaged.`);
    }
    if (sheets.every((s) => s.grid.length < 2)) return refuse("This workbook has no transactions in it.");
    return parseTables(sheets, looksOds ? "ods" : "xls", ai);
  }
  if (!isZip) {
    // A CSV saved with an .xlsx name still opens.
    const head = bytes.subarray(0, Math.min(bytes.length, 2048));
    if (head.includes(0)) return refuse("This does not look like an Excel file. Check that it is not damaged or renamed.");
    return parseCsvText(decodeText(bytes), ai);
  }
  let sheets: SheetGrid[];
  try {
    sheets = readXlsx(bytes);
  } catch {
    return refuse("Could not read this Excel file. If it is password protected, remove the password; otherwise make sure it is not damaged.");
  }
  if (sheets.every((s) => s.grid.length < 2)) return refuse("This workbook has no transactions in it.");
  return parseTables(sheets, "xlsx", ai);
}
