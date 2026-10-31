import type { BlogPost } from "../blogPosts";

/**
 * "How to Go Paperless With Your Receipts (And Never Lose One Again)".
 * Written with the human-writing skill (.claude/skills/human-writing): specific facts, honest limits, no hype.
 * Tax facts were read from the IRS pages listed in `resources` on 2026-10-28:
 *  - "How long should I keep records?" (reviewed 2026-06-30), "Recordkeeping" (reviewed 2026-05-01)
 *  - Publication 463 (2025), "Documentary evidence"
 *  - Rev. Proc. 97-22 (IRB 1997-13), sections 4.01, 6 and 7
 * Product facts match what the app does today: phone scan (Android), web upload (PDF, CSV, XLS, XLSX, JPG, PNG up to 12 MB),
 * voice entry, manual entry, the original file kept with the record, filters, Excel and CSV exports with document links.
 */
const IMG = "/landing/blog/go-paperless-with-receipts";

export const goPaperlessWithReceiptsPost: BlogPost = {
  slug: "go-paperless-with-receipts",
  title: "How to Go Paperless With Receipts (And Never Lose One Again)",
  description:
    "Go paperless with receipts in one afternoon. See what the IRS accepts, how long to keep digital receipts, and the setup that stops lost deductions.",
  featuredImage: "/landing/blog-go-paperless-with-receipts.webp?v=1",
  featuredImageAlt: "Paper receipts and a phone scanning a receipt to go paperless with digital receipt storage",
  featuredImageWidth: 1600,
  featuredImageHeight: 900,
  category: "Receipt scanning",
  datePublished: "2026-04-17",
  dateModified: "2026-10-31",
  author: "Philip",
  readMinutes: 11,
  tags: ["go paperless with receipts", "digital receipt storage", "receipt scanner app", "receipt organizer", "tax records"],
  tldr:
    "To go paperless with receipts, capture each one the day you get it, store the image with its date, amount and category, and back it up in a second place. The IRS accepts scanned records when they are legible, indexed and retrievable. Keep them 3 years in most cases, and longer in a few.",
  keyTakeaways: [
    "Capture the receipt the day you get it. Thermal paper fades, and memory fades faster.",
    "The IRS can accept a scanned receipt if it is legible, searchable and backed by regular checks.",
    "Most tax records need to be kept 3 years. Some need 6 or 7 years, and a few need longer.",
    "A receipt should show the amount, the date, the place and what it was for.",
    "Back up in two places, and test that you can open a file from last year.",
  ],
  resources: [
    {
      label: "IRS: How long should I keep records?",
      href: "https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records",
      note: "The 3, 6 and 7 year rules, reviewed June 30, 2026.",
    },
    {
      label: "IRS: Recordkeeping",
      href: "https://www.irs.gov/businesses/small-businesses-self-employed/recordkeeping",
      note: "What a business record should show, reviewed May 1, 2026.",
    },
    {
      label: "IRS Publication 463: Travel, Gift, and Car Expenses",
      href: "https://www.irs.gov/publications/p463",
      note: "The documentary evidence rules, including the $75 exception.",
    },
    {
      label: "IRS Rev. Proc. 97-22: Electronic storage of books and records",
      href: "https://www.irs.gov/pub/irs-irbs/irb97-13.pdf",
      note: "The conditions for keeping scanned records instead of paper (Internal Revenue Bulletin 1997-13).",
    },
    {
      label: "IRS Publication 583: Starting a Business and Keeping Records",
      href: "https://www.irs.gov/publications/p583",
      note: "A plain guide to business records.",
    },
  ],
  body: [
    {
      kind: "p",
      text: "It is the week before the deadline and your kitchen table looks like a paper storm. One receipt went through the wash. Another is a thermal slip gone pale, and you cannot tell if the charge was $14 or $44.",
    },
    {
      kind: "p",
      text: "Every receipt you cannot produce is an expense you may not be able to prove. So here is a plan to go paperless with receipts that you can finish in one afternoon and keep up with a few seconds per receipt.",
    },
    {
      kind: "p",
      text: "Updated October 31, 2026: made the advice on throwing away paper stricter, added a comparison column, an example and a short video.",
    },
    { kind: "h2", text: "What does going paperless with receipts really mean?", id: "what-going-paperless-means" },
    {
      kind: "p",
      text: "Going paperless does not mean you stop getting paper. It means every receipt becomes a clear digital copy that is easy to find, safe from loss, and tied to the purchase it proves.",
    },
    {
      kind: "p",
      text: "A photo in your camera roll does not count. Nobody can search it, sort it or hand it to an accountant. A paperless receipt system does three jobs: it captures, it organizes, and it protects. That is digital receipt storage you can search, which is what a receipt organizer should give you.",
    },
    {
      kind: "ul",
      items: [
        "Capture: a photo, a scan, an upload, or a few spoken words when there is no receipt.",
        "Organize: the date, merchant, amount and category stored with the image so you can search it.",
        "Protect: a backup in a second place, so one lost phone cannot erase your records.",
      ],
    },
    { kind: "h2", text: "Can you throw away paper receipts after scanning them?", id: "can-you-throw-away-paper-receipts" },
    {
      kind: "p",
      text: "Sometimes. IRS Revenue Procedure 97-22 lets you destroy original paper only after you test your scanning system and set up procedures to keep it working. If your system does not meet the conditions, you may need the originals.",
    },
    {
      kind: "p",
      text: "The IRS spelled out the rules for electronic records in [Revenue Procedure 97-22](https://www.irs.gov/pub/irs-irbs/irb97-13.pdf). It lets you destroy the original paper after you test your system and set up procedures to keep it working. The system has to meet these conditions:",
    },
    {
      kind: "ul",
      items: [
        "It must transfer the paper record to digital form accurately and completely.",
        "It must index, store, preserve, retrieve and reproduce the record.",
        "It needs reasonable controls to prevent and detect changes or loss.",
        "You must run regular checks on the stored records.",
        "What you display or print must be legible and readable, so every number is clear.",
        "You must keep the record as long as its contents may matter for tax law.",
      ],
    },
    {
      kind: "p",
      text: "If your system fails these tests, the IRS may treat your records as incomplete, which can lead to a notice of inadequate records and penalties. Those penalties may not apply if you still hold the original paper. Do not shred anything until you have checked the scan, backed it up and opened the backup.",
    },
    {
      kind: "callout",
      title: "A safe rule of thumb",
      text: "Check every scan on screen before you shred anything. If you can read every number, keep the image and back it up. If a receipt backs up a big purchase, a contract or a warranty, keep the paper too. This is general information, not tax advice. Ask a tax professional about your own case.",
    },
    { kind: "h2", text: "What does a receipt have to show?", id: "what-a-receipt-has-to-show" },
    {
      kind: "p",
      text: "If you scan receipts for taxes, the proof inside them matters most. [IRS Publication 463](https://www.irs.gov/publications/p463) says documentary evidence is usually adequate when it shows four things: the amount, the date, the place, and the essential character of the expense. In plain words, how much, when, where and what for.",
    },
    {
      kind: "p",
      text: "The same publication says you generally need receipts, canceled checks or bills to support expenses. It lists an exception for an expense under $75, as long as it is not lodging. Do not lean on that exception. A $60 lunch with no note about who you met is still hard to defend, and a receipt makes it easy.",
    },
    {
      kind: "table",
      caption: "What to capture for common business expenses",
      columns: ["Expense", "Capture the receipt?", "Add a short note"],
      rows: [
        ["Client meal", "Yes, always", "Who you met and why"],
        ["Hotel stay", "Yes, any amount", "The trip and its purpose"],
        ["Software subscription", "Yes, the invoice or email", "Which project it supports"],
        ["Office supplies", "Yes", "Usually none needed"],
        ["Fuel and parking", "Yes, if you have one", "The trip or client"],
        ["Small cash purchase", "Yes, or log it by voice", "What it was for"],
      ],
      tones: true,
    },
    { kind: "h2", text: "How long to keep digital receipts", id: "how-long-to-keep-digital-receipts" },
    {
      kind: "p",
      text: "Going paperless does not change how long you keep records. A digital copy follows the same clock as the paper one. The IRS page on [how long to keep records](https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records) sets the periods below.",
    },
    {
      kind: "table",
      caption: "How long the IRS says to keep tax records",
      columns: ["Situation", "Keep records for"],
      rows: [
        ["Most returns", "3 years"],
        ["You did not report income that is more than 25% of the gross income on your return", "6 years"],
        ["You claim a loss from worthless securities or a bad debt deduction", "7 years"],
        ["You did not file a return, or you filed a fraudulent one", "Indefinitely"],
        ["Employment tax records", "At least 4 years"],
        ["Property you own", "Until the limit runs out for the year you dispose of it"],
      ],
      tones: true,
    },
    {
      kind: "p",
      text: "Because the rules differ, many people keep business records for seven years and call it done. Check your own situation. State rules and some industries can ask for more.",
    },
    { kind: "h2", text: "How to go paperless with receipts, step by step", id: "how-to-go-paperless-step-by-step" },
    { kind: "h3", text: "Step 1: Choose how you will capture receipts", id: "step-1-choose-capture" },
    {
      kind: "p",
      text: "You need one habit that works on a bad day. Pick the capture method that costs you the fewest seconds. Most people end up using two.",
    },
    {
      kind: "table",
      caption: "Ways to get a receipt into Receipt Cycle",
      columns: ["Method", "Where it works", "Best for"],
      rows: [
        ["Scan with the camera", "Android app", "Paper receipts at the counter"],
        ["Upload a file", "Web and Android", "PDFs, email receipts, photos and statements"],
        ["Speak it", "Web and Android", "Purchases with no receipt"],
        ["Type it in", "Web and Android", "Cash payments and quick notes"],
      ],
      tones: true,
    },
    {
      kind: "p",
      text: "On the web you upload PDF, CSV, XLS, XLSX, JPG or PNG files up to 12 MB. On the phone you can scan with the camera or pick any file. The [AI receipt scanner](/ai-receipt-scanner) reads the merchant, date, total, tax and line items, and you check them before you save.",
    },
    {
      kind: "video",
      videoId: "-Kz9ZGTjl78",
      title: "Stop Typing Your Receipts In By Hand (Scan or Just Say It)",
      description: "Official Receipt Cycle short: point your phone at a receipt and it reads the store, date and total, or say what you spent and it is logged.",
      caption: "Our 30-second video on scanning a receipt or saying what you spent.",
      uploadDate: "2026-10-30",
      durationIso: "PT31S",
    },
    { kind: "h3", text: "Step 2: Gather the backlog once", id: "step-2-gather-the-backlog" },
    {
      kind: "p",
      text: "Pull every loose receipt from bags, glove boxes, jacket pockets and drawers. Sort them into two piles: business and everything else. Throw away anything that has no tax or warranty value.",
    },
    {
      kind: "p",
      text: "Do not try to scan a year in one sitting. Start with this month, then work backward a month at a time. The newest receipts are the ones you are most likely to need.",
    },
    { kind: "h3", text: "Step 3: Scan the day you get it", id: "step-3-scan-the-day-you-get-it" },
    {
      kind: "p",
      text: "This step decides whether the system works. A receipt you scan at the counter takes seconds. A receipt you scan next month can take ten minutes of hunting, and some are gone by then.",
    },
    {
      kind: "ul",
      items: [
        "Lay the receipt flat on a dark surface and keep the whole slip in view.",
        "Avoid shadows and glare. Glossy and folded receipts may need a second angle.",
        "Zoom in on the screen and check that the total and date are readable before you move on.",
        "Fix anything the scanner got wrong, then save.",
      ],
    },
    { kind: "h3", text: "Step 4: Name, tag and categorize", id: "step-4-name-tag-categorize" },
    {
      kind: "p",
      text: "If you store receipts in plain folders, name each file so you can find it later. A pattern that works is year, month, day, merchant and total, for example 2026-10-14 Target 86.35. The date first keeps files in order.",
    },
    {
      kind: "p",
      text: "An app can do this for you. Receipt Cycle keeps the date, merchant, amount and category with the image, so the file name matters less. A simple category list is enough: meals, travel, software, supplies, utilities, and a few of your own.",
    },
    { kind: "h3", text: "Step 5: Make every receipt searchable", id: "step-5-make-it-searchable" },
    {
      kind: "p",
      text: "OCR, short for optical character recognition, turns the printed text on a photo into data you can search. [How OCR receipt scanning works](/blog/how-ocr-receipt-scanning-works-ai-smarter) explains the details. What matters here is the result: you type a merchant name and find the receipt in seconds.",
    },
    {
      kind: "image",
      src: `${IMG}/receipt-cycle-find-receipts-filter-export.webp`,
      alt: "Receipt Cycle Analysis page filtering receipts by the Groceries category with export buttons",
      caption: "Filter by category or merchant to see only those receipts, then export that exact list.",
      width: 1120,
      height: 540,
      title: "Find receipts by category and merchant in Receipt Cycle",
    },
    {
      kind: "p",
      text: "In Receipt Cycle, the Analysis page has a Find receipts section. Choose a category such as groceries, or type part of a merchant name, and you see only those receipts. You can export that list as a CSV of receipts, as a CSV of every item with its price, or as an Excel workbook.",
    },
    { kind: "h3", text: "Step 6: Back up in a second place", id: "step-6-back-up" },
    {
      kind: "p",
      text: "One copy is not a backup. Your app account is the first copy. Add a second one somewhere else, so a lost login or a deleted account cannot take everything.",
    },
    {
      kind: "ul",
      items: [
        "Download an Excel or CSV export every quarter and store it in a cloud drive.",
        "Use Save to Google Sheets to send the report to your own Google Drive.",
        "On Android, link Google Drive backup in Settings.",
        "Keep a yearly copy on an external drive in a safe place.",
      ],
    },
    {
      kind: "p",
      text: "Then test it. Once a year, open a receipt from last year in the backup. A backup you have never opened is a guess.",
    },
    { kind: "h3", text: "Step 7: Set a weekly five-minute check", id: "step-7-weekly-check" },
    {
      kind: "p",
      text: "Pick one day, such as Friday. Open your transactions, look for anything with no receipt attached, and fix the gaps while you still remember the purchase. Five minutes a week beats a weekend in April.",
    },
    { kind: "h2", text: "Phone camera, desk scanner or receipt app?", id: "phone-scanner-or-app" },
    {
      kind: "p",
      text: "A phone camera, a desk scanner, a cloud drive and a receipt scanner app each suit a different volume. The fit depends on how many receipts you handle and whether you want them organized or only stored.",
    },
    {
      kind: "table",
      caption: "Tools for going paperless with receipts",
      columns: ["Tool", "Good for", "Watch out for", "Better fit when"],
      rows: [
        ["Phone camera and a folder", "Costs nothing and starts today", "No search, no categories, and a messy camera roll", "You have under 10 receipts a month"],
        ["Desk sheet-fed scanner", "Clearing a large paper backlog fast. Costs more up front", "You still have to name, file and sort every image", "You have a big pile to clear once"],
        ["Cloud drive such as Google Drive", "Safe, shared storage", "Stores files but does not read them", "You share files with others"],
        ["Receipt scanner app", "Reading, sorting and exporting receipts", "Costs money after the 7-day trial. Camera scan is Android only, and the web app takes uploads", "You have a steady flow of receipts"],
      ],
      tones: true,
    },
    {
      kind: "p",
      text: "If you handle more than a handful of receipts a month, an app that reads them saves the most time. [Receipt Cycle](/signup) scans on Android, takes uploads on the web, accepts voice entries, and keeps the original file next to each record. To compare it with other apps, read [the best receipt scanner apps for small business](/blog/best-receipt-scanner-app-small-business-2026).",
    },
    {
      kind: "cta",
      title: "Scan your first receipt free",
      text: "Try Receipt Cycle for 7 days with nothing to pay. Scan or upload a few real receipts and see if the habit sticks.",
      label: "Start free for 7 days",
      href: "/signup",
      note: "No credit card needed for the web app.",
    },
    { kind: "h2", text: "How do you get receipts ready for tax time?", id: "get-ready-for-tax-time" },
    {
      kind: "p",
      text: "A tidy archive pays off when someone asks for it. If you scan receipts for taxes, this is the moment it counts. Your accountant wants clear totals and proof for each number. Receipt Cycle's Excel report opens on a summary of totals by category, month, week and day. At the bottom it lists every transaction with a link that opens its stored receipt.",
    },
    {
      kind: "image",
      src: `${IMG}/receipt-cycle-backup-export-excel-report.webp`,
      alt: "Receipt Cycle Backup and Export page with Download Excel report, Download CSV and Save to Google options",
      caption: "Download an Excel report, a CSV, or save the report straight to Google Sheets.",
      width: 1152,
      height: 528,
      title: "Export receipts for tax records in Receipt Cycle",
    },
    {
      kind: "p",
      text: "Give your accountant the workbook and tell them the links open the receipts. If you are self-employed, the [freelancer tax receipt tracker](/freelancer-tax-receipt-tracker) page shows how this fits a normal tax year, and the [guide to tracking business expenses](/blog/freelancers-guide-tracking-business-expenses) covers categories. For deductions, read [how scanning receipts can raise your refund](/blog/maximize-tax-refund-by-scanning-receipts).",
    },
    {
      kind: "p",
      text: "Receipt Cycle helps you keep records. It does not file your taxes or tell you what you can deduct.",
    },
    { kind: "h2", text: "Mistakes that make digital receipts useless", id: "mistakes-that-break-digital-receipts" },
    {
      kind: "ol",
      items: [
        "Scanning late. Thermal ink fades and you forget what the purchase was.",
        "Cropping the total. A receipt that cuts off the amount proves nothing.",
        "Skipping the note. A meal receipt with no names is weaker than one with a short reason.",
        "Mixing personal and business. Separate them when you save, not at year end.",
        "Keeping one copy. If it lives only on your phone, it is not safe.",
        "Never checking. Open a few old scans every quarter to confirm they are readable.",
      ],
    },
    { kind: "h2", text: "Your 30-minute starter plan", id: "starter-plan" },
    {
      kind: "ol",
      items: [
        "Pick your capture method and set up the app (5 minutes).",
        "Scan or upload the last 10 business receipts (10 minutes).",
        "Set up your categories and add any missing notes (5 minutes).",
        "Run one export and save it to your cloud drive (5 minutes).",
        "Put a weekly five-minute check in your calendar (5 minutes).",
      ],
    },
    {
      kind: "p",
      text: "Do those five things and you have a working paperless system. Scan each receipt before it goes in your pocket.",
    },
    { kind: "h2", text: "Who should go paperless first?", id: "who-should-go-paperless-first" },
    {
      kind: "p",
      text: "Freelancers and gig workers should start with business meals, software and supplies, because those are the expenses most often questioned. A small business should add a weekly check and a shared export for its bookkeeper. A household can start with warranties and medical receipts. Each should keep the paper originals for contracts and warranties.",
    },
    {
      kind: "links",
      title: "Keep reading",
      items: [
        { label: "Best receipt scanner apps for small business", href: "/blog/best-receipt-scanner-app-small-business-2026" },
        { label: "How OCR receipt scanning works", href: "/blog/how-ocr-receipt-scanning-works-ai-smarter" },
        { label: "Import bank statements for expense tracking", href: "/blog/import-bank-statements-expense-tracking" },
        { label: "Business travel expense tracker", href: "/business-travel-expense-tracker" },
        { label: "Expense reporting software", href: "/expense-reporting-software" },
      ],
    },
  ],
  faq: [
    {
      question: "Can I throw away paper receipts after scanning them?",
      answer:
        "Only if your digital system meets the IRS conditions in [Rev. Proc. 97-22](https://www.irs.gov/pub/irs-irbs/irb97-13.pdf). The scan must be complete and legible. It must be indexed so you can find it, and you must test it and check it regularly. Keep the paper for contracts, warranties and big purchases. Ask a tax professional about your own case.",
    },
    {
      question: "How long should I keep digital receipts?",
      answer:
        "Keep them 3 years from the date you filed in most cases. The [IRS](https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records) says 6 years if you left out more than 25% of your gross income, 7 years for a bad debt or worthless securities claim, and at least 4 years for employment tax records.",
    },
    {
      question: "Are scanned or digital receipts accepted by the IRS?",
      answer:
        "The IRS accepts electronic records that meet its storage requirements. The receipt itself should show the amount, date, place and what the expense was for, as described in [Publication 463](https://www.irs.gov/publications/p463).",
    },
    {
      question: "What is the best way to organize receipts for taxes?",
      answer:
        "Capture each receipt the day you get it, store it with the date, merchant, amount and a category, add a short note for meals and travel, and back up the records in a second place. Run one export at year end for your accountant.",
    },
    {
      question: "Do I need a scanner to go paperless with receipts?",
      answer:
        "No. A phone camera is enough for receipts. A desk scanner helps if you have a large backlog of paper. A receipt scanner app such as [Receipt Cycle](/ai-receipt-scanner) reads each receipt and files it.",
    },
    {
      question: "What can I do when a receipt has faded or I lost it?",
      answer:
        "Look for a copy: a card statement, an email receipt or the merchant's online account. Then log the expense with a note about what it was for. In Receipt Cycle you can speak the purchase or type it in, then attach the statement line as support.",
    },
    {
      question: "How do I handle email and online receipts?",
      answer:
        "Save the receipt as a PDF or take a screenshot, then upload it. The web app accepts PDF, JPG and PNG files up to 12 MB, and the phone app lets you pick any file.",
    },
    {
      question: "Is there a free way to try a receipt scanner app?",
      answer:
        "Yes. Receipt Cycle's free plan includes a 7-day Pro trial with up to 25 transactions, and the web app needs no credit card. [Pro](/pricing) is $3.50 a month, $35 a year, or $60 once for lifetime access.",
    },
  ],
};
