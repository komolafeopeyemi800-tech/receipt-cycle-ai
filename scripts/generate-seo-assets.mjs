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
const LANDING_DIR = path.join(OUT_DIR, "landing");

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

/** Page-specific Open Graph image for /invoice-software. */
function invoiceSoftwareOgSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="invoice-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#effcf7"/>
      <stop offset="100%" stop-color="#d8f3eb"/>
    </linearGradient>
    <filter id="invoice-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="20" stdDeviation="24" flood-color="#0f3d38" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#invoice-bg)"/>
  <circle cx="1110" cy="80" r="220" fill="#99e4d2" opacity="0.35"/>
  <circle cx="40" cy="620" r="210" fill="#bfeadd" opacity="0.5"/>

  <g transform="translate(72,70)">
    <circle cx="28" cy="28" r="28" fill="#0f766e"/>
    <rect x="19" y="13" width="18" height="30" rx="3" fill="#ffffff"/>
    <rect x="23" y="21" width="10" height="2.5" rx="1" fill="#0f766e"/>
    <rect x="23" y="27" width="10" height="2.5" rx="1" fill="#0f766e"/>
    <rect x="23" y="33" width="7" height="2.5" rx="1" fill="#0f766e"/>
    <text x="72" y="37" font-family="Space Grotesk, Inter, Arial, sans-serif" font-size="28" font-weight="700" fill="#0f172a">Receipt Cycle</text>
  </g>

  <text x="72" y="220" font-family="Space Grotesk, Inter, Arial, sans-serif" font-size="58" font-weight="700" fill="#0f172a" letter-spacing="-1.5">
    <tspan x="72" dy="0">Invoice software for</tspan>
    <tspan x="72" dy="68">small businesses</tspan>
  </text>
  <text x="72" y="380" font-family="Inter, Arial, sans-serif" font-size="25" fill="#475569">
    <tspan x="72" dy="0">Create, review, and track invoices with</tspan>
    <tspan x="72" dy="38">customers, payments, and balances connected.</tspan>
  </text>
  <g transform="translate(72,485)">
    <rect width="250" height="60" rx="16" fill="#0f766e"/>
    <text x="125" y="38" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="700" fill="#ffffff">Create your first invoice</text>
  </g>

  <g transform="translate(716,58)" filter="url(#invoice-shadow)">
    <rect width="410" height="514" rx="28" fill="#ffffff"/>
    <rect width="410" height="58" rx="28" fill="#0f172a"/>
    <rect y="30" width="410" height="28" fill="#0f172a"/>
    <circle cx="28" cy="28" r="5" fill="#fb7185"/>
    <circle cx="46" cy="28" r="5" fill="#fbbf24"/>
    <circle cx="64" cy="28" r="5" fill="#34d399"/>
    <text x="205" y="34" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="700" fill="#cbd5e1">Invoice preview</text>

    <g transform="translate(32,88)">
      <rect width="38" height="38" rx="11" fill="#0f766e"/>
      <rect x="13" y="8" width="13" height="22" rx="2" fill="#ffffff"/>
      <text x="54" y="17" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="700" fill="#0f172a">Northstar Studio</text>
      <text x="54" y="33" font-family="Inter, Arial, sans-serif" font-size="9" fill="#94a3b8">Design and digital services</text>
      <text x="346" y="15" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="800" fill="#0f766e">INVOICE</text>
      <text x="346" y="32" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="10" font-weight="700" fill="#64748b">INV-0042</text>
    </g>
    <line x1="32" y1="146" x2="378" y2="146" stroke="#e2e8f0"/>
    <text x="32" y="180" font-family="Inter, Arial, sans-serif" font-size="9" font-weight="700" fill="#94a3b8">BILL TO</text>
    <text x="32" y="200" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="700" fill="#0f172a">Harbor &amp; Co.</text>
    <text x="378" y="180" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="10" fill="#64748b">Issued Sep 18, 2026</text>
    <text x="378" y="199" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="10" fill="#64748b">Due Oct 18, 2026</text>

    <rect x="32" y="228" width="346" height="34" rx="8" fill="#f8fafc"/>
    <text x="46" y="249" font-family="Inter, Arial, sans-serif" font-size="9" font-weight="700" fill="#94a3b8">SERVICE</text>
    <text x="286" y="249" font-family="Inter, Arial, sans-serif" font-size="9" font-weight="700" fill="#94a3b8">QTY</text>
    <text x="364" y="249" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="9" font-weight="700" fill="#94a3b8">AMOUNT</text>
    <text x="46" y="292" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="700" fill="#334155">Brand sprint</text>
    <text x="286" y="292" font-family="Inter, Arial, sans-serif" font-size="11" fill="#475569">1</text>
    <text x="364" y="292" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="700" fill="#334155">$1,800</text>
    <line x1="32" y1="313" x2="378" y2="313" stroke="#f1f5f9"/>
    <text x="46" y="345" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="700" fill="#334155">Content setup</text>
    <text x="286" y="345" font-family="Inter, Arial, sans-serif" font-size="11" fill="#475569">6</text>
    <text x="364" y="345" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="700" fill="#334155">$900</text>

    <text x="254" y="401" font-family="Inter, Arial, sans-serif" font-size="10" fill="#64748b">Subtotal</text>
    <text x="364" y="401" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="10" font-weight="700" fill="#334155">$2,700.00</text>
    <text x="254" y="426" font-family="Inter, Arial, sans-serif" font-size="10" fill="#64748b">Tax and discount</text>
    <text x="364" y="426" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="10" font-weight="700" fill="#334155">$70.20</text>
    <line x1="245" y1="443" x2="378" y2="443" stroke="#cbd5e1"/>
    <text x="254" y="474" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="800" fill="#0f766e">Total</text>
    <text x="364" y="474" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="800" fill="#0f766e">$2,770.20</text>
  </g>
