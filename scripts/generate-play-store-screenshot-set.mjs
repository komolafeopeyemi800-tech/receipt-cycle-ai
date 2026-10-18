import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const outRoot = path.join(root, "artifacts", "play-store-assets");

const frames = [
  {
    id: "01-scan-receipts",
    kicker: "SMART RECEIPT CAPTURE",
    headline: ["Scan receipts.", "Review every detail."],
    accentLine: 1,
    support: "Extract merchant, date, total, tax and line items before saving.",
    source: "public/landing/scan-receipt.png",
    note: "Editorial scanner visual from the Receipt Cycle repository. Replace with a clean release capture for final upload."
  },
  {
    id: "02-upload-documents",
    kicker: "DOCUMENT IMPORT",
    headline: ["Turn documents", "into clean records."],
    accentLine: 1,
    support: "Import JPG, PNG, PDF or CSV and review the result before saving.",
    source: "artifacts/play-store-upload-document.png",
    note: "Live Android capture from the connected release app."
  },
  {
    id: "03-voice-entry",
    kicker: "VOICE AND QUICK TEXT",
    headline: ["Speak it.", "We fill the form."],
    accentLine: 1,
    support: "Voice or quick text prepares an editable transaction for review.",
    source: ".android-device-test/mobile-add-transaction-rich.png",
    note: "Real Android app screen showing the AI Capture entry point."
  },
  {
    id: "04-invoices",
    kicker: "INVOICES",
    headline: ["Create polished", "invoices."],
    accentLine: 1,
    support: "Choose Standard or Compact, then add your colors and signature.",
    source: "public/landing/invoice-software-og.png",
    note: "Receipt Cycle document preview artwork using fictional demo data."
  },
  {
    id: "05-estimates",
    kicker: "ESTIMATES",
    headline: ["Send estimates", "with confidence."],
    accentLine: 1,
    support: "Preview, email, share, print or convert an estimate to an invoice.",
    source: "public/landing/estimate-quotation-software-og.png",
    note: "Receipt Cycle estimate preview artwork using fictional demo data."
  },
  {
    id: "06-payments",
    kicker: "PAYMENT TRACKING",
    headline: ["Know what is paid.", "See what is due."],
    accentLine: 1,
    support: "Track paid, partial and overdue balances in one place.",
    source: "public/landing/payment-tracking-software-og.png",
    note: "Receipt Cycle payment preview artwork using fictional demo data."
  },
  {
    id: "07-budgets-reports",
    kicker: "BUDGETS AND REPORTS",
    headline: ["Stay on budget.", "See the full picture."],
    accentLine: 1,
    support: "Follow cash flow, categories and monthly budget progress.",
    source: "public/landing/business-budgeting-software-og.png",
    note: "Receipt Cycle budget preview artwork using fictional demo data."
  },
  {
    id: "08-export-backup",
    kicker: "EXPORT AND CONTINUITY",
    headline: ["Export clean records.", "Keep evidence linked."],
    accentLine: 1,
    support: "Download spreadsheet-ready data with links to source documents.",
    source: "artifacts/play-store-backup-export.png",
    note: "Live Android capture from the connected release app."
  }
];

const palettes = [
  { bg: "#07131c", panel: "#10222d", accent: "#68e0ca", ink: "#ffffff", muted: "#b8c8d1" },
  { bg: "#0b1d27", panel: "#132c36", accent: "#68e0ca", ink: "#ffffff", muted: "#bfd0d8" },
  { bg: "#07131c", panel: "#112430", accent: "#9a6cff", ink: "#ffffff", muted: "#bdc9d0" },
  { bg: "#07131c", panel: "#10222d", accent: "#68e0ca", ink: "#ffffff", muted: "#b8c8d1" },
  { bg: "#f4fbf9", panel: "#ffffff", accent: "#149184", ink: "#07131c", muted: "#506273" },
  { bg: "#07131c", panel: "#10222d", accent: "#68e0ca", ink: "#ffffff", muted: "#b8c8d1" },
  { bg: "#f4fbf9", panel: "#ffffff", accent: "#149184", ink: "#07131c", muted: "#506273" },
  { bg: "#07131c", panel: "#10222d", accent: "#68e0ca", ink: "#ffffff", muted: "#b8c8d1" }
];

const esc = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

function wrap(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  return lines;
}

function svgTextLines(lines, x, y, lineHeight, size, color, weight = 700, accentLine = -1, accent = color) {
  return `<text x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${lines.map((line, i) => `<tspan x="${x}" dy="${i ? lineHeight : 0}" fill="${i === accentLine ? accent : color}">${esc(line)}</tspan>`).join("")}</text>`;
}

