import { HTML_PATHS } from "./routes.generated";
import { LEGACY_BLOG_ROUTES } from "../../src/content/legacyBlogRoutes";

interface SiteEnvironment {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

const productionHosts = new Set(["receiptcycle.com", "www.receiptcycle.com"]);
const htmlPaths = new Set(HTML_PATHS);

/** Canonicalize host, scheme, known HTML forms and old article slugs in one step. */
export function canonicalRedirect(input: string): { url: string; status: 301 | 308 } | null {
  const url = new URL(input);
  const original = url.href;
  const isProduction = productionHosts.has(url.hostname);
  if (isProduction) { url.protocol = "https:"; url.hostname = "receiptcycle.com"; url.port = ""; }
  const path = url.pathname.replace(/\/index\.html$/, "").replace(/\/+$/, "") || "/";
  const legacy = LEGACY_BLOG_ROUTES[path];
  if (legacy) url.pathname = legacy;
  else if (htmlPaths.has(path)) url.pathname = path;
  if (url.href === original) return null;
  return { url: url.href, status: legacy ? 301 : 308 };
}

export default {
  async fetch(request: Request, env: SiteEnvironment): Promise<Response> {
    const url = new URL(request.url);
    const preview = url.hostname.endsWith(".workers.dev");
    const redirect = canonicalRedirect(url.href);
    let response: Response;
    if (redirect) response = new Response(null, { status: redirect.status, headers: { Location: redirect.url, "Cache-Control": "public, max-age=86400" } });
    else response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    if (productionHosts.has(url.hostname) && url.protocol === "https:") headers.set("Strict-Transport-Security", "max-age=31536000");
    if (preview || response.status >= 400) headers.set("X-Robots-Tag", "noindex, nofollow");
    if (!redirect && response.ok && /^\/(fonts|icons)\//.test(url.pathname)) headers.set("Cache-Control", "public, max-age=31536000, immutable");
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};
