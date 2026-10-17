import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import { decodeText, parseCsvText, utf8Strict } from "../../../apps/mobile/src/lib/statementParse/csv";
import { parseXlsxBytes, readXlsx } from "../../../apps/mobile/src/lib/statementParse/xlsx";
import { markExistingDuplicates, toPreviewRows, updateRow } from "../../../apps/mobile/src/lib/statementParse/preview";
import { makeXlsx } from "./fixtures";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const col = (i: number) => String.fromCharCode(65 + i);

/** A workbook the way Excel writes it: shared strings, a date style (numFmtId 14), several sheets. */
function excelWorkbook(sheets: { name: string; rows: (string | number | { date: number })[][] }[]): Uint8Array {
  const shared: string[] = [];
  const sst = (s: string) => {
    let i = shared.indexOf(s);
    if (i < 0) i = shared.push(s) - 1;
    return i;
  };
  const sheetXml = sheets.map((sh) => {
    const rows = sh.rows
      .map((row, r) => {
        const cells = row
          .map((v, c) => {
            const ref = `${col(c)}${r + 1}`;
            if (typeof v === "string") return v === "" ? "" : `<c r="${ref}" t="s"><v>${sst(v)}</v></c>`;
            if (typeof v === "number") return `<c r="${ref}"><v>${v}</v></c>`;
            return `<c r="${ref}" s="1"><v>${v.date}</v></c>`;
          })
          .join("");
        return `<row r="${r + 1}">${cells}</row>`;
      })
      .join("");
    return `<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows}</sheetData></worksheet>`;
  });
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8("<Types/>"),
    "xl/workbook.xml": strToU8(`<workbook xmlns:r="x"><sheets>${sheets.map((s, i) => `<sheet name="${esc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`),
    "xl/_rels/workbook.xml.rels": strToU8(`<Relationships>${sheets.map((_s, i) => `<Relationship Id="rId${i + 1}" Type="x" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}</Relationships>`),
    "xl/styles.xml": strToU8('<styleSheet><cellXfs count="2"><xf numFmtId="0"/><xf numFmtId="14" applyNumberFormat="1"/></cellXfs></styleSheet>'),
  };
  sheetXml.forEach((x, i) => (files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(x)));
  files["xl/sharedStrings.xml"] = strToU8(`<sst>${shared.map((s) => `<si><t xml:space="preserve">${esc(s)}</t></si>`).join("")}</sst>`);
  return zipSync(files);
}

describe("Excel on the phone (fflate)", () => {
  const march = [
    ["Lakeshore Bakery - March activity", "", "", ""],
    ["Prepared by J. Smith", "", "", ""],
    ["", "", "", ""],
    ["Posted", "Payee / Details", "Amount (USD)", "Type"],
    [{ date: 46082 }, "POS PURCHASE WALMART #7199", -53.25, "Debit"],
    [{ date: 46084 }, "STRIPE TRANSFER ST-4001ABC", 2312.88, "Credit"],
    ["", "Total", "", ""],
  ];

  it("reads a multi-sheet workbook: finds the sheet with transactions, skips Summary and Notes, reads shared strings, title rows and date serials", async () => {
    const wb = excelWorkbook([
      { name: "Summary", rows: [["Monthly Account Summary", ""], ["Opening balance", 7000], ["Closing balance", 18655.42]] },
      { name: "March Activity", rows: march },
      { name: "Notes", rows: [["Remember to reconcile", ""]] },
    ]);
    expect(readXlsx(wb).map((s) => s.name)).toEqual(["Summary", "March Activity", "Notes"]);
    const r = await parseXlsxBytes(wb, "march.xlsx");
    expect(r.status).toBe("ok");
    expect(r.sheets).toEqual([{ name: "March Activity", rows: 2 }]);
    expect(r.rows.map((x) => [x.date, x.amount, x.type, x.merchant])).toEqual([
      ["2026-03-01", 53.25, "expense", "POS PURCHASE WALMART #7199"],
      ["2026-03-03", 2312.88, "income", "STRIPE TRANSFER ST-4001ABC"],
    ]);
  });

  it("reads inline strings, XML entities and text dates written by other tools", async () => {
    const wb = makeXlsx([{ name: "Sheet1", rows: [["Date", "Description", "Debit", "Credit"], ["2026-03-02", "Smith & Sons <Hardware>", 12.5, null], ["03/05/2026", "Refund", null, 3]] }]);
    const r = await parseXlsxBytes(wb, "x.xlsx");
    expect(r.rows.map((x) => [x.date, x.amount, x.type, x.merchant])).toEqual([
      ["2026-03-02", 12.5, "expense", "Smith & Sons <Hardware>"],
      ["2026-03-05", 3, "income", "Refund"],
    ]);
  });

  it("opens a CSV saved with an .xlsx name, refuses .xls and .ods and damaged files with plain messages", async () => {
    const csv = new TextEncoder().encode("Date,Description,Amount\n03/01/2026,Coffee,-4.50\n03/02/2026,Pay,100\n");
    expect((await parseXlsxBytes(csv, "really.xlsx")).rows).toHaveLength(2);
    const xls = await parseXlsxBytes(new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 1, 2]), "old.xls");
    expect(xls).toMatchObject({ status: "unsupported" });
    expect(xls.message).toMatch(/\.xls.*save as \.xlsx or CSV/);
    expect((await parseXlsxBytes(new Uint8Array([1, 2, 3]), "calc.ods")).message).toMatch(/\.ods/);
    expect((await parseXlsxBytes(new Uint8Array([0x50, 0x4b, 3, 4, 9, 9]), "bad.xlsx")).message).toMatch(/Could not read this Excel file/);
    expect((await parseXlsxBytes(new Uint8Array(0), "empty.xlsx")).message).toMatch(/empty/);
    expect((await parseXlsxBytes(excelWorkbook([{ name: "A", rows: [["Header only", ""]] }]), "h.xlsx")).message).toMatch(/no transactions/);
  });
});

describe("CSV text encoding on the phone", () => {
  const cp1252 = (s: string) => Uint8Array.from(s, (ch) => ({ "“": 0x93, "”": 0x94, "’": 0x92, "–": 0x96, "é": 0xe9 })[ch] ?? ch.charCodeAt(0));

  it("keeps curly quotes whether the file is UTF-8 or Windows-1252", () => {
    const text = "Date,Description,Amount\n03/01/2026,“Café” Mike’s – lunch,-4.50\n";
    expect(decodeText(new TextEncoder().encode(text))).toBe(text);
    expect(decodeText(cp1252(text))).toBe(text);
    expect(decodeText(new Uint8Array([0xef, 0xbb, 0xbf, 0x61]))).toMatch(/a$/); // a UTF-8 byte-order mark is accepted
  });

  it("the built-in UTF-8 reader (for devices without TextDecoder) agrees", () => {
    const text = "Café “quote” € 4.50 😀";
    expect(String.fromCharCode(...utf8Strict(new TextEncoder().encode(text))!)).toBe(text);
    expect(utf8Strict(Uint8Array.from([0x43, 0xe9, 0x20]))).toBeNull(); // lone Windows-1252 byte
    expect(utf8Strict(Uint8Array.from([0xe2, 0x82]))).toBeNull(); // truncated sequence
  });

  it("a Windows-1252 statement parses with the real characters", async () => {
    const bytes = cp1252("Date,Description,Amount\n03/01/2026,Mike’s “Café”,-4.50\n03/02/2026,Pay,10\n");
    const r = await parseCsvText(decodeText(bytes));
    expect(r.rows[0]!.merchant).toBe("Mike’s “Café”");
  });
});

describe("rows that already exist", () => {
  const existing = [
    { date: "2026-03-02", amount: 174.35, merchant: "Chevron" },
    { date: "2026-03-03", amount: -24.13, merchant: "DoorDash" },
    { date: "2026-03-09", amount: 50, merchant: "Rent" },
  ];
  const incoming = toPreviewRows([
    { date: "2026-03-02", amount: 174.35, type: "expense", category: "Other", merchant: "POS PURCHASE 0302 CHEVRON 44792210 SAN JOSE CA" },
    { date: "2026-03-03", amount: 24.13, type: "expense", category: "Other", merchant: "DOORDASH*6955DOORDASH.COM CA" },
    { date: "2026-03-09", amount: 50, type: "expense", category: "Other", merchant: "STARBUCKS" }, // same date and amount, different merchant
    { date: "2026-03-10", amount: 174.35, type: "expense", category: "Other", merchant: "Chevron" }, // other date
  ]);

  it("flags same date + amount + similar merchant, unticks them and says so; others stay ticked", () => {
    const out = markExistingDuplicates(incoming, existing);
    expect(out.rows.map((r) => [!!r.existing, r.selected])).toEqual([[true, false], [true, false], [false, true], [false, true]]);
    expect(out.warning).toMatch(/2 transactions look like ones you already have/);
  });

  it("can be overridden by ticking the row again, and an empty history changes nothing", () => {
    const out = markExistingDuplicates(incoming, existing);
    const ticked = out.rows.map((r) => (r.existing ? { ...r, selected: true } : r));
    expect(ticked.filter((r) => r.selected)).toHaveLength(4);
    const none = markExistingDuplicates(incoming, []);
    expect(none.warning).toBeNull();
    expect(none.rows.every((r) => r.selected)).toBe(true);
  });

  it("edited date, description and amount are kept in the row", () => {
    const edited = updateRow(incoming, 0, { date: "2026-03-04", merchant: "Chevron", amount: 175 });
    expect(edited[0]).toMatchObject({ date: "2026-03-04", merchant: "Chevron", amount: 175 });
  });
});
