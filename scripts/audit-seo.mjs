/** Validate the distributed HTML and image files, not just the metadata builders.
 * Run after npm run build: node scripts/audit-seo.mjs
 */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { JSDOM, VirtualConsole } from "jsdom";
import sharp from "sharp";
import { loadContent } from "./lib/load-content.mjs";

const root = process.cwd();
const dist = path.join(root, "dist");
const { allPrerenderRoutes, privateRoutes, indexableRoutes, SITE_URL, imageMimeType, SOCIAL_IMAGE } = await loadContent();
const issues = [];
const images = new Map();
const titles = new Map();
const descriptions = new Map();
const routes = [...allPrerenderRoutes(), ...privateRoutes()];
const check = (condition, message) => { if (!condition) issues.push(message); };
for (const route of routes) {
  const file = path.join(dist, route.path === "/" ? "index.html" : `${route.path.slice(1)}/index.html`);
  const doc = new JSDOM(await readFile(file, "utf8"), { virtualConsole: new VirtualConsole() }).window.document;
  const meta = (key) => doc.querySelector(`meta[property="${key}"],meta[name="${key}"]`)?.content;
  check(doc.title === route.title, `${route.path}: distributed title differs from route`);
  check(Boolean(meta("description")), `${route.path}: missing description`);
  const blocks = [...doc.querySelectorAll('script[type="application/ld+json"]')];
  check(blocks.length === (route.noindex ? 0 : 1), `${route.path}: unexpected schema block count ${blocks.length}`);
  for (const block of blocks) {
    check(block.dataset.seo === "1", `${route.path}: server schema is not owned by client navigation`);
    try { JSON.parse(block.textContent); } catch { issues.push(`${route.path}: invalid JSON-LD`); }
  }
  if (route.noindex) {
    check(meta("robots")?.includes("noindex"), `${route.path}: account/utility shell is indexable`);
    continue;
  }
  const pageRoot = doc.querySelector('#root[data-prerendered="true"]');
  check(Boolean(pageRoot), `${route.path}: public content is not statically rendered`);
  check(pageRoot?.querySelectorAll("h1").length === 1, `${route.path}: expected one rendered H1`);
  check((pageRoot?.textContent?.trim().length ?? 0) > 150, `${route.path}: static body is incomplete`);
  for (const img of pageRoot?.querySelectorAll("img") ?? []) {
    check(img.hasAttribute("alt"), `${route.path}: image is missing alt (${img.getAttribute("src")})`);
    check(img.hasAttribute("width") && img.hasAttribute("height"), `${route.path}: image has no intrinsic dimensions (${img.getAttribute("src")})`);
    const src = new URL(img.getAttribute("src"), SITE_URL);
    if (src.origin === SITE_URL) {
      try { await readFile(path.join(dist, decodeURIComponent(src.pathname))); }
      catch { issues.push(`${route.path}: rendered image file missing ${src.pathname}`); }
    }
  }
  const routePaths = new Set(routes.map(r => r.path));
  for (const link of pageRoot?.querySelectorAll('a[href^="/"]') ?? []) {
    const url = new URL(link.getAttribute("href"), SITE_URL);
    const target = url.pathname.replace(/\/$/, "") || "/";
    if (!path.extname(target)) check(routePaths.has(target), `${route.path}: unknown internal page ${target}`);
  }
  check(!meta("robots")?.includes("noindex"), `${route.path}: public page is noindex`);
  const canonical = SITE_URL + (route.path === "/" ? "/" : route.path);
  check(doc.querySelector('link[rel="canonical"]')?.href === canonical, `${route.path}: non-self canonical`);
  check(meta("og:url") === canonical, `${route.path}: og:url differs from canonical`);
  check(meta("twitter:card") === "summary_large_image", `${route.path}: wrong social card`);
  check(meta("og:image") === meta("twitter:image"), `${route.path}: inconsistent social image`);
  check(Boolean(meta("og:image:alt")), `${route.path}: missing social alt`);
  const imageUrl = meta("og:image");
  check(imageUrl?.startsWith("https://"), `${route.path}: social image must be absolute HTTPS`);
  check(meta("og:image:type") === imageMimeType(imageUrl ?? ""), `${route.path}: incorrect image MIME`);
  if (!route.ogImage) check(imageUrl === SOCIAL_IMAGE.url, `${route.path}: stale default social image`);
  const imagePath = new URL(imageUrl).pathname;
  if (!images.has(imagePath)) images.set(imagePath, await sharp(path.join(dist, imagePath)).metadata());
  const size = images.get(imagePath);
  check(Number(meta("og:image:width")) === size.width && Number(meta("og:image:height")) === size.height, `${route.path}: social image dimensions do not match its file`);
  for (const [value, map, label] of [[doc.title, titles, "title"], [meta("description"), descriptions, "description"]]) {
    check(!map.has(value), `${route.path}: duplicate ${label} with ${map.get(value)}`);
    map.set(value, route.path);
  }
}
const sitemap = new JSDOM(await readFile(path.join(dist, "sitemap.xml"), "utf8"), { contentType: "text/xml" }).window.document;
const urls = [...sitemap.getElementsByTagName("loc")].map(n => n.textContent);
const expected = indexableRoutes().map(r => SITE_URL + (r.path === "/" ? "/" : r.path));
check(JSON.stringify([...urls].sort()) === JSON.stringify(expected.sort()), "Sitemap does not exactly match indexable routes");
for (const loc of [...sitemap.getElementsByTagName("image:loc")]) {
  const url = new URL(loc.textContent);
  if (url.origin !== SITE_URL) continue;
  try { await readFile(path.join(dist, decodeURIComponent(url.pathname))); }
  catch { issues.push(`Sitemap image missing: ${url.pathname}`); }
}
check(sitemap.getElementsByTagName("image:title").length === 0, "Deprecated image:title in sitemap");
const notFound = new JSDOM(await readFile(path.join(dist, "404.html"), "utf8")).window.document;
check(notFound.querySelector('meta[name="robots"]')?.content.includes("noindex"), "404 fallback is indexable");
check(!notFound.querySelector('link[rel="canonical"]'), "404 canonical incorrectly points to a valid page");
const report = { checked: "2026-11-02", publicPages: urls.length, htmlRoutes: routes.length, uniqueSocialImages: images.size, sitemapImageEntries: sitemap.getElementsByTagName("image:loc").length, issues };
await mkdir(path.join(root, "artifacts/seo-2026-11-02"), { recursive: true });
await writeFile(path.join(root, "artifacts/seo-2026-11-02/build-audit.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (issues.length) process.exitCode = 1;
