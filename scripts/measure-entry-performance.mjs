/** Repeatable Chromium lab observation, not Lighthouse or real-user Core Web Vitals.
 * PLAYWRIGHT_MODULE and CHROME_PATH may point to already installed browser tools.
 * node scripts/measure-entry-performance.mjs --url http://localhost:4173 --label before --runs 3
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const options = Object.fromEntries(process.argv.slice(2).reduce((pairs, arg, index, args) => arg.startsWith("--") ? [...pairs, [arg.slice(2), args[index + 1]?.startsWith("--") ? true : args[index + 1] ?? true]] : pairs, []));
const base = String(options.url ?? "http://localhost:4173");
const label = String(options.label ?? "entry").replace(/[^a-z0-9_-]/gi, "-");
const runs = Math.min(5, Math.max(1, Number(options.runs ?? 1)));
const mobile = options.desktop !== true;
const throttle = options.unthrottled !== true;
const out = path.resolve(String(options.out ?? "artifacts/seo-2026-11-02/performance"));
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const observations = [];
try {
  for (let run = 0; run < runs; run++) {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile, reducedMotion: "reduce" });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    if (throttle) {
      await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750, connectionType: "cellular4g" });
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    }
    const resources = new Map();
    const errors = [];
    cdp.on("Network.responseReceived", ({ requestId, response, type }) => resources.set(requestId, { url: response.url, status: response.status, mimeType: response.mimeType, type, bytes: 0 }));
    cdp.on("Network.loadingFinished", ({ requestId, encodedDataLength }) => { const item = resources.get(requestId); if (item) item.bytes = encodedDataLength; });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("requestfailed", (request) => errors.push(`${request.failure()?.errorText}: ${request.url()}`));
    await page.addInitScript(() => {
      window.__entryLab = { lcp: null, cls: 0, longTasks: [] };
      new PerformanceObserver((list) => { for (const entry of list.getEntries()) window.__entryLab.lcp = { time: entry.startTime, size: entry.size, element: entry.element?.tagName, url: entry.url }; }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__entryLab.cls += entry.value; }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((list) => { for (const entry of list.getEntries()) window.__entryLab.longTasks.push({ start: entry.startTime, duration: entry.duration }); }).observe({ type: "longtask", buffered: true });
    });
    const startedAt = new Date().toISOString();
    await page.goto(base, { waitUntil: "load", timeout: 120000 });
    await page.locator("main h1").first().waitFor({ timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500);
    const measurement = await page.evaluate(() => {
      const lab = window.__entryLab;
      const rect = (element) => element ? { x: element.getBoundingClientRect().x, y: element.getBoundingClientRect().y, width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height } : null;
      const heading = document.querySelector("main h1");
      const paints = Object.fromEntries(performance.getEntriesByType("paint").map((entry) => [entry.name, entry.startTime]));
      return { elapsed: performance.now(), paints, ...lab, blockingTimeObserved: lab.longTasks.reduce((total, task) => total + Math.max(0, task.duration - 50), 0), h1: heading?.textContent, h1Rect: rect(heading), h1Font: heading ? getComputedStyle(heading).fontFamily : null, loadedFonts: [...document.fonts].filter((face) => face.status === "loaded").map((face) => ({ family: face.family, weight: face.weight })), overflow: document.documentElement.scrollWidth > innerWidth, imageCount: document.images.length };
    });
    if (run === 0) await page.screenshot({ path: path.join(out, `${label}-${mobile ? "mobile" : "desktop"}.png`), fullPage: false });
    const fetched = [...resources.values()].filter((entry) => entry.url.startsWith("http"));
    const fonts = fetched.filter((entry) => /\.(woff2?|ttf)(\?|$)/.test(entry.url));
    const stylesheets = fetched.filter((entry) => entry.type === "Stylesheet");
    const observation = { run: run + 1, startedAt, ...measurement, totalTransferredBytes: fetched.reduce((total, item) => total + item.bytes, 0), fontTransferredBytes: fonts.reduce((total, item) => total + item.bytes, 0), fontRequests: fonts.length, fonts, stylesheets, errors };
    observations.push(observation);
    console.log(JSON.stringify({ label, run: run + 1, lcpMs: measurement.lcp?.time, fcpMs: measurement.paints["first-contentful-paint"], clsObserved: measurement.cls, fontBytes: observation.fontTransferredBytes, fontRequests: fonts.length, totalBytes: observation.totalTransferredBytes, errors }));
    await context.close();
  }
  const result = { label, base, browser: browser.version(), profile: { mobile, viewport: mobile ? "390x844" : "1440x1000", cache: "disabled", network: throttle ? "150ms latency, 200000 bytes/s download" : "unthrottled", cpu: throttle ? "4x slowdown" : "unthrottled", observation: "through load, fonts.ready, and 1.5 seconds; lab only, not field CWV or Lighthouse TBT" }, observations };
  await writeFile(path.join(out, `${label}.json`), JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
