import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { data as ISO_CURRENCY_DATA } from "currency-codes";
import { getIsoCountries } from "@mobile-lib/isoCountries";
import { PAYWALL_PLANS, PAYWALL_TIER_FEATURES, type PaywallPlanId } from "@mobile-lib/pricingPaywall";
import { ReceiptCycleLogo } from "@/components/brand/ReceiptCycleLogo";
import { useWebAuth } from "@/contexts/WebAuthContext";
import { useWebPreferences } from "@/contexts/WebPreferencesContext";
import { useBilling } from "@/lib/billing";
import { markWebOnboardingComplete, needsWebOnboarding } from "@/lib/webOnboarding";
import {
  SETTINGS_STORAGE_KEYS,
  VOICE_INPUT_LANGUAGE_OPTIONS,
  normalizeVoiceInputLanguage,
} from "@mobile-lib/preferences";

const goalOptions = [
  { value: "track", title: "Track income and expenses", text: "Keep day-to-day activity organized.", icon: "fa-chart-line" },
  { value: "debts", title: "Stay ahead of bills", text: "Keep outgoing commitments visible.", icon: "fa-calendar-check" },
  { value: "cut", title: "Understand spending", text: "See where business money is going.", icon: "fa-chart-pie" },
  { value: "saving", title: "Build better reserves", text: "Use budgets to plan what remains.", icon: "fa-piggy-bank" },
  { value: "manage", title: "Manage client billing", text: "Connect estimates, invoices, and payments.", icon: "fa-file-invoice-dollar" },
] as const;

const usecaseOptions = [
  { value: "personal", title: "Independent work", text: "Organize the records behind your own work.", icon: "fa-user" },
  { value: "expense", title: "Business expenses", text: "Capture receipts and categorize spending.", icon: "fa-receipt" },
  { value: "tax", title: "Tax preparation", text: "Keep evidence ready for professional review.", icon: "fa-folder-open" },
] as const;

const industryOptions = [
  ["construction", "Construction", "fa-helmet-safety"], ["influencer", "Creator", "fa-video"],
  ["health", "Health", "fa-heart-pulse"], ["sales", "Sales", "fa-handshake"],
  ["real-estate", "Real estate", "fa-building"], ["digital", "Digital services", "fa-laptop-code"],
  ["food", "Food", "fa-utensils"], ["retail", "Retail", "fa-store"],
  ["travel", "Travel", "fa-plane"], ["creative", "Creative", "fa-palette"],
  ["consulting", "Consulting", "fa-briefcase"], ["other", "Other", "fa-shapes"],
] as const;

function ChoiceCard({ selected, icon, title, text, onClick }: { selected: boolean; icon: string; title: string; text: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={`flex min-h-28 items-start gap-4 rounded-2xl border p-5 text-left transition ${selected ? "border-teal-600 bg-teal-50 shadow-sm ring-1 ring-teal-600" : "border-slate-200 bg-white hover:border-teal-300 hover:shadow-sm"}`}>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"}`}><i className={`fas ${icon}`} /></span>
      <span className="min-w-0"><strong className="block text-sm text-slate-950">{title}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{text}</span></span>
      <i className={`fas fa-circle-check ml-auto mt-1 ${selected ? "text-teal-700" : "text-slate-200"}`} />
    </button>
  );
}

