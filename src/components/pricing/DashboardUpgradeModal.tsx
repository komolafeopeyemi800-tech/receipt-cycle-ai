import { useEffect, useState } from "react";
import { PAYWALL_PRICING, formatUsd, lifetimeDiscountPercent, lifetimeMonthsOfMonthly, type PaywallPlanId } from "@/lib/pricingPaywall";
import { useBilling } from "@/lib/billing";
import { useSubscriptionState } from "@/hooks/use-subscription-state";

const comparison = [
  ["Price", "$0", "$3.50/mo. or $35/yr.", "$60 once"],
  ["Billing", "None", "Subscription", "One payment"],
  ["Transactions", "25 trial", "Unlimited", "Unlimited"],
  ["Receipt and document OCR", "Trial", "Included", "Included"],
  ["AI voice, text and coach", "Trial", "Included", "Included"],
  ["Invoices and estimates", "Limited", "Included", "Included"],
  ["Budgets and reports", "Limited", "Included", "Included"],
  ["Evidence-linked CSV export", "—", "Included", "Included"],
];

const sellingPoints = [
  ["fa-infinity", "Unlimited transactions and records", "from receipt to report", "from-fuchsia-600 to-pink-500"],
  ["fa-file-invoice", "Receipt and document extraction", "with original evidence", "from-amber-400 to-lime-400"],
  ["fa-wand-magic-sparkles", "AI voice, text and finance coach", "across your workflow", "from-sky-500 to-cyan-400"],
] as const;

const compactBenefits = [
  "Invoices, estimates, budgets and reports",
  "Evidence-linked CSV exports",
  "The same account on web and mobile",
];

