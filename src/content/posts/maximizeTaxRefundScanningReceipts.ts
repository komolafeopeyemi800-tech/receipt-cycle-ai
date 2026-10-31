import type { BlogPost } from "../blogPosts";
import { PLAY_STORE_URL } from "../../lib/schema";

/**
 * "How to Maximize Your Tax Refund by Scanning Receipts: Turn Receipts Into Tax Write-Offs".
 * Written with the human-writing skill (.claude/skills/human-writing): specific facts, honest limits, no hype.
 * The ideas (scan on the phone, check the numbers, export to a spreadsheet, trace a number back to its source, use AI to
 * catch obvious mistakes) were adapted from competitor demo scripts. No competitor name, wording or feature is used, and
 * every Receipt Cycle claim matches what the app does today.
 *
 * IRS facts were read on 2026-10-28/29: Publication 463 (2025) documentary evidence, "How long should I keep records?"
 * (reviewed 2026-06-30), "Recordkeeping" (2026-05-01), Rev. Proc. 97-22 (IRB 1997-13).
 */
const IMG = "/landing/blog/go-paperless-with-receipts";

export const maximizeTaxRefundPost: BlogPost = {
  slug: "maximize-tax-refund-by-scanning-receipts",
  title: "Scan Receipts for Taxes: How to Claim More Write-Offs (2026 Guide)",
  description:
    "Scan receipts for taxes with a receipt scanner app. See what the IRS accepts as proof, how long to keep records, and how to export one clean file.",
  featuredImage: "/landing/blog-maximize-tax-refund-by-scanning-receipts.webp?v=1",
  featuredImageAlt: "Person scanning a paper receipt with a phone at a desk covered in receipts, ready for tax season",
  featuredImageWidth: 1600,
  featuredImageHeight: 900,
  category: "Tax records",
  datePublished: "2026-04-17",
  dateModified: "2026-10-31",
  author: "Philip",
  readMinutes: 11,
  tags: ["scan receipts for taxes", "tax refund", "tax write-offs", "receipt scanner app", "tax receipt organizer", "digital receipt storage"],
  tldr:
    "A refund is not guaranteed, but a deduction you can prove is a deduction you can claim. Scan receipts for taxes the day you get them, check what the scanner read, and export one clean file for your accountant. That habit stops lost receipts from costing you money.",
  keyTakeaways: [
    "You can only claim a write-off you can prove, so scan receipts the day you get them.",
    "The IRS looks for the amount, the date, the place and what the expense was for.",
    "Always check what the scanner read against the original before you save.",
    "One export with a link to every receipt saves your accountant hours.",
    "Keep records at least 3 years in most cases, and longer in a few.",
  ],
  resources: [
    {
      label: "IRS Publication 463: Travel, Gift, and Car Expenses",
      href: "https://www.irs.gov/publications/p463",
      note: "The documentary evidence rules, including the $75 exception.",
    },
    {
      label: "IRS: How long should I keep records?",
      href: "https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records",
      note: "The 3, 6 and 7 year rules, reviewed June 30, 2026.",
    },
    {
      label: "IRS: Recordkeeping",
      href: "https://www.irs.gov/businesses/small-businesses-self-employed/recordkeeping",
      note: "What a business record should prove, reviewed May 1, 2026.",
    },
    {
      label: "IRS Rev. Proc. 97-22: Electronic storage of books and records",
      href: "https://www.irs.gov/pub/irs-irbs/irb97-13.pdf",
      note: "The conditions for keeping scanned records instead of paper.",
    },
    {
      label: "IRS: About Schedule C (Form 1040)",
      href: "https://www.irs.gov/forms-pubs/about-schedule-c-form-1040",
      note: "Where sole proprietors report business income and expenses.",
    },
    {
      label: "IRS: Estimated taxes",
      href: "https://www.irs.gov/businesses/small-businesses-self-employed/estimated-taxes",
      note: "Who pays estimated tax and how.",
    },
  ],
  body: [
    {
      kind: "p",
      text: "It is tax season again. Your accountant is asking for expense records. Your receipts are on your phone, in a bag, and in an email you cannot find. Your invoices are buried in PDFs. The deadline is coming, and everyone wants documents that should have been organized months ago.",
    },
    {
      kind: "p",
      text: "The hard part of tax time is not filing. It is collecting, organizing and checking your paperwork. This guide shows how to scan receipts for taxes with a receipt scanner app, in a routine that does all three as you go.",
    },
    {
      kind: "p",
      text: "Updated October 31, 2026: I re-read the IRS pages, added the limits of Receipt Cycle, the costs, a comparison table and a video.",
    },
    { kind: "h2", text: "Why messy receipts cost you money", id: "why-messy-receipts-cost-you-money" },
    {
      kind: "p",
      text: "A write-off only helps if you can back it up. If you cannot show what you paid, to whom and why, you may not be able to claim it. That is how people lose deductions they were entitled to, and why a tidy record can mean a smaller tax bill.",
    },
    {
      kind: "p",
      text: "Scanning does not create a refund. What it does is make sure every expense you can document actually gets claimed, which is how a tax receipt organizer earns its keep. Whether you get a refund, or owe less, depends on your whole return.",
    },
    {
      kind: "p",
      text: "So what counts as proof? [IRS Publication 463](https://www.irs.gov/publications/p463) says you generally need receipts, canceled checks or bills. For travel, gift and car expenses it waives the receipt for items under $75, except lodging, but you still need a record of the amount, time, place and purpose. And the proof is usually adequate when it shows four things: the amount, the date, the place, and what the expense was for.",
    },
    {
      kind: "video",
      videoId: "RfpbqzLbvgA",
      title: "You're Throwing Away Money and Don't Even Realize It",
      description: "Official Receipt Cycle video about how lost receipts can turn into expenses you cannot document, and what poor receipt tracking can cost freelancers and small business owners.",
      caption: "Our video on what lost receipts can cost freelancers and small business owners (11 minutes).",
      uploadDate: "2026-10-27",
      durationIso: "PT11M29S",
    },
    { kind: "h2", text: "What receipts should you scan for taxes?", id: "what-to-scan" },
    {
      kind: "p",
      text: "The rule is simple: scan anything you paid for to run your work. The table below shows what that looks like for different kinds of earners. It is a starting list for a conversation with your accountant, not a promise that every item is deductible.",
    },
    {
      kind: "table",
      caption: "Receipts and invoices worth capturing",
      columns: ["If you are a", "Capture these", "Add a note about"],
      rows: [
        ["Freelancer or consultant", "Software, equipment, courses, client meals, travel", "The client or project"],
        ["Online seller or side hustler", "Shipping receipts, ad spend invoices, supplier bills, subscription fees", "The product or campaign"],
        ["Gig driver or courier", "Fuel, tolls, parking, phone plan, supplies", "The shift or route. Receipt Cycle has no GPS mileage, so keep a separate mileage log"],
        ["Small business owner", "Supplier invoices, rent, tools, professional fees", "The job or department"],
      ],
      tones: true,
    },
    {
      kind: "p",
      text: "If you are self-employed, the [freelancer tax receipt tracker](/freelancer-tax-receipt-tracker) page shows how this fits the way you file on Schedule C. Gig worker? Read the [gig worker income and expense guide](/blog/gig-workers-income-expense-guide).",
    },
    { kind: "h2", text: "How to scan receipts for taxes, step by step", id: "how-to-scan-receipts-for-taxes" },
    { kind: "h3", text: "Step 1: Scan on your phone the day you get it", id: "step-1-scan-on-your-phone" },
    {
      kind: "p",
      text: "Open the Receipt Cycle app on Android, tap Scan receipt, and take a photo. This is the fastest way to scan receipts for taxes. It works best on a clean, plain surface with the whole slip in view. Avoid shadows and glare, and flatten folded paper first.",
    },
    {
      kind: "p",
      text: "The [AI receipt scanner](/ai-receipt-scanner) reads the merchant, date, total, tax and line items. The original photo stays attached to the record, so your proof is saved the moment you save.",
    },
    {
      kind: "cta",
      title: "Scan your first receipt in under a minute",
      text: "Download the Android app, or use the web app in your browser. Your records are the same in both.",
      label: "Get the Android app",
      href: PLAY_STORE_URL,
      note: "Or start your 7-day free trial on the web.",
    },
    { kind: "h3", text: "Step 2: Check what it read before you save", id: "step-2-check-what-it-read" },
    {
      kind: "p",
      text: "This is the step people skip, and it is the one that protects you. Look at the date, the amount and the merchant. If a number is wrong, fix it. Reading a faded or crumpled receipt is hard for any scanner, and a wrong digit in a total is a wrong digit in your records.",
    },
    {
      kind: "p",
      text: "You can always open a record later and see the extracted details next to the original receipt. If an amount looks off, you check it against the source in seconds instead of guessing.",
    },
    {
      kind: "p",
      text: "Example, with made-up numbers: a freelancer scans a $48.20 software receipt and the scanner reads $48.02. She fixes the digits, adds the client name, and the export later shows $48.20 with a link to the photo.",
    },
    { kind: "h3", text: "Step 3: Use your computer for big batches", id: "step-3-use-your-computer-for-batches" },
    {
      kind: "p",
      text: "A pile of PDF invoices, email receipts or a bank statement is easier to handle on a computer. On the web app you upload PDF, CSV, XLS, XLSX, JPG or PNG files up to 12 MB. Receipt Cycle reads them, and you review before saving. Phone and computer use the same account, so nothing needs copying between them.",
    },
    { kind: "h3", text: "Step 4: Speak the expenses that have no receipt", id: "step-4-speak-expenses-without-receipts" },
    {
      kind: "p",
      text: "Some purchases never come with a receipt, like a toll, a parking meter or a cash tip. An expense tracker app should handle those too. Say it out loud, for example: forty-five dollars of fuel at a gas station for a client trip. Receipt Cycle turns the words into a record, and you check it before you save. A note made at the time is far better than a guess in April.",
    },
    { kind: "h2", text: "What to look for in a receipt scanner app for taxes", id: "what-to-look-for-in-a-receipt-scanner-app" },
    {
      kind: "p",
      text: "Not every app that takes a photo of a receipt is a good tax receipt organizer. Before you commit to one, check that it does these things. Receipt Cycle does all of them, and you can test each one during the free trial.",
    },
    {
      kind: "ul",
      items: [
        "It reads the key details (merchant, date, total, tax) and shows them to you to check.",
        "It keeps the original image with every record, as digital receipt storage you can open later.",
        "It lets you fix a wrong number instead of locking it in.",
        "It works on your phone and on a computer, with one account.",
        "It exports a clean file with links to each receipt, not only a flat list of totals.",
        "It lets you try everything before you pay.",
      ],
    },
    {
      kind: "p",
      text: "Want to compare options first? Our guide to the [best receipt scanner apps for small business](/blog/best-receipt-scanner-app-small-business-2026) lays out the trade-offs, and [expense reporting software](/expense-reporting-software) shows how the pieces connect for a team.",
    },
    { kind: "h2", text: "Scanner app, shoebox, card statement or spreadsheet?", id: "scanner-app-vs-shoebox-vs-spreadsheet" },
    {
      kind: "table",
      caption: "Ways to keep proof for your expenses",
      columns: ["Method", "Proves what you bought", "Easy to find later", "Better fit when"],
      rows: [
        ["Receipt scanner app", "Yes, with the original image", "Yes", "You get many receipts"],
        ["Shoebox of paper", "Yes", "Slow", "You have only a few a year"],
        ["Card statement only", "No, only the charge", "Yes", "Never on its own"],
        ["Spreadsheet", "Only if you attach the receipts", "Yes", "You are happy to type everything"],
      ],
      tones: true,
    },
    { kind: "h2", text: "How do you give your accountant one clean file?", id: "one-clean-file-for-your-accountant" },
    {
      kind: "p",
      text: "Your accountant should not have to chase you for documents. When your records are in one place, you can hand over everything in one step.",
    },
    {
      kind: "p",
      text: "Open Backup and export and download the Excel report. It starts with a summary of totals by category, month, week and day. At the bottom it lists every transaction with a link that opens its stored receipt. Prefer something plainer? Download a CSV, or save the report straight to Google Sheets.",
    },
    {
      kind: "image",
      src: `${IMG}/receipt-cycle-backup-export-excel-report.webp`,
      alt: "Receipt Cycle Backup and Export page with Download Excel report, Download CSV and Save to Google options",
      caption: "Download an Excel report, a CSV, or save the report straight to Google Sheets.",
      width: 1152,
      height: 528,
      title: "Export receipts for your accountant in Receipt Cycle",
    },
    {
      kind: "p",
      text: "Need only part of it? On the Analysis page, filter by category or merchant and export just those receipts. That is handy when your accountant asks about one expense type, such as advertising or supplies.",
    },
    { kind: "h2", text: "Can AI catch mistakes in your receipts?", id: "let-ai-catch-the-obvious-mistakes" },
    {
      kind: "p",
      text: "Before you send anything, give your records one more look. In Receipt Cycle, the AI analysis on the Analysis page looks across the entries you saved for repeated charges, possible duplicates and amounts that stand out. You can also ask the [AI financial assistant](/ai-financial-assistant) plain questions about your spending.",
    },
    {
      kind: "p",
      text: "It does not replace a tax professional, and it does not check your tax forms. It helps you spot a double entry or a typo before your accountant does.",
    },
    { kind: "h2", text: "How long to keep scanned receipts", id: "how-long-to-keep-scanned-receipts" },
    {
      kind: "p",
      text: "The IRS says to keep most records for 3 years. It says 6 years if you left out more than 25 percent of your gross income, and 7 years for a bad debt or worthless securities claim. You can read the full list on its [how long to keep records](https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records) page, which was last reviewed on June 30, 2026.",
    },
    {
      kind: "p",
      text: "Can you throw away the paper? Often, if your digital copies are complete, legible and easy to find again, as [Rev. Proc. 97-22](https://www.irs.gov/pub/irs-irbs/irb97-13.pdf) describes. Our guide to [going paperless with receipts](/blog/go-paperless-with-receipts) explains what that means in practice, and when to keep the original anyway.",
    },
    { kind: "h2", text: "A simple routine that keeps tax season calm", id: "a-simple-routine" },
    {
      kind: "ol",
      items: [
        "Every day: scan or upload each business receipt when you get it, and check the numbers.",
        "Every Friday: spend five minutes finding records with a missing receipt or the wrong category.",
        "Every month: open Analysis and look at where your money went.",
        "Every quarter: download one Excel export and keep a copy in your cloud drive.",
        "At tax time: send your accountant the final export with its receipt links.",
      ],
    },
    {
      kind: "p",
      text: "Scanning one receipt takes a minute or less, and the weekly check takes a few minutes. That beats an evening spent searching your inbox in April, and it turns your phone into a receipt tracker that works for you all year.",
    },
    { kind: "h2", text: "Mistakes that cost you write-offs", id: "mistakes-that-cost-you-write-offs" },
    {
      kind: "ul",
      items: [
        "Scanning in bulk months later, when you can no longer remember the purpose.",
        "Saving a photo without checking that the total and date are readable.",
        "Keeping only a card statement. It shows the charge but not what you bought.",
        "Mixing personal and business purchases in the same record.",
        "Skipping the note on meals and travel, so you cannot say what they were for.",
      ],
    },
    { kind: "h2", text: "Who is Receipt Cycle not for, and what does it cost?", id: "who-is-receipt-cycle-not-for" },
    {
      kind: "p",
      text: "Receipt Cycle is not tax software. It has no GPS mileage, live bank feeds, email forwarding, tax filing or general ledger. Scanning with the camera is on Android only, and iPhone users can upload photos and files on the web app. The free plan is a 7-day Pro trial with up to 25 transactions. [Pro](/pricing) costs $3.50 a month, $35 a year or $60 once. Setup takes a few minutes: create an account, scan one receipt, check it, and run one export.",
    },
    {
      kind: "cta",
      title: "Start your 7-day free trial",
      text: "Scan or upload your next ten receipts, check the details, and run one export. See how much calmer tax season feels.",
      label: "Start your 7-day free trial",
      href: "/signup",
      note: "No credit card needed for the web app.",
    },
    {
      kind: "links",
      title: "Keep reading",
      items: [
        { label: "How to go paperless with your receipts", href: "/blog/go-paperless-with-receipts" },
        { label: "How one freelancer tracks business expenses for tax time", href: "/blog/freelancers-guide-tracking-business-expenses" },
        { label: "How OCR receipt scanning works", href: "/blog/how-ocr-receipt-scanning-works-ai-smarter" },
        { label: "Expense reporting software", href: "/expense-reporting-software" },
      ],
    },
  ],
  faq: [
    {
      question: "Do digital receipts count for tax purposes?",
      answer:
        "Yes, if they meet the IRS conditions for electronic records in [Rev. Proc. 97-22](https://www.irs.gov/pub/irs-irbs/irb97-13.pdf): complete, legible, easy to retrieve and checked regularly. The receipt should show the amount, date, place and what the expense was for.",
    },
    {
      question: "How long do I need to keep my receipts?",
      answer:
        "Keep them 3 years in most cases. The [IRS](https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records) says 6 years if you left out more than 25 percent of your gross income, and 7 years for a bad debt or worthless securities claim.",
    },
    {
      question: "Do I need receipts for small purchases?",
      answer:
        "For travel, gift and car expenses under $75, the IRS says documentary evidence is not required, except for lodging. You still need a record of the amount, time, place and purpose, and a receipt is the easiest record.",
    },
    {
      question: "What if I lose my phone?",
      answer:
        "Your records live in your Receipt Cycle account, not only on the phone. Sign in on a new phone or on the web and they are there. Download an Excel export every quarter and keep a copy in your cloud drive as a second backup.",
    },
    {
      question: "Is a bank or card statement enough instead of a receipt?",
      answer:
        "Usually not. A statement shows that you paid, but not what you bought or why. Keep the receipt, or add a note with the purpose, and attach the statement as support.",
    },
    {
      question: "What happens if a scan is blurry or wrong?",
      answer:
        "Retake it in better light, or fix the details by hand before you save. You can compare the extracted data with the original receipt at any time, so a mistake is easy to spot.",
    },
    {
      question: "Can Receipt Cycle file my taxes?",
      answer:
        "No. Receipt Cycle helps you capture and organize records and export them for your accountant. It does not file returns or give tax advice.",
    },
    {
      question: "Can I try Receipt Cycle for free?",
      answer:
        "Yes. The free plan includes a 7-day Pro trial with up to 25 transactions, and the web app needs no credit card. [Pro](/pricing) is $3.50 a month, $35 a year, or $60 once for lifetime access.",
    },
  ],
};