</svg>`;
}

async function makeInvoiceSoftwareOg(outPath) {
  await sharp(Buffer.from(invoiceSoftwareOgSvg(), "utf8")).png({ compressionLevel: 9 }).toFile(outPath);
}

/** Page-specific Open Graph image for /estimate-quotation-software. */
function estimateQuotationSoftwareOgSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="estimate-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f5fcf9"/>
      <stop offset="100%" stop-color="#d9f2e9"/>
    </linearGradient>
    <filter id="estimate-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="20" stdDeviation="24" flood-color="#0f3d38" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#estimate-bg)"/>
  <circle cx="1120" cy="80" r="220" fill="#8dd9c7" opacity="0.32"/>
  <circle cx="30" cy="620" r="210" fill="#c7ebe1" opacity="0.55"/>

  <g transform="translate(72,70)">
    <circle cx="28" cy="28" r="28" fill="#0f766e"/>
    <path d="M18 14h17v29H18z" fill="#ffffff"/>
    <path d="M23 22h8M23 28h8M23 34h6" stroke="#0f766e" stroke-width="2.5" stroke-linecap="round"/>
    <text x="72" y="37" font-family="Space Grotesk, Inter, Arial, sans-serif" font-size="28" font-weight="700" fill="#0f172a">Receipt Cycle</text>
  </g>

  <text x="72" y="196" font-family="Space Grotesk, Inter, Arial, sans-serif" font-size="50" font-weight="700" fill="#0f172a" letter-spacing="-1.2">
    <tspan x="72" dy="0">Estimate software for</tspan>
    <tspan x="72" dy="58" fill="#0f766e">small businesses</tspan>
    <tspan x="72" dy="58" fill="#0f766e">and freelancers</tspan>
  </text>
  <text x="72" y="398" font-family="Inter, Arial, sans-serif" font-size="22" fill="#475569">
    <tspan x="72" dy="0">Create the estimate, record acceptance,</tspan>
    <tspan x="72" dy="37">then carry the details into an invoice draft.</tspan>
  </text>
  <g transform="translate(72,485)">
    <rect width="260" height="60" rx="16" fill="#0f766e"/>
    <text x="130" y="38" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="700" fill="#ffffff">Create your first estimate</text>
  </g>

  <g transform="translate(706,76)" filter="url(#estimate-shadow)">
    <rect width="340" height="420" rx="26" fill="#ffffff"/>
    <rect width="340" height="54" rx="26" fill="#0f172a"/>
    <rect y="28" width="340" height="26" fill="#0f172a"/>
    <circle cx="27" cy="27" r="5" fill="#fb7185"/>
    <circle cx="45" cy="27" r="5" fill="#fbbf24"/>
    <circle cx="63" cy="27" r="5" fill="#34d399"/>
    <text x="170" y="33" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="700" fill="#cbd5e1">Estimate preview</text>
    <text x="28" y="98" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="800" fill="#0f766e">ESTIMATE</text>
    <text x="312" y="98" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="700" fill="#64748b">EST-0048</text>
    <line x1="28" y1="120" x2="312" y2="120" stroke="#e2e8f0"/>
    <text x="28" y="152" font-family="Inter, Arial, sans-serif" font-size="9" font-weight="700" fill="#94a3b8">PREPARED FOR</text>
    <text x="28" y="174" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="700" fill="#0f172a">Harbor &amp; Co.</text>
    <text x="312" y="152" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="10" fill="#64748b">Valid until Oct 18</text>
    <rect x="28" y="202" width="284" height="32" rx="8" fill="#f8fafc"/>
    <text x="40" y="222" font-family="Inter, Arial, sans-serif" font-size="9" font-weight="700" fill="#94a3b8">SERVICE</text>
    <text x="298" y="222" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="9" font-weight="700" fill="#94a3b8">AMOUNT</text>
    <text x="40" y="266" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="700" fill="#334155">Website design</text>
    <text x="298" y="266" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="700" fill="#334155">$2,500</text>
    <line x1="28" y1="286" x2="312" y2="286" stroke="#f1f5f9"/>
    <text x="40" y="320" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="700" fill="#334155">Development</text>
    <text x="298" y="320" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="700" fill="#334155">$2,400</text>
    <line x1="180" y1="350" x2="312" y2="350" stroke="#cbd5e1"/>
    <text x="190" y="382" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="800" fill="#0f766e">Total</text>
    <text x="312" y="382" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="800" fill="#0f766e">$5,027.40</text>
  </g>

  <g transform="translate(1010,420)">
    <circle cx="0" cy="0" r="42" fill="#10b981"/>
    <path d="M-18 1l12 12 25-27" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M-5 60v43" stroke="#0f766e" stroke-width="7" stroke-linecap="round"/>
    <path d="M-5 103l-14-16M-5 103l14-16" stroke="#0f766e" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="28" y="72" width="120" height="82" rx="16" fill="#ffffff" stroke="#cbd5e1"/>
    <text x="88" y="106" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="10" font-weight="700" fill="#64748b">INVOICE DRAFT</text>
    <text x="88" y="132" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="800" fill="#0f172a">INV-0054</text>
  </g>
</svg>`;
}

async function makeEstimateQuotationSoftwareOg(outPath) {
  await sharp(Buffer.from(estimateQuotationSoftwareOgSvg(), "utf8")).png({ compressionLevel: 9 }).toFile(outPath);
}

/** Page-specific Open Graph image for /payment-tracking-software. */
function paymentTrackingSoftwareOgSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="payment-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f5fcf9"/>
      <stop offset="100%" stop-color="#d9f2e9"/>
    </linearGradient>
    <filter id="payment-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="20" stdDeviation="24" flood-color="#0f3d38" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#payment-bg)"/>
  <circle cx="1120" cy="80" r="220" fill="#8dd9c7" opacity="0.32"/>
  <circle cx="30" cy="620" r="210" fill="#c7ebe1" opacity="0.55"/>

  <g transform="translate(72,70)">
    <circle cx="28" cy="28" r="28" fill="#0f766e"/>
    <path d="M18 14h17v29H18z" fill="#ffffff"/>
    <path d="M23 22h8M23 28h8M23 34h6" stroke="#0f766e" stroke-width="2.5" stroke-linecap="round"/>
    <text x="72" y="37" font-family="Space Grotesk, Inter, Arial, sans-serif" font-size="28" font-weight="700" fill="#0f172a">Receipt Cycle</text>
  </g>

  <text x="72" y="196" font-family="Space Grotesk, Inter, Arial, sans-serif" font-size="50" font-weight="700" fill="#0f172a" letter-spacing="-1.2">
    <tspan x="72" dy="0">Payment tracking</tspan>
    <tspan x="72" dy="58">software for invoicing</tspan>
    <tspan x="72" dy="58" fill="#0f766e">and recurring billing</tspan>
  </text>
  <text x="72" y="398" font-family="Inter, Arial, sans-serif" font-size="22" fill="#475569">
    <tspan x="72" dy="0">Record the payment, update the balance,</tspan>
    <tspan x="72" dy="35">and create a customer receipt.</tspan>
  </text>
  <g transform="translate(72,500)">
    <rect width="260" height="60" rx="16" fill="#0f766e"/>
    <text x="130" y="38" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="700" fill="#ffffff">Record your first payment</text>
  </g>

  <g transform="translate(704,74)" filter="url(#payment-shadow)">
    <rect width="350" height="432" rx="26" fill="#ffffff"/>
    <rect width="350" height="54" rx="26" fill="#0f172a"/>
    <rect y="28" width="350" height="26" fill="#0f172a"/>
    <circle cx="27" cy="27" r="5" fill="#fb7185"/>
    <circle cx="45" cy="27" r="5" fill="#fbbf24"/>
    <circle cx="63" cy="27" r="5" fill="#34d399"/>
    <text x="175" y="33" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="700" fill="#cbd5e1">Record payment</text>
    <text x="28" y="96" font-family="Inter, Arial, sans-serif" font-size="10" font-weight="700" fill="#94a3b8">INVOICE</text>
    <text x="28" y="119" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="800" fill="#0f172a">INV-0054</text>
    <rect x="238" y="88" width="84" height="30" rx="15" fill="#fff7d6"/>
    <text x="280" y="108" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="10" font-weight="700" fill="#a16207">$2,500 due</text>
    <rect x="28" y="148" width="294" height="58" rx="12" fill="#f8fafc"/>
    <text x="44" y="171" font-family="Inter, Arial, sans-serif" font-size="9" font-weight="700" fill="#94a3b8">AMOUNT RECEIVED</text>
    <text x="44" y="194" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="800" fill="#0f766e">$1,250.00</text>
    <rect x="28" y="220" width="140" height="58" rx="12" fill="#f8fafc"/>
    <text x="44" y="243" font-family="Inter, Arial, sans-serif" font-size="9" font-weight="700" fill="#94a3b8">METHOD</text>
    <text x="44" y="266" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="700" fill="#334155">Bank Transfer</text>
    <rect x="182" y="220" width="140" height="58" rx="12" fill="#f8fafc"/>
    <text x="198" y="243" font-family="Inter, Arial, sans-serif" font-size="9" font-weight="700" fill="#94a3b8">DATE</text>
    <text x="198" y="266" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="700" fill="#334155">Sep 28, 2026</text>
    <rect x="28" y="294" width="294" height="70" rx="14" fill="#edf9f5"/>
    <text x="44" y="322" font-family="Inter, Arial, sans-serif" font-size="10" fill="#475569">Remaining balance</text>
    <text x="306" y="347" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="800" fill="#0f766e">$1,250.00</text>
    <rect x="28" y="382" width="294" height="34" rx="12" fill="#0f766e"/>
    <text x="175" y="404" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="700" fill="#ffffff">Payment recorded</text>
  </g>

  <g transform="translate(1016,430)">
    <circle cx="0" cy="0" r="42" fill="#10b981"/>
    <path d="M-18 1l12 12 25-27" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M-5 58v40" stroke="#0f766e" stroke-width="7" stroke-linecap="round"/>
    <path d="M-5 98l-14-16M-5 98l14-16" stroke="#0f766e" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="28" y="68" width="120" height="88" rx="16" fill="#ffffff" stroke="#cbd5e1"/>
    <text x="88" y="99" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="10" font-weight="700" fill="#64748b">RECEIPT</text>
    <text x="88" y="124" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="800" fill="#0f172a">RCPT-0021</text>
    <text x="88" y="145" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="10" font-weight="700" fill="#0f766e">$1,250</text>
  </g>
