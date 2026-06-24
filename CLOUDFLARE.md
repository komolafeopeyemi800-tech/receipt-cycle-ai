# Deploying Receipt Cycle (web on Cloudflare Pages + mobile)

Production web hosting uses **Cloudflare Pages** (free tier). The backend stays on **Convex** (`apps/mobile/convex`) — Pages only builds and serves the Vite SPA at the repo root.

---

## Web app on Cloudflare Pages

### Before the first successful deploy

Commit and push **all** of these (Cloudflare clones GitHub; local-only fixes are not deployed until pushed):

- `apps/mobile/tsconfig.json` — **fully inlined** (no `"extends"` to `expo/tsconfig.base`) for Expo/Metro.
- `apps/mobile/src/tsconfig.json` — same compiler options, **no `extends`**. Vite/esbuild resolves this file first for `apps/mobile/src/lib/*` (the web app’s `@mobile-lib` alias), so the build never needs `expo` even if a parent tsconfig is mis-merged.
- `index.html` — Google Fonts loaded with `<link rel="stylesheet" …fonts.googleapis.com…>` (avoid CSS `@import`; Vite is strict about `@import` order)
- `.nvmrc` — Node `20` (matches former Netlify `NODE_VERSION`)
- `public/_redirects` — SPA fallback (`/* /index.html 200`)
- `public/_headers` — cache + security headers (ported from former `netlify.toml`)

### 1. Create a Pages project

