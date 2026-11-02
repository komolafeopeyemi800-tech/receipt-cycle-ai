/**
 * Blog posts imported from user-provided DOCX content.
 */
export type BlogBlock =
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string; id: string }
  | { kind: "h3"; text: string; id: string }
  | { kind: "h4"; text: string; id: string }
  | { kind: "image"; src: string; alt: string; caption?: string; width?: number; height?: number; title?: string; href?: string }
  | { kind: "links"; title: string; items: Array<{ label: string; href: string; external?: boolean }> }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "quote"; text: string; cite?: string }
  | { kind: "table"; caption: string; columns: string[]; rows: string[][]; tones?: boolean }
  | { kind: "cta"; title: string; text: string; label: string; href: string; note?: string }
  | { kind: "scoreTable"; caption: string; columns: string[]; rows: Array<{ app: string; scores: number[] }>; note?: string }
  | { kind: "callout"; title: string; text: string }
  /** A YouTube video from our own channel. `uploadDate` is YYYY-MM-DD and must be the real upload date. */
  | { kind: "video"; videoId: string; title: string; description: string; uploadDate: string; caption?: string; durationIso?: string };

export interface BlogFaqItem {
  question: string;
  answer: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  featuredImage: string;
  datePublished: string;
  dateModified: string;
  author: string;
  readMinutes: number;
  tags: string[];
  tldr: string;
  keyTakeaways?: string[];
  citations?: Array<{ label: string; href: string }>;
  featuredImageAlt?: string;
  featuredImageWidth?: number;
  featuredImageHeight?: number;
  category?: string;
  /** End-of-article "Resources and sources" list. Falls back to `citations` when absent. */
  resources?: Array<{ label: string; href: string; note?: string }>;
  faq?: BlogFaqItem[];
  body: BlogBlock[];
}

import { bestReceiptScannerAppsPost } from "./posts/bestReceiptScannerApps";
import { freelancerExpenseTrackingCaseStudyPost } from "./posts/freelancerExpenseTrackingCaseStudy";
import { goPaperlessWithReceiptsPost } from "./posts/goPaperlessWithReceipts";
import { gigWorkerTaxDeductionsPost } from "./posts/gigWorkerTaxDeductionsGuide";
import { maximizeTaxRefundPost } from "./posts/maximizeTaxRefundScanningReceipts";
import { legacyFinanceGuides } from "./posts/legacyFinanceGuides";

