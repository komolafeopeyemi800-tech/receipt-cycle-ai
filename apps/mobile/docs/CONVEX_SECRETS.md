# Secure API keys (scanning / AI)

**Never put `GEMINI_API_KEY`, `OPENAI_API_KEY`, or `LANDING_AI_API_KEY` in the mobile app or in any file committed to git.**

Receipt scanning runs in **Convex** (server-side). Add keys only in the **Convex Dashboard**:

1. Open [Convex Dashboard](https://dashboard.convex.dev) → your deployment.
2. **Settings** → **Environment Variables**.
3. Add at least one provider for OCR. **Recommended:** set **`OPENAI_API_KEY`** first (primary path — strong receipt understanding). Optional fallbacks (order): **OpenAI → Gemini (OpenRouter first, then Google) → Landing**.
   - `OPENAI_API_KEY` — OpenAI (primary; default model `gpt-4o-mini` with high-detail image)
   - `OPENAI_VISION_MODEL` — optional override; **`gpt-4o`** recommended for best multilingual OCR (higher cost than `gpt-4o-mini`)
   - `OPENAI_VISION_MAX_TOKENS` — optional (default **8192**, max 16384) for long `formatted_receipt_text` previews
   - **Gemini (pick one path):**
     - **`OPENROUTER_API_KEY`** or **`OPENROUTER_AI_API_KEY`** — Gemini via [OpenRouter](https://openrouter.ai/) (recommended if Google AI Studio returns **429 quota**; uses OpenRouter billing, not your Google project quota)
     - `OPENROUTER_GEMINI_MODEL` — optional, default `google/gemini-2.0-flash-001`
     - `OPENROUTER_HTTP_REFERER` — optional (OpenRouter attribution)
     - `GEMINI_API_KEY` — Google AI Studio **direct** (only used if OpenRouter is unset or fails)
   - `LANDING_AI_API_KEY` — Landing AI ADE (last fallback)
4. Save. If you use `npx convex dev` locally, you can also run:
   ```bash
   npx convex env set OPENAI_API_KEY your_key_here
   ```

The mobile app only sends the **image** to Convex; Convex calls Gemini/OpenAI using these **server** secrets.

### “I added keys but scanning still fails”

- **Deployment must match:** `EXPO_PUBLIC_CONVEX_URL` in the app must be the **same** Convex deployment where you set environment variables (dev vs prod are different URLs).
- After adding or changing keys, run **`npx convex dev`** (local) or **`npx convex deploy`** (production) so the backend picks them up.
- The scan error message from Convex includes **API details** (401, 429, etc.) — use that to fix the provider, not only “missing key.”

### Statement import (CSV)

- **Upload statement** (mobile app + web) parses **CSV** with headers such as **Date**, **Amount** (or **Debit** / **Credit**), and **Description**, then creates transactions via Convex `transactions.bulkImport`.
- **PDF** is not supported — export **CSV** from your bank for reliable imports. Receipt **images** (camera/gallery) are scanned via Convex OCR, not PDF.

### Whop (OAuth + webhooks)

- **`WHOP_OAUTH_CLIENT_ID`** or **`WHOP_CLIENT_ID`** — OAuth app id (e.g. `app_your_whop_client_id`); must match `VITE_WHOP_OAUTH_CLIENT_ID` / `EXPO_PUBLIC_WHOP_OAUTH_CLIENT_ID` on clients.
- **`WHOP_OAUTH_CLIENT_SECRET`** or **`WHOP_CLIENT_SECRET`** — optional; add if Whop’s token endpoint requires a confidential client.
- **`WHOP_REDIRECT_URI`** or **`WHOP_REDIRECT_URIS`** — optional comma/newline-separated allowlist. If set, `signInWithWhop` rejects `redirect_uri` values not in the list (set the same URL(s) in Netlify as `VITE_WHOP_REDIRECT_URI` or `VITE_WHOP_OAUTH_REDIRECT_URI`).
- **`WHOP_API_KEY`** — app API key from Whop (optional today; reserved for server-side Whop REST calls).
- **`WHOP_COMPANY_API_KEY`** — company API key from Whop “Company API Keys” (optional today).
- **`WHOP_WEBHOOK_SECRET`** — signing secret from the Whop webhook (Standard Webhooks). Used by Convex `POST …/whop-webhook` only — **never** commit it.
- **`WHOP_PRO_PRODUCT_IDS`** — optional comma/space-separated list (e.g. `prod_CT6cyQj9lXcX6`). If set, only membership events for those products toggle `proSubscriptionActive`.
- **`SESSION_SECRET`** — **not read** by this Convex app’s session system (sessions are DB-backed tokens). You may still set it for other tools or a future custom layer.

### Test provider keys (HTTP ping, no receipt image)

From `apps/mobile` (uses your **linked** Convex deployment’s env vars):

```bash
npm run test:ocr
```

or:

```bash
npx convex run ocrHealth:checkProviders --push
```

You should see `status: 200` and `ok: true` for each provider key you set. If a key fails, fix the key or variable name in the Convex dashboard for **that** deployment.

## Auth

Sign-in / sign-up use **Convex-only** auth (email + password hash stored in your Convex database). No Supabase.
