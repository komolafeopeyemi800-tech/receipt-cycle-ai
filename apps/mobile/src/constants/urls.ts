/**
 * Marketing / web URLs. Override with `EXPO_PUBLIC_PRICING_URL` in `.env`.
 */
export const PRICING_PAGE_URL =
  process.env.EXPO_PUBLIC_PRICING_URL?.trim() || "https://receiptcycle.app/pricing";

export const WEB_SIGNIN_URL =
  process.env.EXPO_PUBLIC_WEB_SIGNIN_URL?.trim() || "https://receiptcycle.com/signin";
