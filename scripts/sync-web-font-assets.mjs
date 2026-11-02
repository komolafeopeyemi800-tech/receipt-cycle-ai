/** Self-host the exact existing font families/weights and Font Awesome 6.5.2.
 * This opt-in maintenance script is not part of the application build.
 * node scripts/sync-web-font-assets.mjs [--no-subset]
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { gzipSync } from "node:zlib";

const root = path.resolve(import.meta.dirname, "..");
const fontDir = path.join(root, "public/fonts");
const iconDir = path.join(root, "public/icons");
const sourceDir = path.join(root, "scripts/assets");
const googleCssUrl = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap";
const awesomeCssUrl = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const fingerprint = (data) => createHash("sha256").update(data).digest("hex").slice(0, 12);
await Promise.all([fontDir, iconDir, sourceDir, path.join(fontDir, "licenses")].map((dir) => mkdir(dir, { recursive: true })));

async function download(url) {
  const response = await fetch(url, { headers: { "User-Agent": userAgent } });
  if (!response.ok) throw new Error(`${response.status} downloading ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function mapLimited(items, fn) {
  const results = [];
  let index = 0;
  await Promise.all(Array.from({ length: Math.min(4, items.length) }, async () => {
    while (index < items.length) { const current = index++; results[current] = await fn(items[current], current); }
  }));
  return results;
}

const [googleCssData, awesomeCssData] = await Promise.all([download(googleCssUrl), download(awesomeCssUrl)]);
const googleCss = googleCssData.toString();
const awesomeCss = awesomeCssData.toString();
if (!awesomeCss.includes("Font Awesome Free 6.5.2")) throw new Error("Unexpected Font Awesome version");
const googleFaces = [...googleCss.matchAll(/\/\* ([^*]+) \*\/\s*(@font-face\s*\{[^}]+\})/g)].map((match) => {
  const css = match[2];
  return { subset: match[1], css, family: /font-family:\s*'([^']+)'/.exec(css)?.[1], weight: /font-weight:\s*(\d+)/.exec(css)?.[1], url: /url\(([^)]+)\)/.exec(css)?.[1] };
});
if (googleFaces.length !== 52 || googleFaces.some((face) => !face.url?.startsWith("https://fonts.gstatic.com/") || !face.url.endsWith(".woff2"))) throw new Error("Unexpected Google Fonts stylesheet; inspect before publishing");
const googleUrls = [...new Set(googleFaces.map((face) => face.url))];
const googleFonts = await mapLimited(googleUrls, async (url) => {
  const faces = googleFaces.filter((face) => face.url === url);
  const data = await download(url);
  const family = faces[0].family.toLowerCase().replaceAll(" ", "-");
  const weights = [...new Set(faces.map((face) => Number(face.weight)))];
  const weight = weights.length > 1 ? `${Math.min(...weights)}-${Math.max(...weights)}` : weights[0];
  const upstreamVersion = /\/v(\d+)\//.exec(url)?.[1];
  const filename = `${family}-v${upstreamVersion}-${faces[0].subset}-${weight}.${fingerprint(data)}.woff2`;
  await writeFile(path.join(fontDir, filename), data);
  return { url, filename, family: faces[0].family, weights, subset: faces[0].subset, bytes: data.length, sha256: createHash("sha256").update(data).digest("hex") };
});
let localGoogleCss = googleCss;
for (const font of googleFonts) localGoogleCss = localGoogleCss.replaceAll(font.url, `/fonts/${font.filename}`);
localGoogleCss = "/* Same Google Fonts CSS families, weights, subsets and display policy; see licenses/ and scripts/assets/web-font-manifest.json. */\n" + localGoogleCss;
const fontCssName = `web-fonts.${fingerprint(localGoogleCss)}.css`;
await writeFile(path.join(fontDir, fontCssName), localGoogleCss);

