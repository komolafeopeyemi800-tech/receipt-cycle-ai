import { beforeAll, describe, expect, it } from "vitest";
import { dateWithPeriodYear, findStatementPeriod, parseAmount, parseDate, parseYearlessMonthDay } from "../../../apps/mobile/src/lib/statementParse/normalize";
import { annotateRows, defaultSelection, mapColumns, reconcile, rowsFromGrid } from "../../../apps/mobile/src/lib/statementParse/statement";
import { csvToGrid, parseCsvText } from "../../../apps/mobile/src/lib/statementParse/csv";
import { findStatementBalances, looksLikeInvoice, mergePageTables, parseStatement, readPdfOnServer, readStatementPhoto, scannedPdfOcr } from "../../../apps/mobile/src/lib/statementParse/pipeline";
import { chunkContext } from "../../../apps/mobile/src/lib/statementParse/serverAi";
import { documentToRow, importPayload, previewTotals, swapDirections, toPreviewRows } from "../../../apps/mobile/src/lib/statementParse/preview";

const run = (grid: string[][]) => {
  const m = mapColumns(grid);
  return { m, res: m ? rowsFromGrid(grid, m) : null };
};

describe("US-first dates", () => {
  it("reads 03/04/2026 as March 4 unless the data proves day/month", () => {
    expect(parseDate("03/04/2026")).toBe("2026-03-04");
    expect(parseDate("13/04/2026")).toBe("2026-04-13");
    expect(parseDate("05.10.2026")).toBe("2026-10-05"); // dotted = day.month
  });

  it("reads yearless dates with the year of the statement period", () => {
    expect(parseYearlessMonthDay("03/05")).toEqual({ month: 3, day: 5 });
    expect(parseYearlessMonthDay("Mar 5")).toEqual({ month: 3, day: 5 });
    expect(findStatementPeriod("Statement period: 03/01/2026 through 03/31/2026")).toEqual({ startYear: 2026, startMonth: 3, endYear: 2026 });
    expect(findStatementPeriod("Dec 15, 2025 - Jan 14, 2026")).toEqual({ startYear: 2025, startMonth: 12, endYear: 2026 });
    const grid = [["Date", "Description", "Debit", "Credit"], ["12/20", "Rent", "900.00", ""], ["01/03", "Pay", "", "50.00"]];
    const m = mapColumns(grid)!;
    const res = rowsFromGrid(grid, m, { period: { startYear: 2025, startMonth: 12, endYear: 2026 } });
    expect(res.rows.map((r) => r.date)).toEqual(["2025-12-20", "2026-01-03"]);
  });
});

describe("amounts", () => {
  it("never reads free text as money", () => {
    expect(parseAmount("DOORDASH*5405DOORDASH.COM CA")).toBeNull();
    expect(parseAmount("ADOBE *CREATIVE CLOUD 408-536-6000")).toBeNull();
    expect(parseAmount("($45.67)")).toBe(-45.67);
    expect(parseAmount("$1,234.56")).toBe(1234.56);
    expect(parseAmount("1.234,50")).toBe(1234.5);
    expect(parseAmount("12.50 CR")).toBe(12.5);
  });
});

