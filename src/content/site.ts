/** Public site constants (no secrets). */
export const SUPPORT_EMAIL = "support@receiptcycle.com";
export const TWITTER_URL =
  (import.meta.env.VITE_SOCIAL_X_URL as string | undefined)?.trim() || "https://x.com/receiptcycle";
export const INSTAGRAM_URL =
  (import.meta.env.VITE_SOCIAL_INSTAGRAM_URL as string | undefined)?.trim() ||
  "https://www.instagram.com/receiptcycle";
