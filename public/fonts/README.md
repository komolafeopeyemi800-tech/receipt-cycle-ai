# Receipt Cycle web font assets

The font binaries here are exact, unmodified WOFF2 responses from the existing
Google Fonts CSS request: Inter 400/500/600/700, Poppins 400/500/600/700/800 and
Space Grotesk 500/600/700. All original language subsets and `font-display: swap`
declarations are preserved. No family or requested weight was removed.

Upstream licenses and copyright notices are in `licenses/`. Source URLs, versions,
SHA-256 checksums and the refresh user agent are recorded in
`scripts/assets/web-font-manifest.json` in the source repository.

Font Awesome Free 6.5.2 CSS and WOFF2 files are self-hosted in `/icons/`. The fonts
use SIL OFL 1.1, CSS uses MIT, and the icons use CC BY 4.0, as explained in the
included upstream license. Modern icon families use a common-glyph subset for
icons found in the web source, with complete original font binaries available as
non-overlapping Unicode fallbacks. This retains dynamic and less-common glyphs.
Legacy v4/v5 aliases retain the original complete fonts and Unicode policies.
Subset outlines are unchanged; their internal names were changed to
`Receipt Cycle UI Icons` so modified fonts do not retain upstream reserved names.
Copyright/license records remain in the font binaries. Existing CSS family
bindings and class names remain compatible.

Refresh deliberately with `node scripts/sync-web-font-assets.mjs`. Regenerating
icon subsets requires Python and FontTools with WOFF2/Brotli support. Use
`--no-subset` only when deliberately choosing full icon fonts, then update the
font-only links in `index.html` to the emitted content-hashed filenames. Normal
application builds use these committed assets and require no network or Python.
