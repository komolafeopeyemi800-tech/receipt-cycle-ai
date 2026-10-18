# Receipt Cycle: feature brief for Play Store screenshots

Use this file as the single source of truth when generating the Google Play phone screenshots.
Google allows a maximum of 8 phone screenshots. This brief maps every feature of the app onto exactly 8 images, so nothing is left out. Each image has one headline, one supporting line, and a list of the real screens and features it must show.

## App facts
- App name: Receipt Cycle Invoice Manager
- Audience: freelancers, contractors, small business owners and individuals in the United States (English, USD)
- One line: scan or upload anything, track money in and out, send professional invoices and estimates, get paid on time
- Brand: teal #149184, deep navy #07131c, mint accent #68e0ca, clean white cards, rounded corners
- Tone: calm, professional, trustworthy. No fake star ratings, no download counts, no "#1" claims, no competitor names, no prices.
- Screenshot rules (Google): real app UI only, text must be readable at thumbnail size, keep marketing text small compared with the screen, no em dashes in any text.
- Size: 1080 x 1920 px or larger (9:16), PNG or JPEG, up to 8 images.

## The 8 screenshots

### 1. Snap a receipt, skip the typing (Scan with AI)
- Headline: Scan receipts in seconds
- Support line: The merchant, date, total and tax are filled in for you
- Show: camera capture of a receipt, then the review screen with extracted merchant, date, total, tax, category and payment method (card type and last 4 digits), and the receipt photo attached as proof
- Features covered: AI receipt scanning (OCR), automatic category suggestion, payment method detection, original photo kept as evidence, review and edit before saving

### 2. Upload bank statements and documents
- Headline: Upload any statement or document
- Support line: CSV, Excel, PDF or photo become clean transactions
- Show: the single upload drop box with the file types, then the review table of extracted rows, with the opening and closing balance check and the duplicate warning
- Features covered: upload of CSV, XLSX, XLS, ODS, PDF and photos; bank statement reading with balance verification (refuses unreadable files instead of guessing); receipt and invoice PDFs read for line items and payment method; duplicate warnings; row editing before import; digital copy of the original file stored with the transactions

### 3. Voice entry
- Headline: Just say it
- Support line: Speak a transaction and review it before it is saved
- Show: the voice capture button with a spoken sentence transcribed ("forty dollars of fuel on the business card yesterday"), then the prepared transaction ready to confirm
- Features covered: voice command entry, voice input language choice, hands-free adding of income and expenses, quick add menu with Add Expense, Add Income, Scan, Upload, Voice

### 4. Invoices that look professional
- Headline: Create polished invoices
- Support line: Your template, your colors, your signature
- Show: the invoice builder (customer, line items, tax, discount, due date) next to the finished invoice preview with logo and drawn signature
- Features covered: invoice builder, items and services catalog, customers (with import from phone contacts and avatars), tax and discount, payment terms, notes, payment instructions, Standard and Compact templates, 8 accent colors, Letter or A4 paper, logo upload, drawn signature, per-document switches for what to show, optional footer, preview identical to the PDF

### 5. Estimates and sending
- Headline: Win the job with estimates
- Support line: Send by email, share the PDF or print it
- Show: an estimate preview with the send options (email to customer, share PDF), estimate list with statuses
- Features covered: estimate builder with its own template and color, estimate list and statuses, email with PDF attached, share through any app, print from the phone, duplicate a document

### 6. Get paid on time
- Headline: Know who owes you
- Support line: Track paid, awaiting and overdue invoices
- Show: the Sales hub with outstanding, overdue and paid totals; an invoice list with status chips; the record payment screen; a payment-overdue push notification on the lock screen
- Features covered: invoice status tracking (draft, sent, paid, partial, overdue), record full or partial payments, payments list, outstanding invoices and open estimates, overdue amount, payment reminder notifications, notification toggles per type

### 7. Budgets, charts and reports
- Headline: See where your money goes
- Support line: Budgets, charts and reports that stay up to date
- Show: the dashboard with income against expenses bar chart and expense pie chart; a budget with remaining amount; the Reports hub (cash flow, income vs expense, category breakdown)
- Features covered: dashboard summary, bar chart, pie chart, category breakdown, budgets by category with progress, monthly cash flow report, income vs expense report, outstanding and overdue invoice reports, accounts and balances, categories, merchants and vendors, saved locations, reimbursements, currency, number and date format settings

### 8. Backup, export and privacy
- Headline: Backed up and ready for your accountant
- Support line: Export a professional spreadsheet with links to your documents
- Show: the Backup and Export screen; a styled spreadsheet (summary sheet, transactions sheet, document links, statement details); the notifications and privacy settings
- Features covered: automatic backup of every transaction, Google Drive backup option, professional Excel export (styled sheets, summary, signed links to the stored original documents, statement and receipt details), CSV export, delete account and data from inside the app, notification controls, Language and Region settings, secure sign-in with Google or email, 7 day free trial

## Coverage checklist (every feature must appear in at least one screenshot)
| Feature | Screenshot |
|---|---|
| Receipt scanning with AI | 1 |
| Payment method and last 4 detection | 1, 2 |
| Photo kept as evidence | 1 |
| Upload CSV, Excel, PDF, photo | 2 |
| Statement balance check and duplicate warning | 2 |
| Digital copy of uploaded files | 2, 8 |
| Voice entry | 3 |
| Quick add menu | 3 |
| Invoice builder, items and services | 4 |
| Customers, contacts import, avatars | 4 |
| Templates, colors, paper size, logo, signature | 4 |
| What to show switches, payment instructions | 4 |
| Estimates | 5 |
| Send by email, share PDF, print | 5 |
| Invoice and estimate statuses | 5, 6 |
| Record payments, partial payments | 6 |
| Overdue tracking and reminder notifications | 6 |
| Dashboard charts (bar and pie) | 7 |
| Budgets | 7 |
| Reports (cash flow, income vs expense, outstanding, overdue) | 7 |
| Accounts, categories, merchants, locations | 7 |
| Automatic backup, Google Drive backup | 8 |
| Professional spreadsheet export | 8 |
| Delete account, notification controls, language and region | 8 |
| Free 7 day trial | 8 (small badge only, no price) |

## Design notes for the generating agent
- Use real captures from the app running on an Android phone (light theme) wherever possible. If sample data is needed, use realistic US data: customers such as "Northwind Studio" and "Alder and Finch Plumbing", merchants such as Shell, Staples and Home Depot, amounts in USD.
- Keep the same layout across all 8 images: headline at the top (max 6 words), supporting line below it, phone frame centered with the real screen. Use one consistent background (teal or deep navy).
- Image 1 shows first in search results. Lead with scanning, because that is the strongest hook.
- Do not put the Receipt Cycle logo inside generated invoices or estimates. The product leaves the logo blank unless the user adds their own.
- Do not use em dashes or en dashes anywhere in the text.