function StepIntro({ icon, title, text }: { icon: string; title: string; text: string }) {
  return <div className="max-w-xl"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-xl text-teal-700"><i className={`fas ${icon}`} /></span><h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">{title}</h1><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p></div>;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading } = useWebAuth();
  const { setCurrency: savePreferredCurrency, setVoiceInputLanguage: savePreferredVoiceLanguage } = useWebPreferences();
  const [step, setStep] = useState(1);
  const [currency, setCurrency] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [trackingMode, setTrackingMode] = useState("");
  const [usecases, setUsecases] = useState<string[]>([]);
  const [country, setCountry] = useState("");
  const [industry, setIndustry] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState("auto");
  const currencies = useMemo(() => ISO_CURRENCY_DATA.map((row) => ({ code: row.code, label: `${row.code} - ${row.currency}` })).sort((a, b) => a.code.localeCompare(b.code)), []);
  const countries = useMemo(() => getIsoCountries(), []);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/signin", { replace: true });
    else if (!needsWebOnboarding(user.id)) navigate("/dashboard", { replace: true });
  }, [loading, user, navigate]);

  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  function finish() {
    if (!user) return;
    const normalizedVoiceLanguage = normalizeVoiceInputLanguage(voiceLanguage);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEYS.voiceInputLanguage, normalizedVoiceLanguage);
      localStorage.setItem("onboardingData", JSON.stringify({ currency, goals, trackingMode, usecases, country, industry, voiceInputLanguage: normalizedVoiceLanguage, completed: true, completedAt: new Date().toISOString() }));
    } catch { /* local settings are best effort */ }
    // Apply the choices to live preferences (also syncs to the account); localStorage alone is only read on first mount.
    if (currency) void savePreferredCurrency(currency);
    void savePreferredVoiceLanguage(normalizedVoiceLanguage);
    markWebOnboardingComplete(user.id);
    navigate("/dashboard", { replace: true });
  }

  const { startCheckout } = useBilling();
  async function choosePlan(id: PaywallPlanId) {
    if (id === "free") { finish(); return; }
    markWebOnboardingComplete(user!.id);
    const problem = await startCheckout(id);
    if (problem) window.alert(problem);
  }

  if (loading || !user) return null;
  const progress = Math.round(step / 7 * 100);

  return (
    <div className="min-h-screen bg-[#f4f8f7] text-slate-900">
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8"><ReceiptCycleLogo size={40} /><button type="button" onClick={finish} className="text-sm font-bold text-slate-500 hover:text-teal-700">Exit setup</button></div></header>
      <main className="mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl lg:grid-cols-[300px_1fr]">
        <aside className="border-b border-slate-200 bg-slate-950 px-6 py-6 text-white lg:border-b-0 lg:border-r lg:px-8 lg:py-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Workspace setup</p>
          <h2 className="mt-3 text-2xl font-black">Build the workspace around your business.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">A few choices set your currency, working style, and preferences. You can change them later.</p>
          <div className="mt-8"><div className="flex justify-between text-xs font-bold text-slate-300"><span>Step {step} of 7</span><span>{progress}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-teal-400 transition-all" style={{ width: `${progress}%` }} /></div></div>
          <ol className="mt-8 hidden space-y-4 lg:block">{["Region and currency", "Financial goals", "Working style", "Main use cases", "Country", "Industry", "Choose a plan"].map((label, index) => <li key={label} className={`flex items-center gap-3 text-sm ${index + 1 === step ? "font-bold text-white" : index + 1 < step ? "text-teal-300" : "text-slate-500"}`}><span className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs ${index + 1 <= step ? "border-teal-400 bg-teal-400/15" : "border-slate-700"}`}>{index + 1 < step ? <i className="fas fa-check" /> : index + 1}</span>{label}</li>)}</ol>
        </aside>

        <section className="flex min-w-0 flex-col bg-white px-5 py-8 sm:px-10 lg:px-14 lg:py-12">
          <div className="mx-auto w-full max-w-4xl flex-1">
            {step === 1 ? <><StepIntro icon="fa-coins" title="Set your regional preferences" text="Choose the currency used for new records and the language used for voice input." /><div className="mt-8 grid gap-5 md:grid-cols-2"><label className="text-sm font-bold text-slate-700">Main currency<select value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 font-medium outline-none focus:border-teal-600"><option value="">Select a currency</option>{currencies.map((row) => <option key={row.code} value={row.code}>{row.label}</option>)}</select></label><label className="text-sm font-bold text-slate-700">Voice input language<select value={voiceLanguage} onChange={(e) => setVoiceLanguage(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 font-medium outline-none focus:border-teal-600">{VOICE_INPUT_LANGUAGE_OPTIONS.map((row) => <option key={row.id} value={row.id}>{row.label}</option>)}</select></label></div></> : null}
            {step === 2 ? <><StepIntro icon="fa-bullseye" title="What do you want to improve first?" text="Select every goal that matters. We will use this only to tailor the starting experience." /><div className="mt-8 grid gap-3 md:grid-cols-2">{goalOptions.map((option) => <ChoiceCard key={option.value} {...option} selected={goals.includes(option.value)} onClick={() => toggle(goals, option.value, setGoals)} />)}</div></> : null}
            {step === 3 ? <><StepIntro icon="fa-users" title="Who will manage these records?" text="Choose the working style that best matches your current setup." /><div className="mt-8 grid gap-4 md:grid-cols-2"><ChoiceCard selected={trackingMode === "just-me"} icon="fa-user" title="Just me" text="I manage my own records and client billing." onClick={() => setTrackingMode("just-me")} /><ChoiceCard selected={trackingMode === "team"} icon="fa-user-group" title="A small team" text="Several people help maintain business records." onClick={() => setTrackingMode("team")} /></div></> : null}
            {step === 4 ? <><StepIntro icon="fa-briefcase" title="How will you use Receipt Cycle?" text="Choose the jobs you expect to handle most often." /><div className="mt-8 grid gap-4 md:grid-cols-3">{usecaseOptions.map((option) => <ChoiceCard key={option.value} {...option} selected={usecases.includes(option.value)} onClick={() => toggle(usecases, option.value, setUsecases)} />)}</div></> : null}
            {step === 5 ? <><StepIntro icon="fa-earth-africa" title="Where is your business based?" text="This helps us present regional choices more appropriately. It does not provide tax advice." /><label className="mt-8 block max-w-xl text-sm font-bold text-slate-700">Country<select value={country} onChange={(e) => setCountry(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 font-medium outline-none focus:border-teal-600"><option value="">Select a country</option>{countries.map((row) => <option key={row.code} value={row.code}>{row.name}</option>)}</select></label></> : null}
            {step === 6 ? <><StepIntro icon="fa-building" title="Which industry is closest to your work?" text="Choose the closest match. This helps us understand how the product is being used." /><div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{industryOptions.map(([value, label, icon]) => <button type="button" key={value} onClick={() => setIndustry(value)} className={`rounded-2xl border p-4 text-left transition ${industry === value ? "border-teal-600 bg-teal-50 ring-1 ring-teal-600" : "border-slate-200 hover:border-teal-300"}`}><i className={`fas ${icon} text-lg text-teal-700`} /><span className="mt-3 block text-sm font-bold">{label}</span></button>)}</div></> : null}
            {step === 7 ? <><StepIntro icon="fa-circle-check" title="Your workspace is ready" text="Choose Pro now or continue with Free. You can change plans later from your profile menu." /><div className="mt-8 grid gap-4 lg:grid-cols-3">{PAYWALL_PLANS.map((plan) => <article key={plan.id} className={`flex flex-col rounded-2xl border p-5 ${plan.id === "yearly" ? "border-2 border-teal-600 bg-teal-50/50 shadow-md" : "border-slate-200"}`}><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{plan.hint}</p><h2 className="mt-2 text-xl font-black">{plan.label}</h2><p className="mt-3 text-3xl font-black">{plan.priceLine}</p><p className="mt-1 text-xs text-slate-500">{plan.periodNote}</p><ul className="mt-5 flex-1 space-y-2 border-t border-slate-200 pt-5">{PAYWALL_TIER_FEATURES[plan.id].slice(0, 4).map((feature) => <li key={feature} className="flex gap-2 text-xs leading-5 text-slate-600"><i className="fas fa-check mt-1 text-teal-600" />{feature}</li>)}</ul><button type="button" onClick={() => choosePlan(plan.id)} className={`mt-6 h-11 rounded-xl text-sm font-bold ${plan.id === "yearly" ? "bg-teal-700 text-white" : "border border-slate-300 bg-white text-slate-800"}`}>{plan.id === "free" ? "Continue with Free" : plan.id === "yearly" ? "Start free trial" : "Subscribe monthly"}</button></article>)}</div><button type="button" onClick={finish} className="mx-auto mt-6 block text-sm font-bold text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-teal-700">Skip for now and open dashboard</button></> : null}
          </div>

          {step < 7 ? <div className="mx-auto mt-10 flex w-full max-w-4xl items-center justify-between border-t border-slate-200 pt-6"><button type="button" onClick={() => step > 1 ? setStep(step - 1) : finish()} className="h-11 rounded-xl px-4 text-sm font-bold text-slate-600 hover:bg-slate-100">{step > 1 ? "Back" : "Skip setup"}</button><button type="button" onClick={() => setStep(step + 1)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-teal-700 px-6 text-sm font-bold text-white shadow-sm hover:bg-teal-800">Continue<i className="fas fa-arrow-right text-xs" /></button></div> : null}
        </section>
      </main>
    </div>
  );
}
