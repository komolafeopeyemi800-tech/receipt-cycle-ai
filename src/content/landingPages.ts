/**
 * Facts about each SEO landing page: meta, feature list, noscript copy and last-modified date.
 * src/lib/schema.ts turns these into JSON-LD; scripts/prerender.mjs turns them into static HTML.
 * Keep it framework-free (no React) so the build scripts can bundle it.
 */
export interface LandingPage {
  path: string;
  title: string;
  description: string;
  /** Path of the social/OG image under /public (1200x630). */
  ogImagePath: string;
  ogImageAlt: string;
  /** Name of the page (schema WebPage name). */
  name: string;
  /** Name used in the breadcrumb trail. */
  breadcrumbName: string;
  /** What the page is about (schema about.name). */
  topic: string;
  /** Real, visible features of the product that this page covers. */
  featureList: string[];
  /** Short plain-language answer shown at the top of the page, used for speakable markup. */
  summary: string;
  /** Heading plus body shown to visitors who have JavaScript disabled. */
  noscriptTitle: string;
  noscriptBody: string;
  /** ISO date of the last meaningful content change. */
  dateModified: string;
}

export const LANDING_PAGES: LandingPage[] = [
  {
    path: "/invoice-software",
    title: "Invoice Software for Small Businesses | Receipt Cycle",
    description: "Create professional invoices, add customers and line items, review totals, track payment status, and record payments with Receipt Cycle invoice software.",
    ogImagePath: "/landing/invoice-software-og.png",
    ogImageAlt: "Receipt Cycle invoice software showing a professional invoice preview",
    name: "Invoice Software for Small Businesses",
    breadcrumbName: "Invoice Software",
    topic: "Invoice Software",
    featureList: [
          "Invoice line items",
          "Tax and discount calculations",
          "Invoice preview",
          "Invoice status and balances",
          "Full and partial payment records",
          "Payment receipts"
    ],
    summary: "Create polished invoices, send them to customers, and track what is paid or outstanding from one straightforward workspace.",
    noscriptTitle: "Invoicing Software for Small Businesses and Freelancers",
    noscriptBody: `<p>Create polished invoices, send them to customers, and track what is paid or outstanding from one straightforward workspace.</p>
       <h2>Build and review an invoice</h2>
       <ul>
         <li>Select a saved customer and add products or services.</li>
         <li>Set quantities, rates, descriptions, tax, discounts, notes, and terms.</li>
         <li>Preview the customer document before marking it as sent.</li>
       </ul>
       <h2>Track invoice status and payment history</h2>
       <p>Filter invoices by status, record full or partial payments, see the remaining balance, and keep payment receipts connected to invoice history.</p>
       <p><a href="/signup?intent=invoice">Create your first invoice</a>. No credit card required.</p>`,
    dateModified: "2026-09-28",
  },
  {
    path: "/estimate-quotation-software",
    title: "Estimate Software & Quotation Maker | Receipt Cycle",
    description: "Create detailed estimates and quotations, track approval status, and convert accepted work into an editable invoice with Receipt Cycle estimate software.",
    ogImagePath: "/landing/estimate-quotation-software-og.png",
    ogImageAlt: "Receipt Cycle estimate software showing a quotation and estimate-to-invoice workflow",
    name: "Estimate and Quotation Software",
    breadcrumbName: "Estimate & Quotation Software",
    topic: "Estimate Software",
    featureList: [
          "Estimate and quotation creation",
          "Products and service line items",
          "Quantity and rate calculations",
          "Tax and discount calculations",
          "Estimate validity dates",
          "Draft, sent, accepted, and expired status",
          "Estimate preview and sharing",
          "Accepted estimate conversion to invoice draft"
    ],
    summary: "Create a detailed estimate, send it for review, and turn accepted work into an editable invoice without entering the job twice.",
    noscriptTitle: "Estimate software for service businesses and independent contractors",
    noscriptBody: `<p>Create a detailed estimate, send it for review, and turn accepted work into an editable invoice without entering the job twice.</p>
       <h2>Create and review an estimate</h2>
       <ul>
         <li>Choose a customer and add proposed services, descriptions, quantities, and rates.</li>
         <li>Set tax, a discount, notes, terms, and the quotation validity period.</li>
         <li>Preview the customer document before saving or sending it.</li>
       </ul>
       <h2>Record approval and continue to invoicing</h2>
       <p>Track draft, sent, accepted, and expired estimates. Convert accepted work into an editable invoice draft while keeping its customer, line items, pricing adjustments, and terms.</p>
       <p><a href="/signup?intent=estimate">Create your first estimate</a>. No credit card required.</p>`,
    dateModified: "2026-09-29",
  },
  {
    path: "/payment-tracking-software",
    title: "Payment Tracking Software & Receipt Manager | Receipt Cycle",
    description: "Record full or partial invoice payments, update balances, preserve payment history, and create shareable receipts with Receipt Cycle payment tracking software.",
    ogImagePath: "/landing/payment-tracking-software-og.png",
    ogImageAlt: "Receipt Cycle payment tracking software showing an invoice payment, updated balance, and customer receipt",
    name: "Payment Tracking and Receipt Management Software",
    breadcrumbName: "Payment Tracking Software",
    topic: "Payment Tracking Software",
    featureList: [
          "Full and partial invoice payment records",
          "Paid amount and outstanding balance updates",
          "Payment method, date, account, and reference",
          "Invoice payment history",
          "Numbered payment receipts",
          "Receipt preview",
          "PDF and image receipt sharing on supported mobile devices",
          "Print or save as PDF on the web workspace"
    ],
    summary: "Record full or partial invoice payments, update the balance, and create a receipt without rebuilding the transaction in another file.",
    noscriptTitle: "Payment tracking software for invoicing and recurring billing",
    noscriptBody: `<p>Record full or partial invoice payments, update the balance, and create a receipt without rebuilding the transaction in another file.</p>
       <h2>Record the payment against an invoice</h2>
       <ul>
         <li>Choose an open invoice and enter the amount received.</li>
         <li>Store the payment method, receiving account, date, note, and generated reference.</li>
         <li>Update the paid amount, remaining balance, and invoice status.</li>
       </ul>
       <h2>Create and share a payment receipt</h2>
       <p>Preview a numbered receipt with the customer, invoice, amount, method, reference, date, and balance. Share supported PDF or image output, or print and save the web receipt as a PDF.</p>
       <p><a href="/signup?intent=payment">Record your first payment</a>. No credit card required.</p>`,
    dateModified: "2026-09-29",
  },
  {
    path: "/ai-receipt-scanner",
    title: "AI Receipt Scanner & Receipt OCR App | Receipt Cycle",
    description: "Scan receipt images, extract merchant, amount, date, tax and line items, review the details, and save organized expense records with Receipt Cycle.",
    ogImagePath: "/landing/ai-receipt-scanner-og.png",
    ogImageAlt: "Receipt Cycle AI receipt scanner turning a receipt image into editable expense fields",
    name: "AI Receipt Scanner",
    breadcrumbName: "AI Receipt Scanner",
    topic: "AI Receipt Scanner",
    featureList: [
          "Mobile receipt camera with flash control",
          "Receipt image upload from mobile gallery or web",
          "Merchant, amount, date, time, and payment method extraction",
          "Subtotal, tax, currency, and line-item extraction when visible",
          "Suggested expense category",
          "OCR confidence, detected language, and review tags",
          "Editable review before saving an expense",
          "Receipt evidence connected to saved transaction records"
    ],
    summary: "Photograph or upload a receipt, extract the visible purchase details, and review the expense before it joins your records.",
    noscriptTitle: "AI receipt scanner for faster expense capture",
    noscriptBody: `<p>Photograph or upload a receipt, extract the visible purchase details, and review the expense before it joins your records.</p>
       <h2>Capture, extract, and review</h2>
       <ul>
         <li>Use the mobile receipt camera, choose an image from the gallery, or upload a supported receipt image from the web.</li>
         <li>Review proposed merchant, amount, date, category, payment method, tax, currency, and line-item details when visible.</li>
         <li>Correct uncertain OCR fields before continuing to save the expense.</li>
       </ul>
       <h2>Keep the source with the record</h2>
       <p>Receipt Cycle can preserve the receipt image or structured receipt data with the saved transaction so you can return to the evidence later.</p>
       <p><a href="/signup?intent=scan">Scan your first receipt</a>. No credit card required.</p>`,
    dateModified: "2026-09-30",
  },
  {
    path: "/business-travel-expense-tracker",
    title: "Business Travel Expense Tracker & Trip Expenses | Receipt Cycle",
    description: "Capture travel receipts, record airfare, hotel, meals and transportation, filter trip expenses, and export organized transaction records with Receipt Cycle.",
    ogImagePath: "/landing/business-travel-expense-tracker-og.png",
    ogImageAlt: "Receipt Cycle business travel expense tracker showing trip purchases organized by date, category, and account",
    name: "Business Travel Expense Tracker",
    breadcrumbName: "Business Travel Expense Tracker",
    topic: "Business Travel Expense Tracker",
    featureList: [
          "Receipt camera, gallery selection, and supported web image upload",
          "Manual travel expense entry",
          "Editable merchant, amount, date, category, payment method, account, and notes",
          "Receipt evidence connected to transaction records when available",
          "Search by merchant, description, category, and amount",
          "Filters for date range, category, account, and transaction type",
          "Cash, card, bank, and savings account activity",
          "CSV transaction export when plan and workspace access permit"
    ],
    summary: "Capture travel receipts, review every purchase, and return to an organized record of airfare, lodging, meals, and transportation.",
    noscriptTitle: "Business travel expense tracker for the whole trip",
    noscriptBody: `<p>Capture travel receipts, review every purchase, and return to an organized record of airfare, lodging, meals, and transportation.</p>
       <h2>Record each travel purchase</h2>
       <ul>
         <li>Scan a supported receipt image or enter the expense manually.</li>
         <li>Review the merchant, amount, date, category, payment method, account, and notes.</li>
         <li>Keep available receipt evidence connected to the transaction record.</li>
       </ul>
       <h2>Return to the trip after traveling</h2>
       <p>Search merchants and descriptions, filter transactions by date, category, account, or type, and export CSV transaction data when plan and workspace access permit.</p>
       <p><a href="/signup?intent=expense">Track your first travel expense</a>. No credit card required.</p>`,
    dateModified: "2026-09-30",
  },
  {
    path: "/freelancer-tax-receipt-tracker",
    title: "Freelancer Tax Tracker & Receipt Organizer | Receipt Cycle",
    description: "Capture freelancer receipts, organize business expenses, review records by date and category, and export transaction data for tax preparation with Receipt Cycle.",
    ogImagePath: "/landing/freelancer-tax-receipt-tracker-og.png",
    ogImageAlt: "Receipt Cycle freelancer tax tracker showing categorized expense records, receipt evidence, and CSV export",
    name: "Freelancer Tax & Receipt Tracker",
    breadcrumbName: "Freelancer Tax & Receipt Tracker",
    topic: "Freelancer Tax Tracker",
    featureList: [
          "Receipt camera, gallery selection, and supported web image upload",
          "Editable merchant, amount, date, category, payment method, account, tax, and notes",
          "Receipt evidence connected to saved transactions when available",
          "Manual expense and income entry",
          "Search by merchant, description, category, and amount",
          "Filters for date range, category, account, transaction type, and sort order",
          "Category-aware reports and income-and-expense totals",
          "CSV transaction export when plan and administrator access permit"
    ],
    summary: "Capture business purchases as they happen, preserve the supporting receipt, and prepare an organized record for tax-time review.",
    noscriptTitle: "Freelancer tax tracker for receipts and expense records",
    noscriptBody: `<p>Capture business purchases as they happen, preserve the supporting receipt, and prepare an organized record for tax-time review.</p>
       <h2>Maintain the expense record throughout the year</h2>
       <ul>
         <li>Scan a supported receipt image or enter the purchase manually.</li>
         <li>Review the merchant, amount, date, category, account, payment method, tax, and notes.</li>
         <li>Search and filter records by date, category, account, type, merchant, description, or amount.</li>
       </ul>
       <h2>Prepare records without replacing tax judgment</h2>
       <p>Use category views, receipt evidence, reports, and supported CSV export to prepare a review. Receipt Cycle does not determine deductions, calculate tax, file returns, or replace an accountant.</p>
       <p><a href="/signup?intent=expense">Organize your first tax receipt</a>. No credit card required.</p>`,
    dateModified: "2026-10-01",
  },
  {
    path: "/business-budgeting-software",
    title: "Business Budgeting Software for Small Teams | Receipt Cycle",
    description: "Set monthly category budgets, compare recorded spending with each limit, and review the transactions behind your progress with Receipt Cycle.",
    ogImagePath: "/landing/business-budgeting-software-og.png",
    ogImageAlt: "Receipt Cycle business budgeting software showing monthly category limits, spending progress, and remaining amounts",
    name: "Business Budgeting & Expense Planning",
    breadcrumbName: "Business Budgeting Software",
    topic: "Business Budgeting Software",
    featureList: [
          "Monthly category budget limits",
          "Total budget, recorded spending, and remaining summaries",
          "Category-level budget versus actual comparison",
          "Percentage-used and monthly progress views",
          "Recent expense transactions within each category",
          "Month navigation and editable budget limits",
          "Over-budget states when recorded spending exceeds a limit"
    ],
    summary: "Set monthly category limits, compare them with recorded expenses, and open the purchases behind every total.",
    noscriptTitle: "Business budgeting software that keeps spending in view",
    noscriptBody: `<p>Set monthly category limits, compare them with recorded expenses, and open the purchases behind every total.</p>
       <h2>Plan and review one month at a time</h2>
       <ul>
         <li>Set positive monthly limits for the expense categories worth watching.</li>
         <li>Compare total budget, recorded spending, and the amount remaining.</li>
         <li>Open a category to review percentage used, progress, and recent transactions.</li>
       </ul>
       <h2>Use a focused budgeting workspace</h2>
       <p>Receipt Cycle supports category-level expense planning. It does not forecast cash flow, enforce card limits, approve purchases, or replace accounting software.</p>
       <p><a href="/signup?intent=budget">Set your first budget</a>. No credit card required.</p>`,
    dateModified: "2026-10-01",
  },
  {
    path: "/client-management-software",
    title: "Client Management Software for Small Business | Receipt Cycle",
    description: "Keep customer details, invoice history, outstanding balances, and reusable products or services connected with Receipt Cycle client management software.",
    ogImagePath: "/landing/client-management-software-og.png",
    ogImageAlt: "Receipt Cycle client management software showing customer profiles, invoice history, balances, and reusable services",
    name: "Client & Customer Management for Invoicing",
    breadcrumbName: "Client Management Software",
    topic: "Client Management Software",
    featureList: [
          "Searchable customer profiles",
          "Contact and billing information",
          "Customer status and internal notes",
          "Connected invoice history",
          "Invoice count and outstanding balance",
          "Reusable products and services catalog",
          "Catalog descriptions, categories, unit prices, and active state"
    ],
    summary: "Keep customer details, document history, outstanding balances, and reusable services ready for the next estimate or invoice.",
    noscriptTitle: "Client management software for small business billing",
    noscriptBody: `<p>Keep customer details, document history, outstanding balances, and reusable services ready for the next estimate or invoice.</p>
       <h2>Start with the customer record</h2>
       <ul>
         <li>Store contact name, company, email, phone, billing address, status, and notes.</li>
         <li>Review connected invoice history, invoice count, status, totals, and outstanding balance.</li>
         <li>Save reusable products and services with descriptions, categories, unit prices, and active state.</li>
       </ul>
       <h2>Focused customer management for billing</h2>
       <p>Receipt Cycle connects customer records to estimates, invoices, payments, and catalog items. It does not claim CRM pipelines, marketing automation, inventory, scheduling, or project management.</p>
       <p><a href="/signup?intent=customer">Add your first customer</a>. No credit card required.</p>`,
    dateModified: "2026-10-01",
  },
  {
    path: "/expense-reporting-software",
    title: "Expense Report Software for Small Business | Receipt Cycle",
    description: "Review income, expenses, category spending, cash flow, payments, and overdue invoices with Receipt Cycle expense report software for small business.",
    ogImagePath: "/landing/expense-reporting-software-og.png",
    ogImageAlt: "Receipt Cycle expense report software showing income, expenses, cash flow, category spending, and invoice exposure",
    name: "Expense Reports & Financial Reporting",
    breadcrumbName: "Expense Report Software",
    topic: "Expense Report Software",
    featureList: [
          "Monthly and all-time income and expense summaries",
          "Net movement and transaction-count reporting",
          "Expense distribution by category",
          "Six-month and current-year cash-flow views",
          "Payments received and paid-invoice counts",
          "Outstanding and overdue invoice reporting",
          "Record-grounded AI-assisted analysis",
          "Supported CSV transaction export"
    ],
    summary: "Review income, expenses, category spending, cash movement, payments, and overdue invoices without rebuilding the month by hand.",
    noscriptTitle: "Expense report software for a complete business view",
    noscriptBody: `<p>Review income, expenses, category spending, cash movement, payments, and overdue invoices without rebuilding the month by hand.</p>
       <h2>Understand the period and its source records</h2>
       <ul>
         <li>Compare income, expenses, net movement, and monthly cash flow.</li>
         <li>Review category totals, transaction counts, payments, outstanding balances, and invoice aging.</li>
         <li>Use supported AI analysis and CSV export where the plan and workspace allow them.</li>
       </ul>
       <h2>Operational reports with clear boundaries</h2>
       <p>Receipt Cycle does not claim employee expense claims, reimbursement workflows, statutory accounting statements, audit assurance, or automatic tax filing.</p>
       <p><a href="/signup?intent=report">Create your reporting workspace</a>. No credit card required.</p>`,
    dateModified: "2026-10-01",
  },
  {
    path: "/ai-financial-assistant",
    title: "AI Financial Assistant for Small Business | Receipt Cycle",
    description: "Ask questions about spending, categories, merchants, income, expenses, and financial trends using Receipt Cycle AI analysis grounded in saved business records.",
    ogImagePath: "/landing/ai-financial-assistant-og.png",
    ogImageAlt: "Receipt Cycle AI financial assistant showing a record-grounded expense question, category comparison, and source transactions",
    name: "AI Financial Assistant and AI Expense Analysis",
    breadcrumbName: "AI Financial Assistant",
    topic: "AI Financial Assistant",
    featureList: [
          "Typed financial questions grounded in saved records",
          "Supported microphone input",
          "Income and expense comparison",
          "Expense category totals and ordering",
          "Merchant pattern summaries",
          "Plain-language business activity recaps",
          "Possible recurring, similar, and unusual entry review",
          "Source-record verification without automatic edits"
    ],
    summary: "Ask about spending, categories, merchants, income, expenses, and recent activity using the records already saved in Receipt Cycle.",
    noscriptTitle: "AI financial assistant grounded in your business records",
    noscriptBody: `<p>Ask about spending, categories, merchants, income, expenses, and recent activity using the records already saved in Receipt Cycle.</p>
       <h2>Ask, compare, and verify</h2>
       <ul>
         <li>Use typed or supported microphone input for questions about saved activity.</li>
         <li>Review category totals, merchant patterns, income and expense comparisons, and plain-language recaps.</li>
         <li>Investigate possible repeats, similar entries, and unusual amounts against the source records.</li>
       </ul>
       <h2>Analysis without autonomous decisions</h2>
       <p>Receipt Cycle does not change records, provide accounting or tax treatment, make financial decisions, or replace a qualified professional.</p>
       <p><a href="/signup?intent=ai">Ask your first financial question</a>. No credit card required.</p>`,
    dateModified: "2026-10-01",
  },
];

export function getLandingPage(path: string): LandingPage | undefined {
  return LANDING_PAGES.find((p) => p.path === path);
}
