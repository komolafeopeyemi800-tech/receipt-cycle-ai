import { mkdirSync, writeFileSync } from "node:fs";
import { unzipSync, strFromU8 } from "fflate";
import { describe, expect, it } from "vitest";
import { buildBookkeepingWorkbook } from "./bookkeepingWorkbook";
import { currencyNumFmt, type ExportDocument, type ExportTransaction } from "./exportModel";
import { Workbook, cellRef, colLetter, ymdToSerial } from "./xlsxWriter";

function parts(bytes: Uint8Array) {
  const z = unzipSync(bytes);
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(z)) out[k] = strFromU8(v);
  return out;
}

function expectWellFormed(files: Record<string, string>) {
  const parser = new DOMParser();
  for (const [name, xml] of Object.entries(files)) {
    const doc = parser.parseFromString(xml, "application/xml");
    expect(doc.getElementsByTagName("parsererror").length, `${name} is not well-formed XML`).toBe(0);
  }
}

const CATS_OUT = ["Groceries", "Fuel", "Software", "Meals & Entertainment", "Office Supplies", "Rent", "Travel", "Utilities"];
const CATS_IN = ["Client payments", "Consulting", "Interest"];

export function sampleData() {
  const txs: ExportTransaction[] = [];
  for (let i = 0; i < 150; i++) {
    const month = 1 + (i % 6);
    const day = 1 + ((i * 7) % 27);
    const date = `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const income = i % 5 === 0;
    const cat = income ? CATS_IN[i % 3]! : CATS_OUT[i % CATS_OUT.length]!;
    const key = i < 40 ? `receipts/user-1/r${i}.jpg` : i === 41 ? "receipts/user-1/inv1.pdf" : null;
    txs.push({
      id: `t${i}`,
      date,
      type: income ? "income" : "expense",
      amount: Math.round((income ? 900 + i * 13.37 : 8 + ((i * 37) % 300) + 0.49) * 100) / 100,
      merchant: income ? `Client ${i % 5}` : `Merchant "${i % 12}" & Co <${i}>`,
      category: cat,
      description: i % 4 === 0 ? `Line one\nLine two for ${i}` : `Purchase ${i}`,
      payment_method: ["Credit card", "Debit card", "Cash", "Bank transfer"][i % 4],
      accountId: i % 2 ? "acc1" : null,
      tags: i % 5 === 0 ? ["tax", "q1"] : null,
      receipt_url: key,
      evidence_url: key ? `https://api.example.com/api/receipt-evidence?key=${key}&sig=x` : null,
      entry_source: (["manual", "camera", "upload"] as const)[i % 3],
      receipt_data: income ? null : { subtotal: 10, tax_amount: 0.8, tip_amount: i % 7 === 0 ? 2 : undefined, card_last4: "4242", currency: "USD", items: i === 3 ? [{ name: "Printer paper", quantity: 2, unit_price: 5, price: 10 }] : undefined },
    });
  }
  const documents: ExportDocument[] = [
    { id: "d1", kind: "bank_statement", fileName: "northfield-jan-2026.pdf", r2Key: "receipts/user-1/stmt1.pdf", mime: "application/pdf", size: 120_000, createdAt: "2026-02-03T10:00:00Z", meta: { bankName: "Northfield Bank", accountName: "Business Checking", accountLast4: "1893", statementStartDate: "2026-01-01", statementEndDate: "2026-01-31", openingBalance: 5200.5, totalDeposits: 9800, totalWithdrawals: 7311.25, closingBalance: 7689.25, currency: "USD", transactionCount: 64 } },
    { id: "d2", kind: "card_statement", fileName: "visa-feb.pdf", r2Key: "receipts/user-1/stmt2.pdf", mime: "application/pdf", size: 98_000, createdAt: "2026-03-02T10:00:00Z", meta: { card_name: "Business Visa", issuer: "Chase", account_last4: "4242", statement_start: "2026-02-01", statement_end: "2026-02-28", payment_due_date: "2026-03-25", previous_balance: 1200, payments: 1200, new_charges: 2310.4, new_balance: 2310.4, minimum_payment_due: 35, credit_limit: 10000 } },
    { id: "d3", kind: "invoice", fileName: "inv-0042.pdf", r2Key: "receipts/user-1/inv1.pdf", mime: "application/pdf", size: 54_000, createdAt: "2026-03-05", meta: { invoice_number: "INV-0042", issue_date: "2026-03-01", due_date: "2026-03-31", po_number: "PO-77", payment_terms: "Net 30", vendor: "Acme Supplies", bill_to: "Receipt Cycle LLC", subtotal: 500, tax: 40, total: 540, line_items: [{ description: "Widgets", quantity: 10, unit_price: 25, amount: 250 }, { description: "Gadgets", quantity: 5, unit_price: 50 }, { description: "Shipping", amount: 0 }] } },
  ];
  return { txs, documents };
}

