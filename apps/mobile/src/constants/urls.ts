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
  if (!s) return null;
  try {
    const u = new URL(s);
    const returnUrl =
      process.env.EXPO_PUBLIC_WHOP_CHECKOUT_SUCCESS_URL?.trim() || "receiptcycle://post-checkout?screen=Records";
    if (!u.searchParams.get("redirect_uri")) u.searchParams.set("redirect_uri", returnUrl);
    if (!u.searchParams.get("return_url")) u.searchParams.set("return_url", returnUrl);
    return u.toString();
  } catch {
    return s;
  }
}

export function expoWhopManageUrl(): string {
  return process.env.EXPO_PUBLIC_WHOP_MANAGE_URL?.trim() || "https://whop.com/@me/settings/orders/";
}
