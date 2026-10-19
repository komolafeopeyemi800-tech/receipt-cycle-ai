import { ReactNode, useEffect, useState } from "react";
import { useConnectionState } from "@mobile-lib/api";
import { Link, useLocation } from "react-router-dom";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";
import { useWebAuth } from "@/contexts/WebAuthContext";
import { useSubscriptionState } from "@/hooks/use-subscription-state";
import { DashboardUpgradeModal } from "@/components/pricing/DashboardUpgradeModal";
import { PAYWALL_PRICING, formatUsd } from "@/lib/pricingPaywall";
import { todayLocalYmd } from "@mobile-lib/dates";

type AppChromeProps = {
  children: ReactNode;
};

export function AppChrome({ children }: AppChromeProps) {
  const { user, loading, clearLocalSession } = useWebAuth();
  const conn = useConnectionState();
  const [showStuckHint, setShowStuckHint] = useState(false);
  const location = useLocation();
  const subscription = useSubscriptionState();
  const [pricingOpen, setPricingOpen] = useState(false);
  const [promoVisible, setPromoVisible] = useState(() => typeof window === "undefined" || sessionStorage.getItem("receipt-cycle:promo-dismissed") !== "1");
  const [nudgeVisible, setNudgeVisible] = useState(false);

  useEffect(() => {
    const open = () => setPricingOpen(true);
    window.addEventListener("receipt-cycle:open-pricing", open);
    return () => window.removeEventListener("receipt-cycle:open-pricing", open);
  }, []);

  useEffect(() => {
    if (!user || !subscription || subscription.pro) return;
    const day = todayLocalYmd();
    const key = `receipt-cycle:upgrade-impressions:${user.id}:${day}`;
    const count = Number(localStorage.getItem(key) ?? 0);
    if (count >= 2) return;
    const id = window.setTimeout(() => {
      localStorage.setItem(key, String(count + 1));
      setPricingOpen(true);
    }, 900);
    return () => window.clearTimeout(id);
  }, [user, subscription]);

  useEffect(() => {
    if (!user || !subscription || subscription.pro) return;
    const key = `receipt-cycle:nudge-shown:${user.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    setNudgeVisible(true);
  }, [user, subscription]);

  useEffect(() => {
    if (!loading) {
      setShowStuckHint(false);
      return;
    }
    const id = window.setTimeout(() => setShowStuckHint(true), 5_000);
    return () => window.clearTimeout(id);
  }, [loading]);
  const returnTo = `${location.pathname}${location.search}`;
  const signInHref =
    returnTo && returnTo !== "/signin" && returnTo !== "/signup"
      ? `/signin?next=${encodeURIComponent(returnTo)}`
      : "/signin";

  const connLabel = conn.isWebSocketConnected
    ? "Connected"
    : conn.hasEverConnected
      ? "Reconnecting…"
      : conn.connectionRetries > 0
        ? "Can’t reach the server — check your connection"
        : "Connecting…";

  const inner =
    loading ? (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        <div className="max-w-sm px-4 text-center">
          <p className="mt-2 text-xs text-slate-500">{connLabel}</p>
          <p className="mt-2 text-xs text-slate-400">
            If loading takes unusually long, check your network or try refreshing the page.
          </p>
          {showStuckHint ? (
            <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left">
              <p className="text-xs text-slate-600">
                Still stuck? You can sign out locally and try signing in again. Your session also clears automatically
                if the server doesn’t respond.
              </p>
              <button
                type="button"
                onClick={() => clearLocalSession()}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100"
              >
                Clear local session
              </button>
            </div>
          ) : null}
        </div>
      </div>
    ) : !user ? (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <i className="fas fa-lock text-xl" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Sign in to open your dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">
          Use the same email and password as the mobile app to view your records and balances on the web.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            to={signInHref}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md"
          >
            Sign in
          </Link>
          <Link
            to={`/signup?next=${encodeURIComponent(returnTo)}`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
          >
            Create account
          </Link>
        </div>
        <Link to="/" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
          ← Back to home
        </Link>
      </div>
    ) : (
      children
    );

  return <>
    {user && promoVisible && !subscription?.pro ? <div className="fixed inset-x-0 top-0 z-[80] flex h-10 items-center justify-between gap-2 bg-gradient-to-r from-teal-950 via-teal-800 to-emerald-700 px-3 text-white shadow-lg sm:px-5">
      <button onClick={() => setPricingOpen(true)} className="flex min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden text-left text-[11px] font-bold sm:text-sm"><span className="shrink-0 rounded-full bg-amber-300 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-slate-950 sm:text-[10px]">Special offer</span><span className="min-w-0 truncate">Launch offer: Pro for life, {formatUsd(PAYWALL_PRICING.lifetimeUsd)} one time</span><span className="hidden rounded-full bg-white px-3 py-1 text-xs font-black text-teal-900 md:inline">View offer</span></button>
      <button onClick={() => { sessionStorage.setItem("receipt-cycle:promo-dismissed", "1"); setPromoVisible(false); }} aria-label="Dismiss offer" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/10"><i className="fas fa-xmark" /></button>
    </div> : null}
    <div onClickCapture={(event) => { const anchor = (event.target as HTMLElement).closest("a"); if (user && anchor?.getAttribute("href") === "/pricing") { event.preventDefault(); setPricingOpen(true); } }}>
      <ResponsiveLayout variant="app" showSidebar={true} mobileContent={inner} promoOffset={Boolean(user && promoVisible && !subscription?.pro)}>{inner}</ResponsiveLayout>
    </div>
    {user && !subscription?.pro && nudgeVisible ? <div className="fixed bottom-4 right-3 z-[30] flex max-w-[calc(100vw-24px)] items-center gap-3 rounded-2xl border border-teal-900/10 bg-slate-950 px-4 py-3 text-white shadow-2xl sm:right-5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-300 text-slate-950"><i className="fas fa-crown" /></span><button onClick={() => setPricingOpen(true)} className="text-left"><strong className="block text-sm">Unlock full access</strong><span className="text-xs text-slate-300">Upgrade without leaving your dashboard</span></button><button onClick={() => setPricingOpen(true)} className="rounded-lg bg-teal-400 px-3 py-2 text-xs font-black text-slate-950">Upgrade</button><button onClick={() => setNudgeVisible(false)} aria-label="Dismiss upgrade reminder" className="text-slate-400 hover:text-white"><i className="fas fa-xmark" /></button></div> : null}
    <DashboardUpgradeModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
  </>;
}
