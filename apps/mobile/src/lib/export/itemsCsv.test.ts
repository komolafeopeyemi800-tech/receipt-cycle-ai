import { describe, expect, it } from "vitest";
import { buildItemsCsv, ITEMS_CSV_HEADER } from "./itemsCsv";
import type { ExportTransaction } from "./exportModel";

const tx = (id: string, date: string, merchant: string, amount: number, items?: unknown[]): ExportTransaction => ({
  id, date, type: "expense", amount, merchant, category: "Groceries", receipt_data: items ? { currency: "USD", items } : null,
});

const lines = (csv: string) => csv.replace(/^﻿/, "").split("\r\n");

describe("buildItemsCsv", () => {
  const rows = [
    tx("b", "2026-03-10", "Target", 12.5, [{ name: "Whole Milk", quantity: 1, unit_price: 3.5, total: 3.5 }, { name: "Eggs", quantity: 2, unit_price: 4, total: 8 }]),
    tx("a", "2026-01-05", "Target", 9.99, [{ name: "whole milk", quantity: 1, unit_price: 3.0, total: 3.0 }]),
    tx("c", "2026-02-01", "Corner shop", 5, undefined),
  ];

  it("has one row per item, sorted by item then date, with the price change since the last purchase", () => {
    const out = lines(buildItemsCsv(rows));
    expect(out[0]).toBe(ITEMS_CSV_HEADER.join(","));
    expect(out).toHaveLength(1 + 4);
    expect(out[1]).toContain("Eggs,2026-03-10");
    // milk: first purchase has no change, the next one is +0.5 (+16.67%)
    expect(out[2].startsWith("whole milk,2026-01-05")).toBe(true);
    expect(out[2]).toContain(",,,");
    expect(out[3].startsWith("Whole Milk,2026-03-10")).toBe(true);
    expect(out[3]).toContain(",0.5,16.67,");
  });

  it("keeps a receipt with no itemised lines as one row at the end", () => {
    const out = lines(buildItemsCsv(rows));
    expect(out[out.length - 1]).toContain("(no itemised lines),2026-02-01,Corner shop");
  });

  it("is safe to open in Excel: item names that start with = are not formulas", () => {
    const out = lines(buildItemsCsv([tx("x", "2026-01-01", "Shop", 1, [{ name: "=HYPERLINK(\"x\")", total: 1 }])]));
    expect(out[1].startsWith("\"'=HYPERLINK")).toBe(true);
  });
});
