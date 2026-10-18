import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "artifacts", "play-store-assets-v3", "feature-graphic-1024x500.png");
const receiptPhoto = path.join(root, "artifacts", "play-store-assets-v3", "sources", "generated", "natural-receipt-desk.png");

const C = {
  forest: "#003b34",
  forest2: "#064a41",
  teal: "#13877f",
  mint: "#79e2ca",
  pale: "#eef8f5",
  ink: "#0b1730",
  slate: "#5b6b7e",
  line: "#dce5eb",
  white: "#ffffff",
  coral: "#f34f55"
};

const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const text = (value, x, y, size, color, weight = 600, anchor = "start") =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Segoe UI, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${esc(value)}</text>`;
const svg = (w, h, body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><filter id="shadow" x="-30%" y="-30%" width="170%" height="190%"><feDropShadow dx="0" dy="15" stdDeviation="17" flood-color="#001d19" flood-opacity=".35"/></filter><filter id="beam" x="-20%" y="-400%" width="140%" height="900%"><feGaussianBlur stdDeviation="7"/></filter></defs>${body}</svg>`);

function field(x, y, width, name, value) {
  return `${text(name, x, y, 11, C.slate, 700)}<rect x="${x}" y="${y+8}" width="${width}" height="38" rx="10" fill="#fff" stroke="${C.line}"/><circle cx="${x+18}" cy="${y+27}" r="8" fill="#e7f6f1"/>${text(value, x+36, y+32, 13, C.ink, 650)}`;
}

function reviewScreen(w = 314, h = 420) {
  return svg(w, h, `
    <rect x="4" y="4" width="${w-8}" height="${h-8}" rx="32" fill="#11181c" stroke="#657177" stroke-width="3" filter="url(#shadow)"/>
    <rect x="14" y="14" width="${w-28}" height="${h-28}" rx="25" fill="#f8fbfa"/>
    <circle cx="${w/2}" cy="27" r="5" fill="#0b1114" stroke="#34424a" stroke-width="1.5"/>
    ${text("Review receipt", 34, 58, 18, C.ink, 800)}
    <rect x="28" y="76" width="${w-56}" height="46" rx="14" fill="#e7f7f2"/>
    ${text("OCR ready for review", 46, 104, 13, C.teal, 800)}
    ${field(28, 150, w-56, "Merchant", "Northside Market")}
    ${field(28, 218, w-56, "Total", "$42.80")}
    ${field(28, 286, w-56, "Date", "17 Oct 2026")}
    <rect x="28" y="358" width="${w-56}" height="42" rx="13" fill="${C.teal}"/>
    ${text("Use extracted details", w/2, 384, 14, C.white, 800, "middle")}
  `);
}

function evidenceScreen(w = 300, h = 388) {
  return svg(w, h, `
    <rect x="4" y="4" width="${w-8}" height="${h-8}" rx="30" fill="#11181c" stroke="#657177" stroke-width="3" filter="url(#shadow)"/>
    <rect x="14" y="14" width="${w-28}" height="${h-28}" rx="23" fill="#fff"/>
    <circle cx="${w/2}" cy="27" r="5" fill="#0b1114"/>
    ${text("Transaction", 34, 58, 17, C.ink, 800)}
    ${text("Northside Market", 30, 98, 18, C.ink, 800)}
    ${text("$42.80", w-30, 99, 19, C.teal, 900, "end")}
    ${text("17 Oct 2026 · Groceries", 30, 120, 11, C.slate, 600)}
    <rect x="28" y="142" width="${w-56}" height="82" rx="14" fill="#f2f8f6"/>
    ${text("Receipt summary", 44, 164, 11, C.slate, 700)}
    ${text("Subtotal", 44, 188, 12, C.slate, 600)}
    ${text("$39.60", w-44, 188, 12, C.ink, 800, "end")}
    ${text("Tax", 44, 208, 12, C.slate, 600)}
    ${text("$3.20", w-44, 208, 12, C.ink, 800, "end")}
    <rect x="28" y="240" width="${w-56}" height="82" rx="14" fill="#f0efeb"/>
    <path d="M104 306h92l-8-52h-76z" fill="#fff" stroke="#d5d7d5"/>
    ${text("RECEIPT", w/2, 277, 10, C.ink, 800, "middle")}
    ${text("TOTAL  $42.80", w/2, 298, 9, C.ink, 700, "middle")}
    <rect x="28" y="334" width="${w-56}" height="35" rx="11" fill="#e7f7f2"/>
    ${text("Original evidence linked", w/2, 357, 12, C.teal, 800, "middle")}
  `);
}

