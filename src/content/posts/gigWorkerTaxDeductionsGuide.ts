import type { BlogPost } from "../blogPosts";
import { PLAY_STORE_URL } from "../../lib/schema";

/**
 * "Gig Worker Tax Deductions: Track Miles & Receipts for DoorDash, Uber".
 * Written with the human-writing skill (.claude/skills/human-writing): specific facts, honest limits, no hype.
 * The URL (slug) is unchanged on purpose. The ideas (track miles daily, standard rate versus actual expenses, price a gig
 * against the cost per mile, phone and gear deductions, 1099 forms, set money aside) were adapted from creators' videos.
 * No creator, company or app is named or quoted, and no wording is copied.
 *
 * IRS facts were read on 2026-10-29:
 *  - Standard mileage rates page (reviewed 2026-07-28): business rate 2025 = 70 cents; 2026 = 72.5 cents Jan 1 to Jun 30
 *    and 76 cents Jul 1 to Dec 31.
 *  - Publication 463 (2025), chapter 4: choose the standard rate in the first year for an owned car; tolls and business
 *    parking are deductible on top of the standard rate; fines are not deductible; commuting is not deductible.
 *  - Form 1099-K: $20,000 and more than 200 transactions for third party settlement organizations (OBBBA); 1099-NEC:
 *    $2,000 for payments in tax years beginning after 2025; income is taxable whether or not a form arrives.
 *  - Self-employment tax 15.3% (reviewed 2026-06-27); estimated tax if you expect to owe $1,000 or more (2026-09-25).
 * Receipt Cycle does NOT record GPS miles. The article says so and tells readers to keep a mileage log separately.
 */
const IMG = "/landing/blog/go-paperless-with-receipts";

