/** Inspect live first-party social previews; downloaded artwork is research only. */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { JSDOM, VirtualConsole } from "jsdom";
import sharp from "sharp";

const out = path.resolve("docs/seo/og-references-2026-11-02");
await mkdir(out, { recursive: true });
const results = await Promise.all([
  ["expensify", "https://www.expensify.com/"],
  ["wave", "https://www.waveapps.com/"],
  ["freshbooks", "https://www.freshbooks.com/"],
  ["dext", "https://www.dext.com/"],
].map(async ([name, url]) => {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    const doc = new JSDOM(await response.text(), { virtualConsole: new VirtualConsole() }).window.document;
    const image = doc.querySelector('meta[property="og:image"]')?.content;
    const title = doc.querySelector('meta[property="og:title"]')?.content;
    if (!image) return { name, url, status: response.status, title, error: "No server-delivered og:image" };
    const imageUrl = new URL(image, response.url).href;
    const asset = await fetch(imageUrl, { signal: AbortSignal.timeout(30000) });
    if (!asset.ok) throw new Error(`Image HTTP ${asset.status}`);
    const bytes = Buffer.from(await asset.arrayBuffer());
    const meta = await sharp(bytes).metadata();
    const file = `${name}.${meta.format === "jpeg" ? "jpg" : meta.format}`;
    await writeFile(path.join(out, file), bytes);
    return { name, url, status: response.status, title, imageUrl, file, width: meta.width, height: meta.height, bytes: bytes.length };
  } catch (error) {
    return { name, url, error: error.message };
  }
}));
await writeFile(path.join(out, "sources.json"), JSON.stringify({ checked: "2026-11-02", purpose: "Composition research only; never ship competitor artwork", results }, null, 2));
console.log(JSON.stringify(results, null, 2));
