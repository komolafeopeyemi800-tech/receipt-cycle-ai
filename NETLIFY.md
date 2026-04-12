# Deploying Receipt Cycle (web + mobile)

## Web app on Netlify

Netlify hosts the **Vite React app** in this repository root (`npm run build` → `dist/`).

### Before the first successful deploy

Commit and push **all** of these (Netlify clones GitHub; your machine-only fixes are not deployed until pushed):

- `apps/mobile/tsconfig.json` — **fully inlined** (no `"extends"` to `expo/tsconfig.base`) for Expo/Metro.
- `apps/mobile/src/tsconfig.json` — same compiler options, **no `extends`**. Vite/esbuild resolves this file first for `apps/mobile/src/lib/*` (the web app’s `@mobile-lib` alias), so Netlify never needs `expo` even if a parent tsconfig is mis-merged.
- `index.html` — Google Fonts loaded with `<link rel="stylesheet" …fonts.googleapis.com…>` (avoid CSS `@import`; Vite is strict about `@import` order)
- `netlify.toml` — build command `npm run build`

### 1. Create a site

1. In [Netlify](https://app.netlify.com), **Add new site** → **Import an existing project** → connect this Git repo.
2. Build settings should match **`netlify.toml`**:
   - **Build command:** `npm run build` (do **not** set `bun run build` in the Netlify UI — it overrides this file and can fail if Bun is not used locally).
   - **Publish directory:** `dist`
3. Under **Site configuration → Build & deploy → Build settings**, clear any custom **Build command** if you want Netlify to use `netlify.toml` exactly. If you keep a UI override, set it to `npm run build`.
4. Deploy.

### 2. Environment variables (Site settings → Environment variables)

Set at least:

| Variable | Notes |
|----------|--------|
| `VITE_CONVEX_URL` | Same Convex deployment URL as mobile (`EXPO_PUBLIC_CONVEX_URL`). Convex Dashboard → your deployment → URL. |

Copy optional keys from **`.env.example`** (Whop checkout URLs: `VITE_WHOP_CHECKOUT_FREE_URL`, monthly, yearly; OAuth client id; store links, etc.). Any variable prefixed with `VITE_` must be set in Netlify for production builds (or use `WHOP_CHECKOUT_*` / `WHOP_MANAGE_URL` names in Netlify; `vite.config` maps them into the bundle like local `.env`).

After changing env vars, trigger a **new deploy** so Vite embeds them in the bundle.

### 3. Convex & auth alignment

- **Convex env (Dashboard → Settings → Environment variables):** `WHOP_OAUTH_CLIENT_ID` (same as `VITE_WHOP_OAUTH_CLIENT_ID`, e.g. `app_kMFUEC8UntlEKY`). Optional: `WHOP_OAUTH_CLIENT_SECRET` if Whop requires confidential client token exchange. `WHOP_WEBHOOK_SECRET` = raw webhook signing secret from Whop (Standard Webhooks). Optional: `WHOP_PRO_PRODUCT_IDS=prod_CT6cyQj9lXcX6` so only that product toggles Pro. `PUBLIC_WEB_APP_URL=https://receiptcycle.com` for password-reset links.
- **Whop OAuth redirect (web):** In the [Whop developer dashboard](https://whop.com/dashboard/developer), register the **exact** callback URLs you use (scheme + host + path), e.g. `https://receiptcycle.com/oauth/whop`. If visitors can use both apex and `www`, register **both** hostnames (or set Netlify’s primary domain so only one hostname is used). Supported routes in this app: `/oauth/whop`, `/api/auth/callback`, `/api/auth/callback/whop`, `/auth/callback`. Optional: set **`VITE_WHOP_REDIRECT_URI`** / **`VITE_WHOP_OAUTH_REDIRECT_URI`** on Netlify to a full URL; the app aligns it with the current tab’s origin when appropriate (PKCE lives in `sessionStorage`). Convex **`WHOP_REDIRECT_URI`** / **`WHOP_REDIRECT_URIS`** may list any one of those full URLs on the same host; other known callback paths on that host are accepted for token exchange.
- **Whop webhooks:** Create a webhook in the Whop app dashboard pointing at **`https://<deployment-name>.convex.site/whop-webhook`** (Convex HTTP, not Netlify). API version `v1`. Subscribe to membership activated/deactivated (and `membership.went_valid` / `membership.went_invalid` if you use those). Copy the signing secret into Convex `WHOP_WEBHOOK_SECRET`.
- **Mobile Whop sign-in:** Register `receiptcycle://auth/callback` (default) or override with `EXPO_PUBLIC_WHOP_OAUTH_REDIRECT_PATH` — must match the redirect URI in Whop for the native app.

### 4. Custom domain

Add your domain under **Domain management**, enable HTTPS (automatic), then update Whop redirect URIs and `PUBLIC_WEB_APP_URL` to the final hostname.

---

## Mobile app (iOS / Android)

**Netlify does not build or host native mobile binaries.** It only serves the **web** app.

Use **Expo Application Services (EAS)** for production apps:

1. Install EAS CLI: `npm i -g eas-cli`
2. From `apps/mobile`: `eas login`, then `eas build --platform all` (or `ios` / `android` separately).
3. Configure **`apps/mobile/.env`** / EAS secrets so `EXPO_PUBLIC_CONVEX_URL` matches production (same value as `VITE_CONVEX_URL`).
4. Submit builds to App Store / Play Console (EAS Submit can help).

`apps/mobile/eas.json` and `apps/mobile/.env.example` describe the Expo project. Deep links / OAuth (e.g. `receiptcycle://oauth/whop`) must match what you register in Whop and in the native app config.

---

## Quick checklist before go-live

- [ ] `npm run build` passes locally
- [ ] Netlify deploy green; open `/`, `/signin`, `/dashboard` (after login) on the production URL
- [ ] `VITE_CONVEX_URL` and Convex production deployment match
- [ ] Whop (if used): redirect URIs + Convex `WHOP_OAUTH_CLIENT_ID` / `PUBLIC_WEB_APP_URL`
- [ ] Mobile: EAS build with production Convex URL; store listings updated
