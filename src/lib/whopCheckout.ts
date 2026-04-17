import type { PaywallPlanId } from "@mobile-lib/pricingPaywall";

function getWebCheckoutReturnUrl(): string {
  const fromEnv = (import.meta.env.VITE_WHOP_CHECKOUT_SUCCESS_URL as string | undefined)?.trim();
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin.replace(/\/$/, "")}/dashboard`;
  }
  return "https://receiptcycle.com/dashboard";
}

/** Whop hosted checkout / embed may read different query keys; set all common aliases. */
function appendWhopCheckoutReturnParams(u: URL, returnUrl: string) {
  const pairs: [string, string][] = [
    ["return_url", returnUrl],
    ["returnUrl", returnUrl],
    ["redirect_uri", returnUrl],
    ["redirectUri", returnUrl],
    ["success_url", returnUrl],
    ["successUrl", returnUrl],
  ];
  for (const [key, val] of pairs) {
    if (!u.searchParams.get(key)) u.searchParams.set(key, val);
  }
}

function withCheckoutReturnUrl(raw: string): string {
  try {
    const u = new URL(raw);
    appendWhopCheckoutReturnParams(u, getWebCheckoutReturnUrl());
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
