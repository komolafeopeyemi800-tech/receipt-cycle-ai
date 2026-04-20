/**
 * Post-build per-route prerender for the Vite SPA.
 *
 * Reads `dist/index.html`, and for each route in `src/content/routesSeo.ts`
 * writes `dist/<route>/index.html` with:
 *   - page-specific <title>, <meta description>, canonical
 *   - per-page Open Graph + Twitter tags
 *   - JSON-LD blocks (Organization, WebSite, SoftwareApplication, FAQPage,
 *     Article, BreadcrumbList, as appropriate)
 *   - a noscript fallback with the real page content so crawlers that do
 *     not execute JS (or execute it partially) still see real text.
 *
 * This gets us ~80% of the Google/Bing/ChatGPT-indexing benefit of full SSR
 * without migrating to Next.js. The SPA still hydrates on top of the
 * prerendered HTML at runtime.
 *
 * Run: npm run seo:prerender (invoked automatically after `vite build`).
 */
import { readFile, writeFile, mkdir, cp } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { build as esbuild } from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const ROUTES_SRC = path.join(ROOT, "src/content/routesSeo.ts");

/** Bundle routesSeo.ts (+deps) into a single ESM string we can import. */
async function loadRoutesModule() {
  const result = await esbuild({
    entryPoints: [ROUTES_SRC],
    bundle: true,
    format: "esm",
    platform: "neutral",
    target: "es2020",
    write: false,
    logLevel: "silent",
    external: [],
  });
  const code = result.outputFiles[0].text;
  const dataUrl = `data:text/javascript;base64,${Buffer.from(code, "utf8").toString("base64")}`;
  return import(dataUrl);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => {
    if (c === "&") return "&amp;";
    if (c === "<") return "&lt;";
    if (c === ">") return "&gt;";
    if (c === '"') return "&quot;";
    return "&#39;";
  });
}

/** Rewrite the <head> of `html` with per-route SEO tags. */
function rewriteHead(html, { title, description, canonical, ogImage, ogType, jsonLd }) {
  let out = html;

  // <title>
  out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);

  // helpers
  const replaceMeta = (selector, tag) => {
    const re = new RegExp(`<meta[^>]*${selector}[^>]*>`, "i");
    if (re.test(out)) out = out.replace(re, tag);
    else out = out.replace(/<\/head>/i, `    ${tag}\n  </head>`);
  };

  replaceMeta(
    `name=["']description["']`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
  );
  replaceMeta(
    `property=["']og:title["']`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
  );
  replaceMeta(
    `property=["']og:description["']`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
  );
  replaceMeta(
    `property=["']og:url["']`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
  );
  replaceMeta(
    `property=["']og:type["']`,
    `<meta property="og:type" content="${escapeHtml(ogType)}" />`,
  );
  replaceMeta(
    `property=["']og:image["']`,
    `<meta property="og:image" content="${escapeHtml(ogImage)}" />`,
  );
  replaceMeta(
    `property=["']og:image:secure_url["']`,
    `<meta property="og:image:secure_url" content="${escapeHtml(ogImage)}" />`,
  );
  replaceMeta(
    `name=["']twitter:title["']`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
  );
  replaceMeta(
    `name=["']twitter:description["']`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
  );
  replaceMeta(
    `name=["']twitter:image["']`,
    `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`,
  );

  // canonical
  const linkRe = /<link\s+rel=["']canonical["'][^>]*>/i;
  const linkTag = `<link rel="canonical" href="${escapeHtml(canonical)}" />`;
  if (linkRe.test(out)) out = out.replace(linkRe, linkTag);
  else out = out.replace(/<\/head>/i, `    ${linkTag}\n  </head>`);

  // Remove the default inline JSON-LD from index.html (we'll re-add page-specific ones).
  out = out.replace(/<script\s+type=["']application\/ld\+json["'][\s\S]*?<\/script>\s*/gi, "");

  // Inject new JSON-LD blocks right before </head>.
  const jsonLdHtml = jsonLd
    .map((obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`)
    .join("\n    ");
  out = out.replace(/<\/head>/i, `    ${jsonLdHtml}\n  </head>`);

  return out;
}

function injectNoscript(html, innerHtml) {
  if (!innerHtml) return html;
  // Replace the existing <noscript>…</noscript> block wholesale.
  const noscript = `<noscript>${innerHtml}</noscript>`;
  if (/<noscript>[\s\S]*?<\/noscript>/i.test(html)) {
    return html.replace(/<noscript>[\s\S]*?<\/noscript>/i, noscript);
  }
  return html.replace(/<div id=["']root["']><\/div>/i, (m) => `${m}\n    ${noscript}`);
}

async function writeRouteFile(route, baseHtml, siteUrl) {
  const canonical = `${siteUrl}${route.path === "/" ? "/" : route.path}`;
  const ogImage = route.ogImage ?? `${siteUrl}/og-image.png?v=3`;
  const ogType = route.ogType ?? "website";
  const jsonLd = route.structuredData ?? [];

  let html = rewriteHead(baseHtml, {
    title: route.title,
    description: route.description,
    canonical,
    ogImage,
    ogType,
    jsonLd,
  });
  html = injectNoscript(html, route.noscriptHtml ?? "");

  const outDir =
    route.path === "/" ? DIST : path.join(DIST, route.path.replace(/^\//, ""));
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "index.html"), html, "utf8");
}

async function main() {
  const { allPrerenderRoutes, SITE_URL } = await loadRoutesModule();
  const baseHtmlPath = path.join(DIST, "index.html");
  const baseHtml = await readFile(baseHtmlPath, "utf8");

  const routes = allPrerenderRoutes();
  for (const route of routes) {
    await writeRouteFile(route, baseHtml, SITE_URL);
  }

  // Ensure the homepage `dist/index.html` also carries the right head tags
  // (some hosts serve it for every unknown path via SPA fallback).
  const home = routes.find((r) => r.path === "/");
  if (home) {
    await writeRouteFile(home, baseHtml, SITE_URL);
  }

  // Copy generated SEO assets into dist if Vite didn't pick them up (they're
  // in /public so Vite should, but belt-and-suspenders for custom builds).
  const publicAssets = [
    "robots.txt",
    "sitemap.xml",
    "llms.txt",
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

  // eslint-disable-next-line no-console
  console.log(`Prerendered ${routes.length} routes to /dist`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
