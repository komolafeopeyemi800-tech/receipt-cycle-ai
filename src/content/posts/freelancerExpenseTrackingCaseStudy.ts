import type { BlogPost } from "../blogPosts";

/**
 * "How One Freelancer Tracks Business Expenses for Tax Time (A Case Study)".
 * Written with the human-writing skill (.claude/skills/human-writing): specific facts, honest limits, no hype.
 *
 * The case study person, Maya, is an illustrative composite and the article says so. It is built from a self-employed
 * creator's published spreadsheet routine and common freelancer situations. She is NOT a real customer and no real person
 * is quoted or credited with using Receipt Cycle. Do not turn her into a named real person or add testimonial claims
 * unless that person has agreed in writing.
 *
 * IRS facts were read from these pages on 2026-10-28: estimated taxes (reviewed 2026-09-25), self-employment tax (2026-06-27),
 * self-employed tax center (2026-09-27), Tax Topic 511 (2026-10-09), Recordkeeping (2026-05-01).
 */
const IMG = "/landing/blog/freelancer-expense-tracking-case-study";

export const freelancerExpenseTrackingCaseStudyPost: BlogPost = {
  slug: "freelancers-guide-tracking-business-expenses",
  title: "How One Freelancer Tracks Business Expenses for Tax Time (A Case Study)",
  description:
    "A freelancer case study: how Maya tracks income, expenses and tax savings in one place, with the IRS rules, a step-by-step system and exports for tax time.",
  featuredImage: "/landing/blog-freelancers-guide-tracking-business-expenses.webp?v=1",
  featuredImageAlt: "Freelancer at a desk tracking business expenses and income on a laptop and phone",
  featuredImageWidth: 1600,
  featuredImageHeight: 900,
  category: "Expense tracking",
  datePublished: "2026-04-17",
  dateModified: "2026-10-28",
  author: "Philip",
  readMinutes: 11,
  tags: ["freelancer expense tracker", "track business expenses", "self-employed taxes", "freelancer tax tracker", "case study"],
  tldr:
    "Maya is a 24-year-old freelancer with no employer taking out taxes. She tracks every payment and expense in one place, sets money aside on each payment for taxes, and exports one report for tax time. This case study shows her system, the IRS rules behind it, and how to copy it.",
  keyTakeaways: [
    "Freelancers pay their own taxes, so every payment needs a tax set-aside the day it arrives.",
    "The IRS says self-employed people generally pay estimated tax each quarter if they expect to owe $1,000 or more.",
    "Track income as it lands, including deposits and final payments, not only at month end.",
    "Keep business and personal spending apart, and capture a receipt for every business expense.",
    "One export at tax time, with a link to each receipt, saves your accountant hours.",
  ],
  resources: [
    {
      label: "IRS: Estimated taxes",
      href: "https://www.irs.gov/businesses/small-businesses-self-employed/estimated-taxes",
      note: "Who pays estimated tax and how, reviewed September 25, 2026.",
    },
    {
      label: "IRS: Self-employment tax (Social Security and Medicare taxes)",
      href: "https://www.irs.gov/businesses/small-businesses-self-employed/self-employment-tax-social-security-and-medicare-taxes",
      note: "The 15.3% rate and the additional Medicare tax, reviewed June 27, 2026.",
    },
    {
      label: "IRS: Self-employed individuals tax center",
      href: "https://www.irs.gov/businesses/small-businesses-self-employed/self-employed-individuals-tax-center",
      note: "Forms, Schedule C and Schedule SE, reviewed September 27, 2026.",
    },
    {
      label: "IRS: About Schedule C (Form 1040)",
      href: "https://www.irs.gov/forms-pubs/about-schedule-c-form-1040",
      note: "Where sole proprietors report business income and expenses.",
    },
    {
      label: "IRS Tax Topic 511: Business travel expenses",
      href: "https://www.irs.gov/taxtopics/tc511",
      note: "Includes the 50% limit on business meals, reviewed October 9, 2026.",
    },
    {
      label: "IRS: Recordkeeping",
      href: "https://www.irs.gov/businesses/small-businesses-self-employed/recordkeeping",
      note: "What a business record should prove.",
    },
    {
      label: "IRS: How long should I keep records?",
      href: "https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records",
      note: "The 3, 6 and 7 year rules.",
    },
  ],
  body: [
    {
      kind: "p",
      text: "Maya has no paycheck. She has four kinds of income, a shoebox of receipts that used to live in her tote bag, and a tax bill that arrives whether or not she is ready for it.",
    },
    {
      kind: "p",
      text: "This is the story of Maya, a freelancer we built from common situations, and how she turned that mess into one simple routine for tracking business expenses. Copy what works. It is a case study and a how-to in one.",
    },
    {
      kind: "cta",
      title: "Start your 7-day free trial",
      text: "Try the same setup yourself: track income and expenses, scan receipts, and export for tax time in one place.",
      label: "Start your 7-day free trial",
      href: "/signup",
      note: "No credit card needed for the web app.",
    },
    { kind: "h2", text: "Meet Maya: a freelancer with no one withholding her taxes", id: "meet-maya" },
    {
      kind: "p",
      text: "Maya is 24. She manages social media for two small brands and makes custom orders for people who find her online. Money reaches her from several places: a monthly retainer, a platform payout, custom order payments, and the odd one-off brand deal.",
    },
    {
      kind: "p",
      text: "That mix is normal for self-employed people, and it causes the same trouble every time. Nobody withholds tax for her. Some income is steady and some is not. Her costs are steady and her income is not. By March of her first year she could not answer a simple question: how much of this is actually mine?",
    },
    {
      kind: "p",
      text: "She tried a heavy bookkeeping tool first and found it more than she needed. She tried a spreadsheet next. The spreadsheet worked, but it needed her to type everything by hand, and receipts still sat in her bag. What she wanted was one place for income, expenses and proof. She chose [Receipt Cycle](/signup) for that.",
    },
    { kind: "h2", text: "Step 1: Map the year before you track a single receipt", id: "step-1-map-the-year" },
    {
      kind: "p",
      text: "Maya started with a rough picture of her year. She listed her income in two groups and her fixed costs in one. It took twenty minutes and changed how she thought about money.",
    },
    {
      kind: "ul",
      items: [
        "Steady income: her retainer and her platform payout, averaged to a low monthly number.",
        "Irregular income: custom orders and brand deals, entered as they arrive.",
        "Fixed costs: rent, phone, internet, software subscriptions and insurance.",
        "Yearly bills spread monthly: a PO box she pays every six months becomes one sixth each month.",
      ],
    },
    {
      kind: "p",
      text: "That last trick matters. Costs that hit twice a year are easy to forget until they land. Dividing them into monthly amounts shows the real monthly cost of running her life and her business.",
    },
    {
      kind: "p",
      text: "In Receipt Cycle she set up her accounts and categories first. Then she used [Budgets](/business-budgeting-software) to set a monthly limit for each category, so she could see her number next to what she actually spent.",
    },
    { kind: "h2", text: "Step 2: Track income as it lands, including deposits", id: "step-2-track-income" },
    {
      kind: "p",
      text: "Custom orders are where Maya's income gets messy. A customer pays a deposit, then the final payment weeks later. If she only counts the final payment, she misses half the picture. If she counts the whole price up front, she thinks she is richer than she is.",
    },
    {
      kind: "p",
      text: "So she makes an [invoice](/invoice-software) for every custom order and records each payment against it. The deposit shows the invoice as partially paid with a balance left. The final payment moves it to paid. A glance at the list tells her what has arrived and what is still owed.",
    },
    {
      kind: "table",
      caption: "How Maya tracks one custom order",
      columns: ["Moment", "What she does", "What she sees"],
      rows: [
        ["Customer says yes", "Sends an estimate, then turns it into an invoice", "A saved customer and a total"],
        ["Deposit arrives", "Records a partial payment", "Status: partially paid, with the balance"],
        ["Final payment arrives", "Records the rest", "Status: paid, with a payment receipt"],
        ["Payment is late", "Opens the overdue report", "Every unpaid invoice past its due date"],
      ],
      tones: true,
    },
    {
      kind: "p",
      text: "This is the heart of [payment tracking software](/payment-tracking-software) for a freelancer: you know what you earned, what you are waiting on, and who to remind.",
    },
    { kind: "h2", text: "Step 3: Set money aside for taxes on every payment", id: "step-3-set-money-aside" },
    {
      kind: "p",
      text: "This is the step that stops April from hurting. When a payment arrives, Maya moves a share of it into a separate savings account the same day. Her personal rule is 25 percent. Some freelancers use 20 percent and others 30. The right number depends on how much you earn and how much you can deduct.",
    },
    {
      kind: "p",
      text: "Here is why she bothers. The IRS says that people who are self-employed generally have to pay estimated tax each quarter, because no employer is withholding it. Individuals, including sole proprietors, generally have to make estimated payments if they expect to owe $1,000 or more when they file. You figure those payments on [Form 1040-ES](https://www.irs.gov/forms-pubs/about-form-1040-es).",
    },
    {
      kind: "p",
      text: "On top of income tax, you pay self-employment tax. [The IRS puts the rate at 15.3 percent](https://www.irs.gov/businesses/small-businesses-self-employed/self-employment-tax-social-security-and-medicare-taxes): 12.4 percent for Social Security and 2.9 percent for Medicare. You report it on Schedule SE, using the profit from [Schedule C](https://www.irs.gov/forms-pubs/about-schedule-c-form-1040). A higher earner can owe an additional 0.9 percent Medicare tax.",
    },
    {
      kind: "p",
      text: "Maya keeps the tax money in a separate savings account at her bank and moves her share each time a payment lands. Receipt Cycle does not hold money, calculate her tax or file anything. What it gives her is a clear income total for every month, so working out 25 percent takes a few seconds.",
    },
    {
      kind: "callout",
      title: "Pick your percentage with a professional",
      text: "A set-aside of 20 to 30 percent is a common starting point, not a rule. Your income, deductions and state all change the number. A tax professional can set it for you in one short call.",
    },
    { kind: "h2", text: "Step 4: Log every expense with its proof", id: "step-4-log-every-expense" },
    {
      kind: "p",
      text: "Maya's second rule is the one most freelancers skip: a receipt for every business expense, captured the day she pays. Here is how she gets receipts in.",
    },
    {
      kind: "table",
      caption: "How Maya gets a business expense into Receipt Cycle",
      columns: ["Situation", "Her method", "Where it works"],
      rows: [
        ["Paper receipt from a supply store", "Scans it with the phone camera", "Android app"],
        ["Software invoice by email", "Saves the PDF and uploads it", "Web and Android"],
        ["Cash purchase with no receipt", "Says it out loud, then checks the entry", "Web and Android"],
        ["Quick note on the move", "Types the amount, merchant and reason", "Web and Android"],
      ],
      tones: true,
    },
    {
      kind: "p",
      text: "The [AI receipt scanner](/ai-receipt-scanner) reads the merchant, date, total, tax and line items, and she corrects anything before saving. The original image stays with the record. That is her proof if anyone asks later.",
    },
    {
      kind: "p",
      text: "She also keeps business and personal spending apart. Business categories are clearly named, so a coffee with a client is not mixed with a coffee on a lazy Sunday. If a purchase is part business and part personal, she splits it and adds a note.",
    },
    {
      kind: "image",
      src: `${IMG}/receipt-cycle-freelancer-dashboard-income-expenses.webp`,
      alt: "Receipt Cycle dashboard showing income, expenses and total with voice and quick text entry and quick actions",
      caption: "The Receipt Cycle dashboard: totals at the top, voice or text entry, and quick actions for invoices, estimates and budgets.",
      width: 1148,
      height: 650,
      title: "Freelancer dashboard in Receipt Cycle",
    },
    { kind: "h2", text: "What counts as a business expense?", id: "what-counts-as-a-business-expense" },
    {
      kind: "p",
      text: "The IRS lets you deduct the cost of running your business, and it lists common categories on its [business expenses page](https://www.irs.gov/businesses/small-businesses-self-employed/deducting-business-expenses). Maya checks each purchase against a simple question: did I buy this to earn money from my work?",
    },
    {
      kind: "ul",
      items: [
        "Software, apps and website costs you use for client work.",
        "Equipment and supplies, such as a laptop, packaging or materials.",
        "Business travel and lodging. See [IRS Tax Topic 511](https://www.irs.gov/taxtopics/tc511).",
        "Business meals. The IRS says the deduction is generally limited to 50 percent of the cost.",
        "Part of your home used for work, if it qualifies. The IRS covers it in its business use of home guidance.",
        "Professional fees, such as an accountant, and shipping and postage.",
      ],
    },
    {
      kind: "p",
      text: "Rules change and details matter, so check your own case with a tax professional. What never changes is the proof: an amount, a date, a place and a reason. Our guide to [going paperless with receipts](/blog/go-paperless-with-receipts) shows what to capture.",
    },
    { kind: "h2", text: "Step 5: Review weekly, look at the picture monthly", id: "step-5-review" },
    {
      kind: "p",
      text: "Maya does not wait for month end. Once a week she spends five minutes looking at her transactions, fixing a category or adding a missing receipt. Gaps are easy to fix while she still remembers the purchase.",
    },
    {
      kind: "p",
      text: "Once a month she opens the Analysis page. It shows her totals, her spending by category, and a Find receipts section that filters by category or merchant. When she wants to see what her supply shop costs her, she filters by that merchant and exports the list.",
    },
    {
      kind: "p",
      text: "Her income and spending are never a straight line. One month a client pays late, the next month an equipment purchase lands. Seeing the swings is the point. When a month looks off, she asks why, and plans the next one with that in mind.",
    },
    {
      kind: "table",
      caption: "Maya's March at a glance (example numbers)",
      columns: ["Line", "Amount"],
      rows: [
        ["Retainer", "$1,800"],
        ["Platform payout", "$400"],
        ["Custom order final payments", "$2,200"],
        ["Brand deal deposit", "$600"],
        ["Total income", "$5,000"],
        ["Tax set-aside at 25%", "$1,250"],
        ["Business expenses (software, supplies, shipping, phone)", "$640"],
        ["Personal living costs", "$1,900"],
        ["Left over", "$1,210"],
      ],
      tones: true,
    },
    { kind: "h2", text: "Step 6: Hand your accountant one clean file", id: "step-6-tax-time" },
    {
      kind: "p",
      text: "At tax time Maya does not hunt for anything. She opens Backup and export and downloads the Excel report. It opens on a summary of totals by category, month, week and day. At the bottom it lists every transaction with a link that opens the stored receipt.",
    },
    {
      kind: "p",
      text: "Her accountant gets numbers and proof together, so there are fewer emails back and forth. If her accountant prefers a plain file, she downloads a CSV or sends the report straight to Google Sheets. The [freelancer tax receipt tracker](/freelancer-tax-receipt-tracker) page shows the same flow.",
    },
    {
      kind: "p",
      text: "She also knows how long to hold on to the records. The IRS says to keep most records for 3 years and some for longer, and it asks that records support the income and deductions on your return. You can read both on its [recordkeeping page](https://www.irs.gov/businesses/small-businesses-self-employed/recordkeeping).",
    },
    {
      kind: "cta",
      title: "Set up your own system in an afternoon",
      text: "Try Receipt Cycle free for 7 days. Add your income, scan your last 10 receipts, and run one export to see the whole loop.",
      label: "Start free for 7 days",
      href: "/signup",
      note: "No credit card needed for the web app.",
    },
    { kind: "h2", text: "The seven habits behind every good expense system", id: "seven-habits" },
    {
      kind: "p",
      text: "Maya's routine lines up with a checklist small business finance teams use. Here it is, with an honest note on what Receipt Cycle does and does not do for each habit.",
    },
    {
      kind: "table",
      caption: "Seven habits for tracking business expenses",
      columns: ["Habit", "Why it matters", "In Receipt Cycle"],
      rows: [
        ["Open a business bank account", "Keeps business money apart from personal", "Add it as an account and track it"],
        ["Use a business credit card", "Gives you a clean list of business spending", "Tag the account on each expense"],
        ["Choose cash or accrual accounting", "Gives you one rule for reporting income", "Ask your accountant; we track payments as received"],
        ["Use software that tracks in one place", "Less typing and fewer mistakes", "Receipts, invoices, payments and budgets together"],
        ["Digitize receipts", "No more lost paper", "Scan, upload or speak each one"],
        ["Bring in your statements", "Catches spending you forgot to log", "Upload PDF, CSV or Excel statements. There is no live bank link"],
        ["Review and categorize regularly", "Shows where money goes", "Weekly check and monthly Analysis"],
      ],
      tones: true,
    },
    {
      kind: "p",
      text: "A note on limits. Receipt Cycle is not a full accounting system. It has no general ledger or payroll, it does not connect to your bank for live imports, and it does not file taxes. If you need those, pair it with accounting software, or read our look at the [best receipt scanner apps for small business](/blog/best-receipt-scanner-app-small-business-2026).",
    },
    { kind: "h2", text: "Common mistakes freelancers make with expenses", id: "common-mistakes" },
    {
      kind: "ol",
      items: [
        "Spending the whole payment before setting tax money aside.",
        "Counting a deposit as the full price, or ignoring it until the final payment.",
        "Mixing personal and business spending in one account.",
        "Keeping receipts only in a camera roll or a bag.",
        "Skipping a note on meals and travel, so you cannot say what they were for.",
        "Waiting until the end of the year to catch up.",
      ],
    },
    {
      kind: "links",
      title: "Keep reading",
      items: [
        { label: "How to go paperless with your receipts", href: "/blog/go-paperless-with-receipts" },
        { label: "Maximize your tax refund by scanning receipts", href: "/blog/maximize-tax-refund-by-scanning-receipts" },
        { label: "Gig worker income and expense guide", href: "/blog/gig-workers-income-expense-guide" },
        { label: "Import bank statements for expense tracking", href: "/blog/import-bank-statements-expense-tracking" },
        { label: "Client management software", href: "/client-management-software" },
        { label: "Expense reporting software", href: "/expense-reporting-software" },
      ],
    },
  ],
  faq: [
    {
      question: "What is the best way for a freelancer to track business expenses?",
      answer:
        "Capture a receipt the day you pay, store it with the date, merchant, amount and category, keep business and personal spending apart, and review it weekly. An app that reads receipts, like [Receipt Cycle](/ai-receipt-scanner), makes this faster than a spreadsheet.",
    },
    {
      question: "How much should a freelancer set aside for taxes?",
      answer:
        "Many freelancers start with 20 to 30 percent of each payment, but the right number depends on your income and deductions. The IRS says self-employment tax is 15.3 percent, on top of income tax. A tax professional can set a number for you.",
    },
    {
      question: "Do freelancers have to pay estimated taxes?",
      answer:
        "Usually yes. The [IRS says](https://www.irs.gov/businesses/small-businesses-self-employed/estimated-taxes) that people in business for themselves generally make estimated tax payments if they expect to owe $1,000 or more when they file. You figure them with Form 1040-ES.",
    },
    {
      question: "What receipts do I need to keep for business expenses?",
      answer:
        "Keep a receipt, bill or other proof for each expense that shows the amount, date, place and what it was for. Our guide to [going paperless with receipts](/blog/go-paperless-with-receipts) explains how long to keep them.",
    },
    {
      question: "Are business meals fully deductible?",
      answer:
        "Not usually. The IRS says the deduction for business meals is generally limited to 50 percent of the cost. Keep the receipt and a note about who you met and why.",
    },
    {
      question: "Can I track deposits and partial payments from clients?",
      answer:
        "Yes. In Receipt Cycle you record each payment against an [invoice](/invoice-software). A deposit shows the invoice as partially paid with a balance, and the final payment marks it paid.",
    },
    {
      question: "Can I export my expenses for my accountant?",
      answer:
        "Yes. You can download an Excel report with totals by category, month, week and day and a link to each receipt, download a CSV, or save the report to Google Sheets. Exports are part of the Pro plan.",
    },
    {
      question: "Is there a free way to try Receipt Cycle as a freelancer?",
      answer:
        "Yes. The free plan includes a 7-day Pro trial with up to 25 transactions, and the web app needs no credit card. [Pro](/pricing) is $3.50 a month, $35 a year, or $60 once for lifetime access.",
    },
  ],
};