export function DashboardUpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { startCheckout } = useBilling();
  const subscription = useSubscriptionState();
  const [busy, setBusy] = useState<PaywallPlanId | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [open]);

  if (!open) return null;
  const remainingMs = Math.max(0, (subscription?.trialEndsAt ?? now) - now);
  const days = Math.floor(remainingMs / 86_400_000);
  const hours = Math.floor((remainingMs % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remainingMs % 3_600_000) / 60_000);
  const seconds = Math.floor((remainingMs % 60_000) / 1000);
  const pad = (value: number) => String(value).padStart(2, "0");

  async function choose(id: PaywallPlanId) {
    if (id === "free") { onClose(); return; }
    setBusy(id);
    const error = await startCheckout(id);
    setBusy(null);
    if (error) window.alert(error);
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 p-2 backdrop-blur-[3px] sm:p-4" role="dialog" aria-modal="true" aria-label="Upgrade Receipt Cycle">
      <div className="relative grid h-[calc(100dvh-16px)] max-h-[620px] w-[calc(100%-16px)] max-w-[980px] overflow-hidden rounded-[22px] border border-white/[.06] bg-[#111416] p-2 text-white shadow-[0_32px_100px_rgba(0,0,0,.6)] sm:h-[calc(100dvh-40px)] sm:w-[calc(100%-72px)] lg:grid-cols-[1.04fr_.96fr] lg:rounded-[26px] grid-cols-1">
        <button onClick={onClose} aria-label="Close pricing" className="absolute right-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[.04] text-slate-300 transition hover:bg-white/10 hover:text-white lg:right-4 lg:top-4"><i className="fas fa-xmark" /></button>

        <section className="hidden min-h-0 rounded-[19px] bg-[#0c0f11] px-6 py-4 lg:block">
          <div className="mb-3 flex min-h-10 items-start justify-between gap-4 pr-1">
            <div><p className="text-[12px] font-extrabold">What&apos;s included</p><p className="mt-1 text-[10px] text-slate-400">Compare access before your trial ends.</p></div>
            <div className="text-right"><p className="text-[9px] font-bold uppercase tracking-[.15em] text-teal-300">Trial ends in</p><p className="mt-1 font-mono text-[11px] font-bold tabular-nums">{days}d {pad(hours)}:{pad(minutes)}:{pad(seconds)}</p></div>
          </div>
          <div className="relative text-[10px]">
            <div className="pointer-events-none absolute bottom-0 left-[79.5%] top-0 w-[20.5%] rounded-[11px] border border-teal-300/90 bg-teal-300/[.075]" />
            <div className="relative grid min-h-[40px] grid-cols-[1.65fr_.62fr_.76fr_.78fr] items-center px-3 font-extrabold"><div>Feature</div><div className="text-center text-slate-300">Free</div><div className="text-center text-slate-200">Pro</div><div className="text-center text-teal-200">Lifetime</div></div>
            <div className="space-y-1.5">
              {comparison.map((row, index) => <div key={row[0]} className={`relative grid min-h-[48px] grid-cols-[1.65fr_.62fr_.76fr_.78fr] items-center rounded-[7px] px-3 ${index % 2 === 0 ? "bg-white/[.055]" : "bg-transparent"}`}><div className="pr-2 font-semibold leading-4 text-slate-200">{row[0]}</div><div className="text-center text-slate-400">{row[1]}</div><div className="text-center text-slate-300">{row[2]}</div><div className="text-center font-bold text-teal-200">{row[3]}</div></div>)}
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-col px-5 pb-4 pt-12 sm:px-7 lg:px-7 lg:pb-4 lg:pt-5">
          <div className="pr-5 lg:pr-8">
            <div className="mb-1.5 flex items-center gap-2"><p className="text-[9px] font-black uppercase tracking-[.18em] text-teal-300">Receipt Cycle Pro</p><span className="rounded-full bg-teal-300 px-2 py-0.5 text-[9px] font-black text-slate-950">Launch offer · Save {lifetimeDiscountPercent()}%</span></div>
            <h2 className="text-[clamp(25px,3.1vw,32px)] font-black uppercase leading-none tracking-[-.04em]"><span className="text-teal-300">{formatUsd(PAYWALL_PRICING.lifetimeUsd)} once</span><br />and Pro is yours for life.</h2>
            <p className="mt-2 text-[10px] leading-4 text-slate-400">No monthly card charges. About {lifetimeMonthsOfMonthly()} months of Monthly for one payment.</p>
          </div>

          <div className="mt-3 space-y-2">
            {sellingPoints.map(([icon, title, detail, tone]) => <div key={title} className="flex items-center gap-2.5 text-[10px]"><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] bg-gradient-to-br ${tone}`}><i className={`fas ${icon} text-[9px] text-white`} /></span><p><strong>{title}</strong> <span className="hidden text-slate-500 sm:inline">— {detail}</span></p></div>)}
          </div>

          <div className="mt-3 space-y-1.5">{compactBenefits.map((benefit) => <div key={benefit} className="flex items-center gap-2.5 text-[10px] font-semibold text-slate-100"><i className="fas fa-check text-[9px] text-teal-300" /><span>{benefit}</span></div>)}</div>

          <div className="mt-3 flex gap-2.5 rounded-[10px] border border-teal-300/10 bg-teal-300/[.10] px-3 py-2.5 text-[9px] leading-[14px] text-slate-400"><i className="fas fa-lightbulb mt-0.5 text-teal-300" /><p><strong className="text-white">Why this beats Free:</strong> remove record limits, unlock complete document capture and keep exports tied to original evidence.</p></div>

          <div className="mt-auto pt-3">
            <div className="relative mx-auto max-w-[390px]"><button disabled={Boolean(busy)} onClick={() => void choose("lifetime")} className="min-h-10 w-full rounded-[8px] bg-gradient-to-r from-teal-300 to-emerald-300 px-5 text-[12px] font-black text-slate-950 shadow-[0_4px_0_rgba(13,148,136,.35)] transition hover:brightness-105 disabled:opacity-60">{busy === "lifetime" ? "Opening secure checkout…" : `Get lifetime access for ${formatUsd(PAYWALL_PRICING.lifetimeUsd)}`}</button><span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[4px] bg-pink-500 px-3 py-0.5 text-[8px] font-black text-white shadow">◆ Launch offer: pay once</span></div>
            <p className="mt-4 text-center text-[10px] font-semibold text-slate-500">
              Prefer a subscription? {PAYWALL_PRICING.trialDays}-day free trial:{" "}
              <button disabled={Boolean(busy)} onClick={() => void choose("monthly")} className="underline transition hover:text-white">{busy === "monthly" ? "Opening…" : `${formatUsd(PAYWALL_PRICING.monthlyUsd)}/month`}</button>
              {" or "}
              <button disabled={Boolean(busy)} onClick={() => void choose("yearly")} className="underline transition hover:text-white">{busy === "yearly" ? "Opening…" : `${formatUsd(PAYWALL_PRICING.yearlyUsd)}/year`}</button>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
