/**
 * Matches web `src/pages/Pricing.tsx` — Receipt Cycle premium plans.
 */
export const PRICING_PLANS = [
  {
    id: "weekly" as const,
    name: "Weekly",
    price: "$0.99",
    period: "/week",
    blurb: "Trial · cancel anytime",
  },
  {
    id: "monthly" as const,
    name: "Monthly",
    price: "$3.99",
    period: "/month",
    blurb: "Most flexible",
  },
  {
    id: "yearly" as const,
    name: "Yearly",
    price: "$38.30",
    period: "/year",
    blurb: "Best value · ~$3.19/mo",
  },
] as const;
