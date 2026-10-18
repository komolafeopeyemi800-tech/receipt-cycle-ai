import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const source = path.join(root, "artifacts", "play-store-assets-v3", "sources", "generated", "feature-graphic-scanner-base.png");
const output = path.join(root, "artifacts", "play-store-assets-v3", "feature-graphic-1024x500-aligned.png");

const C = {
  mint: "#71e0c4",
  teal: "#13877f",
  ink: "#0b1730",
  slate: "#617184",
  line: "#dce5eb",
  white: "#ffffff"
};

const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const text = (value, x, y, size, color, weight = 600, anchor = "start") =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Segoe UI, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${esc(value)}</text>`;

const base = await sharp(source)
  .resize(1024, 500, { fit: "cover", position: "north" })
  .png()
  .toBuffer();

const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <defs>
    <filter id="soft" x="-30%" y="-30%" width="170%" height="190%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#002b26" flood-opacity=".18"/>
    </filter>
  </defs>

  ${text("Receipt Cycle", 512, 42, 23, C.mint, 850, "middle")}
  ${text("Scan receipts. Review every detail.", 512, 88, 37, C.white, 800, "middle")}

  <g transform="translate(142 258)">
    ${text("Review receipt", 0, 0, 18, C.ink, 800)}
    <rect x="0" y="18" width="190" height="38" rx="11" fill="#e7f7f2"/>
    ${text("Ready for review", 16, 43, 12, C.teal, 800)}

    ${text("Merchant", 0, 84, 11, C.slate, 700)}
    <rect x="0" y="94" width="190" height="37" rx="10" fill="#fff" stroke="${C.line}"/>
    ${text("Northside Market", 14, 118, 12, C.ink, 700)}

    ${text("Total", 0, 153, 11, C.slate, 700)}
    <rect x="0" y="163" width="190" height="37" rx="10" fill="#fff" stroke="${C.line}"/>
    ${text("$42.80", 14, 187, 13, C.ink, 800)}
  </g>

  <g transform="translate(714 258)">
    ${text("Transaction", 0, 0, 18, C.ink, 800)}
    ${text("Northside Market", 0, 38, 13, C.ink, 800)}
    ${text("$42.80", 180, 38, 14, C.teal, 900, "end")}
    ${text("17 Oct 2026 · Groceries", 0, 60, 10, C.slate, 600)}

    <rect x="0" y="82" width="180" height="78" rx="13" fill="#f2f8f6"/>
    ${text("Receipt summary", 14, 103, 11, C.slate, 700)}
    ${text("Subtotal", 14, 127, 11, C.slate, 600)}
    ${text("$39.60", 166, 127, 11, C.ink, 800, "end")}
    ${text("Tax", 14, 147, 11, C.slate, 600)}
    ${text("$3.20", 166, 147, 11, C.ink, 800, "end")}

    <rect x="0" y="174" width="180" height="36" rx="11" fill="#e7f7f2"/>
    ${text("Original evidence linked", 90, 197, 11, C.teal, 800, "middle")}
  </g>
</svg>`);

await sharp(base)
  .composite([{ input: overlay }])
  .flatten({ background: "#003b34" })
  .removeAlpha()
  .png({ compressionLevel: 9 })
  .toFile(output);

console.log(output);