describe("statement tables", () => {
  it("keeps the first row of a headerless file", () => {
    const { res } = run([["03/01/2026", "Coffee", "-4.50"], ["03/02/2026", "Pay", "1200.00"], ["03/13/2026", "Gas", "-30.00"]]);
    expect(res!.rows).toHaveLength(3);
    expect(res!.rows[0]).toMatchObject({ date: "2026-03-01", amount: 4.5, type: "expense" });
  });

  it("treats a card export with positive charges and negative payments the right way round", () => {
    const { res } = run([
      ["Date", "Description", "Amount"],
      ["03/01/2026", "AMAZON MKTPLACE", "54.20"],
      ["03/02/2026", "UBER TRIP", "18.00"],
      ["03/03/2026", "SHELL OIL", "40.00"],
      ["03/04/2026", "ONLINE PAYMENT THANK YOU", "-100.00"],
    ]);
    expect(res!.rows.map((r) => r.type)).toEqual(["expense", "expense", "expense", "income"]);
    expect(res!.warnings.join(" ")).toMatch(/credit card style/);
  });

  it("keeps the bank convention (negative = out) when no payment line shows otherwise", () => {
    const { res } = run([
      ["Date", "Description", "Amount"],
      ["03/01/2026", "AMAZON", "-54.20"],
      ["03/02/2026", "PAYROLL", "900.00"],
    ]);
    expect(res!.rows.map((r) => r.type)).toEqual(["expense", "income"]);
  });

  it("excludes opening, closing and total lines but keeps a transaction with a glued ending-balance tail", () => {
    const { res } = run([
      ["Date", "Description", "Debit", "Credit", "Balance"],
      ["03/01/2026", "BEGINNING BALANCE", "", "", "1,000.00"],
      ["03/02/2026", "COFFEE SHOP", "4.50", "", "995.50"],
      ["03/03/2026", "PAYROLL", "", "200.00", "1,195.50"],
      ["03/30/2026", "STAPLES ENDING BALANCE", "10.00", "", "1,185.50 1,185.50"],
      ["", "Total", "14.50", "200.00", ""],
    ]);
    expect(res!.rows.map((r) => [r.date, r.amount, r.type, r.merchant])).toEqual([
      ["2026-03-02", 4.5, "expense", "COFFEE SHOP"],
      ["2026-03-03", 200, "income", "PAYROLL"],
      ["2026-03-30", 10, "expense", "STAPLES"],
    ]);
  });

  it("joins a description that wrapped onto a second line and ignores a repeated header", () => {
    const { res } = run([
      ["Date", "Description", "Amount"],
      ["03/01/2026", "POS PURCHASE HOME DEPOT", "-45.10"],
      ["", "ATLANTA GA 30301", ""],
      ["Date", "Description", "Amount"],
      ["03/02/2026", "COFFEE", "-4.00"],
    ]);
    expect(res!.rows).toHaveLength(2);
    expect(res!.rows[0]!.merchant).toBe("POS PURCHASE HOME DEPOT ATLANTA GA 30301");
  });

  it("recovers a lost amount column and two joined rows from the running balance", () => {
    const grid = [
      ["Date", "Description", "Debit", "Balance"],
      ["03/01", "BEGINNING BALANCE", "", "1,000.00"],
      ["03/03 03/03", "POS PURCHASE WALMART #8517 ACH CREDIT ACME DESIGN CO INV 20554", "163.56", "836.44 2,078.01"],
    ];
    const m = mapColumns(grid)!;
    const res = rowsFromGrid(grid, m, { period: { startYear: 2026, startMonth: 3, endYear: 2026 } });
    expect(res.rows.map((r) => [r.date, r.amount, r.type])).toEqual([
      ["2026-03-03", 163.56, "expense"],
      ["2026-03-03", 1241.57, "income"],
    ]);
    expect(res.rows[0]!.merchant).toMatch(/WALMART/);
    expect(res.rows[1]!.merchant).toMatch(/ACME/);
  });

  it("finds an unnamed withdrawals column beside a named deposits column", () => {
    const grid = [
      ["DATE", "DESCRIPTION", "", "DEPOSITS", "BALANCE"],
      ["03/02/2026", "POS PURCHASE", "174.35", "", "5,076.40"],
      ["03/07/2026", "STRIPE TRANSFER", "", "2,297.22", "7,373.62"],
    ];
    expect(mapColumns(grid)).toMatchObject({ debit: 2, credit: 3, balance: 4 });
  });

  it("joins the continuation pages of one statement table", () => {
    const head = ["Date", "Description", "Amount"];
    const merged = mergePageTables([[head, ["03/01/2026", "A", "-1"]], [head, ["03/02/2026", "B", "-2"]], [["Total", "x"]]]);
    expect(merged).toHaveLength(2);
    expect(merged[0]).toHaveLength(3);
  });
});

describe("flags and checks", () => {
  const rows = [
    { date: "2026-03-01", amount: 5, type: "expense" as const, category: "Other", merchant: "Coffee" },
    { date: "2026-03-01", amount: 5, type: "expense" as const, category: "Other", merchant: "Coffee" },
    { date: "2026-03-07", amount: 500, type: "expense" as const, category: "Other", merchant: "ONLINE TRANSFER TO SAV ...9021 CONFIRMATION# 88413" },
    { date: "2026-03-08", amount: 700, type: "income" as const, category: "Other", merchant: "ONLINE PAYMENT THANK YOU" },
    { date: "2099-01-01", amount: 1, type: "expense" as const, category: "Other", merchant: "Time traveller" },
  ];

  it("flags exact duplicates, own-account transfers and future dates, and unticks them", () => {
    const out = annotateRows(rows);
    expect(out.rows.map((r) => [!!r.duplicate, !!r.transfer, !!r.future])).toEqual([
      [false, false, false],
      [true, false, false],
      [false, true, false],
      [false, true, false],
      [false, false, true],
    ]);
    expect(defaultSelection(out.rows)).toHaveLength(1);
    expect(toPreviewRows(out.rows).filter((r) => r.selected)).toHaveLength(1);
  });

  it("does not treat an ordinary online bill payment as a transfer", () => {
    expect(annotateRows([{ date: "2026-03-01", amount: 90, type: "expense", category: "Other", merchant: "ONLINE PAYMENT TO COMCAST" }]).rows[0]!.transfer).toBeUndefined();
  });

  it("checks rows against the opening and closing balance printed on the statement", () => {
    expect(findStatementBalances("|Beginning balance|$5,250.75|\n|Ending balance|$10,796.94|")).toEqual({ opening: 5250.75, closing: 10796.94 });
    const r = [
      { date: "2026-03-01", amount: 100, type: "income" as const, category: "Other" },
      { date: "2026-03-02", amount: 40, type: "expense" as const, category: "Other" },
    ];
    expect(reconcile(r, 1000, 1060)).toBe(true);
    expect(reconcile(r, 1000, 1100)).toBe(false);
  });
});

