/** Verify the actual hosting responses and every public page after a build/deploy.
 * SEO_BASE_URL=http://127.0.0.1:8788 node scripts/verify-site.mjs
 * For local hosting: npx wrangler dev --local --port 8788 --infer-origin-from-routes false
 * Add --browser with PLAYWRIGHT_MODULE / CHROME_PATH for hydration verification.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import sharp from "sharp";
import { loadContent } from "./lib/load-content.mjs";

const base = (process.env.SEO_BASE_URL || "https://receiptcycle.com").replace(/\/$/, "");
const { indexableRoutes, SITE_URL, SOCIAL_IMAGE, LEGACY_BLOG_ROUTES } = await loadContent();
const issues = [];
const pages = [];
const redirects = [];
const assets = [];
const check = (ok, message) => { if (!ok) issues.push(message); };
const request = url => fetch(url, { redirect: "manual", signal: AbortSignal.timeout(45000) });

for (const route of indexableRoutes()) {
  const response = await request(base + route.path);
  const html = await response.text();
  const doc = new JSDOM(html).window.document;
  const canonical = SITE_URL + route.path;
  check(response.status === 200, `${route.path}: status ${response.status}`);
  check(doc.querySelector('link[rel="canonical"]')?.href === canonical, `${route.path}: canonical`);
  check(!doc.querySelector('meta[name="robots"]')?.content.includes("noindex"), `${route.path}: indexing blocked`);
  check(doc.querySelectorAll('script[type="application/ld+json"]').length === 1, `${route.path}: schema count`);
  check(doc.querySelectorAll('#root[data-prerendered="true"] h1').length === 1, `${route.path}: static primary content`);
  check(doc.title === route.title, `${route.path}: title`);
  const cache = response.headers.get("cache-control") || "";
  check(cache.includes("no-cache") || (cache.includes("max-age=0") && cache.includes("must-revalidate")), `${route.path}: HTML must revalidate`);
  const heading = doc.querySelector("#root h1")?.textContent;
  pages.push({ path: route.path, status: response.status, heading });
}

const variants = [["/pricing/", "/pricing", 308], ["/privacy/index.html", "/privacy", 308], ...Object.entries(LEGACY_BLOG_ROUTES).map(([from, to]) => [from + "/", to, 301])];
for (const [from, to, status] of variants) {
  const response = await request(`${base}${from}?seo-check=1`);
  const location = response.headers.get("location");
  check(response.status === status && new URL(location, base).href === `${base}${to}?seo-check=1`, `${from}: redirect ${response.status} ${location}`);
  redirects.push({ from, status: response.status, location });
}
if (base === SITE_URL) {
  for (const from of ["http://receiptcycle.com/", "http://www.receiptcycle.com/pricing/?seo-check=1", "https://www.receiptcycle.com/pricing/?seo-check=1"]) {
    const response = await request(from);
    const location = response.headers.get("location");
    const to = from.includes("pricing") ? `${SITE_URL}/pricing?seo-check=1` : `${SITE_URL}/`;
    check([301, 308].includes(response.status) && location === to, `${from}: host/scheme consolidation`);
    redirects.push({ from, status: response.status, location });
  }
}
const home = new JSDOM(await (await request(base + "/")).text()).window.document;
const socialUrl = new URL(SOCIAL_IMAGE.url).pathname;
const social = await request(base + socialUrl);
const bytes = Buffer.from(await social.arrayBuffer());
const dimensions = await sharp(bytes).metadata();
check(social.status === 200 && social.headers.get("content-type")?.includes("image/png") && dimensions.width === 1200 && dimensions.height === 630, "Social image format/dimensions");
assets.push({ path: socialUrl, status: social.status, bytes: bytes.length, width: dimensions.width, height: dimensions.height });
for (const selector of ['script[type="module"][src]', 'link[rel="stylesheet"][href^="/fonts/"]', 'link[rel="stylesheet"][href^="/icons/"]']) {
  const element = home.querySelector(selector);
  const path = element?.getAttribute("src") || element?.getAttribute("href");
  check(Boolean(path), `${selector}: missing entry asset`);
  if (!path) continue;
  const response = await request(base + path);
  check(response.status === 200 && response.headers.get("cache-control")?.includes("immutable"), `${path}: asset/cache`);
  assets.push({ path, status: response.status, cache: response.headers.get("cache-control") });
}
for (const path of ["/seo-verification-missing-page", "/assets/seo-verification-missing.js"]) {
  const response = await request(base + path);
  check(response.status === 404 && response.headers.get("x-robots-tag")?.includes("noindex"), `${path}: real noindex 404`);
}
const signup = await request(base + "/signup");
const signupDoc = new JSDOM(await signup.text()).window.document;
check(signup.status === 200 && signupDoc.querySelector('meta[name="robots"]')?.content.includes("noindex") && signupDoc.querySelectorAll('script[type="application/ld+json"]').length === 0, "Signup must remain noindex with no graph");
const robots = await (await request(base + "/robots.txt")).text();
check(!robots.includes("Disallow: /signup") && robots.includes(`${SITE_URL}/sitemap.xml`), "Robots discovery/sitemap");

const browserPages = [];
if (process.argv.includes("--browser")) {
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    page.on("pageerror", error => issues.push(`${page.url()}: ${error.message}`));
    page.on("console", message => { if (message.type() === "error") issues.push(`${page.url()}: ${message.text()}`); });
    for (const route of pages) {
      await page.goto(base + route.path, { waitUntil: "networkidle", timeout: 60000 });
      const rendered = await page.evaluate(() => ({ path: location.pathname, h1: document.querySelector("#root h1")?.textContent, h1Count: document.querySelectorAll("#root h1").length, graphs: document.querySelectorAll('script[type="application/ld+json"]').length, overflow: document.documentElement.scrollWidth > innerWidth }));
      check(rendered.h1 === route.heading && rendered.h1Count === 1 && rendered.graphs === 1, `${route.path}: hydrated content/schema differs`);
      check(!rendered.overflow, `${route.path}: mobile overflow`);
      browserPages.push(rendered);
    }
  } finally { await browser.close(); }
}
const report = { checked: new Date().toISOString(), base, pages, redirects, assets, browserPages, issues };
await mkdir("artifacts/seo-2026-11-02", { recursive: true });
await writeFile(`artifacts/seo-2026-11-02/${base === SITE_URL ? "production" : "local-hosting"}-verification.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ base, publicPages: pages.length, redirects, assets, hydratedPages: browserPages.length, issues }, null, 2));
if (issues.length) process.exitCode = 1;
