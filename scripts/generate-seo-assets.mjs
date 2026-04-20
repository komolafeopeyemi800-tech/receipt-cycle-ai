/**
 * Generates SEO assets from the canonical brand mark:
 *   - public/favicon.ico              (multi-size 16/32/48)
 *   - public/favicon-16.png
 *   - public/favicon-32.png
 *   - public/apple-touch-icon.png     (180x180)
 *   - public/icon-192.png
 *   - public/icon-512.png
 *   - public/og-image.png             (1200x630, teal background + logo + tagline)
 *   - public/site.webmanifest
 *
 * Run: npm run seo:assets
 *
 * Notes:
 *  - Requires `public/brand/logo.png` (1024x1024 teal circle w/ receipt mark).
 *  - Does NOT regenerate mobile icons — use `npm run brand:mobile` for those.
 *  - The .ico encoding uses a minimal writer (PNG-in-ICO) that is accepted by
 *    every modern browser and by Google's favicon fetcher.
 */
import sharp from "sharp";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC_PNG = path.join(ROOT, "public/brand/logo.png");
const OUT_DIR = path.join(ROOT, "public");

const BRAND_TEAL = "#149184";
const BRAND_TEAL_DARK = "#0e6b61";
const BRAND_ACCENT = "#ea580c";

async function ensureDir(p) {
  await mkdir(p, { recursive: true });
}

async function makeSquare(size, outPath) {
  await sharp(SRC_PNG).resize(size, size, { fit: "cover" }).png().toFile(outPath);
}

/** Minimal PNG-in-ICO writer. Takes an array of PNG buffers + sizes. */
function buildIco(entries) {
  const count = entries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const dirSize = 16 * count;
  let offset = header.length + dirSize;
  const dir = Buffer.alloc(dirSize);
  const bodies = [];

  for (let i = 0; i < count; i++) {
    const { buffer, size } = entries[i];
    const dim = size >= 256 ? 0 : size;
    const base = i * 16;
    dir.writeUInt8(dim, base + 0);
    dir.writeUInt8(dim, base + 1);
    dir.writeUInt8(0, base + 2);
    dir.writeUInt8(0, base + 3);
    dir.writeUInt16LE(1, base + 4);
    dir.writeUInt16LE(32, base + 6);
    dir.writeUInt32LE(buffer.length, base + 8);
    dir.writeUInt32LE(offset, base + 12);
    offset += buffer.length;
    bodies.push(buffer);
  }

  return Buffer.concat([header, dir, ...bodies]);
}

async function makeFaviconIco(outPath) {
  const sizes = [16, 32, 48];
  const entries = [];
  for (const size of sizes) {
    const buffer = await sharp(SRC_PNG)
      .resize(size, size, { fit: "cover" })
      .png({ compressionLevel: 9 })
      .toBuffer();
    entries.push({ buffer, size });
  }
  await writeFile(outPath, buildIco(entries));
}

