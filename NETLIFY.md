# Netlify (deprecated)

**Web hosting has moved to Cloudflare Pages.** Follow **[CLOUDFLARE.md](CLOUDFLARE.md)** for current deploy instructions.

`netlify.toml` was removed from this repository. SPA routing and headers live in:

- [`wrangler.toml`](wrangler.toml) (Workers) or Cloudflare Pages `_redirects` (Pages-only)
- [`public/_headers`](public/_headers)

Cancel your Netlify subscription after DNS points to Cloudflare and production is verified.