</svg>`;
}

async function makePaymentTrackingSoftwareOg(outPath) {
  await sharp(Buffer.from(paymentTrackingSoftwareOgSvg(), "utf8")).png({ compressionLevel: 9 }).toFile(outPath);
}

function aiReceiptScannerOgSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="scanner-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f1fbf8"/>
      <stop offset="1" stop-color="#d8f2eb"/>
    </linearGradient>
    <filter id="scanner-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#0f172a" flood-opacity="0.16"/>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#scanner-bg)"/>
  <circle cx="1125" cy="80" r="190" fill="#99f6e4" opacity="0.38"/>
  <circle cx="1015" cy="600" r="155" fill="#c4b5fd" opacity="0.26"/>
  <g transform="translate(72,70)">
    <rect width="50" height="50" rx="16" fill="#0f766e"/>
    <path d="M14 29c8 9 16 9 23-8M22 34c7 4 13 1 17-9" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
    <text x="64" y="33" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="800" fill="#0f172a">Receipt Cycle</text>
  </g>
  <text x="72" y="206" font-family="Inter, Arial, sans-serif" font-size="45" font-weight="850" fill="#0f172a">
    <tspan x="72" dy="0">AI receipt scanner for</tspan>
    <tspan x="72" dy="56" fill="#0f766e">faster expense capture</tspan>
  </text>
  <text x="72" y="352" font-family="Inter, Arial, sans-serif" font-size="23" fill="#475569">
    <tspan x="72" dy="0">Capture a receipt, review the extracted details,</tspan>
    <tspan x="72" dy="34">and save the expense with its evidence.</tspan>
  </text>
  <g transform="translate(72,468)">
    <rect width="230" height="62" rx="16" fill="#0f766e"/>
    <text x="115" y="39" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="19" font-weight="750" fill="#fff">Scan your first receipt</text>
  </g>
  <g transform="translate(715,75)" filter="url(#scanner-shadow)">
    <rect width="405" height="480" rx="30" fill="#0f172a"/>
    <text x="28" y="38" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="700" fill="#ccfbf1">RECEIPT CAPTURE</text>
    <path d="M34 92V64h28M343 64h28v28M34 388v28h28M343 416h28v-28" fill="none" stroke="#5eead4" stroke-width="5" stroke-linecap="round"/>
    <g transform="translate(70,90) rotate(-2 102 148)">
      <rect width="204" height="296" rx="18" fill="#fff"/>
      <text x="102" y="38" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="800" fill="#0f172a">HARBOR MARKET</text>
      <text x="102" y="58" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="9" fill="#94a3b8">PURCHASE RECEIPT</text>
      <path d="M22 80h160M22 198h160" stroke="#cbd5e1" stroke-dasharray="4 5"/>
      <text x="22" y="110" font-family="Inter, Arial, sans-serif" font-size="11" fill="#334155">Studio paper</text>
      <text x="182" y="110" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="11" fill="#334155">$18.00</text>
      <text x="22" y="140" font-family="Inter, Arial, sans-serif" font-size="11" fill="#334155">Ink cartridges</text>
      <text x="182" y="140" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="11" fill="#334155">$42.00</text>
      <text x="22" y="170" font-family="Inter, Arial, sans-serif" font-size="11" fill="#334155">Desk cable</text>
      <text x="182" y="170" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="11" fill="#334155">$12.00</text>
      <text x="22" y="230" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="800" fill="#0f172a">TOTAL</text>
      <text x="182" y="230" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="800" fill="#0f766e">$78.12</text>
      <text x="102" y="270" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="9" fill="#94a3b8">SEP 30, 2026</text>
    </g>
    <g transform="translate(246,164)">
      <rect width="214" height="230" rx="22" fill="#fff"/>
      <text x="22" y="34" font-family="Inter, Arial, sans-serif" font-size="10" font-weight="800" fill="#0f766e">READY FOR REVIEW</text>
      <g font-family="Inter, Arial, sans-serif">
        <rect x="18" y="54" width="178" height="38" rx="10" fill="#f1f5f9"/>
        <text x="30" y="70" font-size="8" font-weight="700" fill="#94a3b8">MERCHANT</text><text x="30" y="84" font-size="10" font-weight="750" fill="#0f172a">Harbor Market</text>
        <rect x="18" y="102" width="178" height="38" rx="10" fill="#f1f5f9"/>
        <text x="30" y="118" font-size="8" font-weight="700" fill="#94a3b8">TOTAL</text><text x="30" y="132" font-size="10" font-weight="750" fill="#0f172a">$78.12</text>
        <rect x="18" y="150" width="178" height="38" rx="10" fill="#f1f5f9"/>
        <text x="30" y="166" font-size="8" font-weight="700" fill="#94a3b8">CATEGORY</text><text x="30" y="180" font-size="10" font-weight="750" fill="#0f172a">Office supplies</text>
      </g>
      <circle cx="178" cy="26" r="14" fill="#d1fae5"/><path d="M172 26l4 4 8-9" fill="none" stroke="#047857" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
</svg>`;
}

