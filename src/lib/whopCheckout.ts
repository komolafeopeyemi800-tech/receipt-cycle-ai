import type { PaywallPlanId } from "@mobile-lib/pricingPaywall";

function getWebCheckoutReturnUrl(): string {
  const fromEnv = (import.meta.env.VITE_WHOP_CHECKOUT_SUCCESS_URL as string | undefined)?.trim();
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin.replace(/\/$/, "")}/dashboard`;
  }
  return "https://receiptcycle.com/dashboard";
}

function withCheckoutReturnUrl(raw: string): string {
  try {
    const u = new URL(raw);
    const returnUrl = getWebCheckoutReturnUrl();
    if (!u.searchParams.get("redirect_uri")) u.searchParams.set("redirect_uri", returnUrl);
    if (!u.searchParams.get("return_url")) u.searchParams.set("return_url", returnUrl);
    return u.toString();
  } catch {
    return raw;
  }
}

/** Whop checkout URLs from Vite env (set in `.env` for production). */
export function getWhopCheckoutUrl(plan: PaywallPlanId): string | null {
  const raw =
    plan === "free"
      ? (import.meta.env.VITE_WHOP_CHECKOUT_FREE_URL as string | undefined)
      : plan === "monthly"
        ? (import.meta.env.VITE_WHOP_CHECKOUT_MONTHLY_URL as string | undefined)
        : (import.meta.env.VITE_WHOP_CHECKOUT_YEARLY_URL as string | undefined);
  const s = raw?.trim();
  return s ? withCheckoutReturnUrl(s) : null;
}

/** Customer hub / restore — optional; falls back to Whop home. */
export function getWhopManageUrl(): string {
  const u = (import.meta.env.VITE_WHOP_MANAGE_URL as string | undefined)?.trim();
  return u || "https://whop.com/@me/settings/orders/";
}
