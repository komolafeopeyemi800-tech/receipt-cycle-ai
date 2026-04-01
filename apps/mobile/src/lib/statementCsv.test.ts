import { describe, expect, it } from "vitest";
import { parseStatementCsv } from "./statementCsv";

describe("parseStatementCsv", () => {
  it("parses a simple Amount column export", () => {
    const csv = `Date,Description,Amount
01/15/2024,COFFEE SHOP,-5.50
01/16/2024,PAYROLL,1200.00`;
    const r = parseStatementCsv(csv);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rows.length).toBe(2);
    expect(r.rows[0]!.type).toBe("expense");
    expect(r.rows[0]!.amount).toBe(5.5);
    expect(r.rows[1]!.type).toBe("income");
    expect(r.rows[1]!.amount).toBe(1200);
  });
});