async function makeAiReceiptScannerOg(outPath) {
  await sharp(Buffer.from(aiReceiptScannerOgSvg(), "utf8")).png({ compressionLevel: 9 }).toFile(outPath);
}

function businessTravelExpenseTrackerOgSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="travel-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f2fbf8"/>
      <stop offset="1" stop-color="#d9f3ed"/>
    </linearGradient>
    <filter id="travel-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#0f172a" flood-opacity="0.16"/>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#travel-bg)"/>
  <circle cx="1115" cy="60" r="190" fill="#99f6e4" opacity="0.38"/>
  <circle cx="1020" cy="620" r="165" fill="#c4b5fd" opacity="0.24"/>
  <g transform="translate(72,70)">
    <rect width="50" height="50" rx="16" fill="#0f766e"/>
    <path d="M14 29c8 9 16 9 23-8M22 34c7 4 13 1 17-9" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
    <text x="64" y="33" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="800" fill="#0f172a">Receipt Cycle</text>
  </g>
  <text x="72" y="196" font-family="Inter, Arial, sans-serif" font-size="44" font-weight="850" fill="#0f172a">
    <tspan x="72" dy="0">Business travel</tspan>
    <tspan x="72" dy="54">expense tracker</tspan>
    <tspan x="72" dy="54" fill="#0f766e">for the whole trip</tspan>
  </text>
  <text x="72" y="393" font-family="Inter, Arial, sans-serif" font-size="21" fill="#475569">
    <tspan x="72" dy="0">Capture travel receipts and return to an</tspan>
    <tspan x="72" dy="32">organized record of every purchase.</tspan>
  </text>
  <g transform="translate(72,500)">
    <rect width="282" height="62" rx="16" fill="#0f766e"/>
    <text x="141" y="39" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="750" fill="#fff">Track your first travel expense</text>
  </g>
  <g transform="translate(690,70)" filter="url(#travel-shadow)">
    <rect width="430" height="490" rx="30" fill="#ffffff"/>
    <rect width="430" height="58" rx="30" fill="#0f172a"/>
    <rect y="30" width="430" height="28" fill="#0f172a"/>
    <circle cx="28" cy="29" r="5" fill="#fb7185"/><circle cx="47" cy="29" r="5" fill="#fbbf24"/><circle cx="66" cy="29" r="5" fill="#34d399"/>
    <text x="215" y="35" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="700" fill="#ccfbf1">TRAVEL EXPENSE RECORDS</text>
    <rect x="0" y="58" width="132" height="432" fill="#042f2e"/>
    <text x="20" y="93" font-family="Inter, Arial, sans-serif" font-size="9" font-weight="700" fill="#5eead4">TRAVEL DATES</text>
    <text x="20" y="118" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="800" fill="#fff">SEP 18 TO 21</text>
    <path d="M35 153v160" stroke="#2dd4bf" stroke-width="2" stroke-opacity=".45"/>
    <g font-family="Inter, Arial, sans-serif" font-size="9" font-weight="700" fill="#ccfbf1">
      <circle cx="35" cy="163" r="11" fill="#0f766e"/><text x="35" y="166" text-anchor="middle" fill="#fff">18</text><text x="57" y="166">DEPART</text>
      <circle cx="35" cy="211" r="11" fill="#0f766e"/><text x="35" y="214" text-anchor="middle" fill="#fff">19</text><text x="57" y="214">CLIENT</text>
      <circle cx="35" cy="259" r="11" fill="#0f766e"/><text x="35" y="262" text-anchor="middle" fill="#fff">20</text><text x="57" y="262">EVENT</text>
      <circle cx="35" cy="307" r="11" fill="#fff"/><text x="35" y="310" text-anchor="middle" fill="#0f766e">21</text><text x="57" y="310">RETURN</text>
    </g>
    <rect x="18" y="344" width="96" height="100" rx="16" fill="#ffffff" fill-opacity=".1"/>
    <text x="32" y="372" font-family="Inter, Arial, sans-serif" font-size="8" font-weight="700" fill="#5eead4">TRIP SPENDING</text>
    <text x="32" y="405" font-family="Inter, Arial, sans-serif" font-size="21" font-weight="850" fill="#fff">$775.20</text>
    <text x="32" y="427" font-family="Inter, Arial, sans-serif" font-size="8" fill="#99f6e4">4 EXPENSES</text>
    <g transform="translate(154,84)" font-family="Inter, Arial, sans-serif">
      <text x="0" y="12" font-size="9" font-weight="750" fill="#0f766e">BUSINESS TRAVEL</text>
      <text x="0" y="38" font-size="17" font-weight="850" fill="#0f172a">Trip expense review</text>
      <g transform="translate(0,62)">
        <rect width="250" height="70" rx="13" fill="#f8fafc"/><circle cx="27" cy="35" r="16" fill="#ccfbf1"/><text x="27" y="39" text-anchor="middle" font-size="13" fill="#0f766e">✈</text><text x="54" y="25" font-size="9" font-weight="800" fill="#0f172a">Northline Air</text><text x="54" y="44" font-size="8" fill="#64748b">SEP 18 · AIRFARE</text><text x="232" y="37" text-anchor="end" font-size="10" font-weight="800" fill="#0f172a">$486.00</text>
        <rect y="82" width="250" height="70" rx="13" fill="#f8fafc"/><circle cx="27" cy="117" r="16" fill="#ede9fe"/><text x="27" y="121" text-anchor="middle" font-size="13" fill="#6d28d9">▰</text><text x="54" y="107" font-size="9" font-weight="800" fill="#0f172a">Harbor Hotel</text><text x="54" y="126" font-size="8" fill="#64748b">SEP 19 · LODGING</text><text x="232" y="119" text-anchor="end" font-size="10" font-weight="800" fill="#0f172a">$214.00</text>
        <rect y="164" width="250" height="70" rx="13" fill="#f8fafc"/><circle cx="27" cy="199" r="16" fill="#fef3c7"/><text x="27" y="203" text-anchor="middle" font-size="13" fill="#a16207">●</text><text x="54" y="189" font-size="9" font-weight="800" fill="#0f172a">Market Table</text><text x="54" y="208" font-size="8" fill="#64748b">SEP 19 · MEALS</text><text x="232" y="201" text-anchor="end" font-size="10" font-weight="800" fill="#0f172a">$46.80</text>
      </g>
      <rect y="322" width="250" height="58" rx="14" fill="#ecfdf5"/>
      <text x="17" y="346" font-size="8" font-weight="700" fill="#047857">RECEIPT EVIDENCE</text><text x="17" y="365" font-size="10" font-weight="800" fill="#0f172a">4 RECORDS READY</text><circle cx="222" cy="351" r="15" fill="#a7f3d0"/><path d="M215 351l5 5 9-11" fill="none" stroke="#047857" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
