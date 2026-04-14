import { Link } from "react-router-dom";
import { ReceiptCycleLogo } from "@/components/brand/ReceiptCycleLogo";

const primary = "#0f766e";

export function LegalLayout({
  title,
  children,
  updated = "April 9, 2026",
}: {
  title: string;
  children: React.ReactNode;
  updated?: string;
}) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <ReceiptCycleLogo size={32} />
          <Link to="/" className="text-sm font-medium text-slate-600 hover:text-teal-700">
            ← Home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Last updated: {updated}</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
        <div className="prose prose-slate mt-8 max-w-none prose-headings:font-display prose-a:text-teal-700 hover:prose-a:text-teal-800">
          {children}
        </div>
      </main>
      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto max-w-3xl px-4 text-center text-sm text-slate-500 sm:px-6">
          <Link to="/privacy" className="hover:underline" style={{ color: primary }}>
            Privacy
          </Link>
          <span className="mx-2">·</span>
          <Link to="/terms" className="hover:underline" style={{ color: primary }}>
            Terms
          </Link>
          <span className="mx-2">·</span>
          <Link to="/refund-policy" className="hover:underline" style={{ color: primary }}>
            Refund Policy
          </Link>
          <span className="mx-2">·</span>
          <Link to="/contact" className="hover:underline" style={{ color: primary }}>
            Contact
          </Link>
        </div>
      </footer>
    </div>
  );
}
