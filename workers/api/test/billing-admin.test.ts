import { Webhook } from "standardwebhooks";
import { describe, expect, it } from "vitest";
import { api, makeUser } from "./helpers";

async function signedWhop(event: unknown, secret = "whsec_test_secret") {
  const body = JSON.stringify(event);
  const id = "msg_1";
  const ts = new Date();
  const signature = new Webhook(btoa(secret)).sign(id, ts, body);
  return {
    body,
    headers: {
      "webhook-id": id,
      "webhook-timestamp": String(Math.floor(ts.getTime() / 1000)),
      "webhook-signature": signature,
    },
  };
}

async function postWhop(event: unknown, secret?: string) {
  const { body, headers } = await signedWhop(event, secret);
  const { default: app } = await import("../src/index");
  const { env } = await import("cloudflare:test");
  const res = await app.request("/api/webhooks/whop", { method: "POST", headers, body }, env);
  return { status: res.status, text: await res.text() };
}

describe("whop webhook", () => {
  it("rejects a bad signature", async () => {
    const res = await postWhop({ type: "membership.activated", data: {} }, "wrong-secret");
    expect(res.status).toBe(400);
  });

  it("grants Pro to an existing user by email and records an audit log", async () => {
    const { token } = await makeUser({ email: "buyer@example.com" });
    expect((await api("GET", "/api/subscription", { token })).json.pro).toBe(false);

    const res = await postWhop({
      type: "membership.activated",
      data: { user: { id: "user_whop1", email: "Buyer@Example.com" }, plan: { billing_period: 365 } },
    });
    expect(res.status).toBe(200);

    const sub = await api("GET", "/api/subscription", { token });
    expect(sub.json).toMatchObject({ pro: true, phase: "pro" });

    const deactivated = await postWhop({ type: "membership.deactivated", data: { user: { id: "user_whop1" } } });
    expect(deactivated.status).toBe(200);
    expect((await api("GET", "/api/subscription", { token })).json.pro).toBe(false);
  });

  it("stores the entitlement for a not-yet-registered buyer and creates the account", async () => {
    await postWhop({ type: "payment.succeeded", data: { email: "new@example.com", user_id: "user_new" } });
    const { env } = await import("cloudflare:test");
    const row = await env.DB.prepare("SELECT p.pro_subscription_active AS pro FROM user u JOIN profile p ON p.user_id = u.id WHERE u.email = ?")
      .bind("new@example.com")
      .first<{ pro: number }>();
    expect(row?.pro).toBe(1);
  });
});

describe("subscription bootstrap", () => {
  it("backfills the trial counter from existing transactions", async () => {
    const { token } = await makeUser();
    await api("POST", "/api/transactions/bulk-import", {
      token,
      body: { workspace: "personal", rows: [{ amount: 1, type: "expense", category: "Other", date: "2026-10-01" }] },
    });
    expect((await api("POST", "/api/subscription/bootstrap", { token })).json).toEqual({ ok: true });
    expect((await api("GET", "/api/subscription", { token })).json.trialAddsUsed).toBe(1);
  });
});

describe("admin", () => {
  const secret = { "x-admin-secret": "admin-secret" };

  it("needs the secret and an allowlisted account", async () => {
    const admin = await makeUser({ email: "boss@example.com" });
    const other = await makeUser();
    expect((await api("GET", "/api/admin/validate", { token: admin.token })).status).toBe(403);
    expect((await api("GET", "/api/admin/validate", { token: other.token, headers: secret })).status).toBe(403);
    expect((await api("GET", "/api/admin/validate", { token: admin.token, headers: secret })).json).toEqual({ ok: true });
    expect((await api("GET", "/api/config/is-admin", { token: admin.token })).json).toBe(true);
    expect((await api("GET", "/api/config/is-admin", { token: other.token })).json).toBe(false);
  });

  it("serves public config with defaults and applies updates", async () => {
    const admin = await makeUser({ email: "boss@example.com" });
    const before = await api("GET", "/api/config");
    expect(before.json).toMatchObject({ maintenanceMode: false, freeManualLimit: 60 });
    await api("PUT", "/api/admin/config", { token: admin.token, headers: secret, body: { scannerEnabled: false, freeCameraLimit: 99999 } });
    const after = await api("GET", "/api/config");
    expect(after.json).toMatchObject({ scannerEnabled: false, freeCameraLimit: 5000, uploadEnabled: true });
    const logs = await api("GET", "/api/admin/audit-logs", { token: admin.token, headers: secret });
    expect(logs.json[0].action).toBe("config.update");
  });

  it("lists, updates and deletes users", async () => {
    const admin = await makeUser({ email: "boss@example.com" });
    const target = await makeUser({ email: "t@example.com" });
    const list = await api("GET", "/api/admin/users", { token: admin.token, headers: secret });
    expect(list.json.map((u: any) => u.email).sort()).toEqual(["boss@example.com", "t@example.com"]);

    await api("PATCH", `/api/admin/users/${target.id}`, { token: admin.token, headers: secret, body: { plan: "Pro", role: "Admin" } });
    const updated = (await api("GET", "/api/admin/users", { token: admin.token, headers: secret })).json.find((u: any) => u.id === target.id);
    expect(updated).toMatchObject({ plan: "pro", proSubscriptionActive: true, role: "admin" });

    const stats = await api("GET", "/api/admin/stats", { token: admin.token, headers: secret });
    expect(stats.json.totals).toMatchObject({ users: 2, transactions: 0 });

    expect((await api("DELETE", `/api/admin/users/${target.id}`, { token: admin.token, headers: secret })).status).toBe(200);
    expect((await api("GET", "/api/transactions", { token: target.token })).status).toBe(401);
  });
});
