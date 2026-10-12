import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { data as ISO_CURRENCY_DATA } from "currency-codes";
import { getIsoCountries } from "@mobile-lib/isoCountries";
import { ReceiptCycleLogo } from "@/components/brand/ReceiptCycleLogo";
import { useWebAuth } from "@/contexts/WebAuthContext";
import { useWebPreferences } from "@/contexts/WebPreferencesContext";
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

  if (loading || !user) return null;
  const progress = Math.round(step / 3 * 100);

  return (
    <div className="min-h-screen bg-[#f4f8f7] text-slate-900">
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8"><ReceiptCycleLogo size={40} /><button type="button" onClick={finish} className="text-sm font-bold text-slate-500 hover:text-teal-700">Exit setup</button></div></header>
      <main className="mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl lg:grid-cols-[300px_1fr] grid-cols-1">
        <aside className="border-b border-slate-200 bg-slate-950 px-6 py-6 text-white lg:border-b-0 lg:border-r lg:px-8 lg:py-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Workspace setup</p>
          <h2 className="mt-3 text-2xl font-black">Build the workspace around your business.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">A few choices set your currency, working style, and preferences. You can change them later.</p>
          <div className="mt-8"><div className="flex justify-between text-xs font-bold text-slate-300"><span>Step {step} of 3</span><span>{progress}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-teal-400 transition-all" style={{ width: `${progress}%` }} /></div></div>
          <ol className="mt-8 hidden space-y-4 lg:block">{["Business basics", "Your priorities", "Review and start"].map((label, index) => <li key={label} className={`flex items-center gap-3 text-sm ${index + 1 === step ? "font-bold text-white" : index + 1 < step ? "text-teal-300" : "text-slate-500"}`}><span className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs ${index + 1 <= step ? "border-teal-400 bg-teal-400/15" : "border-slate-700"}`}>{index + 1 < step ? <i className="fas fa-check" /> : index + 1}</span>{label}</li>)}</ol>
        </aside>

        <section className="flex min-w-0 flex-col bg-white px-5 py-8 sm:px-10 lg:px-14 lg:py-12">
          <div className="mx-auto w-full max-w-4xl flex-1">
            {step === 1 ? <><StepIntro icon="fa-coins" title="Set your business basics" text="Choose the regional settings used for records, reports, and voice input." /><div className="mt-8 grid gap-5 md:grid-cols-2 grid-cols-1"><label className="text-sm font-bold text-slate-700">Main currency<select value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 font-medium outline-none focus:border-teal-600"><option value="">Select a currency</option>{currencies.map((row) => <option key={row.code} value={row.code}>{row.label}</option>)}</select></label><label className="text-sm font-bold text-slate-700">Country or region<select value={country} onChange={(e) => setCountry(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 font-medium outline-none focus:border-teal-600"><option value="">Select a country</option>{countries.map((row) => <option key={row.code} value={row.code}>{row.name}</option>)}</select></label><label className="text-sm font-bold text-slate-700">Industry<select value={industry} onChange={(e) => setIndustry(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 font-medium outline-none focus:border-teal-600"><option value="">Select an industry</option>{industryOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-sm font-bold text-slate-700">Voice input language<select value={voiceLanguage} onChange={(e) => setVoiceLanguage(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 font-medium outline-none focus:border-teal-600">{VOICE_INPUT_LANGUAGE_OPTIONS.map((row) => <option key={row.id} value={row.id}>{row.label}</option>)}</select></label></div></> : null}
            {step === 2 ? <><StepIntro icon="fa-bullseye" title="Shape your starting workspace" text="Choose your priorities, common jobs, and who will manage the records." /><div className="mt-8 grid gap-3 md:grid-cols-2 grid-cols-1">{goalOptions.map((option) => <ChoiceCard key={option.value} {...option} selected={goals.includes(option.value)} onClick={() => toggle(goals, option.value, setGoals)} />)}</div><h2 className="mt-8 text-sm font-black uppercase tracking-wide text-slate-500">Main use cases</h2><div className="mt-3 grid gap-4 md:grid-cols-3 grid-cols-1">{usecaseOptions.map((option) => <ChoiceCard key={option.value} {...option} selected={usecases.includes(option.value)} onClick={() => toggle(usecases, option.value, setUsecases)} />)}</div><h2 className="mt-8 text-sm font-black uppercase tracking-wide text-slate-500">Who manages the records?</h2><div className="mt-3 grid gap-4 md:grid-cols-2 grid-cols-1"><ChoiceCard selected={trackingMode === "just-me"} icon="fa-user" title="Just me" text="I manage my own records and client billing." onClick={() => setTrackingMode("just-me")} /><ChoiceCard selected={trackingMode === "team"} icon="fa-user-group" title="A small team" text="Several people help maintain business records." onClick={() => setTrackingMode("team")} /></div></> : null}
            {step === 3 ? <><StepIntro icon="fa-circle-check" title="Your workspace is ready" text="Your account starts empty, without demo transactions. Add your first real receipt, expense, invoice, or estimate from the dashboard." /><div className="mt-8 rounded-2xl border border-teal-200 bg-teal-50 p-6"><p className="font-bold text-teal-950">Your choices have been saved</p><p className="mt-2 text-sm leading-6 text-teal-900">You can update currency, region, industry, and voice settings later. Nothing here locks your workspace.</p></div></> : null}
          </div>

          <div className="mx-auto mt-10 flex w-full max-w-4xl items-center justify-between border-t border-slate-200 pt-6"><button type="button" onClick={() => step > 1 ? setStep(step - 1) : finish()} className="h-11 rounded-xl px-4 text-sm font-bold text-slate-600 hover:bg-slate-100">{step > 1 ? "Back" : "Skip setup"}</button><button type="button" onClick={() => step < 3 ? setStep(step + 1) : finish()} className="inline-flex h-11 items-center gap-2 rounded-xl bg-teal-700 px-6 text-sm font-bold text-white shadow-sm hover:bg-teal-800">{step < 3 ? "Continue" : "Open dashboard"}<i className="fas fa-arrow-right text-xs" /></button></div>
        </section>
      </main>
    </div>
  );
}
