import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

/** CSS-only marketing illustration — not the signed-in /dashboard app. */
function LandingProductIllustration({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative rounded-2xl border border-slate-200 bg-slate-900/95 p-2 shadow-2xl shadow-primary/10 ${className}`}
      aria-hidden
    >
      <div className="relative mx-auto max-w-[520px]">
        <div className="absolute -inset-1 rounded-[14px] bg-gradient-to-br from-slate-300/50 to-slate-400/30 blur-sm" />
        <div className="relative flex h-[min(420px,55vw)] min-h-[280px] overflow-hidden rounded-xl bg-slate-100">
          <div className="hidden w-14 shrink-0 flex-col gap-2 border-r border-slate-200 bg-white py-3 sm:flex">
            <div className="mx-auto h-8 w-8 rounded-lg bg-primary/15" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="mx-auto h-6 w-6 rounded-md bg-slate-200/80" />
            ))}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3 p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="h-8 w-36 rounded-lg bg-white shadow-sm" />
              <div className="flex gap-2">
                <div className="h-8 w-20 rounded-lg bg-white shadow-sm" />
                <div className="h-8 w-24 rounded-lg bg-primary/90 shadow-sm" />
              </div>
            </div>
            <div className="grid flex-1 gap-3 lg:grid-cols-5">
              <div className="flex flex-col gap-3 lg:col-span-2">
                <div className="flex flex-1 flex-col items-center justify-center rounded-xl bg-white p-4 shadow-sm">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Spending</p>
                  <div className="relative h-28 w-28">
                    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="20" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--primary))" strokeWidth="20" strokeDasharray="88 164" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#14b8a6" strokeWidth="20" strokeDasharray="52 200" strokeDashoffset="-88" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#f97316" strokeWidth="20" strokeDasharray="36 216" strokeDashoffset="-140" />
                    </svg>
                  </div>
                  <div className="mt-2 flex flex-wrap justify-center gap-2 text-[10px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-primary" /> Expenses
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-teal-500" /> Income
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-orange-500" /> Other
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex min-h-0 flex-col rounded-xl bg-white p-3 shadow-sm lg:col-span-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Recent activity</span>
                  <span className="text-[10px] text-slate-400">Live sync</span>
                </div>
                <div className="space-y-2 overflow-hidden">
                  {[
                    { label: "Office supplies", amt: "-$42.10", tone: "text-rose-600" },
                    { label: "Client payment", amt: "+$1,200.00", tone: "text-emerald-600" },
                    { label: "Travel · rideshare", amt: "-$28.50", tone: "text-rose-600" },
                    { label: "Software subscription", amt: "-$79.00", tone: "text-rose-600" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                      <span className="truncate font-medium text-slate-700">{row.label}</span>
                      <span className={`shrink-0 font-semibold tabular-nums ${row.tone}`}>{row.amt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WideTablePreview() {
  return (
    <div className="mx-auto max-w-5xl rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur sm:p-6">
      <div className="overflow-x-auto rounded-xl bg-white shadow-xl">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-semibold">Merchant</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 text-right font-semibold">Amount</th>
              <th className="px-4 py-3 text-center font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {[
              ["River Cafe", "Food", "Mar 12", "-$64.20", "Recorded"],
              ["CloudTools Inc.", "Software", "Mar 11", "-$49.00", "Recorded"],
              ["Acme LLC", "Income", "Mar 10", "+$2,450.00", "Recorded"],
              ["Fuel Station 4", "Transport", "Mar 9", "-$52.80", "Recorded"],
            ].map(([m, c, d, a, s]) => (
              <tr key={String(m)} className="hover:bg-slate-50/80">
                <td className="px-4 py-3 font-medium">{m}</td>
                <td className="px-4 py-3 text-slate-600">{c}</td>
                <td className="px-4 py-3 text-slate-500">{d}</td>
                <td
                  className={`px-4 py-3 text-right font-semibold tabular-nums ${String(a).startsWith("+") ? "text-emerald-600" : "text-slate-900"}`}
                >
                  {a}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">{s}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Abstract phone + app panel for alternating sections (original artwork). */
function PhoneAndPanelMock({ variant }: { variant: "capture" | "search" | "export" }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-inner">
      <div className="h-[220px] w-[110px] shrink-0 rounded-[2rem] border-4 border-slate-800 bg-slate-900 shadow-xl">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-700" />
        <div className="mt-3 space-y-2 px-2">
          <div className="h-8 rounded-lg bg-primary/20" />
          <div className="h-6 rounded bg-slate-700/80" />
          <div className="h-6 rounded bg-slate-700/60" />
          {variant === "capture" && <div className="mx-auto mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/30"><i className="fas fa-camera text-primary" /></div>}
          {variant === "search" && (
            <div className="mt-2 space-y-1">
              <div className="h-6 rounded bg-slate-700/40" />
              <div className="h-6 rounded bg-slate-700/40" />
            </div>
          )}
          {variant === "export" && <div className="mt-3 h-10 rounded-lg bg-teal-600/40" />}
        </div>
      </div>
      <div className="min-h-[180px] min-w-[200px] flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex gap-2">
          <div className="h-8 flex-1 rounded-lg bg-slate-100" />
          <div className="h-8 w-8 rounded-lg bg-primary/15" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-3/4 rounded bg-slate-200" />
          <div className="h-3 w-1/2 rounded bg-slate-200" />
          <div className="h-3 w-5/6 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

const featureCards = [
  {
    icon: "fa-receipt",
    title: "Log business & personal expenses",
    body: "Keep lanes clear with workspaces and categories that match how you actually spend.",
  },
  {
    icon: "fa-globe",
    title: "One backend, every device",
    body: "Convex syncs web and mobile so you never wonder which copy is “the truth.”",
    highlight: true,
  },
  {
    icon: "fa-coins",
    title: "See income and outflows together",
    body: "Net balance and savings-rate context for the month—without spreadsheet gymnastics.",
  },
  {
    icon: "fa-file-csv",
    title: "Import CSV & PDF statements",
    body: "Bulk-load history from banks and card exports, then clean up in a proper table.",
  },
  {
    icon: "fa-shield-alt",
    title: "Your deployment, your rules",
    body: "Data lives in your Convex project; optional admin controls when you scale up.",
  },
];

const faqs = [
  {
    q: "Do I need to install software for the web app?",
    a: "No. Receipt Cycle on the web runs in your browser. Use the latest Chrome or Edge for the best experience.",
  },
  {
    q: "Does web data match the mobile app?",
    a: "Yes, when both use the same Convex deployment URL. Your records stay aligned across platforms.",
  },
  {
    q: "Can I import old transactions?",
    a: "Yes. Use the upload flow for CSV or PDF bank exports, then review and clean up on the Transactions page.",
  },
  {
    q: "Is my information secure?",
    a: "Data is stored in your Convex project with industry-standard practices. Use strong passwords and protect your deployment keys.",
  },
  {
    q: "Can I export my data?",
    a: "You can work from the full transaction table on the web for review and reconciliation; export paths depend on your workflow and future product updates.",
  },
];

const testimonials = [
  {
    quote: "The web table view finally feels like real finance software. I reconcile in half the time.",
    name: "Jordan M.",
    role: "Freelance designer",
  },
  {
    quote: "Scan on the phone, fix categories on the laptop. Exactly the split we needed.",
    name: "Priya S.",
    role: "Small business owner",
    featured: true,
  },
  {
    quote: "Statement import saved us from re-entering three years of history.",
    name: "Alex R.",
    role: "Operations lead",
  },
];

const benefitRow = [
  { icon: "fa-chart-line", title: "Financial overview", body: "Month-scoped totals and top categories at a glance." },
  { icon: "fa-paperclip", title: "Attach context", body: "Receipt capture on mobile; review and categorize on the web." },
  { icon: "fa-bell", title: "Stay on top of activity", body: "Recent transactions surface what changed—without noise." },
];

export default function ConvexHome() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      {/* Header — SaaS nav */}
      <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2 font-display text-lg font-bold tracking-tight text-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-teal-600 text-white shadow-md">
              <i className="fas fa-receipt text-sm" />
            </span>
            <span className="hidden sm:inline">Receipt Cycle</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
            <a href="#features" className="transition hover:text-primary">
              Features
            </a>
            <Link to="/pricing" className="transition hover:text-primary">
              Pricing
            </Link>
            <a href="#testimonials" className="transition hover:text-primary">
              Reviews
            </a>
            <a href="#faq" className="transition hover:text-primary">
              FAQ
            </a>
            <a href="#support" className="transition hover:text-primary">
              Support
            </a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/signin?next=/dashboard"
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:inline-block"
            >
              Log in
            </Link>
            <Link
              to="/signup?next=/dashboard"
              className="rounded-lg bg-gradient-to-r from-primary to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — split layout, orange primary CTA */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-white via-white to-slate-50/80">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-14 lg:py-20">
          <div className="order-2 lg:order-1">
            <LandingProductIllustration />
            <p className="mt-3 text-center text-xs text-slate-400">Illustrative UI — not live account data</p>
          </div>
          <div className="order-1 lg:order-2">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">Income & expense tracking</p>
            <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem]">
              Take control of your{" "}
              <span className="bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">finances</span> today
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-600">
              Stop guessing where money went. Receipt Cycle combines receipt capture, a full web dashboard, and imports—built
              for freelancers and small teams who outgrew the spreadsheet.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/signup?next=/dashboard"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-orange-500 px-8 py-3 text-base font-bold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600"
              >
                Start your free trial
              </Link>
              <Link
                to="/signin?next=/upload-statement"
                className="inline-flex items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-5 py-3 text-base font-semibold text-slate-800 transition hover:border-primary/40 hover:text-primary"
              >
                Import a statement
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">No credit card required to explore the web app.</p>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-slate-200 bg-slate-100/80 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-3 px-4 sm:px-6">
          {["Real-time sync", "Workspace-aware", "CSV & PDF import", "Teal-first UI", "Convex-powered"].map((t) => (
            <span
              key={t}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* Problem / solution — ledger table */}
      <section className="border-b border-slate-200 bg-gradient-to-br from-primary to-teal-700 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-100/90">Clarity first</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Stop wondering where your money went</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-emerald-50/95">
            A wide, scannable ledger beats a phone list when you reconcile. Sample rows below—your real data appears after
            sign-in on <span className="font-semibold text-white">/dashboard</span>.
          </p>
          <div className="mt-12">
            <WideTablePreview />
          </div>
        </div>
      </section>

      {/* Feature grid — 5 cards + highlight */}
      <section id="features" className="scroll-mt-20 border-b border-slate-200 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-center text-sm font-semibold uppercase tracking-wider text-primary">Features</p>
          <h2 className="mx-auto mt-2 max-w-3xl text-center font-display text-3xl font-bold text-slate-900 sm:text-4xl">
            See how Receipt Cycle makes income & expense tracking straightforward
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
            Same patterns you expect from modern SaaS—without the bloat. Built for people who live in receipts and bank
            exports.
          </p>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((f) => (
              <div
                key={f.title}
                className={`rounded-2xl border p-6 shadow-sm transition hover:shadow-md ${
                  f.highlight
                    ? "border-primary/40 bg-gradient-to-br from-primary to-teal-700 text-white ring-2 ring-primary/20"
                    : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
                }`}
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
                    f.highlight ? "bg-white/20 text-white" : "bg-white text-primary shadow-sm"
                  }`}
                >
                  <i className={`fas ${f.icon} text-lg`} />
                </div>
                <h3 className={`text-lg font-bold ${f.highlight ? "text-white" : "text-slate-900"}`}>{f.title}</h3>
                <p className={`mt-2 text-sm leading-relaxed ${f.highlight ? "text-emerald-50" : "text-slate-600"}`}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alternating showcases */}
      <section className="border-b border-slate-200 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl space-y-20 px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">See where your money goes—instantly</h2>
              <p className="mt-4 text-slate-600">
                Month-scoped totals, savings rate, and category breakdown mirror what you see in the mobile app—so web and
                phone tell the same story.
              </p>
              <Link
                to="/signup?next=/dashboard"
                className="mt-6 inline-flex rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-orange-600"
              >
                Open the dashboard
              </Link>
            </div>
            <PhoneAndPanelMock variant="search" />
          </div>

          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1">
              <PhoneAndPanelMock variant="capture" />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">Capture on the go, clean up on the web</h2>
              <p className="mt-4 text-slate-600">
                Use the Expo app for camera scanning; use the browser for bulk edits, imports, and a table you can actually
                read.
              </p>
              <Link to="/signup?next=/dashboard" className="mt-6 inline-flex font-semibold text-primary hover:underline">
                Get started →
              </Link>
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">Get your exports when you need them</h2>
              <p className="mt-4 text-slate-600">
                Start from structured data in Convex—review in the web grid, then work with your accountant on your terms.
              </p>
              <Link to="/signin?next=/transactions" className="mt-6 inline-flex rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-orange-600">
                View transactions
              </Link>
            </div>
            <PhoneAndPanelMock variant="export" />
          </div>
        </div>
      </section>

      {/* Statement upload teaser */}
      <section className="border-b border-slate-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">Bring historical data in one upload</h2>
              <p className="mt-3 text-slate-600">
                Move off spreadsheets without retyping years of transactions. Parse, import, then refine in the table view.
              </p>
              <Link to="/signin?next=/upload-statement" className="mt-6 inline-flex font-semibold text-primary hover:underline">
                Try statement upload →
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 font-mono text-xs text-slate-600 shadow-inner">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Sample CSV</div>
              <div className="space-y-1">
                <div>date,amount,category</div>
                <div>2026-03-01,-12.50,Food</div>
                <div>2026-03-03,-19.99,Software</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three benefit cards */}
      <section className="border-b border-slate-200 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center font-display text-2xl font-bold text-slate-900 sm:text-3xl">Keep every account organized</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
            One place to see the picture—without juggling five tools.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {benefitRow.map((b) => (
              <div key={b.title} className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <i className={`fas ${b.icon} text-xl`} />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{b.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain vs solution */}
      <section className="border-b border-slate-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center font-display text-2xl font-bold text-slate-900 sm:text-3xl">Simplify income & expense tracking</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-6">
              <p className="text-sm font-bold uppercase tracking-wide text-rose-700">Without a system</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                <li className="flex gap-2"><span className="text-rose-500">✕</span> Receipts in email, camera roll, and drawers</li>
                <li className="flex gap-2"><span className="text-rose-500">✕</span> Totals that never match between phone and laptop</li>
                <li className="flex gap-2"><span className="text-rose-500">✕</span> Tax season panic over missing categories</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6">
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">With Receipt Cycle</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                <li className="flex gap-2"><span className="text-emerald-600">✓</span> One Convex-backed ledger for web and mobile</li>
                <li className="flex gap-2"><span className="text-emerald-600">✓</span> Workspace-aware lists and imports</li>
                <li className="flex gap-2"><span className="text-emerald-600">✓</span> Room to add admin and governance when you need it</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 text-center">
            <Link
              to="/signup?next=/dashboard"
              className="inline-flex rounded-xl bg-orange-500 px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-orange-600"
            >
              Start free
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 border-b border-slate-200 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">FAQ</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-slate-900">Frequently asked questions</h2>
            <p className="mt-3 text-slate-600">Straight answers so you can evaluate Receipt Cycle with confidence.</p>
          </div>
          <div className="lg:col-span-8">
            <Accordion type="single" collapsible className="rounded-2xl border border-slate-200 bg-white px-2 shadow-sm">
              {faqs.map((item, i) => (
                <AccordionItem key={item.q} value={`item-${i}`} className="border-slate-100 px-4">
                  <AccordionTrigger className="text-left text-base font-semibold text-slate-900 hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-slate-600">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="scroll-mt-20 border-b border-slate-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Reviews</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-slate-900">Proud to support teams who outgrew the notebook</h2>
            <p className="mt-3 text-slate-600">Illustrative quotes to show tone—not paid endorsements.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <blockquote
                key={t.name}
                className={`rounded-2xl border p-6 shadow-sm ${
                  t.featured ? "border-primary/40 bg-gradient-to-br from-primary to-teal-700 text-white" : "border-slate-200 bg-slate-50/80"
                }`}
              >
                <div className="mb-3 flex gap-0.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <i key={s} className="fas fa-star text-sm" />
                  ))}
                </div>
                <p className={`text-sm leading-relaxed ${t.featured ? "text-emerald-50" : "text-slate-600"}`}>{t.quote}</p>
                <footer className={`mt-4 flex items-center gap-3 border-t pt-4 ${t.featured ? "border-white/20" : "border-slate-200"}`}>
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      t.featured ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                    }`}
                  >
                    {t.name[0]}
                  </span>
                  <div>
                    <span className={`text-sm font-semibold ${t.featured ? "text-white" : "text-slate-900"}`}>{t.name}</span>
                    <span className={`mt-0.5 block text-xs ${t.featured ? "text-emerald-100" : "text-slate-500"}`}>{t.role}</span>
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA — teal band */}
      <section className="bg-gradient-to-r from-primary via-teal-600 to-teal-700 py-16 text-white sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 lg:flex-row lg:justify-between lg:gap-12 lg:px-6">
          <div className="max-w-xl flex-1 text-center lg:text-left">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Automate the busywork and free up your time</h2>
            <p className="mt-4 text-lg text-emerald-50/95">
              Landing page explains the product—<span className="font-semibold text-white">/dashboard</span> is where your live
              data lives after sign-in.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link
                to="/signup?next=/dashboard"
                className="inline-flex rounded-xl bg-orange-500 px-8 py-3.5 font-bold text-white shadow-lg hover:bg-orange-600"
              >
                Start for free
              </Link>
              <Link to="/pricing" className="inline-flex rounded-xl border-2 border-white/40 px-8 py-3.5 font-semibold text-white hover:bg-white/10">
                View pricing
              </Link>
            </div>
          </div>
          <div className="w-full max-w-md shrink-0">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <div className="aspect-[16/10] rounded-lg bg-slate-900/40 p-3 shadow-inner">
                <div className="flex h-full flex-col gap-2 rounded-md bg-slate-800/80 p-3">
                  <div className="h-2 w-1/3 rounded bg-slate-600" />
                  <div className="flex flex-1 gap-2">
                    <div className="w-1/3 rounded bg-primary/30" />
                    <div className="flex-1 space-y-1">
                      <div className="h-2 rounded bg-slate-600" />
                      <div className="h-2 w-5/6 rounded bg-slate-600" />
                      <div className="h-2 w-2/3 rounded bg-slate-600" />
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-center text-xs text-emerald-100/80">Abstract preview — not financial advice</p>
            </div>
          </div>
        </div>
      </section>

      {/* Support anchor (footer links) */}
      <div id="support" className="scroll-mt-20" />

      {/* Dark footer */}
      <footer className="bg-slate-900 text-slate-400">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 font-display font-bold text-white">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
                  <i className="fas fa-receipt text-sm" />
                </span>
                Receipt Cycle
              </div>
              <p className="mt-4 text-sm leading-relaxed">
                Receipt capture, web dashboard, and imports—one backend. <span className="text-slate-500">/</span> is this
                marketing site; <span className="text-slate-300">/dashboard</span> is the signed-in app.
              </p>
              <div className="mt-5 flex gap-4 text-lg">
                <span className="cursor-default text-slate-500 hover:text-slate-300" aria-hidden>
                  <i className="fab fa-twitter" />
                </span>
                <span className="cursor-default text-slate-500 hover:text-slate-300" aria-hidden>
                  <i className="fab fa-linkedin" />
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Product</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link to="/signin?next=/dashboard" className="text-slate-300 hover:text-white">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/signin?next=/transactions" className="text-slate-300 hover:text-white">
                    Transactions
                  </Link>
                </li>
                <li>
                  <Link to="/signin?next=/upload-statement" className="text-slate-300 hover:text-white">
                    Upload statement
                  </Link>
                </li>
                <li>
                  <Link to="/signin?next=/settings" className="text-slate-300 hover:text-white">
                    Settings
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Company</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link to="/pricing" className="text-slate-300 hover:text-white">
                    Pricing
                  </Link>
                </li>
                <li>
                  <a href="#faq" className="text-slate-300 hover:text-white">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#testimonials" className="text-slate-300 hover:text-white">
                    Reviews
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Mobile</h3>
              <p className="mt-4 text-sm leading-relaxed">
                Use the Expo app for camera scanning. Web is best for review, import, and admin.
              </p>
              <div className="mt-4 flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-slate-600 bg-slate-800/50 text-[10px] text-slate-500">
                App QR placeholder
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-8 text-xs">
            <span>© {new Date().getFullYear()} Receipt Cycle. All rights reserved.</span>
            <span className="max-w-md text-slate-500">
              Layout inspired by common long-form SaaS landings. Not affiliated with third-party brands or competitor sites.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