const scanW = 290;
const scanH = 390;
const scanPhoto = await sharp(receiptPhoto)
  .resize(scanW - 28, scanH - 28, { fit: "cover", position: "center" })
  .modulate({ brightness: 0.85, saturation: 0.9 })
  .sharpen()
  .png()
  .toBuffer();

const scanUi = svg(scanW - 28, scanH - 28, `
  <rect width="${scanW-28}" height="52" fill="#05090c" opacity=".72"/>
  <circle cx="${(scanW-28)/2}" cy="13" r="5" fill="#060708" stroke="#34424a"/>
  ${text("Processing Receipt", 18, 36, 15, C.white, 800)}
  <path d="M28 205L235 230" stroke="${C.coral}" stroke-width="18" opacity=".23" filter="url(#beam)"/>
  <path d="M28 205L235 230" stroke="${C.coral}" stroke-width="5" stroke-linecap="round"/>
  <rect x="26" y="286" width="210" height="54" rx="16" fill="#061126" opacity=".94"/>
  <circle cx="49" cy="313" r="8" fill="none" stroke="${C.mint}" stroke-width="3" stroke-dasharray="8 5"/>
  ${text("Analyzing image and text", 68, 318, 12, C.white, 750)}
`);
const scanMask = svg(scanW - 28, scanH - 28, `<rect width="${scanW-28}" height="${scanH-28}" rx="23" fill="#fff"/>`);
const scanScreen = await sharp(scanPhoto).composite([{ input: scanUi }, { input: scanMask, blend: "dest-in" }]).png().toBuffer();
const scanShell = svg(scanW, scanH, `<rect x="4" y="4" width="${scanW-8}" height="${scanH-8}" rx="30" fill="#11181c" stroke="#657177" stroke-width="3" filter="url(#shadow)"/>`);
const scanDevice = await sharp(scanShell).composite([{ input: scanScreen, left: 14, top: 14 }]).png().toBuffer();

const leftDevice = await sharp(scanDevice).rotate(-5, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
const rightDevice = await sharp(evidenceScreen()).rotate(4, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

const background = svg(1024, 500, `
  <rect width="1024" height="500" fill="${C.forest}"/>
  <path d="M0 122C170 45 325 55 472 128S792 220 1024 92" fill="none" stroke="${C.forest2}" stroke-width="3" opacity=".75"/>
  <path d="M0 368C175 280 318 300 492 378S820 468 1024 342" fill="none" stroke="${C.forest2}" stroke-width="3" opacity=".6"/>
  <g transform="translate(432 26)">
    <rect width="28" height="28" rx="8" fill="${C.mint}"/>
    <path d="M8 7h12v14H8zM11 11h6M11 15h6M11 19h4" fill="none" stroke="${C.forest}" stroke-width="1.8" stroke-linecap="round"/>
  </g>
  ${text("Receipt Cycle", 470, 48, 21, C.mint, 850)}
  ${text("From receipt to record, in one flow.", 512, 102, 38, C.white, 800, "middle")}
`);

await sharp(background)
  .composite([
    { input: leftDevice, left: 110, top: 155 },
    { input: rightDevice, left: 647, top: 170 },
    { input: reviewScreen(), left: 355, top: 132 }
  ])
  .flatten({ background: C.forest })
  .removeAlpha()
  .png({ compressionLevel: 9 })
  .toFile(output);

console.log(output);
