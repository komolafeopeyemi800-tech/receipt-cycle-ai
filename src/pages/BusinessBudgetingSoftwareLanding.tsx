import { useState } from "react";
import { Link } from "react-router-dom";
import { CommercialLandingLayout, LandingPrimaryCta } from "@/components/marketing/CommercialLandingLayout";
import { Seo } from "@/components/Seo";
import { getRouteSeo } from "@/content/routesSeo";
import { landingFaqs } from "@/content/landingFaqs";

const budgetRows = [
  { name: "Software", spent: "$820", budget: "$1,100", remaining: "$280 left", progress: 75, icon: "fa-laptop", tone: "bg-violet-100 text-violet-700" },
  { name: "Transportation", spent: "$960", budget: "$1,200", remaining: "$240 left", progress: 80, icon: "fa-car", tone: "bg-sky-100 text-sky-700" },
  { name: "Supplies", spent: "$1,540", budget: "$1,700", remaining: "$160 left", progress: 91, icon: "fa-box-open", tone: "bg-amber-100 text-amber-700" },
  { name: "Marketing", spent: "$1,210", budget: "$1,500", remaining: "$290 left", progress: 81, icon: "fa-bullhorn", tone: "bg-rose-100 text-rose-700" },
];

function BudgetWorkspacePreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className="relative mx-auto w-full max-w-[650px] rounded-[2rem] bg-teal-950 p-4 shadow-2xl shadow-teal-950/20 sm:p-6">
      <div className="overflow-hidden rounded-[1.35rem] bg-[#f8faf9]">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-teal-700">Budgets</p>
            <p className="mt-1 font-display text-lg font-bold text-slate-950">Monthly category plan</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-teal-50 px-3 py-2 text-[9px] font-extrabold text-teal-800">
            <i className="fas fa-chevron-left" aria-hidden /> OCTOBER <i className="fas fa-chevron-right" aria-hidden />
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              ["Total budget", "$8,400", "text-slate-950"],
              ["Amount spent", "$5,260", "text-rose-700"],
              ["Remaining", "$3,140", "text-teal-700"],
            ].map(([label, value, tone]) => (
              <div key={label} className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200/70 sm:p-4">
                <p className="text-[7px] font-bold uppercase tracking-wide text-slate-400 sm:text-[8px]">{label}</p>
                <p className={`mt-2 font-display text-sm font-black sm:text-xl ${tone}`}>{value}</p>
              </div>
            ))}
          </div>
          <div className={`mt-4 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 ${compact ? "p-3" : "p-4"}`}>
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Category budgets</p>
              <span className="text-[8px] font-bold text-teal-700">Spent · Budget · Remaining</span>
            </div>
            <div className="mt-3 space-y-3">
              {budgetRows.slice(0, compact ? 3 : 4).map((row) => (
                <div key={row.name} className="grid grid-cols-[36px_1fr_auto] items-center gap-3 rounded-xl border border-slate-100 p-2.5 sm:p-3">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${row.tone}`}>
                    <i className={`fas ${row.icon} text-xs`} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2 text-[9px] font-extrabold text-slate-900">
                      <span className="truncate">{row.name}</span><span>{row.spent} / {row.budget}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-teal-600" style={{ width: `${row.progress}%` }} />
                    </div>
                  </div>
                  <span className="hidden rounded-full bg-teal-50 px-2 py-1 text-[8px] font-extrabold text-teal-700 sm:inline">{row.remaining}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryLimitPreview() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
      <div className="flex items-center justify-between">
        <div><p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Set budget</p><p className="mt-1 text-sm font-extrabold text-slate-950">Marketing</p></div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700"><i className="fas fa-bullhorn" aria-hidden /></span>
      </div>
      <label className="mt-5 block">
        <span className="text-[8px] font-bold uppercase tracking-wide text-slate-500">Monthly limit</span>
        <span className="mt-2 flex items-center rounded-xl border border-teal-600 bg-[#f8faf9] px-4 py-3 font-display text-xl font-black text-slate-950">$1,500.00</span>
      </label>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <span className="rounded-xl bg-slate-100 py-3 text-center text-[9px] font-extrabold text-slate-600">CANCEL</span>
        <span className="rounded-xl bg-teal-700 py-3 text-center text-[9px] font-extrabold text-white">SET LIMIT</span>
      </div>
    </div>
  );
}

function BudgetProgressPreview() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-[8px] font-black uppercase tracking-wider text-violet-700">Category detail</p><p className="mt-1 font-display text-lg font-bold">Software</p></div>
        <span className="rounded-full bg-teal-50 px-3 py-1.5 text-[9px] font-extrabold text-teal-700">75% used</span>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        {[["Budget", "$1,100"], ["Spent", "$820"], ["Remaining", "$280"]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-[7px] font-bold uppercase text-slate-400">{label}</p><p className="mt-1 text-[11px] font-black text-slate-900">{value}</p></div>)}
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-3/4 rounded-full bg-violet-600" /></div>
      <div className="mt-5 flex h-24 items-end gap-2" aria-hidden>
        {[26, 42, 35, 58, 48, 66, 75].map((height, index) => <span key={index} className="flex-1 rounded-t-md bg-violet-500" style={{ height: `${height}%`, opacity: 0.45 + index / 14 }} />)}
      </div>
    </div>
  );
}

function RecentPurchasesPreview() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
      <div className="flex items-center justify-between"><p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Recent category spending</p><span className="text-[9px] font-bold text-teal-700">October</span></div>
      <div className="mt-4 space-y-2">
        {[
          ["Cloud Desk", "Oct 3", "$49.00", "fa-cloud"],
          ["Design Suite", "Oct 8", "$89.00", "fa-pen-ruler"],
          ["Team Scheduler", "Oct 14", "$32.00", "fa-calendar-check"],
        ].map(([merchant, date, amount, icon]) => <div key={merchant} className="flex items-center gap-3 rounded-xl bg-[#f8faf9] p-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-700"><i className={`fas ${icon} text-xs`} aria-hidden /></span><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-extrabold text-slate-900">{merchant}</p><p className="mt-0.5 text-[8px] font-semibold text-slate-500">{date} · Software</p></div><strong className="text-[10px] text-rose-700">-{amount}</strong></div>)}
      </div>
    </div>
  );
}

function MonthWorkflowVisual() {
  const stages = [
    { title: "Choose October", body: "Pick the month you are planning", icon: "fa-calendar-days", tone: "bg-teal-300 text-teal-950" },
    { title: "Set category limits", body: "Add an amount only where a limit helps", icon: "fa-sliders", tone: "bg-violet-300 text-violet-950" },
    { title: "Record expenses", body: "Saved purchases update category spending", icon: "fa-receipt", tone: "bg-amber-300 text-amber-950" },
    { title: "Open the category", body: "Check progress and recent purchases", icon: "fa-chart-column", tone: "bg-rose-300 text-rose-950" },
  ];
  return (
    <div className="relative min-h-[650px] overflow-hidden rounded-3xl bg-teal-950 p-6 text-white sm:p-8">
      <div className="absolute -right-24 -top-20 h-64 w-64 rounded-full bg-teal-400/20" />
      <div className="absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-violet-500/20" />
      <p className="relative font-display text-2xl font-bold">One month, four steps</p>
      <div className="relative mt-8 space-y-4">
        {stages.map((stage, index) => <div key={stage.title} className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur"><div className="flex items-center gap-4"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stage.tone}`}><i className={`fas ${stage.icon}`} aria-hidden /></span><div><p className="text-[9px] font-black uppercase tracking-wider text-teal-200">STEP {index + 1}</p><p className="mt-1 font-display text-lg font-bold">{stage.title}</p></div></div><p className="mt-3 text-sm leading-6 text-teal-50/75">{stage.body}</p></div>)}
      </div>
      <div className="relative mt-5 rounded-2xl bg-white p-5 text-slate-950"><div className="flex items-center justify-between"><div><p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Where the month stands</p><p className="mt-1 font-display text-xl font-black">$3,140 remaining</p></div><span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700"><i className="fas fa-wallet" aria-hidden /></span></div></div>
    </div>
  );
}

