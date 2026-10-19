import { describe, expect, it } from "vitest";
import { NO_FILTER, applyReceiptFilters, isFiltering } from "./ReceiptFilters";
import type { DocTx } from "@/lib/transactionMath";

const rows: DocTx[] = [
  { id: "1", amount: 12, type: "expense", category: "Groceries", merchant: "Target", date: "2026-03-01" },
  { id: "2", amount: 30, type: "expense", category: "Groceries", merchant: "Walmart", date: "2026-03-02" },
  { id: "3", amount: 5, type: "expense", category: "Coffee", merchant: "Starbucks", date: "2026-03-03" },
  { id: "4", amount: 900, type: "income", category: "Sales", merchant: null, date: "2026-03-04" },
];

describe("applyReceiptFilters", () => {
  it("shows everything when no filter is set", () => {
    expect(isFiltering(NO_FILTER)).toBe(false);
    expect(applyReceiptFilters(rows, NO_FILTER)).toHaveLength(4);
  });

  it("keeps only the chosen category, ignoring letter case", () => {
    expect(applyReceiptFilters(rows, { ...NO_FILTER, category: "groceries" }).map((t) => t.id)).toEqual(["1", "2"]);
  });

  it("matches part of a merchant name", () => {
    expect(applyReceiptFilters(rows, { ...NO_FILTER, merchant: "star" }).map((t) => t.id)).toEqual(["3"]);
  });

  it("combines category, merchant and type", () => {
    expect(applyReceiptFilters(rows, { category: "Groceries", merchant: "wal", type: "expense" }).map((t) => t.id)).toEqual(["2"]);
    expect(applyReceiptFilters(rows, { ...NO_FILTER, type: "income" }).map((t) => t.id)).toEqual(["4"]);
    expect(applyReceiptFilters(rows, { category: "Coffee", merchant: "target", type: "all" })).toEqual([]);
  });
});
