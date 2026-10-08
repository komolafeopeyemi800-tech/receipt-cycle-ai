import { env } from "cloudflare:test";
import { Webhook } from "standardwebhooks";
import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../src/index";
import { api, makeUser } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// A Standard Webhooks secret: "whsec_" + base64 of the key bytes.
const SECRET = "whsec_dGVzdC1zZWNyZXQtYnl0ZXM=";
const LEGACY_SECRET = "whsec_legacy_plain_text_secret";

function sign(event: unknown, opts: { secret?: string; legacy?: boolean; ts?: Date } = {}) {
  const body = JSON.stringify(event);
  const ts = opts.ts ?? new Date();
  // Standard: the library wants the secret itself. Legacy Polar HMAC: the whole string is the key, so base64 it first.
  const secret = opts.secret ?? SECRET;
  const signer = new Webhook(opts.legacy ? btoa(secret) : secret);
  return {
    body,
    headers: {
      "webhook-id": "msg_1",
      "webhook-timestamp": String(Math.floor(ts.getTime() / 1000)),
      "webhook-signature": signer.sign("msg_1", ts, body),
    },
  };
}

async function post(event: unknown, opts: Parameters<typeof sign>[1] = {}, testEnv: Record<string, unknown> = env as any) {
  const { body, headers } = sign(event, opts);
  const res = await app.request("/api/webhooks/polar", { method: "POST", headers, body }, testEnv);
  return { status: res.status, text: await res.text() };
}

const subscription = (over: Record<string, unknown> = {}, customer: Record<string, unknown> = {}) => ({
  id: "sub_1",
  status: "active",
  product_id: "prod_monthly",
  cancel_at_period_end: false,
  customer: { id: "cus_1", email: "Buyer@Example.com", external_id: null, ...customer },
  ...over,
});
const event = (type: string, data: unknown) => ({ type, timestamp: new Date().toISOString(), data });

describe("polar webhook", () => {
  it("rejects a bad signature, an old timestamp and a missing secret", async () => {
    expect((await post(event("subscription.active", subscription()), { secret: "whsec_d3Jvbmc=" })).status).toBe(403);
    expect((await post(event("subscription.active", subscription()), { ts: new Date(Date.now() - 20 * 60 * 1000) })).status).toBe(403);
    const { body, headers } = sign(event("subscription.active", subscription()));
    expect((await app.request("/api/webhooks/polar", { method: "POST", body }, env)).status).toBe(403);
    expect((await app.request("/api/webhooks/polar", { method: "POST", headers, body }, { ...env, POLAR_WEBHOOK_SECRET: "" } as any)).status).toBe(503);
  });

  it("accepts both the Standard Webhooks key and the older Polar key", async () => {
    expect((await post(event("subscription.active", subscription()))).status).toBe(202);
    const legacyEnv = { ...env, POLAR_WEBHOOK_SECRET: LEGACY_SECRET };
    expect((await post(event("subscription.active", subscription()), { secret: LEGACY_SECRET, legacy: true }, legacyEnv)).status).toBe(202);
  });

  it("grants Pro by our own user id, then follows cancel, revoke and a yearly switch", async () => {
    const { token, id } = await makeUser({ email: "buyer@example.com" });
    expect((await api("GET", "/api/subscription", { token })).json.pro).toBe(false);

    const paid = await post(event("subscription.active", subscription({}, { external_id: id })));
    expect(paid.status).toBe(202);
    expect((await api("GET", "/api/subscription", { token })).json).toMatchObject({ pro: true, phase: "pro" });
    const row = await env.DB.prepare("SELECT plan FROM profile WHERE user_id = ?").bind(id).first<{ plan: string }>();
    expect(row?.plan).toBe("pro_monthly");

    // cancelling keeps Pro until the period ends
    await post(event("subscription.canceled", subscription({ cancel_at_period_end: true }, { external_id: id })));
    expect((await api("GET", "/api/subscription", { token })).json.pro).toBe(true);
    expect((await env.DB.prepare("SELECT plan FROM profile WHERE user_id = ?").bind(id).first<{ plan: string }>())?.plan).toBe("cancelling");

    // switching to the yearly product
    await post(event("subscription.updated", subscription({ product_id: "prod_yearly" }, { external_id: id })));
    expect((await env.DB.prepare("SELECT plan FROM profile WHERE user_id = ?").bind(id).first<{ plan: string }>())?.plan).toBe("pro_yearly");

    // access ends
    await post(event("subscription.revoked", subscription({ status: "canceled" }, { external_id: id })));
    expect((await api("GET", "/api/subscription", { token })).json.pro).toBe(false);
  });

  it("matches the buyer by email, treats a trial as Pro, and keeps Pro while a card is being retried", async () => {
    const { token } = await makeUser({ email: "trial@example.com" });
    await post(event("subscription.created", subscription({ status: "trialing" }, { email: "TRIAL@example.com", id: "cus_t" })));
    expect((await api("GET", "/api/subscription", { token })).json.pro).toBe(true);
    await post(event("subscription.past_due", subscription({ status: "past_due" }, { email: "trial@example.com", id: "cus_t" })));
    expect((await api("GET", "/api/subscription", { token })).json.pro).toBe(true);
    await post(event("subscription.revoked", subscription({ status: "canceled" }, { email: "trial@example.com", id: "cus_t" })));
    expect((await api("GET", "/api/subscription", { token })).json.pro).toBe(false);
  });

  it("creates the account for a buyer who has not signed up yet", async () => {
    await post(event("subscription.active", subscription({}, { email: "new@example.com", id: "cus_new" })));
    const row = await env.DB.prepare("SELECT p.pro_subscription_active AS pro FROM user u JOIN profile p ON p.user_id = u.id WHERE u.email = ?")
      .bind("new@example.com")
      .first<{ pro: number }>();
    expect(row?.pro).toBe(1);
  });

  it("ignores the free product, unknown products and other events, but still answers 202", async () => {
    const { token, id } = await makeUser({ email: "free@example.com" });
    expect((await post(event("subscription.active", subscription({ product_id: "prod_free" }, { external_id: id })))).status).toBe(202);
    expect((await post(event("subscription.active", subscription({ product_id: "prod_other" }, { external_id: id })))).status).toBe(202);
    expect((await post(event("order.paid", { id: "ord_1" }))).status).toBe(202);
    expect((await post(event("checkout.created", {}))).status).toBe(202);
    expect((await api("GET", "/api/subscription", { token })).json.pro).toBe(false);
  });
});