</svg>`;
}

async function makeBusinessTravelExpenseTrackerOg(outPath) {
  await sharp(Buffer.from(businessTravelExpenseTrackerOgSvg(), "utf8")).png({ compressionLevel: 9 }).toFile(outPath);
}

function freelancerTaxReceiptTrackerOgSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="tax-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fbf8ef"/>
      <stop offset="1" stop-color="#dff5ef"/>
    </linearGradient>
    <filter id="tax-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#0f172a" flood-opacity="0.16"/>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#tax-bg)"/>
  <circle cx="1095" cy="62" r="180" fill="#99f6e4" opacity="0.34"/>
  <circle cx="1020" cy="625" r="170" fill="#c4b5fd" opacity="0.25"/>
  <g transform="translate(72,70)">
    <rect width="50" height="50" rx="16" fill="#0f766e"/>
    <path d="M14 29c8 9 16 9 23-8M22 34c7 4 13 1 17-9" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
    <text x="64" y="33" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="800" fill="#0f172a">Receipt Cycle</text>
  </g>
  <text x="72" y="202" font-family="Inter, Arial, sans-serif" font-size="44" font-weight="850" fill="#0f172a">
    <tspan x="72" dy="0">Freelancer tax tracker</tspan>
    <tspan x="72" dy="54" fill="#0f766e">for receipts and records</tspan>
  </text>
  <text x="72" y="348" font-family="Inter, Arial, sans-serif" font-size="21" fill="#475569">
    <tspan x="72" dy="0">Capture business purchases and prepare an</tspan>
    <tspan x="72" dy="32">organized expense history for review.</tspan>
  </text>
  <g transform="translate(72,472)">
    <rect width="276" height="62" rx="16" fill="#0f766e"/>
    <text x="138" y="39" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="750" fill="#fff">Organize your first receipt</text>
  </g>
  <g transform="translate(680,68)" filter="url(#tax-shadow)" font-family="Inter, Arial, sans-serif">
    <rect width="440" height="494" rx="30" fill="#fff"/>
    <rect width="440" height="62" rx="30" fill="#0f172a"/>
    <rect y="31" width="440" height="31" fill="#0f172a"/>
    <circle cx="28" cy="30" r="5" fill="#fb7185"/><circle cx="47" cy="30" r="5" fill="#fbbf24"/><circle cx="66" cy="30" r="5" fill="#34d399"/>
    <text x="220" y="37" text-anchor="middle" font-size="11" font-weight="750" fill="#ccfbf1">FREELANCER EXPENSE RECORDS</text>
    <g transform="translate(24,86)">
      <text x="0" y="12" font-size="9" font-weight="800" fill="#0f766e">YEAR TO DATE</text>
      <text x="0" y="45" font-size="27" font-weight="850" fill="#0f172a">$8,462.40</text>
      <text x="155" y="43" font-size="9" font-weight="700" fill="#64748b">JAN TO SEP</text>
      <g transform="translate(0,72)">
        <rect width="176" height="116" rx="18" fill="#eef8f5"/>
        <g fill="#0f766e">${[32,48,38,66,54,79,60,72,90].map((h, i) => `<rect x="${14 + i * 17}" y="${100 - h}" width="10" height="${h}" rx="4"/>`).join("")}</g>
      </g>
      <g transform="translate(194,72)">
        <rect width="198" height="116" rx="18" fill="#f1ecff"/>
        <text x="16" y="25" font-size="8" font-weight="800" fill="#6d28d9">CATEGORIES</text>
        <rect x="16" y="40" width="138" height="8" rx="4" fill="#7c3aed"/><rect x="16" y="58" width="104" height="8" rx="4" fill="#14b8a6"/><rect x="16" y="76" width="78" height="8" rx="4" fill="#f59e0b"/>
        <text x="172" y="47" text-anchor="end" font-size="8" font-weight="700" fill="#475569">SOFTWARE</text><text x="172" y="65" text-anchor="end" font-size="8" font-weight="700" fill="#475569">WORKSPACE</text><text x="172" y="83" text-anchor="end" font-size="8" font-weight="700" fill="#475569">SUPPLIES</text>
      </g>
      <g transform="translate(0,210)">
        ${[["SEP 12","Studio Supply","SUPPLIES","$84.20"],["SEP 03","Cloud Desk","SOFTWARE","$29.00"],["AUG 26","City Print","MARKETING","$146.50"]].map((r,i)=>`<g transform="translate(0,${i*65})"><rect width="392" height="54" rx="13" fill="#f8fafc"/><circle cx="27" cy="27" r="15" fill="${i===1?'#ede9fe':'#ccfbf1'}"/><path d="M21 27l4 4 8-9" fill="none" stroke="#0f766e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><text x="52" y="20" font-size="9" font-weight="800" fill="#0f172a">${r[1]}</text><text x="52" y="37" font-size="7" font-weight="700" fill="#64748b">${r[0]} · ${r[2]} · RECEIPT SAVED</text><text x="372" y="31" text-anchor="end" font-size="10" font-weight="800" fill="#0f172a">${r[3]}</text></g>`).join("")}
      </g>
    </g>
  </g>
