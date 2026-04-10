import type { PaywallPlanId } from "../lib/pricingPaywall";

/**
 * Marketing / web URLs. Override with `EXPO_PUBLIC_PRICING_URL` in `.env`.
 */
export const PRICING_PAGE_URL =
  process.env.EXPO_PUBLIC_PRICING_URL?.trim() || "https://receiptcycle.app/pricing";

export function expoWhopCheckoutUrl(plan: PaywallPlanId): string | null {
  if (plan === "free") return null;
  const raw =
    plan === "monthly"
      ? process.env.EXPO_PUBLIC_WHOP_CHECKOUT_MONTHLY_URL
      : process.env.EXPO_PUBLIC_WHOP_CHECKOUT_YEARLY_URL;
  const s = raw?.trim();
  return s || null;
}

export function expoWhopManageUrl(): string {
  return process.env.EXPO_PUBLIC_WHOP_MANAGE_URL?.trim() || "https://whop.com/";
}