describe("phone CSV reader", () => {
  it("reads quoted, semicolon and no-header CSV with the same rules as the web reader", async () => {
    const q = await parseCsvText('Date,Description,Amount\n03/01/2026,"Cafe, Main St",($4.50)\n03/02/2026,Salary,"$1,200.00"\n');
    expect(q.rows.map((r) => [r.amount, r.type, r.merchant])).toEqual([[4.5, "expense", "Cafe, Main St"], [1200, "income", "Salary"]]);
    const eu = await parseCsvText("Date;Description;Amount\n05.10.2026;Kaffee;-4,50\n06.10.2026;Gehalt;1.200,00\n");
    expect(eu.rows.map((r) => [r.date, r.amount, r.type])).toEqual([["2026-10-05", 4.5, "expense"], ["2026-10-06", 1200, "income"]]);
    expect(csvToGrid('a,b\n"x\ny",2\n')).toEqual([["a", "b"], ["x\ny", "2"]]);
  });

  it("says why an unusable file is unusable", async () => {
    expect((await parseCsvText("")).message).toMatch(/empty/);
    expect((await parseCsvText("Date,Description,Amount\n")).message).toMatch(/no transactions/);
    expect((await parseCsvText("\u0000\u0001\u0002binary")).message).toMatch(/binary/);
  });
});

describe("review step", () => {
  it("totals the ticked rows, swaps direction and builds the import payload without flags", () => {
    const rows = toPreviewRows(
      annotateRows([
        { date: "2026-03-01", amount: 10, type: "expense", category: "Other", merchant: "A" },
        { date: "2026-03-02", amount: 30, type: "income", category: "Other", merchant: "B" },
      ]).rows,
    );
    expect(previewTotals(rows)).toMatchObject({ selected: 2, moneyIn: 30, moneyOut: 10 });
    const swapped = swapDirections(rows);
    expect(previewTotals(swapped)).toMatchObject({ moneyIn: 10, moneyOut: 30 });
    expect(importPayload(swapped)[0]).toEqual({ amount: 10, type: "income", category: "Salary", date: "2026-03-01", merchant: "A", description: "A" });
  });

  it("turns an invoice scan into one row and asks for a date when none was printed", () => {
    expect(documentToRow({ merchant_name: "Granite Peak", total_amount: 7846.88, date: "2026-03-02" }, "2026-10-16")!.row).toMatchObject({ date: "2026-03-02", amount: 7846.88, type: "expense" });
    const noDate = documentToRow({ merchant_name: "X", total_amount: 5 }, "2026-10-16")!;
    expect(noDate.row.date).toBe("2026-10-16");
    expect(noDate.warnings[0]).toMatch(/today/);
    expect(documentToRow({ merchant_name: "X" }, "2026-10-16")).toBeNull();
  });
});

describe("invoice vs statement", () => {
  it("recognises an invoice and not a bank statement that mentions an invoice", () => {
    expect(looksLikeInvoice("INVOICE\nInvoice #: GP-1\nBill to: Harlow\nDue date 04/01\nSubtotal 100\nAmount due 100")).toBe(true);
    expect(looksLikeInvoice("Statement period 03/01/2026 through 03/31/2026\nBeginning balance 100\nACH CREDIT ACME INVOICE 1042 PAYMENT")).toBe(false);
  });
});

describe("AI context", () => {
  it("repeats the statement year and column headings on every piece of text sent to the AI", () => {
    const ctx = chunkContext("Statement period: 03/01/2026 through 03/31/2026\n|Date|Description|Debit|Credit|Balance|\n|03/01|X|1.00||9.00|");
    expect(ctx).toMatch(/Statement year: 2026/);
    expect(ctx).toMatch(/Column headings: \|Date\|Description\|Debit\|Credit\|Balance\|/);
    expect(chunkContext("nothing useful")).toBe("");
  });
});

