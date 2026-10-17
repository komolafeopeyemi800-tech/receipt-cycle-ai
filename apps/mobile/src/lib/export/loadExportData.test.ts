import { describe, expect, it } from "vitest";
import { buildTransactionsCsv, csvCell } from "./exportCsv";
import { loadExportData, type ExportApi } from "./loadExportData";

const err = (status: number) => Object.assign(new Error("x"), { status });
const txs = [{ receipt_url: "receipts/u1/a.jpg" }, { receipt_url: "https://legacy.example/x.png" }, { receipt_url: null }];

describe("loadExportData", () => {
  it("tolerates a 404 from /api/documents and still builds links for receipts", async () => {
    const calls: string[] = [];
    const api: ExportApi = {
      async request(method, path, opts) {
        calls.push(`${method} ${path}`);
        if (path === "/api/documents") throw err(404);
        return { links: Object.fromEntries(((opts?.body as { keys: string[] }).keys).map((k) => [k, `https://x/${k}`])) } as never;
      },
    };
    const r = await loadExportData(api, "tok", txs);
    expect(r.documents).toEqual([]);
    expect(r.documentsAvailable).toBe(false);
    expect(r.links).toEqual({ "receipts/u1/a.jpg": "https://x/receipts/u1/a.jpg" });
    expect(calls).toContain("POST /api/receipts/links");
  });

  it("returns documents and links for their keys, and survives a failing links endpoint", async () => {
    const api: ExportApi = {
      async request(_m, path) {
        if (path === "/api/documents") return [{ id: "d", kind: "invoice", fileName: "a.pdf", r2Key: "receipts/u1/d.pdf", meta: {} }] as never;
        throw err(500);
      },
    };
    const r = await loadExportData(api, "tok", txs);
    expect(r.documents).toHaveLength(1);
    expect(r.documentsAvailable).toBe(true);
    expect(r.links).toEqual({});
  });

  it("rethrows sign-in errors", async () => {
    const api: ExportApi = { async request() { throw err(401); } };
    await expect(loadExportData(api, "tok", txs)).rejects.toMatchObject({ status: 401 });
  });
});

describe("csv", () => {
  it("neutralises formulas, quotes commas and includes the document link column", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(csvCell("-12.50")).toBe("-12.50");
    const csv = buildTransactionsCsv(
      [{ id: "1", date: "2026-03-04", type: "expense", amount: 12.5, merchant: "A, B", category: "Fuel", receipt_url: "receipts/u1/a.jpg" }],
      { dateFormat: "us", links: { "receipts/u1/a.jpg": "https://x/y" } },
    );
    const [head, row] = csv.replace("﻿", "").split("\r\n");
    expect(head).toContain("Document link");
    expect(row).toContain("03/04/2026");
    expect(row).toContain('"A, B"');
    expect(row).toContain("https://x/y");
  });
});
