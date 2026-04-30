/**
 * 1200x630 blog / Open Graph covers generated from scratch.
 * No external PNG/SVG embedding: avoids transparent artifacts and empty boxes.
 *
 * Run: node scripts/generate-blog-feature-images.mjs
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "public/landing");

const W = 1200;
const H = 630;

const BG = "#020617";
const BG_SOFT = "#0f172a";
const TEAL = "#5eead4";
const TEAL_DARK = "#0f766e";
const ORANGE = "#fb923c";
const WHITE = "#f8fafc";
const MUTED = "#94a3b8";

const ART_X = 620;
const ART_Y = 88;
const ART_W = 508;
const ART_H = 454;

const COVERS = [
  {
    slug: "maximize-tax-refund-by-scanning-receipts",
    motif: "receipt",
    kicker: "TAX SEASON",
    line1: "Proof you can",
    line2: "actually claim.",
  },
  {
    slug: "best-receipt-scanner-app-small-business-2026",
    motif: "scanner",
    kicker: "2026 GUIDE",
    line1: "Pick a scanner",
    line2: "your team keeps.",
  },
  {
    slug: "freelancers-guide-tracking-business-expenses",
    motif: "voice",
    kicker: "FREELANCERS",
    line1: "Log spend",
    line2: "without friction.",
  },
  {
    slug: "go-paperless-with-receipts",
    motif: "paperless",
    kicker: "PAPERLESS",
    line1: "Digital proof,",
    line2: "same standards.",
  },
  {
    slug: "gig-workers-income-expense-guide",
    motif: "gig",
    kicker: "GIG WORK",
    line1: "Miles, fuel,",
    line2: "real deductions.",
  },
  {
    slug: "scan-receipts-for-tax-refund",
    motif: "tax",
    kicker: "CAPTURE",
    line1: "Scan once,",
    line2: "stay audit-ready.",
  },
  {
    slug: "best-expense-tracker-for-freelancers",
    motif: "tracker",
    kicker: "SOLO WORK",
    line1: "See patterns",
    line2: "in your ledger.",
  },
  {
    slug: "catch-subscription-creep",
    motif: "subscription",
    kicker: "LEAKS",
    line1: "Find repeats",
    line2: "before they stack.",
  },
  {
    slug: "import-bank-statements-expense-tracking",
    motif: "import",
    kicker: "IMPORTS",
    line1: "CSV & PDF",
    line2: "into one ledger.",
  },
  {
    slug: "what-is-a-receipt-scanner-freelancers-2026",
    motif: "scanner",
    kicker: "FREELANCERS",
    line1: "What scanners",
    line2: "actually solve.",
  },
  {
    slug: "receipt-scanner-tax-purposes-audit-ready-year-round",
    motif: "tax",
    kicker: "AUDIT READY",
    line1: "Track now,",
    line2: "file calmly.",
  },
  {
    slug: "expense-tracker-receipt-scanner-one-two-punch",
    motif: "tracker",
    kicker: "CLEAN BOOKS",
    line1: "Scan + track",
    line2: "in one flow.",
  },
  {
    slug: "how-ocr-receipt-scanning-works-ai-smarter",
    motif: "receipt",
    kicker: "OCR + AI",
    line1: "Read receipts",
    line2: "with context.",
  },
  {
    slug: "ai-in-finance-personal-business-money-management",
    motif: "subscription",
    kicker: "AI FINANCE",
    line1: "Automate admin,",
    line2: "keep judgment.",
  },
];

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function baseSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="78%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#134e4a" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${BG}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1220"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="22" stdDeviation="20" flood-color="#000" flood-opacity="0.45"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect x="${ART_X}" y="${ART_Y}" width="${ART_W}" height="${ART_H}" rx="36" fill="url(#cardGrad)" stroke="rgba(148,163,184,0.35)" stroke-width="2" filter="url(#shadow)"/>
</svg>`;
}

function motifSvg(motif) {
  const x = ART_X;
  const y = ART_Y;
  const w = ART_W;
  const h = ART_H;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const common = `
  <rect x="${x + 20}" y="${y + 20}" width="${w - 40}" height="${h - 40}" rx="28" fill="${BG_SOFT}" />
  <rect x="${x + 20}" y="${y + 20}" width="${w - 40}" height="70" rx="28" fill="#172235" />
  <circle cx="${x + 48}" cy="${y + 55}" r="6" fill="${TEAL}" />
  <circle cx="${x + 70}" cy="${y + 55}" r="6" fill="#60a5fa" />
  <circle cx="${x + 92}" cy="${y + 55}" r="6" fill="${ORANGE}" />
`;
  if (motif === "scanner") {
    return `<g>${common}
      <rect x="${x + 68}" y="${y + 128}" width="372" height="224" rx="18" fill="#e2e8f0"/>
      <rect x="${x + 88}" y="${y + 160}" width="332" height="160" rx="12" fill="#fff"/>
      <rect x="${x + 112}" y="${y + 190}" width="180" height="14" rx="7" fill="#cbd5e1"/>
      <rect x="${x + 112}" y="${y + 216}" width="260" height="10" rx="5" fill="#e2e8f0"/>
      <rect x="${x + 112}" y="${y + 236}" width="220" height="10" rx="5" fill="#e2e8f0"/>
      <rect x="${x + 330}" y="${y + 186}" width="70" height="70" rx="12" fill="#d1fae5"/>
      <path d="M ${x + 350} ${y + 220} l 12 12 l 24 -28" stroke="${TEAL_DARK}" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;
  }
  if (motif === "voice") {
    return `<g>${common}
      <rect x="${x + 70}" y="${y + 134}" width="368" height="216" rx="20" fill="#0b1323" stroke="#1e293b" />
      <path d="M ${x + 110} ${y + 246} q 12 -42 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0"
            stroke="${TEAL}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <circle cx="${x + 254}" cy="${y + 184}" r="28" fill="#0ea5a4"/>
      <rect x="${x + 244}" y="${y + 160}" width="20" height="40" rx="10" fill="#ecfeff"/>
      <rect x="${x + 236}" y="${y + 200}" width="36" height="10" rx="5" fill="#ecfeff"/>
    </g>`;
  }
  if (motif === "paperless") {
    return `<g>${common}
      <rect x="${x + 92}" y="${y + 130}" width="310" height="220" rx="16" fill="#f8fafc"/>
      <path d="M ${x + 360} ${y + 130} l 42 42 h -42 z" fill="#dbeafe"/>
      <rect x="${x + 126}" y="${y + 176}" width="210" height="12" rx="6" fill="#cbd5e1"/>
      <rect x="${x + 126}" y="${y + 202}" width="240" height="10" rx="5" fill="#e2e8f0"/>
      <rect x="${x + 126}" y="${y + 224}" width="220" height="10" rx="5" fill="#e2e8f0"/>
      <rect x="${x + 126}" y="${y + 246}" width="180" height="10" rx="5" fill="#e2e8f0"/>
      <circle cx="${x + 368}" cy="${y + 298}" r="24" fill="#ccfbf1"/>
      <path d="M ${x + 355} ${y + 298} l 10 10 l 16 -18" stroke="${TEAL_DARK}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;
  }
  if (motif === "gig") {
    return `<g>${common}
      <rect x="${x + 70}" y="${y + 140}" width="370" height="210" rx="18" fill="#f8fafc"/>
      <rect x="${x + 100}" y="${y + 290}" width="48" height="36" rx="8" fill="#93c5fd"/>
      <rect x="${x + 164}" y="${y + 264}" width="48" height="62" rx="8" fill="#60a5fa"/>
      <rect x="${x + 228}" y="${y + 234}" width="48" height="92" rx="8" fill="#38bdf8"/>
      <rect x="${x + 292}" y="${y + 204}" width="48" height="122" rx="8" fill="#0ea5a4"/>
      <rect x="${x + 356}" y="${y + 176}" width="48" height="150" rx="8" fill="#14b8a6"/>
      <path d="M ${x + 100} ${y + 186} q 70 -46 132 -24 q 64 22 140 -20" stroke="${ORANGE}" stroke-width="8" fill="none" stroke-linecap="round"/>
    </g>`;
  }
  if (motif === "tax") {
    return `<g>${common}
      <rect x="${x + 80}" y="${y + 130}" width="350" height="224" rx="16" fill="#fff"/>
      <rect x="${x + 110}" y="${y + 168}" width="194" height="12" rx="6" fill="#cbd5e1"/>
      <rect x="${x + 110}" y="${y + 194}" width="242" height="10" rx="5" fill="#e2e8f0"/>
      <rect x="${x + 110}" y="${y + 216}" width="210" height="10" rx="5" fill="#e2e8f0"/>
      <rect x="${x + 110}" y="${y + 238}" width="166" height="10" rx="5" fill="#e2e8f0"/>
      <circle cx="${x + 378}" cy="${y + 286}" r="34" fill="#dcfce7"/>
      <text x="${x + 362}" y="${y + 296}" font-family="Inter, Arial" font-size="28" font-weight="800" fill="#16a34a">$</text>
    </g>`;
  }
  if (motif === "tracker") {
    return `<g>${common}
      <rect x="${x + 66}" y="${y + 130}" width="376" height="224" rx="20" fill="#0b1323" stroke="#1e293b"/>
      <rect x="${x + 98}" y="${y + 170}" width="312" height="18" rx="9" fill="#1f2937"/>
      <rect x="${x + 98}" y="${y + 204}" width="240" height="14" rx="7" fill="#334155"/>
      <rect x="${x + 98}" y="${y + 232}" width="286" height="14" rx="7" fill="#334155"/>
      <rect x="${x + 98}" y="${y + 260}" width="198" height="14" rx="7" fill="#334155"/>
      <path d="M ${x + 110} ${y + 312} q 40 -18 78 -8 t 72 2 t 72 -24 t 78 -8" stroke="${TEAL}" stroke-width="8" fill="none" stroke-linecap="round"/>
    </g>`;
  }
  if (motif === "subscription") {
    return `<g>${common}
      <rect x="${x + 74}" y="${y + 138}" width="362" height="216" rx="18" fill="#fff"/>
      <rect x="${x + 106}" y="${y + 176}" width="228" height="14" rx="7" fill="#cbd5e1"/>
      <rect x="${x + 106}" y="${y + 202}" width="200" height="10" rx="5" fill="#e2e8f0"/>
      <rect x="${x + 106}" y="${y + 222}" width="180" height="10" rx="5" fill="#e2e8f0"/>
      <rect x="${x + 106}" y="${y + 242}" width="158" height="10" rx="5" fill="#e2e8f0"/>
      <circle cx="${x + 368}" cy="${y + 250}" r="40" fill="#fee2e2"/>
      <path d="M ${x + 348} ${y + 230} l 40 40 M ${x + 388} ${y + 230} l -40 40" stroke="#dc2626" stroke-width="8" stroke-linecap="round"/>
    </g>`;
  }
  if (motif === "import") {
    return `<g>${common}
      <rect x="${x + 74}" y="${y + 138}" width="362" height="216" rx="18" fill="#f8fafc"/>
      <rect x="${x + 104}" y="${y + 178}" width="300" height="16" rx="8" fill="#dbeafe"/>
      <rect x="${x + 104}" y="${y + 208}" width="300" height="16" rx="8" fill="#e2e8f0"/>
      <rect x="${x + 104}" y="${y + 238}" width="300" height="16" rx="8" fill="#e2e8f0"/>
      <rect x="${x + 104}" y="${y + 268}" width="300" height="16" rx="8" fill="#e2e8f0"/>
      <path d="M ${cx} ${y + 330} v -62 M ${cx - 22} ${y + 292} l 22 -24 l 22 24" stroke="${TEAL_DARK}" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;
  }
  return `<g>${common}
    <circle cx="${cx}" cy="${cy}" r="72" fill="#ccfbf1"/>
    <circle cx="${cx}" cy="${cy}" r="36" fill="${TEAL}"/>
  </g>`;
}

function coverSvg({ motif, kicker, line1, line2, slug }) {
  const url = `receiptcycle.com/blog/${slug}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${baseSvg().replace(/^<\?xml version="1.0" encoding="UTF-8"\?>/, "").replace("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1200\" height=\"630\" viewBox=\"0 0 1200 630\">", "").replace("</svg>", "")}
  ${motifSvg(motif)}
  <text x="72" y="110" font-family="Inter, Arial" font-size="13" font-weight="800" fill="${TEAL}" letter-spacing="0.16em">${escapeXml(
    kicker,
  )}</text>
  <text x="72" y="200" font-family="Inter, Arial" font-size="52" font-weight="900" fill="${WHITE}">${escapeXml(line1)}</text>
  <text x="72" y="268" font-family="Inter, Arial" font-size="52" font-weight="900" fill="${WHITE}">${escapeXml(line2)}</text>
  <rect x="72" y="296" width="132" height="8" rx="4" fill="${ORANGE}"/>
  <text x="72" y="360" font-family="Inter, Arial" font-size="17" font-weight="600" fill="${MUTED}">${escapeXml(url)}</text>
</svg>`;
}

async function main() {
  for (const c of COVERS) {
    const svg = coverSvg({
      motif: c.motif,
      kicker: c.kicker,
      line1: c.line1,
      line2: c.line2,
      slug: c.slug,
    });

    const outFile = path.join(OUT, `feature-blog-${c.slug}.png`);
    await sharp(Buffer.from(svg, "utf8"), { density: 180 })
      .png({ compressionLevel: 9 })
      .toFile(outFile);

    console.log("Wrote", path.relative(ROOT, outFile));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
