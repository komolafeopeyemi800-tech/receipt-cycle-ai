/**
 * Post-build per-route prerender for the Vite SPA.
 *
 * Reads `dist/index.html`, and for each route in `src/content/routesSeo.ts` writes
 * `dist/<route>/index.html` with:
 *   - page-specific <title>, <meta description>, canonical, robots
 *   - per-page Open Graph + Twitter tags (and article:* tags on blog posts)
 *   - one connected JSON-LD @graph per page, built by `src/lib/schema.ts` (the same builder the client uses)
 *   - a noscript fallback with the real page content so crawlers that do not execute JS still see real text
 *
 * Signed-in app screens, auth flows and the 404 fallback are written with `noindex,nofollow`, no canonical
 * and no JSON-LD, so they can never be mistaken for the home page.
 *
 * Run: npm run seo:prerender (invoked automatically after `vite build`).
 */
import { readFile, writeFile, mkdir, cp } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { loadContent } from "./lib/load-content.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");

const ROBOTS_INDEX = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
const ROBOTS_NOINDEX = "noindex,nofollow";

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => {
    if (c === "&") return "&amp;";
    if (c === "<") return "&lt;";
    if (c === ">") return "&gt;";
    if (c === '"') return "&quot;";
    return "&#39;";
  });
}

