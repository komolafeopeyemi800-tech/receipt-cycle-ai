import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ReceiptCycleLogo } from "@/components/brand/ReceiptCycleLogo";
import { SUPPORT_EMAIL, TWITTER_URL, INSTAGRAM_URL } from "@/content/site";

/** Static marketing site — no Convex or database calls. */
const accent = "#ea580c";
const primary = "#0f766e";
const PLAY_STORE_URL =
  (import.meta.env.VITE_PLAY_STORE_URL as string | undefined)?.trim() ||
  "https://play.google.com/store/apps/details?id=com.anonymous.receiptcyclemobile";

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

export default function MarketingLanding() {
  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <ReceiptCycleLogo className="text-lg" />
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#problem" className="hover:text-teal-700">
              Problem
            </a>
            <a href="#features" className="hover:text-teal-700">
              Features
            </a>
            <a href="#how" className="hover:text-teal-700">
              How it works
            </a>
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
              src="/landing/hero-phone.png"
              alt="Hand holding phone showing expense overview in Receipt Cycle"
              className="relative mx-auto w-full max-w-md rounded-2xl shadow-2xl ring-1 ring-slate-200/80"
              width={640}
              height={640}
              loading="eager"
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
            kicker="The problem"
            title="Paper receipts and bank exports weren’t built for real life"
            subtitle="Money leaks hide in small recurring charges, lost proof of purchase, and categories you never fix. Spreadsheets die on your phone. We built Receipt Cycle so capture takes seconds and clarity scales with you."
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
            kicker="Benefits"
            title="From snap to insight—without the busywork"
            subtitle="Each feature ties to a pain point: speed, accuracy, and knowing what to do next."
          />
        </div>

        {(
          [
            {
              h: "Add expenses by voice or a quick sentence",
              p: "Say what you bought (“$24 gas at Shell yesterday”) or type it once. AI fills amount, merchant, category, and date so you can confirm and save—no spreadsheet grind.",
              img: "/landing/voice-transaction.png",
              alt: "Illustration of voice entry for expenses on a phone",
              reverse: false,
            },
            {
              h: "Chat with an AI finance coach",
              p: "Ask where you’re wasting money, what to cut, or how categories compare. The coach reads your real ledger for the month or all time—reply in text or speak your question.",
              img: "/landing/finance-coach-chat.png",
              alt: "Illustration of AI chat helping with personal finances",
              reverse: true,
            },
            {
              h: "No more lost paper receipts",
              p: "Scan in seconds with guided capture. We preserve merchant, totals, and line context so you can defend every line item later.",
              img: "/landing/scan-receipt.png",
              alt: "Phone scanning a paper receipt",
              reverse: false,
            },
            {
              h: "Track expenses without living in a spreadsheet",
              p: "Categories, merchants, and notes stay attached to real transactions. Review on mobile; export when your accountant asks.",
              img: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=900&h=700&fit=crop&q=80",
              alt: "Person reviewing finances on phone",
              reverse: true,
            },
            {
              h: "Find any charge, fast",
              p: "Search by merchant, amount range, or month. Perfect when you need proof for HR, a warranty, or a subscription audit.",
              img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=900&h=700&fit=crop&q=80",
              alt: "Organized desk with notebook and laptop",
              reverse: false,
            },
            {
              h: "Set limits. Keep more.",
              p: "Budgets turn your history into guardrails—not guilt trips. See category pace and adjust before the month slips away.",
              img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=900&h=700&fit=crop&q=80",
              alt: "Budget planning with calculator",
              reverse: true,
            },
            {
              h: "See money leaks before they stack",
              p: "AI-assisted insights highlight duplicates, creep-subscriptions, and spikes—written in plain language you can act on.",
              img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&h=700&fit=crop&q=80",
              alt: "Analytics charts on laptop screen",
              reverse: false,
            },
            {
              h: "Built for how you actually work",
              p: "Personal workspace today; team flows tomorrow. Start solo, stay organized, and grow without switching apps.",
              img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&h=700&fit=crop&q=80",
              alt: "Two colleagues collaborating with laptops",
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
                <img src={block.img} alt={block.alt} className="aspect-[4/3] w-full object-cover" loading="lazy" />
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

      {/* Social proof */}
      <section className="border-t border-slate-100 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionTitle kicker="Voices" title="What early users say" />
          <div className="mx-auto mt-10 flex max-w-md flex-col items-center rounded-2xl border border-amber-100 bg-amber-50/50 px-6 py-8 text-center">
            <p className="font-display text-5xl font-bold text-slate-900">4.8</p>
            <p className="mt-1 text-amber-600">★★★★★</p>
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">Target for store ratings</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              {
                q: "I finally stopped losing receipts before tax season. The scan flow is stupid fast.",
                who: "Jordan M.",
                role: "Freelance designer",
              },
              {
                q: "Upload+review on the phone, tidy categories on the weekend. Exactly my split brain needs.",
                who: "Priya S.",
                role: "Small business owner",
              },
              {
                q: "Duplicate subscription charge popped in insights—paid for itself in one alert.",
                who: "Alex R.",
                role: "Ops lead",
              },
            ].map((t) => (
              <blockquote
                key={t.who}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm"
              >
                <p className="text-amber-500">★★★★★</p>
                <p className="mt-2 text-slate-700">&ldquo;{t.q}&rdquo;</p>
                <footer className="mt-4 text-xs font-semibold text-slate-500">
                  {t.who} · {t.role}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="scroll-mt-20 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&h=700&fit=crop&q=80"
              alt="Team collaboration"
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
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
                  <a href="#about" className="hover:text-teal-700">
                    About
                  </a>
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