describe("scanned PDF safety net", () => {
  beforeAll(() => { scannedPdfOcr.enabled = true; }); // the reader ships switched off
  const scanEngine = {
    detectFormat: () => "pdf",
    formatForExtension: () => "pdf",
    toDocument: () => ({ blocks: [] }),
    toMarkdown: () => {
      throw Object.assign(new Error("scan"), { code: "needsOcr", pages: [1], pageCount: 1 });
    },
  };
  const rows = [
    { date: "2026-03-01", amount: 100, type: "income" as const, category: "Other", merchant: "A" },
    { date: "2026-03-02", amount: 40, type: "expense" as const, category: "Other", merchant: "B" },
  ];
  const read = (opening: number | null, closing: number | null) =>
    parseStatement(new Uint8Array([1, 2, 3]), {
      fileName: "scan.pdf",
      engine: scanEngine as never,
      ai: { mapColumns: async () => null, extractRows: async () => ({ rows: [], calls: 0, truncated: false }), ocrPdf: async () => ({ rows, opening, closing }) },
    });

  it("accepts a scan whose rows add up to the balances on it", async () => {
    const r = await read(1000, 1060);
    expect(r.status).toBe("ok");
    expect(r.verification).toEqual({ opening: 1000, closing: 1060, ok: true });
    expect(r.warnings.join(" ")).toMatch(/Checked/);
  });

  it("refuses a scan whose rows do not add up (rows missing or invented)", async () => {
    const r = await read(1000, 1500);
    expect(r.status).toBe("unreadable");
    expect(r.rows).toHaveLength(0);
    expect(r.message).toBe("We could not read this scan reliably. Upload a clearer scan or a CSV or Excel version.");
  });

  it("refuses a scan that prints no balances to check against", async () => {
    const r = await read(null, null);
    expect(r.status).toBe("unreadable");
    expect(r.message).toMatch(/could not find the opening and closing balances/);
  });
});

describe("yearless dates without a statement period", () => {
  it("use the most recent past year, never a date in the future", () => {
    const now = new Date("2026-10-16T12:00:00Z");
    expect(dateWithPeriodYear({ month: 3, day: 5 }, null, undefined, now)).toBe("2026-03-05");
    expect(dateWithPeriodYear({ month: 12, day: 20 }, null, undefined, now)).toBe("2025-12-20");
  });
});

describe("phone: statement photos and PDFs sent to the server", () => {
  const rows = [
    { date: "2026-03-01", amount: 100, type: "income" as const, category: "Other", merchant: "A" },
    { date: "2026-03-02", amount: 40, type: "expense" as const, category: "Other", merchant: "B" },
  ];
  const aiWith = (outcome: unknown, seen: unknown[] = []) =>
    ({ mapColumns: async () => null, extractRows: async () => ({ rows: [], calls: 0, truncated: false }), ocrPdf: async (_b: Uint8Array, o: unknown) => { seen.push(o); if (outcome instanceof Error) throw outcome; return outcome; } }) as never;

  it("sends a photo as kind statement and accepts it when the rows add up", async () => {
    const seen: any[] = [];
    const r = await readStatementPhoto(new Uint8Array([1]), "image/jpeg", aiWith({ rows, opening: 1000, closing: 1060 }, seen));
    expect(r.status).toBe("ok");
    expect(r.verification?.ok).toBe(true);
    expect(seen[0]).toMatchObject({ kind: "statement", mimeType: "image/jpeg" });
  });

  it("refuses when the rows do not add up, and when no balances were found", async () => {
    const bad = await readPdfOnServer(new Uint8Array([1]), aiWith({ rows, opening: 1000, closing: 9999 }));
    expect(bad).toMatchObject({ status: "unreadable", rows: [] });
    expect(bad.message).toBe("We could not read this scan reliably. Upload a clearer scan or a CSV or Excel version.");
    const none = await readPdfOnServer(new Uint8Array([1]), aiWith({ rows, opening: null, closing: null }));
    expect(none.message).toMatch(/could not find the opening and closing balances/);
  });

  it("shows the server's own friendly message when the server refuses", async () => {
    const r = await readStatementPhoto(new Uint8Array([1]), "image/png", aiWith(new Error("This PDF is too long to read right now. Upload a CSV or Excel version.")));
    expect(r.status).toBe("unreadable");
    expect(r.message).toBe("This PDF is too long to read right now. Upload a CSV or Excel version.");
  });
});

describe("text receipt PDFs", () => {
  it("are told apart from statements", async () => {
    const { looksLikeReceipt } = await import("../../../apps/mobile/src/lib/statementParse/pipeline");
    expect(looksLikeReceipt("DAILY GRIND COFFEE\n03/05/2026 8:03 AM\nLATTE 5.25\nSUBTOTAL 14.90\nTAX 1.53\nTIP 1.50\nTOTAL 17.93\nPaid VISA ****1007")).toBe(true);
    expect(looksLikeReceipt("Statement period 03/01/2026 through 03/31/2026\nBeginning balance 100\nSUBTOTAL TOTAL TAX")).toBe(false);
    expect(looksLikeReceipt("03/01/2026 A 5.00\n03/02/2026 B 6.00\n03/03/2026 C 7.00\n03/04/2026 D 8.00\nTotal 26 subtotal tax")).toBe(false);
  });
});
