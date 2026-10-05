import { afterEach, describe, expect, it, vi } from "vitest";
import { env } from "cloudflare:test";
import app from "../src/index";
import { api, makeUser } from "./helpers";

afterEach(() => vi.unstubAllGlobals());

const scanBody = { imageBase64: "aGVsbG8=", mimeType: "image/jpeg" };

describe("AI routes", () => {
  it("require sign-in", async () => {
    expect((await api("POST", "/api/ai/scan", { body: scanBody })).status).toBe(401);
  });

  it("are blocked after the trial ends", async () => {
    const { token } = await makeUser({ createdAt: Date.now() - 9 * 24 * 60 * 60 * 1000 });
    const res = await api("POST", "/api/ai/scan", { token, body: scanBody });
    expect(res.json).toMatchObject({ success: false, pipeline: "blocked" });
    expect(res.json.error).toMatch(/7-day trial ended/);
    expect((await api("POST", "/api/ai/coach", { token, body: { periodLabel: "x", rows: [], messages: [] } })).json.ok).toBe(false);
  });

  it("reports missing provider keys without calling out", async () => {
    const { token } = await makeUser();
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const res = await api("POST", "/api/ai/scan", { token, body: scanBody });
    expect(res.json.extracted_data).toBeNull();
    expect(res.json.error).toMatch(/no OCR keys/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns the parsed OpenAI result for a receipt", async () => {
    const { token } = await makeUser();
    const reply = { merchant_name: "Cafe", total_amount: "12.50", date: "2026-10-01", formatted_receipt_text: "CAFE\nTOTAL 12.50 -----" };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(reply) } }] }), { status: 200 })),
    );
    const withKey = { ...env, OPENAI_API_KEY: "sk-test" };
    const res = await app.request(
      "/api/ai/scan",
      { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(scanBody) },
      withKey,
    );
    const json = (await res.json()) as any;
    expect(json).toMatchObject({ success: true, pipeline: "openai_vision" });
    expect(json.extracted_data).toMatchObject({ merchant_name: "Cafe", total_amount: 12.5 });
  });

  it("rejects bad contact-form input and swallows honeypot hits", async () => {
    expect((await api("POST", "/api/contact", { body: { name: "A", email: "nope", message: "hello there" } })).status).toBe(400);
    const bot = await api("POST", "/api/contact", { body: { name: "A", email: "a@b.com", message: "hello there", website: "spam" } });
    expect(bot.json).toEqual({ ok: true, delivered: false });
    const sent: { to: string[]; subject: string }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        sent.push(JSON.parse(String(init.body)));
        return new Response("{}", { status: 200 });
      }),
    );
    const ok = await api("POST", "/api/contact", { body: { name: "A", email: "a@b.com", message: "hello there" } });
    expect(ok.json).toEqual({ ok: true, delivered: true });
    expect(sent.map((m) => m.to[0])).toEqual(["support@receiptcycle.com", "a@b.com"]);
  });
});
