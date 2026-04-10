/**
 * Google Play–friendly copy: AI is framed as optional helpers for logging and organizing
 * entries—not financial, investment, tax, or legal advice. Do not import this from web.
 */

export const MOBILE_PAYWALL_TRUST = {
  headline: "Log receipts with less busywork",
  quote:
    "Receipt Cycle helps you capture expenses quickly—scan, speak, or type. Upgrade for unlimited entries, export, and optional smart helpers on every device.",
} as const;

export type MobilePaywallBenefit = { title: string; body: string };

/** Order matches PricingScreen benefit icons. */
export const MOBILE_PAYWALL_BENEFITS: MobilePaywallBenefit[] = [
  {
    title: "Voice and quick text",
    body: "Say or type a purchase in plain language; optional tools suggest fields so you can save an entry faster—you always confirm.",
  },
  {
    title: "Category suggestions",
    body: "Optional suggestions can pick a category from what you typed. You review every save.",
  },
  {
    title: "Labels you control",
    body: "Keep your list clear with categories and icons you choose—easy to scan at a glance.",
  },
  {
    title: "Unlimited on Pro",
    body: "On a paid plan, save as many receipts and line items as you need.",
  },
  {
    title: "Phone and web",
    body: "Use the same account in this app and on the web; your entries stay in sync.",
  },
  {
    title: "Ask AI about your saved entries",
    body: "Optional chat can restate or summarize what you already logged—for organization only, not financial, investment, tax, or legal advice.",
  },
];

/** Short footer for assistant / pattern tools on mobile. */
export const MOBILE_NOT_ADVICE_DISCLAIMER =
  "Informational only. Receipt Cycle does not provide financial, investment, tax, or legal advice.";
