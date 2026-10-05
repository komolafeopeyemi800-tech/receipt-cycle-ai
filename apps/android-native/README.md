# Receipt Cycle — Native Android

Kotlin + Jetpack Compose app with **no Expo / Metro**. Uses the same **Cloudflare Worker API** (`workers/api`) as [`apps/mobile`](../mobile) and the web app.

## Open in Android Studio

1. **File → Open** → select this folder: `receipt-cycle-ai/apps/android-native`
2. Copy [`local.properties.example`](local.properties.example) to `local.properties` and set:
   - `sdk.dir` — your Android SDK path
   - `API_URL` — the API Worker origin (same as `EXPO_PUBLIC_API_URL` in `apps/mobile/.env`). Emulator default is `http://10.0.2.2:8787` (your computer running `wrangler dev`); a real phone needs your computer's LAN address or the deployed API.
   - `WEB_APP_URL` — website origin used in password-reset links (default `https://receiptcycle.com`)
   - `GOOGLE_ANDROID_CLIENT_ID` — optional, for Google sign-in
3. Sync Gradle, choose an emulator or device, click **Run**.

## Build from terminal

```bash
cd apps/android-native
./gradlew assembleDebug
```

APK: `app/build/outputs/apk/debug/app-debug.apk`

Release:

```bash
./gradlew assembleRelease
```

## Architecture

- **UI:** Jetpack Compose + Navigation Compose (5 tabs + stack screens)
- **Backend:** plain HTTPS/JSON to the API Worker via [`ApiClient.kt`](app/src/main/java/com/anonymous/receiptcyclemobile/data/ApiClient.kt) (OkHttp). Sign-in uses Better Auth (`/api/auth/*`) and Google (`/api/social/google`); the session token is sent as a bearer header.
- **Live screens:** [`ApiClient.live`](app/src/main/java/com/anonymous/receiptcyclemobile/data/ApiClient.kt) re-fetches every 30 s and right after any change you make (the old Convex push updates are gone).
- **iOS:** continues to use Expo at [`apps/mobile`](../mobile)

## Feature parity status

This native app now includes full Android-side parity flows with the Expo app as source of truth:

- Preferences + subscription gating wired through the API (`/api/preferences`, `/api/subscription`, `/api/config`)
- Full tab experiences (Records, Analysis, Budgets, Accounts/AccountDetail, Categories/CategoryBreakdown)
- Stack flows (add/edit transaction, CameraX scan, scan review, upload statement, transaction detail, finance coach)
- Settings subtree (account settings, regional preferences, backup/export, pricing, merchants, saved locations, notifications)
- 7-step onboarding and post-checkout deep-link routing

## Parity checklist

See [PARITY_CHECKLIST.md](PARITY_CHECKLIST.md).

## Windows long paths

If Gradle fails under a deep repo path, clone or build from a short path (e.g. `C:\rc`) with the same `local.properties`.
