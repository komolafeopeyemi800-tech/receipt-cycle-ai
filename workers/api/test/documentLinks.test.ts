import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import app from "../src/index";
import { signSharedLink } from "../src/routes/documentLinks";
import { api, makeUser } from "./helpers";

async function put(userId: string, name: string, body: string, contentType: string) {
  const key = `receipts/${userId}/${name}`;
  await env.FILES.put(key, body, { httpMetadata: { contentType }, customMetadata: { userId, originalName: name } });
  return key;
}
const open = (url: string) => app.request(url.replace("http://localhost", ""), {}, env);
const makeLinks = async (token: string, keys: string[]) => api("POST", "/api/receipts/links", { token, body: { keys } });

describe("signed document links", () => {
  it("creates a link that opens the file with no sign-in, with safe headers", async () => {
    const { token, id } = await makeUser();
    const key = await put(id, "a1.pdf", "%PDF-1.4 hello", "application/pdf");
    const res = await makeLinks(token, [key]);
    expect(res.status).toBe(200);
    const url = res.json.links[key] as string;
    expect(url).toContain("/api/receipts/shared?key=");
    const file = await open(url); // no Authorization header
    expect(file.status).toBe(200);
    expect(await file.text()).toBe("%PDF-1.4 hello");
    expect(file.headers.get("content-type")).toBe("application/pdf");
    expect(file.headers.get("content-disposition")).toMatch(/^inline; filename="a1.pdf"/);
    expect(file.headers.get("cache-control")).toContain("private");
    expect(file.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("downloads (never renders) types that could run script", async () => {
    const { token, id } = await makeUser();
    const key = await put(id, "evil.html", "<script>alert(1)</script>", "text/html");
    const url = (await makeLinks(token, [key])).json.links[key] as string;
    const file = await open(url);
    expect(file.status).toBe(200);
    expect(file.headers.get("content-type")).toBe("application/octet-stream");
    expect(file.headers.get("content-disposition")).toMatch(/^attachment/);
  });

  it("rejects a tampered key, expiry or signature, and a missing signature", async () => {
    const { token, id } = await makeUser();
    const key = await put(id, "a2.png", "png", "image/png");
    const other = await put(id, "b2.png", "other", "image/png");
    const u = new URL((await makeLinks(token, [key])).json.links[key] as string);
    const mk = (patch: Record<string, string | null>) => {
      const q = new URLSearchParams(u.search);
      for (const [k, v] of Object.entries(patch)) (v === null ? q.delete(k) : q.set(k, v));
      return `/api/receipts/shared?${q.toString()}`;
    };
    expect((await app.request(mk({}), {}, env)).status).toBe(200);
    expect((await app.request(mk({ key: other }), {}, env)).status).toBe(404);
    expect((await app.request(mk({ exp: String(Number(u.searchParams.get("exp")) + 1000) }), {}, env)).status).toBe(404);
    const sig = u.searchParams.get("sig")!;
    expect((await app.request(mk({ sig: sig.slice(0, -1) + (sig.endsWith("A") ? "B" : "A") }), {}, env)).status).toBe(404);
    expect((await app.request(mk({ sig: null }), {}, env)).status).toBe(404);
  });

  it("rejects an expired link even with a correct signature", async () => {
    const { id } = await makeUser();
    const key = await put(id, "a3.png", "png", "image/png");
    const exp = Math.floor(Date.now() / 1000) - 10;
    const sig = await signSharedLink(env.BETTER_AUTH_SECRET, key, exp);
    const res = await app.request(`/api/receipts/shared?key=${encodeURIComponent(key)}&exp=${exp}&sig=${encodeURIComponent(sig)}`, {}, env);
    expect(res.status).toBe(404);
    const fresh = Math.floor(Date.now() / 1000) + 60;
    const ok = await signSharedLink(env.BETTER_AUTH_SECRET, key, fresh);
    expect((await app.request(`/api/receipts/shared?key=${encodeURIComponent(key)}&exp=${fresh}&sig=${encodeURIComponent(ok)}`, {}, env)).status).toBe(200);
  });

  it("does not accept the old evidence signature as a document link (domain separation)", async () => {
    const { id } = await makeUser();
    const key = await put(id, "a4.png", "png", "image/png");
    const { receiptEvidenceSignature } = await import("../src/routes/receipts");
    const legacy = await receiptEvidenceSignature(env.BETTER_AUTH_SECRET, key);
    const exp = Math.floor(Date.now() / 1000) + 600;
    expect((await app.request(`/api/receipts/shared?key=${encodeURIComponent(key)}&exp=${exp}&sig=${encodeURIComponent(legacy)}`, {}, env)).status).toBe(404);
  });

  it("refuses to create links for someone else's files, traversal, junk and oversized requests", async () => {
    const a = await makeUser();
    const b = await makeUser();
    const theirs = await put(b.id, "secret.pdf", "x", "application/pdf");
    const mine = await put(a.id, "mine.pdf", "x", "application/pdf");
    expect((await makeLinks(a.token, [mine, theirs])).status).toBe(404);
    expect((await makeLinks(a.token, [`receipts/${a.id}/../${b.id}/secret.pdf`])).status).toBe(404);
    expect((await makeLinks(a.token, [`receipts/${a.id}/..%2F${b.id}`])).status).toBe(404);
    expect((await makeLinks(a.token, [`receipts/${a.id}/x/y.pdf`])).status).toBe(404);
    expect((await makeLinks(a.token, ["receipts/"])).status).toBe(404);
    expect((await api("POST", "/api/receipts/links", { token: a.token, body: { keys: [42] } })).status).toBe(404);
    expect((await api("POST", "/api/receipts/links", { token: a.token, body: { nope: 1 } })).status).toBe(400);
    expect((await makeLinks(a.token, Array.from({ length: 501 }, (_, i) => `receipts/${a.id}/f${i}.pdf`))).status).toBe(400);
    expect((await api("POST", "/api/receipts/links", { body: { keys: [mine] } })).status).toBe(401);
  });

  it("allows 500 keys at once and refuses traversal on the public endpoint", async () => {
    const a = await makeUser();
    const keys = Array.from({ length: 500 }, (_, i) => `receipts/${a.id}/f${i}.pdf`);
    const res = await makeLinks(a.token, keys);
    expect(res.status).toBe(200);
    expect(Object.keys(res.json.links)).toHaveLength(500);
    const exp = Math.floor(Date.now() / 1000) + 600;
    const evil = `receipts/${a.id}/../../etc`;
    const sig = await signSharedLink(env.BETTER_AUTH_SECRET, evil, exp); // even a correctly signed traversal key is refused
    expect((await app.request(`/api/receipts/shared?key=${encodeURIComponent(evil)}&exp=${exp}&sig=${encodeURIComponent(sig)}`, {}, env)).status).toBe(404);
  });

  it("returns 404 (not a hint) when the file was deleted", async () => {
    const { token, id } = await makeUser();
    const key = await put(id, "gone.pdf", "x", "application/pdf");
    const url = (await makeLinks(token, [key])).json.links[key] as string;
    await env.FILES.delete(key);
    expect((await open(url)).status).toBe(404);
  });
});
