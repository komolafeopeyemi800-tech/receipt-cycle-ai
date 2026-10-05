import { useState } from "react";
import { Link } from "react-router-dom";
import { CommercialLandingLayout, LandingPrimaryCta } from "@/components/marketing/CommercialLandingLayout";
import { Seo } from "@/components/Seo";
import { getRouteSeo } from "@/content/routesSeo";

const primaryCta = "/signup?intent=invoice";

const statusTone: Record<string, string> = {
  Sent: "bg-blue-50 text-blue-700 ring-blue-200",
  Paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Overdue: "bg-rose-50 text-rose-700 ring-rose-200",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold ring-1 ${statusTone[status]}`}>
      {status}
    </span>
  );
}

function InvoicePaper({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`bg-white text-slate-800 shadow-xl ring-1 ring-slate-200 ${compact ? "rounded-xl p-4" : "rounded-2xl p-5 sm:p-7"}`}>
      <div className="flex items-start justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white">
            <i className="fas fa-receipt text-sm" aria-hidden />
          </div>
          <div>
            <p className="text-xs font-black text-slate-950">Northstar Studio</p>
            <p className="mt-0.5 text-[8px] text-slate-400">Design and digital services</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-black tracking-wide text-teal-800 sm:text-base">INVOICE</p>
          <p className="text-[9px] font-bold text-slate-500">INV-0042</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 py-4 text-[9px]">
        <div>
          <p className="font-bold uppercase tracking-wider text-slate-400">Bill to</p>
          <p className="mt-1 font-extrabold text-slate-800">Harbor &amp; Co.</p>
          {!compact ? <p className="mt-0.5 text-slate-400">accounts@harbor.example</p> : null}
        </div>
        <div className="text-right leading-4 text-slate-500">
          <p>Issued Sep 18, 2026</p>
          <p>Due Oct 18, 2026</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-100">
        <div className="grid grid-cols-[1fr_40px_70px] bg-slate-50 px-3 py-2 text-[8px] font-bold uppercase tracking-wider text-slate-400">
          <span>Service</span><span>Qty</span><span className="text-right">Amount</span>
        </div>
        <div className="grid grid-cols-[1fr_40px_70px] items-center px-3 py-2.5 text-[9px]">
          <div><p className="font-bold">Brand sprint</p>{!compact ? <p className="text-[8px] text-slate-400">Strategy and visual direction</p> : null}</div>
          <span>1</span><span className="text-right font-bold">$1,800</span>
        </div>
        <div className="grid grid-cols-[1fr_40px_70px] items-center border-t border-slate-100 px-3 py-2.5 text-[9px]">
          <div><p className="font-bold">Content setup</p>{!compact ? <p className="text-[8px] text-slate-400">Six service pages</p> : null}</div>
          <span>6</span><span className="text-right font-bold">$900</span>
        </div>
      </div>

      <div className="ml-auto mt-4 w-40 space-y-1.5 text-[9px] text-slate-500">
        <div className="flex justify-between"><span>Subtotal</span><strong className="text-slate-700">$2,700.00</strong></div>
        {!compact ? <div className="flex justify-between"><span>Discount 5%</span><strong className="text-emerald-700">-$135.00</strong></div> : null}
        {!compact ? <div className="flex justify-between"><span>Tax 8%</span><strong className="text-slate-700">$205.20</strong></div> : null}
        <div className="flex justify-between border-t border-slate-200 pt-2 text-xs font-black text-teal-800">
          <span>Total</span><span>$2,770.20</span>
        </div>
      </div>
    </div>
  );
}

function InvoiceWorkspacePreview() {
  const invoices = [
    { number: "INV-0042", customer: "Harbor & Co.", status: "Sent", total: "$2,770.20" },
    { number: "INV-0041", customer: "Marlow Creative", status: "Paid", total: "$1,200.00" },
    { number: "INV-0040", customer: "Fieldwork Labs", status: "Overdue", total: "$3,180.00" },
  ];

  return (
    <div className="relative mx-auto max-w-2xl" role="img" aria-label="Sample Receipt Cycle invoice workspace with invoice statuses and an invoice preview">
      <div className="overflow-hidden rounded-[26px] border border-white/70 bg-white shadow-[0_28px_90px_rgba(15,118,110,0.22)] ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-4 py-3">
          <div className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-300" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-300" /></div>
          <span className="rounded-full bg-white px-3 py-1 text-[9px] font-bold text-slate-500 ring-1 ring-slate-200">Sample workspace</span>
        </div>
        <div className="grid min-h-[390px] grid-cols-[68px_1fr] sm:grid-cols-[118px_1fr]">
          <div className="bg-slate-950 p-3 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600"><i className="fas fa-receipt text-sm" aria-hidden /></div>
            <div className="mt-8 space-y-2 text-[9px] text-slate-400">
              <div className="rounded-lg px-2 py-2"><i className="fas fa-chart-pie sm:mr-2" aria-hidden /><span className="hidden sm:inline">Overview</span></div>
              <div className="rounded-lg bg-white/10 px-2 py-2 font-bold text-white"><i className="fas fa-file-invoice sm:mr-2" aria-hidden /><span className="hidden sm:inline">Invoices</span></div>
              <div className="rounded-lg px-2 py-2"><i className="fas fa-users sm:mr-2" aria-hidden /><span className="hidden sm:inline">Customers</span></div>
              <div className="rounded-lg px-2 py-2"><i className="fas fa-chart-column sm:mr-2" aria-hidden /><span className="hidden sm:inline">Reports</span></div>
            </div>
          </div>
          <div className="min-w-0 bg-[#f8fbfa] p-3 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-[9px] font-bold uppercase tracking-wider text-teal-700">Sales documents</p><p className="mt-1 text-base font-black text-slate-950">Invoices</p></div>
              <span className="rounded-lg bg-teal-700 px-3 py-2 text-[9px] font-bold text-white">+ Create invoice</span>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="grid grid-cols-[1fr_1fr_65px] bg-slate-50 px-3 py-2 text-[8px] font-bold uppercase text-slate-400 sm:grid-cols-[80px_1fr_75px_80px]">
                <span>Invoice</span><span>Customer</span><span className="hidden sm:block">Status</span><span className="text-right">Total</span>
              </div>
              {invoices.map((invoice) => (
                <div key={invoice.number} className="grid grid-cols-[1fr_1fr_65px] items-center border-t border-slate-100 px-3 py-3 text-[9px] sm:grid-cols-[80px_1fr_75px_80px]">
                  <span className="font-extrabold text-slate-800">{invoice.number}</span>
                  <span className="truncate text-slate-500">{invoice.customer}</span>
                  <span className="hidden sm:block"><StatusPill status={invoice.status} /></span>
                  <span className="text-right font-bold text-slate-800">{invoice.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-10 -right-3 w-[56%] min-w-[215px] rotate-1 sm:-right-8 sm:w-[52%]">
        <InvoicePaper compact />
      </div>
    </div>
  );
}

function BuilderPreview() {
  const steps = ["Customer", "Items", "Totals", "Review"];
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl sm:p-6" role="img" aria-label="Sample four-step Receipt Cycle invoice builder">
      <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-teal-700">Invoice builder</p><p className="mt-1 text-lg font-black">Create invoice</p></div><span className="text-xs font-bold text-slate-400">INV-0043</span></div>
      <div className="mt-6 flex items-start">
        {steps.map((step, index) => (
          <div key={step} className="flex flex-1 items-start">
            <div className="flex flex-col items-center">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${index < 2 ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-400"}`}>{index === 0 ? <i className="fas fa-check" aria-hidden /> : index + 1}</span>
              <span className={`mt-1 text-[8px] font-bold ${index === 1 ? "text-teal-700" : "text-slate-400"}`}>{step}</span>
            </div>
            {index < steps.length - 1 ? <span className={`mt-4 h-px flex-1 ${index === 0 ? "bg-teal-600" : "bg-slate-200"}`} /> : null}
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 p-4"><div><p className="text-sm font-extrabold">Items &amp; services</p><p className="text-xs text-slate-400">Build from your saved catalog or add a new line</p></div><span className="rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-teal-700">Add from catalog</span></div>
        {[{ name: "Brand sprint", quantity: "1", rate: "$1,800" }, { name: "Content setup", quantity: "6", rate: "$150" }].map((item) => (
          <div key={item.name} className="grid grid-cols-[1fr_42px_70px] items-center gap-2 border-b border-slate-100 p-4 text-xs last:border-0">
            <div><p className="font-bold text-slate-800">{item.name}</p><p className="mt-1 text-[10px] text-slate-400">Service line item</p></div><span className="rounded-lg bg-slate-50 p-2 text-center">{item.quantity}</span><span className="rounded-lg bg-slate-50 p-2 text-right font-bold">{item.rate}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between"><span className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">Back</span><span className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white">Continue</span></div>
    </div>
  );
}

function PaymentStatusPreview() {
  const invoices = [
    ["INV-0042", "Harbor & Co.", "Sent", "$1,170.20"],
    ["INV-0041", "Marlow Creative", "Paid", "$0.00"],
    ["INV-0040", "Fieldwork Labs", "Overdue", "$2,180.00"],
  ];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl sm:p-6" role="img" aria-label="Sample Receipt Cycle invoice status and balance view">
      <div className="grid gap-3 sm:grid-cols-3">
        {[["Total", "$2,770.20", "fa-file-invoice-dollar"], ["Paid", "$1,600.00", "fa-circle-check"], ["Balance", "$1,170.20", "fa-clock"]].map(([label, value, icon]) => (
          <div key={label} className="rounded-2xl bg-slate-50 p-4"><i className={`fas ${icon} text-teal-700`} aria-hidden /><p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-lg font-black text-slate-900">{value}</p></div>
        ))}
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
        <div className="grid grid-cols-[80px_1fr_72px] bg-slate-50 p-3 text-[9px] font-bold uppercase text-slate-400 sm:grid-cols-[90px_1fr_80px_90px]"><span>Invoice</span><span>Customer</span><span className="hidden sm:block">Status</span><span className="text-right">Balance</span></div>
        {invoices.map(([number, customer, status, balance]) => (
          <div key={number} className="grid grid-cols-[80px_1fr_72px] items-center border-t border-slate-100 p-3 text-[10px] sm:grid-cols-[90px_1fr_80px_90px]"><strong>{number}</strong><span className="truncate text-slate-500">{customer}</span><span className="hidden sm:block"><StatusPill status={status} /></span><strong className="text-right">{balance}</strong></div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-900"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><i className="fas fa-receipt" aria-hidden /></span><div><p className="text-xs font-extrabold">Payment recorded</p><p className="mt-0.5 text-[10px] text-emerald-700">Receipt RCPT-0020 is ready to print or share.</p></div></div>
    </div>
  );
}

const faqItems = [
  {
    question: "Is Receipt Cycle a full accounting system?",
    answer: "Receipt Cycle focuses on practical finance workflows such as invoices, estimates, payments, receipts, expenses, budgets, and reports. It does not claim to replace payroll, tax filing, inventory, or a full general-ledger accounting platform.",
  },
  {
    question: "Can I add tax, discounts, notes, and payment terms?",
    answer: "Yes. The invoice builder supports tax and discount percentages, notes, payment terms, issue dates, due dates, quantities, rates, and line-item descriptions.",
  },
  {
    question: "Can I record a partial payment?",
    answer: "Yes. Record the amount received and payment method. Receipt Cycle updates the paid amount, remaining balance, invoice status, and payment history.",
  },
  {
    question: "Does Receipt Cycle process online card payments?",
    answer: "Not currently. Receipt Cycle records payments made through your existing payment method. It does not claim to act as a payment gateway.",
  },
  {
    question: "Can I print or save an invoice as a PDF?",
    answer: "Yes. Open the invoice preview and use the print option. Your browser can print the document or save it as a PDF.",
  },
  {
    question: "Can I turn an estimate into an invoice?",
    answer: "Yes. An estimate can be converted into an editable invoice draft, keeping its customer, line items, tax, discount, and terms connected.",
  },
  {
    question: "Does Receipt Cycle include invoice templates?",
    answer: "Receipt Cycle currently provides a consistent invoice layout that uses your business details and accent color. It does not claim to include a gallery of interchangeable invoice templates.",
  },
];

export default function InvoiceSoftwareLanding() {
  const [activeAudienceId, setActiveAudienceId] = useState("freelancers");
  const seo = getRouteSeo("/invoice-software");

  const benefitCards = [
    {
      icon: "fa-file-circle-plus",
      title: "Create polished invoices",
      body: "Start with a saved customer, add products or services, set quantities and rates, then review the document before it goes out. The invoice creation software keeps the work visible instead of hiding it behind a blank form.",
      tone: "bg-teal-800",
    },
    {
      icon: "fa-address-book",
      title: "Keep customer details ready",
      body: "Store the information you use for customer invoices once, then select the right customer when you create the next document. Their estimates, invoices, balances, and payments stay easier to follow.",
      tone: "bg-teal-700",
    },
    {
      icon: "fa-list-check",
      title: "Build accurate line items",
      body: "Describe the work, enter a quantity and rate, and add services from your catalog. Every invoice line item remains readable in the builder and in the customer-facing preview.",
      tone: "bg-teal-600",
    },
    {
      icon: "fa-calculator",
      title: "Check every total",
      body: "Add taxes and discounts where they apply. Receipt Cycle shows the subtotal, adjustment, tax amount, and final total before you save a draft invoice or mark it as sent.",
      tone: "bg-emerald-700",
    },
    {
      icon: "fa-chart-line",
      title: "Track what is still owed",
      body: "See sent, paid, overdue, and partially paid records in the same invoice management software. Open any invoice to review its total, payment history, and remaining balance.",
      tone: "bg-teal-900",
    },
  ];

  const audienceGroups = [
    {
      id: "freelancers",
      title: "Freelancers",
      body: "Create professional invoices for projects, retainers, and one-off services without maintaining a separate customer sheet. Add detailed work descriptions, choose sensible due dates, and keep a visible record of what each client has paid. Receipt Cycle works well as invoice software for freelancers who want more structure than a document template without moving into a heavyweight accounting platform.",
      image: "/landing/audiences/invoice-freelancer.webp",
      alt: "Hand-drawn illustration of a freelancer preparing a client invoice on a laptop",
    },
    {
      id: "consultants",
      title: "Consultants",
      body: "Turn advisory work into clear line items with quantities, rates, notes, and payment terms. Save repeat services in the catalog, create the next invoice from an existing customer record, and review the balance before following up. The result is a cleaner handoff between completed work, billing, and payment records.",
      image: "/landing/audiences/invoice-consultant.webp",
      alt: "Hand-drawn illustration of a consultant reviewing an approved client invoice",
    },
    {
      id: "small-business-owners",
      title: "Small business owners",
      body: "Use saved products and services for repeat jobs, then add custom line items when the scope changes. Business invoicing software should make recurring admin easier without pretending every job is identical. Receipt Cycle gives you that reusable structure while keeping each invoice editable.",
      image: "/landing/audiences/invoice-small-business.webp",
      alt: "Hand-drawn illustration of a small business owner billing from a workshop",
    },
    {
      id: "small-teams",
      title: "Small teams",
      body: "Keep customers, sales documents, payment records, and reports in the same business workspace. A shared invoice history makes it easier to check what was sent, what became overdue, and which payments were recorded, even when the person reviewing the balance did not create the original invoice.",
      image: "/landing/audiences/invoice-small-team.webp",
      alt: "Hand-drawn illustration of a small team reviewing invoices together",
    },
  ];

  const activeAudience = audienceGroups.find((group) => group.id === activeAudienceId) ?? audienceGroups[0];

  const resources = [
    {
      title: "A practical guide to tracking business expenses",
      description: "Build a simple record-keeping habit that keeps business purchases organized alongside the money your business earns.",
      href: "/blog/freelancers-guide-tracking-business-expenses",
      image: "/landing/feature-blog-freelancers-guide-tracking-business-expenses.png?v=10",
    },
    {
      title: "How to organize records for your accountant",
      description: "Learn how cleaner receipts and transaction records reduce the back-and-forth that slows down financial review.",
      href: "/blog/best-expense-tracker-for-freelancers",
      image: "/landing/feature-blog-best-expense-tracker-for-freelancers.png?v=10",
    },
    {
      title: "Why receipts and expense tracking work better together",
      description: "See how connected evidence and transaction records create a more dependable view of business spending.",
      href: "/blog/expense-tracker-receipt-scanner-one-two-punch",
      image: "/landing/feature-blog-expense-tracker-receipt-scanner-one-two-punch.png?v=1",
    },
  ];

  return (
    <CommercialLandingLayout
      ctaLabel="Create an invoice"
      ctaHref={primaryCta}
      announcement="Create invoices, record payments, and keep every balance visible in Receipt Cycle"
    >
      {seo ? (
        <Seo
          title={seo.title}
          description={seo.description}
          path={seo.path}
          ogImage={seo.ogImage}
          ogImageAlt={seo.ogImageAlt}
          ogType={seo.ogType}
          structuredData={seo.structuredData}
        />
      ) : null}

      <section className="relative overflow-hidden bg-white py-14 sm:py-20 lg:py-24">
        <div className="absolute -right-32 top-8 h-72 w-72 rounded-full bg-teal-100/70 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 sm:px-8 lg:grid-cols-[0.84fr_1.16fr] lg:gap-16">
          <div className="max-w-xl">
            <h1 className="text-balance font-display text-4xl font-bold leading-[1.04] tracking-[-0.04em] sm:text-5xl lg:text-[3.5rem]">
              <span className="block text-slate-950">Invoicing software for</span>
              <span className="mt-1 block text-teal-700">small businesses and freelancers</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
              Create polished invoices, send them to customers, and track what is paid or outstanding from one straightforward workspace.
            </p>
            <div className="mt-8">
              <Link
                to={primaryCta}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-700 to-teal-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
              >
                Create your first invoice
                <i className="fas fa-arrow-right text-xs" aria-hidden />
              </Link>
              <p className="mt-3 text-sm font-medium text-slate-500">No credit card required. Cancel paid plans anytime.</p>
            </div>
          </div>
          <div className="pb-10 sm:pb-14"><InvoiceWorkspacePreview /></div>
        </div>
      </section>

      <section id="features" className="scroll-mt-28 bg-[#eef8f5] py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Spend less time rebuilding invoices</h2>
            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">Good invoicing software should make the next billing task easier while keeping the document accurate. Receipt Cycle brings the customer, work, totals, status, and payment history into the same view.</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-6">
          {benefitCards.map((card, index) => (
            <article key={card.title} className={`${card.tone} rounded-2xl p-6 text-white shadow-sm ${index < 3 ? "md:col-span-2" : "md:col-span-3"}`}>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-teal-50"><i className={`fas ${card.icon}`} aria-hidden /></span>
              <h3 className="mt-5 font-display text-xl font-bold">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-teal-50/85">{card.body}</p>
            </article>
          ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="scroll-mt-28 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">All the invoicing features you need to bill with confidence</h2>
            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">Create the document, check the details, and follow the balance after it is sent. Each part of the page below shows a current Receipt Cycle product workflow.</p>
          </div>
          <div className="mt-14 grid gap-5 lg:grid-cols-2">
            <article className="rounded-3xl bg-[#f5f2eb] p-6 sm:p-8">
              <h3 className="font-display text-2xl font-bold text-slate-950">Build invoices from customers and saved services</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">Choose a customer, confirm the issue and due dates, then add products or services from your catalog. You can also create a custom line item for work that does not fit a saved service. This makes Receipt Cycle useful as simple invoicing software for repeat work and one-off projects.</p>
              <div className="mt-7"><BuilderPreview /></div>
            </article>
            <article className="rounded-3xl bg-teal-800 p-6 text-white sm:p-8">
              <h3 className="font-display text-2xl font-bold">Preview professional and branded invoices</h3>
              <p className="mt-3 text-sm leading-7 text-teal-50/85">Review the business identity, customer, dates, invoice line items, subtotal, discount, tax, and final amount in one document. Your business details and accent color carry into the invoice preview so the customer receives a consistent record.</p>
              <div className="mt-7"><InvoicePaper /></div>
            </article>
            <article className="rounded-3xl bg-[#eef8f5] p-6 sm:p-8">
              <h3 className="font-display text-2xl font-bold text-slate-950">Track invoice status and remaining balances</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">Use the invoice list to separate draft, sent, paid, and overdue invoices. Open a record to see the original total, the amount already paid, and the balance that remains. It is the part of invoice tracking software that prevents a sent document from disappearing into an email thread.</p>
              <div className="mt-7"><PaymentStatusPreview /></div>
            </article>
            <article className="rounded-3xl bg-[#fff7ed] p-6 sm:p-8">
              <h3 className="font-display text-2xl font-bold text-slate-950">Record payments and produce a clear receipt</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">Enter the amount received and the payment method. Receipt Cycle updates the paid amount and remaining balance, changes the invoice status when appropriate, and creates a payment receipt connected to the invoice history. Full and partial payments are supported.</p>
              <div className="mt-7 rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><i className="fas fa-check" aria-hidden /></span><div><p className="font-display text-lg font-bold">Payment recorded</p><p className="mt-1 text-xs text-slate-500">Receipt RCPT-0020 is ready to print or share.</p></div></div>
                <dl className="mt-6 space-y-3 border-y border-dashed border-slate-300 py-5 text-sm"><div className="flex justify-between"><dt className="text-slate-500">Invoice</dt><dd className="font-bold">INV-0042</dd></div><div className="flex justify-between"><dt className="text-slate-500">Method</dt><dd className="font-bold">Bank transfer</dd></div><div className="flex justify-between"><dt className="text-slate-500">Amount received</dt><dd className="font-black text-teal-700">$1,600.00</dd></div></dl>
                <p className="mt-4 text-xs leading-5 text-slate-500">Receipt Cycle records payments made through your existing payment method. It does not process card or bank payments as a payment gateway.</p>
              </div>
              <Link to="/payment-tracking-software/" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-teal-700 hover:text-teal-900">Explore payment tracking and receipt management<i className="fas fa-arrow-right text-xs" aria-hidden /></Link>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-teal-950 py-14 text-white sm:py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_440px]">
          <div><h2 className="font-display text-3xl font-bold sm:text-4xl">Create an invoice that stays useful after you send it</h2><p className="mt-4 max-w-2xl text-base leading-7 text-teal-100/80">Move from customer details to a reviewed invoice, then keep its status, payments, receipt, and balance in the same workspace.</p><div className="mt-7"><LandingPrimaryCta to={primaryCta} inverse>Create your first invoice</LandingPrimaryCta></div><Link to="/estimate-quotation-software/" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-teal-100 hover:text-white">Need to quote the work first? Explore estimate software<i className="fas fa-arrow-right text-xs" aria-hidden /></Link></div>
          <div className="grid grid-cols-3 gap-3">
            {[['fa-file-signature','Estimate'],['fa-file-invoice','Invoice'],['fa-receipt','Receipt']].map(([icon,label]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center"><span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-teal-800"><i className={`fas ${icon}`} aria-hidden /></span><p className="mt-3 text-xs font-bold">{label}</p></div>)}
          </div>
        </div>
      </section>

      <section className="bg-[#f8faf9] py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">A clearer way to manage invoices than documents and spreadsheets</h2>
            <p className="mt-5 text-base leading-8 text-slate-600">A document template can produce a single invoice, but it does not remember the customer, connect the payment, or tell you which balance is overdue. A spreadsheet can track status, but it still leaves the customer-facing document and payment receipt somewhere else.</p>
            <p className="mt-4 text-base leading-8 text-slate-600">Receipt Cycle brings those jobs together. Use it as invoice management software for the full record, not only as an invoice generator. The invoice remains connected to its customer, dates, line items, paid amount, balance, and payment history.</p>
            <p className="mt-4 text-base leading-8 text-slate-600">If you are comparing small business invoice software, focus on what happens after the document is created. You should be able to find a sent invoice, understand its status, record a partial payment, produce a receipt, and see the remaining balance without building another tracking system.</p>
            <Link to={primaryCta} className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-teal-700 hover:text-teal-900">Create an invoice in Receipt Cycle<i className="fas fa-arrow-right text-xs" aria-hidden /></Link>
          </div>
          <InvoiceWorkspacePreview />
        </div>
      </section>

      <section className="bg-teal-900 py-20 text-white sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center"><h2 className="font-display text-3xl font-bold sm:text-4xl">Why businesses choose a connected invoice record</h2><p className="mt-4 text-base leading-7 text-teal-100/80">The value is not a flashy template. It is knowing that the document, customer, payment, and remaining balance still agree when you return later.</p></div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {[
              ["The customer stays attached", "Open an invoice and see who it belongs to without searching another file. Customer records also support estimates and payment history."],
              ["The calculation stays visible", "Line items, quantities, rates, tax, discounts, and totals remain readable in the builder and preview."],
              ["The status tells the next story", "Draft, sent, paid, partially paid, and overdue states help you separate documents that need work from balances that need attention."],
              ["The payment creates a record", "Record the amount and method, update the balance, and generate a receipt that points back to the original invoice."],
            ].map(([title, body]) => <article key={title} className="rounded-2xl border border-white/10 bg-white/10 p-6"><h3 className="font-display text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-7 text-teal-50/80">{body}</p></article>)}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center"><h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Invoice software for freelancers, consultants, and small businesses</h2><p className="mt-4 text-base leading-7 text-slate-600">Choose how you work to see how Receipt Cycle fits the billing job.</p></div>
          <div className="mt-12 grid items-stretch gap-5 lg:grid-cols-[1.35fr_0.65fr]">
            <div
              id="audience-panel"
              role="tabpanel"
              aria-labelledby={`audience-tab-${activeAudience.id}`}
              className="min-w-0 overflow-hidden rounded-3xl border border-teal-100 bg-[#f8f5ee] shadow-sm"
            >
              <img
                key={activeAudience.image}
                src={activeAudience.image}
                alt={activeAudience.alt}
                width="1586"
                height="992"
                loading="lazy"
                decoding="async"
                sizes="(min-width: 1024px) 720px, (min-width: 640px) 90vw, 100vw"
                className="block h-auto w-full"
              />
            </div>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white px-5 sm:px-6" role="tablist" aria-label="Invoice software audiences">
              {audienceGroups.map((group) => {
                const isActive = group.id === activeAudience.id;

                return (
                  <div key={group.id} className="border-b border-slate-200 last:border-b-0">
                    <button
                      id={`audience-tab-${group.id}`}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls="audience-panel"
                      tabIndex={isActive ? 0 : -1}
                      onClick={() => setActiveAudienceId(group.id)}
                      onKeyDown={(event) => {
                        const currentIndex = audienceGroups.findIndex((audience) => audience.id === group.id);
                        let nextIndex = currentIndex;

                        if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = (currentIndex + 1) % audienceGroups.length;
                        if (event.key === "ArrowUp" || event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + audienceGroups.length) % audienceGroups.length;
                        if (event.key === "Home") nextIndex = 0;
                        if (event.key === "End") nextIndex = audienceGroups.length - 1;
                        if (nextIndex === currentIndex) return;

                        event.preventDefault();
                        const nextAudience = audienceGroups[nextIndex];
                        setActiveAudienceId(nextAudience.id);
                        requestAnimationFrame(() => document.getElementById(`audience-tab-${nextAudience.id}`)?.focus());
                      }}
                      className="flex min-h-16 w-full items-center justify-between gap-4 py-4 text-left font-display text-lg font-bold text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500"
                    >
                      {group.title}
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${isActive ? "rotate-45 bg-teal-700 text-white" : "bg-teal-50 text-teal-700"}`}>
                        <i className="fas fa-plus text-xs" aria-hidden />
                      </span>
                    </button>
                    {isActive ? <p className="pb-6 pr-4 text-sm leading-7 text-slate-600">{group.body}</p> : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#eef8f5] py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 lg:grid-cols-2">
            <div className="p-8 sm:p-10"><h2 className="font-display text-3xl font-bold text-slate-950">Help when you need a clear answer</h2><p className="mt-4 text-base leading-7 text-slate-600">Questions about the invoice workflow, billing, or your account should have a direct path to an answer. Use the product guidance, browse common questions, or contact the Receipt Cycle team.</p><div className="mt-7 flex flex-wrap gap-3"><Link to="/contact" className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-5 text-sm font-bold text-white">Contact us</Link><Link to="/faq" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-700">Visit the FAQ</Link></div></div>
            <div className="grid gap-px bg-slate-200 sm:grid-cols-3 lg:grid-cols-1">
              {[['fa-list-ol','Guided setup','The invoice builder separates customer details, line items, totals, and review into clear steps.'],['fa-circle-question','Common questions','Find product answers without turning the sales page into a technical manual.'],['fa-envelope','Email support','Reach support@receiptcycle.com when your question needs a person.']].map(([icon,title,body]) => <div key={title} className="bg-[#f8faf9] p-6"><i className={`fas ${icon} text-teal-700`} aria-hidden /><h3 className="mt-3 text-sm font-extrabold">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{body}</p></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center"><h2 className="font-display text-3xl font-bold text-slate-950 sm:text-4xl">Resources for clearer business records</h2><p className="mt-4 text-base leading-7 text-slate-600">Invoicing is one part of the financial record. These guides cover the expense and receipt side of running a small business.</p></div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {resources.map((resource) => <article key={resource.href} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><img src={resource.image} alt="" className="aspect-[16/9] w-full object-cover" loading="lazy" decoding="async" /><div className="p-6"><h3 className="font-display text-lg font-bold leading-6 text-slate-950">{resource.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{resource.description}</p><Link to={resource.href} className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-teal-700">Read the guide<i className="fas fa-arrow-right text-xs" aria-hidden /></Link></div></article>)}
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-28 bg-[#f8faf9] py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-center font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Frequently Asked Questions</h2>
          <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
            {faqItems.map((item, index) => <details key={item.question} className="group py-1" open={index === 0}><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-display text-base font-bold text-slate-900 marker:content-none sm:text-lg">{item.question}<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-teal-700 shadow-sm ring-1 ring-slate-200 transition group-open:rotate-45"><i className="fas fa-plus text-xs" aria-hidden /></span></summary><p className="max-w-3xl pb-6 pr-10 text-sm leading-7 text-slate-600 sm:text-base">{item.answer}</p></details>)}
          </div>
        </div>
      </section>

      <section className="bg-teal-950 py-16 text-white sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 text-center sm:px-6 lg:grid-cols-[1fr_auto] lg:text-left">
          <div><h2 className="font-display text-3xl font-bold sm:text-4xl">Create a professional invoice and keep the balance in view</h2><p className="mt-4 max-w-2xl text-base leading-7 text-teal-100/80">Add the customer, describe the work, review the total, and keep every payment connected to the document that started it.</p></div>
          <div className="flex flex-col justify-center gap-3 sm:flex-row"><LandingPrimaryCta to={primaryCta} inverse>Create your first invoice</LandingPrimaryCta><Link to="/pricing" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 px-6 py-3 text-sm font-extrabold text-white hover:bg-white/10">View pricing</Link></div>
        </div>
      </section>
    </CommercialLandingLayout>
  );
}
