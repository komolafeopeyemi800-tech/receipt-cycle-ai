import { describe, expect, it } from "vitest";
import { REQUIRED_WEBHOOK_EVENTS, runPolarSetup } from "../src/lib/polarSetup";
import type { Env } from "../src/types";

const env = {
  POLAR_ACCESS_TOKEN: "polar_test_token",
  POLAR_ORGANIZATION_ID: "org_1",
  POLAR_MONTHLY_PRODUCT_ID: "prod_monthly",
  POLAR_YEARLY_PRODUCT_ID: "prod_yearly",
  POLAR_LIFETIME_PRODUCT_ID: "prod_lifetime",
} as unknown as Env;

type Call = { method: string; path: string; body: unknown };

/** A fake Polar. State starts without the order events and without the benefit, and changes when the code writes. */
function fakePolar(over: { events?: string[]; benefit?: boolean; attached?: string[]; status?: Record<string, number> } = {}) {
  const calls: Call[] = [];
  let events = over.events ?? ["subscription.created", "subscription.updated", "subscription.active", "subscription.canceled", "subscription.revoked"];
  let benefit = over.benefit ?? false;
  const attached = new Set(over.attached ?? []);
  const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
  const doFetch = async (url: string, init: RequestInit = {}) => {
    const u = new URL(url);
    const method = init.method ?? "GET";
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, path: u.pathname, body });
    const forced = over.status?.[`${method} ${u.pathname}`];
    if (forced) return json({ detail: "nope" }, forced);
    if (method === "GET" && u.pathname === "/v1/webhooks/endpoints")
      return json({ items: [{ id: "wh_1", url: "https://api.receiptcycle.com/api/webhooks/polar", events, format: "raw", enabled: true }] });
    if (method === "PATCH" && u.pathname === "/v1/webhooks/endpoints/wh_1") {
      events = (body as { events: string[] }).events;
      return json({ id: "wh_1" });
    }
    if (method === "GET" && u.pathname === "/v1/benefits/") return json({ items: benefit ? [{ id: "ben_1", description: "Receipt Cycle Pro" }] : [] });
    if (method === "POST" && u.pathname === "/v1/benefits/") {
      benefit = true;
      return json({ id: "ben_1" }, 201);
    }
    const prod = u.pathname.match(/^\/v1\/products\/(prod_\w+)$/);
    if (method === "GET" && prod) {
      const id = prod[1];
      return json({ id, name: id, is_recurring: id !== "prod_lifetime", recurring_interval: "month", benefits: attached.has(id) ? [{ id: "ben_1" }] : [] });
    }
    const att = u.pathname.match(/^\/v1\/products\/(prod_\w+)\/benefits$/);
    if (method === "POST" && att) {
      attached.add(att[1]);
      return json({ id: att[1] });
    }
    return json({}, 404);
  };
  return { doFetch, calls, get events() { return events; }, attached };
}

describe("polar setup", () => {
  it("only reads when apply is false, and says what is missing", async () => {
    const polar = fakePolar();
    const steps = await runPolarSetup(env, { apply: false }, polar.doFetch);
    expect(polar.calls.every((c) => c.method === "GET")).toBe(true);
    const webhook = steps.find((s) => s.name === "Webhook events")!;
    expect(webhook.ok).toBe(false);
    expect(webhook.detail).toContain("order.paid");
    expect(webhook.detail).toContain("order.refunded");
    expect(steps.filter((s) => s.changed)).toHaveLength(0);
  });

  it("adds the missing events, creates the benefit and attaches it to all three products", async () => {
    const polar = fakePolar();
    const steps = await runPolarSetup(env, { apply: true }, polar.doFetch);
    expect(steps.every((s) => s.ok)).toBe(true);
    for (const e of REQUIRED_WEBHOOK_EVENTS) expect(polar.events).toContain(e);
    expect([...polar.attached].sort()).toEqual(["prod_lifetime", "prod_monthly", "prod_yearly"]);
  });

  it("keeps events that were already enabled and does nothing when everything is in place", async () => {
    const polar = fakePolar({ events: [...REQUIRED_WEBHOOK_EVENTS, "checkout.created"], benefit: true, attached: ["prod_monthly", "prod_yearly", "prod_lifetime"] });
    const steps = await runPolarSetup(env, { apply: true }, polar.doFetch);
    expect(steps.every((s) => s.ok && !s.changed)).toBe(true);
    expect(polar.calls.filter((c) => c.method !== "GET")).toHaveLength(0);
    expect(polar.events).toContain("checkout.created");
  });

  it("reports a token that may not change webhooks without hiding the other results", async () => {
    const polar = fakePolar({ status: { "PATCH /v1/webhooks/endpoints/wh_1": 403 } });
    const steps = await runPolarSetup(env, { apply: true }, polar.doFetch);
    const webhook = steps.find((s) => s.name === "Webhook events")!;
    expect(webhook.ok).toBe(false);
    expect(webhook.detail).toContain("webhooks:write");
    expect(steps.find((s) => s.name === "Product: lifetime")!.ok).toBe(true);
    expect(JSON.stringify(steps)).not.toContain("polar_test_token");
  });

  it("stops early and names what is missing from the API settings", async () => {
    const polar = fakePolar();
    const steps = await runPolarSetup({ ...env, POLAR_LIFETIME_PRODUCT_ID: "" } as Env, { apply: true }, polar.doFetch);
    expect(steps).toHaveLength(1);
    expect(steps[0].detail).toContain("lifetime product id");
    expect(polar.calls).toHaveLength(0);
  });
});
