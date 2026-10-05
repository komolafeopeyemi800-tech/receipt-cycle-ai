import { env } from "cloudflare:test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MAX_ROWS, gridsFromMarkdown, parseStatement } from "../src/docs/pipeline";
import { makeImageOnlyPdf, makeTextPdf, makeXlsx } from "./fixtures";

afterEach(() => vi.unstubAllGlobals());

const enc = (s: string) => new TextEncoder().encode(s);
const withKey = { ...env, OPENAI_API_KEY: "sk-test" };

/** Stub OpenAI: returns the given JSON as the model's answer and records every request body. */
function stubAi(answer: unknown) {
  const calls: any[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: RequestInit) => {
      calls.push(JSON.parse(String(init.body)));
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(answer) } }] }), { status: 200 });
    }),
  );
  return calls;
}

function noAiAllowed() {
  const spy = vi.fn(async () => {
    throw new Error("AI must not be called on this path");
  });
  vi.stubGlobal("fetch", spy);
  return spy;
}

describe("CSV", () => {
  it("reads a bank CSV with no AI at all", async () => {
    const spy = noAiAllowed();
    const csv = "Date,Description,Debit,Credit,Balance\n2026-10-03,POS Shoprite,\"12,500.00\",,87500\n2026-10-05,Transfer from Ada,,50000,137500\n";
    const r = await parseStatement(enc(csv), { fileName: "stmt.csv", env, allowAi: true });
    expect(r).toMatchObject({ status: "ok", fileType: "csv", source: "heuristic", aiCalls: 0, totalRows: 2 });
    expect(r.rows.map((x) => [x.date, x.amount, x.type, x.merchant])).toEqual([
      ["2026-10-03", 12500, "expense", "POS Shoprite"],
      ["2026-10-05", 50000, "income", "Transfer from Ada"],
    ]);
    expect(spy).not.toHaveBeenCalled();
  });

  it("handles a semicolon-separated export", async () => {
    const csv = "Date;Description;Amount\n2026-10-01;Coffee;-4,50\n2026-10-02;Salary;1200,00\n";
    const r = await parseStatement(enc(csv), { fileName: "export.csv", env, allowAi: false });
    expect(r.rows.map((x) => [x.amount, x.type])).toEqual([[4.5, "expense"], [1200, "income"]]);
  });

  it("caps very large files at the row limit and says so", async () => {
    const lines = ["Date,Description,Amount"];
    for (let i = 0; i < MAX_ROWS + 50; i++) lines.push(`2026-10-01,Item ${i},-1.00`);
    const r = await parseStatement(enc(lines.join("\n")), { fileName: "big.csv", env, allowAi: false });
    expect(r).toMatchObject({ status: "ok", truncated: true, totalRows: MAX_ROWS + 50 });
    expect(r.rows).toHaveLength(MAX_ROWS);
    expect(r.warnings.join(" ")).toMatch(/first 5000 were read/);
  });
});

describe("Excel", () => {
  it("combines monthly sheets and reads serial dates", async () => {
    const spy = noAiAllowed();
    const xlsx = makeXlsx([
      { name: "March", rows: [["Date", "Description", "Amount"], [45000, "Coffee", -4.5], ["2026-03-02", "Salary", 1200]] },
      { name: "April", rows: [["Date", "Details", "Debit", "Credit"], ["2026-04-01", "Rent", 500, null]] },
      { name: "Notes", rows: [["Remember", "to file taxes"]] },
    ]);
    const r = await parseStatement(xlsx, { fileName: "2026.xlsx", env, allowAi: false });
    expect(r.status).toBe("ok");
    expect(r.sheets).toEqual([{ name: "March", rows: 2 }, { name: "April", rows: 1 }]);
    expect(r.rows.map((x) => x.date)).toEqual(["2023-03-15", "2026-03-02", "2026-04-01"]);
    expect(r.warnings.join(" ")).toMatch(/1 sheet\(s\) had no transactions/);
    expect(spy).not.toHaveBeenCalled();
  });

  const odd = () =>
    makeXlsx([{ name: "Sheet1", rows: [["Col A", "Col B", "Col C"], ["2026-10-01", "Coffee", -4.5], ["2026-10-02", "Salary", 1200]] }]);

  it("without the AI helper, says what is wrong instead of guessing", async () => {
    // Value shapes are enough here, so this one is readable even without headers.
    const r = await parseStatement(odd(), { fileName: "odd.xlsx", env, allowAi: false });
    expect(r.status).toBe("ok");
    expect(r.source).toBe("heuristic");
  });

  it("asks the AI only to map columns when neither headers nor values settle it, sending a small sample", async () => {
    const unknown = makeXlsx([
      { name: "Sheet1", rows: [["Tarikh", "Bayani", "Kudi"], ["01-Oct-2026", "Siyayya", "-2,000"], ["02-Oct-2026", "Albashi", "50000"]] },
    ]);
    const calls = stubAi({ headerRow: 0, date: 0, description: 1, amount: 2 });
    const r = await parseStatement(unknown, { fileName: "ha.xlsx", env: withKey, allowAi: true });
    // The value-shape fallback already solves this file; the AI is skipped, which is the cheapest outcome.
    expect(r.status).toBe("ok");
    expect(calls.length).toBe(0);
  });

  it("calls the AI mapper for a layout code cannot read, and only sends the first rows", async () => {
    const grid: (string | number)[][] = [["Report", "", ""], ["", "", ""]];
    for (let i = 0; i < 200; i++) grid.push([`Item ${i}`, `blue`, `${i}`]); // no dates at all
    const xlsx = makeXlsx([{ name: "Sheet1", rows: grid as any }]);
    const calls = stubAi({ headerRow: -1, date: 0, amount: 2 });
    const r = await parseStatement(xlsx, { fileName: "weird.xlsx", env: withKey, allowAi: true });
    expect(calls).toHaveLength(1);
    const sent = JSON.parse(calls[0].messages[1].content);
    expect(sent.length).toBeLessThanOrEqual(14);
    expect(r.aiCalls).toBe(1);
    expect(r.status).toBe("unreadable"); // the mapping pointed at a column with no dates, so no rows survive
  });

  it("without AI access explains how to fix an unreadable file", async () => {
    const xlsx = makeXlsx([{ name: "Sheet1", rows: [["Name", "Colour"], ["Ada", "Red"]] }]);
    const r = await parseStatement(xlsx, { fileName: "x.xlsx", env, allowAi: false });
    expect(r.status).toBe("unreadable");
    expect(r.message).toMatch(/Date, Description and Amount/);
  });
});