</svg>`;
}

async function makeFreelancerTaxReceiptTrackerOg(outPath) {
  await sharp(Buffer.from(freelancerTaxReceiptTrackerOgSvg(), "utf8")).png({ compressionLevel: 9 }).toFile(outPath);
}

function businessBudgetingSoftwareOgSvg() {
  const categories = [
    ["SOFTWARE", "$820 / $1,100", 75, "#7c3aed", "#ede9fe"],
    ["TRANSPORT", "$960 / $1,200", 80, "#0284c7", "#e0f2fe"],
    ["SUPPLIES", "$1,540 / $1,700", 91, "#d97706", "#fef3c7"],
    ["MARKETING", "$1,210 / $1,500", 81, "#e11d48", "#ffe4e6"],
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="budget-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbf8ef"/><stop offset="1" stop-color="#dff5ef"/></linearGradient>
    <filter id="budget-shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#0f172a" flood-opacity="0.16"/></filter>
  </defs>
  <rect width="1200" height="630" fill="url(#budget-bg)"/>
  <circle cx="1100" cy="40" r="190" fill="#99f6e4" opacity="0.35"/><circle cx="1030" cy="620" r="175" fill="#fde68a" opacity="0.3"/>
  <g transform="translate(72,70)"><rect width="50" height="50" rx="16" fill="#0f766e"/><path d="M14 29c8 9 16 9 23-8M22 34c7 4 13 1 17-9" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><text x="64" y="33" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="800" fill="#0f172a">Receipt Cycle</text></g>
  <text x="72" y="186" font-family="Inter,Arial,sans-serif" font-size="39" font-weight="850" fill="#0f172a"><tspan x="72">Business budgeting</tspan><tspan x="72" dy="48" fill="#0f766e">software that keeps</tspan><tspan x="72" dy="48" fill="#0f766e">spending in view</tspan></text>
  <text x="72" y="370" font-family="Inter,Arial,sans-serif" font-size="20" fill="#475569"><tspan x="72">Set monthly category limits and compare them</tspan><tspan x="72" dy="31">with the expenses already recorded.</tspan></text>
  <g transform="translate(72,472)"><rect width="220" height="62" rx="16" fill="#0f766e"/><text x="110" y="39" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="18" font-weight="750" fill="#fff">Set your first budget</text></g>
  <g transform="translate(665,68)" filter="url(#budget-shadow)" font-family="Inter,Arial,sans-serif"><rect width="455" height="494" rx="30" fill="#f8faf9"/><rect width="455" height="64" rx="30" fill="#0f172a"/><rect y="32" width="455" height="32" fill="#0f172a"/><circle cx="28" cy="31" r="5" fill="#fb7185"/><circle cx="47" cy="31" r="5" fill="#fbbf24"/><circle cx="66" cy="31" r="5" fill="#34d399"/><text x="227" y="38" text-anchor="middle" font-size="11" font-weight="750" fill="#ccfbf1">OCTOBER BUDGETS</text>
    <g transform="translate(24,86)">${[["TOTAL BUDGET","$8,400"],["AMOUNT SPENT","$5,260"],["REMAINING","$3,140"]].map((item,i)=>`<g transform="translate(${i*137},0)"><rect width="126" height="76" rx="15" fill="#fff"/><text x="13" y="23" font-size="7" font-weight="800" fill="#94a3b8">${item[0]}</text><text x="13" y="52" font-size="18" font-weight="850" fill="${i===1?'#be123c':i===2?'#0f766e':'#0f172a'}">${item[1]}</text></g>`).join("")}</g>
    <g transform="translate(24,182)"><rect width="407" height="284" rx="22" fill="#fff"/><text x="18" y="28" font-size="8" font-weight="800" fill="#64748b">CATEGORY BUDGETS</text>${categories.map((row,i)=>`<g transform="translate(18,${46+i*55})"><rect width="371" height="45" rx="12" fill="#f8fafc"/><circle cx="23" cy="22.5" r="14" fill="${row[4]}"/><circle cx="23" cy="22.5" r="5" fill="${row[3]}"/><text x="47" y="18" font-size="8" font-weight="800" fill="#0f172a">${row[0]}</text><text x="340" y="18" text-anchor="end" font-size="8" font-weight="800" fill="#0f172a">${row[1]}</text><rect x="47" y="27" width="250" height="6" rx="3" fill="#e2e8f0"/><rect x="47" y="27" width="${2.5*row[2]}" height="6" rx="3" fill="${row[3]}"/></g>`).join("")}</g>
  </g>
</svg>`;
}

async function makeBusinessBudgetingSoftwareOg(outPath) {
  await sharp(Buffer.from(businessBudgetingSoftwareOgSvg(), "utf8")).png({ compressionLevel: 9 }).toFile(outPath);
}

function clientManagementSoftwareOgSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="client-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbf8ef"/><stop offset="1" stop-color="#dff5ef"/></linearGradient><filter id="client-shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#0f172a" flood-opacity="0.16"/></filter></defs>
  <rect width="1200" height="630" fill="url(#client-bg)"/><circle cx="1100" cy="42" r="190" fill="#99f6e4" opacity="0.35"/><circle cx="1035" cy="620" r="175" fill="#c4b5fd" opacity="0.24"/>
  <g transform="translate(72,70)"><rect width="50" height="50" rx="16" fill="#0f766e"/><path d="M14 29c8 9 16 9 23-8M22 34c7 4 13 1 17-9" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><text x="64" y="33" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="800" fill="#0f172a">Receipt Cycle</text></g>
  <text x="72" y="192" font-family="Inter,Arial,sans-serif" font-size="40" font-weight="850" fill="#0f172a"><tspan x="72">Client management</tspan><tspan x="72" dy="50" fill="#0f766e">for small business billing</tspan></text>
  <text x="72" y="333" font-family="Inter,Arial,sans-serif" font-size="20" fill="#475569"><tspan x="72">Keep customer details, documents, balances,</tspan><tspan x="72" dy="31">and reusable services connected.</tspan></text>
  <g transform="translate(72,460)"><rect width="242" height="62" rx="16" fill="#0f766e"/><text x="121" y="39" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="18" font-weight="750" fill="#fff">Add your first customer</text></g>
  <g transform="translate(665,72)" filter="url(#client-shadow)" font-family="Inter,Arial,sans-serif"><rect width="455" height="486" rx="30" fill="#f8faf9"/><rect width="455" height="67" rx="30" fill="#0f172a"/><rect y="34" width="455" height="33" fill="#0f172a"/><circle cx="28" cy="32" r="5" fill="#fb7185"/><circle cx="47" cy="32" r="5" fill="#fbbf24"/><circle cx="66" cy="32" r="5" fill="#34d399"/><text x="227" y="39" text-anchor="middle" font-size="11" font-weight="750" fill="#ccfbf1">CUSTOMER DIRECTORY</text>
  <g transform="translate(24,91)"><rect width="407" height="52" rx="14" fill="#fff"/><circle cx="25" cy="26" r="8" fill="none" stroke="#94a3b8" stroke-width="3"/><path d="M31 32l7 7" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/><text x="53" y="31" font-size="10" fill="#94a3b8">Search customers</text></g>
  <g transform="translate(24,164)">
    <g><rect width="407" height="64" rx="16" fill="#fff"/><circle cx="34" cy="32" r="19" fill="#ccfbf1"/><text x="34" y="36" text-anchor="middle" font-size="9" font-weight="850" fill="#0f766e">MC</text><text x="65" y="25" font-size="9" font-weight="850" fill="#0f172a">MARLOW CREATIVE</text><text x="65" y="43" font-size="8" font-weight="700" fill="#64748b">5 INVOICES</text><text x="382" y="36" text-anchor="end" font-size="12" font-weight="850" fill="#0f172a">$1,240</text></g>
    <g transform="translate(0,76)"><rect width="407" height="64" rx="16" fill="#fff"/><circle cx="34" cy="32" r="19" fill="#e0f2fe"/><text x="34" y="36" text-anchor="middle" font-size="9" font-weight="850" fill="#0284c7">NR</text><text x="65" y="25" font-size="9" font-weight="850" fill="#0f172a">NORTHLINE REPAIR</text><text x="65" y="43" font-size="8" font-weight="700" fill="#64748b">3 INVOICES</text><text x="382" y="36" text-anchor="end" font-size="12" font-weight="850" fill="#0f172a">$0</text></g>
    <g transform="translate(0,152)"><rect width="407" height="64" rx="16" fill="#fff"/><circle cx="34" cy="32" r="19" fill="#ede9fe"/><text x="34" y="36" text-anchor="middle" font-size="9" font-weight="850" fill="#7c3aed">OS</text><text x="65" y="25" font-size="9" font-weight="850" fill="#0f172a">ORCHARD STUDIO</text><text x="65" y="43" font-size="8" font-weight="700" fill="#64748b">2 INVOICES</text><text x="382" y="36" text-anchor="end" font-size="12" font-weight="850" fill="#0f172a">$680</text></g>
  </g>
  <g transform="translate(24,402)"><rect width="194" height="54" rx="15" fill="#ccfbf1"/><text x="16" y="21" font-size="7" font-weight="800" fill="#0f766e">REUSABLE SERVICES</text><text x="16" y="39" font-size="11" font-weight="850" fill="#0f172a">3 ACTIVE ITEMS</text><rect x="230" width="177" height="54" rx="15" fill="#ede9fe"/><text x="246" y="21" font-size="7" font-weight="800" fill="#7c3aed">CUSTOMER STATUS</text><text x="246" y="39" font-size="11" font-weight="850" fill="#0f172a">ACTIVE</text></g></g>