export const BLOG_POSTS: BlogPost[] = [
  maximizeTaxRefundPost,
  bestReceiptScannerAppsPost,
  freelancerExpenseTrackingCaseStudyPost,
  goPaperlessWithReceiptsPost,
  gigWorkerTaxDeductionsPost,
  
  ...legacyFinanceGuides,
{
  slug: "what-is-a-receipt-scanner-freelancers-2026",
  title: "What Is a Receipt Scanner? A Practical Guide for Freelancers",
  description:
    "Learn what a receipt scanner does, how OCR prepares expense details, and what freelancers should check before saving, sharing or exporting a record.",
  featuredImage: "/landing/blog-what-is-a-receipt-scanner-freelancers-2026.webp?v=1",
  datePublished: "2026-04-28",
  dateModified: "2026-11-02",
  author: "Philip",
  readMinutes: 9,
  tags: ["receipt scanner", "freelancer", "OCR", "tax deductions", "expense tracking"],
  tldr: "A receipt scanner prepares transaction details from a photo or file and keeps the source available for review. It can reduce repeated typing, but you still need to check the extraction, add the business purpose and keep suitable backups.",
  faq: [
    { question: "What is a receipt scanner app?", answer: "A receipt scanner app uses your phone's camera and OCR technology to capture a receipt and read the merchant, date, amount and other details. It saves the record, and the photo, to your account." },
    { question: "Do freelancers need to keep receipts?", answer: "Yes. The IRS expects proof for business deductions, and without it you may not be able to claim them. A digital copy can serve as that proof if it is complete and legible. See [Rev. Proc. 97-22](https://www.irs.gov/pub/irs-irbs/irb97-13.pdf)." },
    { question: "Is OCR accurate enough to trust?", answer: "It is good on clear receipts and weaker on faded or crumpled ones. That is why Receipt Cycle shows you what it read next to the original receipt, so you can fix a mistake before saving." },
    { question: "Can I use a receipt scanner for tax purposes?", answer: "Yes, as a way to keep organized records. It does not file your taxes or give tax advice. Export your records for your accountant when it is time to file." },
  ],
  body: [
    { kind: "p", text: "If you have been freelancing for any length of time, you already know this feeling: tax season arrives, and somewhere between your client invoices and your bank statements, there is a gap. Expenses you know you paid for but cannot prove. Deductions you deserve but cannot claim." },
    { kind: "p", text: "A receipt scanner can help you keep the document with its transaction. It cannot reconstruct evidence that was never captured or decide which expenses qualify for a deduction." },
    { kind: "image", src: "/landing/scan-receipt.png", alt: "Receipt scanner capture workflow on mobile", caption: "Capture the receipt while the details are fresh, then confirm the saved copy is readable." },
    { kind: "h2", text: "What Does a Receipt Scanner Actually Do?", id: "what-does-a-receipt-scanner-actually-do" },
    { kind: "p", text: "A receipt scanner uses a photo or uploaded document to prepare fields such as merchant, date and total. You review the result before saving it. Keeping the source alongside those fields makes the record easier to check later." },
    { kind: "p", text: "That is the short version. Here is what is actually happening behind the scenes." },
    { kind: "h3", text: "From Paper to Digital in Seconds", id: "from-paper-to-digital-in-seconds" },
    { kind: "p", text: "Thermal-paper receipts can fade or become damaged. A readable digital copy can preserve information that would be hard to recover later. Check the image for missing edges, glare and illegible text before relying on it." },
    { kind: "p", text: "A saved Receipt Cycle record can be reviewed through the supported web and Android apps using the same account. Access depends on your account, connectivity and the service. Keep backups of important source files and check the current data-retention policy." },
    { kind: "h3", text: "How OCR Reads Your Receipts", id: "how-ocr-reads-your-receipts" },
    { kind: "p", text: "Once the image is captured, the app uses a technology called OCR — Optical Character Recognition — to read the text on the receipt. OCR converts the pixels in the image into actual, searchable text data: the merchant name, the date, the total amount, and individual line items." },
    { kind: "p", text: "AI-assisted extraction can use the document context to suggest fields and a category. A merchant name alone cannot establish business intent: a fuel purchase might be personal, and a software invoice can include several products. Review each suggestion rather than treating it as a decision." },
    { kind: "p", text: "The result is a draft to check against the receipt, not a guarantee of a complete or correctly categorized record." },
    { kind: "h2", text: "Why a Consistent Receipt Habit Helps", id: "why-freelancers-lose-money-without-one" },
    { kind: "p", text: "Paper receipts, photo folders and spreadsheets can all work when you use them consistently. The difficulty is keeping the evidence and the transaction connected as purchases accumulate. Choose a routine that you can maintain." },
    { kind: "h3", text: "Keep Evidence for Review", id: "lost-receipts-lost-deductions" },
    { kind: "p", text: "US documentation rules depend on the expense. The $75 exception in [IRS Publication 463](https://www.irs.gov/publications/p463) is not a universal exemption from keeping records, and lodging has its own requirements. Seek a duplicate receipt when evidence is missing and discuss unresolved items with your accountant." },
    { kind: "p", text: "A saved receipt helps explain a purchase, but it does not establish tax eligibility by itself. A deduction and a refund also depend on the rest of your circumstances." },
    { kind: "h3", text: "The Tax Season Archaeology Problem", id: "the-tax-season-archaeology-problem" },
    { kind: "p", text: "Here is what happens to most freelancers without a receipt system. You spend the year doing the actual work. Then, in the weeks before your filing deadline, you try to reconstruct twelve months of expenses from bank statements, email searches, and vague memories." },
    { kind: "p", text: "A regular review gives you a chance to retrieve missing invoices while the purchase is still familiar." },
    { kind: "h2", text: "What to Look for in a Scanner App", id: "what-to-look-for-in-a-scanner-app" },
    { kind: "p", text: "Not all receipt scanners are built the same way. Here is what actually makes a difference in day-to-day use." },
    { kind: "h3", text: "Speed of Capture", id: "speed-of-capture" },
    { kind: "p", text: "Test the complete capture routine on your own phone, including correction and saving. A quick photo is less useful if finding or checking the record later is difficult." },
    { kind: "p", text: "Try a clear receipt and a difficult one. Check whether you can retake the image, correct a wrong total and retrieve the source after saving." },
    { kind: "h3", text: "Category Intelligence", id: "category-intelligence" },
    { kind: "p", text: "Category suggestions can reduce repeated sorting. Check that the labels fit your own work, particularly when a receipt contains personal and business items or a purchase needs a different accounting treatment." },
    { kind: "p", text: "Consistent categories and clear notes make recurring vendors easier to review." },
    { kind: "h3", text: "Export and Audit Features", id: "export-and-audit-features" },
    { kind: "p", text: "Before choosing an app, open its available export and check the rows, dates, currencies and source access. Confirm which formats your plan includes and whether the export embeds documents or links to them. Ask your accountant what they need." },
    { kind: "p", text: "These features matter most when you are sharing records with your accountant or if the IRS ever asks questions." },
    { kind: "image", src: "/landing/feature-expense-tracking.svg", alt: "Expense tracking dashboard illustration", caption: "A scanner is most useful when linked to a live expense tracker." },
    { kind: "h2", text: "How Receipt Cycle's Scanner Works", id: "how-receiptcycle-scanner-works" },
    { kind: "p", text: "Receipt Cycle was built around the freelancer's reality: you are busy, you are moving fast, and you cannot afford to lose the documentation that protects your income." },
    { kind: "p", text: "In Receipt Cycle, scan with Android or upload a supported file on the web, compare the extracted fields with the source, and correct anything wrong before saving. Your saved records can then be reviewed from the same account on the supported web and Android apps." },
    { kind: "p", text: "Before a handoff, review the period and categories, open the export available to your plan, and test its source links. Keep unresolved questions separate for your accountant. See [how to organize receipts for your accountant](/blog/how-to-organize-receipts-for-accountant)." },
    {
      kind: "links",
      title: "Keep reading",
      items: [
        { label: "Receipt scanner for tax purposes", href: "/blog/receipt-scanner-tax-purposes-audit-ready-year-round" },
        { label: "How OCR receipt scanning works", href: "/blog/how-ocr-receipt-scanning-works-ai-smarter" },
        { label: "IRS recordkeeping overview", href: "https://www.irs.gov/businesses/small-businesses-self-employed/what-kind-of-records-should-i-keep", external: true },
      ],
    },
  ],
},
{
  slug: "receipt-scanner-tax-purposes-audit-ready-year-round",
  title: "Receipt Scanner for Taxes: Keep Records You Can Review",
  description:
    "Use a receipt scanner for tax records with readable evidence, business-purpose notes, retention checks and exports you can review with your accountant.",
  featuredImage: "/landing/blog-receipt-scanner-tax-purposes-audit-ready-year-round.webp?v=1",
  datePublished: "2026-04-28",
  dateModified: "2026-11-02",
  author: "Philip",
  readMinutes: 10,
  tags: ["tax receipts", "audit-ready", "IRS", "receipt scanner", "compliance"],
  tldr: "A receipt scanner can help organize tax records, but a clear photo alone does not guarantee compliance. Keep the source and business context, check the saved details, follow a suitable retention schedule and confirm that your evidence remains accessible.",
  faq: [
    { question: "Are digital receipts accepted by the IRS?", answer: "The IRS accepts electronic records that meet the conditions in [Rev. Proc. 97-22](https://www.irs.gov/pub/irs-irbs/irb97-13.pdf): complete, legible, indexed so you can retrieve them, and checked regularly. A receipt should show the merchant, date and amount." },
    { question: "What happens if I get audited without receipts?", answer: "If you cannot support a deduction, the IRS can disallow it. You would owe the tax on that amount, plus interest, and possibly a penalty." },
    { question: "How far back can the IRS audit my returns?", answer: "Generally 3 years from the date you filed. It can be 6 years if you left out more than 25 percent of your gross income. The [IRS lists the periods](https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records)." },
    { question: "Is a bank statement enough, or do I need actual receipts?", answer: "A bank statement alone is generally not enough. It shows that a payment happened, but not what you bought or why. Keep the receipt, or add a note and attach the statement as support." },
  ],
  body: [
    { kind: "p", text: "Most people treat tax preparation like a once-a-year event. They spend twelve months ignoring their receipts, then scramble to pull everything together before the filing deadline. That approach is stressful, and it almost always results in missing deductions." },
    { kind: "p", text: "A regular capture-and-review routine can make records easier to retrieve. It still takes attention: check what was read, add missing context and keep backups." },
    { kind: "h2", text: "Why the IRS Cares About Your Receipts", id: "why-the-irs-cares-about-your-receipts" },
    { kind: "p", text: "For US federal taxes, records need to support the income and deductions you report. The documents required vary by expense and circumstances. See the [IRS recordkeeping overview](https://www.irs.gov/businesses/small-businesses-self-employed/what-kind-of-records-should-i-keep), and ask your accountant about exceptions or missing evidence." },
    { kind: "p", text: "That is not the IRS being unreasonable. It is the way the system is designed. Deductions reduce your taxable income, which reduces your tax bill. The documentation requirement ensures those reductions are legitimate." },
    { kind: "h2", text: "What Makes a Receipt Tax-Usable", id: "what-makes-a-receipt-tax-usable" },
    { kind: "p", text: "Keep the merchant, transaction date, amount and description of what was purchased, plus the business purpose where needed. A card statement may support a payment but omit the itemized details. Additional records can be required for travel, meals, vehicles or assets." },
    { kind: "h3", text: "Digital copies are valid when clear", id: "digital-copies-are-valid-when-clear" },
    { kind: "p", text: "[IRS Revenue Procedure 97-22](https://www.irs.gov/pub/irs-tege/rp-97-22.pdf) describes conditions for electronic storage, including complete and accurate capture, controls, retrieval and readable reproduction. A clear image is one part of that system. Using a scanner does not by itself certify that every requirement has been met." },
    { kind: "image", src: "/landing/finance-coach-chat.png", alt: "Organized transaction records in app", caption: "Legibility and consistent organization are what matter most." },
    { kind: "h2", text: "How Long to Keep Receipts", id: "how-long-to-keep-receipts" },
    { kind: "p", text: "The [IRS retention guide](https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records) says three years for many income-tax records, with longer periods in specific situations. Examples include six years for certain substantial income omissions and seven years for bad-debt or worthless-securities claims. Property records and other obligations may need longer retention." },
    { kind: "p", text: "Choose a retention schedule with your accountant and keep copies you can retrieve. Do not assume an app stores your files indefinitely. Review the current privacy and account-deletion policies, back up important documents, and test those backups periodically." },
    { kind: "h2", text: "Common Gaps to Check", id: "common-mistakes-that-break-compliance" },
    { kind: "p", text: "Even people who try to keep good records make a few consistent mistakes. Here is what to watch for." },
    { kind: "h3", text: "Missing Merchant or Date Information", id: "missing-merchant-or-date-information" },
    { kind: "p", text: "A faded or cropped image may omit information needed to support the expense. Check the image while a replacement is still easy to obtain, and keep additional documents when needed." },
    { kind: "p", text: "Receipt Cycle shows extracted details for review. Compare them with the source even if no warning appears. Retake a poor image or correct the fields manually; a plausible-looking extraction can still be wrong." },
    { kind: "h3", text: "Forgetting Digital Receipts", id: "forgetting-digital-receipts" },
    { kind: "p", text: "Online purchases, software subscriptions, and digital service payments all generate receipts — but they arrive by email and are easily buried or deleted. Many freelancers and small business owners track their paper receipts reasonably well but completely miss the digital trail." },
    { kind: "p", text: "For email receipts, save the document as a supported file, upload it to Receipt Cycle and review the extracted details before saving." },
    { kind: "h2", text: "How a Receipt Tracker Supports Your Review", id: "how-a-tax-receipt-tracker-keeps-you-compliant" },
    { kind: "h3", text: "Categorizing by Deduction Type", id: "categorizing-by-deduction-type" },
    { kind: "p", text: "On Schedule C — the form self-employed individuals use to report business income and deductions — expenses are organized by type: advertising, car and truck expenses, office expenses, travel, meals, utilities, and so on." },
    { kind: "p", text: "Receipt Cycle uses working categories to organize transactions. These do not certify a tax treatment or map every purchase directly to a return line. Review the categories and any allocations with the person preparing your return." },
    { kind: "h3", text: "Attaching Receipts to Transactions", id: "attaching-receipts-to-transactions" },
    { kind: "p", text: "The gold standard for audit readiness is having a receipt image attached to every transaction record — not just a list of expenses, but the actual documentation for each one." },
    { kind: "p", text: "A saved source document can be opened from its transaction in Receipt Cycle. Check that it is the correct document and remains accessible, and keep a backup of evidence you need to retain." },
    { kind: "h2", text: "A Regular Record-Review Workflow", id: "a-weekly-audit-ready-workflow" },
    { kind: "ol", items: ["Capture the receipt and compare the extracted fields with the source.", "Review missing evidence, categories, refunds and duplicates regularly.", "Check the export and source-document access before sharing records with your accountant."] },
    {
      kind: "links",
      title: "Related guides",
      items: [
        { label: "What is a receipt scanner?", href: "/blog/what-is-a-receipt-scanner-freelancers-2026" },
        { label: "How to organize receipts for your accountant", href: "/blog/how-to-organize-receipts-for-accountant" },
        { label: "IRS Publication 463", href: "https://www.irs.gov/publications/p463", external: true },
      ],
    },
  ],
},
{
  slug: "expense-tracker-receipt-scanner-one-two-punch",
  title: "Expense Tracker With Receipt Scanner: Keep Evidence Connected",
  description:
    "See how an expense tracker with a receipt scanner connects documents and transactions, what to review before saving, and how to check your export.",
  featuredImage: "/landing/blog-expense-tracker-receipt-scanner-one-two-punch.webp?v=1",
  datePublished: "2026-04-28",
  dateModified: "2026-11-02",
  author: "Philip",
  readMinutes: 9,
  tags: ["expense tracker", "receipt scanner", "bookkeeping", "automation", "freelancer"],
  tldr: "A combined receipt scanner and expense tracker keeps the source document beside the transaction. It can reduce repeated entry, but you still need to review extraction, categories, duplicates and missing records.",
  faq: [
    { question: "What is the difference between a receipt scanner and an expense tracker?", answer: "A receipt scanner captures and digitizes your receipts. An expense tracker records and categorizes your spending. A combined app does both in one place." },
    { question: "Can I use Receipt Cycle for client billing as well as tax tracking?", answer: "Yes. You can put the client's name in the note when you save an expense and search for it later. Receipt Cycle also creates [invoices](/invoice-software) and estimates, so billing and records sit together." },
    { question: "Do I still need an accountant if I use a combined expense app?", answer: "Yes. A combined app makes your accountant's job easier and faster, but it does not replace their expertise in tax law and planning." },
    { question: "Is there a free way to try a combined receipt scanner and expense tracker?", answer: "Yes. Receipt Cycle's free plan includes a 7-day Pro trial with up to 25 transactions, and the web app needs no credit card. See [pricing](/pricing)." },
  ],
  body: [
    { kind: "p", text: "You probably already use some version of both. Maybe you have a notes app where you log expenses. Maybe you take photos of receipts and save them to an album on your phone. Maybe you have a spreadsheet somewhere that you update when you remember to." },
    { kind: "p", text: "The problem is that these are separate systems. And separate systems create gaps — gaps where expenses fall through, records get out of sync, and tax time becomes a reconstruction project instead of a review." },
    { kind: "p", text: "An expense tracker with a built-in scanner can keep capture and transaction review in one place." },
    { kind: "h2", text: "Why Separate Apps Create Gaps", id: "why-separate-apps-create-gaps" },
    { kind: "p", text: "Most people do not start with a combined system. They start with what is available. A camera app for receipts. A spreadsheet or a notes app for expenses. A folder somewhere for the files. It feels manageable until it is not." },
    { kind: "h3", text: "The Gap Between Scanning and Tracking", id: "the-gap-between-scanning-and-tracking" },
    { kind: "p", text: "If you scan now and categorize later, later often never happens. You end up with either a receipt and no ledger entry, or a ledger entry with no receipt evidence." },
    { kind: "p", text: "It gets skipped. It gets delayed. The receipt exists but is not connected to an expense record. The expense record exists but has no receipt attached. Both halves are incomplete, and that gap is what makes tax time painful." },
    { kind: "h3", text: "Records That Lose Their Context", id: "data-that-doesnt-talk-to-each-other" },
    { kind: "p", text: "Even if you manage the two-step process consistently, siloed apps cannot share context. Your scanner does not know your expense categories. Your expense tracker does not know you just scanned a receipt from three days ago that should be attached to a transaction." },
    { kind: "p", text: "You end up matching them manually — exactly the kind of low-value, high-friction admin that steals hours from small business owners every month." },
    { kind: "image", src: "/landing/hero-phone.png", alt: "Unified mobile expense workflow", caption: "One flow reduces friction: capture, classify, confirm." },
    { kind: "h2", text: "What a Combined Expense Tracker + Receipt Scanner Should Do", id: "what-a-combined-expense-tracker-receipt-scanner-should-do" },
    { kind: "h3", text: "Capture -> Classify -> Confirm in One Flow", id: "capture-classify-confirm-in-one-flow" },
    { kind: "p", text: "A useful workflow starts with a receipt, prepares transaction details, and lets you compare them with the original before saving. The stored source should remain accessible from the expense record." },
    { kind: "p", text: "Correction and review remain part of the job. A faded receipt, a refund or a mixed personal purchase can need manual attention." },
    { kind: "h3", text: "Consistent Categories and Merchant Search", id: "merchant-memory-that-saves-time" },
    { kind: "p", text: "A good combined system makes repeat purchases quick. If you regularly buy supplies from the same vendor, you pick the category once and can filter by that merchant whenever you need it." },
    { kind: "p", text: "Review suggestions even for a familiar merchant. The same shop can sell supplies, equipment and personal items, and those may need different treatment." },
    { kind: "h2", text: "How Receipt Cycle Merges Both Into One App", id: "how-receiptcycle-merges-both-into-one-app" },
    { kind: "p", text: "Receipt Cycle was built on the premise that scanning and tracking should be one action, not two." },
    { kind: "p", text: "Receipt Cycle prepares details from a scan or upload. Review the merchant, date, amount, category and available line items, correct mistakes and save the transaction with its source." },
    { kind: "p", text: "Reports summarize the activity you have saved. Missing records, duplicate imports or incorrect categories can affect the totals, so compare them with your statements periodically." },
    { kind: "h2", text: "How to Roll This Out in a Week", id: "how-to-roll-this-out-in-a-week" },
    { kind: "ol", items: ["Choose one place for new receipts.", "Upload emailed documents and check their extracted details.", "Review missing records, duplicates and categories regularly.", "Open the available export and test its source links before sharing it."] },
    {
      kind: "links",
      title: "Further reading",
      items: [
        { label: "Freelancer expense tracking guide", href: "/blog/freelancers-guide-tracking-business-expenses" },
        { label: "How OCR scanning works", href: "/blog/how-ocr-receipt-scanning-works-ai-smarter" },
        { label: "Schedule C overview", href: "https://www.irs.gov/forms-pubs/about-schedule-c-form-1040", external: true },
      ],
    },
  ],
},
{
  slug: "how-ocr-receipt-scanning-works-ai-smarter",
  title: "How OCR Receipt Scanning Works and What to Check",
  description:
    "Learn how OCR turns receipt images into text, how extraction models propose fields, and why totals, dates and line items still need human review.",
  featuredImage: "/landing/blog-how-ocr-receipt-scanning-works-ai-smarter.webp?v=1",
  datePublished: "2026-04-28",
  dateModified: "2026-11-02",
  author: "Philip",
  readMinutes: 10,
  tags: ["OCR", "AI OCR", "receipt scanning", "data extraction", "expense tech"],
  tldr: "OCR recognizes text in an image. Extraction models use that text and layout to propose merchant, date, amount and item fields. Both stages can make mistakes, so compare the output with the original before saving.",
  faq: [
    { question: "What does OCR stand for?", answer: "OCR stands for Optical Character Recognition. It reads text from images and converts the characters into searchable digital text." },
    { question: "How accurate is OCR on receipts?", answer: "Accuracy depends on the receipt and the scanner. Clear printed receipts read very well. Faded, folded or glossy ones can cause mistakes, so always check the result against the original." },
    { question: "Does Receipt Cycle use OCR?", answer: "Yes. Receipt Cycle's [AI receipt scanner](/ai-receipt-scanner) reads the merchant, date, total, tax and line items from a photo or file, and you review the result before you save." },
    { question: "What files can I upload?", answer: "On the web you can upload PDF, CSV, XLS, XLSX, JPG or PNG files up to 12 MB. On Android you can scan with the camera or pick a file." },
  ],
  body: [
    { kind: "p", text: "You snap a photo of a receipt, and within seconds the app knows the merchant name, the date, the total, and what category it belongs to. That feels almost like magic the first time it happens." },
    { kind: "p", text: "Text recognition and field extraction do different jobs. Understanding that distinction makes it easier to spot where a result went wrong." },
    { kind: "h2", text: "OCR Basics for Receipts", id: "ocr-basics-for-receipts" },
    { kind: "p", text: "OCR stands for Optical Character Recognition. It is a technology that reads text from images. Instead of seeing a picture of a word, an OCR system converts those pixels into machine-readable characters." },
    { kind: "p", text: "Receipt scanning apps use OCR to turn your paper receipts into structured financial data." },
    { kind: "h3", text: "From Image Pixels to Structured Data", id: "from-image-pixels-to-structured-data" },
    { kind: "p", text: "Some scanning systems clean or straighten an image before text recognition. The exact pipeline varies by product; not every app uses the same preprocessing or model." },
    { kind: "p", text: "The raw output is a wall of text. The system still needs to decide which text is merchant name, date, total, and line items." },
    { kind: "image", src: "/landing/feature-money-leaks.svg", alt: "AI-assisted extraction and anomaly detection concept", caption: "A model can propose fields from document context, but the source still needs checking." },
    { kind: "h2", text: "Basic OCR vs AI-Enhanced OCR", id: "basic-ocr-vs-ai-enhanced-ocr" },
    { kind: "p", text: "OCR recognizes characters. A field-extraction model can use context to propose which text belongs in each field; it does not know whether the purchase was for your business." },
    { kind: "ul", items: ["Basic OCR can detect a date string but not always the transaction date.", "AI can infer which amount is the final total vs subtotal.", "Context can help propose fields, but accuracy depends on the document and model."] },
    { kind: "h2", text: "What Good Receipt OCR Should Extract", id: "what-good-receipt-ocr-should-extract" },
    { kind: "h3", text: "Merchant Name, Date, Total, and Line Items", id: "merchant-name-date-total-and-line-items" },
    { kind: "ul", items: ["Merchant name — who you paid", "Transaction date — when you paid", "Total amount — how much you paid", "Line items — what you paid for"] },
    { kind: "h3", text: "Why line-item context matters", id: "why-line-item-context-matters" },
    { kind: "p", text: "A restaurant receipt could be a client meal or a personal dinner. The total alone does not tell you which it is. Line-item context and notes make records far more defensible." },
    { kind: "h2", text: "Known OCR Failure Cases", id: "known-ocr-failure-cases" },
    { kind: "h3", text: "Low light and crumpled thermal paper", id: "low-light-and-crumpled-thermal-paper" },
    { kind: "p", text: "Thermal paper receipts are fragile. Poor light, crumples, and water damage degrade OCR results. Best practice: scan immediately in good light and keep receipts flat." },
    { kind: "h3", text: "Handwritten receipts", id: "handwritten-receipts" },
    { kind: "p", text: "Handwriting remains difficult for OCR. Good systems prompt review and let you manually correct uncertain fields while still storing the original image as documentation." },
    { kind: "h2", text: "How Receipt Cycle's OCR Engine Handles Your Receipt", id: "how-receiptcycle-ocr-engine-handles-your-receipt" },
    { kind: "p", text: "Receipt Cycle displays extracted details beside the source so you can review them. Check dates, currency, subtotal, tax, final total and item amounts where present. There is no guarantee that every error will be flagged, so correct the result before saving." },
    {
      kind: "links",
      title: "Related resources",
      items: [
        { label: "Receipt scanner for tax purposes", href: "/blog/receipt-scanner-tax-purposes-audit-ready-year-round" },
        { label: "Combined expense tracker + scanner", href: "/blog/expense-tracker-receipt-scanner-one-two-punch" },
        { label: "OCR explainer (IBM)", href: "https://www.ibm.com/think/topics/ocr", external: true },
      ],
    },
  ],
},
{
  slug: "ai-in-finance-personal-business-money-management",
  title: "AI in Finance: Practical Uses and Limits for Small Businesses",
  description:
    "Explore practical AI uses in receipt capture and financial-record review, the limits of automated analysis, and what to check before acting on an answer.",
  featuredImage: "/landing/blog-ai-in-finance-personal-business-money-management.webp?v=1",
  datePublished: "2026-04-28",
  dateModified: "2026-11-02",
  author: "Philip",
  readMinutes: 11,
  tags: ["AI finance", "automation", "cash flow", "subscription leaks", "small business"],
  tldr: "AI in finance is already practical for categorization, anomaly detection, and document processing, but humans still own intent, policy, and tax decisions.",
  faq: [
    { question: "How is AI used in personal finance?", answer: "AI supports categorization, spotting unusual transactions, spending analysis and plain-language reports." },
    { question: "Can AI replace my accountant?", answer: "No. AI improves record quality and speed, but tax strategy and professional advice still need a human expert." },
    { question: "Is it safe to use AI with my financial records?", answer: "Read how any app handles your data before you upload it. Receipt Cycle explains what it collects and why in its [privacy policy](/privacy)." },
    { question: "Does Receipt Cycle give financial advice?", answer: "No. Its AI features help you read receipts, spot patterns in your own entries and ask questions about your records. They are for information only." },
  ],
  body: [
    { kind: "p", text: "For a small business, a practical use of AI is turning a receipt into a draft record or finding a pattern in saved expenses. Its value depends on what you can verify, not how confident the answer sounds." },
    { kind: "p", text: "Start with a specific task: capture a document, review a category or compare spending between two periods." },
    { kind: "h2", text: "How AI Entered Everyday Finance", id: "how-ai-entered-everyday-finance" },
    { kind: "p", text: "Financial products use different models for different jobs. Text extraction, transaction grouping and forecasting are separate capabilities; do not assume an app offers all of them because it uses AI." },
    { kind: "p", text: "A model can propose details from a document, but it can also omit a line or choose the wrong amount. Keep the original and review the fields before saving." },
    { kind: "h2", text: "What AI Can Do Well Today", id: "what-ai-can-do-well-today" },
    { kind: "h3", text: "Automatic categorization", id: "automatic-categorization" },
    { kind: "p", text: "AI analyzes transactions and receipts and sorts them into practical categories. The same technology applies to receipt scanning where merchant and purchase context drive better categorization." },
    { kind: "h3", text: "Anomaly and subscription leak detection", id: "anomaly-and-subscription-leak-detection" },
    { kind: "p", text: "Some financial tools compare recurring charges or flag unusual activity. A flag is a reason to investigate, not proof of fraud or an unwanted subscription. Verify the merchant, billing period, refund and source transaction." },
    { kind: "image", src: "/landing/feature-find-charge.svg", alt: "Detection of unusual recurring charges", caption: "A pattern in saved records is a starting point for checking the source transactions." },
    { kind: "h3", text: "Questions About Saved Financial Records", id: "conversational-finance-coaching" },
    { kind: "p", text: "You can ask plain-language questions like \"How much did I spend on dining last month?\" and get usable answers without building manual reports." },
    { kind: "h3", text: "Document processing at scale", id: "document-processing-at-scale" },
    { kind: "p", text: "Invoice and receipt processing is one of AI's most practical wins. Documents are read, key fields extracted, and structured records created automatically." },
    { kind: "h3", text: "Cash flow forecasting", id: "cash-flow-forecasting" },
    { kind: "p", text: "Some tools offer forecasts based on historical activity and assumptions. Missing records or a change in customer payments can make those estimates unreliable. Receipt Cycle does not promise a forecasting service simply because it offers reports and an AI assistant." },
    { kind: "h2", text: "Where Humans Must Stay in the Loop", id: "where-humans-must-stay-in-the-loop" },
    { kind: "ul", items: ["AI cannot infer business intent perfectly.", "AI flags anomalies but cannot always determine legitimacy.", "Tax strategy and legal compliance still need qualified professionals.", "Final review remains essential for filing-quality records."] },
    { kind: "h3", text: "AI organizes evidence; professionals decide strategy", id: "ai-organizes-evidence-professionals-decide-strategy" },
    { kind: "p", text: "The best outcome is hybrid: AI handles repetitive preparation, while accountants and owners make policy and tax decisions." },
    { kind: "h2", text: "How Receipt Cycle Uses AI Inside Your Ledger", id: "how-receiptcycle-uses-ai-inside-your-ledger" },
    { kind: "p", text: "Receipt Cycle applies AI across the capture-to-ledger workflow: extraction via AI-enhanced OCR and category suggestions that you review before saving." },
    {
      kind: "links",
      title: "Explore next",
      items: [
        { label: "How OCR + AI improve receipt scanning", href: "/blog/how-ocr-receipt-scanning-works-ai-smarter" },
        { label: "Review recurring business costs", href: "/blog/self-employed-tax-deductions" },
        { label: "NerdWallet subscription spending analysis", href: "https://www.nerdwallet.com/article/finance/how-to-stop-paying-monthly-subscriptions-you-forgot-about", external: true },
      ],
    },
  ],
},
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
