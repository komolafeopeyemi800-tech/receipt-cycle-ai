# Receipt Cycle SEO audit

Implementation status (November 3, 2026): the baseline findings below have been remediated in source, including full static public-page rendering, canonical Worker routing, content corrections and performance improvements. See the final completion section for deployment evidence; earlier observations are retained as the before-state, not current defects.

Audit date: November 2, 2026 (Africa/Lagos). This is the baseline audit taken before the changes made during this work session. Live domain: https://receiptcycle.com/. Scope: the 35 URLs in the production XML sitemap, public crawler files, sampled URL variants, source routing and metadata, article content, image delivery, and public search visibility. This report records observations separately from recommendations; it does not claim access to Google Search Console or measured ranking improvements.

## Assessment

The site has a useful SEO foundation. Public pages have route-specific titles, descriptions, canonical links, social metadata, and JSON-LD in their initial HTTP response. The sitemap and robots.txt are reachable, public marketing routes are allowed, and an unknown path correctly returns a 404. All 35 sitemap URLs resolved to a 200 response after redirects. This is not a site with missing metadata everywhere.

The most important verified technical problem is inconsistent URL normalization: canonical URLs and the sitemap omit trailing slashes, while Cloudflare redirects those URLs to slash versions. HTTP and www variants also serve duplicate pages without consolidation redirects. The next priorities are making noindex effective for public account shells, reducing dependence on JavaScript for public content, and correcting older article claims and structure. Image improvements should include the requested social banner, but should also cover large legacy PNGs, intrinsic dimensions, relevant article images, and image discovery.

No audit can responsibly attribute low traffic or rankings to a specific issue without query, indexing, and real-user performance data. No critical site-wide public indexing block was found in the tested responses.

## Evidence and confidence

| Area | Method | Confidence and limit |
| --- | --- | --- |
| URLs, status codes, response headers | Direct HTTP requests; redirects disabled for variant tests | High for the sampled requests on the audit date |
| All sitemap pages | Fetch, follow redirects, parse original HTML using JSDOM | High for server HTML; not a rendered-browser audit |
| Titles, descriptions, canonical, robots, JSON-LD | Original HTML plus `src/content/routesSeo.ts`, `src/lib/seo.ts`, `src/lib/schema.ts`, and build scripts | High for presence and source consistency; JSON syntax is not Google rich-result validation |
| Rendering and mobile appearance | Source review; browser inventory attempted | Browser host was unavailable; no visual or rendered-DOM pass claimed |
| Performance | Production asset fetches, source review, PageSpeed API attempt | Asset measurements confirmed; mobile and desktop PageSpeed API calls returned 429 quota errors |
| Content | Current source and sampled live article HTML | High for the cited text; no legal/tax certification or comprehensive competitor price audit |
| Search visibility | Public `site:receiptcycle.com` search sample | Directional only; search snapshots were stale in places and are not a Google index count |
| Authority and engagement | Public author/about/support/legal content | No backlink index, analytics, conversion, or Search Console access |

The initial HTML already contains structured data. This audit does **not** infer absent schema from a text-only web extraction. Client code also injects schema; the independent schema review should verify rendered lifecycle behavior and eligibility in Google's Rich Results Test.

## Priority action plan

| Priority | Finding | Impact | Recommended action |
| --- | --- | --- | --- |
| P1 | Canonical URLs redirect to slash documents that canonical back to non-slash URLs | Conflicting consolidation signals, unnecessary requests | Align Cloudflare HTML handling, canonicals, sitemap, and internal links |
| P1 | HTTP and www serve duplicate 200 pages | Duplicate crawl surface; HTTPS not enforced by redirect | Consolidate at Cloudflare with a permanent redirect preserving path/query |
| P1 | Public shells are disallowed in robots.txt and depend on noindex | Google may never see the exclusion directive | Allow crawl where noindex is the intended exclusion mechanism; retain actual authentication and API controls |
| P1/P2 | Older tax/product content includes stale or overly broad statements | Reader trust and financial-content accuracy | Review precise claims against current product and IRS sources; qualify unsupported guarantees |
| P2 | Public content is client rendered; fallback HTML is incomplete | More work for crawlers, weaker resilience when JS fails | Render public pages as real static HTML or SSR with hydration |
| P2 | Large legacy PNGs and missing body-image dimensions | Excess bytes and potential layout movement | Produce optimized replacements and set accurate dimensions |
| P2 | Global JS/CSS/font cost needs a measured performance pass | Potential mobile loading and interaction cost | Measure first, then split/remove unused code and font/icon delivery |
| P2 | Four old article URLs describe different topics than their content | Confusing links/search expectations | Use Search Console and backlink data before a planned editorial migration |
| P2/P3 | Some older articles use paragraph blocks for section titles | Harder scanning and weak semantic outline | Convert real sections to H2/H3 blocks |
| P3 | Generic social image reused on several different page types | Lower relevance and poor social presentation | Replace the default banner; use page-specific imagery where appropriate |
| P3 | Sitemaps include legacy/deprecated image metadata and tuning fields | Maintenance clutter, not a ranking defect | Keep useful URL/image discovery, accurate lastmod; simplify ignored fields |