const links = (keys: string[]) => Object.fromEntries(keys.map((k) => [k, `https://api.example.com/api/receipts/shared?key=${encodeURIComponent(k)}&exp=1&sig=abc`]));

describe("xlsxWriter", () => {
  it("column letters, refs and date serials", () => {
    expect(colLetter(0)).toBe("A");
    expect(colLetter(25)).toBe("Z");
    expect(colLetter(26)).toBe("AA");
    expect(cellRef(4, 2, true)).toBe("$C$5");
    expect(ymdToSerial("2026-01-01")).toBe(46023);
    expect(ymdToSerial("2026-02-30")).toBeNull();
  });

  it("escapes XML, strips control characters and keeps formula text safe", () => {
    const wb = new Workbook();
    const s = wb.addSheet("a/b:c?");
    s.set(0, 0, "x & <y> \u0001 \"q\"");
    s.set(1, 0, "=1+1"); // plain text, must never become a formula
    const files = parts(wb.build());
    expectWellFormed(files);
    expect(wb.sheets[0]!.name).toBe("a b c");
    expect(files["xl/sharedStrings.xml"]).toContain("x &amp; &lt;y&gt;  &quot;q&quot;");
    expect(files["xl/worksheets/sheet1.xml"]).not.toContain("<f>");
  });
});