const awesomeFontNames = ["fa-brands-400", "fa-regular-400", "fa-solid-900", "fa-v4compatibility"];
const awesomeFonts = await mapLimited(awesomeFontNames, async (name) => {
  const url = `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/webfonts/${name}.woff2`;
  const data = await download(url);
  const filename = `${name}-6.5.2.${fingerprint(data)}.woff2`;
  await writeFile(path.join(iconDir, filename), data);
  return { name, filename, url, bytes: data.length, sha256: createHash("sha256").update(data).digest("hex") };
});
const awesomeFiles = Object.fromEntries(awesomeFonts.map((font) => [font.name, font]));
const usedNames = new Set();
async function collect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const filename = path.join(dir, entry.name);
    if (entry.isDirectory()) await collect(filename);
    else if (/\.(tsx?|css)$/.test(entry.name)) for (const match of (await readFile(filename, "utf8")).matchAll(/\bfa-[a-z0-9-]+\b/g)) usedNames.add(match[0]);
  }
}
await collect(path.join(root, "src"));
const commonPoints = new Set();
for (const match of awesomeCss.matchAll(/([^{}]+)\{content:"\\([a-fA-F0-9]+)"\}/g)) {
  if ([...match[1].matchAll(/\.([a-z0-9-]+):before/g)].some((name) => usedNames.has(name[1]))) commonPoints.add(parseInt(match[2], 16));
}
let subsets = {};
if (!process.argv.includes("--no-subset")) {
  const request = { out: iconDir, codepoints: [...commonPoints], fonts: Object.fromEntries(awesomeFonts.map((font) => [font.name, path.join(iconDir, font.filename)])) };
  const subset = spawnSync("python", [path.join(root, "scripts/subset-web-icon-fonts.py")], { input: JSON.stringify(request), encoding: "utf8" });
  if (subset.status !== 0) throw new Error(`Font subsetting failed; no entry references changed.\n${subset.stderr}`);
  subsets = JSON.parse(subset.stdout);
}
let localAwesomeCss = awesomeCss.replace(/@font-face\{[^}]+\}/g, (face) => {
  const name = /webfonts\/([^/.]+)\.woff2/.exec(face)?.[1];
  const font = awesomeFiles[name];
  if (!font) throw new Error(`Unknown font face: ${face}`);
  const localFace = face.replace(/src:[^;}]+/, `src:url("/icons/${font.filename}") format("woff2")`);
  const subset = subsets[name];
  // Only modern families are split. The upstream v4/v5 compatibility aliases retain their complete original files/ranges.
  if (!subset || !/font-family:"Font Awesome 6 (Brands|Free)"/.test(face)) return localFace;
  const faceWithSource = (filename, range) => localFace.replace(font.filename, filename).replace(/\}$/, `;unicode-range:${range}}`);
  return faceWithSource(subset.filename, subset.commonRange) + (subset.remainingRange ? faceWithSource(font.filename, subset.remainingRange) : "");
});
const iconCssName = `fontawesome-free-6.5.2.${fingerprint(localAwesomeCss)}.css`;
await writeFile(path.join(iconDir, iconCssName), localAwesomeCss);

const licenses = [
  ["Inter-OFL.txt", "https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt"],
  ["Poppins-OFL.txt", "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/OFL.txt"],
  ["Space-Grotesk-OFL.txt", "https://raw.githubusercontent.com/google/fonts/main/ofl/spacegrotesk/OFL.txt"],
  ["Font-Awesome-Free-6.5.2-LICENSE.txt", "https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.5.2/LICENSE.txt"],
];
await mapLimited(licenses, async ([filename, url]) => writeFile(path.join(fontDir, "licenses", filename), await download(url)));
const manifest = { generatedAt: new Date().toISOString(), googleCssUrl, awesomeCssUrl, userAgent, fontCss: `/fonts/${fontCssName}`, iconCss: `/icons/${iconCssName}`, preloads: googleFonts.filter((font) => font.subset === "latin" && ["Inter", "Space Grotesk"].includes(font.family)).map((font) => `/fonts/${font.filename}`), googleFonts, awesomeFonts, commonIconNamesFound: usedNames.size, commonCodepointsFound: commonPoints.size, subsets, licenses: licenses.map(([filename, url]) => ({ file: `/fonts/licenses/${filename}`, source: url })), policy: "Unmodified exact upstream Google Fonts WOFF2. Font Awesome modern common-glyph subsets have renamed internal font names and preserved licenses; complete original fonts remain as non-overlapping Unicode fallbacks. Existing CSS classes, versions and styles remain supported. Generated files are committed; normal builds are offline." };
await writeFile(path.join(sourceDir, "web-font-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify({ fontCss: manifest.fontCss, iconCss: manifest.iconCss, preloads: manifest.preloads, googleFontFiles: googleFonts.length, commonIcons: usedNames.size, originalIconBytes: awesomeFonts.filter((font) => font.name !== "fa-v4compatibility").reduce((n, font) => n + font.bytes, 0), commonIconBytes: Object.values(subsets).reduce((n, font) => n + font.bytes, 0), originalIconCssGzipBytes: gzipSync(awesomeCss).length, localIconCssGzipBytes: gzipSync(localAwesomeCss).length, subsets: Object.fromEntries(Object.entries(subsets).map(([name, info]) => [name, { bytes: info.bytes, commonCodepoints: info.commonCodepoints, remainingCodepoints: info.remainingCodepoints }])) }, null, 2));