P1 means address early, not proof of a penalty. P2 means worthwhile implementation work. P3 means polish or maintenance. The public content rendering migration is larger than a metadata change and should be verified carefully against the signed-in application.

## Crawlability, indexation, and canonicalization

### T1. Trailing-slash redirects conflict with canonical URLs

**Priority:** P1. **Impact:** High consolidation/crawl clarity. **Confidence:** High.

Verified direct requests with redirects disabled:

| Request | Status | Location / relevant canonical |
| --- | --- | --- |
| `https://receiptcycle.com/` | 200 | Canonical `https://receiptcycle.com/` |
| `https://receiptcycle.com/pricing` | 307 | `/pricing/` |
| `https://receiptcycle.com/pricing/` | 200 | Canonical `https://receiptcycle.com/pricing` |
| `https://receiptcycle.com/invoice-software` | 307 | `/invoice-software/` |
| `https://receiptcycle.com/blog` | 307 | `/blog/` |
| `https://receiptcycle.com/blog/best-receipt-scanner-app-small-business-2026` | 307 | Same path plus `/` |
| `https://receiptcycle.com/privacy` | 307 | `/privacy/` |
| `https://receiptcycle.com/index.html` | 307 | `/` |

`src/lib/seo.ts` and the sitemap use non-slash public URLs. `scripts/prerender.mjs` writes folder `index.html` files. `wrangler.toml` does not specify `assets.html_handling`, so the static host's folder handling sends users to slash URLs.

**Fix:** Keep the existing non-slash convention and set `assets.html_handling = "drop-trailing-slash"`, then normalize internal marketing links. This setting controls HTML assets; do not apply arbitrary suffix rewriting to API endpoints or asset files. If permanent 301/308 responses are required for specific public URLs, use explicit supported redirect rules and test them for loops. Verify direct canonical URLs return 200 and the alternate form redirects once to them.

