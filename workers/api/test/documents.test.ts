import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import app from "../src/index";
import { api, makeUser } from "./helpers";

async function upload(token: string, name: string, bytes: Uint8Array | string, kind = "bank_statement", meta: unknown = { bankName: "Northfield", accountLast4: "1893" }, type = "text/csv") {
  const form = new FormData();
  form.set("file", new File([bytes as never], name, { type }));
  form.set("kind", kind);
  form.set("meta", JSON.stringify(meta));
  const res = await app.request("/api/documents", { method: "POST", headers: { authorization: `Bearer ${token}` }, body: form }, env);
  return { status: res.status, json: (await res.json()) as any };
}

describe("documents", () => {
  it("stores the original file under the user's receipt prefix with its details, lists it, and deletes row and object", async () => {
    const { token, id: userId } = await makeUser();
    const up = await upload(token, "march.csv", "Date,Description,Amount\n03/01/2026,Coffee,-4.50\n");
    expect(up.status).toBe(201);
    expect(up.json.key).toMatch(new RegExp(`^receipts/${userId}/[0-9a-f-]+\.csv$`));
    expect(await env.FILES.head(up.json.key)).not.toBeNull();

    const list = await api("GET", "/api/documents", { token });
    expect(list.json).toHaveLength(1);
    expect(list.json[0]).toMatchObject({ id: up.json.id, kind: "bank_statement", fileName: "march.csv", r2Key: up.json.key, mime: "text/csv", meta: { bankName: "Northfield", accountLast4: "1893" } });

    expect((await api("DELETE", `/api/documents/${up.json.id}`, { token })).status).toBe(200);
    expect(await env.FILES.head(up.json.key)).toBeNull();
    expect((await api("GET", "/api/documents", { token })).json).toEqual([]);
  });

  it("accepts csv, xlsx, xls, ods, pdf, jpg and png and refuses other types", async () => {
    const { token } = await makeUser();
    for (const name of ["a.csv", "a.xlsx", "a.xls", "a.ods", "a.pdf", "a.jpg", "a.jpeg", "a.png"]) expect((await upload(token, name, "x")).status, name).toBe(201);
    expect((await upload(token, "a.exe", "x")).status).toBe(400);
    expect((await upload(token, "a.csv", "x", "wrong-kind")).status).toBe(400);
    expect((await upload(token, "empty.csv", "")).status).toBe(400);
  });

  it("refuses files over 10 MB with a friendly message", async () => {
    const { token } = await makeUser();
    const r = await upload(token, "big.pdf", new Uint8Array(10 * 1024 * 1024 + 1), "other", {}, "application/pdf");
    expect(r.status).toBe(413);
    expect(r.json.error).toBe("This file is larger than the 10 MB limit.");
  });

  it("keeps documents private to their owner", async () => {
    const a = await makeUser();
    const b = await makeUser();
    const up = await upload(a.token, "mine.csv", "x");
    expect((await api("GET", "/api/documents", { token: b.token })).json).toEqual([]);
    expect((await api("DELETE", `/api/documents/${up.json.id}`, { token: b.token })).status).toBe(404);
    expect((await api("GET", "/api/documents")).status).toBe(401);
  });

  it("is removed, rows and files, when the account is deleted", async () => {
    const { token, id } = await makeUser();
    const up = await upload(token, "gone.csv", "x");
    expect(await env.FILES.head(up.json.key)).not.toBeNull();
    expect((await api("DELETE", "/api/me", { token })).status).toBe(200);
    expect(await env.FILES.head(up.json.key)).toBeNull();
    const rows = await env.DB.prepare("SELECT COUNT(*) AS n FROM documents WHERE user_id = ?").bind(id).first<{ n: number }>();
    expect(rows!.n).toBe(0);
  });

  it("lets an imported transaction link to the stored original through receipt_url", async () => {
    const { token } = await makeUser();
    const up = await upload(token, "march.csv", "x");
    const r = await api("POST", "/api/transactions/bulk-import", { token, body: { workspace: "personal", receipt_url: up.json.key, rows: [{ amount: 4.5, type: "expense", category: "Other", date: "2026-03-01", merchant: "Coffee" }] } });
    expect(r.status).toBe(200);
    const list = await api("GET", "/api/transactions?workspace=personal", { token });
    expect(list.json[0].receipt_url).toBe(up.json.key);
  });
});