</svg>`;
}

async function makeClientManagementSoftwareOg(outPath) {
  await sharp(Buffer.from(clientManagementSoftwareOgSvg(), "utf8")).png({ compressionLevel: 9 }).toFile(outPath);
}

function expenseReportingSoftwareOgSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="report-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbf8ef"/><stop offset="1" stop-color="#dff5ef"/></linearGradient><filter id="report-shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#0f172a" flood-opacity="0.16"/></filter></defs>
  <rect width="1200" height="630" fill="url(#report-bg)"/><circle cx="1100" cy="42" r="190" fill="#99f6e4" opacity="0.35"/><circle cx="1035" cy="620" r="175" fill="#c4b5fd" opacity="0.24"/>
  <g transform="translate(72,70)"><rect width="50" height="50" rx="16" fill="#0f766e"/><path d="M14 29c8 9 16 9 23-8M22 34c7 4 13 1 17-9" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><text x="64" y="33" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="800" fill="#0f172a">Receipt Cycle</text></g>
  <text x="72" y="176" font-family="Inter,Arial,sans-serif" font-size="36" font-weight="850" fill="#0f172a"><tspan x="72">Expense report software</tspan><tspan x="72" dy="44" fill="#0f766e">for a complete</tspan><tspan x="72" dy="44" fill="#0f766e">business view</tspan></text>
  <text x="72" y="348" font-family="Inter,Arial,sans-serif" font-size="20" fill="#475569"><tspan x="72">Review income, expenses, cash movement,</tspan><tspan x="72" dy="31">payments, and overdue invoices.</tspan></text>
  <g transform="translate(72,460)"><rect width="274" height="62" rx="16" fill="#0f766e"/><text x="137" y="39" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="17" font-weight="750" fill="#fff">Create a reporting workspace</text></g>
  <g transform="translate(665,72)" filter="url(#report-shadow)" font-family="Inter,Arial,sans-serif"><rect width="455" height="486" rx="30" fill="#f8faf9"/><rect width="455" height="67" rx="30" fill="#0f172a"/><rect y="34" width="455" height="33" fill="#0f172a"/><circle cx="28" cy="32" r="5" fill="#fb7185"/><circle cx="47" cy="32" r="5" fill="#fbbf24"/><circle cx="66" cy="32" r="5" fill="#34d399"/><text x="227" y="39" text-anchor="middle" font-size="11" font-weight="750" fill="#ccfbf1">OCTOBER BUSINESS REPORT</text>
  <g transform="translate(24,88)"><g><rect width="94" height="72" rx="14" fill="#fff"/><text x="12" y="22" font-size="7" font-weight="800" fill="#94a3b8">INCOME</text><text x="12" y="49" font-size="16" font-weight="850" fill="#0f766e">$12,840</text></g><g transform="translate(104,0)"><rect width="94" height="72" rx="14" fill="#fff"/><text x="12" y="22" font-size="7" font-weight="800" fill="#94a3b8">EXPENSES</text><text x="12" y="49" font-size="16" font-weight="850" fill="#be123c">$7,460</text></g><g transform="translate(208,0)"><rect width="94" height="72" rx="14" fill="#fff"/><text x="12" y="22" font-size="7" font-weight="800" fill="#94a3b8">NET</text><text x="12" y="49" font-size="16" font-weight="850" fill="#0f172a">$5,380</text></g><g transform="translate(312,0)"><rect width="95" height="72" rx="14" fill="#fff"/><text x="12" y="22" font-size="7" font-weight="800" fill="#94a3b8">OUTSTANDING</text><text x="12" y="49" font-size="16" font-weight="850" fill="#7c3aed">$2,140</text></g></g>
  <g transform="translate(24,181)"><rect width="407" height="204" rx="22" fill="#fff"/><text x="18" y="28" font-size="8" font-weight="800" fill="#64748b">INCOME VS EXPENSES</text><line x1="18" y1="164" x2="389" y2="164" stroke="#e2e8f0"/><g transform="translate(35,44)"><rect x="0" y="66" width="16" height="54" rx="4" fill="#0d9488"/><rect x="20" y="86" width="16" height="34" rx="4" fill="#fb7185"/><rect x="61" y="48" width="16" height="72" rx="4" fill="#0d9488"/><rect x="81" y="75" width="16" height="45" rx="4" fill="#fb7185"/><rect x="122" y="58" width="16" height="62" rx="4" fill="#0d9488"/><rect x="142" y="69" width="16" height="51" rx="4" fill="#fb7185"/><rect x="183" y="30" width="16" height="90" rx="4" fill="#0d9488"/><rect x="203" y="62" width="16" height="58" rx="4" fill="#fb7185"/><rect x="244" y="39" width="16" height="81" rx="4" fill="#0d9488"/><rect x="264" y="72" width="16" height="48" rx="4" fill="#fb7185"/><rect x="305" y="18" width="16" height="102" rx="4" fill="#0d9488"/><rect x="325" y="59" width="16" height="61" rx="4" fill="#fb7185"/></g></g>
  <g transform="translate(24,405)"><rect width="194" height="54" rx="15" fill="#ccfbf1"/><text x="16" y="21" font-size="7" font-weight="800" fill="#0f766e">CATEGORY VIEW</text><text x="16" y="39" font-size="11" font-weight="850" fill="#0f172a">4 SPENDING GROUPS</text><rect x="230" width="177" height="54" rx="15" fill="#ffe4e6"/><text x="246" y="21" font-size="7" font-weight="800" fill="#be123c">INVOICE AGING</text><text x="246" y="39" font-size="11" font-weight="850" fill="#0f172a">3 OVERDUE</text></g></g>
</svg>`;
}

async function makeExpenseReportingSoftwareOg(outPath) {
  await sharp(Buffer.from(expenseReportingSoftwareOgSvg(), "utf8")).png({ compressionLevel: 9 }).toFile(outPath);
}

function aiFinancialAssistantOgSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="ai-fin-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbf8ef"/><stop offset="1" stop-color="#dff5ef"/></linearGradient><filter id="ai-fin-shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#0f172a" flood-opacity="0.16"/></filter></defs>
  <rect width="1200" height="630" fill="url(#ai-fin-bg)"/><circle cx="1100" cy="42" r="190" fill="#c4b5fd" opacity="0.3"/><circle cx="1035" cy="620" r="175" fill="#99f6e4" opacity="0.3"/>
  <g transform="translate(72,70)"><rect width="50" height="50" rx="16" fill="#0f766e"/><path d="M14 29c8 9 16 9 23-8M22 34c7 4 13 1 17-9" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><text x="64" y="33" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="800" fill="#0f172a">Receipt Cycle</text></g>
  <text x="72" y="184" font-family="Inter,Arial,sans-serif" font-size="39" font-weight="850" fill="#0f172a"><tspan x="72">AI financial assistant</tspan><tspan x="72" dy="48" fill="#0f766e">grounded in your</tspan><tspan x="72" dy="48" fill="#0f766e">business records</tspan></text>
  <text x="72" y="370" font-family="Inter,Arial,sans-serif" font-size="20" fill="#475569"><tspan x="72">Ask about spending, categories, merchants,</tspan><tspan x="72" dy="31">income, expenses, and recent activity.</tspan></text>
  <g transform="translate(72,472)"><rect width="284" height="62" rx="16" fill="#0f766e"/><text x="142" y="39" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="17" font-weight="750" fill="#fff">Ask your first question</text></g>
  <g transform="translate(665,72)" filter="url(#ai-fin-shadow)" font-family="Inter,Arial,sans-serif"><rect width="455" height="486" rx="30" fill="#f8faf9"/><rect width="455" height="67" rx="30" fill="#0f172a"/><rect y="34" width="455" height="33" fill="#0f172a"/><circle cx="28" cy="32" r="5" fill="#fb7185"/><circle cx="47" cy="32" r="5" fill="#fbbf24"/><circle cx="66" cy="32" r="5" fill="#34d399"/><text x="227" y="39" text-anchor="middle" font-size="11" font-weight="750" fill="#ddd6fe">ASK AI · OCTOBER ACTIVITY</text>
  <g transform="translate(24,88)"><g><rect width="126" height="70" rx="14" fill="#fff"/><text x="12" y="22" font-size="7" font-weight="800" fill="#94a3b8">INCOME</text><text x="12" y="48" font-size="16" font-weight="850" fill="#0f766e">$12,840</text></g><g transform="translate(140,0)"><rect width="126" height="70" rx="14" fill="#fff"/><text x="12" y="22" font-size="7" font-weight="800" fill="#94a3b8">EXPENSES</text><text x="12" y="48" font-size="16" font-weight="850" fill="#be123c">$7,460</text></g><g transform="translate(280,0)"><rect width="127" height="70" rx="14" fill="#fff"/><text x="12" y="22" font-size="7" font-weight="800" fill="#94a3b8">NET</text><text x="12" y="48" font-size="16" font-weight="850" fill="#7c3aed">$5,380</text></g></g>
  <g transform="translate(58,181)"><rect width="349" height="55" rx="18" fill="#e2e8f0"/><text x="20" y="34" font-size="11" font-weight="750" fill="#334155">Which categories account for most spending?</text></g>
  <g transform="translate(24,255)"><rect width="383" height="182" rx="22" fill="#ecfdf5"/><text x="18" y="29" font-size="8" font-weight="800" fill="#0f766e">BASED ON SAVED RECORDS</text>
    <g transform="translate(18,50)"><text x="0" y="11" font-size="8" font-weight="800" fill="#0f172a">SOFTWARE</text><text x="347" y="11" text-anchor="end" font-size="8" font-weight="800" fill="#0f172a">41%</text><rect y="20" width="347" height="10" rx="5" fill="#fff"/><rect y="20" width="284" height="10" rx="5" fill="#7c3aed"/></g>
    <g transform="translate(18,94)"><text x="0" y="11" font-size="8" font-weight="800" fill="#0f172a">TRAVEL</text><text x="347" y="11" text-anchor="end" font-size="8" font-weight="800" fill="#0f172a">27%</text><rect y="20" width="347" height="10" rx="5" fill="#fff"/><rect y="20" width="187" height="10" rx="5" fill="#0d9488"/></g>
    <g transform="translate(18,138)"><text x="0" y="11" font-size="8" font-weight="800" fill="#0f172a">SUPPLIES</text><text x="347" y="11" text-anchor="end" font-size="8" font-weight="800" fill="#0f172a">18%</text><rect y="20" width="347" height="10" rx="5" fill="#fff"/><rect y="20" width="125" height="10" rx="5" fill="#f59e0b"/></g>
  </g>
  <g transform="translate(24,451)"><circle cx="14" cy="14" r="14" fill="#ccfbf1"/><path d="M9 14l4 4 7-9" fill="none" stroke="#0f766e" stroke-width="2.5" stroke-linecap="round"/><text x="38" y="18" font-size="9" font-weight="750" fill="#475569">Verify the source records behind the answer</text></g></g>
</svg>`;
}

async function makeAiFinancialAssistantOg(outPath) {
  await sharp(Buffer.from(aiFinancialAssistantOgSvg(), "utf8")).png({ compressionLevel: 9 }).toFile(outPath);
}

async function main() {
  await ensureDir(OUT_DIR);
  await ensureDir(LANDING_DIR);

  await Promise.all([
    makeSquare(16, path.join(OUT_DIR, "favicon-16.png")),
    makeSquare(32, path.join(OUT_DIR, "favicon-32.png")),
    makeSquare(180, path.join(OUT_DIR, "apple-touch-icon.png")),
    makeSquare(192, path.join(OUT_DIR, "icon-192.png")),
    makeSquare(512, path.join(OUT_DIR, "icon-512.png")),
  ]);

  await makeFaviconIco(path.join(OUT_DIR, "favicon.ico"));
  await makeOgImage(path.join(OUT_DIR, "og-image.png"));
  await makeInvoiceSoftwareOg(path.join(LANDING_DIR, "invoice-software-og.png"));
  await makeEstimateQuotationSoftwareOg(path.join(LANDING_DIR, "estimate-quotation-software-og.png"));
  await makePaymentTrackingSoftwareOg(path.join(LANDING_DIR, "payment-tracking-software-og.png"));
  await makeAiReceiptScannerOg(path.join(LANDING_DIR, "ai-receipt-scanner-og.png"));
  await makeBusinessTravelExpenseTrackerOg(path.join(LANDING_DIR, "business-travel-expense-tracker-og.png"));
  await makeFreelancerTaxReceiptTrackerOg(path.join(LANDING_DIR, "freelancer-tax-receipt-tracker-og.png"));
  await makeBusinessBudgetingSoftwareOg(path.join(LANDING_DIR, "business-budgeting-software-og.png"));
  await makeClientManagementSoftwareOg(path.join(LANDING_DIR, "client-management-software-og.png"));
  await makeExpenseReportingSoftwareOg(path.join(LANDING_DIR, "expense-reporting-software-og.png"));
  await makeAiFinancialAssistantOg(path.join(LANDING_DIR, "ai-financial-assistant-og.png"));

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

  console.log("SEO assets generated in /public:",
    "favicon.ico, favicon-16.png, favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png, og-image.png, landing/invoice-software-og.png, landing/estimate-quotation-software-og.png, landing/payment-tracking-software-og.png, landing/ai-receipt-scanner-og.png, landing/business-travel-expense-tracker-og.png, landing/freelancer-tax-receipt-tracker-og.png, landing/business-budgeting-software-og.png, landing/client-management-software-og.png, landing/expense-reporting-software-og.png, landing/ai-financial-assistant-og.png, site.webmanifest");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
