import type { ReactNode } from "react";
import { Link } from "react-router-dom";

const BENEFITS: [string, string][] = [
  ["fa-camera", "Scan any receipt in seconds with AI"],
  ["fa-file-import", "Import bank statements and spreadsheets in bulk"],
  ["fa-chart-pie", "See where your money goes, and catch leaks early"],
  ["fa-mobile-screen", "One account on the web and the mobile app"],
];

type Props = { title: string; subtitle: string; children: ReactNode };

/** Shared look for sign in, sign up and password pages: brand panel on large screens, clean card everywhere. */
export function AuthLayout({ title, subtitle, children }: Props) {
  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-teal-800 via-teal-700 to-emerald-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" aria-hidden />
        <Link to="/" className="relative flex items-center gap-2.5 text-lg font-bold">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/30">
            <i className="fas fa-receipt" />
          </span>
          Receipt Cycle
        </Link>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">Know where every naira, dollar and pound goes.</h2>
          <ul className="mt-8 space-y-4">
            {BENEFITS.map(([icon, text]) => (
              <li key={text} className="flex items-center gap-3 text-teal-50">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <i className={`fas ${icon} text-sm`} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-teal-100/80">Your data is private to you. Sign in with Google or a one-time email code, no password to remember.</p>
      </aside>

      <main className="flex flex-col px-5 py-6 sm:px-8">
        <Link to="/" className="flex items-center gap-2 font-bold text-slate-900 lg:hidden">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-teal-600 text-white shadow-sm">
            <i className="fas fa-receipt text-sm" />
          </span>
          Receipt Cycle
        </Link>
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-[420px]">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{subtitle}</p>
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">{children}</div>
            <p className="mt-6 text-center text-xs text-slate-500">
              By continuing you agree to our{" "}
              <Link to="/terms" className="font-semibold text-slate-700 hover:underline">Terms</Link> and{" "}
              <Link to="/privacy" className="font-semibold text-slate-700 hover:underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
