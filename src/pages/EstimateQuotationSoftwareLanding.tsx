import { useState } from "react";
import { Link } from "react-router-dom";
import { CommercialLandingLayout, LandingPrimaryCta } from "@/components/marketing/CommercialLandingLayout";
import { Seo } from "@/components/Seo";
import { getRouteSeo } from "@/content/routesSeo";

const primaryCta = "/signup?intent=estimate";

const statusTone: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-700 ring-slate-200",
  Sent: "bg-blue-50 text-blue-700 ring-blue-200",
  Accepted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Expired: "bg-rose-50 text-rose-700 ring-rose-200",
};

function StatusPill({ status }: { status: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold ring-1 ${statusTone[status]}`}>{status}</span>;
}

function EstimateDocument({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`bg-white text-slate-800 shadow-xl ring-1 ring-slate-200 ${compact ? "rounded-xl p-4" : "rounded-2xl p-5 sm:p-7"}`}>
      <div className="flex items-start justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white"><i className="fas fa-file-signature text-sm" aria-hidden /></div>
          <div><p className="text-xs font-black text-slate-950">Northstar Studio</p><p className="mt-0.5 text-[8px] text-slate-400">Brand and web design</p></div>
        </div>
        <div className="text-right"><p className="text-sm font-black tracking-wide text-teal-800 sm:text-base">ESTIMATE</p><p className="text-[9px] font-bold text-slate-500">EST-0048</p></div>
      </div>

      <div className="grid grid-cols-2 gap-3 py-4 text-[9px]">
        <div><p className="font-bold uppercase tracking-wider text-slate-400">Prepared for</p><p className="mt-1 font-extrabold text-slate-800">Harbor &amp; Co.</p>{!compact ? <p className="mt-0.5 text-slate-400">Website refresh project</p> : null}</div>
        <div className="text-right leading-4 text-slate-500"><p>Issued Sep 18, 2026</p><p>Valid until Oct 18, 2026</p></div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-100">
        <div className="grid grid-cols-[1fr_40px_70px] bg-slate-50 px-3 py-2 text-[8px] font-bold uppercase tracking-wider text-slate-400"><span>Service</span><span>Qty</span><span className="text-right">Amount</span></div>
        <div className="grid grid-cols-[1fr_40px_70px] items-center px-3 py-2.5 text-[9px]"><div><p className="font-bold">Website design</p>{!compact ? <p className="text-[8px] text-slate-400">Responsive design and build</p> : null}</div><span>1</span><span className="text-right font-bold">$2,500</span></div>
        <div className="grid grid-cols-[1fr_40px_70px] items-center border-t border-slate-100 px-3 py-2.5 text-[9px]"><div><p className="font-bold">Development</p>{!compact ? <p className="text-[8px] text-slate-400">Frontend implementation</p> : null}</div><span>20</span><span className="text-right font-bold">$2,400</span></div>
      </div>

      <div className="ml-auto mt-4 w-40 space-y-1.5 text-[9px] text-slate-500">
        <div className="flex justify-between"><span>Subtotal</span><strong className="text-slate-700">$4,900.00</strong></div>
        {!compact ? <div className="flex justify-between"><span>Discount 5%</span><strong className="text-emerald-700">-$245.00</strong></div> : null}
        {!compact ? <div className="flex justify-between"><span>Tax 8%</span><strong className="text-slate-700">$372.40</strong></div> : null}
        <div className="flex justify-between border-t border-slate-200 pt-2 text-xs font-black text-teal-800"><span>Total</span><span>$5,027.40</span></div>
      </div>
    </div>
  );
}

function EstimateWorkspacePreview() {
  const estimates = [
    { number: "EST-0048", customer: "Harbor & Co.", status: "Sent", total: "$5,027.40" },
    { number: "EST-0047", customer: "Marlow Creative", status: "Accepted", total: "$1,800.00" },
    { number: "EST-0046", customer: "Fieldwork Labs", status: "Expired", total: "$3,250.00" },
  ];

  return (
    <div className="relative mx-auto max-w-2xl" role="img" aria-label="Sample Receipt Cycle estimate workspace with sent, accepted, and expired estimates">
      <div className="overflow-hidden rounded-[26px] border border-white/70 bg-white shadow-[0_28px_90px_rgba(15,118,110,0.22)] ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-4 py-3">
          <div className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-300" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-300" /></div>
          <span className="rounded-full bg-white px-3 py-1 text-[9px] font-bold text-slate-500 ring-1 ring-slate-200">Estimate workspace</span>
        </div>
        <div className="grid min-h-[390px] grid-cols-[68px_1fr] sm:grid-cols-[118px_1fr]">
          <div className="bg-slate-950 p-3 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600"><i className="fas fa-receipt text-sm" aria-hidden /></div>
            <div className="mt-8 space-y-2 text-[9px] text-slate-400">
              <div className="rounded-lg px-2 py-2"><i className="fas fa-chart-pie sm:mr-2" aria-hidden /><span className="hidden sm:inline">Overview</span></div>
              <div className="rounded-lg bg-white/10 px-2 py-2 font-bold text-white"><i className="fas fa-file-signature sm:mr-2" aria-hidden /><span className="hidden sm:inline">Estimates</span></div>
              <div className="rounded-lg px-2 py-2"><i className="fas fa-file-invoice sm:mr-2" aria-hidden /><span className="hidden sm:inline">Invoices</span></div>
              <div className="rounded-lg px-2 py-2"><i className="fas fa-users sm:mr-2" aria-hidden /><span className="hidden sm:inline">Customers</span></div>
            </div>
          </div>
          <div className="min-w-0 bg-[#f8fbfa] p-3 sm:p-5">
            <div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-wider text-teal-700">Sales documents</p><p className="mt-1 text-base font-black text-slate-950">Estimates</p></div><span className="rounded-lg bg-teal-700 px-3 py-2 text-[9px] font-bold text-white">+ Create estimate</span></div>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="grid grid-cols-[1fr_1fr_65px] bg-slate-50 px-3 py-2 text-[8px] font-bold uppercase text-slate-400 sm:grid-cols-[80px_1fr_75px_80px]"><span>Estimate</span><span>Customer</span><span className="hidden sm:block">Status</span><span className="text-right">Total</span></div>
              {estimates.map((estimate) => <div key={estimate.number} className="grid grid-cols-[1fr_1fr_65px] items-center border-t border-slate-100 px-3 py-3 text-[9px] sm:grid-cols-[80px_1fr_75px_80px]"><span className="font-extrabold text-slate-800">{estimate.number}</span><span className="truncate text-slate-500">{estimate.customer}</span><span className="hidden sm:block"><StatusPill status={estimate.status} /></span><span className="text-right font-bold text-slate-800">{estimate.total}</span></div>)}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-10 -right-3 w-[56%] min-w-[215px] rotate-1 sm:-right-8 sm:w-[52%]"><EstimateDocument compact /></div>
    </div>
  );
}

function EstimateBuilderPreview() {
  const steps = ["Basic info", "Items", "Totals", "Preview"];
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl sm:p-6" role="img" aria-label="Four-step Receipt Cycle estimate builder">
      <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-teal-700">Estimate builder</p><p className="mt-1 text-lg font-black">Create estimate</p></div><span className="text-xs font-bold text-slate-400">EST-0049</span></div>
      <div className="mt-6 flex items-start">
        {steps.map((step, index) => <div key={step} className="flex flex-1 items-start"><div className="flex flex-col items-center"><span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${index < 2 ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-400"}`}>{index === 0 ? <i className="fas fa-check" aria-hidden /> : index + 1}</span><span className={`mt-1 text-center text-[8px] font-bold ${index === 1 ? "text-teal-700" : "text-slate-400"}`}>{step}</span></div>{index < steps.length - 1 ? <span className={`mt-4 h-px flex-1 ${index === 0 ? "bg-teal-600" : "bg-slate-200"}`} /> : null}</div>)}
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 p-4"><div><p className="text-sm font-extrabold">Services and products</p><p className="text-xs text-slate-400">Describe the proposed work</p></div><span className="rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-teal-700">Add item</span></div>
        {[{ name: "Website design", quantity: "1", rate: "$2,500" }, { name: "Development", quantity: "20", rate: "$120" }].map((item) => <div key={item.name} className="grid grid-cols-[1fr_42px_70px] items-center gap-2 border-b border-slate-100 p-4 text-xs last:border-0"><div><p className="font-bold text-slate-800">{item.name}</p><p className="mt-1 text-[10px] text-slate-400">Service line item</p></div><span className="rounded-lg bg-slate-50 p-2 text-center">{item.quantity}</span><span className="rounded-lg bg-slate-50 p-2 text-right font-bold">{item.rate}</span></div>)}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px]"><div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-400">Discount</p><p className="mt-1 font-black">5%</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-400">Tax</p><p className="mt-1 font-black">8%</p></div><div className="rounded-xl bg-teal-50 p-3"><p className="text-teal-600">Total</p><p className="mt-1 font-black text-teal-800">$5,027</p></div></div>
    </div>
  );
}

function EstimateValidityPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm" role="img" aria-label="Estimate issue date and validity period">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pricing window</p><p className="mt-1 text-sm font-black text-slate-900">30 days</p></div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><i className="fas fa-calendar-days" aria-hidden /></span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-5 text-center">
        <div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-bold uppercase text-slate-400">Issued</p><p className="mt-1 text-xs font-extrabold">Sep 18</p></div>
        <i className="fas fa-arrow-right text-xs text-amber-500" aria-hidden />
        <div className="rounded-xl bg-amber-50 p-3"><p className="text-[9px] font-bold uppercase text-amber-700">Valid until</p><p className="mt-1 text-xs font-extrabold">Oct 18</p></div>
      </div>
    </div>
  );
}

function EstimateStatusPreview() {
  const estimates = [
    ["EST-0049", "Draft"],
    ["EST-0048", "Sent"],
    ["EST-0047", "Accepted"],
    ["EST-0046", "Expired"],
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-sm" role="img" aria-label="Estimate records separated by draft, sent, accepted, and expired status">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Estimate status</p><p className="mt-1 text-sm font-black text-slate-900">Know what needs attention</p></div><i className="fas fa-signal text-teal-700" aria-hidden /></div>
      <div className="divide-y divide-slate-100">
        {estimates.map(([number, status]) => <div key={number} className="flex items-center justify-between px-5 py-3 text-xs"><span className="font-extrabold text-slate-700">{number}</span><StatusPill status={status} /></div>)}
      </div>
    </div>
  );
}

