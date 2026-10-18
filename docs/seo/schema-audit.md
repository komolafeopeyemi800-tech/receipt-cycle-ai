# Structured data audit and rebuild

Date: 2026-10-18. Scope: every public page of receiptcycle.com, built from `npm run build` (dist/).

## 1. How schema is produced now

- `src/lib/schema.ts` is the only place JSON-LD is written. It is pure and typed, with no React or DOM.
- `src/content/routesSeo.ts` calls it for every route. The client (`<Seo>` and `applySeo`) and `scripts/prerender.mjs` both read the result, so a first page load and a client navigation carry identical markup.
- FAQ text lives in `src/content/landingFaqs.ts` (landing pages and home) and `src/content/siteFaq.ts` (/faq). The page components render those same arrays, so the FAQPage markup is the visible text.
- Landing page facts (feature lists, dates, noscript copy) live in `src/content/landingPages.ts`.
- `src/lib/seoFiles.ts` generates sitemap.xml, robots.txt, llms.txt and llms-full.txt. `npm run build` runs `seo:assets` first, so they are rebuilt every time.
- `src/lib/schema.test.ts` and `src/lib/seo.test.ts` enforce all of the rules below on every route.

## 2. Findings before the rebuild

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| 1 | Critical | `index.html` shipped a fabricated `aggregateRating` (4.8 from 124 ratings). It was copied into 36 prerendered files (every app screen, three utility pages and 404.html). | Removed. Tests forbid any rating, review or award. |
| 2 | Critical | Offers said Pro Monthly $9.99 and Pro Yearly $89.99. Real prices (`src/lib/pricingPaywall.ts`, pricing page) are $3.50 per month and $35 per year with a 7-day trial on yearly; Free is a 7-day Pro trial with up to 25 transactions. | Fixed. Offers come from `PAYWALL_PRICING`, as UnitPriceSpecification with P1M and P1Y billing periods. Offers appear only on /pricing. |
| 3 | Critical | 32 signed-in app routes, 3 utility pages and 404.html were prerendered as copies of the home page: indexable, canonical pointing at the home page, with Organization, WebSite and SoftwareApplication schema. | Fixed. They are `noindex,nofollow`, carry no schema, and have their own canonical (404 has none). |
| 4 | High | `WebSite.potentialAction` SearchAction pointed to `/blog?q=`, but the site has no search. | Removed everywhere. |
| 5 | High | `operatingSystem` claimed iOS in index.html, on the pricing app block and on 7 landing pages. No iOS app is published (app.json has an iOS block, but it is not released). | Now "Android, Web" everywhere. No downloadUrl or installUrl until a real Play URL exists. |
| 6 | High | FAQPage text differed from the visible answer on /payment-tracking-software (1 answer) and /business-budgeting-software (7 answers). Google requires matching visible content. | Fixed by making page and schema read one data source. Test enforces it. |
| 7 | High | `robots.txt`: every named AI and search bot had `Allow: /` only. A crawler that matches a named group ignores the `*` group, so GPTBot, ClaudeBot and the rest were allowed into the signed-in app. 16 app routes were also missing from the disallow list. | Regenerated: every group repeats the full disallow list; Claude-User added. |
| 8 | High | `llms.txt` was stale: said the backend is Convex, claimed iOS, advertised an "AI finance coach" that gives spending advice, listed 9 of 14 articles, no real prices. | Rewritten and now generated. `llms-full.txt` added. |
| 9 | Medium | Sitemap omitted 5 of 14 articles and /delete-account, used hand-typed dates (home, about, pricing, faq dated 2026-04-17 although the pages changed in October). | Generated from content. Dates are real (see `PAGE_DATES` in routesSeo.ts and each article's dateModified). |
| 10 | Medium | Blog posts used type `Article` with an Organization author, no wordCount, timeRequired, articleSection, citation, language, or image dimensions. Prerendered `og:image:width/height` said 1200x630 for 1600x900 images. No `article:*` tags. | BlogPosting with all of those. og size and article tags now correct on both server and client. |
| 11 | Medium | Blocks were disconnected (Organization, WebPage, FAQPage as separate scripts), no `@id`, no WebSite.publisher, no logo dimensions, no contactPoint, no legalName. | One `@graph` per page with stable `@id`s. |
| 12 | Medium | /about, /contact, legal pages and /pricing had only a bare Organization or an unconnected app block. Pricing, privacy, terms, refund, cookies, delete-account never called `<Seo>`, so client navigation left the previous page's title, canonical and JSON-LD in place. | AboutPage, ContactPage, WebPage with real dateModified, via `SeoForPath`. |
| 13 | Medium | Blog index listed posts without images or ItemList. | CollectionPage plus Blog plus ItemList (position, url, name). |
| 14 | Medium | Privacy meta description claimed "Encryption at rest and in transit, GDPR/CCPA compliance". Neither phrase appears on the privacy page. | Description rewritten to what the page covers. |
| 15 | Low | Meta titles used em dashes. | Replaced with "|". |
| 16 | Low | No `max-snippet` or author meta on client navigation; client robots meta never reset after leaving a noindex page. | `applySeo` sets robots, googlebot, author, article tags, and og image size on every navigation. |

## 3. Per page-type result

All indexable pages have: Organization (`#organization`, legalName TempEmailGen, logo 512x512, contactPoint, sameAs), WebSite (`#website`, publisher), SoftwareApplication (`#app`, Android and Web, real feature list), a WebPage subtype, a primary ImageObject with width and height, `inLanguage` en-US, `dateModified`, a ReadAction, and a BreadcrumbList (not on the home page).

| Route | Page type | Extra nodes | Notes |
|---|---|---|---|
| / | WebPage | FAQPage (5 visible Q&As), speakable h1 and first paragraph | No offers (prices are not shown on the home page). |
| /invoice-software and the 9 other landing pages | WebPage, about the app plus the topic | FAQPage (7 or 8 visible Q&As), page-specific featureList on `#app`, speakable | No HowTo: the pages list steps as bullets, not a numbered procedure. |
| /pricing | WebPage | `#app` with three Offers | Prices from `pricingPaywall.ts`. |
| /faq | FAQPage (page type) | 15 visible Q&As | |
| /about | AboutPage | | |
| /contact | ContactPage | | |
| /blog | CollectionPage | Blog, ItemList (14 posts) | |
| /blog/:slug (14) | WebPage | BlogPosting, Blog, speakable | citation only for external links shown in the article. |
| /privacy, /terms, /refund-policy, /cookies, /delete-account | WebPage | | dateModified equals the "Last updated" line on the page (test enforced). |
| /impressum, /cookie-settings, /do-not-sell | none | | noindex, not in sitemap. |
| Signed-in app, auth, 404 | none | | noindex, disallowed in robots.txt. |

## 4. Rules enforced by tests

JSON parses; one graph per page; unique `@id`s; every `@id` reference resolves; every URL is an absolute receiptcycle.com URL (except social profiles and cited sources); page URL equals the canonical; no rating, review or award text; FAQPage equals the rendered FAQ data and the page renders that data; BlogPosting required fields, ISO dates, wordCount equals the computed count, image 1600x900 (and the files really are that size); breadcrumb positions sequential and ending on the page; private routes noindex with no schema; every `<Route>` in App.tsx is accounted for; robots, sitemap and llms files agree with the route list and with the committed copies in public/.

## 5. Not changed, needs a decision

1. `src/lib/pricingPaywall.ts` (visible on /pricing) still says "AI coach", "AI finance coach" and "money-leak insights". The web dashboard still has a FinanceCoachDialog and an AI assistant page, so the feature may exist; if it was removed, the pricing copy and the About page ("flag money leaks in plain language") are stale. The AI schema text I wrote only says "Ask AI questions about saved records".
2. Four article slugs do not match their titles (for example `scan-receipts-for-tax-refund` is the business travel article, `catch-subscription-creep` is the self-employed deductions article). Renaming needs redirects.
3. Several articles describe PDF export and "all receipt images attached" in exports. The landing pages say CSV only and that images are not bundled. Not verified against the product.
4. One citation label reads "IRS Rev. Proc. 98-25" but links to `rp-97-22.pdf`.
5. Article heading levels skip (h4 callouts after h2, in 5 posts).
6. 17 title tags are over 60 characters (mostly the article titles plus the site suffix) and 5 descriptions are over 160.
7. The sameAs links (x.com/receiptcycle, instagram.com/receiptcycle) come from the site footer defaults. Confirm both profiles exist.
8. No real app screenshots are published on any page, so the app has no `screenshot` property. Add it once Play Store screenshots are on a page.
9. `site.ts` can override the social URLs by environment variable; `schema.ts` hard-codes the same defaults.
10. Real heading outlines of the client-rendered pages cannot be read from dist (the HTML only has the noscript copy). Existing page tests check for a single H1.
