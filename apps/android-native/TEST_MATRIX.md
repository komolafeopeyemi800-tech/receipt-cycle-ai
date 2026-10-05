# Native Android manual test matrix

Use the API Worker (`API_URL` in `local.properties`) and the debug APK from `app/build/outputs/apk/debug/app-debug.apk`.

## Auth & onboarding

| Step | Action | Expected |
|------|--------|----------|
| A1 | Cold start signed out | Sign-in screen with gradient, email/password, optional Google |
| A2 | Sign in with email | Lands on Records tab; data loads from the API |
| A3 | Sign up new user | Account created; onboarding (7 steps) appears once |
| A4 | Complete onboarding | Main app; currency saved to preferences |
| A5 | Forgot password | Reset email flow; deep link `receiptcycle://reset-password?token=` opens reset screen |
| A7 | Google sign-in (if configured) | Returns signed in |
| A8 | Sign out from Settings | Returns to sign-in |

## Tabs

| Step | Action | Expected |
|------|--------|----------|
| T1 | Records: month/all toggle | Totals and list filter correctly |
| T2 | Records: prev/next month | Month label updates |
| T3 | Records: expense/income filter | List filters via chip dialog |
| T4 | Records: category chips | Filters by category |
| T5 | Records: tap transaction | Transaction detail opens |
| T6 | Records: Quick actions | Scan / Upload / Add / Budgets navigate |
| T7 | Analysis: pie chart | Category slices render |
| T8 | Analysis: money leak scan (Pro/trial) | Summary + findings + tips |
| T9 | Analysis: Finance Coach | Chat replies from the API |
| T10 | Budgets: set budget | Progress bar reflects spend vs budget |
| T11 | Accounts: open account | Account detail + transactions |
| T12 | Categories: open category | Category breakdown screen |

## Transactions & scan

| Step | Action | Expected |
|------|--------|----------|
| X1 | Add transaction manually | Appears in Records |
| X2 | Edit transaction | Add screen prefilled; save updates row |
| X3 | Delete transaction | Removed from list |
| X4 | Scan: CameraX capture | OCR via the API; review screen |
| X5 | Scan: gallery pick | Same review → add flow |
| X6 | Upload CSV | Import rows via bulkImport |
| X7 | Voice parse text on Add | Fields populate from `parseTransactionFromSpeech` |

## Settings

| Step | Action | Expected |
|------|--------|----------|
| S1 | Regional prefs: currency/date | Formatting updates in Records |
| S2 | Export CSV (if allowed) | Export succeeds or shows subscription message |
| S3 | Account settings: change password | `POST /api/auth/change-password` |
| S4 | Google Drive: link account | OAuth `receiptcycle://google-drive-oauth` |
| S5 | Google Drive: backup now | JSON file in Drive |
| S6 | Google Drive: weekly toggle | WorkManager job scheduled |
| S7 | Pricing screen | Shows Pro/trial state from subscription query |

## Deep links

| URI | Expected |
|-----|----------|
| `receiptcycle://post-checkout?screen=Analysis` | Opens Analysis tab |
| `receiptcycle://reset-password?token=...` | Reset password screen |
| `receiptcycle://google-drive-oauth?code=...` | Drive link completes |