/** JSON for an inline <script>: no raw "<" so "</script>" or "<!--" can never end the block early. */
function jsonForScript(obj) {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

/** Rewrite the <head> of `html` with per-route SEO tags. */
function rewriteHead(html, r) {
  let out = html;

  out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(r.title)}</title>`);

  const replaceMeta = (selector, tag) => {
    const re = new RegExp(`<meta[^>]*${selector}[^>]*>`, "i");
    if (re.test(out)) out = out.replace(re, tag);
    else out = out.replace(/<\/head>/i, `    ${tag}\n  </head>`);
  };
  const removeMeta = (selector) => {
    out = out.replace(new RegExp(`[ \\t]*<meta[^>]*${selector}[^>]*>\\r?\\n?`, "gi"), "");
  };

  const robots = r.noindex ? ROBOTS_NOINDEX : ROBOTS_INDEX;
  replaceMeta(`name=["']description["']`, `<meta name="description" content="${escapeHtml(r.description)}" />`);
  replaceMeta(`name=["']robots["']`, `<meta name="robots" content="${robots}" />`);
  replaceMeta(`name=["']googlebot["']`, `<meta name="googlebot" content="${robots}" />`);
  replaceMeta(`property=["']og:title["']`, `<meta property="og:title" content="${escapeHtml(r.title)}" />`);
  replaceMeta(`property=["']og:description["']`, `<meta property="og:description" content="${escapeHtml(r.description)}" />`);
  replaceMeta(`property=["']og:type["']`, `<meta property="og:type" content="${escapeHtml(r.ogType)}" />`);
  replaceMeta(`property=["']og:image["']`, `<meta property="og:image" content="${escapeHtml(r.ogImage)}" />`);
  replaceMeta(`property=["']og:image:secure_url["']`, `<meta property="og:image:secure_url" content="${escapeHtml(r.ogImage)}" />`);
  replaceMeta(`property=["']og:image:width["']`, `<meta property="og:image:width" content="${r.ogImageWidth}" />`);
  replaceMeta(`property=["']og:image:height["']`, `<meta property="og:image:height" content="${r.ogImageHeight}" />`);
  replaceMeta(`property=["']og:image:alt["']`, `<meta property="og:image:alt" content="${escapeHtml(r.ogImageAlt)}" />`);
  replaceMeta(`name=["']twitter:title["']`, `<meta name="twitter:title" content="${escapeHtml(r.title)}" />`);
  replaceMeta(`name=["']twitter:description["']`, `<meta name="twitter:description" content="${escapeHtml(r.description)}" />`);
  replaceMeta(`name=["']twitter:image["']`, `<meta name="twitter:image" content="${escapeHtml(r.ogImage)}" />`);
  replaceMeta(`name=["']twitter:image:alt["']`, `<meta name="twitter:image:alt" content="${escapeHtml(r.ogImageAlt)}" />`);

  // canonical + og:url (omitted for the 404 fallback)
  removeMeta(`property=["']og:url["']`);
  out = out.replace(/[ \t]*<link\s+rel=["']canonical["'][^>]*>\r?\n?/i, "");
  if (r.canonical) {
    out = out.replace(/<\/head>/i, `    <link rel="canonical" href="${escapeHtml(r.canonical)}" />\n    <meta property="og:url" content="${escapeHtml(r.canonical)}" />\n  </head>`);
  }

  // article:* tags (blog posts only)
  removeMeta(`property=["']article:[a-z_:]+["']`);
  if (r.article) {
    const a = r.article;
    const tags = [
      `<meta property="article:published_time" content="${escapeHtml(a.publishedTime)}" />`,
      `<meta property="article:modified_time" content="${escapeHtml(a.modifiedTime)}" />`,
      `<meta property="article:section" content="${escapeHtml(a.section)}" />`,
      ...a.tags.map((t) => `<meta property="article:tag" content="${escapeHtml(t)}" />`),
    ];
    out = out.replace(/<\/head>/i, `    ${tags.join("\n    ")}\n  </head>`);
  }

  // Remove any inline JSON-LD from index.html, then add this page's graph (none for noindex pages).
  out = out.replace(/[ \t]*<script\s+type=["']application\/ld\+json["'][\s\S]*?<\/script>\r?\n?/gi, "");
  if (r.jsonLd.length) {
    const jsonLdHtml = r.jsonLd.map((obj) => `<script type="application/ld+json">${jsonForScript(obj)}</script>`).join("\n    ");
    out = out.replace(/<\/head>/i, `    ${jsonLdHtml}\n  </head>`);
  }

  return out;
}

function injectNoscript(html, innerHtml) {
  if (!innerHtml) return html;
  const noscript = `<noscript>${innerHtml}</noscript>`;
  if (/<noscript>[\s\S]*?<\/noscript>/i.test(html)) {
    return html.replace(/<noscript>[\s\S]*?<\/noscript>/i, () => noscript);
  }
  return html.replace(/<div id=["']root["']><\/div>/i, (m) => `${m}\n    ${noscript}`);
}

async function writeRouteFile(route, baseHtml, siteUrl, defaults, content) {
  const noindex = Boolean(route.noindex);
  const canonical = content.pageUrl(route.path);
  const html0 = rewriteHead(baseHtml, {
    title: route.title,
    description: route.description,
    canonical,
    ogImage: route.ogImage ?? defaults.ogImage,
    ogImageAlt: route.ogImageAlt ?? route.title,
    ogImageWidth: route.ogImageWidth ?? 1200,
    ogImageHeight: route.ogImageHeight ?? 630,
    ogType: route.ogType ?? "website",
    noindex,
    article: route.article,
    jsonLd: noindex ? [] : (route.structuredData ?? []),
  });
  const html = injectNoscript(html0, route.noscriptHtml ?? "");

  const outDir = route.path === "/" ? DIST : path.join(DIST, route.path.replace(/^\//, ""));
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "index.html"), html, "utf8");
}

async function main() {
  const content = await loadContent();
  const { allPrerenderRoutes, privateRoutes, SITE_URL } = content;
  const baseHtml = await readFile(path.join(DIST, "index.html"), "utf8");
  const defaults = { ogImage: `${SITE_URL}/og-image.png?v=3` };

  const routes = allPrerenderRoutes();
  for (const route of routes) {
    await writeRouteFile(route, baseHtml, SITE_URL, defaults, content);
  }

  // Signed-in app and auth screens get a real file too, so the host never has to answer a missing
  // /assets/*.js with index.html (that got cached as "JS" and left blank pages). They are noindex.
  const priv = privateRoutes();
  for (const route of priv) {
    await writeRouteFile(route, baseHtml, SITE_URL, defaults, content);
  }

  // Unknown paths get 404.html: the app still loads there and sends visitors home. Never indexed, no canonical.
  const notFound = rewriteHead(baseHtml, {
    title: "Page not found | Receipt Cycle",
    description: "This page could not be found. Go to the Receipt Cycle home page.",
    canonical: null,
    ogImage: defaults.ogImage,
    ogImageAlt: "Receipt Cycle",
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogType: "website",
    noindex: true,
    article: null,
    jsonLd: [],
  });
  await writeFile(path.join(DIST, "404.html"), notFound, "utf8");

  // Copy generated SEO assets into dist if Vite didn't pick them up (they're in /public so Vite should,
  // but belt-and-suspenders for custom builds).
  const publicAssets = [
    "robots.txt",
    "sitemap.xml",
    "llms.txt",
    "llms-full.txt",
    "og-image.png",
    "favicon.ico",
    "favicon-16.png",
    "favicon-32.png",
    "apple-touch-icon.png",
    "icon-192.png",
    "icon-512.png",
    "site.webmanifest",
  ];
  for (const asset of publicAssets) {
    const src = path.join(ROOT, "public", asset);
    const dst = path.join(DIST, asset);
    try {
      await cp(src, dst, { force: true });
    } catch {
      // ignore if not present
    }
  }

  console.log(`Prerendered ${routes.length} public routes and ${priv.length} noindex app routes to /dist`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