Google treats redirects, canonical annotations, and sitemap URLs as consolidation signals. Align them rather than asking Google to resolve a contradiction. [Google canonicalization guidance](https://developers.google.com/search/docs/crawling-indexing/canonicalization), [Cloudflare HTML handling](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/).

### T2. HTTP and www variants are not consolidated

**Priority:** P1. **Impact:** Medium to high. **Confidence:** High for tested homepage variants.

Both `http://receiptcycle.com/` and `https://www.receiptcycle.com/` returned 200 without a Location header. The canonical tag points to HTTPS apex, which is a helpful hint, but it does not enforce a redirect for people or crawlers. There was no `Strict-Transport-Security` response header in the sampled apex response; HSTS is a separate security hardening item, not a substitute for canonical redirects.

**Fix:** Configure a Cloudflare zone redirect or a deliberately scoped Worker to send the HTTP/www variants to `https://receiptcycle.com`, retaining path and query parameters. A 308 preserves request methods; validate auth callback and application behavior if the rule covers those URLs. Prefer one direct redirect for combined HTTP+www variants. Test home, a feature, a blog article, a query string, an asset, and an account route.

Do not put domain/protocol source rules in the Workers Static Assets `_redirects` file: Cloudflare's documented table marks domain-level redirects unsupported there. Zone Single Redirect rules support dynamic path targets and explicit query preservation. [Cloudflare static-asset redirects](https://developers.cloudflare.com/workers/static-assets/redirects/), [Single Redirect settings](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/settings/), [Google redirects guidance](https://developers.google.com/search/docs/crawling-indexing/301-redirects).

### T3. robots.txt prevents discovery of noindex on public account shells

**Priority:** P1. **Impact:** Medium; unwanted URL-only search results are possible. **Confidence:** High for configuration, no claim of current Google indexing.

The production robots file disallows `/signin`, `/signup`, `/dashboard`, and the other private route prefixes. Source prerendering also emits `noindex,nofollow` on those pages. A crawler that obeys the Disallow cannot fetch the HTML to read noindex. The current comment that these pages can never be mistaken for a public page overstates what the combination guarantees.

Public search sampling surfaced `https://receiptcycle.com/signup/?intent=expense` with an old error-page excerpt. That is a stale search snapshot, not proof of a current Google index entry, but it reinforces the need to check the account URLs in Search Console.

**Fix:** Distinguish public auth/shell URLs from protected data and APIs. If a publicly reachable 200 shell should be excluded using noindex, permit crawler retrieval of that shell. Keep actual authentication and authorization on all private information. API/OAuth paths can remain crawl-disallowed as appropriate. Do not treat robots.txt as access control. If unwanted URLs are already indexed, inspect them and use Google's supported removal/reprocessing workflow after the underlying directive is correct.

[Google noindex documentation](https://developers.google.com/search/docs/crawling-indexing/block-indexing), [Google robots meta rules](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag).

### T4. Public rendering relies on JavaScript, with incomplete fallbacks

**Priority:** P2. **Impact:** Medium; resilience/discovery risk. **Confidence:** High for source, unmeasured indexing impact.

`src/main.tsx` uses React `createRoot`. The production HTML has an empty `#root` and a noscript fallback. The current build script calls its result prerendering, but it prerenders metadata and fallback text rather than the actual React page DOM.

The home response contains about 142 body words in the static fallback and no `<img>`. Feature-page fallbacks contain approximately 179–199 words and no product/illustration images. The five legal/account-deletion pages have no route-specific `noscriptHtml`, so they inherit the generic index fallback with an H1 of `Receipt Cycle` rather than their policy contents. Articles have substantially richer fallback text, but older article source and rendered behavior must still be compared.

Google can execute JavaScript; these observations do **not** establish that Google fails to see the real pages. Public search extraction did show the richer homepage and feature content. However, initial HTML with the real main text, navigation, headings, and images reduces rendering dependence and helps visitors when scripts fail.

**Fix:** Use a real static render/SSR for public routes and hydrate the existing React UI. Keep private app routes separate. Include policy content in route-specific fallback HTML as a smaller interim improvement. Verify that server and client title, canonical, content, schema, and image URLs agree. Do not serve different substantive content solely to bots.

[Google JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [Google rendering alternatives](https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering).

### Passed crawl controls

- `/robots.txt` returned 200 and references the production XML sitemap. Public marketing, blog, pricing, FAQ, contact, and policy routes are not unintentionally disallowed by the tested rules.
- `/sitemap.xml` returned XML, with 35 HTTPS apex URL entries and image extensions. Each resolved to a 200 page after following host redirects.
- `https://receiptcycle.com/seo-audit-nonexistent-20261102` returned an actual 404, not a 200 soft-404 response. The fallback head had a page-not-found title and noindex behavior.
- The sampled HTML contains `lang="en"` and a responsive viewport declaration. The current public product is English; no missing hreflang defect is asserted for a single-language site.
- No broken internal route targets were found in generated fallback content when checked against the source route registry. This is not a substitute for a rendered crawl of every interactive state.

## On-page content and information architecture

### O1. Internal marketing links mix slash and non-slash forms

**Priority:** P2. **Impact:** Low to medium. **Confidence:** High.

`src/components/marketing/CommercialLandingLayout.tsx` links to `/ai-receipt-scanner/` and other slash feature URLs, while source canonical URLs omit the slash. Other links, such as `/blog` and `/pricing`, omit it. Normalize shared navigation/footer links once the hosting fix is chosen. Relevant ordinary `<a href>` output from React Router links is crawlable; buttons that merely change demo tabs are not a substitute for actual page links.

The product footer exposes the ten feature pages, the blog index exposes all 14 articles, and related reading exists in article source. There is no basis to label every feature page orphaned. A complete rendered link graph and click-depth calculation remain to be done after browser access is restored. [Google crawlable links guidance](https://developers.google.com/search/docs/crawling-indexing/links-crawlable).

### O2. Four legacy slugs no longer describe their article topic

**Priority:** P2. **Impact:** Medium clarity/search-intent issue. **Confidence:** High.

| Current URL slug | Current title/topic |
| --- | --- |
| `scan-receipts-for-tax-refund` | How to Track Business Travel Expenses |
| `best-expense-tracker-for-freelancers` | How to Organize Receipts for Your Accountant |
| `catch-subscription-creep` | Self-Employed Tax Deductions Most People Miss |
| `import-bank-statements-expense-tracking` | How to Manage Receipts as a Side Hustler |

Some cross-links still name the old topic; for example, the comparison post labels the last URL as bank-statement importing. A searcher expecting that answer lands on a broader side-hustle article.

**Fix:** First correct misleading link labels. Then decide whether to retain and refocus each URL or migrate to a descriptive URL. Use Search Console impressions, clicks, selected canonical, and external links to avoid throwing away existing relevance blindly. If migrating, use a one-to-one permanent redirect and update internal links, sitemap, canonical, article schema, image associations, and AI-summary URLs together. Do not create duplicate articles for each wording variant. [Google URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure).

### O3. Older article sections are stored as paragraphs

**Priority:** P2/P3. **Impact:** Reader navigation/accessibility, possible title/outline clarity. **Confidence:** High.

In `src/content/blogPosts.ts`, the older articles use `{ kind: "p" }` for section labels such as `The Deductions Most People Leave Behind`, `How to Use Receipt Cycle to Capture These Specific Categories`, and `The Deduction You're Most Likely Missing Right Now`. They therefore do not participate in the semantic heading outline or generated table of contents. Raw fallback crawl found only one H2 on several of these long pages, primarily their FAQ wrapper.

**Fix:** Convert actual sections to descriptive H2 blocks, subsections to H3, with stable unique IDs. Do not choose headings simply to hit a keyword count. Verify one clearly prominent page title and sensible nesting in the rendered page. Multiple H1 elements are not automatically a Google penalty; a clear main title is the practical goal. [Google title link guidance](https://developers.google.com/search/docs/appearance/title-link).

### O4. Titles are present; improve editorial concision where useful

**Priority:** P3. **Impact:** Potential search click clarity, not a technical indexing blocker. **Confidence:** High.

All 35 sampled sitemap responses had titles, descriptions, canonicals, and indexable robot directives. No duplicate title was found in the crawl. Long article titles range up to 109 characters including the brand; for example, the AI-in-finance title is verbose and broad relative to the site's audience. Tightening these can communicate the specific answer earlier, but must preserve meaning and the article's actual scope.

Google has no fixed 60-character title or 160-character description requirement. Search presentation depends on device width and the query, and Google may generate a different title or snippet. Do not count these lengths as errors or promise a CTR lift. Favor accurate, distinct, concise wording, then evaluate query-level CTR in Search Console. [Google titles](https://developers.google.com/search/docs/appearance/title-link), [Google snippets](https://developers.google.com/search/docs/appearance/snippet).

## Content accuracy, experience, and trust

### C1. Refresh older financial advice and qualify guarantees

**Priority:** P1/P2. **Impact:** High reader-trust importance; ranking effect not quantified. **Confidence:** High that the text exists; product/legal review needed for final wording.

The five recently revised October articles have meaningful improvements: source links, stated limitations, named authorship, update notes, a disclosed product-owner conflict in the comparison, explicit source-based scoring rather than a false hands-on claim, and a clearly disclosed fictional composite in the freelancer case study. These should not be reported as missing.

Older posts still contain statements that deserve a focused review:

| Source example | Concern | Review needed |
| --- | --- | --- |
| `blogPosts.ts`, self-employed deductions: a desk in the corner of a bedroom typically does not qualify for home office use | IRS guidance permits a separately identifiable business-use area without a permanent partition; exclusive/regular use and other conditions matter | Rewrite against current IRS Publication 587; do not imply a separate room is inherently required |
| Same article cites a 2024 SEP maximum of $69,000 | Correctly dated historical number is not a 2026 limit; can distract or mislead in an evergreen current guide | State the tax year, relevant limitations, and current primary source if current guidance is intended; IRS 2026 SEP maximum is $72,000 |
| Tax-receipt article promises cloud records stored indefinitely and says retention happens automatically | A product retention guarantee must match policy, account deletion, backups, and paid/free access | Verify actual retention policy and remove absolute promises unless contractually accurate |
| Same article says category totals align directly with tax-return lines | Operational categories and export formats may not map exactly to every user's Schedule C | Verify the implementation and describe accountant review rather than an automatic compliance outcome |
| Older posts describe exporting every receipt image attached to a report, a single-tap date-range report, or automatic flagging of uncertain extraction | Specific workflow/format behavior needs code verification | Validate against the current web and Android workflows before retaining claims |
| Language such as every deduction, permanent/forever storage, and ensuring compliance | Overstates what a record-organizing product can guarantee | Use precise practical benefits and conditions |

This report is not tax advice. It flags a content-verification task rather than drafting financial recommendations. Relevant primary sources: [IRS Publication 587](https://www.irs.gov/publications/p587), [IRS retirement plan COLA tables](https://www.irs.gov/retirement-plans/cola-increases-for-dollar-limitations-on-benefits-and-contributions), [IRS record-retention guidance](https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records).

Google's people-first content guidance emphasizes accuracy, attribution, original value, and clarity about authorship and how material was produced, particularly for topics affecting finances. These are better priorities than adding more near-identical SEO pages. [Google helpful content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).

### C2. Keep review methods and identity evidence honest

**Priority:** P2 ongoing editorial control. **Impact:** Trust. **Confidence:** High for current source.

The comparison post correctly says that its coverage scores come from product listings and are not hands-on tests. It also admits that the criteria favor the site's own all-in-one product. Keep those disclosures visible and avoid presenting the percentage scores as OCR accuracy or an independent laboratory ranking. If future hands-on claims are added, publish the receipt sample, device/version, date, test procedure, and evidence.

The author source says Philip's name/photo/social links were confirmed by the owner. Do not manufacture a surname, professional accreditation, job title, or endorsements to make the content look more authoritative. The About page and article author box already provide a coherent identity trail. [Google review guidance](https://developers.google.com/search/docs/appearance/reviews-system).

## Images, social metadata, and performance

### I1. Optimize legacy body imagery and add intrinsic dimensions

**Priority:** P2. **Impact:** Loading cost and visual stability. **Confidence:** High.

Generated fallback/source image inventory found these existing legacy assets in article bodies:

| Asset | File size | Context |
| --- | ---: | --- |
| `/landing/scan-receipt.png` | 774,905 bytes | What-is-a-receipt-scanner article |
| `/landing/finance-coach-chat.png` | 1,275,293 bytes | Tax-receipt article |
| `/landing/hero-phone.png` | 1,065,037 bytes | Older receipt/expense article |

Seven body-image uses across five older article pages lacked explicit width/height in the static output. The React image-block renderer sets dimensions only if the content supplies them; the absence therefore carries through to the real image element. Recent comparison screenshot blocks already use WebP, dimensions, descriptive filenames, alt text, and captions, with typical local files around 26–77 KB.

**Fix:** Reuse the current accurate artwork when possible, convert large raster sources to visually checked WebP/AVIF, and supply true intrinsic dimensions. Add responsive `srcset`/`sizes` for large photos/screenshots where smaller mobile renditions help. Keep a normal `src` fallback. Retain eager/high-priority loading for the actual above-the-fold hero; lazy-load lower content. Empty alt text is correct for decorative icons or thumbnails when adjacent linked text gives the same meaning; do not force keywords into every decorative asset.

[Google image SEO](https://developers.google.com/search/docs/appearance/google-images).

### I2. Image discovery should cover page content, not only social cards

**Priority:** P2/P3. **Impact:** Image relevance/discovery. **Confidence:** High for generator.

`buildSitemapXml` currently adds one image URL per page, using the Open Graph image. It does not enumerate relevant body/product/hero imagery. This is not invalid: Google can discover normal HTML images. However, most home/feature images are absent from the non-JavaScript fallback, so image discovery depends on rendering or the limited sitemap association.

**Fix:** Prefer real HTML image elements in rendered/static content. Consider including important, representative page images in the image sitemap, rather than decorative UI icons. Use stable accessible image URLs, descriptive alt text and nearby text, and accurate image dimensions in metadata. Verify each referenced image URL returns a supported image MIME type without an auth requirement or bot challenge. Sitemap discovery is a hint, not a promise of image indexing.

The generator still outputs `image:title`; Google has retired that optional extension. It also emits `priority` and `changefreq`, which Google ignores. Removing these fields is optional maintenance; accurate canonical URLs, actual image URLs, and meaningful lastmod matter more. [Google image sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps), [Google sitemap construction](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

### I3. Replace the default social preview and preserve page relevance

**Priority:** P2/P3, specifically requested by owner. **Impact:** Social/share presentation; organic CTR effect must be measured. **Confidence:** High.

The default `og-image.png` is used on the home, pricing, FAQ, about, contact, and several legal pages. Feature and blog pages already have custom image associations. The requested professional banner should improve brand/product clarity at a small preview size, with correctly matching URL, MIME type, width, height, and alt metadata across initial HTML and client updates. Keep the image public and version its URL when replacing a cached creative.

Social preview design and Google's search image selection are related but not identical. A headline-led banner may work for social sharing; Google advises representative high-quality page imagery and discourages generic logo/text images as the preferred search image. Consider an appropriate product image for `primaryImageOfPage`/article image rather than forcing every use to the same text-heavy banner. No OG design can guarantee clicks or a specific Google thumbnail. [Google preferred image guidance](https://developers.google.com/search/docs/appearance/google-images).

### P1. Measure and reduce shared loading cost

**Priority:** P2. **Impact:** Potential mobile performance cost. **Confidence:** High for fetched decoded sizes, unmeasured user effect.

Production home references on the audit date:

| Resource | Decoded size | Delivery observed |
| --- | ---: | --- |
| `/assets/index-BUInQeNU.js` | 754,181 bytes | Brotli; long immutable cache |
| `/assets/index-UZE_4cTV.css` | 224,444 bytes | Brotli; long immutable cache |
| External Font Awesome CSS | 103,009 bytes | Brotli; third-party request |
| Google Fonts stylesheet | 2,648 bytes in sampled response | Fonts downloaded separately |

These are decoded resource sizes, **not** compressed network transfer sizes or a full page-weight total. The source requests Inter, Poppins, and Space Grotesk through Google Fonts in addition to global icon CSS. Most routes use lazy page imports, which is positive, but the public and app code still share initial infrastructure. `main.tsx` also warms pricing, sign-up, sign-in, and FAQ imports during idle time.

**Fix:** Run mobile/desktop Lighthouse and inspect the network/coverage trace before changing architecture. Consider a separate public entry or finer splitting, removing unused icon CSS in favor of existing SVG icons, limiting font families/weights, and checking whether prefetching auth pages meaningfully helps. Keep hashed asset caching; do not apply a blanket long immutable cache to mutable HTML.

The unauthenticated PageSpeed API returned 429 quota errors for both mobile and desktop, so no Lighthouse score, LCP, INP, CLS, or Core Web Vitals pass/fail is claimed here. Use Search Console/CrUX field data at the relevant percentile; lab metrics help diagnose but do not replace real-user data. Google's good-experience goals are LCP within 2.5 seconds, INP below 200 ms, and CLS below 0.1. [Google Core Web Vitals guidance](https://developers.google.com/search/docs/appearance/core-web-vitals).

## Structured data scope and expectations

Every sampled sitemap page had parseable JSON-LD in the server response. Typical graphs include Organization, WebSite, SoftwareApplication, WebPage, ImageObject, and BreadcrumbList; articles add BlogPosting and relevant videos; FAQ markup is present where configured. This is a strong starting point, not proof of rich-result eligibility.

An independent detailed schema review should check: supported type/property requirements, honest page-specific claims, author/publisher IDs, image dimensions/content, price/currency consistency, video dates, links to app downloads, and duplicate graph scripts after route changes. Validate rendered home, one feature, pricing, FAQ, and representative articles in Google's Rich Results Test; then inspect Search Console enhancement reports.

Google's current documentation says FAQ rich results stopped appearing on May 7, 2026. Matching FAQPage markup may remain valid Schema.org data, but adding it cannot restore a Google FAQ snippet. SoftwareApplication rich-result eligibility also requires genuine review or aggregate-rating data in addition to a price; no rating data should be invented. Unsupported/irrelevant markup does not create a ranking benefit. [Google feature updates](https://developers.google.com/search/updates), [Google structured-data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies), [Software app requirements](https://developers.google.com/search/docs/appearance/structured-data/software-app).

## Public URL inventory

All 35 resolved successfully after following redirects. Titles, descriptions, canonical links, and indexable directives were present. The status here describes the terminal response; it does not imply the first request avoided a redirect.

| Type | Paths |
| --- | --- |
| Core | `/`, `/about`, `/blog`, `/pricing`, `/faq`, `/contact` |
| Product | `/invoice-software`, `/estimate-quotation-software`, `/payment-tracking-software`, `/ai-receipt-scanner`, `/business-travel-expense-tracker`, `/freelancer-tax-receipt-tracker`, `/business-budgeting-software`, `/client-management-software`, `/expense-reporting-software`, `/ai-financial-assistant` |
| Policies | `/privacy`, `/delete-account`, `/terms`, `/refund-policy`, `/cookies` |
| Articles | `/blog/maximize-tax-refund-by-scanning-receipts`, `/blog/best-receipt-scanner-app-small-business-2026`, `/blog/freelancers-guide-tracking-business-expenses`, `/blog/go-paperless-with-receipts`, `/blog/gig-workers-income-expense-guide`, `/blog/scan-receipts-for-tax-refund`, `/blog/best-expense-tracker-for-freelancers`, `/blog/catch-subscription-creep`, `/blog/import-bank-statements-expense-tracking`, `/blog/what-is-a-receipt-scanner-freelancers-2026`, `/blog/receipt-scanner-tax-purposes-audit-ready-year-round`, `/blog/expense-tracker-receipt-scanner-one-two-punch`, `/blog/how-ocr-receipt-scanning-works-ai-smarter`, `/blog/ai-in-finance-personal-business-money-management` |

## Verification after implementation

1. Check each canonical URL without following redirects; it should serve 200. Check alternate host/scheme/slash forms for one-step redirects without loops and with query preservation.
2. Re-fetch robots, sitemap, and representative original HTML. Confirm only intended public URLs appear in the sitemap, account-shell exclusions can be discovered, and real private data remains authenticated.
3. Run the project production build and relevant metadata/routing checks. Parse the generated HTML and confirm correct policy fallback content, dimensions, canonical, OG, and JSON-LD consistency.
4. Inspect rendered pages at phone, tablet, laptop, and wide-desktop sizes. Verify images, overflow, readable headings, real anchor links, keyboard navigation, and no duplication of static/client content or schema.
5. Validate structured data with Google's rendered Rich Results Test. Inspect the updated social URL with the platform preview/debug tools after cache refresh.
6. Use Search Console URL Inspection for home, a feature, pricing, one old and one new article, and account URLs. Compare user-declared and Google-selected canonical, fetched/rendered content, and crawl permissions.
7. Submit/confirm the sitemap in Search Console, inspect processing errors, and request recrawl only for important changed URLs. Repeated requests do not guarantee faster indexing.
8. Measure mobile/desktop performance and collect field results. Record a baseline before claiming improvement.
9. Monitor query/device/country/page-level impressions, clicks, CTR, conversions, and indexing over subsequent weeks. Use performance evidence to prioritize, rather than assuming the banner or schema guarantees ranking changes.

## External work still needed

- Search Console: Page Indexing, URL Inspection, Sitemaps, Crawl Stats, Core Web Vitals, Security Issues, Manual Actions, and query/page/device performance. The public verification meta tag exists, but ownership/access was not available to this audit agent.
- Analytics: organic sign-ups and Android-store click events, with correct consent and source attribution if tracking is part of the owner's measurement plan.
- Backlinks and editorial authority: legitimate referring links, mentions, accurate company identity, product evidence, and useful original content. No proprietary backlink dataset was available, so no invented domain-authority score or toxic-link diagnosis is given.
- Financial-content review: precise tax-year and jurisdiction framing, primary-source checks, and verification of product/retention/export promises before publishing revised advice.
- Rendered-browser QA and Google rich-result validation: unavailable in this audit environment at the time of testing; source/HTTP checks do not replace them.

The report's confirmed technical findings can be fixed in code/hosting now. Google-selected indexing, search snippets, rich-result display, and traffic effects remain external observations to verify after recrawling.

## Remediation work during this session

The implementation agent reported the following source changes in progress after this baseline was captured. These are **not claims that production has already changed**. The final handoff must attach the build/rendered verification and deployment status.

| Finding / concern | Source remediation being prepared | Remaining verification |
| --- | --- | --- |
| Slash normalization | `assets.html_handling = "drop-trailing-slash"` | Production direct response/Location checks after deployment |
| noindex discovery | Permit public app/auth-shell crawling while keeping API/OAuth/auth-transport disallows | Inspect rendered/server noindex and authentication boundaries |
| Repeated JSON-LD after client render/navigation | Mark prerendered graph scripts for the same lifecycle cleanup and forward SEO properties consistently | Rendered script count and route-change checks |
| Old default social preview | New OG banner and distinct product/search image metadata | Visual preview, image response, dimension/MIME and cache checks |
| Image sitemap relevance | Include real page images and omit deprecated `image:title` | Parse generated sitemap and verify referenced image URLs |
| HTTP/www consolidation | Identified as Cloudflare edge configuration work | Requires a correctly scoped zone rule or Worker implementation and production test; not resolved by `_redirects` |

The larger public static-render migration, legacy content review, old URL editorial plan, and performance measurement remain follow-up work unless the final implementation explicitly completes and verifies them.

## Initial remediation checkpoint (before final implementation)

The following changes are implemented in the workspace. They have not been deployed during this audit session; production observations above remain the baseline.

- Replaced the clipped default social image with an original 1200 × 630 PNG using the current public receipt-review interface and a text-only wordmark. The banner is 47,214 bytes. A separate 1200 × 675 product image without advertising copy is used for default search/application image markup. See [design research and asset details](open-graph-design-2026-11-02.md).
- Synchronized initial HTML, runtime and build-time social URLs, dimensions, image MIME type and descriptive alt text. Kept the old image URL as an alias to the replacement artwork.
- Fixed duplicate/stale prerendered JSON-LD after client hydration and route navigation. Forwarded all registered SEO properties through the shared wrapper, and removed an invalid video `contentUrl` that pointed to a YouTube watch page; retained its player `embedUrl`.
- Made account HTML shells crawlable so bots can read their existing noindex directives. Kept API/OAuth transport disallows and existing application authentication.
- Configured Cloudflare's non-slash HTML convention and normalized public commercial links to that canonical form. Production redirect behavior still needs a deployment check.
- Fixed three broken invoice-resource image references. Added verified dimensions, appropriate loading/decoding and hero priority attributes. Optimized three legacy illustrations from 3,115,235 to 104,968 bytes combined (96.6% smaller), retaining the originals. Used a small version of the existing app mark in headers, footers and demonstration UI.
- Expanded the image sitemap from default/feature images to include actual article body images and the optimized image URLs; removed deprecated `image:title`.

Validation completed:

| Check | Result |
| --- | --- |
| Production build | Passed; 38 public/utility routes and 32 app routes generated |
| Distributed HTML/image audit | Passed: 35 indexable pages, 70 HTML routes, 25 distinct social images, 53 sitemap image entries, zero reported issues |
| Focused SEO tests | 300 schema/crawler tests, 3 metadata tests, and 2 hydration/navigation component tests passed across targeted runs |
| Focused ESLint and whitespace checks | Passed |
| Public landing-page tests | All 10 commercial suites passed; BlogPost passed all 9 tests on isolated retry |
| Existing homepage catch-all interaction test | Hit its unchanged 15-second limit at 16.6 seconds on this slow environment; its other tests passed. Browser workflow checks below provide additional regression evidence, not a claim that the timeout passed |
| Rendered homepage | One H1, one graph, no images missing alt or intrinsic dimensions, and no horizontal overflow at the tested responsive widths |
| Rendered navigation | Home → scanner retained only the destination graph; article retained 1600 × 900 image metadata and publication facts; sign-up had no graph and remained noindex |
| Public workflow browser checks | Capture, transactions, invoices/estimates, budgets and payments/reminders all opened successfully; no page JavaScript errors |

Reproducible verification: `npm run build`, then `node scripts/audit-seo.mjs`. Browser evidence and screenshots are in `artifacts/seo-2026-11-02/`. These checks do not replace Google's Rich Results Test, URL Inspection, or field Core Web Vitals.

### Hosting requirement identified at the initial checkpoint

The source fixes do not enforce HTTP/www consolidation. Cloudflare Workers Static Assets `_redirects` does not support domain-level redirects. A zone Single Redirect can match:

```text
(http.host eq "www.receiptcycle.com") or
(http.host eq "receiptcycle.com" and http.request.scheme eq "http")
```

Use dynamic destination `concat("https://receiptcycle.com", http.request.uri.path)`, preserve the query string, and use a permanent redirect. Verify the canonical host serves directly, the alternate host/scheme redirects once, query strings survive, and no loops occur. This rule was documented but not written to the Cloudflare account. [Cloudflare redirect guidance](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/), [static-asset redirect limits](https://developers.cloudflare.com/workers/static-assets/redirects/).

The public HTML migration, legacy-content corrections, URL migrations and canonical-host Worker were subsequently implemented and are covered in the completion record below. Search Console and field performance observations still require external account data. No ranking, indexing or click-through uplift is claimed.

## Final completion record - November 3, 2026

All confirmed code/content/hosting defects in this audit have been addressed:

- Public routes now contain their full React-rendered content in the original HTML and hydrate interactively. Pricing is publicly renderable without private-workspace onboarding. The signed-in application loads separately; private/auth routes retain noindex and authentication.
- The site Worker permanently normalizes HTTP/www and known slash/index.html variants to HTTPS apex non-slash URLs, preserving query strings. Four misleading legacy article paths have one-to-one 301 redirects to accurately named guides. Internal links, sitemap and crawler text use the new destinations.
- Legacy guides now use real section headings, qualified tax/retention/product claims, primary-source links, and preserved publication dates with honest modification dates. The four migrated articles have substantive matching content rather than redirected unrelated landing pages.
- Metadata, JSON-LD lifecycle, image discovery/dimensions, broken images and optimized illustrations are fixed. The original 1200 x 630 social banner uses actual public demonstration UI and a text wordmark; the separate representative search image has no advertising headline.
- Fonts are self-hosted with original licensing. Font Awesome has small common-glyph subsets plus complete unicode-ranged fallbacks. Hashed font/icon assets are immutable, while HTML revalidates.

### Final predeployment checks

| Check | Result |
| --- | --- |
| Production build | Passed, including client, server renderer and 70 generated HTML routes |
| Static distributed audit | 35 indexable pages, 70 HTML routes, 25 social images, 53 sitemap image entries; zero issues |
| Focused tests | 325 passed across schema, SEO lifecycle, metadata, article layout and edge routing |
| Lint/whitespace | No errors; public route-definition export has one development fast-refresh warning |
| Cloudflare dry run | Passed, with ASSETS binding and canonical Worker bundled |
| Cloudflare local HTTP/browser | All 35 public pages served their own content, hydrated without React errors, retained one H1 and one graph, and had no horizontal overflow at 390 px |
| Responsive/demo browser | Home passed at 390/768/1440/1920 px; all five interactive workflows passed; home-to-feature navigation replaced the graph and canonical correctly |
| Account shell | Original HTML and browser remain noindex with zero graphs; local Google sign-in reports the expected unauthorized-localhost-origin warning, not a hydration defect |

Single-run mobile lab observations under the same cached-disabled, 150 ms/200,000 bytes-per-second, 4x CPU profile: FCP/LCP 8,576 ms before and 4,824 ms after; observed CLS stayed zero. Font transfer fell from 372,225 to 97,784 bytes, and total observed transfer from 783,550 to 494,648 bytes. These are limited lab samples, not Lighthouse scores, field Core Web Vitals, or proof of ranking improvement. Raw evidence is in `artifacts/seo-2026-11-02/performance/`.

Repeat the hosting checks with `SEO_BASE_URL` and `node scripts/verify-site.mjs --browser`. For local routing use `npx wrangler dev --local --port 8788 --infer-origin-from-routes false`; Vite's generic SPA preview can serve the homepage fallback at non-slash directory URLs and is not a faithful check of Cloudflare HTML handling.

Search Console URL Inspection, sitemap processing, Google-selected canonicals, rendered Rich Results Test outcomes, social-platform cache refresh and field/traffic monitoring remain external verification tasks. No connected Search Console/analytics account is available in this workspace. They are not represented as completed or as source defects.
