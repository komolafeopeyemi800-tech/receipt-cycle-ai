import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ReceiptCycleLogo } from "@/components/brand/ReceiptCycleLogo";
import { INSTAGRAM_URL, PLAY_STORE_URL, SUPPORT_EMAIL, TWITTER_URL } from "@/content/site";
import { cn } from "@/lib/utils";

export function LandingPrimaryCta({
  children,
  className,
  inverse = false,
  to = "/signup",
}: {
  children: ReactNode;
  className?: string;
  inverse?: boolean;
  to?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold shadow-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2",
        inverse
          ? "bg-white text-teal-900 hover:bg-teal-50"
          : "bg-gradient-to-r from-teal-700 to-teal-600 text-white hover:-translate-y-0.5 hover:shadow-lg",
        className,
      )}
    >
      {children}
      <i className="fas fa-arrow-right text-xs" aria-hidden />
    </Link>
  );
}

const productGroups = [
  {
    title: "Get paid",
    links: [
      ["Invoices", "/invoice-software/", "Prepare and follow up on customer invoices"],
      ["Estimates", "/estimate-quotation-software/", "Price work before it begins"],
      ["Payments", "/payment-tracking-software/", "Record what was paid and what remains"],
      ["Clients", "/client-management-software/", "Keep customer activity together"],
    ],
  },
  {
    title: "Manage spending",
    links: [
      ["Receipt capture", "/ai-receipt-scanner/", "Turn receipt images into usable records"],
      ["Travel expenses", "/business-travel-expense-tracker/", "Organize the cost of every trip"],
      ["Budgets", "/business-budgeting-software/", "Compare planned and actual spending"],
    ],
  },
  {
    title: "Plan and review",
    links: [
      ["Reports", "/expense-reporting-software/", "Review business activity by period and category"],
      ["Ask AI", "/ai-financial-assistant/", "Explore questions using saved records"],
      ["Tax records", "/freelancer-tax-receipt-tracker/", "Prepare organized records for review"],
    ],
  },
] as const;

const audienceLinks = [
  ["Freelancers", "/freelancer-tax-receipt-tracker/", "Keep receipts and work records ready"],
  ["Consultants", "/estimate-quotation-software/", "Move priced work toward billing"],
  ["Small businesses", "/business-budgeting-software/", "Coordinate everyday spending decisions"],
  ["Operations teams", "/expense-reporting-software/", "Turn activity into reviewable reports"],
] as const;

const resourceLinks = [
  ["Blog", "/blog", "Practical guides for better records"],
  ["Frequently asked questions", "/faq", "Product and account answers"],
  ["About Receipt Cycle", "/about", "Why we are building the workspace"],
] as const;