/** SVG for the 1200x630 Open Graph image. */
function ogImageSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BRAND_TEAL}"/>
      <stop offset="100%" stop-color="${BRAND_TEAL_DARK}"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#fb923c"/>
      <stop offset="100%" stop-color="${BRAND_ACCENT}"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#000" flood-opacity="0.18"/>
    </filter>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <!-- soft dotted texture -->
  <g opacity="0.08" fill="#ffffff">
    <circle cx="80" cy="90" r="4"/><circle cx="150" cy="40" r="3"/><circle cx="220" cy="100" r="5"/>
    <circle cx="1100" cy="520" r="5"/><circle cx="1040" cy="590" r="4"/><circle cx="980" cy="540" r="3"/>
    <circle cx="60" cy="540" r="3"/><circle cx="130" cy="580" r="5"/>
  </g>

  <!-- brand mark: white receipt on teal circle -->
  <g transform="translate(88,180)" filter="url(#shadow)">
    <circle cx="135" cy="135" r="135" fill="#ffffff" opacity="0.96"/>
    <rect x="92" y="58" width="86" height="156" rx="12" fill="${BRAND_TEAL}"/>
    <rect x="108" y="94" width="54" height="10" rx="3" fill="#ffffff"/>
    <rect x="108" y="114" width="54" height="10" rx="3" fill="#ffffff"/>
    <rect x="108" y="134" width="40" height="10" rx="3" fill="#ffffff"/>
  </g>

  <!-- wordmark -->
  <text x="360" y="225" font-family="Space Grotesk, Inter, -apple-system, system-ui, sans-serif"
        font-size="72" font-weight="700" fill="#ffffff" letter-spacing="-1">
    Receipt Cycle
  </text>

  <!-- headline -->
  <text x="360" y="310" font-family="Inter, -apple-system, system-ui, sans-serif"
        font-size="44" font-weight="700" fill="#ffffff">
    Scan once. See your money clearly.
  </text>

  <!-- subhead -->
  <text x="360" y="372" font-family="Inter, -apple-system, system-ui, sans-serif"
        font-size="26" font-weight="400" fill="#ffffff" opacity="0.92">
    AI expense tracker + receipt scanner for freelancers and small teams.
  </text>

  <!-- feature chips -->
  <g font-family="Inter, -apple-system, system-ui, sans-serif" font-size="22" font-weight="600">
    <g transform="translate(360,420)">
      <rect width="190" height="56" rx="28" fill="#ffffff" opacity="0.18"/>
      <text x="95" y="36" text-anchor="middle" fill="#ffffff">Receipt OCR</text>
    </g>
    <g transform="translate(565,420)">
      <rect width="220" height="56" rx="28" fill="#ffffff" opacity="0.18"/>
      <text x="110" y="36" text-anchor="middle" fill="#ffffff">AI finance coach</text>
    </g>
    <g transform="translate(800,420)">
      <rect width="230" height="56" rx="28" fill="#ffffff" opacity="0.18"/>
      <text x="115" y="36" text-anchor="middle" fill="#ffffff">Money-leak alerts</text>
    </g>
  </g>

  <!-- footer URL + accent bar -->
  <rect x="360" y="528" width="84" height="6" rx="3" fill="url(#accent)"/>
  <text x="360" y="570" font-family="Inter, -apple-system, system-ui, sans-serif"
        font-size="24" font-weight="600" fill="#ffffff" opacity="0.95">
    receiptcycle.com
  </text>
</svg>`;
}

async function makeOgImage(outPath) {
  const svg = Buffer.from(ogImageSvg(), "utf8");
  await sharp(svg).png({ compressionLevel: 9 }).toFile(outPath);
}

async function main() {
  await ensureDir(OUT_DIR);

  await Promise.all([
    makeSquare(16, path.join(OUT_DIR, "favicon-16.png")),
    makeSquare(32, path.join(OUT_DIR, "favicon-32.png")),
    makeSquare(180, path.join(OUT_DIR, "apple-touch-icon.png")),
    makeSquare(192, path.join(OUT_DIR, "icon-192.png")),
    makeSquare(512, path.join(OUT_DIR, "icon-512.png")),
  ]);

  await makeFaviconIco(path.join(OUT_DIR, "favicon.ico"));
  await makeOgImage(path.join(OUT_DIR, "og-image.png"));

  const manifest = {
    name: "Receipt Cycle",
    short_name: "Receipt Cycle",
    description:
      "AI-powered expense tracker and receipt scanner. Capture purchases, catch money leaks, and keep audit-ready records for tax time.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: BRAND_TEAL,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
  await writeFile(path.join(OUT_DIR, "site.webmanifest"), JSON.stringify(manifest, null, 2));

  // eslint-disable-next-line no-console
  console.log("SEO assets generated in /public:",
    "favicon.ico, favicon-16.png, favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png, og-image.png, site.webmanifest");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
