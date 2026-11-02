# Receipt Cycle social-preview design

Research and implementation checked November 2, 2026. This is a design intended to improve clarity and encourage relevant clicks; a click-through uplift cannot be established without measuring traffic.

## Deliverables

- `public/social/receipt-cycle-business-records-2026.png`: 1200 × 630 PNG, shared Open Graph and X large-image card.
- `public/social/receipt-cycle-receipt-review.png`: 1200 × 675 PNG, representative product image for the default search/Schema.org primary image.
- `public/og-image.png`: compatibility alias, now contains the replacement artwork.
- `public/social/source/receipt-cycle-capture.png`: 2× browser capture of the current public receipt-review demonstration. All records in it are fictional.
- `scripts/lib/social-preview.mjs`: editable, reproducible layout. `npm run seo:assets` recreates the final artwork.

The banner uses the wordmark without a logo, a short original headline, and the actual public product UI. It does not contain generated interface text, fabricated ratings, customer endorsements, or competitor artwork. Copy: “Receipts in. Clarity out.” Supporting sentence: “Scan receipts, track expenses, and keep your business in view.”

## Size and metadata research

The [Open Graph protocol](https://ogp.me/#structured) defines image URL, MIME type, intrinsic width/height, and descriptive alternative text. It does not prescribe a universal pixel size. [LinkedIn's first-party guidance](https://www.linkedin.com/help/lms/answer/a570368) recommends approximately 1.91:1 (1200 × 627). A 1200 × 630 master is effectively that ratio, widely used for landscape link previews, and retains sufficient resolution for smaller cards.

The design keeps all essential content inside 56 px side margins. The headline has explicit line breaks and fixed positions; it cannot overflow or depend on a viewer's fonts. Exported typography was visually inspected at full size and small preview sizes. It is an opaque PNG; no SVG social-crawler support is required.

[Google image guidance](https://developers.google.com/search/docs/appearance/google-images) recommends representative, high-resolution images and avoiding a generic logo or text-heavy promotional image as the preferred search image. Therefore the separate 16:9 product view is used by default `primaryImageOfPage`/application image markup, while social metadata uses the branded banner. Existing article and feature-specific images retain their own page-relevant metadata. This gives consumers two accurately described assets; Google still chooses its own thumbnail.

The versioned social filename replaces the previous `og-image.png?v=3` reference in the HTML template, runtime helper, prerender, and default schema facts. Width, height, image type, alt text and Twitter image references are synchronized. Older social posts can retain cached previews until their platform fetches the page again.

## Actual competitor previews inspected

The original files and exact source URLs are in `og-references-2026-11-02/sources.json`. These are research files outside `/public` and are not shipped as Receipt Cycle assets.

| Platform | Observed image | Useful design lesson |
| --- | --- | --- |
| Wave | 2401 × 1261 JPEG; a short slogan on a strong brand-color field | Prioritize one readable message and high contrast |
| FreshBooks | 600 × 600 PNG; brand mark and name | Clear identity survives small previews, but a logo alone does not explain Receipt Cycle's workflow |
| Dext | 1200 × 630 PNG; orange wordmark on white | Restrained composition can be effective without decorative clutter |
| Expensify | No server-delivered `og:image` found in this request | No claim about its rendered metadata or effectiveness; the user's supplied older reference informed only broad product-led composition |

These observations are composition research, not evidence that any competitor achieves higher click-through rates. Receipt Cycle's palette, wording, receipt and interface are its own.

## Validation and measurement

Run `npm run build`, then `node scripts/audit-seo.mjs`. The audit validates every distributed page's social metadata against actual file dimensions and format, confirms the new default filename is used, and checks that sitemap images exist. Runtime tests exercise article → home → private-page schema changes.

After deployment, inspect the canonical homepage with LinkedIn Post Inspector and Meta Sharing Debugger to request a fresh fetch where supported. Measure visits from shared links separately from Google Search impressions/clicks. An Open Graph redesign improves share presentation; it does not directly prove a ranking increase or control Google's chosen result image.
