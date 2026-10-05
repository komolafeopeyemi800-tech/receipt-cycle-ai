import { env } from "cloudflare:test";
import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../src/index";
import { AI_CALLS_PER_DAY } from "../src/routes/uploads";
import { api, makeUser } from "./helpers";

afterEach(() => vi.unstubAllGlobals());

const withKey = { ...env, OPENAI_API_KEY: "sk-test" };

function stubAi(answer: unknown) {
  const spy = vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(answer) } }] }), { status: 200 }));
  vi.stubGlobal("fetch", spy);
  return spy;
}

const grid = [["Tarikh", "Bayani", "Kudi"], ["01-10-2026", "Siyayya", "-2,000"], ["02-10-2026", "Albashi", "50000"]];
const HASH = "a".repeat(64);
const aiRow = { date: "2026-10-01", amount: 5, type: "expense", category: "Other", merchant: "Scanned" };
const cacheResult = { status: "ok", source: "ai", fileType: "pdf", rows: [aiRow], warnings: [], aiCalls: 1 };

async function post(token: string | undefined, path: string, body: unknown, e: typeof env = withKey) {
  const res = await app.request(
    path,
    { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) },
    e,
  );
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : null };
}

describe("AI helper routes", () => {
  it("need a session", async () => {
    expect((await post(undefined, "/api/uploads/ai/map-columns", { grid })).status).toBe(401);
  });

  it("map columns from a small sample", async () => {
    const { token } = await makeUser();
    const spy = stubAi({ headerRow: 0, date: 0, description: 1, amount: 2 });
    const r = await post(token, "/api/uploads/ai/map-columns", { grid });
    expect(r.json.mapping).toMatchObject({ headerRow: 0, date: 0, description: 1, amount: 2 });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("extract rows from text and read a scanned PDF", async () => {
    const { token } = await makeUser();
    stubAi({ transactions: [{ date: "2026-10-01", description: "Scanned", amount: 5, type: "expense" }] });
    const text = await post(token, "/api/uploads/ai/extract", { text: "2026-10-01 Scanned 5.00" });
    expect(text.json.rows).toEqual([aiRow]);
    const pdf = await post(token, "/api/uploads/ai/ocr-pdf", { pdfBase64: "A".repeat(200) });
    expect(pdf.json.rows).toEqual([aiRow]);
  });

  it("reject bad input without calling the AI", async () => {
    const { token } = await makeUser();
    const spy = stubAi({});
    expect((await post(token, "/api/uploads/ai/map-columns", { grid: [["only one row"]] })).status).toBe(400);
    expect((await post(token, "/api/uploads/ai/extract", { text: "x".repeat(15_001) })).status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });

  it("explain an expired trial, a missing key and a disabled switch", async () => {
    const expired = await makeUser({ createdAt: Date.now() - 9 * 24 * 60 * 60 * 1000 });
    const blocked = await post(expired.token, "/api/uploads/ai/extract", { text: "2026-10-01 Coffee 4.50" });
    expect(blocked.status).toBe(402);
    expect(blocked.json.error).toMatch(/7-day trial ended/);

    const { token } = await makeUser();
    expect((await post(token, "/api/uploads/ai/extract", { text: "2026-10-01 Coffee 4.50" }, env)).status).toBe(503);

    await env.DB.prepare("INSERT INTO app_config (key, upload_enabled) VALUES ('global', 0)").run();
    expect((await post(token, "/api/uploads/ai/extract", { text: "2026-10-01 Coffee 4.50" })).status).toBe(403);
  });

  it("stop at the daily budget", async () => {
    const { token, id } = await makeUser({ pro: true });
    const spy = stubAi({ transactions: [] });
    await env.DB.prepare("INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, ?)").bind(`ai:${id}`, Date.now(), AI_CALLS_PER_DAY).run();
    const r = await post(token, "/api/uploads/ai/extract", { text: "2026-10-01 Coffee 4.50" });
    expect(r.status).toBe(429);
    expect(r.json.error).toMatch(/Daily limit reached/);
    expect(spy).not.toHaveBeenCalled();
  });

  it("do not leak provider errors", async () => {
    const { token } = await makeUser();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("secret provider detail", { status: 500 })));
    const r = await post(token, "/api/uploads/ai/extract", { text: "2026-10-01 Coffee 4.50" });
    expect(r.status).toBe(503);
    expect(JSON.stringify(r.json)).not.toContain("secret provider detail");
  });
});

describe("result cache", () => {
  const put = (token: string, body: unknown) => app.request("/api/uploads/cache", { method: "PUT", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify(body) }, env);
  const get = (token: string, hash: string) => app.request(`/api/uploads/cache?hash=${hash}`, { headers: { authorization: `Bearer ${token}` } }, env);

  it("stores an AI-assisted result and returns it", async () => {
    const { token } = await makeUser();
    expect((await get(token, HASH)).status).toBe(404);
    expect((await put(token, { hash: HASH, fileName: "s.pdf", result: cacheResult })).status).toBe(200);
    const hit = (await (await get(token, HASH)).json()) as any;
    expect(hit.result.rows).toEqual([aiRow]);
    expect((await put(token, { hash: HASH, fileName: "s.pdf", result: { ...cacheResult, rows: [{ ...aiRow, amount: 9 }] } })).status).toBe(200);
    expect(((await (await get(token, HASH)).json()) as any).result.rows[0].amount).toBe(9);
  });

  it("is private to each account and validates input", async () => {
    const a = await makeUser();
    const b = await makeUser();
    await put(a.token, { hash: HASH, fileName: "s.pdf", result: cacheResult });
    expect((await get(b.token, HASH)).status).toBe(404);
    expect((await put(a.token, { hash: "short", fileName: "x", result: cacheResult })).status).toBe(400);
    expect((await put(a.token, { hash: HASH, fileName: "x", result: { ...cacheResult, source: "heuristic" } })).status).toBe(400);
    expect((await put(a.token, { hash: HASH, fileName: "x", result: { ...cacheResult, rows: [] } })).status).toBe(400);
    expect((await get(a.token, "nothex")).status).toBe(400);
  });
});

describe("receipts in R2", () => {
  async function putReceipt(token: string, type = "image/jpeg", bytes: Uint8Array = new Uint8Array([1, 2, 3, 4])) {
    const form = new FormData();
    form.append("file", new File([bytes], "r.jpg", { type }));
    const res = await app.request("/api/receipts", { method: "POST", headers: { authorization: `Bearer ${token}` }, body: form }, env);
    return { status: res.status, json: (await res.json()) as any };
  }

  it("stores a receipt under the user's own prefix and serves it back", async () => {
    const { token, id } = await makeUser();
    const up = await putReceipt(token);
    expect(up.status).toBe(201);
    expect(up.json.key.startsWith(`receipts/${id}/`)).toBe(true);
    const res = await app.request(`/api/receipts/file?key=${encodeURIComponent(up.json.key)}`, { headers: { authorization: `Bearer ${token}` } }, env);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/jpeg");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3, 4]));
  });

  it("rejects wrong types, empty and oversized files", async () => {
    const { token } = await makeUser();
    expect((await putReceipt(token, "text/html")).status).toBe(400);
    expect((await putReceipt(token, "image/png", new Uint8Array())).status).toBe(400);
    expect((await putReceipt(token, "image/png", new Uint8Array(10 * 1024 * 1024 + 1))).status).toBe(413);
  });

  it("never lets one user read, delete or attach another's receipt", async () => {
    const a = await makeUser();
    const b = await makeUser();
    const key = (await putReceipt(a.token)).json.key as string;
    const get = await app.request(`/api/receipts/file?key=${encodeURIComponent(key)}`, { headers: { authorization: `Bearer ${b.token}` } }, env);
    expect(get.status).toBe(404);
    const del = await app.request(`/api/receipts?key=${encodeURIComponent(key)}`, { method: "DELETE", headers: { authorization: `Bearer ${b.token}` } }, env);
    expect(del.status).toBe(404);
    const attach = await api("POST", "/api/transactions", {
      token: b.token,
      body: { workspace: "personal", amount: 1, type: "expense", category: "Other", date: "2026-10-01", receipt_url: key },
    });
    expect(attach.status).toBe(400);
    expect(await env.FILES.head(key)).not.toBeNull();
  });

  it("deletes the stored file with its transaction, and everything with the account", async () => {
    const { token, id } = await makeUser({ pro: true });
    const key = (await putReceipt(token)).json.key as string;
    const tx = await api("POST", "/api/transactions", {
      token,
      body: { workspace: "personal", amount: 3, type: "expense", category: "Other", date: "2026-10-01", receipt_url: key },
    });
    expect((await api("GET", `/api/transactions/${tx.json.id}`, { token })).json.receipt_url).toBe(key);
    await api("DELETE", `/api/transactions/${tx.json.id}`, { token });
    expect(await env.FILES.head(key)).toBeNull();

    const k2 = (await putReceipt(token)).json.key as string;
    const k3 = (await putReceipt(token, "application/pdf")).json.key as string;
    await api("DELETE", "/api/me", { token });
    expect(await env.FILES.head(k2)).toBeNull();
    expect(await env.FILES.head(k3)).toBeNull();
    expect((await env.FILES.list({ prefix: `receipts/${id}/` })).objects).toHaveLength(0);
  });
});
