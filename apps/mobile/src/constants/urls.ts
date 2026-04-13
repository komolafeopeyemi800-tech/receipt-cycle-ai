import type { PaywallPlanId } from "../lib/pricingPaywall";

/**
 * Marketing / web URLs. Override with `EXPO_PUBLIC_PRICING_URL` in `.env`.
 */
export const PRICING_PAGE_URL =
  process.env.EXPO_PUBLIC_PRICING_URL?.trim() || "https://receiptcycle.app/pricing";

export const WEB_SIGNIN_URL =
  process.env.EXPO_PUBLIC_WEB_SIGNIN_URL?.trim() || "https://receiptcycle.com/signin";

export function expoWhopCheckoutUrl(plan: PaywallPlanId): string | null {
  const raw =
    plan === "free"
      ? process.env.EXPO_PUBLIC_WHOP_CHECKOUT_FREE_URL
      : plan === "monthly"
        ? process.env.EXPO_PUBLIC_WHOP_CHECKOUT_MONTHLY_URL
        : process.env.EXPO_PUBLIC_WHOP_CHECKOUT_YEARLY_URL;
  const s = raw?.trim();
  return s || null;
}

export function expoWhopManageUrl(): string {
  return process.env.EXPO_PUBLIC_WHOP_MANAGE_URL?.trim() || "https://whop.com/";
}