export const gigWorkerTaxDeductionsPost: BlogPost = {
  slug: "gig-workers-income-expense-guide",
  title: "Gig Worker Tax Deductions: Track Miles & Receipts for DoorDash, Uber",
  description:
    "Gig worker tax deductions for DoorDash, Uber, Lyft and Instacart drivers: how to track miles, receipts and income, use the 2026 mileage rate, and keep proof for taxes.",
  featuredImage: "/landing/blog-gig-workers-income-expense-guide.webp?v=1",
  featuredImageAlt: "Gig worker in a car checking a phone and a receipt while tracking delivery miles and expenses",
  featuredImageWidth: 1600,
  featuredImageHeight: 900,
  category: "Expense tracking",
  datePublished: "2026-04-17",
  dateModified: "2026-10-29",
  author: "Philip",
  readMinutes: 12,
  tags: ["gig worker tax deductions", "DoorDash mileage deduction", "delivery driver expenses", "track gig income and expenses", "1099 expense tracker"],
  tldr:
    "Gig workers pay their own taxes, so every mile and every receipt counts. Keep a daily mileage log, pick the standard mileage rate or actual expenses (not both), save receipts for tolls, parking and gear, and record each payout. Do that and you claim more write-offs with proof.",
  keyTakeaways: [
    "Track every business mile in a log the day you drive, with the date, miles, places and purpose.",
    "Choose the standard mileage rate or actual car expenses. You cannot deduct both.",
    "Tolls and business parking are deductible on top of the standard rate. Tickets and fines are not.",
    "A 1099 may not arrive, but your gig income is still taxable.",
    "Set money aside from every payout, because no one withholds your tax.",
  ],
  resources: [
    {
      label: "IRS: Standard mileage rates",
      href: "https://www.irs.gov/tax-professionals/standard-mileage-rates",
      note: "The business, medical and charitable rates, reviewed July 28, 2026.",
    },
    {
      label: "IRS Publication 463: Travel, Gift, and Car Expenses",
      href: "https://www.irs.gov/publications/p463",
      note: "Chapter 4 covers car expenses, tolls, parking and commuting.",
    },
    {
      label: "IRS: Understanding your Form 1099-K",
      href: "https://www.irs.gov/businesses/understanding-your-form-1099-k",
      note: "When a payment app or marketplace sends a 1099-K.",
    },
    {
      label: "IRS: 1099-K threshold under the One, Big, Beautiful Bill",
      href: "https://www.irs.gov/newsroom/irs-issues-faqs-on-form-1099-k-threshold-under-the-one-big-beautiful-bill-dollar-limit-reverts-to-20000",
      note: "The $20,000 and 200 transaction rule.",
    },
    {
      label: "IRS: Self-employment tax (Social Security and Medicare taxes)",
      href: "https://www.irs.gov/businesses/small-businesses-self-employed/self-employment-tax-social-security-and-medicare-taxes",
      note: "The 15.3% rate, reviewed June 27, 2026.",
    },
    {
      label: "IRS: Estimated taxes",
      href: "https://www.irs.gov/businesses/small-businesses-self-employed/estimated-taxes",
      note: "Who pays estimated tax and how.",
    },
    {
      label: "IRS: About Schedule C (Form 1040)",
      href: "https://www.irs.gov/forms-pubs/about-schedule-c-form-1040",
      note: "Where sole proprietors report business income and expenses.",
    },
  ],
  body: [
    {
      kind: "p",
      text: "If you drive for DoorDash, Uber, Uber Eats, Lyft, Grubhub or Instacart, you are running a business. Nobody takes out your taxes, and the app only shows you part of what you spent to earn each payout.",
    },
    {
      kind: "p",
      text: "Here is the good news. Many gig workers pay more tax than they need to, simply because they did not track their miles and receipts. This guide shows how to track gig income and expenses, what gig worker tax deductions look like, and how to keep proof for every dollar you claim.",
    },
    { kind: "h2", text: "Which gig worker tax deductions can you claim?", id: "gig-worker-tax-deductions" },
    {
      kind: "p",
      text: "The rule of thumb is simple: if you bought it or paid it to earn gig income, it may be deductible. The business share counts, not the personal share. Here are the ones gig workers use most, and the ones that never qualify.",
    },
    {
      kind: "table",
      caption: "Common gig worker deductions and what proof to keep",
      columns: ["Expense", "Deductible?", "Keep this proof"],
      rows: [
        ["Business miles (standard rate)", "Yes", "A mileage log with date, miles, places and purpose"],
        ["Gas, repairs and insurance (actual method)", "The business share", "Receipts and your yearly mileage totals"],
        ["Tolls and business parking", "Yes, on top of the standard rate", "A receipt or toll statement"],
        ["Phone and data plan", "The business share", "Your bill and a note on how you work out the percentage"],
        ["Phone mount, hot bag, cooler, cart", "Yes, if used for gig work", "The receipt"],
        ["Mileage app or other work subscriptions", "Yes", "The invoice or the monthly charge"],
        ["Speeding and parking tickets", "No", "Nothing to keep. Fines are not deductible"],
        ["Your drive to your first stop", "Often treated as commuting", "Ask your tax professional"],
      ],
      tones: true,
    },
    {
      kind: "p",
      text: "The IRS spells out the car rules in [Publication 463](https://www.irs.gov/publications/p463). It says you can deduct business-related tolls and parking in addition to the standard mileage rate, that parking at your regular place of work is a nondeductible commuting cost, and that fines for traffic violations are not deductible.",
    },
    { kind: "h2", text: "How to track miles for DoorDash and other delivery apps", id: "how-to-track-miles-for-delivery-apps" },
    {
      kind: "p",
      text: "Mileage is the biggest deduction for most drivers, and the one people under-report. The app's year-end summary usually shows only the miles during a trip or delivery. Miles you drive to a pickup, or back toward busy areas between orders, may be missing from it.",
    },
    {
      kind: "p",
      text: "Keep your own log. Update it every day you work, because a log written from memory at year end is weak proof. For each day, write down:",
    },
    {
      kind: "ul",
      items: [
        "The date and your odometer reading at the start and end of your business driving.",
        "The miles you drove for gig work.",
        "The first pickup and the last drop-off.",
        "The business purpose, such as food delivery or rideshare.",
        "Any tolls or business parking, with the receipts.",
      ],
    },
    {
      kind: "callout",
      title: "A note on tracking tools",
      text: "Receipt Cycle does not record GPS miles. Use a mileage app or a simple notebook for the log, and use Receipt Cycle for your receipts, income and expenses. Put your yearly mileage totals in a note so everything sits together.",
    },
    {
      kind: "p",
      text: "Where does the business day start? The IRS treats ordinary commuting as nondeductible, with exceptions that include having your home as your principal place of business. Many drivers count from the first pickup to the last drop-off. Whether the drive to that first stop counts depends on your setup, so ask your tax professional.",
    },
    { kind: "h2", text: "Standard mileage rate or actual expenses?", id: "standard-mileage-rate-or-actual-expenses" },
    {
      kind: "p",
      text: "You have two ways to deduct a car you use for gig work. You can use one in a tax year, not both.",
    },
    {
      kind: "table",
      caption: "Standard mileage rate versus actual expenses",
      columns: ["", "Standard mileage rate", "Actual expenses"],
      rows: [
        ["How it works", "A set amount for each business mile", "The business share of what you really spend on the car"],
        ["Proof you need", "A mileage log, plus tolls and parking", "A mileage log, plus receipts for gas, repairs, insurance and more"],
        ["Best for", "Simple tracking and high-mileage drivers", "Higher car costs and lower mileage"],
        ["Watch out for", "Choose it in the first year you use an owned car for business", "You also track the whole year's miles to get your business percentage"],
      ],
      tones: true,
    },
    {
      kind: "p",
      text: "The [IRS standard mileage rate](https://www.irs.gov/tax-professionals/standard-mileage-rates) for business was 70 cents a mile in 2025. For 2026 it is 72.5 cents for January 1 to June 30 and 76 cents for July 1 to December 31. Rates change, so check the page before you file.",
    },
    {
      kind: "p",
      text: "Pub 463 says that if you want the standard rate for a car you own, you must choose it in the first year the car is available for business. Later, you can pick either method. Ask your tax professional which one gives you the better result, because the answer depends on your car and your mileage.",
    },
    { kind: "h3", text: "A worked example, with example numbers", id: "worked-example" },
    {
      kind: "p",
      text: "Say Jordan drives for several apps. In a year, Jordan drives 20,000 miles in total, and 12,000 of them are for gig work. That is a 60 percent business share.",
    },
    {
      kind: "table",
      caption: "Jordan's year under each method (example numbers)",
      columns: ["Method", "Calculation", "Deduction"],
      rows: [
        ["Standard mileage rate (2025 rate)", "12,000 miles × $0.70", "$8,400"],
        ["Actual expenses", "$9,000 of car costs × 60%", "$5,400"],
      ],
      tones: true,
    },
    {
      kind: "p",
      text: "In this example the standard rate wins. With a more expensive car and fewer miles, the answer could flip. That is why it pays to run both numbers with your own totals.",
    },
    { kind: "h2", text: "Is that gig worth the miles?", id: "is-that-gig-worth-the-miles" },
    {
      kind: "p",
      text: "Here is a trick that helps you decide whether to accept an order. You are not paid for the drive back toward busy areas, or for the trip to your next pickup. So a rough check is to double the mileage rate.",
    },
    {
      kind: "p",
      text: "At the 2026 rate of 76 cents, that is $1.52 per paid mile. If an offer pays less than that per mile, it probably loses money on vehicle costs alone, before taxes. This is a rule of thumb, not a calculation of your real costs, but it is a useful way to turn down the worst offers.",
    },
    { kind: "h2", text: "Track gig income, and know when a 1099 comes", id: "track-gig-income-and-1099" },
    {
      kind: "p",
      text: "Your payouts come from several places and arrive on different days. Record each one as income, so you can see a full week at a glance. Do not wait for a form.",
    },
    {
      kind: "p",
      text: "Platforms may send a Form 1099-NEC or a 1099-K. For payments in tax years beginning after 2025, the 1099-NEC threshold is $2,000, up from $600. For a payment app or marketplace, the IRS says a 1099-K is needed only above $20,000 and more than 200 transactions, though a state may set a lower limit. See the [IRS 1099-K guidance](https://www.irs.gov/newsroom/irs-issues-faqs-on-form-1099-k-threshold-under-the-one-big-beautiful-bill-dollar-limit-reverts-to-20000).",
    },
    {
      kind: "p",
      text: "The key point is this: your gig income is taxable whether or not a form arrives. Ask each platform how to get your tax forms by email, so nothing gets lost in the mail.",
    },
    { kind: "h2", text: "Set money aside before it disappears", id: "set-money-aside" },
    {
      kind: "p",
      text: "Because no one withholds tax from your payouts, you pay it yourself. The [IRS puts the self-employment tax rate at 15.3 percent](https://www.irs.gov/businesses/small-businesses-self-employed/self-employment-tax-social-security-and-medicare-taxes), and that sits on top of income tax. People in business for themselves generally make [estimated tax payments](https://www.irs.gov/businesses/small-businesses-self-employed/estimated-taxes) if they expect to owe $1,000 or more when they file.",
    },
    {
      kind: "p",
      text: "A simple habit is to move a fixed share of every payout into a separate savings account the day you get paid. A tax professional can help you choose the share. You report your income and expenses on [Schedule C](https://www.irs.gov/forms-pubs/about-schedule-c-form-1040). Our [freelancer tax receipt tracker](/freelancer-tax-receipt-tracker) page shows how the records fit that form.",
    },
    { kind: "h2", text: "How to track gig expenses with Receipt Cycle", id: "how-to-track-gig-expenses-with-receipt-cycle" },
    {
      kind: "p",
      text: "Here is a routine that takes a few minutes a day. Receipt Cycle is an expense tracker for gig workers that keeps receipts, income and exports together, on your phone and on the web.",
    },
    {
      kind: "ol",
      items: [
        "Scan each receipt the moment you get it. Tolls, parking, a phone mount and a hot bag all go in. The [AI receipt scanner](/ai-receipt-scanner) reads the merchant, date and total.",
        "Speak the ones with no receipt. Say it out loud, for example, eight dollars toll on the bridge. Receipt Cycle builds the record and you check it.",
        "Record each payout as income, so your week adds up in one place.",
        "Upload your bank or card statement once a month to catch anything you forgot.",
        "Every Friday, spend five minutes fixing categories and missing receipts.",
      ],
    },
    {
      kind: "cta",
      title: "Start tracking your gig expenses",
      text: "Scan your next toll or parking receipt and see how fast it goes. Try the web app free for 7 days, or get the Android app.",
      label: "Get the Android app",
      href: PLAY_STORE_URL,
      note: "Or start your 7-day free trial on the web.",
    },
    {
      kind: "p",
      text: "At tax time, filter your records by category, such as fuel or supplies, and export just those receipts. The Excel report starts with totals by category, month, week and day, and every transaction has a link to its stored receipt. Hand it to your accountant, or keep it for your own filing.",
    },
    {
      kind: "image",
      src: `${IMG}/receipt-cycle-find-receipts-filter-export.webp`,
      alt: "Receipt Cycle Analysis page filtering receipts by category with export buttons for gig worker expenses",
      caption: "Filter by category or merchant to see only those receipts, then export that exact list.",
      width: 1120,
      height: 540,
      title: "Filter and export gig worker expenses in Receipt Cycle",
    },
    { kind: "h2", text: "Mistakes that cost gig workers money", id: "mistakes-that-cost-gig-workers-money" },
    {
      kind: "ul",
      items: [
        "Relying on the app's yearly mileage summary and missing the miles between orders.",
        "Writing the mileage log months later from memory.",
        "Throwing away toll and parking receipts because they are small.",
        "Trying to deduct speeding or parking tickets.",
        "Mixing personal and gig spending in one account.",
        "Spending every payout and having nothing left for tax.",
      ],
    },
    {
      kind: "p",
      text: "Want a bigger picture of what to track? Read our case study on [how one freelancer tracks business expenses](/blog/freelancers-guide-tracking-business-expenses), the guide to [self-employed deductions people miss](/blog/catch-subscription-creep), and how to [manage receipts as a side hustler](/blog/import-bank-statements-expense-tracking). For proof rules, see [how to go paperless with receipts](/blog/go-paperless-with-receipts).",
    },
    {
      kind: "links",
      title: "Keep reading",
      items: [
        { label: "How to maximize your tax refund by scanning receipts", href: "/blog/maximize-tax-refund-by-scanning-receipts" },
        { label: "How to organize receipts for your accountant", href: "/blog/best-expense-tracker-for-freelancers" },
        { label: "Business travel expense tracker", href: "/business-travel-expense-tracker" },
        { label: "Payment tracking software", href: "/payment-tracking-software" },
      ],
    },
    {
      kind: "cta",
      title: "Start your 7-day free trial",
      text: "Track receipts, income and expenses in one place, and export a clean file for tax time.",
      label: "Start your 7-day free trial",
      href: "/signup",
      note: "No credit card needed for the web app.",
    },
  ],
  faq: [
    {
      question: "Can I deduct both gas and mileage?",
      answer:
        "No. You use either the standard mileage rate or actual car expenses in a year, not both. The standard rate is meant to cover gas and other running costs. Tolls and business parking are the exception, because you can deduct them on top of the standard rate.",
    },
    {
      question: "What is the IRS mileage rate for 2026?",
      answer:
        "The IRS business rate for 2026 is 72.5 cents a mile for January 1 to June 30 and 76 cents for July 1 to December 31. It was 70 cents in 2025. Check the [IRS page](https://www.irs.gov/tax-professionals/standard-mileage-rates) before you file.",
    },
    {
      question: "How do I track miles for DoorDash, Uber or Lyft?",
      answer:
        "Keep a log every day you work: the date, odometer readings or miles, your first pickup and last drop-off, and the business purpose. Do not rely only on the app's yearly summary, because it may leave out miles between trips. Receipt Cycle does not record GPS miles, so use a mileage app or notebook for the log.",
    },
    {
      question: "Do I need receipts for tolls and parking?",
      answer:
        "Yes, keep them. [Publication 463](https://www.irs.gov/publications/p463) says you can deduct business-related tolls and parking in addition to the standard mileage rate. Scan each one the day you get it, or upload your toll account statement.",
    },
    {
      question: "Do gig workers get a 1099?",
      answer:
        "Sometimes. The 1099-NEC threshold is $2,000 for payments in tax years beginning after 2025, and a 1099-K generally needs more than $20,000 and more than 200 transactions. Even without a form, your gig income is taxable, so keep your own records.",
    },
    {
      question: "Do I pay quarterly taxes as a gig worker?",
      answer:
        "Usually, yes. The [IRS says](https://www.irs.gov/businesses/small-businesses-self-employed/estimated-taxes) people in business for themselves generally make estimated tax payments if they expect to owe $1,000 or more when they file.",
    },
    {
      question: "Can I deduct part of my phone bill?",
      answer:
        "Yes, the share you use for gig work. If half your phone use is for gig apps, you can generally deduct half of the cost. Keep the bill and a note on how you worked out the percentage.",
    },
    {
      question: "What is the best way to track gig work expenses?",
      answer:
        "Scan or upload each receipt the day you get it, record every payout as income, and keep a separate mileage log. [Receipt Cycle](/signup) keeps receipts, income and exports together. The free plan includes a 7-day Pro trial with up to 25 transactions, and [Pro](/pricing) is $3.50 a month, $35 a year, or $60 once.",
    },
  ],
};
