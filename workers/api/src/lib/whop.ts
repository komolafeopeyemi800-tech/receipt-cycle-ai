/**
 * Whop webhook payload parsing. Direct port of the helpers in apps/mobile/convex/http.ts; the
 * payload shapes vary by event type, so these probe several known locations.
 */
import type { EntitlementStatus } from "./entitlements";

type Rec = Record<string, unknown>;

function asRecord(v: unknown): Rec | null {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Rec) : null;
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;
}

export function extractWhopUserId(data: unknown): string | null {
  const d = asRecord(data);
  if (!d) return null;
  const direct = asString(d.user_id) ?? asString(d.userId);
  if (direct) return direct;
  const buyer = asString(d.buyer_id) ?? asString(d.buyerId) ?? asString(d.customer_id) ?? asString(d.customerId);
  if (buyer) return buyer;

  const userRec = asRecord(d.user);
  const fromUser = userRec ? (asString(userRec.id) ?? asString(userRec.user_id)) : undefined;
  if (fromUser) return fromUser;

  const member = asRecord(d.member);
  const fromMember = member ? (asString(member.user_id) ?? asString(member.userId)) : undefined;
  if (fromMember) return fromMember;
  const memberUser = member ? asRecord(member.user) : null;
  const fromMemberUser = memberUser ? asString(memberUser.id) : undefined;
  if (fromMemberUser) return fromMemberUser;

  const customer = asRecord(d.customer);
  return customer ? (asString(customer.id) ?? null) : null;
}

export function extractWhopEmail(data: unknown): string | null {
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
    const nested = memberUser ? asString(memberUser.email) : undefined;
    if (nested) return nested.toLowerCase();
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

export function extractMembershipId(data: unknown): string | null {
  const d = asRecord(data);
  if (!d) return null;
  const direct = asString(d.membership_id) ?? asString(d.membershipId);
  if (direct) return direct;
  const membership = asRecord(d.membership);
  return membership ? (asString(membership.id) ?? null) : null;
}

function extractBillingPeriodDays(data: unknown): number | null {
  const d = asRecord(data);
  if (!d) return null;
  const plan = asRecord(d.plan) ?? asRecord(asRecord(d.membership)?.plan);
  const value = plan?.billing_period;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function toEntitlementStatus(
  eventType: string,
  data: unknown,
): { status: EntitlementStatus; proActive: boolean; paymentStatus?: string } | null {
  const activeTypes = new Set(["membership.activated", "membership.went_valid"]);
  const deactiveTypes = new Set(["membership.deactivated", "membership.went_invalid", "refund.created", "dispute.created"]);
  if (activeTypes.has(eventType)) {
    const days = extractBillingPeriodDays(data);
    return { status: days && days >= 360 ? "pro_yearly" : "pro_monthly", proActive: true };
  }
  if (eventType === "membership.cancel_at_period_end_changed") {
    const d = asRecord(data);
    const cancelling =
      d?.cancel_at_period_end === true ||
      d?.cancelAtPeriodEnd === true ||
      asRecord(d?.membership)?.cancel_at_period_end === true;
    return { status: cancelling ? "cancelling" : "pro_monthly", proActive: true };
  }
  if (deactiveTypes.has(eventType)) return { status: "free", proActive: false };
  if (eventType === "payment.succeeded") return { status: "pro_monthly", proActive: true, paymentStatus: "succeeded" };
  if (eventType === "payment.failed") return { status: "free", proActive: false, paymentStatus: "failed" };
  if (eventType === "payment.pending" || eventType === "payment.created") {
    return { status: "free", proActive: false, paymentStatus: eventType.replace("payment.", "") };
  }
  return null;
}

/** Plan / product / pass ids, matched against `WHOP_PRO_PRODUCT_IDS`. */
function collectProductScopedIds(data: unknown): string[] {
  const d = asRecord(data);
  if (!d) return [];
  const out: string[] = [];
  const push = (s: unknown) => {
    const t = asString(s);
    if (t) out.push(t);
  };
  const product = asRecord(d.product);
  const membership = asRecord(d.membership);
  const plan = asRecord(d.plan) ?? asRecord(membership?.plan);
  for (const k of ["product_id", "productId", "plan_id", "planId", "access_pass_id", "accessPassId"]) push(d[k]);
  if (product) for (const k of ["id", "product_id", "access_pass_id"]) push(product[k]);
  if (plan) for (const k of ["id", "product_id", "access_pass_id"]) push(plan[k]);
  if (membership) {
    push(membership.product_id);
    push(membership.plan_id);
  }
  return [...new Set(out)];
}

export function productMatches(data: unknown, allowed: Set<string>): boolean {
  if (allowed.size === 0) return true;
  const ids = collectProductScopedIds(data);
  // Payment payloads sometimes omit product fields; do not skip fulfillment in that case.
  if (ids.length === 0) return true;
  return ids.some((id) => allowed.has(id));
}