function ConversionPreview() {
  return (
    <div className="relative mx-auto flex min-h-[560px] w-full max-w-md flex-col justify-between overflow-hidden rounded-[32px] bg-slate-950 p-6 text-white shadow-xl sm:p-8 lg:min-h-[650px]" role="img" aria-label="Accepted estimate converted to an editable invoice draft">
      <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-teal-500/20 blur-2xl" />
      <div className="relative rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-300">Customer estimate</p><p className="mt-1 text-xl font-black">EST-0047</p></div><StatusPill status="Accepted" /></div>
        <div className="mt-5 space-y-3 text-[11px]">
          <div className="flex justify-between rounded-xl bg-white/5 px-4 py-3"><span className="text-slate-300">Website design</span><strong>$2,500</strong></div>
          <div className="flex justify-between rounded-xl bg-white/5 px-4 py-3"><span className="text-slate-300">Development</span><strong>$2,400</strong></div>
          <div className="flex justify-between border-t border-white/10 pt-4 text-sm"><span>Total</span><strong className="text-teal-300">$5,027.40</strong></div>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center py-5">
        <div className="h-full min-h-12 w-px bg-gradient-to-b from-teal-400 via-teal-300 to-white/30" />
        <span className="my-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white shadow-lg shadow-teal-950"><i className="fas fa-arrow-down" aria-hidden /></span>
        <div className="h-full min-h-12 w-px bg-gradient-to-b from-white/30 to-white" />
      </div>

      <div className="relative rounded-3xl bg-white p-5 text-slate-900">
        <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Editable invoice draft</p><p className="mt-1 text-xl font-black">INV-0054</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600">Draft</span></div>
        <div className="mt-5 grid grid-cols-2 gap-3 text-[10px]"><div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-400">Customer</p><p className="mt-1 font-bold">Marlow Creative</p></div><div className="rounded-xl bg-teal-50 p-3"><p className="text-teal-600">Carried forward</p><p className="mt-1 font-bold text-teal-900">Items, tax, terms</p></div></div>
        <p className="mt-4 text-[10px] leading-5 text-slate-500">Review every retained detail before the invoice is sent.</p>
      </div>
    </div>
  );
}

const faqItems = [
  { question: "What is the difference between an estimate and a quotation?", answer: "Businesses often use estimate, quote, and quotation for the same pre-sale document. Local practice and the certainty of the price can affect the label. Receipt Cycle provides a structured estimate document for describing proposed work, pricing, validity, and terms." },
  { question: "What can I include in a Receipt Cycle estimate?", answer: "Choose a customer, add products or services, descriptions, quantities, and rates, then set tax, a discount, notes, terms, an issue date, and a validity period. Review the calculated total before saving or sending the estimate." },
  { question: "Can I preview and send an estimate?", answer: "Yes. Receipt Cycle includes an estimate preview and a send or share action. The current workflow hands the document to your device or email tools; it does not claim automatic email-open tracking or an approval portal." },
  { question: "Which estimate statuses are available?", answer: "Receipt Cycle supports draft, sent, accepted, and expired estimates. A rejected status is not currently implemented, so the page does not claim that feature." },
  { question: "Can I convert an accepted estimate into an invoice?", answer: "Yes. Convert the estimate into an editable invoice draft. The customer, line items, quantities, rates, tax, discount, and terms remain available so you can review the invoice before sending it." },
  { question: "Is this contractor estimating software?", answer: "Receipt Cycle can suit contractors who quote defined services and rates. It is not positioned as construction takeoff, materials database, job-costing, tender, or project-scheduling software." },
  { question: "Does Receipt Cycle work as estimate and invoice software?", answer: "Yes. Estimates and invoices are connected parts of the Receipt Cycle sales workflow. Use the estimate before approval, convert accepted work into a draft invoice, then manage billing from the invoice workspace." },
];

