# Receipt Cycle Invoice Manager mobile worksheets

The master brief governs product behavior. The attached concept sheets govern visual direction inside the phone screen. Phone frames, sample figures, and presentation-board artwork are not application UI.

## Sequence and review gate

1. Premium Mobile App Screens — foundation (awaiting phone comparison)
2. Transactions & AI Capture — implemented; awaiting phone comparison
3. Budgets, Accounts & Categories — implemented; awaiting phone comparison
4. Sales Hub & Business Setup — implemented; awaiting phone comparison
5. Invoice Flow — implemented; awaiting phone comparison
6. Estimates & Quotations — implemented; awaiting phone comparison
7. Payments & Receipts — implemented; awaiting phone comparison
8. Settings, AI & Reports — current worksheet

Complete one worksheet, preview it in Expo on a phone, compare screenshots with its reference, correct the differences, then proceed. Refine complex screens separately as needed. Do not treat a successful bundle as visual approval.

## Shared foundation from worksheet 1

- `src/theme/tokens.ts` owns the palette, spacing, radii, type sizes, control heights, and shadows.
- `src/components/ui/FinanceUI.tsx` owns shared cards, buttons, status badges, tabs, KPI tiles, icon tiles, search, headers, and empty states.
- `src/components/ReceiptCycleTabBar.tsx` owns the four destinations and global creation sheet.
- Sales lists live under the Sales tab so the same bottom navigation remains visible.
- New Sales data is centralized in `src/features/sales/previewData.ts` and is labeled as preview data. It is not a production backend.
- Records, Analysis, scanning, OCR review, and financial preferences continue to use their existing Convex-backed paths.

These foundations are provisional until Sheet 1 is compared on the physical device and approved. Sheets 2 through 8 extend those components. All eight sheets still need phone comparison.

Sheet 2 uses the existing Convex transaction, voice, OCR, and CSV paths. PDF import and persistent raw receipt-image storage are not available on those paths; the UI labels PDF as coming soon and saves extracted receipt details with attached transactions.

Sheet 3 uses the existing Convex budgets, accounts, categories, and transactions. Budgets currently store one month at a time, so weekly and yearly recurrence are shown as unavailable instead of saving a misleading rule. Account color, category icon, and category hiding are stored in device-local workspace preferences because the current Convex schema has no fields for them. Hidden categories disappear from new transaction choices but remain visible in historical records. Full cross-device sync of those preferences requires a backend schema change.

Sheet 4 adds customers, items and services, business identity, and invoice defaults. The current backend has no models for those setup records, so this worksheet stores them in one device-local account/workspace store. Existing invoice, estimate, and payment preview data remains centralized and visibly labeled; the dedicated document flows will replace that preview boundary in later worksheets.

This worksheet contains the Receipt Cycle Sales Hub & Business Setup flow: sales overview, customer list and details, customer creation, items and services, business profile, and invoice settings.

Sheet 5 adds a device-local, account-scoped invoice draft and saved-invoice store because the current backend has no invoice mutation or delivery service. PDF sharing creates a real local PDF. Email and WhatsApp open the installed composer. Secure hosted links remain unavailable and are labeled honestly rather than fabricated.

This worksheet contains the Receipt Cycle Invoice Flow: invoice list, create invoice, customer selection, line items, tax/discount, extras, preview and sending.

Sheet 6 adds a separate device-local, account-scoped estimate store while reusing the invoice customer drawer, catalog item structure, document progress, totals calculation, PDF renderer, preview card, status badges, buttons, and bottom navigation. Estimates can be saved, sent through the native share sheet, marked accepted or expired, duplicated, and converted into a real draft in the local invoice store. Hosted acceptance links and cross-device estimate sync require backend models and delivery endpoints.

This worksheet contains the Estimates & Quotations flow.

Sheet 7 adds account-scoped payment and receipt records while reusing the existing invoice, customer, account, status badge, card, input, money formatting, header, action row, and bottom-navigation foundations. A saved customer payment first creates an income transaction through the existing Convex mutation, which updates the selected account balance and feeds Records and Analysis. It then updates the local invoice balance/status and creates structured PDF and SVG receipt exports. Worksheet-only payment and open-invoice examples remain centralized and labeled as preview data.

This worksheet contains the Payments & Receipts flow.

Sheet 8 adds transaction-backed reports, invoice aging, account-scoped reminder preferences, a profile and account hub, and a redesigned Pro plan screen while reusing the shared cards, KPI tiles, inputs, headers, icons, and contextual bottom navigation. Cash-flow figures come from saved Convex transactions; overdue balances come from the current invoice/payment flow. Ask AI retains its existing Convex action, voice transcription, subscription gate, and saved-record grounding. Reminder preferences are stored on the device until notification scheduling and server delivery endpoints exist.

This worksheet contains the Settings, AI & Reports flow.
