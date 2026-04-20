import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ReceiptCycleLogo } from "@/components/brand/ReceiptCycleLogo";
import { SUPPORT_EMAIL, TWITTER_URL, INSTAGRAM_URL } from "@/content/site";
import { Seo } from "@/components/Seo";
import { getRouteSeo } from "@/content/routesSeo";

/** Static marketing site — no Convex or database calls. */
const accent = "#ea580c";
const primary = "#0f766e";
const PLAY_STORE_URL =
  (import.meta.env.VITE_PLAY_STORE_URL as string | undefined)?.trim() ||
  "https://play.google.com/store/apps/details?id=com.anonymous.receiptcyclemobile";

/** Public folder landing assets (works when Vite `base` is not `/`). */
function landingAsset(file: string): string {
  const b = import.meta.env.BASE_URL;
  const prefix = b.endsWith("/") ? b : `${b}/`;
  return `${prefix}landing/${file}`;
}

const HERO_HEADLINE_LINE1 = "See your spending clearly. ";
const HERO_HEADLINE_LINE2 = "Effortlessly.";

const heroH1Class =
  "mt-3 font-display text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem]";

function HeroTypingHeadline({ accentColor }: { accentColor: string }) {
  const full = `${HERO_HEADLINE_LINE1}${HERO_HEADLINE_LINE2}`;
  const [reduceMotion, setReduceMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [line1Len, setLine1Len] = useState(0);
  const [line2Len, setLine2Len] = useState(0);
  const [phase, setPhase] = useState<"line1" | "line2" | "done">("line1");

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;

    if (phase === "line1") {
      if (line1Len >= HERO_HEADLINE_LINE1.length) {
        const t = window.setTimeout(() => setPhase("line2"), 240);
        return () => window.clearTimeout(t);
      }
      const t = window.setTimeout(() => setLine1Len((n) => n + 1), 44);
      return () => window.clearTimeout(t);
    }

    if (phase === "line2") {
      if (line2Len >= HERO_HEADLINE_LINE2.length) {
        setPhase("done");
        return;
      }
      const t = window.setTimeout(() => setLine2Len((n) => n + 1), 52);
      return () => window.clearTimeout(t);
    }
  }, [reduceMotion, phase, line1Len, line2Len]);

  if (reduceMotion) {
    return (
      <h1 className={heroH1Class} aria-label={full}>
        <span className="text-slate-900">{HERO_HEADLINE_LINE1}</span>
        <span style={{ color: accentColor }}>{HERO_HEADLINE_LINE2}</span>
      </h1>
    );
  }

  const v1 = HERO_HEADLINE_LINE1.slice(0, line1Len);
  const v2 = HERO_HEADLINE_LINE2.slice(0, line2Len);
  const showCaret = phase !== "done";

  return (
    <h1 className={heroH1Class} aria-label={full}>
      <span className="text-slate-900">{v1}</span>
      <span style={{ color: accentColor }}>{v2}</span>
      {showCaret ? (
        <span
          className="ml-0.5 inline-block h-[0.82em] w-[2px] translate-y-0.5 animate-pulse rounded-sm align-middle bg-slate-900"
          style={phase === "line2" ? { backgroundColor: accentColor } : undefined}
          aria-hidden
        />
      ) : null}
    </h1>
  );
}