1. In [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Authorize GitHub and select this repository.
3. **Build settings:**

| Setting | Value |
|---------|--------|
| Production branch | `main` (or your production branch) |
| Framework preset | None (or Vite) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| **Deploy command** | **Leave empty** (Pages publishes `dist` automatically). Do **not** use `npx wrangler deploy` unless you are on the Workers flow below. |
| Root directory | `/` (repository root) |

**Important:** If the build log shows `Executing user deploy command: npx wrangler deploy` and fails with *Vite … at least 6.0.0*, you created a **Worker** project or set a custom deploy command. Either clear the deploy command (Pages) or keep it — this repo now includes [`wrangler.toml`](wrangler.toml) for static `dist/` deploy without the Vite 6 plugin.

**Workers + Git (if you cannot switch to Pages):**

| Setting | Value |
|---------|--------|
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |

[`wrangler.toml`](wrangler.toml) serves `./dist` as static assets with SPA fallback (`not_found_handling = "single-page-application"`). Uses `public/_redirects` and `public/_headers` copied into `dist/` by Vite.

4. **Save and deploy.** The first build produces a `*.pages.dev` preview URL.

Node version: Cloudflare reads [`.nvmrc`](.nvmrc) (`20`). This repo uses **npm** only (`package-lock.json`). Do **not** commit `bun.lock` or `bun.lockb` — if either exists, Cloudflare runs `bun install --frozen-lockfile` and the build fails. Build command must be `npm run build` (not `bun run build`).

**If install still fails with Bun:** Pages project → Settings → Environment variables → add `SKIP_DEPENDENCY_INSTALL` = `1`, then set build command to `npm ci && npm run build`.

### 2. Environment variables

**Pages project → Settings → Environment variables → Production** (and Preview if you want parity on branch deploys).

Set at least:

| Variable | Notes |
|----------|--------|
| `VITE_CONVEX_URL` | Same Convex deployment URL as mobile (`EXPO_PUBLIC_CONVEX_URL`). Convex Dashboard → your deployment → URL. |

Copy optional keys from [`.env.example`](.env.example) (Whop checkout URLs, OAuth client id, store links, social URLs, etc.). Any `VITE_*` variable must be set in Cloudflare for production builds (or use `WHOP_CHECKOUT_*` / `WHOP_MANAGE_URL`; [`vite.config.ts`](vite.config.ts) maps them into the bundle like local `.env`).

**Migrating from Netlify:** export or copy every `VITE_*` (and `WHOP_*` if used) from Netlify **Site configuration → Environment variables** into Cloudflare Pages.

After changing env vars, trigger a **new deployment** (Deployments → Retry deployment) so Vite embeds them in the bundle.

### 3. Convex & auth alignment

- **Convex env (Dashboard → Settings → Environment variables):** `WHOP_OAUTH_CLIENT_ID` (same as `VITE_WHOP_OAUTH_CLIENT_ID`). Optional: `WHOP_OAUTH_CLIENT_SECRET`. `WHOP_WEBHOOK_SECRET` = Whop webhook signing secret. Optional: `WHOP_PRO_PRODUCT_IDS`. `PUBLIC_WEB_APP_URL=https://receiptcycle.com` for password-reset links.
- **Whop OAuth redirect (web):** In the [Whop developer dashboard](https://whop.com/dashboard/developer), register exact callback URLs, e.g. `https://receiptcycle.com/api/auth/callback/whop`. Supported routes: `/oauth/whop`, `/api/auth/callback`, `/api/auth/callback/whop`, `/auth/callback`. For **preview** testing on `*.pages.dev`, add that hostname’s callback URL too. Optional: `VITE_WHOP_REDIRECT_URI` / `VITE_WHOP_OAUTH_REDIRECT_URI` in Cloudflare env vars.
- **Whop webhooks:** Point at **`https://<deployment-name>.convex.site/whop-webhook`** (Convex HTTP, not Cloudflare). Copy signing secret to Convex `WHOP_WEBHOOK_SECRET`.
- **Mobile Whop sign-in:** Register `receiptcycle://auth/callback` (or `EXPO_PUBLIC_WHOP_OAUTH_REDIRECT_PATH`) in Whop for native apps.

### 4. Custom domain (`receiptcycle.com`)

1. Pages project → **Custom domains** → add `receiptcycle.com` and `www.receiptcycle.com` if used.
2. **DNS** (recommended: manage domain on Cloudflare):
   - Domain already on Cloudflare: Pages can add records automatically.
   - DNS elsewhere (e.g. Netlify DNS): add the CNAME / flattened A records Cloudflare shows; lower TTL before cutover.
3. Wait for SSL (usually minutes).
4. Whop callback URLs: unchanged if hostname stays `receiptcycle.com`.
5. Convex: confirm `PUBLIC_WEB_APP_URL=https://receiptcycle.com`.

### 5. Preview QA (`*.pages.dev`)

Before switching production DNS, verify on the Cloudflare preview URL:

- [ ] Deploy status **Success** (build log shows `npm run build` completed)
- [ ] `/`, `/about`, `/blog`, `/signin` load
- [ ] View source on `/about` — correct `<title>` (prerendered HTML)
- [ ] `/robots.txt`, `/sitemap.xml`, `/og-image.png` return 200
- [ ] Sign-in / sign-up (Convex auth)
- [ ] `/dashboard` after login (live Convex data)
- [ ] Whop OAuth (add `https://<project>.pages.dev/api/auth/callback/whop` in Whop for preview only)

### 6. Production cutover checklist

After DNS points to Cloudflare Pages:

- [ ] `https://receiptcycle.com` serves the latest deploy
- [ ] HTTPS valid on apex and `www` (if used)
- [ ] Sign-in, dashboard, Whop OAuth on production hostname
- [ ] Mobile apps unchanged (`EXPO_PUBLIC_CONVEX_URL` same as `VITE_CONVEX_URL`)

**Optional:** keep Netlify on a stale deploy or subdomain for 24–48h as rollback; then decommission Netlify.

### 7. Decommission Netlify

When Cloudflare is stable:

1. Confirm DNS no longer points at Netlify.
2. Remove or downgrade the Netlify site; disconnect GitHub deploy hook.
3. `netlify.toml` is removed from this repo — Cloudflare uses `public/_redirects` and `public/_headers` instead.

---

## Mobile app (iOS / Android)

**Cloudflare Pages does not build or host native mobile binaries.** It only serves the **web** app.

Use **Expo Application Services (EAS)** for production iOS builds and the native Android project under `apps/android-native` for Android.

1. Install EAS CLI: `npm i -g eas-cli`
2. From `apps/mobile`: `eas login`, then `eas build --platform ios` (or as needed).
3. Configure **`apps/mobile/.env`** / EAS secrets so `EXPO_PUBLIC_CONVEX_URL` matches production (same value as `VITE_CONVEX_URL`).
4. Android native: set `CONVEX_URL` in `apps/android-native/local.properties`.

See `apps/mobile/eas.json`, `apps/mobile/.env.example`, and `apps/android-native/README.md`.

---

## Quick checklist before go-live

- [ ] `npm run build` passes locally
- [ ] Cloudflare Pages deploy green; open `/`, `/signin`, `/dashboard` (after login) on production URL
- [ ] `VITE_CONVEX_URL` and Convex production deployment match
- [ ] Whop (if used): redirect URIs + Convex `WHOP_OAUTH_CLIENT_ID` / `PUBLIC_WEB_APP_URL`
- [ ] Mobile: production Convex URL in EAS / native Android config

---

## Local build

```bash
npm ci
npm run build
npx vite preview   # serves dist/ locally
```

Convex backend deploy (separate from Pages):

```bash
npx convex deploy
```
