# Independent SEO implementation review

Review date: November 2, 2026 (Africa/Lagos). This is a predeployment review of the work in progress, not a claim of production completion or measured search improvement.

Follow-up (November 3): the main implementation completed the static-render migration, permanent canonical Worker, article corrections/migrations, font optimization, 325 focused tests and browser verification of every public route. See the completion/deployment record in `full-audit-2026-11-02.md`. The baseline and access limitations below remain historical evidence and measurement boundaries.

Production follow-up: deployment `1babe470-96c4-4742-bf08-fdf969956bee` is live on receiptcycle.com. Direct-response and mobile-browser checks passed on all 35 public sitemap pages with zero reported issues. Canonical-host/slash redirects, four article 301 migrations, new social image, caching, real 404s, private noindex and preview noindex were verified. Google account-dependent indexing/rich-result/field-performance results remain unverified.

## Reviewed scope

Read the full audit, metadata/schema builders, shared SEO wrapper, prerenderer, crawler-file generator, image audit script, Cloudflare configuration, and response-header rules. Public content rendering, financial-content corrections, article URL migration, and font/performance work are being implemented and verified separately by the main team.

The source resolves the earlier schema lifecycle defect: prerendered graph scripts carry `data-seo="1"`, and client navigation removes the same owned scripts before adding destination markup. The shared wrapper now forwards image dimensions and article facts. Video markup retains the YouTube player URL and no longer labels a watch webpage as a video file. The new default social banner and representative product/search image have separate metadata roles. The source sitemap includes article body images and omits deprecated `image:title`; publicly reachable account shells are no longer crawl-disallowed, allowing their noindex directives to be read.

No additional confirmed source blocker was found in this reviewed scope. This does not replace rendered browser regression checks, Google validation, or production verification after the active implementation is complete.

## Canonical redirect implementation requirements

Cloudflare documents a small Worker in front of static assets as a supported pattern:

- Configure `main`, `assets.binding = "ASSETS"`, and `assets.run_worker_first = true`. Without Worker-first routing, existing static pages can bypass canonical-host logic.
- Keep `html_handling = "drop-trailing-slash"` and `not_found_handling = "404-page"`. The former serves folder index files at the existing non-slash canonical URL; the latter preserves actual 404 responses and avoids serving HTML for missing JavaScript files.
- For production host/scheme variants, construct the destination with a URL object, preserve pathname and query, and return a permanent redirect such as 308. A 308 preserves non-GET methods.
- Scope production normalization deliberately. Local development and Cloudflare preview URLs should remain reviewable; preview HTML can use an explicit `X-Robots-Tag: noindex` response header to prevent a duplicate crawl surface.
- Delegate canonical requests to `env.ASSETS.fetch(request)`. Calling public `fetch(request)` against the same custom domain risks recursive requests. The assets binding applies configured HTML and not-found handling.
- Preserve the asset response body, status, MIME, ETag, and cache headers. HTML currently uses `no-cache`; hashed `/assets/*` files use a long immutable cache. Do not replace these with one universal long cache duration.
- `_headers` rules do not attach to responses created directly by Worker code. Any headers needed on custom redirects or preview responses must be attached in that code. Recheck headers on delegated assets as well after deployment.
- Workers Static Assets `_redirects` does not support domain-level source rules. It is suitable for path redirects, including a one-to-one article migration, but is not a substitute for host/scheme logic.

Cloudflare's built-in `drop-trailing-slash` normalization returns 307 redirects for slash, `.html`, and `index.html` variants. The canonical non-slash document must return 200. Do not describe every alternate variant as a permanent redirect unless the implemented Worker explicitly makes it so. Combined host/scheme plus slash normalization can involve two hops unless safely coalesced; test the complete chain before claiming a one-hop result.