async function roundedArtwork(source, width, height, radius, fit = "cover", position = "centre") {
  const mask = Buffer.from(`<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" fill="#fff"/></svg>`);
  return sharp(path.join(root, source))
    .resize(width, height, { fit, position, background: "#ffffff" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function phoneFrame(frame, index) {
  const w = 1080, h = 1920;
  const p = palettes[index];
  const artW = 920, artH = 1120;
  const rightFocused = index >= 3 && index <= 6;
  const art = await roundedArtwork(frame.source, artW, artH, 42, "cover", rightFocused ? "right" : "centre");
  const supportLines = wrap(frame.support, 46);
  const base = Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${w}" height="${h}" fill="${p.bg}"/>
    <circle cx="1030" cy="120" r="250" fill="${p.accent}" opacity="0.10"/>
    <circle cx="40" cy="1870" r="260" fill="${p.accent}" opacity="0.08"/>
    <text x="80" y="98" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="800" letter-spacing="3" fill="${p.accent}">${esc(frame.kicker)}</text>
    ${svgTextLines(frame.headline, 80, 190, 76, 62, p.ink, 800, frame.accentLine, p.accent)}
    ${svgTextLines(supportLines, 80, 360, 44, 30, p.muted, 400)}
    <rect x="56" y="690" width="968" height="1180" rx="58" fill="#000" opacity="0.18"/>
    <rect x="80" y="650" width="920" height="1120" rx="42" fill="${p.panel}"/>
    <text x="80" y="1835" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" letter-spacing="2" fill="${p.accent}">RECEIPT CYCLE</text>
    <text x="970" y="1835" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="${p.muted}">${String(index + 1).padStart(2, "0")} / 08</text>
  </svg>`);
  return sharp(base).composite([{ input: art, left: 80, top: 650 }]).flatten({ background: p.bg }).removeAlpha().png({ compressionLevel: 9 }).toBuffer();
}

async function tabletFrame(frame, index, kind) {
  const w = 1920, h = 1080;
  const p = palettes[index];
  const ten = kind === "tablet-10";
  const copyW = ten ? 690 : 730;
  const artX = ten ? 780 : 800;
  const artY = ten ? 90 : 125;
  const artW = ten ? 1050 : 1010;
  const artH = ten ? 900 : 830;
  const art = await roundedArtwork(frame.source, artW, artH, 44, frame.source.includes(".android-device-test") || frame.source.includes("artifacts/play-store") ? "cover" : "contain");
  const headline = frame.headline;
  const supportLines = wrap(frame.support, ten ? 36 : 40);
  const base = Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${w}" height="${h}" fill="${p.bg}"/>
    <circle cx="1850" cy="-20" r="330" fill="${p.accent}" opacity="0.11"/>
    <circle cx="40" cy="1040" r="260" fill="${p.accent}" opacity="0.08"/>
    <text x="90" y="120" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="800" letter-spacing="3" fill="${p.accent}">${esc(frame.kicker)}</text>
    ${svgTextLines(headline, 90, 230, 76, 60, p.ink, 800, frame.accentLine, p.accent)}
    ${svgTextLines(supportLines, 90, 470, 48, 31, p.muted, 400)}
    <rect x="${artX + 22}" y="${artY + 28}" width="${artW}" height="${artH}" rx="50" fill="#000" opacity="0.18"/>
    <rect x="${artX}" y="${artY}" width="${artW}" height="${artH}" rx="44" fill="${p.panel}"/>
    <text x="90" y="1000" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="700" letter-spacing="2" fill="${p.accent}">RECEIPT CYCLE</text>
    <text x="${copyW}" y="1000" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="${p.muted}">${ten ? "10-INCH" : "7-INCH"}  ${String(index + 1).padStart(2, "0")} / 08</text>
  </svg>`);
  return sharp(base).composite([{ input: art, left: artX, top: artY }]).flatten({ background: p.bg }).removeAlpha().png({ compressionLevel: 9 }).toBuffer();
}

async function contactSheet(kind, width, height) {
  const files = frames.map((f) => path.join(outRoot, kind, `${f.id}.png`));
  const thumbW = kind === "phone" ? 270 : 480;
  const thumbH = Math.round(thumbW * height / width);
  const cols = 4;
  const gap = 24;
  const sheetW = cols * thumbW + (cols + 1) * gap;
  const rows = 2;
  const sheetH = rows * thumbH + (rows + 1) * gap;
  const composites = [];
  for (let i = 0; i < files.length; i++) {
    const input = await sharp(files[i]).resize(thumbW, thumbH).png().toBuffer();
    composites.push({ input, left: gap + (i % cols) * (thumbW + gap), top: gap + Math.floor(i / cols) * (thumbH + gap) });
  }
  await sharp({ create: { width: sheetW, height: sheetH, channels: 3, background: "#dfe9e7" } })
    .composite(composites)
    .png()
    .toFile(path.join(outRoot, `${kind}-contact-sheet.png`));
}

await fs.mkdir(outRoot, { recursive: true });
for (const kind of ["phone", "tablet-7", "tablet-10"]) await fs.mkdir(path.join(outRoot, kind), { recursive: true });

for (let i = 0; i < frames.length; i++) {
  const frame = frames[i];
  await sharp(await phoneFrame(frame, i)).toFile(path.join(outRoot, "phone", `${frame.id}.png`));
  await sharp(await tabletFrame(frame, i, "tablet-7")).toFile(path.join(outRoot, "tablet-7", `${frame.id}.png`));
  await sharp(await tabletFrame(frame, i, "tablet-10")).toFile(path.join(outRoot, "tablet-10", `${frame.id}.png`));
}

await contactSheet("phone", 1080, 1920);
await contactSheet("tablet-7", 1920, 1080);
await contactSheet("tablet-10", 1920, 1080);

await fs.copyFile(path.join(root, "apps/mobile/assets/icon.png"), path.join(outRoot, "receipt-cycle-play-icon-512.png"));
await fs.writeFile(path.join(outRoot, "asset-manifest.json"), JSON.stringify({
  status: "review-draft",
  warning: "Frames 1, 4, 5, 6 and 7 use repository marketing artwork. Replace those visual panels with clean release captures before final Play upload. Tablet panels are layout proofs until genuine 7-inch and 10-inch captures are available.",
  sizes: { phone: "1080x1920", "tablet-7": "1920x1080", "tablet-10": "1920x1080", icon: "512x512" },
  frames
}, null, 2));

console.log(`Generated 24 review assets plus contact sheets in ${outRoot}`);
