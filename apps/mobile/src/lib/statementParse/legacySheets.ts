/**
 * Old Excel (.xls) and OpenDocument (.ods) workbooks, read with SheetJS Community Edition (xlsx 0.20.3, Apache-2.0).
 * It is plain JavaScript, so it runs on the phone's Hermes engine and in the browser (loaded only when such a file is used).
 * The sheets come out as the same text tables every other file type produces.
 */
import { excelSerialToIso } from "./normalize";
import type { Grid } from "./statement";

export type LegacySheet = { name: string; grid: Grid };

type Cell = { t: string; v?: unknown; w?: string; z?: string | number };

export async function readLegacySheets(bytes: Uint8Array): Promise<LegacySheet[]> {
  const XLSX = (await import("xlsx")).default ?? (await import("xlsx"));
  const wb = XLSX.read(bytes, { type: "array", cellDates: false, cellText: true, cellNF: true });
  const sheets: LegacySheet[] = [];
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    if (!ws || !ws["!ref"]) continue;
    const range = XLSX.utils.decode_range(ws["!ref"]);
    const grid: Grid = [];
    for (let r = range.s.r; r <= range.e.r; r++) {
      const row: string[] = [];
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r, c })] as Cell | undefined;
        let value = "";
        if (cell && cell.v !== undefined && cell.v !== null) {
          if (cell.t === "n" && cell.z && typeof cell.z === "string" && XLSX.SSF.is_date(cell.z)) value = excelSerialToIso(Number(cell.v)) ?? String(cell.v);
          else if (cell.t === "d" && cell.v instanceof Date) value = cell.v.toISOString().slice(0, 10);
          else if (cell.t === "b") value = cell.v ? "TRUE" : "FALSE";
          else value = String(cell.v);
        }
        row.push(value.replace(/\s+/g, " ").trim());
      }
      grid.push(row);
    }
    sheets.push({ name, grid });
  }
  return sheets;
}