Primary documentation: [Worker script routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/), [configuration and assets binding](https://developers.cloudflare.com/workers/static-assets/binding/), [HTML handling](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/), [redirect limitations](https://developers.cloudflare.com/workers/static-assets/redirects/), [response headers](https://developers.cloudflare.com/workers/static-assets/headers/).

## Independent production baseline before the pending deployment

Direct HTTP requests with redirects disabled confirmed:

| Request | Observed response |
| --- | --- |
| `http://receiptcycle.com/` | 200, no Location |
| `https://receiptcycle.com/pricing` | 307 to `/pricing/` |
| `https://receiptcycle.com/pricing/` | 200 |
| `https://www.receiptcycle.com/pricing?seo-review=1` | 307 to `/pricing/?seo-review=1` |
| `https://receiptcycle.com/signin` | 307 to `/signin/` |
| A unique nonexistent public path | 404 with noindex and no graph |

The homepage still referenced the older social image when this baseline was fetched. HTML had `Cache-Control: no-cache`; robots.txt had `public, max-age=300`. These observations establish pending deployment work, not failure of the current local fixes.

## Postdeployment verification matrix

1. Fetch every sitemap canonical with redirects disabled: status 200, self canonical, correct graph, no index block, current social image and matching dimensions/MIME.
2. Check HTTP apex, HTTP www, HTTPS www, slash and `index.html` forms for the homepage, a product page, an old/migrated article, pricing, an account shell, an asset, and a query string. Record status and full redirect chain; check query preservation, no loops, and final destination.
3. Check one auth/account shell directly: noindex is present in original HTML and after rendering, graph count is zero, and no private user data appears without authentication. Verify robots permits reading the shell but retains intended API/OAuth transport restrictions.
4. Check a unique missing document and missing hashed JavaScript asset: actual 404, appropriate MIME, no public-page canonical, and no fallback HTML returned as successful JavaScript.
5. Check mutable HTML, hashed JS/CSS/font assets, social images, sitemap and robots cache policies. Confirm security headers survived the Worker and preview HTML is not indexable.
6. Inspect public HTML before scripts run and after hydration. Verify substantive static content, real images, one prominent H1, no duplicate content, one current graph, and no hydration/JavaScript errors. Navigate home to a feature, then an article, pricing and sign-up; verify destination metadata replaces prior metadata.
7. Validate representative graphs in Google's rendered Rich Results Test, then use Search Console URL Inspection when access is available. Schema.org validity and Google rich-result eligibility are separate checks.
8. Measure performance in a repeatable mobile and desktop lab run and compare compressed network bytes. Use field Core Web Vitals for user-experience claims; a build or lab score is not field evidence.

## Search Console and analytics discovery

The available tool inventory has no installed Google Search Console or Google Analytics connector. Plugin-directory research identified Windsor.ai as an available, uninstalled integration whose description includes Search Console queries/pages/clicks/impressions/CTR and GA4 sessions/conversions. No installation, account connection, analytics mutation, sitemap submission, credential retrieval, or external account action was performed.

The repository contains a public Google ownership-verification meta tag. That tag alone does not establish tool access. No GA/gtag/GTM measurement implementation was found in the reviewed public source. Optional analytics preferences exist, but they are not evidence of live measurement.

Access-dependent work remains: Google-selected canonical/indexing status, sitemap processing, query/device/page performance, field Core Web Vitals, and organic sign-up/store-click attribution. Avoid promising ranking or click gains before those results are observed. Search Console/analytics connection is not required to complete safe code fixes and deployment verification.

## Current Google feature limits

- FAQ rich results stopped appearing on May 7, 2026. Matching FAQPage can remain valid Schema.org data, but no Google FAQ snippet benefit should be promised. [Google documentation updates](https://developers.google.com/search/updates)
- Software app rich results require actual rating/review evidence and price information. Keep unsupported ratings absent. [Software app requirements](https://developers.google.com/search/docs/appearance/structured-data/software-app)
- Google says llms.txt is unnecessary for its Search ranking/visibility; maintaining it for other consumers does not establish a Google ranking benefit. [Google documentation updates](https://developers.google.com/search/updates)
