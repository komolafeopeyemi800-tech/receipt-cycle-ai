/**
 * Visible FAQ copy for each SEO landing page. The page components render these exact items and
 * src/lib/schema.ts builds the FAQPage JSON-LD from them, so markup and visible text cannot drift.
 */
export interface FaqItem {
  q: string;
  a: string;
}

export const LANDING_FAQS: Record<string, readonly FaqItem[]> = {
  "/": [
    {
      "q": "What can I do with Receipt Cycle?",
      "a": "You can capture receipts, organize expenses, maintain customer details, prepare estimates and invoices, record payments, set budgets, review reports, and ask questions based on saved business records."
    },
    {
      "q": "Is Receipt Cycle a complete accounting system?",
      "a": "Receipt Cycle is a practical workspace for spending, customer billing, and business records. It does not replace a complete accounting system, a qualified accountant, or professional tax advice."
    },
    {
      "q": "Can I use the same account on mobile and web?",
      "a": "Yes. Capture information from your phone and return to the web workspace when a larger screen is better for reviewing documents, budgets, or reports."
    },
    {
      "q": "What does the AI do?",
      "a": "AI can help extract receipt details and answer questions using the activity you have saved. You remain in control of corrections, classifications, and business decisions."
    },
    {
      "q": "Do I need a credit card to get started?",
      "a": "No. You can create an account without entering a credit card. If you decide to upgrade later, current plan details are available on the pricing page."
    }
  ],
  "/invoice-software": [
    {
      "q": "Is Receipt Cycle a full accounting system?",
      "a": "Receipt Cycle focuses on practical finance workflows such as invoices, estimates, payments, receipts, expenses, budgets, and reports. It does not claim to replace payroll, tax filing, inventory, or a full general-ledger accounting platform."
    },
    {
      "q": "Can I add tax, discounts, notes, and payment terms?",
      "a": "Yes. The invoice builder supports tax and discount percentages, notes, payment terms, issue dates, due dates, quantities, rates, and line-item descriptions."
    },
    {
      "q": "Can I record a partial payment?",
      "a": "Yes. Record the amount received and payment method. Receipt Cycle updates the paid amount, remaining balance, invoice status, and payment history."
    },
    {
      "q": "Does Receipt Cycle process online card payments?",
      "a": "Not currently. Receipt Cycle records payments made through your existing payment method. It does not claim to act as a payment gateway."
    },
    {
      "q": "Can I print or save an invoice as a PDF?",
      "a": "Yes. Open the invoice preview and use the print option. Your browser can print the document or save it as a PDF."
    },
    {
      "q": "Can I turn an estimate into an invoice?",
      "a": "Yes. An estimate can be converted into an editable invoice draft, keeping its customer, line items, tax, discount, and terms connected."
    },
    {
      "q": "Does Receipt Cycle include invoice templates?",
      "a": "Receipt Cycle currently provides a consistent invoice layout that uses your business details and accent color. It does not claim to include a gallery of interchangeable invoice templates."
    }
  ],
  "/estimate-quotation-software": [
    {
      "q": "What is the difference between an estimate and a quotation?",
      "a": "Businesses often use estimate, quote, and quotation for the same pre-sale document. Local practice and the certainty of the price can affect the label. Receipt Cycle provides a structured estimate document for describing proposed work, pricing, validity, and terms."
    },
    {
      "q": "What can I include in a Receipt Cycle estimate?",
      "a": "Choose a customer, add products or services, descriptions, quantities, and rates, then set tax, a discount, notes, terms, an issue date, and a validity period. Review the calculated total before saving or sending the estimate."
    },
    {
      "q": "Can I preview and send an estimate?",
      "a": "Yes. Receipt Cycle includes an estimate preview and a send or share action. The current workflow hands the document to your device or email tools; it does not claim automatic email-open tracking or an approval portal."
    },
    {
      "q": "Which estimate statuses are available?",
      "a": "Receipt Cycle supports draft, sent, accepted, and expired estimates. A rejected status is not currently implemented, so the page does not claim that feature."
    },
    {
      "q": "Can I convert an accepted estimate into an invoice?",
      "a": "Yes. Convert the estimate into an editable invoice draft. The customer, line items, quantities, rates, tax, discount, and terms remain available so you can review the invoice before sending it."
    },
    {
      "q": "Is this contractor estimating software?",
      "a": "Receipt Cycle can suit contractors who quote defined services and rates. It is not positioned as construction takeoff, materials database, job-costing, tender, or project-scheduling software."
    },
    {
      "q": "Does Receipt Cycle work as estimate and invoice software?",
      "a": "Yes. Estimates and invoices are connected parts of the Receipt Cycle sales workflow. Use the estimate before approval, convert accepted work into a draft invoice, then manage billing from the invoice workspace."
    }
  ],
  "/payment-tracking-software": [
    {
      "q": "What does payment tracking software do?",
      "a": "It records customer payments against invoices so the payment date, amount, method, reference, history, paid amount, and remaining balance can be reviewed together. Receipt Cycle also creates a receipt record after the payment is saved."
    },
    {
      "q": "Can I record a partial payment?",
      "a": "Yes. Enter an amount up to the invoice balance. Receipt Cycle adds the payment to history, updates the paid amount and outstanding balance, and marks the invoice partially paid until the full total has been recorded."
    },
    {
      "q": "Does Receipt Cycle process customer payments?",
      "a": "No. Receipt Cycle records payments received through your existing bank transfer, card, cash, mobile-money, or other method. It does not act as a payment gateway, collect funds, or verify settlement."
    },
    {
      "q": "What information appears on a payment receipt?",
      "a": "The receipt can include the business, customer, receipt number, invoice reference, amount received, payment method, receiving account, payment date, payment reference, and remaining balance."
    },
    {
      "q": "Can I preview, download, or share a receipt?",
      "a": "Yes. The mobile workflow includes receipt preview and sharing as a PDF or image through supported device apps. The web workspace supports receipt sharing plus printing or saving the receipt as a PDF."
    },
    {
      "q": "Does Receipt Cycle support payment reconciliation?",
      "a": "Receipt Cycle supports manual payment reconciliation by keeping each recorded amount attached to its invoice, reference, method, date, and balance. It does not currently claim automatic bank-feed matching or settlement reconciliation."
    },
    {
      "q": "Is this accounts receivable tracking software?",
      "a": "Receipt Cycle covers practical accounts-receivable tasks for small businesses: invoice status, paid amount, partial payments, overdue balances, payment history, and receipts. It is not positioned as an enterprise collections or treasury platform."
    }
  ],
  "/ai-receipt-scanner": [
    {
      "q": "What does an AI receipt scanner extract?",
      "a": "Receipt Cycle can propose the merchant, total amount, date, time, payment method, category, currency, subtotal, tax, document type, detected language, confidence, tags, formatted receipt text, and line items when those details are visible. Results depend on the source image and must be reviewed."
    },
    {
      "q": "Can I scan a receipt with my phone camera?",
      "a": "Yes. The mobile flow includes a receipt camera with flash control. You can also choose an existing image from the gallery. On the web, supported receipt images can be uploaded for processing."
    },
    {
      "q": "Can I edit the OCR result?",
      "a": "Yes. The review screen is designed for correction. Check the merchant, amount, date, time, category, payment method, extracted text, and any line items before continuing to save the expense."
    },
    {
      "q": "Does the scanner always capture tax and line items?",
      "a": "No. Tax extraction and line-item extraction depend on what is visible and legible in the receipt image. A short, faded, folded, handwritten, or damaged receipt may return fewer fields or a lower confidence indicator."
    },
    {
      "q": "Can I use the receipt scanner for taxes?",
      "a": "You can use it to organize receipt images and reviewed expense details for later record preparation. Receipt Cycle does not determine deductions, file returns, provide tax advice, or guarantee that a record satisfies a tax authority or audit requirement."
    },
    {
      "q": "Does Receipt Cycle support multilingual receipts?",
      "a": "The scanner is designed to recognize multiple scripts and can display detected languages. Accuracy still varies with image quality, typography, handwriting, layout, and the OCR provider available when the scan runs."
    },
    {
      "q": "Can I scan PDF receipts?",
      "a": "The receipt camera and receipt-image upload flow are intended for supported image formats such as JPG and PNG. PDF statement import belongs to a separate upload workflow and should not be treated as receipt-camera OCR."
    }
  ],
  "/business-travel-expense-tracker": [
    {
      "q": "What can I record with a business travel expense tracker?",
      "a": "Record expenses such as airfare, hotels, meals, ground transportation, parking, fuel, event fees, internet access, and trip supplies when they relate to your work. Each Receipt Cycle transaction can include an amount, merchant, category, date, payment method, linked account, notes, and available receipt evidence."
    },
    {
      "q": "Can I scan travel receipts while I am away?",
      "a": "Yes. Use the mobile receipt camera or choose an image from the gallery, then review the extracted details before saving. You can also upload a supported receipt image on the web or enter the purchase manually when there is no usable image."
    },
    {
      "q": "Can I group expenses under a trip name?",
      "a": "Receipt Cycle does not currently provide a dedicated trip object or trip-name field. Use the travel dates, categories, linked account, merchant search, and transaction notes to retrieve the relevant records. Do not rely on the product for itinerary or booking management."
    },
    {
      "q": "Does Receipt Cycle create a business trip expense report?",
      "a": "Receipt Cycle provides transaction history, date and category filters, report totals, and CSV export when available for the plan and workspace. It does not currently claim a formatted PDF expense report dedicated to one trip."
    },
    {
      "q": "Does it handle expense claims and employee reimbursement?",
      "a": "No. Receipt Cycle can organize the records that may support a claim or reimbursement discussion, but it is not travel expense claims software. It does not submit claims, route manager approvals, enforce travel policy, or repay employees."
    },
    {
      "q": "Can a corporate or small team use it for travel expenses?",
      "a": "Teams can use consistent categories, accounts, notes, receipt evidence, and exports to improve record quality. Receipt Cycle is not positioned as a corporate booking, card-feed, or enterprise travel and expense management platform."
    },
    {
      "q": "Does Receipt Cycle reconcile travel expenses automatically?",
      "a": "No. Business travel expense reconciliation remains a review task. Filters, accounts, payment methods, notes, and receipt attachments help you compare records, but Receipt Cycle does not automatically match card feeds, settle cash advances, or approve discrepancies."
    },
    {
      "q": "Can I export my travel transaction records?",
      "a": "CSV export is available when the account plan and administrator settings permit it. The export includes transaction fields such as date, type, category, amount, merchant, description, payment method, and workspace. PDF travel-report export is not currently claimed."
    }
  ],
  "/freelancer-tax-receipt-tracker": [
    {
      "q": "What does a freelancer tax tracker do?",
      "a": "Receipt Cycle helps freelancers capture receipts, record business expenses, review transaction details, organize categories, search a date range, and export supported transaction data. It prepares records for review. It does not calculate a return, file taxes, or determine which purchases qualify under tax law."
    },
    {
      "q": "Can I scan tax receipts with my phone?",
      "a": "Yes. The mobile app supports receipt capture with the camera or an image from the gallery. The web workspace supports compatible image uploads. OCR can propose visible purchase details, and you should review every field before saving the expense."
    },
    {
      "q": "Does Receipt Cycle decide which expenses are tax deductions?",
      "a": "No. Receipt Cycle is not a tax deduction tracker that decides eligibility. Categories, notes, receipt evidence, and transaction history can help you present the facts, but you or a qualified tax professional must decide how an expense should be treated."
    },
    {
      "q": "Can I use it as a receipt tracker for taxes throughout the year?",
      "a": "Yes. Capture records as purchases happen, then review them weekly or monthly. A consistent habit gives you a stronger starting point than waiting until a filing deadline to rebuild the year from paper, email, and card statements."
    },
    {
      "q": "Can I organize both expenses and income?",
      "a": "Receipt Cycle supports expense and income transaction types. Reports and workspace totals can provide broader context, but the product does not claim to calculate taxable income, estimated payments, or tax owed."
    },
    {
      "q": "Can I give my accountant a CSV export?",
      "a": "CSV export is available when the plan and administrator settings permit it. The file can include transaction fields such as date, type, category, amount, merchant, description, payment method, and workspace. Confirm the export contents and any additional evidence your accountant needs."
    },
    {
      "q": "Does the CSV include every receipt image?",
      "a": "Do not assume it does. CSV is a structured transaction-data format, not a bundle of image attachments. Receipt evidence may remain with the saved transaction, so review your handoff process before sending records elsewhere."
    },
    {
      "q": "Does Receipt Cycle replace tax software or an accountant?",
      "a": "No. Receipt Cycle is a record-organization workspace. It does not prepare or submit tax forms, provide legal or accounting advice, guarantee compliance, calculate savings, or replace the professional responsible for tax decisions."
    }
  ],
  "/business-budgeting-software": [
    {
      "q": "What does business budgeting software do in Receipt Cycle?",
      "a": "Receipt Cycle lets you choose a month, set limits for individual expense categories, compare those limits with recorded spending, and see the amount remaining. You can open a category to review its progress and recent transactions, which gives the monthly total a traceable source."
    },
    {
      "q": "Can I create a different category budget for each month?",
      "a": "Yes. Budgets are associated with a selected month and category. Move between months to prepare a new plan or review an earlier one. Changing one month does not require every future month to use the same amount."
    },
    {
      "q": "How is budget versus actual spending calculated?",
      "a": "The budget is the limit you enter for a category. Actual spending comes from saved expense transactions in that category during the selected month. The workspace compares the two and calculates the remaining amount for the categories that have a budget."
    },
    {
      "q": "What happens when a category goes over budget?",
      "a": "The remaining amount becomes negative and the interface can show the category as over its limit. This is a review signal, not a blocked payment. Receipt Cycle does not decline purchases, enforce card controls, or approve expenses."
    },
    {
      "q": "Does the business budgeting app send budget alerts?",
      "a": "The current budgeting workspace shows progress, percentage used, remaining amounts, and over-budget states when you review it. This page does not promise automatic budget alerts, email warnings, or push notifications."
    },
    {
      "q": "Can I see which purchases used a category budget?",
      "a": "Yes. Open the category detail to see recent expense transactions assigned to it for the selected month. Merchant or description, date, and amount help you connect the progress bar to the underlying records."
    },
    {
      "q": "Is this business financial planning software?",
      "a": "It supports practical monthly expense planning and monitoring. It is not a forecasting suite, cash-flow scenario model, general ledger, payroll system, tax planner, or enterprise financial planning platform."
    },
    {
      "q": "Can I use Receipt Cycle instead of a spreadsheet?",
      "a": "You can move monthly category limits and their actual expense progress into Receipt Cycle. A spreadsheet may still be useful for forecasts, staffing plans, or scenarios that the product does not support. Use each tool for the job it handles accurately."
    }
  ],
  "/client-management-software": [
    {
      "q": "What is client management software for small business?",
      "a": "It is software for storing useful client details and keeping the work around each relationship easier to find. In Receipt Cycle, that means customer contact and billing information, status, notes, invoice count, outstanding balance, and linked document history. It is focused on billing context rather than a full sales CRM."
    },
    {
      "q": "Can I keep customer contact information in Receipt Cycle?",
      "a": "Yes. A customer record can include the contact name, company, email address, phone number, billing address, status, and internal notes. You can edit the record when details change and search the directory by customer, company, or email."
    },
    {
      "q": "Does each customer record show invoice history?",
      "a": "Yes. The customer workspace connects invoices to the saved customer. You can review invoice numbers, due dates, status, totals, invoice count, and the calculated amount still outstanding. Estimate, invoice, and payment actions remain in their dedicated workspaces."
    },
    {
      "q": "Can I save services and prices for later invoices?",
      "a": "Yes. The Items & Services catalog stores a product or service name, description, category, unit price, type, and active state. Those entries can be selected when building estimates or invoices so common work does not have to be typed again."
    },
    {
      "q": "Is Receipt Cycle a customer database software product?",
      "a": "Receipt Cycle provides a practical customer directory for billing work. It is suitable when you need searchable customer records connected to sales documents and balances. It is not a general-purpose database builder, marketing platform, or enterprise customer-data platform."
    },
    {
      "q": "Does Receipt Cycle replace a CRM?",
      "a": "No. Receipt Cycle does not claim lead scoring, opportunity pipelines, campaign automation, call logging, email-open tracking, or sales forecasting. Use it when the main need is keeping customer information close to estimates, invoices, payments, and reusable billing items."
    },
    {
      "q": "Can freelancers use the client management app?",
      "a": "Yes. Client management for freelancers often begins with a smaller need: keep the correct billing address, remember a useful note, find prior invoices, and reuse a familiar service price. Receipt Cycle supports that focused workflow without forcing a complex sales process."
    },
    {
      "q": "Can I track outstanding balances by customer?",
      "a": "Yes. The customer directory calculates the balance from connected invoices and recorded paid amounts. Open the customer to review the invoice entries behind that figure. Payment recording and receipt generation are explained on the dedicated payment tracking page."
    }
  ],
  "/expense-reporting-software": [
    {
      "q": "What does Receipt Cycle expense report software show?",
      "a": "The reporting workspace summarizes saved income and expense records for the selected period. It shows income, expenses, net movement, record count, category distribution, cash-flow comparisons, payments received, paid-invoice counts, outstanding invoices, and overdue invoice context where those records are available."
    },
    {
      "q": "Can I review monthly income and expense reports?",
      "a": "Yes. The main report can focus on the current month or all available records. The cash-flow report can compare the last six months or the current year using monthly income and expense bars, total inflow, total outflow, and net cash movement."
    },
    {
      "q": "Does the expense reporting app show category spending?",
      "a": "Yes. Receipt Cycle groups saved expense records by category, calculates category totals and transaction counts, and shows the largest categories in a distribution view. Open the transaction workspace when a category needs correction or record-level review."
    },
    {
      "q": "Can it report on invoices and payments?",
      "a": "The report dashboard includes outstanding invoice value, payments received, and paid-invoice counts. A separate overdue view shows overdue amount, invoice count, average days overdue, customer, balance, and due status. Recording a payment remains part of the dedicated payment workflow."
    },
    {
      "q": "Does Receipt Cycle create automated expense reports?",
      "a": "The totals and charts recalculate from the saved records available to the selected period, so routine summaries do not need to be rebuilt manually. Receipt Cycle does not claim automatic employee claim submission, approval routing, reimbursement processing, scheduled email delivery, or automatic filing."
    },
    {
      "q": "Can I export a business expense report?",
      "a": "Supported plans and workspaces can export transaction data as CSV for use in a spreadsheet or professional review. The export is structured transaction data, not a generated tax return, statutory financial statement, PDF claim packet, or guaranteed bundle of receipt images."
    },
    {
      "q": "What can the AI analysis do with my reports?",
      "a": "AI-assisted analysis can use a limited structured slice of saved transaction fields to answer questions about category totals, merchant patterns, period comparisons, recurring charges, possible duplicate entries, unusual patterns, and plain-language activity summaries. It does not alter records or make regulated financial decisions."
    },
    {
      "q": "Is this financial reporting software for small business accounting?",
      "a": "Receipt Cycle provides operational reporting for saved transactions and connected sales records. It does not claim a general ledger, balance sheet, statutory profit-and-loss statement, bank reconciliation, payroll, inventory accounting, audit assurance, or automatic tax filing."
    }
  ],
  "/ai-financial-assistant": [
    {
      "q": "What is an AI financial assistant?",
      "a": "An AI financial assistant helps a person ask plain-language questions about financial data. In Receipt Cycle, Ask AI works from a limited structured view of saved transaction records. It can restate totals, order categories, describe merchant patterns, compare activity represented in the available data, and produce a concise recap. It does not have authority to change the ledger or make financial decisions."
    },
    {
      "q": "What records can Receipt Cycle use for AI expense analysis?",
      "a": "The request can include saved transaction fields such as date, amount, type, category, merchant, and description where those fields are available. The assistant also receives calculated context such as transaction counts, income, expenses, and leading expense categories. A limited slice is used for each request rather than an unrestricted view of every workspace feature."
    },
    {
      "q": "Can I ask a question by voice?",
      "a": "Yes, supported browsers can capture a spoken question through the microphone. Receipt Cycle transcribes the audio and sends the resulting question to Ask AI. You can also type instead. Microphone permission, sign-in, plan access, and configured service availability are required for the voice path."
    },
    {
      "q": "Can the AI find duplicate or recurring expenses?",
      "a": "The optional pattern review can flag entries that appear similar, repeat at the same merchant, use the same amount on nearby dates, or stand out within the supplied expense data. These are possible patterns, not confirmed duplicates or unauthorized charges. Verify a finding against the saved entry and, when needed, the original receipt or statement."
    },
    {
      "q": "Is Receipt Cycle an AI bookkeeping assistant?",
      "a": "Receipt Cycle can organize and summarize records that you have saved, which may support parts of a bookkeeping review. It does not autonomously maintain books, reconcile bank accounts, post journal entries, prepare statutory statements, choose accounting treatment, or file taxes. A bookkeeper or accountant remains responsible for professional work."
    },
    {
      "q": "Does the assistant provide financial or tax advice?",
      "a": "No. The assistant is restricted to neutral summaries and organization of the user's own logged data. It does not give accounting, tax, legal, investment, debt, or personal financial advice. It also does not tell a user to cut spending, cancel a service, invest, or change financial behavior."
    },
    {
      "q": "Will Ask AI change my transaction records?",
      "a": "No. Ask AI returns a response but does not edit amounts, dates, categories, merchants, descriptions, or transaction types. If a question exposes a possible issue, open the source record, inspect the evidence, and make any correction yourself."
    },
    {
      "q": "How is this different from an AI financial dashboard?",
      "a": "A dashboard presents fixed totals and charts. Ask AI adds a conversational layer for questions about the records made available to it. Receipt Cycle also has dedicated reporting views for category distribution, cash movement, payments, and invoice aging. Use those views for repeatable expense reports and use AI expense reporting questions when you want a plain-language explanation or a new line of inquiry."
    }
  ]
};

export function landingFaqs(path: string): readonly FaqItem[] {
  return LANDING_FAQS[path] ?? [];
}
