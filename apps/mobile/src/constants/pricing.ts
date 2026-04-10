import {
  PAYWALL_PRICING,
  formatUsd,
} from "../lib/pricingPaywall";

/**
 * Compact cards for onboarding — matches web paywall (free + monthly + yearly).
 */
export const PRICING_PLANS = [
  {
    id: "free" as const,
    name: "Free",
    price: formatUsd(0),
    period: "",
    blurb: "7-day Pro trial · 25 transactions",
  },
  {
    id: "monthly" as const,
    name: "Monthly",
    price: formatUsd(PAYWALL_PRICING.monthlyUsd),
    period: "/month",
    blurb: "Full Pro · flexible",
  },
  {
    id: "yearly" as const,
    name: "Yearly",
    price: formatUsd(PAYWALL_PRICING.yearlyUsd),
    period: "/year",
    blurb: `7-day trial · ~${formatUsd(PAYWALL_PRICING.yearlyUsd / 12)}/mo`,
  },
] as const;
