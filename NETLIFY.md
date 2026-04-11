# Deploying Receipt Cycle (web + mobile)

## Web app on Netlify

Netlify hosts the **Vite React app** in this repository root (`npm run build` → `dist/`).

### Before the first successful deploy

Commit and push **all** of these (Netlify clones GitHub; your machine-only fixes are not deployed until pushed):

- `apps/mobile/tsconfig.json` — must be **fully inlined** (no `"extends"`). Vite loads this when bundling `@mobile-lib`; `extends` to `expo/tsconfig.base` breaks Netlify because `expo` is not installed at the repo root.
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

Copy optional keys from **`.env.example`** (Whop checkout URLs, OAuth client id, store links, etc.). Any variable prefixed with `VITE_` must be set in Netlify for production builds.

After changing env vars, trigger a **new deploy** so Vite embeds them in the bundle.

### 3. Convex & auth alignment

- **Whop OAuth:** Add redirect URI `https://<your-netlify-domain>/oauth/whop` in the Whop developer dashboard (same OAuth app as in Convex `WHOP_OAUTH_CLIENT_ID`).
- **Convex env:** Set `PUBLIC_WEB_APP_URL=https://<your-netlify-domain>` so password-reset and email links point at the live site.

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
