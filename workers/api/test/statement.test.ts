import { describe, expect, it } from "vitest";
import { findHeaderRow, mapColumns, rowsFromGrid } from "../../../apps/mobile/src/lib/statementParse/statement";

const run = (grid: string[][]) => {
  const m = mapColumns(grid);
  return { m, res: m ? rowsFromGrid(grid, m) : null };
};

describe("bank statement with debit / credit columns and a preamble", () => {
  const grid = [
    ["First Bank — Statement of Account"],
    ["Account: 0123456789", "", "", ""],
    [""],
    ["Date", "Narration", "Debit", "Credit", "Balance"],
    ["03/10/2026", "POS Shoprite Ikeja", "12,500.00", "", "87,500.00"],
    ["05/10/2026", "Transfer from Ada", "", "50,000.00", "137,500.00"],
    ["25/10/2026", "Airtime", "1,000.00", "", "136,500.00"],
    ["", "Total", "13,500.00", "50,000.00", ""],
  ];

  it("finds the header below the preamble and maps the columns by name", () => {
    expect(findHeaderRow(grid)).toBe(3);
    expect(mapColumns(grid)).toMatchObject({ headerRow: 3, date: 0, description: 1, debit: 2, credit: 3, balance: 4 });
  });

  it("converts rows, using debit as expense and credit as income, and skips the totals line", () => {
    const { res } = run(grid);
    expect(res!.rows).toEqual([
      { date: "2026-10-03", amount: 12500, type: "expense", category: "Other", merchant: "POS Shoprite Ikeja" },
      { date: "2026-10-05", amount: 50000, type: "income", category: "Other", merchant: "Transfer from Ada" },
      { date: "2026-10-25", amount: 1000, type: "expense", category: "Other", merchant: "Airtime" },
    ]);
    expect(res!.skipped).toBe(1);
    expect(res!.warnings.join(" ")).toMatch(/1 row without a date or amount/);
  });
});

describe("single signed amount column", () => {
  it("treats negatives as expenses and positives as income", () => {
    const { res } = run([
      ["Date", "Description", "Amount"],
      ["2026-10-01", "Coffee", "-4.50"],
      ["2026-10-02", "Salary", "1200"],
    ]);
    expect(res!.rows.map((r) => [r.type, r.amount])).toEqual([["expense", 4.5], ["income", 1200]]);
  });

  it("treats an all-positive column as expenses and says so", () => {
    const { res } = run([
      ["Date", "Merchant", "Amount"],
      ["2026-10-01", "Uber", "8.20"],
      ["2026-10-02", "Lunch", "14.00"],
    ]);
    expect(res!.rows.every((r) => r.type === "expense")).toBe(true);
    expect(res!.warnings.join(" ")).toMatch(/Every amount is positive/);
  });

  it("uses a type column when there is one", () => {
    const { res } = run([
      ["Date", "Details", "Type", "Amount"],
      ["2026-10-01", "Rent", "Debit", "500"],
      ["2026-10-02", "Refund", "Credit", "30"],
      ["2026-10-03", "Mystery", "", "-7"],
    ]);
    expect(res!.rows.map((r) => r.type)).toEqual(["expense", "income", "expense"]);
  });
});

describe("dates", () => {
  it("reads Excel serial dates and learns day/month order from the data", () => {
    const { res } = run([
      ["Date", "Description", "Amount"],
      ["45000", "Serial date row", "-1"],
      ["13/04/2026", "Day first", "-2"],
      ["03/04/2026", "Ambiguous", "-3"],
    ]);
    expect(res!.rows.map((r) => r.date)).toEqual(["2023-03-15", "2026-04-13", "2026-04-03"]);
  });

  it("warns when day/month order cannot be known", () => {
    const { res } = run([
      ["Date", "Description", "Amount"],
      ["03/04/2026", "A", "-1"],
    ]);
    expect(res!.warnings.join(" ")).toMatch(/day\/month or month\/day/);
  });
});

describe("headerless and unusable sheets", () => {
  it("maps by value shape when there is no header", () => {
    const { m, res } = run([
      ["2026-10-01", "Coffee", "-4.50"],
      ["2026-10-02", "Salary", "1200"],
    ]);
    expect(m).toMatchObject({ headerRow: -1, date: 0, description: 1, amount: 2 });
    expect(res!.rows).toHaveLength(2);
  });

  it("gives up (so the AI helper can try) when no date or money column exists", () => {
    expect(mapColumns([["Name", "Colour"], ["Ada", "Red"]])).toBeNull();
    expect(mapColumns([["Date"]])).toBeNull();
  });

  it("uses a category column when present", () => {
    const { res } = run([
      ["Date", "Description", "Amount", "Category"],
      ["2026-10-01", "Bus", "-2", "Transport"],
    ]);
    expect(res!.rows[0]!.category).toBe("Transport");
  });
});
