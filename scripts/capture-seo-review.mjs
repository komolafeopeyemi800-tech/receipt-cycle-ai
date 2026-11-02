/** Real browser evidence for SEO and a clean product capture for social artwork.
 * PLAYWRIGHT_MODULE can point to a cached Playwright index.mjs without adding a runtime dependency.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.SEO_BASE_URL || "https://receiptcycle.com";
const out = path.resolve("artifacts/seo-2026-11-02");
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
try {
const context = await browser.newContext({ viewport: { width: 1440, height: 1080 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
const page = await context.newPage();
const errors = [];
const environmentWarnings = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() !== "error") return;
  const localGoogleOrigin = new URL(base).hostname === "127.0.0.1" && (message.text().includes("[GSI_LOGGER]") || message.location().url.includes("accounts.google.com"));
  (localGoogleOrigin ? environmentWarnings : errors).push(message.text());
});
await page.goto(base, { waitUntil: "networkidle", timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
await page.locator(".rc-product-demo").scrollIntoViewIfNeeded();
await page.getByRole("tab", { name: "Capture", exact: true }).click();
await page.locator(".rc-demo-capture").waitFor();
await page.locator(".rc-demo-capture-grid").screenshot({ path: path.join(out, "receipt-capture.png"), animations: "disabled" });
await page.locator(".rc-demo-extract-card").screenshot({ path: path.join(out, "extracted-details.png"), animations: "disabled" });
await page.locator(".rc-demo-device").first().screenshot({ path: path.join(out, "capture-workspace.png"), animations: "disabled" }).catch(() => {});
if (process.argv.includes("--capture-only")) {
  await browser.close();
  console.log("Captured the current public product demonstration at 2x resolution.");
  process.exit(0);
}
const evidence = [];
for (const [width, height] of [[390, 844], [768, 1024], [1440, 1000], [1920, 1080]]) {
  await page.setViewportSize({ width, height });
  await page.goto(base, { waitUntil: "networkidle", timeout: 60000 });
  evidence.push(await page.evaluate(() => ({ width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth, h1: [...document.querySelectorAll("main h1")].map(n => n.textContent), schemaBlocks: document.querySelectorAll('script[type="application/ld+json"]').length, imageCount: document.images.length, missingAlt: [...document.images].filter(i => !i.hasAttribute("alt")).map(i => i.src), missingDimensions: [...document.images].filter(i => !i.hasAttribute("width") || !i.hasAttribute("height")).map(i => i.getAttribute("src")) })));
  await page.screenshot({ path: path.join(out, `home-${width}.png`), fullPage: false });
}
// A real SPA navigation must leave only the destination graph in the document.
await page.getByRole("link", { name: "Explore AI scanning", exact: true }).click();
await page.waitForURL(/\/ai-receipt-scanner\/?$/, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => document.querySelector('link[rel="canonical"]')?.href === "https://receiptcycle.com/ai-receipt-scanner");
evidence.push(await page.evaluate(() => ({ path: location.pathname, canonical: document.querySelector('link[rel="canonical"]')?.href, schemaBlocks: document.querySelectorAll('script[type="application/ld+json"]').length, graphPages: [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap(n => JSON.parse(n.textContent)["@graph"] || []).filter(n => n.url === document.querySelector('link[rel="canonical"]')?.href).map(n => n["@type"]) })));
await page.goto(base, { waitUntil: "networkidle" });
await page.locator(".rc-product-demo").scrollIntoViewIfNeeded();
for (const [name, selector] of [["Capture", ".rc-demo-capture"], ["Transactions", ".rc-demo-transactions"], ["Invoices & estimates", ".rc-demo-billing"], ["Budgets", ".rc-demo-budgeting"], ["Payments & reminders", ".rc-demo-payments"]]) {
  await page.getByRole("tab", { name, exact: true }).click();
  await page.locator(selector).waitFor({ state: "visible" });
  evidence.push({ workflow: name, visible: true });
}
await page.goto(`${base}/blog/best-receipt-scanner-app-small-business-2026`, { waitUntil: "networkidle" });
evidence.push(await page.evaluate(() => ({ path: location.pathname, schemaBlocks: document.querySelectorAll('script[type="application/ld+json"]').length, imageWidth: document.querySelector('meta[property="og:image:width"]')?.content, imageHeight: document.querySelector('meta[property="og:image:height"]')?.content, publishedTime: document.querySelector('meta[property="article:published_time"]')?.content })));
await page.goto(`${base}/signup`, { waitUntil: "networkidle" });
evidence.push(await page.evaluate(() => ({ path: location.pathname, robots: document.querySelector('meta[name="robots"]')?.content, schemaBlocks: document.querySelectorAll('script[type="application/ld+json"]').length })));
await page.goto(`${base}/pricing`, { waitUntil: "networkidle" });
evidence.push(await page.evaluate(() => ({ path: location.pathname, title: document.querySelector("h1")?.textContent, canonical: document.querySelector('link[rel="canonical"]')?.href, schemaBlocks: document.querySelectorAll('script[type="application/ld+json"]').length })));
await writeFile(path.join(out, "rendered-evidence.json"), JSON.stringify({ base, evidence, errors, environmentWarnings }, null, 2));
console.log(JSON.stringify({ evidence, errors, environmentWarnings }, null, 2));
if (errors.length) process.exitCode = 1;
await browser.close();
} finally {
  await browser.close();
}
