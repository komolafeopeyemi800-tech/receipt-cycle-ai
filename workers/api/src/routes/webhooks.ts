import { Hono } from "hono";
import { upsertEntitlementFromWebhook } from "../lib/entitlements";
import { toPolarEntitlement, verifyPolarWebhook } from "../lib/polar";
import type { AppEnv } from "../types";

export const webhookRoutes = new Hono<AppEnv>();

/**
 * Polar webhook (set the endpoint format to "Raw"). Public route, authenticated by the signature.
 * Answers 202 as soon as the event is accepted; events we do not act on are accepted too so Polar never retries them.
 */
webhookRoutes.post("/polar", async (c) => {
  const secret = c.env.POLAR_WEBHOOK_SECRET?.trim();
  if (!secret) return c.text("Webhook secret not configured", 503);
  const body = await c.req.text();
  if (!(await verifyPolarWebhook(secret, c.req.raw.headers, body))) return c.text("Invalid webhook signature", 403);

  let event: { type?: string; data?: unknown };
  try {
    event = JSON.parse(body) as { type?: string; data?: unknown };
  } catch {
    return c.text("Invalid payload", 400);
  }
  const type = event.type ?? "";
  const entitlement = toPolarEntitlement(c.env, type, event.data);
  if (entitlement) {
    await upsertEntitlementFromWebhook(c.get("db"), {
      // The entitlement table's "whop" columns now hold the Polar customer id.
      whopUserId: entitlement.polarCustomerId,
      userId: entitlement.externalId,
      email: entitlement.email,
      membershipId: entitlement.subscriptionId,
      status: entitlement.status,
      proActive: entitlement.proActive,
      source: "polar",
      eventType: type,
    });
  }
  return c.body(null, 202);
});
