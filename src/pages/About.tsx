import { Link } from "react-router-dom";
import { ReceiptCycleLogo } from "@/components/brand/ReceiptCycleLogo";
import { Seo } from "@/components/Seo";
import { getRouteSeo } from "@/content/routesSeo";

const primary = "#0f766e";

const PRINCIPLES = [
  {
    h: "Capture before classification",
    p: "Every tool that fails at bookkeeping fails because capture is too slow. Our first job is to get a usable record of a transaction in under ten seconds. Everything else — categorization, reporting, insights — only matters if the capture happens.",
  },
  {
    h: "Structured data beats prettier charts",
    p: "A dashboard that looks great but stores ambiguous data is useless at tax time. We preserve merchant, date, amount, payment method, currency, and line items as structured fields an accountant or an auditor can read.",
  },
  {
    h: "Your ledger is yours",
    p: "You can export everything as CSV at any time. No lock-in, no proprietary format, no fees for leaving. The app has to earn the monthly subscription every month.",
  },
  {
    h: "AI where it removes work, not where it adds noise",
    p: "We use AI to draft transactions from a spoken sentence, to classify receipts, to flag money leaks in plain language, and to answer questions grounded in your real spending. We don't use AI to auto-generate charts nobody asked for.",
  },
];

export default function About() {
  const seo = getRouteSeo("/about");
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {seo ? (
        <Seo
          title={seo.title}
          description={seo.description}
          path="/about"
          structuredData={seo.structuredData}
        />
      ) : null}

      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <ReceiptCycleLogo size={32} />
          <Link to="/" className="text-sm font-medium text-slate-600 hover:text-teal-700">
            ← Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: primary }}>
          About Receipt Cycle
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Bookkeeping that respects your time.
        </h1>
        <p className="mt-6 text-lg text-slate-600">
          Receipt Cycle is an AI-powered receipt scanner and expense tracker built for freelancers,
          independent professionals, and small teams. We started it because the tools we used at
          previous jobs all had the same flaw: capture was harder than ignoring the problem.
        </p>

        <section className="mt-14">
          <h2 className="font-display text-2xl font-bold text-slate-900">Why we exist</h2>
          <p className="mt-4 text-slate-600">
            At tax time, the people who actually get their deductions are the ones who captured
            the proof in the moment. Everybody else spends a weekend in archaeology mode —
            digging through email, squinting at faded thermal paper, and mentally reconstructing
            where they were on the third Tuesday of March. We built Receipt Cycle so the answer
            to “do I have the receipt for that?” is always yes.
          </p>
          <p className="mt-4 text-slate-600">
            Our promise is narrow on purpose. We don't do payroll, invoicing, or inventory. We do
            the boring core — capture, categorize, reconcile, export — extremely well, so the rest
            of your stack gets clean data.
          </p>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-2xl font-bold text-slate-900">Who it's for</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              { t: "Freelancers and contractors", d: "One person, many clients, very little patience for spreadsheets." },
              { t: "Independent professionals", d: "Lawyers, designers, photographers, consultants — people whose income depends on billable time, not bookkeeping." },
              { t: "Small business owners", d: "1–10 person teams who want one place for everyone's receipts without full accounting software." },
              { t: "Anyone who travels for work", d: "Multi-currency aware, built for receipts in every language and tax regime we can support." },
            ].map((a) => (
              <div key={a.t} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-slate-900">{a.t}</h3>
                <p className="mt-1 text-sm text-slate-600">{a.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-2xl font-bold text-slate-900">How we build</h2>
          <div className="mt-6 space-y-6">
            {PRINCIPLES.map((p) => (
              <div key={p.h} className="rounded-2xl border-l-4 border-teal-600 bg-slate-50 p-5">
                <h3 className="font-display text-lg font-bold text-slate-900">{p.h}</h3>
                <p className="mt-2 text-slate-600">{p.p}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-2xl font-bold text-slate-900">Where we are</h2>
          <p className="mt-4 text-slate-600">
            We're a small, independent team. We ship the mobile app on iOS and Android, the web
            dashboard at{" "}
            <Link to="/dashboard" className="font-semibold text-teal-700 hover:underline">
              receiptcycle.com/dashboard
            </Link>
            , and a real human reads every support email at{" "}
            <a href="mailto:support@receiptcycle.com" className="font-semibold text-teal-700 hover:underline">
              support@receiptcycle.com
            </a>
            . We reply within one business day.
          </p>
        </section>

        <section className="mt-14 rounded-2xl border border-slate-200 bg-gradient-to-br from-teal-50 to-white p-6 sm:p-8">
          <h2 className="font-display text-2xl font-bold text-slate-900">Try it free</h2>
          <p className="mt-3 text-slate-600">
            The free plan covers basic scanning and tracking — no credit card required. Upgrade
            to Pro when you need the AI finance coach, bank imports, and money-leak alerts.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-teal-700 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
            >
              Create free account
            </Link>
            <Link
              to="/pricing"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              See pricing
            </Link>
            <Link
              to="/blog"
              className="inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
            >
              Read the blog →
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 py-10">
        <div className="mx-auto max-w-4xl px-4 text-center text-sm text-slate-500 sm:px-6">
          <Link to="/" className="hover:underline" style={{ color: primary }}>Home</Link>
          <span className="mx-2">·</span>
          <Link to="/blog" className="hover:underline" style={{ color: primary }}>Blog</Link>
          <span className="mx-2">·</span>
          <Link to="/pricing" className="hover:underline" style={{ color: primary }}>Pricing</Link>
          <span className="mx-2">·</span>
          <Link to="/faq" className="hover:underline" style={{ color: primary }}>FAQ</Link>
          <span className="mx-2">·</span>
          <Link to="/privacy" className="hover:underline" style={{ color: primary }}>Privacy</Link>
          <span className="mx-2">·</span>
          <Link to="/terms" className="hover:underline" style={{ color: primary }}>Terms</Link>
          <span className="mx-2">·</span>
          <Link to="/contact" className="hover:underline" style={{ color: primary }}>Contact</Link>
        </div>
      </footer>
    </div>
  );
}
