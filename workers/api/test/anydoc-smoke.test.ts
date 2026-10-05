import { describe, expect, it } from "vitest";
import { detectFormat, toDoc, toMarkdown } from "../src/docs/anydoc";

describe("anydoc inside the Workers runtime", () => {
  it("converts CSV to a table", () => {
    const csv = new TextEncoder().encode("Date,Description,Amount\n2026-10-01,Coffee,-4.50\n2026-10-02,Salary,1200\n");
    const doc = toDoc(csv, "csv");
    const table = doc.blocks.find((b) => b.kind === "table")!.table!;
    expect(table.grid.length).toBe(3);
    expect(toMarkdown(csv, "csv")).toContain("Coffee");
    expect(detectFormat(new TextEncoder().encode("%PDF-1.4\n"))).toBe("pdf");
  });
});