const audiences = [
  {
    id: "owner",
    title: "Small-business owners",
    body: "Sort everyday costs into categories that match how your business really spends. The monthly view shows whether supplies, marketing, software and transport still fit your plan, before you decide what to change.",
    image: "/landing/audiences/budget-small-business-owner.webp",
    alt: "A small-business owner planning category budgets at a shop counter",
    width: 1585,
  },
  {
    id: "consultant",
    title: "Independent consultants",
    body: "Plan for subscriptions, project travel, client meetings and professional tools, without treating every month the same. The category detail view links a changing workload to the purchases using each budget.",
    image: "/landing/audiences/budget-independent-consultant.webp",
    alt: "An independent consultant organizing monthly spending categories",
    width: 1586,
  },
  {
    id: "service",
    title: "Service-business operators",
    body: "Give fuel, tools, materials, regular bills and field costs their own limits. If a category moves faster than expected, open its recent transactions to see whether the work changed or the plan needs a fix.",
    image: "/landing/audiences/budget-service-operator.webp",
    alt: "A service-business operator reviewing tool and transport spending",
    width: 1586,
  },
  {
    id: "team",
    title: "Small operations teams",
    body: "Use one month and one set of categories to talk about spending. Everyone can look at the same budget, amount spent, amount left and transactions, with no need to merge private spreadsheets first.",
    image: "/landing/audiences/budget-small-operations-team.webp",
    alt: "A small operations team reviewing category spending together",
    width: 1585,
  },
];