describe("text PDF", () => {
  const withBalance = makeTextPdf([
    "Statement of account",
    "Date Description Amount Balance",
    "2026-10-01 Opening deposit 100,000.00 100,000.00",
    "2026-10-02 Shoprite Ikeja 12,500.00 87,500.00",
    "2026-10-03 Salary Acme Ltd 50,000.00 137,500.00",
    "2026-10-04 Airtime 1,000.00 136,500.00",
  ]);

  it("reads rows and tells money in from money out using the running balance, with no AI", async () => {
    const spy = noAiAllowed();
    const r = await parseStatement(withBalance, { fileName: "s.pdf", env, allowAi: true });
    expect(r).toMatchObject({ status: "ok", fileType: "pdf", source: "heuristic", aiCalls: 0 });
    expect(r.rows.map((x) => [x.date, x.amount, x.type])).toEqual([
      ["2026-10-01", 100000, "income"], // first row: no earlier balance, "deposit" wording decides
      ["2026-10-02", 12500, "expense"],
      ["2026-10-03", 50000, "income"],
      ["2026-10-04", 1000, "expense"],
    ]);
    expect(spy).not.toHaveBeenCalled();
  });

  const vague = makeTextPdf(["2026-10-01 Coffee Shop 4.50", "2026-10-02 Bus fare 2.00", "2026-10-03 Lunch 9.75"]);

  it("flags low confidence without AI access and keeps the rows", async () => {
    const r = await parseStatement(vague, { fileName: "v.pdf", env, allowAi: false });
    expect(r.status).toBe("ok");
    expect(r.source).toBe("heuristic");
    expect(r.warnings.join(" ")).toMatch(/Low confidence/);
  });

  it("lets the AI double-check a vague statement, in one chunked text call", async () => {
    const calls = stubAi({
      transactions: [
        { date: "2026-10-01", description: "Coffee Shop", amount: 4.5, type: "expense" },
        { date: "2026-10-02", description: "Bus fare", amount: 2, type: "expense" },
        { date: "2026-10-03", description: "Lunch", amount: 9.75, type: "expense" },
      ],
    });
    const r = await parseStatement(vague, { fileName: "v.pdf", env: withKey, allowAi: true });
    expect(r).toMatchObject({ status: "ok", source: "ai", aiCalls: 1 });
    expect(r.rows).toHaveLength(3);
    expect(calls[0].messages[1].content).toContain("Coffee Shop");
    expect(JSON.stringify(calls[0])).not.toContain("image_url"); // text only
  });

  it("ignores an AI answer that finds fewer rows than the splitter did", async () => {
    stubAi({ transactions: [{ date: "2026-10-01", description: "x", amount: 1, type: "expense" }] });
    const r = await parseStatement(vague, { fileName: "v.pdf", env: withKey, allowAi: true });
    expect(r.source).toBe("heuristic");
    expect(r.rows).toHaveLength(3);
  });
});

describe("scanned PDF", () => {
  it("is declined clearly when the AI helper is not available", async () => {
    const r = await parseStatement(makeImageOnlyPdf(), { fileName: "scan.pdf", env, allowAi: false });
    expect(r).toMatchObject({ status: "needs_ocr", needsOcr: { pages: [1], pageCount: 1 } });
    expect(r.message).toMatch(/scanned/);
  });

  it("uses the PDF-capable model when allowed (stubbed here)", async () => {
    const calls = stubAi({ transactions: [{ date: "2026-10-01", description: "Scanned row", amount: 20, type: "expense" }] });
    const r = await parseStatement(makeImageOnlyPdf(), { fileName: "scan.pdf", env: withKey, allowAi: true });
    expect(r).toMatchObject({ status: "ok", source: "ai", aiCalls: 1 });
    expect(JSON.stringify(calls[0])).toContain("application/pdf;base64,");
  });
});

describe("unsupported and broken files", () => {
  it("explains legacy Excel", async () => {
    const r = await parseStatement(new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0, 0, 0]), { fileName: "old.xls", env, allowAi: false });
    expect(r.status).toBe("unsupported");
    expect(r.message).toMatch(/save as .xlsx/);
  });

  it("rejects oversized files before reading them", async () => {
    const r = await parseStatement(new Uint8Array(21 * 1024 * 1024), { fileName: "huge.csv", env, allowAi: false });
    expect(r.status).toBe("too_large");
  });

  it("does not crash on garbage", async () => {
    const r = await parseStatement(new Uint8Array([1, 2, 3, 0, 5]), { fileName: "junk.xlsx", env, allowAi: false });
    expect(["unreadable", "unsupported"]).toContain(r.status);
  });
});

describe("markdown tables", () => {
  it("are split into grids", () => {
    const md = "intro\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\ntext\n| C |\n| --- |\n| 3 |";
    expect(gridsFromMarkdown(md)).toEqual([[["A", "B"], ["1", "2"]], [["C"], ["3"]]]);
  });
});
