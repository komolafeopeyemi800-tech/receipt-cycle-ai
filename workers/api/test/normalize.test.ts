import { describe, expect, it } from "vitest";
import { detectDateOrder, excelSerialToIso, parseAmount, parseDate } from "../src/docs/normalize";

describe("parseDate", () => {
  it("reads ISO and slash/dot/dash dates", () => {
    expect(parseDate("2026-10-05")).toBe("2026-10-05");
    expect(parseDate("2026/10/05")).toBe("2026-10-05");
    expect(parseDate("2026-10-05T14:30:00Z")).toBe("2026-10-05");
    expect(parseDate("05.10.2026")).toBe("2026-10-05");
    expect(parseDate("5-10-26")).toBe("2026-10-05");
  });

  it("uses the column order for ambiguous dates but trusts impossible months", () => {
    expect(parseDate("03/04/2026", "dmy")).toBe("2026-04-03");
    expect(parseDate("03/04/2026", "mdy")).toBe("2026-03-04");
    expect(parseDate("25/04/2026", "mdy")).toBe("2026-04-25");
    expect(parseDate("04/25/2026", "dmy")).toBe("2026-04-25");
  });

  it("reads month names", () => {
    expect(parseDate("5 Oct 2026")).toBe("2026-10-05");
    expect(parseDate("05-Oct-26")).toBe("2026-10-05");
    expect(parseDate("October 5, 2026")).toBe("2026-10-05");
    expect(parseDate("Oct 5th 2026")).toBe("2026-10-05");
    expect(parseDate("5th September 2026")).toBe("2026-09-05");
  });

  it("converts Excel serial numbers", () => {
    expect(excelSerialToIso(45000)).toBe("2023-03-15");
    expect(parseDate("45000")).toBe("2023-03-15");
    expect(parseDate(45000)).toBe("2023-03-15");
    expect(parseDate("123")).toBeNull();
  });

  it("rejects things that are not dates", () => {
    for (const bad of ["", "Total", "31/02/2026", "13/13/2026", "1234.56", null, undefined]) {
      expect(parseDate(bad as unknown)).toBeNull();
    }
  });
});

describe("detectDateOrder", () => {
  it("finds the order from any unambiguous value", () => {
    expect(detectDateOrder(["03/04/2026", "25/04/2026"])).toBe("dmy");
    expect(detectDateOrder(["03/04/2026", "04/25/2026"])).toBe("mdy");
    expect(detectDateOrder(["03/04/2026", "05/06/2026"])).toBeNull();
    expect(detectDateOrder(["2026-10-05"])).toBeNull();
  });
});

describe("parseAmount", () => {
  it("handles symbols, separators and signs", () => {
    expect(parseAmount("$1,234.50")).toBe(1234.5);
    expect(parseAmount("-4.50")).toBe(-4.5);
    expect(parseAmount("(45.00)")).toBe(-45);
    expect(parseAmount("45.00-")).toBe(-45);
    expect(parseAmount("₦ 2,500")).toBe(2500);
    expect(parseAmount("1.234,50")).toBe(1234.5);
    expect(parseAmount("12,50")).toBe(12.5);
    expect(parseAmount("1,234")).toBe(1234);
    expect(parseAmount("1,234,567.89")).toBe(1234567.89);
    expect(parseAmount("12.5 CR")).toBe(12.5);
    expect(parseAmount("12.5 DR")).toBe(-12.5);
    expect(parseAmount("+7")).toBe(7);
    expect(parseAmount(1200)).toBe(1200);
  });

  it("returns null for non-money", () => {
    for (const bad of ["", "Coffee", "—", null, undefined, "N/A"]) {
      expect(parseAmount(bad as unknown)).toBeNull();
    }
  });
});
