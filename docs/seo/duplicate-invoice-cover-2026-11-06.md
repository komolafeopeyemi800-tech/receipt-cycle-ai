# Duplicate invoice feature-image replacement

Approved for publication by the owner on November 6, 2026, after reviewing the exported design.

- Article: `/blog/what-is-a-duplicate-invoice`.
- Image: `/landing/blog/what-is-a-duplicate-invoice/duplicate-invoice-two-meanings-2026-11-06.webp`.
- Dimensions: 1600 x 900, opaque WebP, 81,322 bytes.
- SHA-256 of the approved WebP export: `6405a8547ceebd8b560e9e84189f59e0c9dd5a57825cf3a9f43cb3ab3a6d36a3`.
- Editable layout: `scripts/assets/blog-duplicate-invoice-cover-2026-11-06.html`; uses the existing licensed Inter font.

The illustration reflects the article's two meanings: an accidental repeated bill with the same invoice number, and an intentional copy with a new number, new dates and unpaid draft status. Example invoices are explicitly illustrative, not customer records or a screenshot of an automated supplier-invoice detection feature.

The article feature image and descriptive alt text are updated together. Existing content-driven metadata automatically carries the new asset into Open Graph, X/Twitter, article structured data, blog cards and the image sitemap. The versioned filename avoids reusing the old image cache key. No article prose or site-wide banner is changed.

## Deployment verification

Published to receiptcycle.com on November 6, 2026, using Cloudflare version `3a911d17-0532-439b-ba4c-864afb0829a8`; implementation commit `91a7cc5` is pushed to `origin/main`.

Production build and the distributed audit passed: 36 indexable pages, 71 HTML routes, zero reported issues. All 308 schema tests passed after replacing the legacy filename-pattern assertion with an exact configured-image URL check; all 9 article-layout tests passed.

The live article and WebP return 200. The published image matches the approved export SHA-256, dimensions and byte count. Original HTML Open Graph/X metadata, article JSON-LD, image sitemap and the blog listing all reference the replacement. Browser checks at 390 and 1440 px confirmed the full image loads in its 16:9 ratio without horizontal overflow or JavaScript/console errors. Local evidence is in `artifacts/duplicate-invoice-redesign-2026-11-06/deployment-verification.json` with matching live screenshots.
