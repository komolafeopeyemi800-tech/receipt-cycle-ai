import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { sha256HexJs } from "../../../apps/mobile/src/lib/statementParse/sha256";
import { FILE_TOO_BIG, MAX_FILE_BYTES, parseStatement, readPdfOnServer, readScanCached, readStatementPhoto, sha256Hex } from "../../../apps/mobile/src/lib/statementParse/pipeline";
import { apiReadDocument } from "../../../apps/mobile/src/lib/statementParse/apiTools";
import { testEngine } from "./anydocEngine";

const memoryCache = () => {
  const map = new Map<string, unknown>();
  return { map, get: async (h: string) => map.get(h) ?? null, put: async (h: string, _n: string, r: unknown) => void map.set(h, r) };
};
const rows = [
  { date: "2026-03-01", amount: 100, type: "income" as const, category: "Other", merchant: "A" },
  { date: "2026-03-02", amount: 40, type: "expense" as const, category: "Other", merchant: "B" },
];
const countingAi = (outcome: unknown) => {
  const calls = { n: 0 };
  return { calls, ai: { mapColumns: async () => null, extractRows: async () => ({ rows: [], calls: 0, truncated: false }), ocrPdf: async () => { calls.n++; return outcome; } } as never };
};

describe("SHA-256 on the phone", () => {
  it("matches the real thing for every padding case", async () => {
    for (const n of [0, 1, 3, 55, 56, 63, 64, 65, 119, 120, 1000, 100_000]) {
      const b = Uint8Array.from({ length: n }, (_, i) => (i * 31 + 7) & 255);
      expect(sha256HexJs(b), `${n} bytes`).toBe(createHash("sha256").update(b).digest("hex"));
      expect(await sha256Hex(b)).toBe(sha256HexJs(b));
    }
  });
});

describe("pay once per file", () => {
  const file = new Uint8Array([1, 2, 3, 4]);

  it("a photo statement that passed the balance check is read once; the second upload comes from the saved result", async () => {
    const cache = memoryCache();
    const { ai, calls } = countingAi({ rows, opening: 1000, closing: 1060 });
    const first = await readStatementPhoto(file, "image/jpeg", ai, cache);
    expect(first.status).toBe("ok");
    expect(calls.n).toBe(1);
    const again = await readStatementPhoto(file, "image/jpeg", ai, cache);
    expect(again).toMatchObject({ status: "ok", cached: true });
    expect(again.rows).toEqual(first.rows);
    expect(calls.n).toBe(1);
  });

  it("a refused scan is never saved, so a clearer re-upload of the same file can be tried again", async () => {
    const cache = memoryCache();
    const { ai, calls } = countingAi({ rows, opening: 1000, closing: 9999 });
    expect((await readPdfOnServer(file, ai, cache)).status).toBe("unreadable");
    expect(cache.map.size).toBe(0);
    await readPdfOnServer(file, ai, cache);
    expect(calls.n).toBe(2);
  });

  it("a broken cache never blocks a read", async () => {
    const broken = { get: async () => { throw new Error("down"); }, put: async () => { throw new Error("down"); } };
    const { ai } = countingAi({ rows, opening: 1000, closing: 1060 });
    expect((await readScanCached(file, broken, async () => readPdfOnServer(file, ai))).status).toBe("ok");
  });

  it("a receipt or invoice read twice (same kind) is paid for once", async () => {
    const store = memoryCache();
    let reads = 0;
    const client = {
      action: async (ref: { name: string }, args: Record<string, unknown>) => {
        if (ref.name === "uploads.aiReadDocument") { reads++; return { extracted_data: { merchant_name: "Cedar Ridge", total_amount: 9635.35, date: "2026-03-20", invoice_number: "CR-77120" } }; }
        if (ref.name === "uploads.cacheGet") return store.map.get(String(args.hash)) ?? null;
        if (ref.name === "uploads.cachePut") { store.map.set(String(args.hash), args.result); return; }
        throw new Error(ref.name);
      },
    };
    const read = apiReadDocument(client as never);
    const file2 = new Uint8Array([9, 9, 9]);
    const a = await read(file2, { kind: "invoice" });
    const b = await read(file2, { kind: "invoice" });
    expect(b).toEqual(a);
    expect(reads).toBe(1);
    await read(file2, { kind: "receipt" }); // a different kind is a different read
    expect(reads).toBe(2);
  });
});

describe("10 MB per file", () => {
  it("is refused up front with the friendly message", async () => {
    const big = new Uint8Array(MAX_FILE_BYTES + 1);
    expect(MAX_FILE_BYTES).toBe(10 * 1024 * 1024);
    expect(FILE_TOO_BIG).toBe("Files can be up to 10 MB for now. Choose a smaller file or split it.");
    expect(await parseStatement(big, { fileName: "big.csv", engine: testEngine })).toMatchObject({ status: "too_large", message: FILE_TOO_BIG });
    expect((await readStatementPhoto(big, "image/png", countingAi(null).ai)).message).toBe(FILE_TOO_BIG);
    expect((await readPdfOnServer(big, countingAi(null).ai)).message).toBe(FILE_TOO_BIG);
  });
});
