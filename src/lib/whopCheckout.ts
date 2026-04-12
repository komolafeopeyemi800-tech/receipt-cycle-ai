import type { PaywallPlanId } from "@mobile-lib/pricingPaywall";

/** Whop checkout URLs from Vite env (set in `.env` for production). */
export function getWhopCheckoutUrl(plan: PaywallPlanId): string | null {
  const raw =
    plan === "free"
      ? (import.meta.env.VITE_WHOP_CHECKOUT_FREE_URL as string | undefined)
      : plan === "monthly"
        ? (import.meta.env.VITE_WHOP_CHECKOUT_MONTHLY_URL as string | undefined)
        : (import.meta.env.VITE_WHOP_CHECKOUT_YEARLY_URL as string | undefined);
  const s = raw?.trim();
  return s || null;
}

/** Customer hub / restore — optional; falls back to Whop home. */
export function getWhopManageUrl(): string {
  const u = (import.meta.env.VITE_WHOP_MANAGE_URL as string | undefined)?.trim();
  return u || "https://whop.com/";
}
