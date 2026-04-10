# Preview & test the Android app (Expo)

## Prerequisites

- **Node.js** installed
- **Expo Go** on a physical Android phone *or* **Android Studio** with an emulator

## 1) Convex dev (backend)

**Always run Convex from the Expo app folder** — the one that contains `package.json` and the `convex/` folder:

`receipt-cycle-ai/apps/mobile`

Do **not** `cd` into a nested `apps/mobile/apps/mobile` path (that was a mistaken extra folder and causes `ENOENT package.json`).

In one terminal:

```bash
cd apps/mobile
npx convex dev
```

Or from the **repo root**:

```bash
npm run convex:dev
```

Keep it running so functions stay deployed to your dev deployment.

## 2) Start Expo

In another terminal:

```bash
cd apps/mobile
npm install
npm start
```

## 3) Open on Android

- **Physical device (easiest):** install **Expo Go** from the Play Store, scan the QR code from the terminal/browser DevTools.
- **Emulator:** press `a` in the Expo terminal *after* an Android emulator is running (`npm run android` also works if SDK paths are set).

## 4) Same database as web

Ensure these match the root web app `.env`:

- Mobile: `apps/mobile/.env.local` → `EXPO_PUBLIC_CONVEX_URL`
- Web (repo root): `.env` or `.env.local` → `VITE_CONVEX_URL`

Both must be the **same** `https://<deployment>.convex.cloud` URL.

## Receipt scanning (camera / gallery)

Scanning uses the **Convex** action `scanReceipt.scanFromBase64` (see `apps/mobile/convex/scanReceipt.ts`). No Supabase env vars are required.

Set **`OPENAI_API_KEY`** (and optional provider keys) in **Convex Dashboard → Settings → Environment Variables** for your deployment — see `apps/mobile/docs/CONVEX_SECRETS.md`.

## Troubleshooting

- **“Missing EXPO_PUBLIC_CONVEX_URL”** → create/fix `apps/mobile/.env.local` and restart Expo.
- **Convex query stays loading** → run `npx convex dev` and check the Convex dashboard logs.
