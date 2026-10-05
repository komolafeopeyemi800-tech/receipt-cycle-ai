import { useState } from "react";
import { Link } from "react-router-dom";
import { CommercialLandingLayout, LandingPrimaryCta } from "@/components/marketing/CommercialLandingLayout";
import { Seo } from "@/components/Seo";
import { getRouteSeo } from "@/content/routesSeo";

const primaryCta = "/signup?intent=payment";

const paymentStatusTone: Record<string, string> = {
  Paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Partial: "bg-amber-50 text-amber-700 ring-amber-200",
  Overdue: "bg-rose-50 text-rose-700 ring-rose-200",
  Received: "bg-teal-50 text-teal-700 ring-teal-200",
};

function PaymentStatusPill({ status }: { status: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold ring-1 ${paymentStatusTone[status]}`}>{status}</span>;
}

function ReceiptCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`bg-white text-slate-800 shadow-xl ring-1 ring-slate-200 ${compact ? "rounded-xl p-4" : "rounded-2xl p-5 sm:p-7"}`}>
      <div className="flex items-start justify-between border-b border-dashed border-slate-300 pb-4">
        <div className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white"><i className="fas fa-receipt text-sm" aria-hidden /></span><div><p className="text-xs font-black text-slate-950">Receipt Cycle Studio</p><p className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-400">Payment receipt</p></div></div>
        <div className="text-right"><p className="text-xs font-black text-slate-800">RCPT-0021</p><p className="mt-1 text-[8px] text-slate-400">Sep 28, 2026</p></div>
      </div>
      <div className="space-y-2.5 py-4 text-[9px]">
        <div className="flex justify-between gap-4"><span className="text-slate-400">Received from</span><strong>Marlow Creative</strong></div>
        <div className="flex justify-between gap-4"><span className="text-slate-400">Invoice</span><strong>INV-0054</strong></div>
        {!compact ? <div className="flex justify-between gap-4"><span className="text-slate-400">Payment method</span><strong>Bank Transfer</strong></div> : null}
        {!compact ? <div className="flex justify-between gap-4"><span className="text-slate-400">Reference</span><strong>TRF83920417</strong></div> : null}
        <div className="flex justify-between border-t border-dashed border-slate-300 pt-3 text-xs"><span className="font-bold">Amount received</span><strong className="text-teal-800">$1,250.00</strong></div>
        {!compact ? <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2"><span className="text-slate-500">Remaining balance</span><strong>$1,250.00</strong></div> : null}
      </div>
    </div>
  );
}

function PaymentWorkspacePreview() {
  const payments = [
    ["RCPT-0021", "Marlow Creative", "Bank Transfer", "$1,250", "Received"],
    ["RCPT-0020", "Harbor & Co.", "Card", "$800", "Received"],
    ["RCPT-0019", "Fieldwork Labs", "Cash", "$450", "Received"],
  ];

  return (
    <div className="relative mx-auto max-w-2xl" role="img" aria-label="Receipt Cycle payment workspace showing received payments, open balances, and receipts">
      <div className="overflow-hidden rounded-[26px] border border-white/70 bg-white shadow-[0_28px_90px_rgba(15,118,110,0.22)] ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-4 py-3"><div className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-300" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-300" /></div><span className="rounded-full bg-white px-3 py-1 text-[9px] font-bold text-slate-500 ring-1 ring-slate-200">Payments &amp; receipts</span></div>
        <div className="grid min-h-[405px] grid-cols-[68px_1fr] sm:grid-cols-[118px_1fr]">
          <div className="bg-slate-950 p-3 text-white"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600"><i className="fas fa-receipt text-sm" aria-hidden /></div><div className="mt-8 space-y-2 text-[9px] text-slate-400"><div className="rounded-lg px-2 py-2"><i className="fas fa-file-invoice sm:mr-2" aria-hidden /><span className="hidden sm:inline">Invoices</span></div><div className="rounded-lg bg-white/10 px-2 py-2 font-bold text-white"><i className="fas fa-credit-card sm:mr-2" aria-hidden /><span className="hidden sm:inline">Payments</span></div><div className="rounded-lg px-2 py-2"><i className="fas fa-chart-column sm:mr-2" aria-hidden /><span className="hidden sm:inline">Reports</span></div></div></div>
          <div className="min-w-0 bg-[#f8fbfa] p-3 sm:p-5">
            <div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-wider text-teal-700">Sales cycle</p><p className="mt-1 text-base font-black text-slate-950">Payment history</p></div><span className="rounded-lg bg-teal-700 px-3 py-2 text-[9px] font-bold text-white">+ Record payment</span></div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-[9px]"><div className="rounded-xl bg-white p-3 ring-1 ring-slate-200"><p className="text-slate-400">Received</p><p className="mt-1 font-black text-slate-900">$2,500</p></div><div className="rounded-xl bg-white p-3 ring-1 ring-slate-200"><p className="text-slate-400">Open</p><p className="mt-1 font-black text-rose-700">$4,125</p></div><div className="rounded-xl bg-white p-3 ring-1 ring-slate-200"><p className="text-slate-400">Receipts</p><p className="mt-1 font-black text-slate-900">3</p></div></div>
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="grid grid-cols-[1fr_1fr_65px] bg-slate-50 px-3 py-2 text-[8px] font-bold uppercase text-slate-400 sm:grid-cols-[72px_1fr_70px_65px]"><span>Receipt</span><span>Customer</span><span className="hidden sm:block">Method</span><span className="text-right">Amount</span></div>{payments.map(([receipt, customer, method, amount]) => <div key={receipt} className="grid grid-cols-[1fr_1fr_65px] items-center border-t border-slate-100 px-3 py-3 text-[9px] sm:grid-cols-[72px_1fr_70px_65px]"><span className="font-extrabold text-slate-800">{receipt}</span><span className="truncate text-slate-500">{customer}</span><span className="hidden truncate sm:block">{method}</span><span className="text-right font-bold text-slate-800">{amount}</span></div>)}</div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-10 -right-3 w-[54%] min-w-[215px] rotate-1 sm:-right-8 sm:w-[49%]"><ReceiptCard compact /></div>
    </div>
  );
}

function PaymentEntryPreview() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6" role="img" aria-label="Record payment form with invoice, amount, method, receiving account, and date">
      <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-teal-700">Record payment</p><p className="mt-1 text-lg font-black">INV-0054</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-700">$2,500 due</span></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {["Amount received|$1,250.00", "Payment method|Bank Transfer", "Received into|Business checking", "Payment date|Sep 28, 2026"].map((row) => { const [label, value] = row.split("|"); return <div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-xs font-extrabold text-slate-800">{value}</p></div>; })}
      </div>
      <div className="mt-4 rounded-xl border border-slate-200 p-4"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Note</p><p className="mt-2 text-xs text-slate-600">First project installment received.</p></div>
      <div className="mt-5 flex justify-end"><span className="rounded-xl bg-teal-700 px-5 py-3 text-xs font-extrabold text-white">Record payment</span></div>
    </div>
  );
}

function BalancePreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-sm" role="img" aria-label="Invoice totals showing partial payment and remaining balance">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Invoice balance</p><p className="mt-1 text-sm font-black">INV-0054</p></div><PaymentStatusPill status="Partial" /></div>
      <div className="grid grid-cols-3 gap-2 p-5 text-center text-[10px]"><div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-400">Total</p><p className="mt-1 font-black">$2,500</p></div><div className="rounded-xl bg-emerald-50 p-3"><p className="text-emerald-700">Paid</p><p className="mt-1 font-black text-emerald-800">$1,250</p></div><div className="rounded-xl bg-rose-50 p-3"><p className="text-rose-600">Balance</p><p className="mt-1 font-black text-rose-800">$1,250</p></div></div>
      <div className="px-5 pb-5"><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-1/2 rounded-full bg-teal-600" /></div><div className="mt-2 flex justify-between text-[9px] text-slate-400"><span>50% received</span><span>50% outstanding</span></div></div>
    </div>
  );
}

function PaymentHistoryPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" role="img" aria-label="Invoice payment history with dates, methods, references, and amounts">
      <div className="border-b border-slate-100 px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment history</p><p className="mt-1 text-sm font-black">Marlow Creative</p></div>
      <div className="divide-y divide-slate-100 text-[10px]">{[["Sep 28", "Bank Transfer · TRF83920417", "$1,250"], ["Sep 12", "Card · CRD20481052", "$500"]].map(([date, detail, amount]) => <div key={detail} className="grid grid-cols-[50px_1fr_auto] items-center gap-3 px-5 py-4"><span className="font-bold text-slate-500">{date}</span><span className="truncate text-slate-500">{detail}</span><strong>{amount}</strong></div>)}</div>
    </div>
  );
}

function ShareReceiptPreview() {
  return (
    <div className="rounded-2xl bg-slate-950 p-5 text-white" role="img" aria-label="Payment receipt sharing options for PDF, image, print, and message">
      <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500"><i className="fas fa-share-nodes" aria-hidden /></span><div><p className="text-[10px] font-bold uppercase tracking-wider text-teal-300">Receipt ready</p><p className="mt-1 text-sm font-black">RCPT-0021</p></div></div>
      <div className="mt-5 grid grid-cols-2 gap-2 text-[10px]">{[["fa-file-pdf", "PDF"], ["fa-image", "Image"], ["fa-print", "Print"], ["fa-paper-plane", "Message"]].map(([icon, label]) => <div key={label} className="rounded-xl bg-white/10 p-3"><i className={`fas ${icon} text-teal-300`} aria-hidden /><p className="mt-2 font-bold">{label}</p></div>)}</div>
    </div>
  );
}

function PaymentLifecyclePreview() {
  return (
    <div className="relative mx-auto flex min-h-[590px] w-full max-w-md flex-col justify-between overflow-hidden rounded-[32px] bg-slate-950 p-6 text-white shadow-xl sm:p-8 lg:min-h-[690px]" role="img" aria-label="Invoice moving from an outstanding balance through a recorded payment to a receipt">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-teal-500/20 blur-2xl" />
      <div className="relative rounded-3xl border border-white/10 bg-white/10 p-5"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-wider text-teal-300">Open invoice</p><p className="mt-1 text-xl font-black">INV-0054</p></div><PaymentStatusPill status="Overdue" /></div><div className="mt-5 grid grid-cols-2 gap-3 text-[10px]"><div className="rounded-xl bg-white/5 p-3"><p className="text-slate-400">Invoice total</p><p className="mt-1 font-black">$2,500</p></div><div className="rounded-xl bg-rose-500/10 p-3"><p className="text-rose-300">Outstanding</p><p className="mt-1 font-black">$2,500</p></div></div></div>
      <div className="relative flex flex-1 flex-col items-center justify-center py-4"><div className="h-full min-h-10 w-px bg-gradient-to-b from-white/20 to-teal-400" /><span className="my-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-500 shadow-lg shadow-black/30"><i className="fas fa-plus" aria-hidden /></span><p className="rounded-full bg-white/10 px-4 py-2 text-[10px] font-bold">Record $1,250 received</p><div className="h-full min-h-10 w-px bg-gradient-to-b from-teal-400 to-white/30" /></div>
      <div className="relative rounded-3xl bg-white p-5 text-slate-900"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment saved</p><p className="mt-1 text-xl font-black">RCPT-0021</p></div><PaymentStatusPill status="Received" /></div><div className="mt-5 space-y-2 text-[10px]"><div className="flex justify-between"><span className="text-slate-400">Payment method</span><strong>Bank Transfer</strong></div><div className="flex justify-between"><span className="text-slate-400">Reference</span><strong>TRF83920417</strong></div><div className="flex justify-between border-t border-slate-200 pt-3"><span className="text-slate-400">Remaining balance</span><strong className="text-rose-700">$1,250</strong></div></div><div className="mt-5 rounded-xl bg-teal-50 p-3 text-center text-[10px] font-extrabold text-teal-800">Receipt ready to preview and share</div></div>
    </div>
  );
}

const faqItems = [
  { question: "What does payment tracking software do?", answer: "It records customer payments against invoices so the payment date, amount, method, reference, history, paid amount, and remaining balance can be reviewed together. Receipt Cycle also creates a receipt record after the payment is saved." },
  { question: "Can I record a partial payment?", answer: "Yes. Enter an amount up to the invoice balance. Receipt Cycle adds the payment to history, updates the paid amount and outstanding balance, and marks the invoice partially paid until the full total has been recorded." },
  { question: "Does Receipt Cycle process customer payments?", answer: "No. Receipt Cycle records payments received through your existing bank transfer, card, cash, mobile-money, or other method. It does not act as a payment gateway, collect funds, or verify settlement." },
  { question: "What information appears on a payment receipt?", answer: "The receipt can include the business, customer, receipt number, invoice reference, amount received, payment method, receiving account, payment date, payment reference, and remaining balance." },
  { question: "Can I preview, download, or share a receipt?", answer: "Yes. The mobile workflow includes receipt preview and sharing as a PDF or image through supported device apps. The web workspace supports receipt sharing plus printing or saving the receipt as a PDF." },
  { question: "Does Receipt Cycle support payment reconciliation?", answer: "Receipt Cycle supports manual payment reconciliation by keeping each recorded amount attached to its invoice, reference, method, date, and balance. It does not currently claim automatic bank-feed matching or settlement reconciliation." },
  { question: "Is this accounts receivable tracking software?", answer: "Receipt Cycle covers practical accounts-receivable tasks for small businesses: invoice status, paid amount, partial payments, overdue balances, payment history, and receipts. It is not positioned as an enterprise collections or treasury platform." },
];

export default function PaymentTrackingSoftwareLanding() {
  const [activeAudienceId, setActiveAudienceId] = useState("freelancers");
  const seo = getRouteSeo("/payment-tracking-software");

  const benefits = [
    { icon: "fa-link", title: "Keep the payment with its invoice", body: "Start from an open invoice so the customer, original total, paid amount, and balance remain part of the same record.", tone: "bg-teal-900" },
    { icon: "fa-chart-pie", title: "Handle partial payments", body: "Record the amount received without marking the invoice fully paid. The remaining balance stays visible for the next payment.", tone: "bg-teal-700" },
    { icon: "fa-clock-rotate-left", title: "Preserve payment history", body: "Keep each date, method, reference, and amount available when you reopen the invoice or payment workspace.", tone: "bg-emerald-700" },
    { icon: "fa-scale-balanced", title: "Know what remains outstanding", body: "Compare the invoice total with what has been recorded and see whether the record is paid, partially paid, or overdue.", tone: "bg-cyan-700" },
    { icon: "fa-receipt", title: "Produce proof of payment", body: "Generate a numbered receipt that identifies the customer, invoice, amount, method, reference, and remaining balance.", tone: "bg-slate-900" },
  ];

  const audiences = [
    { id: "freelancers", title: "Freelancers", body: "Payment tracking for freelancers should make project installments easier to follow. Record each client payment against the invoice, keep the reference and date, and send a receipt without rebuilding the information in another document.", image: "/landing/audiences/payment-freelancer.webp", alt: "Hand-drawn illustration of a freelancer recording a client payment and creating a receipt" },
    { id: "consultants", title: "Consultants", body: "Track deposits, milestone payments, and final balances for advisory work. A partial payment remains attached to the invoice, while the receipt gives the client a documented record of what was received.", image: "/landing/audiences/payment-consultant.webp", alt: "Hand-drawn illustration of a consultant reviewing a partial payment and receipt with a client" },
    { id: "service-businesses", title: "Service businesses", body: "Record bank transfer, card, cash, or mobile-money payments after a job. The record shows what entered the business, which invoice it belongs to, and what the customer still owes.", image: "/landing/audiences/payment-service-business.webp", alt: "Hand-drawn illustration of a service-business owner recording a customer payment in a workshop" },
    { id: "small-teams", title: "Small teams", body: "Shared payment tracking works best when another person can reopen the history and understand it. Receipt numbers, references, dates, methods, and balances give the team a reliable record without relying on one person's inbox.", image: "/landing/audiences/payment-small-team.webp", alt: "Hand-drawn illustration of a small team reviewing invoice payments, balances, and receipts" },
  ];
  const activeAudience = audiences.find((audience) => audience.id === activeAudienceId) ?? audiences[0];

  const resources = [
    { title: "Create and manage the invoice first", description: "Prepare the customer document, track its status, and keep the balance ready for payment recording.", href: "/invoice-software/", icon: "fa-file-invoice-dollar" },
    { title: "Price the work before invoicing", description: "Create an estimate, record acceptance, and carry approved details into an invoice draft.", href: "/estimate-quotation-software/", icon: "fa-file-signature" },
    { title: "Compare Receipt Cycle plans", description: "Review current plan options before choosing how your business will use invoices, payments, and receipts.", href: "/pricing", icon: "fa-tags" },
  ];

  return (
    <CommercialLandingLayout ctaLabel="Record a payment" ctaHref={primaryCta} announcement="Record invoice payments, update balances, and create customer receipts">
      {seo ? <Seo title={seo.title} description={seo.description} path={seo.path} ogImage={seo.ogImage} ogImageAlt={seo.ogImageAlt} ogType={seo.ogType} structuredData={seo.structuredData} /> : null}

      <section className="relative overflow-hidden bg-white py-14 sm:py-20 lg:py-24">
        <div className="absolute -right-32 top-8 h-72 w-72 rounded-full bg-teal-100/70 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 sm:px-8 lg:grid-cols-[0.84fr_1.16fr] lg:gap-16">
          <div className="max-w-xl"><h1 className="text-balance font-display text-4xl font-bold leading-[1.04] tracking-[-0.04em] sm:text-5xl lg:text-[3.5rem]"><span className="block text-slate-950">Payment tracking software for </span><span className="mt-1 block text-teal-700">invoicing and recurring billing</span></h1><p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">Record full or partial invoice payments, update the balance, and create a receipt without rebuilding the transaction in another file.</p><div className="mt-8"><LandingPrimaryCta to={primaryCta}>Record your first payment</LandingPrimaryCta><p className="mt-3 text-sm font-medium text-slate-500">No credit card required. Cancel paid plans anytime.</p></div></div>
          <div className="pb-10 sm:pb-14"><PaymentWorkspacePreview /></div>
        </div>
      </section>

      <section id="features" className="scroll-mt-28 bg-[#eef8f5] py-20 sm:py-24"><div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="mx-auto max-w-3xl text-center"><h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Know what was paid and what is still owed</h2><p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">Invoice payment tracking is not another list of deposits. It should explain which invoice received the money, how much arrived, when it happened, and what remains outstanding.</p></div><div className="mt-12 grid gap-4 md:grid-cols-6">{benefits.map((benefit, index) => <article key={benefit.title} className={`${benefit.tone} rounded-2xl p-6 text-white shadow-sm ${index < 3 ? "md:col-span-2" : "md:col-span-3"}`}><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-teal-50"><i className={`fas ${benefit.icon}`} aria-hidden /></span><h3 className="mt-5 font-display text-xl font-bold">{benefit.title}</h3><p className="mt-3 text-sm leading-6 text-teal-50/85">{benefit.body}</p></article>)}</div></div></section>

      <section className="py-20 sm:py-28"><div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="mx-auto max-w-3xl text-center"><h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Payment records, balances, and receipts in one workspace</h2><p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">Useful payment management software connects the entry form to the invoice balance, history, receipt preview, and sharing actions that follow.</p></div><div className="mt-12 grid gap-5 lg:grid-cols-12">
        <article className="overflow-hidden rounded-3xl bg-[#eef8f5] p-5 sm:p-7 lg:col-span-7"><PaymentEntryPreview /><div className="pt-7"><h3 className="font-display text-2xl font-bold">Record the payment against an open invoice</h3><p className="mt-3 text-sm leading-7 text-slate-600">Choose the invoice, enter the amount, select the payment method and receiving account, confirm the payment date, and add a note when useful. Receipt Cycle prevents the mobile payment amount from exceeding the remaining invoice balance.</p></div></article>
        <article className="rounded-3xl bg-[#f8f5ee] p-5 sm:p-7 lg:col-span-5"><BalancePreview /><h3 className="mt-7 font-display text-2xl font-bold">Update paid amount and balance</h3><p className="mt-3 text-sm leading-7 text-slate-600">A full payment closes the balance and produces a paid invoice. A smaller amount changes the record to partially paid, preserving the outstanding balance for later.</p></article>
        <article className="rounded-3xl bg-[#fff1c7] p-5 sm:p-7 lg:col-span-5"><PaymentHistoryPreview /><h3 className="mt-6 font-display text-2xl font-bold">Keep every payment event available</h3><p className="mt-3 text-sm leading-7 text-slate-700">Payment date, method, generated reference, and amount remain in history. Invoice payment management becomes easier when each installment can be reviewed without searching old messages.</p></article>
        <article className="rounded-3xl bg-[#dff5ef] p-5 sm:p-7 lg:col-span-7"><div className="grid items-center gap-6 sm:grid-cols-[1.05fr_0.95fr]"><div><h3 className="font-display text-2xl font-bold">Preview the receipt before it leaves your business</h3><p className="mt-3 text-sm leading-7 text-slate-600">Payment receipt software should identify the business, customer, invoice, amount, method, date, reference, and remaining balance. The receipt preview gives you one place to check those details.</p></div><ReceiptCard compact /></div></article>
        <article className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8 lg:col-span-5"><ShareReceiptPreview /><h3 className="mt-7 font-display text-2xl font-bold">Save or share the receipt</h3><p className="mt-3 text-sm leading-7 text-slate-300">On supported mobile devices, share the receipt as a PDF or image. The web workspace can print or save the document as a PDF, then share receipt details through available device tools.</p></article>
        <article className="rounded-3xl bg-teal-700 p-6 text-white sm:p-8 lg:col-span-7"><div className="grid items-center gap-5 sm:grid-cols-[1fr_auto_1fr]"><div className="rounded-2xl bg-white/10 p-5"><p className="text-[10px] font-bold uppercase tracking-wider text-teal-100">Invoice</p><p className="mt-2 font-display text-2xl font-bold">$2,500 due</p></div><i className="fas fa-arrow-right text-teal-100" aria-hidden /><div className="rounded-2xl bg-white p-5 text-slate-900"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Receipt</p><p className="mt-2 font-display text-2xl font-bold">$1,250 received</p></div></div><h3 className="mt-7 font-display text-2xl font-bold">Keep the source and proof together</h3><p className="mt-3 text-sm leading-7 text-teal-50/85">The payment receipt generator starts from the recorded invoice payment, so the receipt does not become an unrelated file with no billing context.</p></article>
      </div>
      <div className="mt-8 overflow-hidden rounded-3xl bg-[#eef8f5] ring-1 ring-teal-100">
        <div className="grid gap-8 p-7 sm:p-9 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <h3 className="font-display text-2xl font-bold text-slate-950">How each payment changes the invoice</h3>
            <p className="mt-4 text-sm leading-7 text-slate-600">The invoice status should describe the current balance, not the fact that a document was sent at some point. Receipt Cycle recalculates that state after every recorded amount.</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">This distinction matters when a customer pays in installments. The history preserves each event while the invoice summary shows the combined amount received.</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">A payment tracking app becomes useful when both the individual entries and the current invoice position remain easy to understand.</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">A business payment tracker should also make that position understandable to more than one person.</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">For teams comparing payment tracking for small business use, a shared invoice position prevents one person's inbox from becoming the only source of context.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm"><PaymentStatusPill status="Overdue" /><h4 className="mt-4 font-display text-lg font-bold">Nothing recorded</h4><p className="mt-2 text-xs leading-6 text-slate-500">The due date has passed and the original balance is still open.</p></div>
            <div className="rounded-2xl bg-white p-5 shadow-sm"><PaymentStatusPill status="Partial" /><h4 className="mt-4 font-display text-lg font-bold">Some money received</h4><p className="mt-2 text-xs leading-6 text-slate-500">History shows the installment and the summary retains the amount still due.</p></div>
            <div className="rounded-2xl bg-white p-5 shadow-sm"><PaymentStatusPill status="Paid" /><h4 className="mt-4 font-display text-lg font-bold">Balance completed</h4><p className="mt-2 text-xs leading-6 text-slate-500">Recorded payments now equal the invoice total and the remaining balance is zero.</p></div>
          </div>
        </div>
      </div>
      </div></section>

      <section className="bg-teal-950 py-14 text-white"><div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-7 px-4 sm:px-6 lg:flex-row lg:items-center"><div><h2 className="font-display text-3xl font-bold sm:text-4xl">Turn money received into a dependable record</h2><p className="mt-3 max-w-2xl text-base leading-7 text-teal-100/80">Attach the amount to its invoice, preserve the details, update the balance, and provide the customer with a receipt.</p></div><LandingPrimaryCta to={primaryCta} inverse>Record your first payment</LandingPrimaryCta></div></section>

      <section id="workflow" className="scroll-mt-28 bg-white py-20 sm:py-28"><div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="grid items-stretch gap-12 lg:grid-cols-[1fr_0.88fr]"><div><h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">From open invoice to recorded payment to receipt</h2><p className="mt-5 text-base leading-7 text-slate-600">A payment management system should preserve the sequence, not only the final amount. Receipt Cycle keeps each step available for review.</p><ol className="mt-8 space-y-6">
        <li className="grid grid-cols-[44px_1fr] gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">1</span><div><h3 className="font-display text-xl font-bold">Start with the invoice balance</h3><p className="mt-2 text-sm leading-7 text-slate-600">Select an invoice that still has an amount due. Review the invoice total, previous paid amount, and remaining balance before entering another payment.</p></div></li>
        <li className="grid grid-cols-[44px_1fr] gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-700 text-sm font-black text-white">2</span><div><h3 className="font-display text-xl font-bold">Record what the business received</h3><p className="mt-2 text-sm leading-7 text-slate-600">Enter the amount, method, account, and date. Receipt Cycle generates a reference, adds the event to payment history, and updates the invoice to paid or partially paid.</p></div></li>
        <li className="grid grid-cols-[44px_1fr] gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">3</span><div><h3 className="font-display text-xl font-bold">Create and deliver the receipt</h3><p className="mt-2 text-sm leading-7 text-slate-600">Open the receipt preview, check the customer and payment details, then print, save, download receipt output where supported, or share it through an available app.</p></div></li>
      </ol><Link to="/invoice-software/" className="mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-teal-700 hover:text-teal-900">Review the invoice workflow before payment<i className="fas fa-arrow-right text-xs" aria-hidden /></Link></div><PaymentLifecyclePreview /></div></div></section>

      <section className="bg-[#f7faf9] py-20 sm:py-28"><div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]"><div><h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Why a spreadsheet is not an invoice payment tracker</h2><p className="mt-5 text-base leading-7 text-slate-600">A spreadsheet can list amounts and dates, but it depends on someone rebuilding the relationship between the payment, customer, invoice, balance, and receipt.</p><p className="mt-4 text-base leading-7 text-slate-600">Receipt Cycle keeps those fields attached to the same sales record. That makes it easier to review a payment later, prepare a receipt again, or explain why an invoice still has a balance.</p></div><div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="grid grid-cols-2 bg-slate-950 px-5 py-4 text-xs font-extrabold text-white sm:px-7"><span>Spreadsheet and receipt files</span><span>Receipt Cycle payment workspace</span></div>{[
        ["Payment rows depend on manually copied invoice numbers.", "The payment begins from an open invoice and stays attached to it."],
        ["A partial payment may require another balance formula.", "Paid amount and remaining balance update when the payment is recorded."],
        ["Method, date, and reference may be stored in separate columns or messages.", "The payment record preserves those details together."],
        ["A receipt is often rebuilt in a document template.", "The saved payment produces a numbered customer receipt."],
        ["Payment reconciliation relies on searching files and bank messages.", "Manual reconciliation can begin from the invoice, payment history, reference, and balance."],
      ].map(([before, after]) => <div key={before} className="grid grid-cols-2 border-t border-slate-200 text-sm leading-6"><p className="p-5 text-slate-500 sm:p-7">{before}</p><p className="border-l border-slate-200 bg-teal-50/50 p-5 font-medium text-slate-700 sm:p-7">{after}</p></div>)}</div></div></div></section>

      <section className="py-20 sm:py-24"><div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="mx-auto max-w-3xl text-center"><h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">What a useful payment record should answer</h2><p className="mt-4 text-base leading-7 text-slate-600">When someone reopens the record later, they should not have to guess which invoice was paid, how the amount arrived, or what still remains.</p></div><div className="mt-10 grid gap-5 lg:grid-cols-3">
        <article className="overflow-hidden rounded-3xl border border-teal-100 bg-white shadow-sm"><div className="bg-teal-900 p-7 text-white"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><i className="fas fa-file-invoice-dollar" aria-hidden /></span><h3 className="mt-5 font-display text-xl font-bold">Which invoice received the money?</h3></div><div className="space-y-4 p-7 text-sm leading-7 text-slate-600"><p>Begin with the open invoice instead of an isolated deposit row.</p><p>The invoice number, customer, total, prior payments, and balance provide the context for the new record.</p></div></article>
        <article className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-sm"><div className="bg-[#fff1c7] p-7"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white"><i className="fas fa-money-check-dollar" aria-hidden /></span><h3 className="mt-5 font-display text-xl font-bold">How and when was it received?</h3></div><div className="space-y-4 p-7 text-sm leading-7 text-slate-600"><p>Store the payment method, receiving account, payment date, and reference with the amount.</p><p>These fields make the history more useful than an unlabeled number in a spreadsheet.</p></div></article>
        <article className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm"><div className="bg-[#dff5ef] p-7"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white"><i className="fas fa-receipt" aria-hidden /></span><h3 className="mt-5 font-display text-xl font-bold">What proof can the customer receive?</h3></div><div className="space-y-4 p-7 text-sm leading-7 text-slate-600"><p>A payment receipt maker should reuse the saved payment details instead of asking you to type them again.</p><p>Preview the receipt, confirm the amount and reference, then print, save, or share the document.</p></div></article>
      </div></div></section>

      <section className="bg-teal-950 py-20 text-white sm:py-24"><div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="mx-auto max-w-3xl text-center"><h2 className="font-display text-3xl font-bold sm:text-4xl">What Receipt Cycle keeps with every payment</h2><p className="mt-4 text-base leading-7 text-teal-100/80">Each recorded amount stays connected to its invoice, payment details, updated balance, history, and customer receipt.</p></div><div className="mt-10 grid gap-4 md:grid-cols-2">{[
        ["Full and partial payment records", "A recorded amount updates the invoice paid amount, balance, and status. Mobile validation prevents an entry above the remaining balance."],
        ["Invoice-linked payment history", "Each payment remains available with its amount, date, method, and reference instead of becoming an unrelated transaction note."],
        ["Numbered receipt records", "Receipt Cycle assigns a receipt number and combines business, customer, invoice, and payment information in the receipt preview."],
        ["Practical sharing options", "Supported mobile devices can share PDF or image output. The web workspace supports sharing and print or PDF output."],
      ].map(([title, body]) => <article key={title} className="rounded-2xl border border-white/10 bg-white/10 p-6"><h3 className="font-display text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-7 text-teal-50/80">{body}</p></article>)}</div></div></section>

      <section className="py-20 sm:py-28"><div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="mx-auto max-w-3xl text-center"><h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Payment tracking for independent work and small teams</h2><p className="mt-4 text-base leading-7 text-slate-600">Choose how your business works to see how payment records and receipts fit the job after invoicing.</p></div><div className="mt-12 grid items-stretch gap-5 lg:grid-cols-[1.35fr_0.65fr]"><div id="payment-audience-panel" role="tabpanel" aria-labelledby={`payment-audience-tab-${activeAudience.id}`} className="min-w-0 overflow-hidden rounded-3xl border border-teal-100 bg-[#f8f5ee] shadow-sm"><img key={activeAudience.image} src={activeAudience.image} alt={activeAudience.alt} width="1586" height="992" loading="lazy" decoding="async" sizes="(min-width: 1024px) 720px, (min-width: 640px) 90vw, 100vw" className="block h-auto w-full" /></div><div className="overflow-hidden rounded-3xl border border-slate-200 bg-white px-5 sm:px-6" role="tablist" aria-label="Payment tracking software audiences">{audiences.map((audience) => { const isActive = audience.id === activeAudience.id; return <div key={audience.id} className="border-b border-slate-200 last:border-b-0"><button id={`payment-audience-tab-${audience.id}`} type="button" role="tab" aria-selected={isActive} aria-controls="payment-audience-panel" tabIndex={isActive ? 0 : -1} onClick={() => setActiveAudienceId(audience.id)} onKeyDown={(event) => { const currentIndex = audiences.findIndex((item) => item.id === audience.id); let nextIndex = currentIndex; if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = (currentIndex + 1) % audiences.length; if (event.key === "ArrowUp" || event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + audiences.length) % audiences.length; if (event.key === "Home") nextIndex = 0; if (event.key === "End") nextIndex = audiences.length - 1; if (nextIndex === currentIndex) return; event.preventDefault(); const next = audiences[nextIndex]; setActiveAudienceId(next.id); requestAnimationFrame(() => document.getElementById(`payment-audience-tab-${next.id}`)?.focus()); }} className="flex min-h-16 w-full items-center justify-between gap-4 py-4 text-left font-display text-lg font-bold text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500">{audience.title}<span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${isActive ? "rotate-45 bg-teal-700 text-white" : "bg-teal-50 text-teal-700"}`}><i className="fas fa-plus text-xs" aria-hidden /></span></button>{isActive ? <p className="pb-6 pr-4 text-sm leading-7 text-slate-600">{audience.body}</p> : null}</div>; })}</div></div></div></section>

      <section className="bg-[#eef8f5] py-20 sm:py-24"><div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="grid overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 lg:grid-cols-2"><div className="p-8 sm:p-10"><h2 className="font-display text-3xl font-bold text-slate-950">Check the payment before you share the receipt</h2><p className="mt-4 text-base leading-7 text-slate-600">Review the amount received, method, date, reference, and new balance against your source record. If something does not match, correct the entry before the receipt reaches the customer or ask the Receipt Cycle team for help.</p><div className="mt-7 flex flex-wrap gap-3"><Link to="/contact" className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-5 text-sm font-bold text-white">Contact us</Link><Link to="/faq" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-700">Visit the FAQ</Link></div></div><div className="grid gap-px bg-slate-200 sm:grid-cols-3 lg:grid-cols-1">{[["fa-list-ol", "Entry checklist", "Compare the invoice, amount, account, method, date, and note before you record the payment."], ["fa-scale-balanced", "Balance check", "Confirm that the new paid amount and outstanding balance agree with the payment you received."], ["fa-envelope", "Record support", "Email support@receiptcycle.com with the invoice number and the detail that needs review."]].map(([icon, title, body]) => <div key={title} className="bg-[#f8faf9] p-6"><i className={`fas ${icon} text-teal-700`} aria-hidden /><h3 className="mt-3 text-sm font-extrabold">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{body}</p></div>)}</div></div></div></section>

      <section className="py-20 sm:py-24"><div className="mx-auto max-w-6xl px-4 sm:px-6"><h2 className="text-center font-display text-3xl font-bold text-slate-950 sm:text-4xl">Continue through the Receipt Cycle sales workflow</h2><div className="mt-10 grid gap-5 md:grid-cols-3">{resources.map((resource) => <article key={resource.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><i className={`fas ${resource.icon}`} aria-hidden /></span><h3 className="mt-5 font-display text-xl font-bold">{resource.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{resource.description}</p><Link to={resource.href} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-teal-700 hover:text-teal-900">Open resource<i className="fas fa-arrow-right text-xs" aria-hidden /></Link></article>)}</div></div></section>

      <section id="faq" className="scroll-mt-28 bg-[#f8f5ee] py-20 sm:py-24"><div className="mx-auto max-w-5xl px-4 sm:px-6"><h2 className="text-center font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Frequently Asked Questions</h2><div className="mt-10 divide-y divide-slate-300 border-y border-slate-300">{faqItems.map((item, index) => <details key={item.question} className="group py-1" open={index === 0}><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-sm font-extrabold text-slate-900 marker:content-none sm:text-base">{item.question}<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-teal-700 transition group-open:rotate-45"><i className="fas fa-plus text-xs" aria-hidden /></span></summary><p className="max-w-4xl pb-6 pr-12 text-sm leading-7 text-slate-600">{item.answer}</p></details>)}</div></div></section>

      <section className="bg-gradient-to-br from-teal-800 via-teal-700 to-emerald-600 py-16 text-white"><div className="mx-auto grid max-w-6xl items-center gap-8 px-4 text-center sm:px-6 lg:grid-cols-[1fr_auto] lg:text-left"><div><h2 className="font-display text-3xl font-bold sm:text-4xl">Record the payment. Update the balance. Send the receipt.</h2><p className="mt-3 max-w-2xl text-base leading-7 text-teal-50/90">Keep every amount tied to the invoice and customer it belongs to, from the first installment to the final paid balance.</p></div><LandingPrimaryCta to={primaryCta} inverse>Record your first payment</LandingPrimaryCta></div></section>
    </CommercialLandingLayout>
  );
}