describe("bookkeeping workbook", () => {
  const { txs, documents } = sampleData();
  const keys = [...txs.map((t) => t.receipt_url).filter(Boolean), ...documents.map((d) => d.r2Key)] as string[];
  const built = buildBookkeepingWorkbook(txs, {
    businessName: "Northwind Studio",
    reportTitle: "Income & Expense Report 2026",
    currency: "USD",
    dateFormat: "us",
    generatedOn: "2026-10-17",
    accountNames: { acc1: "Business Checking" },
    documents,
    links: links(keys),
  });
  const files = parts(built.bytes);

  it("writes every part, well-formed", () => {
    for (const p of ["[Content_Types].xml", "_rels/.rels", "xl/workbook.xml", "xl/styles.xml", "xl/sharedStrings.xml", "docProps/core.xml", "docProps/app.xml", "xl/worksheets/sheet1.xml", "xl/worksheets/sheet4.xml"]) expect(files[p], p).toBeTruthy();
    expectWellFormed(files);
    expect(built.sheetNames).toEqual(["Summary", "Transactions", "Documents", "Line items"]);
  });

  it("has styles: teal header fill, number formats, fonts", () => {
    const st = files["xl/styles.xml"]!;
    expect(st).toContain('rgb="FF0F766E"');
    expect(st).toContain("mm/dd/yyyy");
    expect(st).toContain(currencyNumFmt("USD").replace(/"/g, "&quot;"));
    expect(st).toContain("<b/>");
    expect(st).toContain("<dxfs");
  });

  it("transactions sheet: freeze, autofilter, zebra, print setup, tab colour, SUBTOTAL", () => {
    const x = files["xl/worksheets/sheet2.xml"]!;
    expect(x).toContain('state="frozen"');
    expect(x).toContain('<autoFilter ref="A4:S154"/>');
    expect(x).toContain("conditionalFormatting");
    expect(x).toContain('orientation="landscape"');
    expect(x).toContain('fitToWidth="1"');
    expect(x).toContain('<tabColor rgb="FF2563EB"/>');
    expect(x).toContain("SUBTOTAL(109,F5:F154)");
    expect(files["xl/workbook.xml"]).toContain("_xlnm.Print_Titles");
    expect(files["xl/workbook.xml"]).toContain("$4:$4");
  });

  it("summary uses live SUMIFS pointing at Transactions", () => {
    const x = files["xl/worksheets/sheet1.xml"]!;
    expect(x).toMatch(/<f>SUMIFS\('Transactions'!\$F\$5:\$F\$154,'Transactions'!\$B\$5:\$B\$154,&quot;Expense&quot;,'Transactions'!\$D\$5:\$D\$154,A\d+\)<\/f>/);
    expect(x).toContain("EDATE(");
    expect(files["xl/sharedStrings.xml"]).toContain("Prepared with Receipt Cycle");
    expect(files["xl/sharedStrings.xml"]).toContain("Northwind Studio");
  });

  it("hyperlinks are real relationships with the signed URLs", () => {
    const rels = files["xl/worksheets/_rels/sheet2.xml.rels"]!;
    expect(rels).toContain('TargetMode="External"');
    expect(rels).toContain("/api/receipts/shared?key=");
    expect(files["xl/worksheets/sheet2.xml"]).toContain("<hyperlinks>");
    expect(files["xl/worksheets/_rels/sheet3.xml.rels"]).toContain("stmt1.pdf");
  });

  it("documents sheet carries statement, card and invoice details; line items are listed", () => {
    const s = files["xl/sharedStrings.xml"]!;
    for (const needle of ["Northfield Bank", "Business Checking ••1893", "Chase", "Business Visa ••4242", "INV-0042", "PO number: PO-77", "Minimum payment due: 35", "Credit limit: 10000", "Widgets", "Gadgets", "Printer paper"]) expect(s, needle).toContain(needle);
    expect(files["xl/worksheets/sheet4.xml"]).toContain("SUBTOTAL(109,G5:");
  });

  it("works with no documents and no transactions at all", () => {
    const empty = parts(buildBookkeepingWorkbook([], { generatedOn: "2026-10-17" }).bytes);
    expectWellFormed(empty);
    expect(empty["xl/sharedStrings.xml"]).toContain("No uploaded documents");
    const t = parts(buildBookkeepingWorkbook(txs.slice(0, 3), {}).bytes);
    expect(t["xl/sharedStrings.xml"]).toContain("No uploaded documents");
    expectWellFormed(t);
  });

  it("falls back to the existing evidence link when no signed link was fetched", () => {
    const f = parts(buildBookkeepingWorkbook(txs.slice(0, 2), {}).bytes);
    expect(f["xl/worksheets/_rels/sheet2.xml.rels"]).toContain("receipt-evidence");
  });

  it("writes a preview file for manual inspection", () => {
    const withInvoices = buildBookkeepingWorkbook(txs, {
      businessName: "Northwind Studio",
      reportTitle: "Income & Expense Report 2026",
      currency: "USD",
      dateFormat: "us",
      generatedOn: "2026-10-17",
      accountNames: { acc1: "Business Checking" },
      documents,
      links: links(keys),
      invoices: [
        { number: "INV-1001", customer: "Acme Corp", issueDate: "2026-02-01", dueDate: "2026-03-03", total: 1800, paid: 1800, status: "Paid" },
        { number: "INV-1002", customer: "Globex", issueDate: "2026-03-10", dueDate: "2026-04-09", total: 950.5, paid: 200, status: "Partly paid" },
      ],
    });
    try {
      mkdirSync("C:/tmp/export-preview", { recursive: true });
      writeFileSync("C:/tmp/export-preview/sample.xlsx", withInvoices.bytes);
    } catch {
      /* preview output is optional */
    }
    expect(withInvoices.sheetNames).toContain("Invoices & Payments");
    expectWellFormed(parts(withInvoices.bytes));
  });
});
