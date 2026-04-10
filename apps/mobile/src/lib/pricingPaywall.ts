/**
 * Single source for premium paywall — web (via @mobile-lib) and Expo share the same prices and copy.
 * Checkout URLs are supplied per platform through env (Whop).
 */
export const PAYWALL_PRICING = {
  monthlyUsd: 3.5,
  yearlyUsd: 35,
  trialDays: 7,
  currency: "USD",
} as const;

export type PaywallPlanId = "free" | "monthly" | "yearly";

export function formatUsd(amount: number): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: PAYWALL_PRICING.currency,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

/** Approx. percent saved vs paying monthly for 12 months (e.g. 17% for $42 → $35). */
export function yearlyDiscountPercent(): number {
  const fullYear = PAYWALL_PRICING.monthlyUsd * 12;
  if (fullYear <= 0) return 0;
  return Math.round((1 - PAYWALL_PRICING.yearlyUsd / fullYear) * 100);
}

export function equivalentMonthlyFromYearly(): string {
  return formatUsd(PAYWALL_PRICING.yearlyUsd / 12);
}

export const PAYWALL_PLANS: {
  id: PaywallPlanId;
  label: string;
  hint: string;
  priceLine: string;
  periodNote: string;
}[] = [
  {
    id: "free",
    label: "Free",
    hint: "Try the app",
    priceLine: formatUsd(0),
    periodNote: "7-day Pro trial · 25 tx total",
  },
  {
    id: "monthly",
    label: "Monthly",
    hint: "Flexible",
    priceLine: formatUsd(PAYWALL_PRICING.monthlyUsd),
    periodNote: "per month · full Pro",
  },
  {
    id: "yearly",
    label: "Yearly",
    hint: "Best value",
    priceLine: formatUsd(PAYWALL_PRICING.yearlyUsd),
    periodNote: "per year · 7-day free trial",
  },
];

/** Subtitle under the plan picker (billing / trial details). */
export function paywallPlanDetailLine(plan: PaywallPlanId): string {
  if (plan === "free") {
    return `Free includes ${PAYWALL_PRICING.trialDays}-day access to Pro-style features and up to 25 transactions (all entry types). No export — upgrade for unlimited data & CSV.`;
  }
  if (plan === "monthly") {
    return `${formatUsd(PAYWALL_PRICING.monthlyUsd)}/month · full Pro on phone & web. Cancel anytime on Whop.`;
  }
  return `${PAYWALL_PRICING.trialDays}-day free trial · then ${formatUsd(PAYWALL_PRICING.yearlyUsd)}/year (save ${yearlyDiscountPercent()}% vs monthly).`;
}

/** Bullet list per tier for marketing / SaaS pricing layouts. */
export const PAYWALL_TIER_FEATURES: Record<PaywallPlanId, readonly string[]> = {
  free: [
    `${PAYWALL_PRICING.trialDays}-day trial with Pro-style features`,
    "Up to 25 transactions during trial (all entry types)",
    "Scan, upload, voice & AI while trial is active",
    "After trial: view your data; upgrade to add, edit, export",
    "No CSV export on Free",
  ],
  monthly: [
    "Unlimited transactions",
    "Receipt scan, upload & manual entry",
    "Voice capture, AI coach & money-leak insights",
    "Budgets & full edit access",
    "CSV export",
    "One subscription — web & mobile",
  ],
  yearly: [
    "Everything in Monthly",
    `${PAYWALL_PRICING.trialDays}-day free trial, then ${formatUsd(PAYWALL_PRICING.yearlyUsd)}/year`,
    `${equivalentMonthlyFromYearly()}/mo when billed yearly`,
    `Save ${yearlyDiscountPercent()}% vs paying monthly`,
  ],
};

export type PaywallBenefit = {
  title: string;
  body: string;
  /** Font Awesome 6 icon class without `fa-` prefix for web (`fas fa-${icon}`) */
  faIcon: string;
};

/** Benefit-first list — order matters (strongest hooks first). */
export const PAYWALL_BENEFITS: PaywallBenefit[] = [
  {
    faIcon: "microphone",
    title: "Unlimited AI input",
    body: "Speak or type — turn voice into transactions in seconds on mobile and web.",
  },
  {
    faIcon: "wand-magic-sparkles",
    title: "Smart categories",
    body: "AI suggests the best category so your spending stays organized and tax-ready.",
  },
  {
    faIcon: "face-smile",
    title: "Emoji-friendly categories",
    body: "Scan your money at a glance with clear, human labels (and emoji when it helps).",
  },
  {
    faIcon: "infinity",
    title: "Unlimited records",
    body: "Log every receipt and expense — no artificial caps on what you track.",
  },
  {
    faIcon: "mobile-screen",
    title: "One subscription, every device",
    body: "The same premium access on phone and browser. Your data stays in sync.",
  },
  {
    faIcon: "robot",
    title: "AI finance coach",
    body: "Ask plain-language questions about your spending — grounded in your real records.",
  },
];

export const PAYWALL_TRUST = {
  headline: "Built for people who are done guessing",
  quote: "Stop wrestling spreadsheets. Let AI handle the grunt work — you keep the clarity.",
} as const;
