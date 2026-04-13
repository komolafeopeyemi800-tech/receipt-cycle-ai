import { Link, useNavigate } from "react-router-dom";
import { useScreenSize } from "@/hooks/use-screen-size";
import { useWebAuth } from "@/contexts/WebAuthContext";
import DesktopNav from "@/components/layout/DesktopNav";
import {
  PAYWALL_BENEFITS,
  PAYWALL_PLANS,
  PAYWALL_TIER_FEATURES,
  yearlyDiscountPercent,
  formatUsd,
  PAYWALL_PRICING,
  type PaywallPlanId,
} from "@mobile-lib/pricingPaywall";
import { getWhopCheckoutUrl } from "@/lib/whopCheckout";

function TierCheck() {
  return (
    <i className="fas fa-check mt-0.5 text-xs text-teal-600" aria-hidden />
  );
}

export default function ReceiptCyclePaywall() {
  const navigate = useNavigate();
  const { user } = useWebAuth();
  const { isMobileOrTablet } = useScreenSize();
  const discountPct = yearlyDiscountPercent();

  function ctaForPlan(id: PaywallPlanId) {
    const url = getWhopCheckoutUrl(id);
    if (id === "free") {
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }
      navigate("/dashboard");
      return;
    }
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    window.alert(
      "Checkout is not configured yet. Add VITE_WHOP_CHECKOUT_MONTHLY_URL and VITE_WHOP_CHECKOUT_YEARLY_URL (Whop plan checkout URLs). Optional: VITE_WHOP_CHECKOUT_FREE_URL. Local: repo-root `.env` / `.env.local`, then restart `npm run dev`. Netlify: same variable names under Environment variables, then trigger a new deploy. WHOP_CHECKOUT_* / WHOP_CLIENT_ID names are mapped by vite.config.",
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased">
      {!isMobileOrTablet ? <DesktopNav variant={user ? "app" : "landing"} /> : null}

      {isMobileOrTablet ? (
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur-md">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
            aria-label="Back"
          >
            <i className="fas fa-arrow-left" />
          </button>
          <span className="text-sm font-semibold text-slate-900">Pricing</span>
          <span className="w-10" />
        </div>
      ) : null}

      <main
        className={`mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6 ${isMobileOrTablet ? "pt-8" : "scroll-pt-24 pt-24"}`}
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">Pricing</p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Simple plans. Same power on web and mobile.
          </h1>
          <p className="mt-3 text-base text-slate-600 sm:text-lg">
            Start free with a guided trial, or unlock unlimited tracking and exports with Pro. Cancel paid plans anytime
            on Whop.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:items-stretch">
          {PAYWALL_PLANS.map((tier) => {
            const features = PAYWALL_TIER_FEATURES[tier.id];
            const popular = tier.id === "yearly";
            return (
              <div
                key={tier.id}
                className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition ${
                  popular
                    ? "border-2 border-teal-500 shadow-md shadow-teal-500/10 ring-1 ring-teal-500/20 lg:scale-[1.02]"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {popular ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-teal-600 to-teal-500 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow">
                    Most popular · −{discountPct}%
                  </span>
                ) : null}
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tier.hint}</p>
                <h2 className="mt-1 font-display text-xl font-bold text-slate-900">{tier.label}</h2>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tabular-nums text-slate-900">{tier.priceLine}</span>
                  {tier.id !== "free" ? (
                    <span className="text-sm font-medium text-slate-500">
                      {tier.id === "monthly" ? "/ month" : "/ year"}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-slate-600">{tier.periodNote}</p>

                <ul className="mt-6 flex flex-1 flex-col gap-3 border-t border-slate-100 pt-6">
                  {features.map((line) => (
                    <li key={line} className="flex gap-2.5 text-sm leading-snug text-slate-700">
                      <TierCheck />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => ctaForPlan(tier.id)}
                  className={`mt-8 w-full rounded-xl py-3.5 text-sm font-bold transition ${
                    popular
                      ? "bg-gradient-to-r from-primary to-teal-600 text-white shadow-md hover:opacity-95"
                      : tier.id === "free"
                        ? "border-2 border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                        : "border border-slate-200 bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {tier.id === "free"
                    ? "Continue with Free"
                    : tier.id === "yearly"
                      ? "Start 7-day free trial"
                      : "Subscribe monthly"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm text-slate-600 shadow-sm">
          <strong className="font-semibold text-slate-800">Yearly:</strong>{" "}
          {PAYWALL_PRICING.trialDays}-day free trial on Whop, then {formatUsd(PAYWALL_PRICING.yearlyUsd)} per year.
          <span className="text-slate-500"> Monthly bills {formatUsd(PAYWALL_PRICING.monthlyUsd)} per month.</span>
        </div>

        <div className="mt-16 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-center text-xs font-bold uppercase tracking-wider text-slate-500">Why upgrade to Pro</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PAYWALL_BENEFITS.slice(0, 6).map((b) => (
              <div key={b.title} className="flex gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-teal-600"
                  style={{ backgroundColor: "rgb(240 253 250)" }}
                >
                  <i className={`fas fa-${b.faIcon}`} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{b.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{b.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-sm">
          <p className="text-slate-600">
            Subscription, restore, and billing: use{" "}
            <Link to="/settings" className="font-semibold text-teal-700 underline-offset-2 hover:underline">
              Settings
            </Link>
            .
          </p>
          <span className="hidden text-slate-300 sm:inline" aria-hidden>
            ·
          </span>
          {user ? (
            <button type="button" onClick={() => navigate("/dashboard")} className="font-semibold text-slate-700 hover:text-slate-900">
              Back to dashboard
            </button>
          ) : (
            <button type="button" onClick={() => navigate("/signin")} className="font-semibold text-slate-700 hover:text-slate-900">
              Sign in
            </button>
          )}
        </div>

        <p className="mx-auto mt-6 max-w-lg text-center text-xs leading-relaxed text-slate-500">
          Payments are processed by Whop. Linking your Whop purchase to your Receipt Cycle account unlocks Pro on web and
          mobile.
        </p>
      </main>
    </div>
  );
}