function stubPolar(handler: (url: string, body: any) => { status: number; json: unknown }) {
  const calls: { url: string; body: any; auth: string | null }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      const body = init.body ? JSON.parse(String(init.body)) : null;
      calls.push({ url, body, auth: new Headers(init.headers).get("authorization") });
      const out = handler(url, body);
      return new Response(JSON.stringify(out.json), { status: out.status });
    }),
  );
  return calls;
}

describe("checkout and customer portal", () => {
  it("needs a signed-in user", async () => {
    expect((await api("POST", "/api/billing/checkout", { body: { plan: "monthly" } })).status).toBe(401);
    expect((await api("POST", "/api/billing/portal", { body: {} })).status).toBe(401);
  });

  it("starts a 7-day-trial checkout tied to the account", async () => {
    const { token, id } = await makeUser({ email: "pay@example.com" });
    const calls = stubPolar(() => ({ status: 201, json: { url: "https://polar.sh/checkout/abc" } }));
    const res = await api("POST", "/api/billing/checkout", { token, body: { plan: "yearly" } });
    expect(res.json).toEqual({ url: "https://polar.sh/checkout/abc" });
    expect(calls[0]).toMatchObject({ url: "https://api.polar.sh/v1/checkouts/", auth: "Bearer polar_test_token" });
    expect(calls[0].body).toMatchObject({
      products: ["prod_yearly"],
      customer_email: "pay@example.com",
      external_customer_id: id,
      trial_interval: "day",
      trial_interval_count: 7,
      metadata: { user_id: id },
    });
    expect(calls[0].body.success_url).toContain("/checkout-return?polar_checkout=1");
  });

  it("only returns to our own site, retries on the email when Polar already knows it, and reports failures", async () => {
    const { token } = await makeUser({ email: "again@example.com" });
    const calls = stubPolar((_url, body) => (body.external_customer_id ? { status: 422, json: {} } : { status: 201, json: { url: "https://polar.sh/checkout/two" } }));
    const res = await api("POST", "/api/billing/checkout", { token, body: { plan: "monthly", returnUrl: "https://evil.example/steal" } });
    expect(res.json.url).toBe("https://polar.sh/checkout/two");
    expect(calls).toHaveLength(2);
    expect(calls[1].body.external_customer_id).toBeUndefined();
    expect(calls[1].body.success_url).not.toContain("evil.example");

    const ok = stubPolar(() => ({ status: 201, json: { url: "https://polar.sh/checkout/three" } }));
    await api("POST", "/api/billing/checkout", { token, body: { plan: "monthly", returnUrl: "receiptcycle://checkout-return" } });
    expect(ok[0].body.success_url).toBe("receiptcycle://checkout-return");

    stubPolar(() => ({ status: 500, json: {} }));
    expect((await api("POST", "/api/billing/checkout", { token, body: { plan: "monthly" } })).status).toBe(503);
    expect((await api("POST", "/api/billing/checkout", { token, body: { plan: "weekly" } })).status).toBe(400);
  });

  it("opens the customer portal, falling back to the public portal page", async () => {
    const { token } = await makeUser({ email: "portal@example.com" });
    stubPolar(() => ({ status: 201, json: { customer_portal_url: "https://polar.sh/receipt-cycle/portal?customer_session_token=x" } }));
    expect((await api("POST", "/api/billing/portal", { token, body: {} })).json.url).toContain("customer_session_token");
    stubPolar(() => ({ status: 404, json: {} }));
    expect((await api("POST", "/api/billing/portal", { token, body: {} })).json.url).toBe("https://polar.sh/receipt-cycle/portal?email=portal%40example.com");
  });
});