export function CommercialHeader({ ctaLabel, ctaHref, announcement }: { ctaLabel: string; ctaHref: string; announcement?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  const dropdownButton = (label: string) => (
    <button
      type="button"
      onClick={() => setOpenMenu((current) => current === label ? null : label)}
      className="inline-flex items-center gap-2 py-6 text-sm font-bold text-slate-700 transition hover:text-teal-700"
      aria-expanded={openMenu === label}
    >
      {label}<i className={`fas fa-chevron-down text-[10px] transition ${openMenu === label ? "rotate-180" : ""}`} aria-hidden />
    </button>
  );

  return (
    <header ref={headerRef} className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      {announcement ? (
        <div className="bg-teal-950 px-4 py-2 text-center text-[11px] font-bold tracking-wide text-teal-50 sm:text-xs">
          {announcement}
        </div>
      ) : null}
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <ReceiptCycleLogo size={38} />

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
          {dropdownButton("Products")}
          {dropdownButton("Who It’s For")}
          {dropdownButton("Resources")}
          <Link to="/pricing" className="text-sm font-bold text-slate-700 transition hover:text-teal-700">
            Pricing
          </Link>
          <Link to="/contact" className="text-sm font-bold text-slate-700 transition hover:text-teal-700">
            Contact Us
          </Link>
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-extrabold text-white transition hover:bg-slate-800 xl:inline-flex"
            aria-label="Get Receipt Cycle on Google Play"
          >
            <i className="fab fa-google-play text-lg" aria-hidden />
            <span>Google Play</span>
          </a>
          <Link
            to="/signin"
            className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          >
            Sign in
          </Link>
          <LandingPrimaryCta to={ctaHref} className="min-h-11 px-5 py-2.5">{ctaLabel}</LandingPrimaryCta>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="commercial-mobile-nav"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        >
          <i className={`fas ${menuOpen ? "fa-xmark" : "fa-bars"}`} aria-hidden />
        </button>
      </div>

      {openMenu === "Products" ? (
        <div className="absolute inset-x-0 top-full hidden px-6 pt-4 lg:block">
          <div className="mx-auto grid max-w-6xl grid-cols-[1fr_1fr_1fr_320px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="col-span-3 grid grid-cols-3 gap-8 px-9 py-10">
              {productGroups.map((group) => <MenuGroup key={group.title} title={group.title} links={group.links} close={() => setOpenMenu(null)} />)}
            </div>
            <div className="bg-sky-50 p-6">
              <img src="/landing/home/home-hero-founder.webp" alt="A small business owner using Receipt Cycle" className="h-32 w-full rounded-xl object-cover" />
              <p className="mt-5 text-xl font-black text-slate-900">Turn a receipt into a usable record</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Capture the image, review the extracted details, and keep the evidence attached.</p>
              <Link to="/ai-receipt-scanner/" onClick={() => setOpenMenu(null)} className="mt-5 inline-flex w-full items-center justify-center border-2 border-slate-900 px-4 py-3 text-sm font-black text-slate-900 hover:bg-white">Explore receipt scanning</Link>
            </div>
          </div>
        </div>
      ) : null}
      {openMenu === "Who It’s For" ? (
        <div className="absolute inset-x-0 top-full hidden px-6 pt-4 lg:block">
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            {audienceLinks.map(([label, href, description]) => <MenuLink key={href} label={label} href={href} description={description} close={() => setOpenMenu(null)} />)}
          </div>
        </div>
      ) : null}
      {openMenu === "Resources" ? (
        <div className="absolute inset-x-0 top-full hidden px-6 pt-4 lg:block">
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            {resourceLinks.map(([label, href, description]) => <MenuLink key={href} label={label} href={href} description={description} close={() => setOpenMenu(null)} />)}
          </div>
        </div>
      ) : null}

      {menuOpen ? (
        <nav id="commercial-mobile-nav" className="max-h-[calc(100vh-72px)] overflow-y-auto border-t border-slate-100 bg-white px-4 py-4 lg:hidden" aria-label="Mobile navigation">
          <div className="mx-auto flex max-w-7xl flex-col gap-4">
            {productGroups.map((group) => (
              <div key={group.title}>
                <p className="px-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400">{group.title}</p>
                {group.links.map((link) => { const [label, href] = link as readonly string[]; return <Link key={href} to={href} onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">{label}</Link>; })}
              </div>
            ))}
            <div className="border-t border-slate-100 pt-3">
              <p className="px-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400">Company</p>
              <Link to="/blog" className="block rounded-lg px-3 py-2 text-sm font-bold text-slate-700">Resources</Link>
              <Link to="/pricing" className="block rounded-lg px-3 py-2 text-sm font-bold text-slate-700">Pricing</Link>
              <Link to="/contact" className="block rounded-lg px-3 py-2 text-sm font-bold text-slate-700">Contact Us</Link>
            </div>
            <Link to="/signin" className="rounded-lg px-3 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Sign in
            </Link>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-slate-950 px-5 text-sm font-extrabold text-white"
            >
              <i className="fab fa-google-play text-xl" aria-hidden />
              Get it on Google Play
            </a>
            <LandingPrimaryCta to={ctaHref} className="mt-2 w-full">{ctaLabel}</LandingPrimaryCta>
          </div>
        </nav>
      ) : null}
    </header>
  );
}

function MenuLink({ label, href, description, close }: { label: string; href: string; description: string; close: () => void }) {
  return <Link to={href} onClick={close} className="group rounded-lg p-3 transition hover:bg-teal-50"><span className="block text-sm font-bold text-blue-700 group-hover:text-teal-800">{label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span></Link>;
}

function MenuGroup({ title, links, close }: { title: string; links: ReadonlyArray<readonly [string, string, string]>; close: () => void }) {
  return <div><p className="mb-3 text-base font-black text-slate-900">{title}</p><div className="space-y-1">{links.map(([label, href]) => <Link key={href} to={href} onClick={close} className="block py-1.5 text-sm font-semibold text-blue-700 hover:text-teal-700">{label}</Link>)}</div></div>;
}

export function CommercialFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white py-14 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <ReceiptCycleLogo />
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
              Keep receipts, expenses, invoices, payments, budgets, and reports connected in one practical finance workspace.
            </p>
            <div className="mt-5 flex gap-2">
              <a
                href={TWITTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-teal-700 hover:text-white"
                aria-label="Receipt Cycle on X"
              >
                <i className="fab fa-x-twitter" aria-hidden />
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-teal-700 hover:text-white"
                aria-label="Receipt Cycle on Instagram"
              >
                <i className="fab fa-instagram" aria-hidden />
              </a>
            </div>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-3 rounded-xl bg-slate-950 px-4 py-2.5 text-white transition hover:bg-slate-800"
              aria-label="Download Receipt Cycle from Google Play"
            >
              <i className="fab fa-google-play text-2xl" aria-hidden />
              <span className="text-left leading-none">
                <span className="block text-[9px] font-semibold uppercase tracking-wider text-slate-300">Get it on</span>
                <span className="mt-1 block text-base font-extrabold">Google Play</span>
              </span>
            </a>
          </div>

          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">Product</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li><Link to="/ai-receipt-scanner/" className="hover:text-teal-700">AI receipt scanner</Link></li>
              <li><Link to="/business-travel-expense-tracker/" className="hover:text-teal-700">Travel expense tracker</Link></li>
              <li><Link to="/freelancer-tax-receipt-tracker/" className="hover:text-teal-700">Freelancer tax tracker</Link></li>
              <li><Link to="/business-budgeting-software/" className="hover:text-teal-700">Business budgeting</Link></li>
              <li><Link to="/client-management-software/" className="hover:text-teal-700">Client management</Link></li>
              <li><Link to="/expense-reporting-software/" className="hover:text-teal-700">Expense reporting</Link></li>
              <li><Link to="/ai-financial-assistant/" className="hover:text-teal-700">AI financial assistant</Link></li>
              <li><Link to="/invoice-software/" className="hover:text-teal-700">Invoice software</Link></li>
              <li><Link to="/estimate-quotation-software/" className="hover:text-teal-700">Estimate software</Link></li>
              <li><Link to="/payment-tracking-software/" className="hover:text-teal-700">Payment tracking</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">Resources</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li><Link to="/blog" className="hover:text-teal-700">Blog</Link></li>
              <li><Link to="/faq" className="hover:text-teal-700">FAQ</Link></li>
              <li><Link to="/about" className="hover:text-teal-700">About</Link></li>
              <li><Link to="/contact" className="hover:text-teal-700">Contact</Link></li>
              <li><Link to="/pricing" className="hover:text-teal-700">Pricing</Link></li>
              <li><Link to="/signin" className="hover:text-teal-700">Sign in</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">Legal</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li><Link to="/privacy" className="hover:text-teal-700">Privacy policy</Link></li>
              <li><Link to="/terms" className="hover:text-teal-700">Terms of service</Link></li>
              <li><Link to="/refund-policy" className="hover:text-teal-700">Refund policy</Link></li>
              <li><a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-teal-700">{SUPPORT_EMAIL}</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Receipt Cycle. All rights reserved.</p>
          <p>Built for clear records and calmer follow-up.</p>
        </div>
      </div>
    </footer>
  );
}

export function CommercialLandingLayout({
  children,
  ctaLabel = "Create an account",
  ctaHref = "/signup",
  announcement,
}: {
  children: ReactNode;
  ctaLabel?: string;
  ctaHref?: string;
  announcement?: string;
}) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <CommercialHeader ctaLabel={ctaLabel} ctaHref={ctaHref} announcement={announcement} />
      <main>{children}</main>
      <CommercialFooter />
    </div>
  );
}
