import { env } from "cloudflare:test";
import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../src/index";
import { AI_UPLOADS_PER_DAY } from "../src/routes/uploads";
import { api, makeUser } from "./helpers";
import { makeImageOnlyPdf, makeTextPdf, makeXlsx } from "./fixtures";

afterEach(() => vi.unstubAllGlobals());

const withKey = { ...env, OPENAI_API_KEY: "sk-test" };

async function upload(token: string | undefined, name: string, bytes: Uint8Array, type = "application/octet-stream", opts: { path?: string; e?: typeof env } = {}) {
  const form = new FormData();
  form.append("file", new File([bytes], name, { type }));
  const res = await app.request(
    opts.path ?? "/api/uploads/statement",
    { method: "POST", headers: token ? { authorization: `Bearer ${token}` } : {}, body: form },
    opts.e ?? env,
  );
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : null };
}

const csv = (rows = 2) =>
  new TextEncoder().encode(
    ["Date,Description,Amount", ...Array.from({ length: rows }, (_, i) => `2026-10-0${(i % 9) + 1},Item ${i},-${i + 1}.00`)].join("\n"),
  );

function stubAi(answer: unknown) {
  const spy = vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(answer) } }] }), { status: 200 }));
  vi.stubGlobal("fetch", spy);
  return spy;
}

describe("POST /api/uploads/statement", () => {
  it("needs a session and a file", async () => {
    expect((await upload(undefined, "a.csv", csv())).status).toBe(401);
    const { token } = await makeUser();
    const res = await app.request("/api/uploads/statement", { method: "POST", headers: { authorization: `Bearer ${token}` }, body: new FormData() }, env);
    expect(res.status).toBe(400);
  });

  it("reads a spreadsheet and returns a preview without importing anything", async () => {
    const { token } = await makeUser();
    const r = await upload(token, "march.xlsx", makeXlsx([{ name: "March", rows: [["Date", "Description", "Amount"], ["2026-03-01", "Coffee", -4.5]] }]));
    expect(r.status).toBe(200);
    expect(r.json).toMatchObject({ status: "ok", fileType: "xlsx", source: "heuristic", cached: false, fileName: "march.xlsx" });
    expect(r.json.fileHash).toMatch(/^[0-9a-f]{64}$/);
    expect((await api("GET", "/api/transactions", { token })).json).toEqual([]);
  });

  it("remembers a file: the second upload is served from the saved result and costs nothing", async () => {
    const { token } = await makeUser();
    const bytes = csv(3);
    const first = await upload(token, "s.csv", bytes);
    expect(first.json.cached).toBe(false);
    const parseSpy = vi.fn();
    vi.stubGlobal("fetch", parseSpy);
    const second = await upload(token, "renamed.csv", bytes);
    expect(second.json).toMatchObject({ cached: true, status: "ok", fileName: "renamed.csv" });
    expect(second.json.rows).toEqual(first.json.rows);
    expect(parseSpy).not.toHaveBeenCalled();
    const fresh = await upload(token, "s.csv", bytes, "text/csv", { path: "/api/uploads/statement?refresh=1" });
    expect(fresh.json.cached).toBe(false);
  });

  it("keeps each user's saved results separate", async () => {
    const a = await makeUser();
    const b = await makeUser();
    const bytes = csv();
    await upload(a.token, "s.csv", bytes);
    expect((await upload(b.token, "s.csv", bytes)).json.cached).toBe(false);
  });

  it("tells an expired trial why the AI helper is off, but still reads simple files", async () => {
    const { token } = await makeUser({ createdAt: Date.now() - 9 * 24 * 60 * 60 * 1000 });
    const scanned = await upload(token, "scan.pdf", makeImageOnlyPdf(), "application/pdf", { e: withKey });
    expect(scanned.json.status).toBe("needs_ocr");
    expect(scanned.json.warnings.join(" ")).toMatch(/7-day trial ended/);
    expect((await upload(token, "ok.csv", csv())).json.status).toBe("ok");
  });

  it("spends AI only when a file needs it, and stops at the daily cap", async () => {
    const { token, id } = await makeUser({ pro: true });
    const spy = stubAi({ transactions: [{ date: "2026-10-01", description: "Scanned", amount: 5, type: "expense" }] });
    const first = await upload(token, "scan.pdf", makeImageOnlyPdf(), "application/pdf", { e: withKey });
    expect(first.json).toMatchObject({ status: "ok", source: "ai" });
    expect(spy).toHaveBeenCalledTimes(1);

    const now = Date.now();
    for (let i = 0; i < AI_UPLOADS_PER_DAY; i++) {
      await env.DB.prepare("INSERT INTO upload_parses (id, user_id, file_hash, file_name, source, row_count, result, created_at) VALUES (?, ?, ?, 'x', 'ai', 1, '{}', ?)")
        .bind(`fill-${i}`, id, `hash-${i}`, now)
        .run();
    }
    const blocked = await upload(token, "scan2.pdf", new Uint8Array([...makeImageOnlyPdf(), 10]), "application/pdf", { e: withKey });
    expect(blocked.json.status).toBe("needs_ocr");
    expect(blocked.json.warnings.join(" ")).toMatch(/Daily limit reached/);
    expect(spy).toHaveBeenCalledTimes(1);
    // A file that needs no AI is unaffected by the cap.
    expect((await upload(token, "plain.csv", csv(4))).json.status).toBe("ok");
  });

  it("reads a text PDF with no AI even for Pro users", async () => {
    const { token } = await makeUser({ pro: true });
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    const pdf = makeTextPdf(["Date Description Amount Balance", "2026-10-02 Shoprite 12,500.00 87,500.00", "2026-10-03 Salary 50,000.00 137,500.00"]);
    const r = await upload(token, "s.pdf", pdf, "application/pdf", { e: withKey });
    expect(r.json).toMatchObject({ status: "ok", source: "heuristic", aiCalls: 0 });
    expect(spy).not.toHaveBeenCalled();
  });

  it("honours the admin switch and maintenance mode", async () => {
    const { token } = await makeUser();
    await env.DB.prepare("INSERT INTO app_config (key, upload_enabled) VALUES ('global', 0)").run();
    expect((await upload(token, "a.csv", csv())).status).toBe(403);
    await env.DB.prepare("UPDATE app_config SET upload_enabled = 1, maintenance_mode = 1").run();
    expect((await upload(token, "a.csv", csv())).status).toBe(503);
  });

  it("imports the previewed rows through the existing bulk endpoint", async () => {
    const { token } = await makeUser({ pro: true });
    const preview = await upload(token, "s.csv", csv(5));
    const imported = await api("POST", "/api/transactions/bulk-import", { token, body: { workspace: "personal", rows: preview.json.rows } });
    expect(imported.json).toEqual({ inserted: 5, truncated: false });
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