function JoinNowCta({
  className = "",
  variant = "hero",
}: {
  className?: string;
  /** `hero`: teal gradient on light sections. `inverse`: dark slate for dark band. */
  variant?: "hero" | "inverse";
}) {
  const pill =
    variant === "inverse"
      ? "inline-flex h-12 items-center justify-center rounded-xl bg-white px-8 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100"
      : "inline-flex h-12 items-center justify-center rounded-xl px-8 text-sm font-semibold text-white shadow-lg transition hover:opacity-95";
  const style = variant === "hero" ? { background: `linear-gradient(135deg, ${primary}, #0d9488)` } : undefined;
  const playClass =
    variant === "inverse"
      ? "inline-flex h-12 items-center justify-center rounded-xl border-2 border-white/90 bg-white/10 px-5 text-sm font-semibold text-white shadow-md backdrop-blur-sm transition hover:bg-white/15"
      : "inline-flex h-12 items-center justify-center rounded-xl border-2 border-slate-900 bg-white px-5 text-sm font-semibold text-slate-900 shadow-md transition hover:bg-slate-50";
  return (
    <div
      className={`flex flex-col gap-3 ${variant === "inverse" ? "items-center" : "items-start"} ${className}`}
    >
      <div
        className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center ${variant === "inverse" ? "sm:justify-center" : ""} sm:gap-3`}
      >
        <Link to="/signin" className={pill} style={style}>
          Join now
        </Link>
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={playClass}
        >
          <i className={`fab fa-google-play mr-2 text-lg ${variant === "inverse" ? "text-emerald-300" : "text-emerald-600"}`} aria-hidden />
          Google Play
        </a>
      </div>
    </div>
  );
}

function SectionTitle({ kicker, title, subtitle }: { kicker?: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {kicker ? (
        <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">{kicker}</p>
      ) : null}
      <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      {subtitle ? <p className="mt-3 text-base text-slate-600 sm:text-lg">{subtitle}</p> : null}
    </div>
  );
}

/** Decorative laurel-style accent (simple vector, not a third-party mark). */
function LaurelAccent({ className, mirror }: { className?: string; mirror?: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 88"
      width="40"
      height="88"
      aria-hidden
      style={mirror ? { transform: "scaleX(-1)" } : undefined}
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M20 6v76M20 14c-10 8-14 22-10 34M20 22c8 10 10 24 4 36M12 42c-4 8-2 18 4 24M28 38c4 10 2 22-4 30"
        opacity="0.85"
      />
    </svg>
  );
}

type LandingTestimonial = { title: string; quote: string; who: string; role: string };

const LANDING_TESTIMONIALS: LandingTestimonial[] = [
  {
    title: "Tax season stopped being a scavenger hunt",
    quote:
      "I finally stopped losing receipts before tax season. The scan flow is stupid fast, and categories stick so I am not re-tagging the same merchants every week.",
    who: "Jordan M.",
    role: "Freelance designer",
  },
  {
    title: "Voice add is my parking-lot ritual",
    quote:
      "I say what I bought in the car and fix details later. Way less friction than opening a spreadsheet—I actually keep up now.",
    who: "Marcus T.",
    role: "Sales consultant",
  },
  {
    title: "Duplicate charge caught in one insight",
    quote:
      "A duplicate subscription charge popped in the money-leak check. That single alert paid for the app in my book.",
    who: "Alex R.",
    role: "Ops lead",
  },
  {
    title: "Phone capture, weekend tidy-up",
    quote:
      "Upload and review on the phone during the week, tidy categories on the weekend. Matches how my brain works.",
    who: "Priya S.",
    role: "Small business owner",
  },
  {
    title: "Coach answers tied to my real numbers",
    quote:
      "I asked where dining was creeping up and got an answer based on my ledger—not generic advice. Huge for cutting fluff without guilt.",
    who: "Elena V.",
    role: "Product manager",
  },
  {
    title: "CSV import saved me a weekend",
    quote:
      "Dropped in a card export instead of retyping months of history. First time I trusted a mobile finance app with bulk data.",
    who: "Chris L.",
    role: "Contractor",
  },
  {
    title: "Budgets that feel like guardrails",
    quote:
      "Seeing pace per category keeps me honest before the month slips away. It is a nudge, not a lecture.",
    who: "Samira K.",
    role: "Teacher",
  },
  {
    title: "Receipt proof when HR asked",
    quote:
      "Search by merchant found a charge in seconds when I needed documentation. No more digging through email PDFs.",
    who: "Daniel O.",
    role: "Field engineer",
  },
  {
    title: "Same account on web and phone",
    quote:
      "I capture on Android and clean things up on the laptop when I have time. Sync just works.",
    who: "Riley N.",
    role: "Grad student",
  },
];

const LANDING_TESTIMONIALS_INITIAL = 6;

function UserReviewsSection() {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? LANDING_TESTIMONIALS : LANDING_TESTIMONIALS.slice(0, LANDING_TESTIMONIALS_INITIAL);
  const hiddenCount = LANDING_TESTIMONIALS.length - LANDING_TESTIMONIALS_INITIAL;
  const showToggle = LANDING_TESTIMONIALS.length > LANDING_TESTIMONIALS_INITIAL;

  return (
    <section id="reviews" className="border-t border-slate-100 bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle
          kicker="Reviews"
          title="What our users say"
          subtitle="Real stories from people who wanted receipts, categories, and clarity without living in a spreadsheet."
        />

        <div className="mx-auto mt-12 max-w-lg">
          <div className="flex items-center justify-center gap-3 sm:gap-5">
            <LaurelAccent className="shrink-0 text-amber-500/80" />
            <div className="text-center">
              <p className="font-display text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">4.8</p>
              <p className="mt-1 text-lg tracking-wide text-amber-500" aria-label="5 out of 5 stars">
                <span className="text-amber-500">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Average user rating</p>
              <p className="mt-1 text-xs text-slate-400">Early feedback; we are building toward strong app store scores.</p>
            </div>
            <LaurelAccent className="shrink-0 text-amber-500/80" mirror />
          </div>
        </div>

        <div className="mx-auto mt-12 columns-1 gap-4 md:columns-2 lg:columns-3 lg:gap-6">
          {visible.map((t) => (
            <article
              key={`${t.who}-${t.title}`}
              className="mb-4 break-inside-avoid rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6 lg:mb-6"
            >
              <p className="text-sm tracking-wide text-amber-500" aria-hidden>
                &#9733;&#9733;&#9733;&#9733;&#9733;
              </p>
              <h3 className="mt-2 font-display text-base font-bold text-slate-900 sm:text-lg">{t.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-4 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500">
                <span className="text-slate-800">{t.who}</span>
                <span className="text-slate-400"> · </span>
                <span>{t.role}</span>
              </footer>
            </article>
          ))}
        </div>

        {showToggle ? (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="rounded-full border-2 border-slate-300 bg-white px-8 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-teal-600 hover:text-teal-800"
            >
              {expanded ? "Show less" : `Show more${hiddenCount > 0 ? ` (${hiddenCount})` : ""}`}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default function MarketingLanding() {
  const seo = getRouteSeo("/");
  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      {seo ? (
        <Seo
          title={seo.title}
          description={seo.description}
          path="/"
          structuredData={seo.structuredData}
        />
      ) : null}
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <ReceiptCycleLogo className="text-lg" />
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 lg:flex">
            <a href="#features" className="hover:text-teal-700">
              Features
            </a>
            <a href="#how" className="hover:text-teal-700">
              How it works
            </a>
            <Link to="/about" className="hover:text-teal-700">
              About
            </Link>
            <Link to="/blog" className="hover:text-teal-700">
              Blog
            </Link>
            <Link to="/pricing" className="hover:text-teal-700">
              Pricing
            </Link>
            <Link to="/faq" className="hover:text-teal-700">
              FAQ
            </Link>
          </nav>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              to="/pricing"
              className="text-sm font-semibold text-slate-600 hover:text-teal-700 md:hidden"
            >
              Pricing
            </Link>
            <Link
              to="/signin"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Join now
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Mobile-first expense clarity</p>
            <HeroTypingHeadline accentColor={accent} />
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              Receipt Cycle captures receipts, categorizes spend, and surfaces money leaks—so you stop losing deductions
              and guessing where cash went. Built for people who live on their phone, not a spreadsheet.
            </p>
            <div id="download" className="mt-8 scroll-mt-24">
              <JoinNowCta />
              <p className="mt-3 text-xs text-slate-500">
                Join on the web or get the app on Google Play—same account and data across both.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-teal-100/80 to-orange-50/80 blur-2xl" aria-hidden />
            <img
              src={landingAsset("hero-phone.svg")}
              alt="Phone showing Receipt Cycle spending overview, categories, and voice entry"
              className="relative mx-auto w-full max-w-md rounded-2xl bg-black object-contain shadow-2xl ring-1 ring-slate-200/80"
              width={640}
              height={640}
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-slate-100 bg-white py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-3 sm:px-6">
          {[
            {
              icon: "fa-calendar-check",
              title: "Every receipt, one timeline",
              body: "Capture paper, email PDFs, or CSV statements—stay audit-ready without the shoebox.",
            },
            {
              icon: "fa-bolt",
              title: "Real-time sync",
              body: "Your ledger stays consistent across devices the moment you sign in.",
            },
            {
              icon: "fa-shield-halved",
              title: "You own your data",
              body: "Your workspace, your rules. No ad-powered bank scraping—we start from what you upload and scan.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-6 text-center shadow-sm">
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white"
                style={{ background: `linear-gradient(135deg, ${primary}, #0d9488)` }}
              >
                <i className={`fas ${item.icon}`} aria-hidden />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="scroll-mt-20 border-b border-slate-100 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionTitle
            kicker="Why proof and clarity slip away"
            title="Without capture, your ledger—and your deductions—are guesses"
            subtitle="Receipt Cycle exists so you keep audit-ready proof on the go: lost paper, messy exports, and forgotten categories stop costing you money and time. Capture in seconds; see spending clearly without living in a spreadsheet."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Lost receipts = lost deductions and disputed expenses.",
              "Manual entry breaks when you’re busy—you stop at February.",
              "Subscriptions and micro-fees add up before you notice.",
              "Tax time becomes archaeology instead of a 10-minute export.",
            ].map((t) => (
              <div key={t} className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
                <span className="mr-2 text-teal-600">✓</span>
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alternating features */}
      <section id="features" className="scroll-mt-20 space-y-20 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionTitle
            kicker="What you get"
            title="From snap to insight—proof, pace, and fewer surprises"
            subtitle="Every flow is built around Receipt Cycle’s core job: capture truth fast, categorize once, and surface leaks before tax season or audits sneak up on you."
          />
        </div>

        {(
          [
            {
              h: "Add expenses by voice or a quick sentence",
              p: "Say what you bought (“$24 gas at Shell yesterday”) or type it once. AI fills amount, merchant, category, and date so you can confirm and save—no spreadsheet grind.",
              img: landingAsset("voice-transaction.svg"),
              alt: "Voice entry: speak a purchase and confirm AI-filled details",
              reverse: false,
            },
            {
              h: "Chat with an AI finance coach",
              p: "Ask where you’re wasting money, what to cut, or how categories compare. The coach reads your real ledger for the month or all time—reply in text or speak your question.",
              img: landingAsset("finance-coach-chat.svg"),
              alt: "Finance coach chat with answers grounded in your spending",
              reverse: true,
            },
            {
              h: "No more lost paper receipts",
              p: "Scan in seconds with guided capture. We preserve merchant, totals, and line context so you can defend every line item later.",
              img: landingAsset("scan-receipt.svg"),
              alt: "Guided receipt scan in the camera frame",
              reverse: false,
            },
            {
              h: "Track expenses without living in a spreadsheet",
              p: "Categories, merchants, and notes stay attached to real transactions. Review on mobile; export when your accountant asks.",
              img: landingAsset("feature-expense-tracking.svg"),
              alt: "Mobile ledger with categories and receipts, not a spreadsheet",
              reverse: true,
            },
            {
              h: "Find any charge, fast",
              p: "Search by merchant, amount range, or month. Perfect when you need proof for HR, a warranty, or a subscription audit.",
              img: landingAsset("feature-find-charge.svg"),
              alt: "Search across transactions and receipts",
              reverse: false,
            },
            {
              h: "Set limits. Keep more.",
              p: "Budgets turn your history into guardrails—not guilt trips. See category pace and adjust before the month slips away.",
              img: landingAsset("feature-budget-limits.svg"),
              alt: "Budget rings and category pace at a glance",
              reverse: true,
            },
            {
              h: "See money leaks before they stack",
              p: "AI-assisted insights highlight duplicates, creep-subscriptions, and spikes—written in plain language you can act on.",
              img: landingAsset("feature-money-leaks.svg"),
              alt: "Money leak insights and spending trend chart",
              reverse: false,
            },
            {
              h: "Built for how you actually work",
              p: "Personal workspace today; team flows tomorrow. Start solo, stay organized, and grow without switching apps.",
              img: landingAsset("feature-built-for-you.svg"),
              alt: "Mobile capture and web review staying in sync",
              reverse: true,
            },
          ] as const
        ).map((block) => (
          <div key={block.h} className="mx-auto max-w-6xl px-4 sm:px-6">
            <div
              className={`grid items-center gap-10 lg:grid-cols-2 ${block.reverse ? "lg:grid-flow-dense" : ""}`}
            >
              <div className={block.reverse ? "lg:col-start-2" : ""}>
                <h3 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">{block.h}</h3>
                <p className="mt-4 text-slate-600">{block.p}</p>
                <ul className="mt-6 space-y-2 text-sm text-slate-700">
                  <li className="flex gap-2">
                    <span className="text-teal-600">●</span> Pain: forgotten purchases and messy exports.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-teal-600">●</span> Outcome: one organized ledger you trust.
                  </li>
                </ul>
              </div>
              <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-lg ${block.reverse ? "lg:col-start-1 lg:row-start-1" : ""}`}>
                <img
                  src={block.img}
                  alt={block.alt}
                  className="aspect-[4/3] w-full bg-slate-100 object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 border-y border-slate-100 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionTitle
            kicker="How it works"
            title="Three steps. No jargon."
            subtitle="You bring real-world mess—we structure it."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { step: "1", t: "Capture", d: "Snap receipts, upload statements, or say what you bought—voice or text." },
              { step: "2", t: "Classify", d: "Edit categories merchants once; patterns stick next time." },
              { step: "3", t: "Act", d: "Run leak checks, chat with your finance coach, watch budgets, export clean data." },
            ].map((s) => (
              <div key={s.step} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: primary }}
                >
                  {s.step}
                </span>
                <h3 className="mt-4 font-display text-lg font-bold">{s.t}</h3>
                <p className="mt-2 text-sm text-slate-600">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionTitle
            kicker="Everything else"
            title="Unlimited ways to stay on top of spend"
            subtitle="Small tools that compound—notifications, exports, Drive backup, and more in the mobile app."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["fa-microphone", "Voice & quick-add", "Speak or type a purchase; AI drafts the transaction for you to confirm."],
              ["fa-comments", "Finance coach", "Chat about waste, cuts, and patterns—typed or spoken—grounded in your data."],
              ["fa-bell", "Smart reminders", "Nudges when uploads stall or limits approach."],
              ["fa-cloud", "Backup-friendly", "Optional export workflows for your own archive."],
              ["fa-earth-americas", "Multi-currency aware", "Track context for travel and cross-border spends."],
              ["fa-file-csv", "Bulk import", "Pull history in from banks and cards without retyping."],
              ["fa-lock", "Session-aware", "Sign in securely; your data stays with your account."],
              ["fa-chart-pie", "Insights that explain", "Plain-language findings—not just another dashboard."],
            ].map(([icon, title, desc]) => (
              <div key={title} className="flex gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                  <i className={`fas ${icon}`} aria-hidden />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <UserReviewsSection />

      {/* About */}
      <section id="about" className="scroll-mt-20 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-lg">
            <img
              src={landingAsset("about-clarity.svg")}
              alt="Receipt Cycle: clarity and trust for your ledger"
              className="aspect-[4/3] w-full bg-slate-100 object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Why we exist</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-slate-900">Built for clarity under pressure</h2>
            <p className="mt-4 text-slate-600">
              Finance tools fail when capture is harder than ignoring the problem. Receipt Cycle compresses the grind—scan,
              classify, export—so independent workers and growing teams can justify spend, reclaim tax-time hours, and catch
              leaks while they’re small.
            </p>
            <p className="mt-4 text-slate-600">
              You stay on mobile; your ledger stays honest. That’s the promise.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section id="pricing" className="scroll-mt-20 border-t border-slate-100 bg-slate-50 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <SectionTitle
            kicker="Pricing"
            title="Start free. Upgrade when Receipt Cycle pays for itself."
            subtitle="See in-app tiers and limits—designed so hobbyists and heavy scanners both win."
          />
          <p className="mt-6 text-sm text-slate-600">
            Details live in the mobile app (and on our pricing page when published). No credit card required to try capture
            and categorization.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionTitle kicker="FAQ" title="Quick answers" />
          <Accordion type="single" collapsible className="mt-10 w-full">
            {[
              {
                q: "Do I need the web app to use Receipt Cycle?",
                a: "No. This website is for downloads and storytelling. The product lives on iOS and Android.",
              },
              {
                q: "Where is my data stored?",
                a: "Data lives in the secure backend you or your organization connects to the app—your team controls where it runs.",
              },
              {
                q: "Does scanning work offline?",
                a: "You can capture images offline; sync and OCR run when you reconnect (subject to your plan and admin settings).",
              },
              {
                q: "Is this page connected to my account?",
                a: "This landing page is static and does not load your data. Only the separate /admin console talks to your backend.",
              },
            ].map((item, i) => (
              <AccordionItem key={item.q} value={`faq-${i}`}>
                <AccordionTrigger className="text-left font-semibold">{item.q}</AccordionTrigger>
                <AccordionContent className="text-slate-600">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-slate-200 bg-slate-900 py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Start understanding your money today</h2>
          <p className="mt-4 text-slate-300">
            Sign in or sign up on the web, or grab Receipt Cycle from Google Play—one account everywhere.
          </p>
          <div className="mt-8 flex justify-center">
            <JoinNowCta className="justify-center" variant="inverse" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))]">
            <div>
              <ReceiptCycleLogo />
              <p className="mt-3 max-w-sm text-sm text-slate-600">
                Scan once. Categorize smarter. Prove every expense. Mobile-first expense intelligence for teams and
                individuals.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-slate-500">
                <a
                  href={TWITTER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-700 transition hover:border-teal-200 hover:text-teal-700"
                  aria-label="Receipt Cycle on X (Twitter)"
                >
                  <i className="fab fa-x-twitter" aria-hidden />
                </a>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-700 transition hover:border-teal-200 hover:text-teal-700"
                  aria-label="Receipt Cycle on Instagram"
                >
                  <i className="fab fa-instagram" aria-hidden />
                </a>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Product</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>
                  <a href="#features" className="hover:text-teal-700">
                    Features
                  </a>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-teal-700">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/signin" className="hover:text-teal-700">
                    Join now
                  </Link>
                </li>
                <li>
                  <a
                    href={PLAY_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-teal-700"
                  >
                    Google Play
                  </a>
                </li>
                <li>
                  <Link to="/faq" className="hover:text-teal-700">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="hover:text-teal-700">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-teal-700">
                    About
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Legal</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>
                  <Link to="/privacy" className="hover:text-teal-700">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-teal-700">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/refund-policy" className="hover:text-teal-700">
                    Refund Policy
                  </Link>
                </li>
                <li>
                  <Link to="/impressum" className="hover:text-teal-700">
                    Impressum
                  </Link>
                </li>
                <li>
                  <Link to="/cookies" className="hover:text-teal-700">
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link to="/cookie-settings" className="hover:text-teal-700">
                    Cookie Settings
                  </Link>
                </li>
                <li>
                  <Link to="/do-not-sell" className="hover:text-teal-700">
                    Do Not Sell/Share My Info
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-teal-700">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Support</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-teal-700 hover:underline">
                    {SUPPORT_EMAIL}
                  </a>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-teal-700">
                    Contact form
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-teal-700">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="hover:text-teal-700">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-6xl px-4 text-center text-xs text-slate-400 sm:px-6">
          © {new Date().getFullYear()} Receipt Cycle. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
