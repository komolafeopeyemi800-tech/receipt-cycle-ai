import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "artifacts", "play-store-assets-v3", "feature-graphic-1024x500.png");
const receiptPhoto = path.join(root, "artifacts", "play-store-assets-v3", "sources", "generated", "natural-receipt-desk.png");

const C = {
  teal: "#13877f",
  mint: "#79e2ca",
  ink: "#0b1730",
  slate: "#53647b",
  pale: "#edf6f1",
  coral: "#f34f55",
  white: "#ffffff"
};

const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const label = (text, x, y, size, color, weight = 600, anchor = "start") =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Segoe UI, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${esc(text)}</text>`;
const svg = (w, h, body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><filter id="shadow" x="-30%" y="-30%" width="170%" height="180%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#071522" flood-opacity=".23"/></filter><filter id="soft" x="-30%" y="-30%" width="170%" height="180%"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#071522" flood-opacity=".16"/></filter><filter id="beam" x="-20%" y="-400%" width="140%" height="900%"><feGaussianBlur stdDeviation="8"/></filter></defs>${body}</svg>`);

const screenW = 330;
const screenH = 610;
const photo = await sharp(receiptPhoto)
  .resize(screenW, screenH, { fit: "cover", position: "center" })
  .modulate({ brightness: 0.86, saturation: 0.9 })
  .sharpen()
  .png()
  .toBuffer();

const screenUi = svg(screenW, screenH, `
  <rect width="${screenW}" height="64" fill="#04090d" opacity=".72"/>
  <circle cx="165" cy="15" r="6" fill="#050607" stroke="#334048" stroke-width="2"/>
  ${label("Processing Receipt", 22, 45, 17, C.white, 800)}
  <path d="M38 318L294 350" stroke="${C.coral}" stroke-width="22" opacity=".22" filter="url(#beam)"/>
  <path d="M38 318L294 350" stroke="${C.coral}" stroke-width="6" stroke-linecap="round"/>
  <rect x="35" y="460" width="260" height="105" rx="20" fill="#061126" opacity=".94"/>
  <circle cx="61" cy="493" r="9" fill="none" stroke="${C.mint}" stroke-width="3" stroke-dasharray="9 6"/>
  ${label("Analyzing image and text", 81, 499, 13, C.white, 800)}
  <circle cx="61" cy="532" r="7" fill="none" stroke="#9cadbd" stroke-width="2"/>
  ${label("Preparing your review", 81, 537, 12, "#d8e1ea", 600)}
`);

const roundedMask = svg(screenW, screenH, `<rect width="${screenW}" height="${screenH}" rx="47" fill="#fff"/>`);
const screen = await sharp(photo).composite([{ input: screenUi }, { input: roundedMask, blend: "dest-in" }]).png().toBuffer();

const shell = svg(374, 654, `
  <rect x="10" y="10" width="354" height="634" rx="58" fill="#161a1e" stroke="#69737a" stroke-width="4" filter="url(#shadow)"/>
`);
const phone = await sharp(shell).composite([{ input: screen, left: 22, top: 22 }]).png().toBuffer();
const tiltedPhone = await sharp(phone).rotate(-5, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
const tiltedPhoneSized = await sharp(tiltedPhone).resize({ width: 390 }).extract({ left: 0, top: 0, width: 390, height: 500 }).png().toBuffer();

const background = svg(1024, 500, `
  <rect width="1024" height="500" fill="${C.pale}"/>
  <circle cx="965" cy="432" r="350" fill="#d8eee5"/>
  <circle cx="965" cy="432" r="248" fill="#bfe3d5" opacity=".82"/>
  <circle cx="965" cy="432" r="142" fill="#98d2be" opacity=".75"/>

  <g transform="translate(54 54)">
    <rect width="42" height="42" rx="12" fill="${C.teal}"/>
    <path d="M12 11h18v20H12zM16 17h10M16 22h10M16 27h7" fill="none" stroke="#fff" stroke-width="2.7" stroke-linecap="round"/>
  </g>
  ${label("Receipt Cycle", 112, 86, 27, C.ink, 800)}
  ${label("Turn receipts into", 54, 180, 50, C.ink, 850)}
  ${label("editable records.", 54, 236, 50, C.teal, 850)}
  ${label("Snap once. Review the details. Save when ready.", 56, 292, 20, C.slate, 600)}
  <rect x="54" y="330" width="246" height="46" rx="23" fill="#dff2eb"/>
  ${label("YOU CAPTURE · AI EXTRACTS", 177, 359, 14, C.teal, 800, "middle")}
`);

const resultCard = svg(300, 108, `
  <rect width="300" height="108" rx="19" fill="#fff" filter="url(#soft)"/>
  ${label("Northside Market", 18, 32, 15, C.ink, 800)}
  ${label("17 Oct 2026", 18, 56, 12, C.slate, 600)}
  ${label("$42.80", 282, 38, 20, C.teal, 900, "end")}
  <path d="M18 70H282" stroke="#e4eaed"/>
  ${label("Merchant, total and date extracted", 18, 94, 12, C.ink, 700)}
`);

await sharp(background)
  .composite([
    { input: tiltedPhoneSized, left: 624, top: 0 },
    { input: resultCard, left: 545, top: 342 }
  ])
  .flatten({ background: C.pale })
  .removeAlpha()
  .png({ compressionLevel: 9 })
  .toFile(out);

console.log(out);