const faqItems = landingFaqs("/business-budgeting-software").map(({ q, a }) => [q, a] as const);

export default function BusinessBudgetingSoftwareLanding() {
  const seo = getRouteSeo("/business-budgeting-software");
  const primaryCta = "/signup?intent=budget";
  const [activeAudienceId, setActiveAudienceId] = useState("owner");
  const activeAudience = audiences.find((audience) => audience.id === activeAudienceId) ?? audiences[0];

  const outcomes = [
    ["fa-layer-group", "Plan by expense category", "One monthly number cannot tell you which part of the business needs more room. Set budgets for the costs worth watching. The rest still shows up as normal spending."],
    ["fa-scale-balanced", "See your limit next to your spending", "Each budget sits beside the amount spent. You do not need a separate file for the plan."],
    ["fa-wallet", "See the amount remaining", "See what is left in each category and across the month. If you go over, you will see a negative number. Receipt Cycle does not stop the purchase."],
    ["fa-calendar-days", "Give every month its own plan", "Move back or forward by month. Seasonal work, renewals, travel and big purchases do not have to fit one fixed budget."],
    ["fa-list-check", "Trace every total to real purchases", "Open a category to see the percent used and recent expenses. Every total links back to the records behind it."],
  ];

  const categoryExamples = [
    ["Software", "Monthly tools, hosting, storage and services can share one limit. Check the transaction list before you assume every subscription is still needed.", "fa-laptop", "bg-violet-100 text-violet-800"],
    ["Transportation", "Fuel, local transport, parking and similar costs change with your work schedule. Compare the month with your plan while you still remember why.", "fa-car", "bg-sky-100 text-sky-800"],
    ["Bills", "Give regular operating bills a category when a monthly cap helps. The budget does not pay or negotiate them. It just gives the total a visible limit.", "fa-file-invoice-dollar", "bg-amber-100 text-amber-800"],
    ["Health", "If your business tracks health or safety costs, keep that category and its records consistent. Receipt Cycle does not decide tax or policy treatment.", "fa-heart-pulse", "bg-rose-100 text-rose-800"],
    ["Education", "Courses, books, workshops and training can be their own spending group when they are part of your business.", "fa-graduation-cap", "bg-emerald-100 text-emerald-800"],
    ["Entertainment", "Events or hospitality costs often need more than a number. Pair the limit with clear notes, and use your own policy for what belongs here.", "fa-ticket", "bg-fuchsia-100 text-fuchsia-800"],
  ];

  const resources = [
    { title: "Catch subscription creep", description: "Check monthly software costs before they quietly grow.", href: "/blog/catch-subscription-creep", icon: "fa-arrows-rotate" },
    { title: "Track business expenses", description: "Keep cleaner expense records so every budget comparison starts with good data.", href: "/blog/freelancers-guide-tracking-business-expenses", icon: "fa-receipt" },
    { title: "AI in business finance", description: "Learn where AI can help with money questions and where you still need to check.", href: "/blog/ai-in-finance-personal-business-money-management", icon: "fa-wand-magic-sparkles" },
  ];

  return (
    <CommercialLandingLayout ctaLabel="Set a budget" ctaHref={primaryCta} announcement="Plan monthly spending by category, with your expenses in view">
      {seo ? <Seo {...seo} /> : null}

      <section className="relative overflow-hidden bg-[#f8f5ee] py-16 sm:py-20 lg:py-24">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-amber-100/80 blur-3xl" />
        <div className="absolute -right-28 bottom-0 h-80 w-80 rounded-full bg-teal-100/70 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16 grid-cols-1">
          <div className="max-w-xl">
            <h1 className="text-balance font-display text-4xl font-bold leading-[1.04] tracking-[-0.04em] sm:text-5xl lg:text-[3.5rem]">
              <span className="block text-slate-950">Business budgeting software</span>{" "}
              <span className="mt-1 block text-teal-700">that keeps spending in view</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">Set monthly category limits, see them next to what you have spent, and open the purchases behind every total.</p>
            <div className="mt-8">
              <LandingPrimaryCta to={primaryCta}>Set your first budget</LandingPrimaryCta>
              <p className="mt-3 text-sm font-medium text-slate-500">No credit card required. Cancel paid plans anytime.</p>
            </div>
          </div>
          <BudgetWorkspacePreview compact />
        </div>
      </section>

      <section className="bg-[#dff5ef] py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center"><h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">A monthly plan tied to what you actually buy</h2><p className="mt-4 text-base leading-7 text-slate-600">Small business budgeting software works best when your plan and your expenses sit side by side.</p></div>
          <div className="mt-12 grid gap-4 md:grid-cols-6 grid-cols-1">
            {outcomes.map(([icon, title, body], index) => <article key={title} className={`rounded-3xl p-6 text-white shadow-sm ${index === 0 ? "bg-teal-950" : index === 1 ? "bg-teal-800" : index === 2 ? "bg-emerald-700" : index === 3 ? "bg-slate-800" : "bg-violet-700"} ${index < 3 ? "md:col-span-2" : "md:col-span-3"}`}><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15"><i className={`fas ${icon}`} aria-hidden /></span><h3 className="mt-5 font-display text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-7 text-white/80">{body}</p></article>)}
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-28 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center"><h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Budgeting features that help you decide what to do next</h2><p className="mt-4 text-base leading-7 text-slate-600">Set your plan, see where you stand, and dig into any category. No wall of percentages.</p></div>
          <div className="mt-12 grid gap-5 lg:grid-cols-12 grid-cols-1">
            <article className="rounded-3xl bg-[#eef8f5] p-6 sm:p-8 lg:col-span-7"><BudgetWorkspacePreview compact /><h3 className="mt-8 font-display text-2xl font-bold">See the whole month first, then one category</h3><p className="mt-3 text-sm leading-7 text-slate-600">Total budget, spending in budgeted categories, and the amount left show where you stand. Category rows show how you got there. Spending outside budgeted categories still shows in the category list and stays in your expense records.</p></article>
            <article className="rounded-3xl bg-[#fff1c7] p-6 sm:p-8 lg:col-span-5"><CategoryLimitPreview /><h3 className="mt-8 font-display text-2xl font-bold">Set a limit where it helps</h3><p className="mt-3 text-sm leading-7 text-slate-700">Choose an expense category and enter a monthly amount above zero. A limit gives a repeat cost a target. You do not have to plan every small purchase.</p></article>
            <article className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8 lg:col-span-5"><BudgetProgressPreview /><h3 className="mt-8 font-display text-2xl font-bold">See percent used and money amounts together</h3><p className="mt-3 text-sm leading-7 text-slate-300">The category detail shows budget, amount spent, amount left and monthly progress together. Percent used is a quick signal. The money amounts tell you what it means.</p></article>
            <article className="rounded-3xl bg-[#e9e3ff] p-6 sm:p-8 lg:col-span-7"><RecentPurchasesPreview /><h3 className="mt-8 font-display text-2xl font-bold">Follow the total back to recent purchases</h3><p className="mt-3 text-sm leading-7 text-slate-700">A progress bar can show that software spending is high. It cannot tell you why. Recent transactions show the merchant, date and amount, so you can spot renewals, duplicates or a purchase you meant to make.</p></article>
            <article className="rounded-3xl bg-[#f8faf9] p-6 sm:p-8 lg:col-span-5"><div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80"><div className="flex items-center justify-between"><button type="button" className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100" aria-label="Previous month"><i className="fas fa-chevron-left" aria-hidden /></button><div className="text-center"><p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Selected period</p><p className="mt-1 font-display text-xl font-black">October</p></div><button type="button" className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100" aria-label="Next month"><i className="fas fa-chevron-right" aria-hidden /></button></div></div><h3 className="mt-8 font-display text-2xl font-bold">Change months without starting over</h3><p className="mt-3 text-sm leading-7 text-slate-600">A seasonal order, yearly renewal, conference or quiet stretch may call for a different plan. Switch months and keep the same categories.</p></article>
            <article className="rounded-3xl bg-teal-800 p-6 text-white sm:p-8 lg:col-span-7"><div className="grid gap-3 sm:grid-cols-3 grid-cols-1">{[["$8,400", "Budgeted"], ["$5,260", "Recorded"], ["$3,140", "Remaining"]].map(([value, label]) => <div key={label} className="rounded-2xl bg-white/10 p-5"><p className="font-display text-2xl font-black text-teal-200">{value}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-teal-50/70">{label}</p></div>)}</div><h3 className="mt-8 font-display text-2xl font-bold">Keep budget versus actual easy to read</h3><p className="mt-3 text-sm leading-7 text-teal-50/80">Expense budget software should make the comparison obvious. Receipt Cycle works it out from the monthly limits you set and the expenses in those categories.</p></article>
          </div>
        </div>
      </section>

      <section className="bg-teal-950 py-14 text-white"><div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-7 px-4 sm:px-6 lg:flex-row lg:items-center"><div><h2 className="font-display text-3xl font-bold sm:text-4xl">Plan for the next expense before it shows up</h2><p className="mt-3 max-w-2xl text-base leading-7 text-teal-100/80">Start with the categories you worry about most. Add more limits only if they help.</p></div><LandingPrimaryCta to={primaryCta} inverse>Set your first budget</LandingPrimaryCta></div></section>

      <section id="workflow" className="scroll-mt-28 bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="grid items-stretch gap-12 lg:grid-cols-[1fr_0.86fr] grid-cols-1"><div><h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Build a monthly budget you can come back to</h2><p className="mt-5 text-base leading-7 text-slate-600">Business expense budgeting works best as a short routine. The plan guides your spending, and your transactions are there when a month goes differently than you expected.</p><ol className="mt-9 space-y-8">{[
          ["Choose the month you want to plan", "Start with one month, not a guess for the whole year. Look ahead for renewals, travel, equipment, busy seasons or a campaign that could make this month different."],
          ["Set limits for the categories worth watching", "Add a monthly amount to software, transport, supplies, marketing, bills or any other category. You do not need to budget every category for the summary to be useful."],
          ["Record expenses with the correct category", "The amount spent is only as good as your records. Check imported, scanned or typed-in expenses, and change the category when a purchase belongs somewhere else."],
          ["Open the category before changing the plan", "Check percent used, what is left, and recent transactions. Then decide if it was a cost you could avoid, a timing difference, or a real business need."],
        ].map(([title, body], index) => <li key={title} className="grid grid-cols-[48px_1fr] gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-700 font-display text-lg font-bold text-white">{index + 1}</span><div><h3 className="font-display text-xl font-bold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{body}</p></div></li>)}</ol></div><MonthWorkflowVisual /></div></div>
      </section>

      <section className="bg-[#f8f5ee] py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="mx-auto max-w-3xl text-center"><h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Build expense categories around how your business spends</h2><p className="mt-4 text-base leading-7 text-slate-600">Food, transportation, bills, health, entertainment and education may show up in a standard category set. The right monthly budget depends on your business. These examples show how a category can help you review spending. They do not tell you how much to set.</p></div><div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3 grid-cols-1">{categoryExamples.map(([title, body, icon, tone], index) => <article key={title} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70"><div className="flex items-start justify-between"><span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}><i className={`fas ${icon}`} aria-hidden /></span><span className="font-display text-4xl font-black text-slate-100">0{index + 1}</span></div><h3 className="mt-6 font-display text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{body}</p></article>)}</div></div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] grid-cols-1"><div><h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Budget versus actual only helps when your spending records are right</h2><p className="mt-5 text-base leading-7 text-slate-600">A business budget tracker cannot fix bad records. Each expense needs the right amount, date and category. Receipt capture and manual entry build that history. A quick review keeps a software renewal out of office supplies and a vehicle cost out of marketing.</p><p className="mt-4 text-base leading-7 text-slate-600">When your records are consistent, the monthly comparison shows you how your money is going. You can see how much of the limit is used, what is left, and which recent purchases moved the numbers.</p><div className="mt-7 flex flex-wrap gap-3"><Link to="/ai-receipt-scanner" className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-5 text-sm font-bold text-white">Explore receipt capture</Link><Link to="/business-travel-expense-tracker" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700">Organize travel expenses</Link></div></div><div className="rounded-3xl bg-[#eef8f5] p-6 sm:p-8"><div className="grid gap-4 sm:grid-cols-2 grid-cols-1"><div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Category limit</p><p className="mt-2 font-display text-3xl font-black">$1,700</p><p className="mt-2 text-xs leading-5 text-slate-500">The amount chosen for supplies this month.</p></div><div className="rounded-2xl bg-teal-800 p-5 text-white"><p className="text-[8px] font-bold uppercase tracking-wider text-teal-200">Recorded expenses</p><p className="mt-2 font-display text-3xl font-black">$1,540</p><p className="mt-2 text-xs leading-5 text-teal-50/70">The saved supply transactions in the selected period.</p></div></div><div className="mt-4 rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-center justify-between text-xs font-extrabold"><span>Budget used</span><span>91%</span></div><div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-[91%] rounded-full bg-amber-500" /></div><div className="mt-4 flex items-center justify-between"><span className="text-xs font-bold text-slate-500">Amount remaining</span><strong className="font-display text-xl text-teal-700">$160</strong></div></div></div></div></div>
      </section>

      <section className="bg-slate-950 py-20 text-white sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] grid-cols-1"><div><h2 className="font-display text-3xl font-bold sm:text-4xl">Simple budget management software, not a whole finance department</h2><p className="mt-5 text-base leading-7 text-slate-300">Receipt Cycle gives you monthly limits and category-level review. It can fit into a bigger planning process. It does not replace accounting, forecasting, banking, procurement or your own judgment.</p><p className="mt-4 text-base leading-7 text-slate-300">If you are comparing budget management software, decide whether you need a simple spending view or a full planning suite. Be honest about it, so you do not ask a simple tool to do the wrong job.</p></div><div className="grid gap-4 sm:grid-cols-2 grid-cols-1">{[
          ["What it does", "Sets monthly category limits and compares them with saved expense transactions.", "fa-circle-check", "text-teal-300"],
          ["What it shows", "Total budget, amount spent, what is left, percent used and recent purchases.", "fa-chart-pie", "text-violet-300"],
          ["What it does not enforce", "It does not decline a card purchase, approve an expense, or stop a payment.", "fa-ban", "text-rose-300"],
          ["What it does not forecast", "It does not predict future cash flow, revenue, payroll, tax or inventory.", "fa-cloud-sun", "text-amber-300"],
        ].map(([title, body, icon, tone]) => <article key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6"><i className={`fas ${icon} ${tone}`} aria-hidden /><h3 className="mt-4 font-display text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-300">{body}</p></article>)}</div></div></div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="mx-auto max-w-3xl text-center"><h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Business budgeting for different kinds of businesses</h2><p className="mt-4 text-base leading-7 text-slate-600">A small business budget app should fit how you spend, not force every owner into the same plan. Pick a business type to see how the monthly view helps.</p></div><div className="mt-12 grid items-stretch gap-5 lg:grid-cols-[1.35fr_0.65fr] grid-cols-1"><div id="budget-audience-panel" role="tabpanel" aria-labelledby={`budget-audience-tab-${activeAudience.id}`} className="min-w-0 overflow-hidden rounded-3xl border border-teal-100 bg-[#f8f5ee] shadow-sm"><img key={activeAudience.image} src={activeAudience.image} alt={activeAudience.alt} width={activeAudience.width} height="992" loading="lazy" decoding="async" sizes="(min-width: 1024px) 720px, (min-width: 640px) 90vw, 100vw" className="block h-auto w-full" /></div><div className="overflow-hidden rounded-3xl border border-slate-200 bg-white px-5 sm:px-6" role="tablist" aria-label="Business budgeting audiences">{audiences.map((audience) => { const isActive = audience.id === activeAudience.id; return <div key={audience.id} className="border-b border-slate-200 last:border-b-0"><button id={`budget-audience-tab-${audience.id}`} type="button" role="tab" aria-selected={isActive} aria-controls="budget-audience-panel" tabIndex={isActive ? 0 : -1} onClick={() => setActiveAudienceId(audience.id)} onKeyDown={(event) => { const currentIndex = audiences.findIndex((item) => item.id === audience.id); let nextIndex = currentIndex; if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = (currentIndex + 1) % audiences.length; if (event.key === "ArrowUp" || event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + audiences.length) % audiences.length; if (event.key === "Home") nextIndex = 0; if (event.key === "End") nextIndex = audiences.length - 1; if (nextIndex === currentIndex) return; event.preventDefault(); const next = audiences[nextIndex]; setActiveAudienceId(next.id); requestAnimationFrame(() => document.getElementById(`budget-audience-tab-${next.id}`)?.focus()); }} className="flex min-h-16 w-full items-center justify-between gap-4 py-4 text-left font-display text-lg font-bold text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500">{audience.title}<span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${isActive ? "rotate-45 bg-teal-700 text-white" : "bg-teal-50 text-teal-700"}`}><i className="fas fa-plus text-xs" aria-hidden /></span></button>{isActive ? <p className="pb-6 pr-4 text-sm leading-7 text-slate-600">{audience.body}</p> : null}</div>; })}</div></div></div>
      </section>

      <section className="bg-[#eef8f5] py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="grid items-center gap-12 lg:grid-cols-[0.82fr_1.18fr] grid-cols-1"><div><h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Connect your spending plan to the rest of your expenses</h2><p className="mt-5 text-base leading-7 text-slate-600">Your budget is not a stand-alone forecast. Receipt capture and expense entry create the records. Categories decide where spending is counted. The monthly budget is your target. Reports can then use the same organized history.</p><p className="mt-4 text-base leading-7 text-slate-600">That link is what makes a business budgeting app better than a number typed into a document and forgotten. Each step helps the next, and the original transaction is always there to check.</p></div><div className="grid gap-3 sm:grid-cols-2 grid-cols-1">{[
          ["1", "Capture", "Save a receipt, or type in the expense with the right amount and date.", "bg-teal-950 text-white"],
          ["2", "Categorize", "Put the purchase in the expense group your monthly plan uses.", "bg-white text-slate-950"],
          ["3", "Compare", "See the limit, what you spent, and what is left.", "bg-[#fff1c7] text-slate-950"],
          ["4", "Review", "Open recent transactions before you change the plan or make the next purchase.", "bg-[#e9e3ff] text-slate-950"],
        ].map(([number, title, body, tone]) => <article key={number} className={`rounded-2xl p-6 shadow-sm ${tone}`}><span className="font-display text-3xl font-black opacity-40">{number}</span><h3 className="mt-4 font-display text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-7 opacity-75">{body}</p></article>)}</div></div></div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6"><h2 className="text-center font-display text-3xl font-bold text-slate-950 sm:text-4xl">Guides for your monthly review</h2><div className="mt-10 grid gap-5 md:grid-cols-3 grid-cols-1">{resources.map((resource) => <article key={resource.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><i className={`fas ${resource.icon}`} aria-hidden /></span><h3 className="mt-5 font-display text-xl font-bold">{resource.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{resource.description}</p><Link to={resource.href} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-teal-700 hover:text-teal-900">Open resource<i className="fas fa-arrow-right text-xs" aria-hidden /></Link></article>)}</div></div>
      </section>

      <section className="bg-[#f8f5ee] py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="grid overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 lg:grid-cols-2 grid-cols-1"><div className="bg-[#fff1c7] p-8 sm:p-10"><h2 className="font-display text-3xl font-bold text-slate-950">Get help when a category total looks wrong</h2><p className="mt-4 text-base leading-7 text-slate-600">Check the selected month first. Then look at the transactions in the category, confirm their dates and types, and fix any that belong elsewhere. Still stuck? Contact support and tell us the page, your device, and the step where it went wrong.</p><div className="mt-7 flex flex-wrap gap-3"><Link to="/contact" className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-5 text-sm font-bold text-white">Contact us</Link><Link to="/faq" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700">Visit the FAQ</Link></div></div><div className="grid gap-px bg-slate-200 sm:grid-cols-3 lg:grid-cols-1 grid-cols-1">{[
          ["fa-calendar-check", "Confirm the month", "A purchase outside the selected month will not count toward that month's spending."],
          ["fa-tags", "Review the category", "An expense with the right date still hits the wrong budget if its category is wrong."],
          ["fa-envelope", "Product support", "Email support@receiptcycle.com with enough detail for us to reproduce the problem."],
        ].map(([icon, title, body]) => <div key={title} className="bg-[#f8faf9] p-6"><i className={`fas ${icon} text-teal-700`} aria-hidden /><h3 className="mt-3 text-sm font-extrabold">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{body}</p></div>)}</div></div></div>
      </section>

      <section id="faq" className="scroll-mt-28 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6"><h2 className="text-center font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Frequently Asked Questions</h2><div className="mt-10 divide-y divide-slate-300 border-y border-slate-300">{faqItems.map(([question, answer], index) => <details key={question} className="group py-1" open={index === 0}><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-sm font-extrabold text-slate-900 marker:content-none sm:text-base">{question}<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700 transition group-open:rotate-45"><i className="fas fa-plus text-xs" aria-hidden /></span></summary><p className="max-w-4xl pb-6 pr-12 text-sm leading-7 text-slate-600">{answer}</p></details>)}</div></div>
      </section>

      <section className="bg-gradient-to-br from-teal-800 via-teal-700 to-emerald-600 py-16 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 text-center sm:px-6 lg:grid-cols-[1fr_auto] lg:text-left grid-cols-1"><div><h2 className="font-display text-3xl font-bold sm:text-4xl">Turn next month into a plan you can check</h2><p className="mt-3 max-w-2xl text-base leading-7 text-teal-50/90">Set the category limits that matter, record expenses accurately, and open the purchases behind your progress.</p></div><LandingPrimaryCta to={primaryCta} inverse>Set your first budget</LandingPrimaryCta></div>
      </section>
    </CommercialLandingLayout>
  );
}
