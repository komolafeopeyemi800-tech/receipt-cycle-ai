import { CommercialFooter, CommercialHeader } from "@/components/marketing/CommercialLandingLayout";

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
      <CommercialHeader ctaLabel="Start free" ctaHref="/signup" />
      <main className="bg-slate-50 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <div className="border border-slate-200 bg-white p-7 shadow-sm sm:p-12">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Legal and policy information</p>
        <h1 className="mt-3 font-display text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-slate-500">Last updated: {updated}</p>
        <div className="prose prose-slate mt-10 max-w-none prose-headings:font-display prose-headings:font-black prose-a:text-teal-700 hover:prose-a:text-teal-800">
          {children}
        </div>
        </div>
        </div>
      </main>
      <CommercialFooter />
    </div>
  );
}