export default function EstimateQuotationSoftwareLanding() {
  const [activeAudienceId, setActiveAudienceId] = useState("freelancers");
  const seo = getRouteSeo("/estimate-quotation-software");

  const benefitCards = [
    { icon: "fa-list-check", title: "Define the proposed work", body: "Turn a conversation into specific services, descriptions, quantities, and rates. Customers can see what the proposed price covers before the job begins.", tone: "bg-teal-900" },
    { icon: "fa-calculator", title: "Check the price before sending", body: "Review the subtotal, discount, tax, and final total together. A visible calculation makes an estimate easier to explain and revise.", tone: "bg-teal-700" },
    { icon: "fa-calendar-check", title: "Set a useful validity period", body: "Add an estimate date and a valid-until date so an old quotation does not appear open indefinitely when prices or availability change.", tone: "bg-emerald-700" },
    { icon: "fa-signal", title: "Know which stage it reached", body: "Separate draft, sent, accepted, and expired estimates. Status gives each quotation a place in the workflow instead of leaving it in an unnamed file.", tone: "bg-cyan-700" },
    { icon: "fa-file-circle-check", title: "Carry accepted work forward", body: "Convert an accepted estimate into an editable invoice draft while keeping its customer, line items, pricing adjustments, and terms connected.", tone: "bg-slate-900" },
  ];

  const audienceGroups = [
    {
      id: "freelancers",
      title: "Freelancers",
      body: "Price one-off projects, retainers, and defined deliverables before billing begins. Add each service, quantity, and rate, then give the customer a validity period and a document they can review before work starts.",
      image: "/landing/audiences/estimate-freelancer.webp",
      alt: "Hand-drawn illustration of a freelancer preparing a project estimate in a home studio",
    },
    {
      id: "consultants",
      title: "Consultants",
      body: "Present advisory work as time blocks, workshops, reviews, or fixed-price services. Notes and terms provide room for commercial context, while accepted status records when the proposal is ready to move into billing.",
      image: "/landing/audiences/estimate-consultant.webp",
      alt: "Hand-drawn illustration of a consultant reviewing a service quotation with a client",
    },
    {
      id: "creative-studios",
      title: "Creative studios",
      body: "Organize design, production, content, photography, and development into separate line items. The customer sees how the total was built, and the studio keeps the approved details ready for the invoice draft.",
      image: "/landing/audiences/estimate-creative-studio.webp",
      alt: "Hand-drawn illustration of a creative studio team pricing a design and content project",
    },
    {
      id: "service-contractors",
      title: "Service contractors",
      body: "Prepare straightforward service quotations with quantities, rates, tax, discounts, and a pricing window. Receipt Cycle supports service estimates without claiming construction takeoffs, material databases, or job-costing tools.",
      image: "/landing/audiences/estimate-service-contractor.webp",
      alt: "Hand-drawn illustration of a service contractor reviewing an estimate with a customer",
    },
  ];

  const activeAudience = audienceGroups.find((group) => group.id === activeAudienceId) ?? audienceGroups[0];

  const resources = [
    { title: "Move approved work into invoicing", description: "See how quote and invoice software keeps accepted details moving into customer billing without starting again.", href: "/invoice-software/", icon: "fa-file-invoice-dollar" },
    { title: "Compare Receipt Cycle plans", description: "Review the current plan options before choosing how your business will use the sales workspace.", href: "/pricing", icon: "fa-tags" },
    { title: "Get straightforward product answers", description: "Browse common account and workflow questions or contact the Receipt Cycle team for help.", href: "/faq", icon: "fa-circle-question" },
  ];

  return (
    <CommercialLandingLayout ctaLabel="Create an estimate" ctaHref={primaryCta} announcement="Prepare the estimate first, then move accepted work into invoicing">
      {seo ? <Seo title={seo.title} description={seo.description} path={seo.path} ogImage={seo.ogImage} ogImageAlt={seo.ogImageAlt} ogType={seo.ogType} structuredData={seo.structuredData} /> : null}

      <section className="relative overflow-hidden bg-white py-14 sm:py-20 lg:py-24">
        <div className="absolute -right-32 top-8 h-72 w-72 rounded-full bg-teal-100/70 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 sm:px-8 lg:grid-cols-[0.84fr_1.16fr] lg:gap-16">
          <div className="max-w-xl">
            <h1 className="text-balance font-display text-4xl font-bold leading-[1.04] tracking-[-0.04em] sm:text-5xl lg:text-[3.5rem]"><span className="block text-slate-950">Estimate software for </span><span className="mt-1 block text-teal-700">service businesses and independent contractors</span></h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">Create a detailed estimate, send it for review, and turn accepted work into an editable invoice without entering the job twice.</p>
            <div className="mt-8"><LandingPrimaryCta to={primaryCta}>Create your first estimate</LandingPrimaryCta><p className="mt-3 text-sm font-medium text-slate-500">No credit card required. Cancel paid plans anytime.</p></div>
          </div>
          <div className="pb-10 sm:pb-14"><EstimateWorkspacePreview /></div>
        </div>
      </section>

      <section id="features" className="scroll-mt-28 bg-[#eef8f5] py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center"><h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Price the work before you bill for it</h2><p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">Whether you call it estimating software or quotation software, its job is different from invoice software. It helps a customer understand the proposed scope, price, and timing before either side treats the work as approved.</p></div>
          <div className="mt-12 grid gap-4 md:grid-cols-6">
            {benefitCards.map((card, index) => <article key={card.title} className={`${card.tone} rounded-2xl p-6 text-white shadow-sm ${index < 3 ? "md:col-span-2" : "md:col-span-3"}`}><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-teal-50"><i className={`fas ${card.icon}`} aria-hidden /></span><h3 className="mt-5 font-display text-xl font-bold">{card.title}</h3><p className="mt-3 text-sm leading-6 text-teal-50/85">{card.body}</p></article>)}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center"><h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Estimate tools for every stage before invoicing</h2><p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">A useful quotation maker does more than format a document. Receipt Cycle brings creation, pricing, preview, status, validity, and invoice conversion into one practical sales workflow.</p></div>
          <div className="mt-12 grid gap-5 lg:grid-cols-12">
            <article className="overflow-hidden rounded-3xl bg-[#eef8f5] p-5 sm:p-7 lg:col-span-7">
              <EstimateBuilderPreview />
              <div className="mx-auto max-w-xl pb-1 pt-7"><h3 className="font-display text-2xl font-bold">Build the estimate one part at a time</h3><p className="mt-3 text-sm leading-7 text-slate-600">Choose the customer and dates first. Then add services, descriptions, quantities, rates, tax, discounts, notes, and terms before opening the final preview.</p></div>
            </article>

            <article className="overflow-hidden rounded-3xl bg-[#f8f5ee] p-5 sm:p-7 lg:col-span-5">
              <EstimateDocument />
              <h3 className="mt-7 font-display text-2xl font-bold">Review the document customers receive</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">Check the customer, proposed services, dates, adjustments, terms, and total in one view. Fix a missing line item or pricing error before the estimate leaves your business.</p>
            </article>

            <article className="rounded-3xl bg-[#fff1c7] p-5 sm:p-7 lg:col-span-5">
              <EstimateValidityPreview />
              <h3 className="mt-6 font-display text-2xl font-bold">Give the price a validity period</h3>
              <p className="mt-3 text-sm leading-7 text-slate-700">Show when the estimate was issued and how long the price remains open. If the customer returns later, expired status signals that the quotation may need another review.</p>
            </article>

            <article className="rounded-3xl bg-[#dff5ef] p-5 sm:p-7 lg:col-span-7">
              <div className="grid items-center gap-6 sm:grid-cols-[0.95fr_1.05fr]">
                <div><h3 className="font-display text-2xl font-bold">Separate drafts from customer decisions</h3><p className="mt-3 text-sm leading-7 text-slate-600">Draft, sent, accepted, and expired records should not look like identical files in a folder. Status shows which quotations are still being prepared and which can move forward.</p></div>
                <EstimateStatusPreview />
              </div>
            </article>

            <article className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8 lg:col-span-5">
              <div className="flex items-center gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500 text-white"><i className="fas fa-file-lines" aria-hidden /></span><div><p className="text-[10px] font-bold uppercase tracking-wider text-teal-300">Notes and terms</p><p className="mt-1 text-sm font-extrabold">Commercial context stays attached</p></div></div>
              <h3 className="mt-7 font-display text-2xl font-bold">Keep the conditions beside the price</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">Use notes and terms for assumptions, exclusions, timing, or the next step. The customer can review that context with the proposed amount instead of searching through another message.</p>
            </article>

            <article className="rounded-3xl bg-teal-700 p-6 text-white sm:p-8 lg:col-span-7">
              <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto_1fr]">
                <div className="rounded-2xl bg-white/10 p-5"><p className="text-[10px] font-bold uppercase tracking-wider text-teal-100">Accepted estimate</p><p className="mt-2 font-display text-2xl font-bold">EST-0047</p><p className="mt-2 text-xs text-teal-50/80">Customer, items, rates, tax, discount, and terms</p></div>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-teal-800"><i className="fas fa-arrow-right" aria-hidden /></span>
                <div className="rounded-2xl bg-white p-5 text-slate-900"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Editable invoice draft</p><p className="mt-2 font-display text-2xl font-bold">INV-0054</p><p className="mt-2 text-xs text-slate-500">Ready for a final review before sending</p></div>
              </div>
              <h3 className="mt-7 font-display text-2xl font-bold">Carry accepted work into billing</h3>
              <p className="mt-3 text-sm leading-7 text-teal-50/85">Convert the accepted estimate into an invoice draft without rebuilding the customer and pricing details. You still control the final review.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-teal-950 py-14 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-7 px-4 sm:px-6 lg:flex-row lg:items-center"><div><h2 className="font-display text-3xl font-bold sm:text-4xl">Send a price you can carry into the job</h2><p className="mt-3 max-w-2xl text-base leading-7 text-teal-100/80">Start with the scope and total, record the decision, then keep the approved details ready for invoicing.</p></div><LandingPrimaryCta to={primaryCta} inverse>Create your first estimate</LandingPrimaryCta></div>
      </section>

      <section id="workflow" className="scroll-mt-28 bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-stretch gap-12 lg:grid-cols-[1fr_0.88fr]">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">From estimate to accepted work to invoice</h2>
              <p className="mt-5 text-base leading-7 text-slate-600">Online estimate software and online quotation software should do more than produce a document. They should keep the customer response connected to what happens next.</p>
              <ol className="mt-8 space-y-6">
                <li className="grid grid-cols-[44px_1fr] gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-700 text-sm font-black text-white">1</span><div><h3 className="font-display text-xl font-bold">Build the estimate</h3><p className="mt-2 text-sm leading-7 text-slate-600">Choose the customer, add proposed services or products, enter quantities and rates, apply any tax or discount, and set the validity period. Save a draft while details are still changing, or mark it sent when the quotation leaves your business.</p></div></li>
                <li className="grid grid-cols-[44px_1fr] gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">2</span><div><h3 className="font-display text-xl font-bold">Record the decision</h3><p className="mt-2 text-sm leading-7 text-slate-600">Move an approved quotation to accepted status. If its pricing window passes, mark it expired. Receipt Cycle currently supports draft, sent, accepted, and expired statuses, keeping the workflow honest about what the product can track.</p></div></li>
                <li className="grid grid-cols-[44px_1fr] gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">3</span><div><h3 className="font-display text-xl font-bold">Create the invoice draft</h3><p className="mt-2 text-sm leading-7 text-slate-600">Convert the accepted estimate when billing is ready to begin. Receipt Cycle carries the customer, line items, quantities, rates, tax, discount, and terms into an editable invoice draft for a final review before sending.</p></div></li>
              </ol>
              <Link to="/invoice-software/" className="mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-teal-700 hover:text-teal-900">Explore invoice software after approval<i className="fas fa-arrow-right text-xs" aria-hidden /></Link>
            </div>
            <ConversionPreview />
          </div>
        </div>
      </section>

      <section className="bg-[#f7faf9] py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
            <div><h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Why a structured estimate beats another loose file</h2><p className="mt-5 text-base leading-7 text-slate-600">A document template can produce a presentable page. A spreadsheet can calculate a total. A generic estimate generator, quote generator, or quote maker may combine those two jobs, but it can still leave the customer decision disconnected from invoicing.</p><p className="mt-4 text-base leading-7 text-slate-600">Receipt Cycle keeps the estimate number, customer, dates, proposed work, totals, status, and future invoice relationship together. That makes it easier to reopen the record, understand what was offered, and continue after approval.</p></div>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="grid grid-cols-[1fr_1fr] bg-slate-950 px-5 py-4 text-xs font-extrabold text-white sm:px-7"><span>Documents and spreadsheets</span><span>Receipt Cycle estimate workspace</span></div>
              {[
                ["A file name has to carry the context.", "The estimate number, customer, status, and dates are visible together."],
                ["Line items and totals may use separate formulas or copied tables.", "Services, quantities, rates, discounts, and tax belong to the same estimate."],
                ["It is easy to forget whether a quote was still current.", "A validity period and expired status show when pricing needs another review."],
                ["Approval may live in an email while the document stays unchanged.", "Accepted status records the decision on the estimate itself."],
                ["The invoice often begins as another copy-and-paste task.", "Conversion creates an editable invoice draft from the accepted details."],
              ].map(([before, after]) => <div key={before} className="grid grid-cols-[1fr_1fr] border-t border-slate-200 text-sm leading-6"><p className="p-5 text-slate-500 sm:p-7">{before}</p><p className="border-l border-slate-200 bg-teal-50/50 p-5 font-medium text-slate-700 sm:p-7">{after}</p></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center"><h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">What a professional estimate should explain</h2><p className="mt-4 text-base leading-7 text-slate-600">A polished layout matters, but the document must also answer the practical questions a customer has before approving the work.</p></div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            <article className="overflow-hidden rounded-3xl border border-teal-100 bg-white shadow-sm">
              <div className="bg-teal-900 p-7 text-white"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><i className="fas fa-clipboard-list" aria-hidden /></span><h3 className="mt-5 font-display text-xl font-bold">What work is being proposed?</h3></div>
              <div className="space-y-4 p-7 text-sm leading-7 text-slate-600"><p>Give every service or product its own line item. The description names the deliverable or task.</p><p>Quantity and rate show how the price was built. When the scope changes, update the estimate before recording acceptance.</p></div>
            </article>
            <article className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-sm">
              <div className="bg-[#fff1c7] p-7"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white"><i className="fas fa-calculator" aria-hidden /></span><h3 className="mt-5 font-display text-xl font-bold">How was the total calculated?</h3></div>
              <div className="space-y-4 p-7 text-sm leading-7 text-slate-600"><p>Subtotal, discount, tax, and final total should agree with the line items above them.</p><p>Review each adjustment before sending. Use notes and terms for the commercial context that a number cannot provide.</p></div>
            </article>
            <article className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
              <div className="bg-[#dff5ef] p-7"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white"><i className="fas fa-route" aria-hidden /></span><h3 className="mt-5 font-display text-xl font-bold">What happens after review?</h3></div>
              <div className="space-y-4 p-7 text-sm leading-7 text-slate-600"><p>The validity date shows how long the offer remains open. Status records whether it is draft, sent, accepted, or expired.</p><p>Once approved work is ready for billing, conversion prepares an editable invoice draft from the accepted details.</p></div>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-teal-950 py-20 text-white sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center"><h2 className="font-display text-3xl font-bold sm:text-4xl">Product evidence instead of inflated promises</h2><p className="mt-4 text-base leading-7 text-teal-100/80">Receipt Cycle does not need invented ratings or vague claims to explain this workflow. These capabilities are present in the estimate experience today.</p></div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[
              ["Four-step estimate builder", "Basic information, line items, totals, and preview are separated into a guided sequence so each task has an obvious place."],
              ["Visible quotation status", "Quotation management software earns its place when draft, sent, accepted, and expired records can be separated instead of living as indistinguishable files in a folder."],
              ["Customer-ready preview", "The estimate preview brings the business, customer, dates, services, quantities, rates, adjustments, terms, and total into one document."],
              ["Editable invoice conversion", "Accepted estimate details become an invoice draft, not an automatically sent final invoice. You retain the chance to review and adjust it."],
            ].map(([title, body]) => <article key={title} className="rounded-2xl border border-white/10 bg-white/10 p-6"><h3 className="font-display text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-7 text-teal-50/80">{body}</p></article>)}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center"><h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Estimate software for the way service businesses work</h2><p className="mt-4 text-base leading-7 text-slate-600">Choose the type of work you sell to see how a quotation can support the conversation before billing starts.</p></div>
          <div className="mt-12 grid items-stretch gap-5 lg:grid-cols-[1.35fr_0.65fr]">
            <div id="estimate-audience-panel" role="tabpanel" aria-labelledby={`estimate-audience-tab-${activeAudience.id}`} className="min-w-0 overflow-hidden rounded-3xl border border-teal-100 bg-[#f8f5ee] shadow-sm">
              <img key={activeAudience.image} src={activeAudience.image} alt={activeAudience.alt} width="1586" height="992" loading="lazy" decoding="async" sizes="(min-width: 1024px) 720px, (min-width: 640px) 90vw, 100vw" className="block h-auto w-full" />
            </div>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white px-5 sm:px-6" role="tablist" aria-label="Estimate software audiences">
              {audienceGroups.map((group) => {
                const isActive = group.id === activeAudience.id;
                return (
                  <div key={group.id} className="border-b border-slate-200 last:border-b-0">
                    <button id={`estimate-audience-tab-${group.id}`} type="button" role="tab" aria-selected={isActive} aria-controls="estimate-audience-panel" tabIndex={isActive ? 0 : -1} onClick={() => setActiveAudienceId(group.id)} onKeyDown={(event) => {
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
                      requestAnimationFrame(() => document.getElementById(`estimate-audience-tab-${nextAudience.id}`)?.focus());
                    }} className="flex min-h-16 w-full items-center justify-between gap-4 py-4 text-left font-display text-lg font-bold text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500">
                      {group.title}
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${isActive ? "rotate-45 bg-teal-700 text-white" : "bg-teal-50 text-teal-700"}`}><i className="fas fa-plus text-xs" aria-hidden /></span>
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
            <div className="p-8 sm:p-10"><h2 className="font-display text-3xl font-bold text-slate-950">Get help before the quotation goes out</h2><p className="mt-4 text-base leading-7 text-slate-600">If the total, validity date, customer decision, or invoice conversion needs another look, check the relevant estimate guide first. For an account-specific problem, tell the Receipt Cycle team which estimate and step need attention.</p><div className="mt-7 flex flex-wrap gap-3"><Link to="/contact" className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-5 text-sm font-bold text-white">Contact us</Link><Link to="/faq" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-700">Visit the FAQ</Link></div></div>
            <div className="grid gap-px bg-slate-200 sm:grid-cols-3 lg:grid-cols-1">{[["fa-list-ol", "Estimate setup", "Check the customer, dates, line items, totals, and terms before opening the final preview."], ["fa-file-circle-check", "Invoice conversion", "See which accepted estimate details carry into the editable invoice draft."], ["fa-envelope", "Quotation support", "Send support@receiptcycle.com the estimate number and describe where the workflow stopped."]].map(([icon, title, body]) => <div key={title} className="bg-[#f8faf9] p-6"><i className={`fas ${icon} text-teal-700`} aria-hidden /><h3 className="mt-3 text-sm font-extrabold">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{body}</p></div>)}</div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6"><h2 className="text-center font-display text-3xl font-bold text-slate-950 sm:text-4xl">Continue with the right Receipt Cycle resource</h2><div className="mt-10 grid gap-5 md:grid-cols-3">{resources.map((resource) => <article key={resource.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><i className={`fas ${resource.icon}`} aria-hidden /></span><h3 className="mt-5 font-display text-xl font-bold">{resource.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{resource.description}</p><Link to={resource.href} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-teal-700 hover:text-teal-900">Open resource<i className="fas fa-arrow-right text-xs" aria-hidden /></Link></article>)}</div></div>
      </section>

      <section id="faq" className="scroll-mt-28 bg-[#f8f5ee] py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6"><h2 className="text-center font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Frequently Asked Questions</h2><div className="mt-10 divide-y divide-slate-300 border-y border-slate-300">{faqItems.map((item, index) => <details key={item.question} className="group py-1" open={index === 0}><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-sm font-extrabold text-slate-900 marker:content-none sm:text-base">{item.question}<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-teal-700 transition group-open:rotate-45"><i className="fas fa-plus text-xs" aria-hidden /></span></summary><p className="max-w-4xl pb-6 pr-12 text-sm leading-7 text-slate-600">{item.answer}</p></details>)}</div></div>
      </section>

      <section className="bg-gradient-to-br from-teal-800 via-teal-700 to-emerald-600 py-16 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 text-center sm:px-6 lg:grid-cols-[1fr_auto] lg:text-left"><div><h2 className="font-display text-3xl font-bold sm:text-4xl">Create the estimate before the work becomes an invoice</h2><p className="mt-3 max-w-2xl text-base leading-7 text-teal-50/90">Give the customer a defined scope, price, validity period, and next step. Keep accepted details ready when billing begins.</p></div><LandingPrimaryCta to={primaryCta} inverse>Create your first estimate</LandingPrimaryCta></div>
      </section>
    </CommercialLandingLayout>
  );
}
