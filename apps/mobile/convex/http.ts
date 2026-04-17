import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "standardwebhooks";

function webhookSecretB64(raw: string): string {
  const s = raw.trim();
  if (typeof Buffer !== "undefined") {
    return Buffer.from(s, "utf8").toString("base64");
  }
  return btoa(s);
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;
}

/** Best-effort Whop user id (`user_…`) from Standard Webhooks payload `data`. */
function extractWhopUserId(data: unknown): string | null {
  const d = asRecord(data);
  if (!d) return null;
  const direct = d.user_id ?? d.userId;
  if (typeof direct === "string" && direct.length > 0) return direct;
  const buyerId = d.buyer_id ?? d.buyerId ?? d.customer_id ?? d.customerId;
  if (typeof buyerId === "string" && buyerId.length > 0) return buyerId;

  const user = asRecord(d.user);
  if (user && typeof user.id === "string" && user.id.length > 0) return user.id;
  if (user && typeof user.user_id === "string" && user.user_id.length > 0) return user.user_id;

  const member = asRecord(d.member);
  if (member && typeof member.user_id === "string") return member.user_id;
  if (member && typeof member.userId === "string") return member.userId;
  const memberUser = member ? asRecord(member.user) : null;
  if (memberUser && typeof memberUser.id === "string" && memberUser.id.length > 0) return memberUser.id;

  const customer = asRecord(d.customer);
  if (customer && typeof customer.id === "string" && customer.id.length > 0) return customer.id;

  return null;
}

function extractWhopEmail(data: unknown): string | null {
  const d = asRecord(data);
  if (!d) return null;
  const direct = asString(d.email) ?? asString(d.user_email) ?? asString(d.customer_email);
  if (direct) return direct.toLowerCase();
  const user = asRecord(d.user);
  const userEmail = user ? asString(user.email) : undefined;
  if (userEmail) return userEmail.toLowerCase();
  const member = asRecord(d.member);
  if (member) {
    const memberUser = asRecord(member.user);
    const fromNested = memberUser ? asString(memberUser.email) : undefined;
    if (fromNested) return fromNested.toLowerCase();
    const flat = asString(member.email);
    if (flat) return flat.toLowerCase();
  }
  const customer = asRecord(d.customer);
  const customerEmail = customer ? asString(customer.email) : undefined;
  if (customerEmail) return customerEmail.toLowerCase();
  const billing = asRecord(d.billing_details) ?? asRecord(d.billingDetails);
  const billingEmail = billing ? asString(billing.email) : undefined;
  return billingEmail ? billingEmail.toLowerCase() : null;
}

function extractMembershipId(data: unknown): string | null {
  const d = asRecord(data);
  if (!d) return null;
  const direct = asString(d.membership_id) ?? asString(d.membershipId);
  if (direct) return direct;
  const membership = asRecord(d.membership);
  return membership ? asString(membership.id) ?? null : null;
}

function extractBillingPeriodDays(data: unknown): number | null {
  const d = asRecord(data);
  if (!d) return null;
  const plan = asRecord(d.plan) ?? asRecord(asRecord(d.membership)?.plan);
  const value = plan?.billing_period;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toEntitlementStatus(
  eventType: string,
  data: unknown,
): { status: "free" | "pro_monthly" | "pro_yearly" | "cancelling"; proActive: boolean; paymentStatus?: string } | null {
  const activeTypes = new Set(["membership.activated", "membership.went_valid"]);
  const deactiveTypes = new Set(["membership.deactivated", "membership.went_invalid", "refund.created", "dispute.created"]);
  if (activeTypes.has(eventType)) {
    const days = extractBillingPeriodDays(data);
    return {
      status: days && days >= 360 ? "pro_yearly" : "pro_monthly",
      proActive: true,
    };
  }
  if (eventType === "membership.cancel_at_period_end_changed") {
    const d = asRecord(data);
    const cancelAtPeriodEnd =
      d?.cancel_at_period_end === true ||
      d?.cancelAtPeriodEnd === true ||
      asRecord(d?.membership)?.cancel_at_period_end === true;
    return {
      status: cancelAtPeriodEnd ? "cancelling" : "pro_monthly",
      proActive: true,
    };
  }
  if (deactiveTypes.has(eventType)) {
    return { status: "free", proActive: false };
  }
  if (eventType === "payment.succeeded") {
    return { status: "pro_monthly", proActive: true, paymentStatus: "succeeded" };
  }
  if (eventType === "payment.failed") {
    return { status: "free", proActive: false, paymentStatus: "failed" };
  }
  if (eventType === "payment.pending" || eventType === "payment.created") {
    return { status: "free", proActive: false, paymentStatus: eventType.replace("payment.", "") };
  }
  return null;
}

/** Plan / product / pass ids used with `WHOP_PRO_PRODUCT_IDS` (comma-separated in Convex env). */
function collectWhopProductScopedIds(data: unknown): string[] {
  const d = asRecord(data);
  if (!d) return [];
  const out: string[] = [];
  const push = (s: unknown) => {
    if (typeof s === "string" && s.trim().length > 0) out.push(s.trim());
  };
  const product = asRecord(d.product);
  const plan = asRecord(d.plan) ?? asRecord(asRecord(d.membership)?.plan);
  push(d.product_id);
  push(d.productId);
  push(d.plan_id);
  push(d.planId);
  push(d.access_pass_id);
  push(d.accessPassId);
  if (product) {
    push(product.id);
    push(product.product_id);
    push(product.access_pass_id);
  }
  if (plan) {
    push(plan.id);
    push(plan.product_id);
    push(plan.access_pass_id);
  }
  const membership = asRecord(d.membership);
  if (membership) {
    push(membership.product_id);
    push(membership.plan_id);
    const mplan = asRecord(membership.plan);
    if (mplan) {
      push(mplan.id);
      push(mplan.product_id);
    }
  }
  return [...new Set(out)];
}

function productMatches(data: unknown, allowed: Set<string>): boolean {
  if (allowed.size === 0) return true;
  const ids = collectWhopProductScopedIds(data);
  // Payment payloads sometimes omit product fields; do not skip fulfillment in that case.
  if (ids.length === 0) return true;
  return ids.some((id) => allowed.has(id));
}

const http = httpRouter();

http.route({
  path: "/whop-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const rawSecret = process.env.WHOP_WEBHOOK_SECRET?.trim();
    if (!rawSecret) {
      return new Response("Webhook secret not configured", { status: 503 });
    }

    const body = await request.text();
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    let payload: { type?: string; data?: unknown };
    try {
      const wh = new Webhook(webhookSecretB64(rawSecret));
      payload = wh.verify(body, headers) as { type?: string; data?: unknown };
    } catch {
      return new Response("Invalid webhook signature", { status: 400 });
    }

    const type = payload.type ?? "";
    const data = payload.data;

    const productFilter = process.env.WHOP_PRO_PRODUCT_IDS?.trim();
    const allowedProducts = new Set(
      productFilter
        ? productFilter
            .split(/[\s,]+/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    );

    const entitlement = toEntitlementStatus(type, data);
    const shouldFilterProduct = type.startsWith("membership.") || type.startsWith("payment.");
    if (shouldFilterProduct && !productMatches(data, allowedProducts)) {
      return new Response("OK", { status: 200 });
    }

    if (entitlement) {
      await ctx.runMutation(internal.whopWebhook.upsertEntitlementFromWebhook, {
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

    return new Response("OK", { status: 200 });
  }),
});

export default http;
