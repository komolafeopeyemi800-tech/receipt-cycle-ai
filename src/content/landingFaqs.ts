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
      "a": "You can scan receipts, track expenses, keep customer details, send estimates and invoices, record payments, set budgets, view reports, and ask questions about your saved records."
    },
    {
      "q": "Is Receipt Cycle a complete accounting system?",
      "a": "No. Receipt Cycle is a simple place for your spending, customer billing and business records. It does not replace a full accounting system, an accountant or tax advice."
    },
    {
      "q": "Can I use the same account on mobile and web?",
      "a": "Yes. Capture things on your phone, then use the web workspace when you want a bigger screen for documents, budgets or reports."
    },
    {
      "q": "What does the AI do?",
      "a": "It helps read receipt details and answers questions about the activity you have saved. You stay in charge of every correction, category and business decision."
    },
    {
      "q": "Do I need a credit card to get started?",
      "a": "No. You can create an account without a card. If you upgrade later, the pricing page shows the current plans."
    }
  ],
  "/invoice-software": [
    {
      "q": "Is Receipt Cycle a full accounting system?",
      "a": "No. Receipt Cycle covers everyday money tasks like invoices, estimates, payments, receipts, expenses, budgets and reports. It does not replace payroll, tax filing, inventory or a full general ledger system."
    },
    {
      "q": "Can I add tax, discounts, notes, and payment terms?",
      "a": "Yes. The invoice builder lets you add tax and discount percentages, notes, payment terms, issue and due dates, quantities, rates and line item descriptions."
    },
    {
      "q": "Can I record a partial payment?",
      "a": "Yes. Enter the amount you received and how it was paid. Receipt Cycle updates the paid amount, the balance left, the invoice status and the payment history."
    },
    {
      "q": "Does Receipt Cycle process online card payments?",
      "a": "No, not right now. Receipt Cycle records payments you got through your own payment method. It is not a payment gateway."
    },
    {
      "q": "Can I print or save an invoice as a PDF?",
      "a": "Yes. Open the invoice preview and choose print. Your browser can print it or save it as a PDF."
    },
    {
      "q": "Can I turn an estimate into an invoice?",
      "a": "Yes. You can turn an estimate into an invoice draft you can still edit. The customer, line items, tax, discount and terms come with it."
    },
    {
      "q": "Does Receipt Cycle include invoice templates?",
      "a": "Not a gallery of templates. Receipt Cycle gives you one consistent invoice layout that uses your business details and accent color."
    }
  ],
  "/estimate-quotation-software": [
    {
      "q": "What is the difference between an estimate and a quotation?",
      "a": "Not much. Many businesses use estimate, quote and quotation for the same document, sent before the work starts. The name often depends on where you are and how fixed the price is. In Receipt Cycle you write one estimate with the proposed work, price, how long it is valid, and terms."
    },
    {
      "q": "What can I include in a Receipt Cycle estimate?",
      "a": "Pick a customer, add products or services with descriptions, quantities and rates, then set tax, a discount, notes, terms, an issue date and how long the estimate is valid. Check the total before you save or send it."
    },
    {
      "q": "Can I preview and send an estimate?",
      "a": "Yes. You can preview an estimate and then send or share it. Sharing hands the document to your phone or email app. There is no automatic tracking of whether the email was opened, and no approval portal."
    },
    {
      "q": "Which estimate statuses are available?",
      "a": "Draft, sent, accepted and expired. There is no rejected status yet."
    },
    {
      "q": "Can I convert an accepted estimate into an invoice?",
      "a": "Yes. Convert it into an invoice draft you can edit. The customer, line items, quantities, rates, tax, discount and terms carry over, so you can check the invoice before you send it."
    },
    {
      "q": "Is this contractor estimating software?",
      "a": "It can work for contractors who quote set services and rates. It is not built for construction takeoffs, materials databases, job costing, tenders or project scheduling."
    },
    {
      "q": "Does Receipt Cycle work as estimate and invoice software?",
      "a": "Yes. Estimates and invoices work together. Send the estimate first, turn accepted work into a draft invoice, then handle billing in the invoice workspace."
    }
  ],
  "/payment-tracking-software": [
    {
      "q": "What does payment tracking software do?",
      "a": "It records customer payments against invoices, so you can see the date, amount, method, reference, payment history, paid amount and balance left in one place. Receipt Cycle also creates a receipt once a payment is saved."
    },
    {
      "q": "Can I record a partial payment?",
      "a": "Yes. Enter any amount up to the invoice balance. Receipt Cycle adds it to the payment history, updates the paid amount and balance, and marks the invoice partially paid until the full total is recorded."
    },
    {
      "q": "Does Receipt Cycle process customer payments?",
      "a": "No. Receipt Cycle only records payments you received by bank transfer, card, cash, mobile money or another method. It does not collect money, work as a payment gateway or check that funds have arrived."
    },
    {
      "q": "What information appears on a payment receipt?",
      "a": "A receipt can show the business, customer, receipt number, invoice reference, amount received, payment method, receiving account, payment date, payment reference and the balance left."
    },
    {
      "q": "Can I preview, download, or share a receipt?",
      "a": "Yes. On mobile you can preview a receipt and share it as a PDF or image through your phone apps. On the web you can share it, print it or save it as a PDF."
    },
    {
      "q": "Does Receipt Cycle support payment reconciliation?",
      "a": "Only by hand. Each recorded payment stays attached to its invoice, reference, method, date and balance, so you can match it yourself. There is no automatic bank feed matching."
    },
    {
      "q": "Is this accounts receivable tracking software?",
      "a": "It covers the everyday accounts receivable jobs of a small business: invoice status, paid amounts, partial payments, overdue balances, payment history and receipts. It is not built for enterprise collections or treasury work."
    }
  ],
  "/ai-receipt-scanner": [
    {
      "q": "What does an AI receipt scanner extract?",
      "a": "It can suggest the merchant, total, date, time, payment method, category, currency, subtotal, tax, document type, language, confidence, tags, receipt text and line items, when they are visible. Results depend on the image, so always review them."
    },
    {
      "q": "Can I scan a receipt with my phone camera?",
      "a": "Yes. The mobile app has a receipt camera with a flash control, or you can pick an existing photo from your gallery. On the web, you can upload supported receipt images."
    },
    {
      "q": "Can I edit the OCR result?",
      "a": "Yes. The review screen is there for corrections. Check the merchant, amount, date, time, category, payment method, text and any line items before you save the expense."
    },
    {
      "q": "Does the scanner always capture tax and line items?",
      "a": "No. Tax and line items only come through if they are visible and readable on the receipt. A short, faded, folded, handwritten or damaged receipt may give fewer fields or a lower confidence score."
    },
    {
      "q": "Can I use the receipt scanner for taxes?",
      "a": "You can use it to keep your receipt images and checked expense details organized for later. Receipt Cycle does not decide deductions, file returns, give tax advice or promise that a record will satisfy a tax authority or audit."
    },
    {
      "q": "Does Receipt Cycle support multilingual receipts?",
      "a": "It is built to recognize several writing systems and can show the language it detected. Accuracy still depends on image quality, fonts, handwriting, layout and the OCR service available at the time of the scan."
    },
    {
      "q": "Can I scan PDF receipts?",
      "a": "The receipt camera and image upload are meant for image formats like JPG and PNG. Importing a PDF statement is a separate upload and does not use receipt camera OCR."
    }
  ],
  "/business-travel-expense-tracker": [
    {
      "q": "What can I record with a business travel expense tracker?",
      "a": "You can record things like flights, hotels, meals, local transport, parking, fuel, event fees, internet access and trip supplies when they are for work. Each transaction can hold an amount, merchant, category, date, payment method, linked account, notes and the receipt if you have one."
    },
    {
      "q": "Can I scan travel receipts while I am away?",
      "a": "Yes. Use the mobile receipt camera or pick a photo from your gallery, then check the details before saving. You can also upload a receipt image on the web, or type in the purchase if you have no usable image."
    },
    {
      "q": "Can I group expenses under a trip name?",
      "a": "Not yet. Receipt Cycle has no trip name field. Use travel dates, categories, the linked account, merchant search and notes to find the right records. It does not handle itineraries or bookings."
    },
    {
      "q": "Does Receipt Cycle create a business trip expense report?",
      "a": "You get transaction history, date and category filters, report totals and CSV export where your plan and workspace allow it. There is no formatted PDF expense report for a single trip."
    },
    {
      "q": "Does it handle expense claims and employee reimbursement?",
      "a": "No. Receipt Cycle can organize the records behind a claim or reimbursement, but it is not travel expense claims software. It does not submit claims, send them to managers for approval, enforce travel policy or repay employees."
    },
    {
      "q": "Can a corporate or small team use it for travel expenses?",
      "a": "A team can use shared categories, accounts, notes, receipts and exports to keep better records. Receipt Cycle is not built for corporate booking, card feeds or enterprise travel and expense management."
    },
    {
      "q": "Does Receipt Cycle reconcile travel expenses automatically?",
      "a": "No. Business travel expense reconciliation is something you check yourself. Filters, accounts, payment methods, notes and receipt attachments help you compare records, but Receipt Cycle does not match card feeds, settle cash advances or approve differences."
    },
    {
      "q": "Can I export my travel transaction records?",
      "a": "Yes, as CSV, when your plan and administrator settings allow it. The file has fields like date, type, category, amount, merchant, description, payment method and workspace. There is no PDF travel report export."
    }
  ],
  "/freelancer-tax-receipt-tracker": [
    {
      "q": "What does a freelancer tax tracker do?",
      "a": "It helps you capture receipts, record business expenses, review transaction details, sort categories, search by date range and export supported transaction data. It gets your records ready for review. It does not work out your return, file taxes or decide what counts as deductible."
    },
    {
      "q": "Can I scan tax receipts with my phone?",
      "a": "Yes. The mobile app can capture a receipt with the camera or from your gallery, and the web workspace accepts compatible image uploads. OCR can suggest the purchase details, so check every field before you save the expense."
    },
    {
      "q": "Does Receipt Cycle decide which expenses are tax deductions?",
      "a": "No. Receipt Cycle does not decide what you can deduct. Categories, notes, receipts and transaction history help you show the facts, but you or a qualified tax professional decide how an expense is treated."
    },
    {
      "q": "Can I use it as a receipt tracker for taxes throughout the year?",
      "a": "Yes. Save records as you buy things, then review them weekly or monthly. That gives you a much better starting point than rebuilding the year from paper, email and card statements at filing time."
    },
    {
      "q": "Can I organize both expenses and income?",
      "a": "Yes. Receipt Cycle handles both expense and income transactions, and reports and totals give you the wider picture. It does not calculate taxable income, estimated payments or tax owed."
    },
    {
      "q": "Can I give my accountant a CSV export?",
      "a": "Yes, when your plan and administrator settings allow it. The file can include date, type, category, amount, merchant, description, payment method and workspace. Check what is in the export and ask your accountant what else they need."
    },
    {
      "q": "Does the CSV include every receipt image?",
      "a": "No. A CSV is a file of transaction data, not receipt images. The images stay with the saved transaction, so plan how you will share them with your accountant."
    },
    {
      "q": "Does Receipt Cycle replace tax software or an accountant?",
      "a": "No. Receipt Cycle is a place to organize your records. It does not prepare or file tax forms, give legal or accounting advice, guarantee compliance, calculate savings or replace the professional who handles your taxes."
    }
  ],
  "/business-budgeting-software": [
    {
      "q": "What does business budgeting software do in Receipt Cycle?",
      "a": "It lets you pick a month, set a limit for each expense category, compare it with what you spent, and see what is left. Open a category to see its progress and recent transactions, so every total has a source you can check."
    },
    {
      "q": "Can I create a different category budget for each month?",
      "a": "Yes. Each budget belongs to a month and a category. Switch months to plan a new one or look back at an old one. Changing one month does not change the others."
    },
    {
      "q": "How is budget versus actual spending calculated?",
      "a": "The budget is the limit you enter for a category. Actual spending is the total of your saved expenses in that category for the month. Receipt Cycle compares the two and shows what is left for every category that has a budget."
    },
    {
      "q": "What happens when a category goes over budget?",
      "a": "The amount left goes negative and the category shows as over its limit. It is a signal for you to review, not a block. Receipt Cycle does not decline purchases, control cards or approve expenses."
    },
    {
      "q": "Does the business budgeting app send budget alerts?",
      "a": "No alerts are promised. The budgeting workspace shows progress, percent used, amount left and over-budget status when you open it. There are no automatic budget alerts, email warnings or push notifications."
    },
    {
      "q": "Can I see which purchases used a category budget?",
      "a": "Yes. Open a category to see its recent expenses for the month. The merchant or description, date and amount connect the progress bar to the records behind it."
    },
    {
      "q": "Is this business financial planning software?",
      "a": "It helps you plan and watch monthly spending. It is not a forecasting tool, cash flow scenario model, general ledger, payroll system, tax planner or enterprise financial planning platform."
    },
    {
      "q": "Can I use Receipt Cycle instead of a spreadsheet?",
      "a": "For monthly category limits and actual spending, yes. A spreadsheet may still be better for forecasts, staffing plans or scenarios Receipt Cycle does not cover. Use each tool for what it does well."
    }
  ],
  "/client-management-software": [
    {
      "q": "What is client management software for small business?",
      "a": "It is software that keeps your client details and the work around each client in one place. In Receipt Cycle that means contact and billing details, status, notes, invoice count, balance owed and linked documents. It is built around billing, not a full sales CRM."
    },
    {
      "q": "Can I keep customer contact information in Receipt Cycle?",
      "a": "Yes. A customer record can hold a contact name, company, email, phone number, billing address, status and private notes. You can edit it when things change and search by customer, company or email."
    },
    {
      "q": "Does each customer record show invoice history?",
      "a": "Yes. Invoices are linked to the customer, so you can see invoice numbers, due dates, status, totals, invoice count and how much is still owed. Estimates, invoices and payments are still handled in their own workspaces."
    },
    {
      "q": "Can I save services and prices for later invoices?",
      "a": "Yes. The Items & Services catalog stores a name, description, category, unit price, type and active status. Pick them when you build an estimate or invoice so you do not retype common work."
    },
    {
      "q": "Is Receipt Cycle a customer database software product?",
      "a": "It gives you a simple customer directory for billing work. It works if you need searchable customer records linked to your sales documents and balances. It is not a database builder, a marketing tool or an enterprise customer data platform."
    },
    {
      "q": "Does Receipt Cycle replace a CRM?",
      "a": "No. Receipt Cycle has no lead scoring, sales pipelines, campaign automation, call logging, email-open tracking or sales forecasting. Use it when you mainly want customer details next to your estimates, invoices, payments and saved billing items."
    },
    {
      "q": "Can freelancers use the client management app?",
      "a": "Yes. For freelancers, client management is usually simple: keep the right billing address, jot a note, find old invoices and reuse a service price. Receipt Cycle does that without a complicated sales process."
    },
    {
      "q": "Can I track outstanding balances by customer?",
      "a": "Yes. The customer directory works out each balance from the linked invoices and recorded payments. Open a customer to see the invoices behind the number. Recording payments and receipts is covered on the payment tracking page."
    }
  ],
  "/expense-reporting-software": [
    {
      "q": "What does Receipt Cycle expense report software show?",
      "a": "It adds up your saved income and expenses for the period you pick. You see income, expenses, what is left over, record count, spending by category, cash flow comparisons, payments received, paid invoices, unpaid invoices and overdue invoices, where you have those records."
    },
    {
      "q": "Can I review monthly income and expense reports?",
      "a": "Yes. The main report can show this month or all your records. The cash flow report compares the last six months or this year with monthly income and expense bars, total money in, total money out and net cash flow."
    },
    {
      "q": "Does the expense reporting app show category spending?",
      "a": "Yes. Receipt Cycle groups your saved expenses by category, works out each category total and transaction count, and shows your biggest categories. Open the transaction workspace to fix a category or check a single record."
    },
    {
      "q": "Can it report on invoices and payments?",
      "a": "Yes. The report dashboard shows unpaid invoice value, payments received and the number of paid invoices. A separate overdue view shows the overdue amount, invoice count, average days overdue, customer, balance and due status. You still record payments in the payment workflow."
    },
    {
      "q": "Does Receipt Cycle create automated expense reports?",
      "a": "Partly. Totals and charts update by themselves from your saved records for the period you pick, so you do not rebuild summaries by hand. Receipt Cycle does not submit employee claims, route approvals, reimburse people, email reports on a schedule or file anything automatically."
    },
    {
      "q": "Can I export a business expense report?",
      "a": "Yes, as CSV, on supported plans and workspaces. Use it in a spreadsheet or share it with a professional. It is transaction data, not a tax return, an official financial statement, a PDF claim packet or a bundle of receipt images."
    },
    {
      "q": "What can the AI analysis do with my reports?",
      "a": "It uses a limited set of your saved transaction fields to answer questions about category totals, merchant patterns, changes between periods, recurring charges, possible duplicate entries and unusual patterns, and to give plain-language summaries. It does not change your records or make regulated financial decisions."
    },
    {
      "q": "Is this financial reporting software for small business accounting?",
      "a": "It gives you everyday reports on your saved transactions and linked sales records. It has no general ledger, balance sheet, official profit and loss statement, bank reconciliation, payroll, inventory accounting, audit assurance or automatic tax filing."
    }
  ],
  "/ai-financial-assistant": [
    {
      "q": "What is an AI financial assistant?",
      "a": "It is a tool that lets you ask plain questions about your financial data. In Receipt Cycle, Ask AI works from a limited view of your saved transactions. It can repeat totals, rank categories, describe merchant patterns, compare activity across periods and give a short recap. It cannot change your records or make financial decisions."
    },
    {
      "q": "What records can Receipt Cycle use for AI expense analysis?",
      "a": "It can use saved transaction fields like date, amount, type, category, merchant and description, where you have them. It also gets totals such as transaction count, income, expenses and top expense categories. Each question uses a limited slice of your data, not everything in the workspace."
    },
    {
      "q": "Can I ask a question by voice?",
      "a": "Yes, in supported browsers. Receipt Cycle turns your spoken question into text and sends it to Ask AI. You can also just type. Voice needs microphone permission, a signed-in account, plan access and an available service."
    },
    {
      "q": "Can the AI find duplicate or recurring expenses?",
      "a": "It can flag possible patterns: entries that look alike, repeat at the same merchant, share an amount on nearby dates, or stand out from your other expenses. These are not confirmed duplicates or bad charges. Check each one against the saved entry and, if needed, the receipt or statement."
    },
    {
      "q": "Is Receipt Cycle an AI bookkeeping assistant?",
      "a": "Not on its own. Receipt Cycle can organize and summarize the records you save, which can help with a bookkeeping review. It does not keep your books for you, reconcile bank accounts, post journal entries, prepare official statements, pick accounting treatment or file taxes. A bookkeeper or accountant still does that work."
    },
    {
      "q": "Does the assistant provide financial or tax advice?",
      "a": "No. The assistant only gives neutral summaries of your own logged data. It does not give accounting, tax, legal, investment, debt or personal money advice. It also does not tell you to cut spending, cancel a service or invest."
    },
    {
      "q": "Will Ask AI change my transaction records?",
      "a": "No. Ask AI gives you an answer. It does not edit amounts, dates, categories, merchants, descriptions or transaction types. If a question points to a problem, open the record, check the evidence and fix it yourself."
    },
    {
      "q": "How is this different from an AI financial dashboard?",
      "a": "A dashboard shows fixed totals and charts. Ask AI lets you ask questions about your records in plain words. Receipt Cycle also has report views for categories, cash flow, payments and invoice aging. Use those for repeatable expense reports, and use AI expense reporting questions when you want a plain-language explanation or a new angle."
    }
  ]
};

export function landingFaqs(path: string): readonly FaqItem[] {
  return LANDING_FAQS[path] ?? [];
}
