# Android native parity checklist (vs Expo `apps/mobile`)

## Auth
- [x] Email sign-in / sign-up
- [x] Password reset request + deep link `receiptcycle://reset-password?token=`
- [x] Google sign-in (Whop sign-in removed; payments use Polar)
- [x] Google Sign-In when `GOOGLE_ANDROID_CLIENT_ID` is set
- [x] Sign out
- [x] Onboarding gate per user

## Core tabs
- [x] Records (transactions list + summary)
- [x] Analysis (period summary + Finance Coach entry)
- [x] Budgets (list + upsert)
- [x] Accounts (list + create + detail navigation)
- [x] Categories (list + create)

## Transactions
- [x] Add record (manual + from scan review)
- [x] Transaction detail + delete
- [x] Edit transaction in-place (Add flow prefilled by transaction id)
- [x] Bulk CSV import (SAF text via `pendingCsv` from MainActivity)

## AI / media
- [x] Receipt scan API call (`POST /api/ai/scan`) via CameraX capture + gallery picker
- [x] Scan review → add transaction
- [x] Finance Coach chat action
- [x] Voice parsing flow in add/edit screen (`voiceFinance:parseTransactionFromSpeech`)

## Settings
- [x] Settings hub + navigation
- [x] Account settings (change password, reset data, delete account)
- [x] Regional preferences sync (`userPreferences`)
- [x] Pricing / subscription UI (`subscription:getSubscriptionState`)
- [x] Google Drive OAuth (`receiptcycle://google-drive-oauth`) + backup upload + weekly WorkManager

## Deep links
- [x] Reset password
- [x] Post-checkout tab routing (`receiptcycle://post-checkout?screen=...`)
