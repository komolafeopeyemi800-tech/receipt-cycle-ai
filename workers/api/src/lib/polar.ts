/**
 * Polar (polar.sh) billing: webhook signature check, event -> entitlement mapping, and the two API calls the apps need
 * (create a checkout, open the customer portal). Polar replaces Whop.
 */
import type { EntitlementStatus } from "./entitlements";
import { ApiError } from "./errors";
import type { Env } from "../types";

type Rec = Record<string, unknown>;
const asRecord = (v: unknown): Rec | null => (v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Rec) : null);
const asString = (v: unknown): string | undefined => (typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined);

// --- webhook signature (Standard Webhooks) -----------------------------------------------------------------------

const enc = new TextEncoder();
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const toB64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));

async function hmac(key: Uint8Array, message: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toB64(await crypto.subtle.sign("HMAC", k, enc.encode(message)));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Verifies `webhook-id` / `webhook-timestamp` / `webhook-signature`. Polar secrets are "whsec_..." strings. Newer secrets
 * follow Standard Webhooks (the part after "whsec_" is base64); older ones use the whole string as the key. Both are
 * tried, like Polar's own SDK does.
 */
export async function verifyPolarWebhook(secret: string, headers: Headers, body: string, now = Date.now()): Promise<boolean> {
  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signatures = headers.get("webhook-signature");
  if (!id || !timestamp || !signatures) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(now / 1000 - ts) > 5 * 60) return false;

  const trimmed = secret.trim();
  const keys: Uint8Array[] = [enc.encode(trimmed)];
  try {
    keys.unshift(fromB64(trimmed.replace(/^whsec_/, "")));
  } catch {
    /* not base64: only the plain-text key applies */
  }
  const signed = `${id}.${timestamp}.${body}`;
  const given = signatures
    .split(" ")
    .map((s) => s.split(",")[1])
    .filter(Boolean) as string[];
  for (const key of keys) {
    const expected = await hmac(key, signed);
    if (given.some((g) => safeEqual(g, expected))) return true;
  }
  return false;
}

// --- plans -------------------------------------------------------------------------------------------------------

export type PaidPlan = "monthly" | "yearly";

export function productIdFor(env: Env, plan: PaidPlan): string | undefined {
  return asString(plan === "monthly" ? env.POLAR_MONTHLY_PRODUCT_ID : env.POLAR_YEARLY_PRODUCT_ID);
}

function planForProduct(env: Env, productId: string | undefined): PaidPlan | null {
  if (!productId) return null;
  if (productId === asString(env.POLAR_MONTHLY_PRODUCT_ID)) return "monthly";
  if (productId === asString(env.POLAR_YEARLY_PRODUCT_ID)) return "yearly";
  return null;
}

// --- events -> entitlement ---------------------------------------------------------------------------------------

export type PolarEntitlement = {
  status: EntitlementStatus;
  proActive: boolean;
  polarCustomerId?: string;
  email?: string;
  externalId?: string;
  subscriptionId?: string;
};

/**
 * Turns a subscription event into what the user is entitled to. The subscription's own `status` decides, so a repeated or
 * re-ordered event cannot leave the account in the wrong state. Returns null for events we do not act on.
 *
 * - active / trialing / past_due (Polar is still retrying the card)  -> Pro
 * - cancel_at_period_end                                              -> Pro until the period ends ("cancelling")
 * - canceled / revoked / unpaid / incomplete*                         -> back to free (7-day in-app trial rules)
 */
export function toPolarEntitlement(env: Env, eventType: string, data: unknown): PolarEntitlement | null {
  if (!eventType.startsWith("subscription.")) return null;
  const d = asRecord(data);
  if (!d) return null;
  const productId = asString(d.product_id) ?? asString(asRecord(d.product)?.id);
  const plan = planForProduct(env, productId);
  if (!plan) return null; // the free product or something unrelated: never grants Pro

  const customer = asRecord(d.customer);
  const base = {
    polarCustomerId: asString(d.customer_id) ?? asString(customer?.id),
    email: asString(customer?.email)?.toLowerCase(),
    externalId: asString(customer?.external_id),
    subscriptionId: asString(d.id),
  };
  const status = asString(d.status) ?? "";
  const alive = ["active", "trialing", "past_due"].includes(status) && eventType !== "subscription.revoked";
  if (!alive) return { ...base, status: "free", proActive: false };
  if (d.cancel_at_period_end === true) return { ...base, status: "cancelling", proActive: true };
  return { ...base, status: plan === "yearly" ? "pro_yearly" : "pro_monthly", proActive: true };
}

// --- Polar API ---------------------------------------------------------------------------------------------------

const apiBase = (env: Env) => (env.POLAR_SERVER === "sandbox" ? "https://sandbox-api.polar.sh" : "https://api.polar.sh");

async function polarFetch(env: Env, path: string, body: unknown): Promise<{ status: number; json: Rec | null; text: string }> {
  const token = asString(env.POLAR_ACCESS_TOKEN);
  if (!token) throw new ApiError(503, "Payments are not configured yet.");
  const res = await fetch(`${apiBase(env)}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: Rec | null = null;
  try {
    json = text ? (JSON.parse(text) as Rec) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, text };
}

/** A hosted Polar checkout for one plan, tied to this account so the webhook knows who paid. */
export async function createCheckoutUrl(env: Env, args: { plan: PaidPlan; userId: string; email: string; name?: string; successUrl: string }) {
  const product = productIdFor(env, args.plan);
  if (!product) throw new ApiError(503, "This plan is not available for purchase yet.");
  const base = {
    products: [product],
    customer_email: args.email,
    ...(args.name ? { customer_name: args.name } : {}),
    success_url: args.successUrl,
    metadata: { user_id: args.userId },
    allow_trial: true,
    trial_interval: "day",
    trial_interval_count: 7,
  };
  let res = await polarFetch(env, "/v1/checkouts/", { ...base, external_customer_id: args.userId });
  // The same email may already exist as a Polar customer under another id: retry on the email alone.
  if (res.status === 422) res = await polarFetch(env, "/v1/checkouts/", base);
  const url = asString(res.json?.url);
  if (res.status >= 300 || !url) {
    console.error("polar checkout failed", res.status, res.text.slice(0, 300));
    throw new ApiError(503, "Could not start checkout. Please try again in a moment.");
  }
  return url;
}

/** Link to the Polar customer portal (invoices, payment method, cancel). Falls back to the public portal page. */
export async function customerPortalUrl(env: Env, args: { userId: string; email: string }) {
  if (asString(env.POLAR_ACCESS_TOKEN)) {
    try {
      const res = await polarFetch(env, "/v1/customer-sessions/", { external_customer_id: args.userId });
      const url = asString(res.json?.customer_portal_url);
      if (res.status < 300 && url) return url;
    } catch {
      /* fall through to the public portal */
    }
  }
  const slug = asString(env.POLAR_ORG_SLUG);
  if (!slug) throw new ApiError(503, "The billing portal is not available yet.");
  return `https://polar.sh/${slug}/portal?email=${encodeURIComponent(args.email)}`;
}
