import { Hono } from "hono";
import { Webhook } from "standardwebhooks";
import { upsertEntitlementFromWebhook } from "../lib/entitlements";
import {
  extractMembershipId,
  extractWhopEmail,
  extractWhopUserId,
  productMatches,
  toEntitlementStatus,
} from "../lib/whop";
import type { AppEnv } from "../types";

/** Standard Webhooks wants the signing secret base64 encoded; Whop gives it as plain text. */
function secretB64(raw: string): string {
  return btoa(raw.trim());
}

export const webhookRoutes = new Hono<AppEnv>();

/** Whop membership/payment events (port of POST /whop-webhook). Public route, authenticated by signature. */
webhookRoutes.post("/whop", async (c) => {
  const rawSecret = c.env.WHOP_WEBHOOK_SECRET?.trim();
  if (!rawSecret) return c.text("Webhook secret not configured", 503);

  const body = await c.req.text();
  const headers: Record<string, string> = {};
  c.req.raw.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  let payload: { type?: string; data?: unknown };
  try {
    payload = new Webhook(secretB64(rawSecret)).verify(body, headers) as { type?: string; data?: unknown };
  } catch {
    return c.text("Invalid webhook signature", 400);
  }

  const type = payload.type ?? "";
  const data = payload.data;
  const allowed = new Set(
    (c.env.WHOP_PRO_PRODUCT_IDS?.trim() ?? "")
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const entitlement = toEntitlementStatus(type, data);
  const filterByProduct = type.startsWith("membership.") || type.startsWith("payment.");
  if (filterByProduct && !productMatches(data, allowed)) return c.text("OK", 200);

  if (entitlement) {
    await upsertEntitlementFromWebhook(c.get("db"), {
      whopUserId: extractWhopUserId(data) ?? undefined,
      email: extractWhopEmail(data) ?? undefined,
      membershipId: extractMembershipId(data) ?? undefined,
      status: entitlement.status,
      proActive: entitlement.proActive,
      paymentStatus: entitlement.paymentStatus,
      source: type,
      eventType: type,
    });
  }
  return c.text("OK", 200);
});
