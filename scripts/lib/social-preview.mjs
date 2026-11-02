/** Original Receipt Cycle artwork with exact typography and captured product UI.
 * The source is the public demonstration with fictional records, never private customer data.
 */
import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export async function makeSocialPreviews(root) {
  const dir = path.join(root, "public/social");
  await mkdir(dir, { recursive: true });
  const capture = await readFile(path.join(dir, "source/receipt-cycle-capture.png"));
  const receipt = await readFile(path.join(root, "public/landing/home/workflow/oak-street-grill-receipt.svg"));
  const scale = (await sharp(capture).metadata()).width / 736;
  const details = await sharp(capture).extract({ left: Math.round(340 * scale), top: 0, width: Math.round(396 * scale), height: Math.round(371 * scale) }).resize(792, 742).png().toBuffer();
  const data = (type, buffer) => `data:image/${type};base64,${buffer.toString("base64")}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <filter id="paper-shadow" x="-50%" y="-30%" width="200%" height="180%"><feDropShadow dx="0" dy="15" stdDeviation="12" flood-color="#001c20" flood-opacity=".35"/></filter>
    <filter id="panel-shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#001c20" flood-opacity=".25"/></filter>
    <clipPath id="panel"><rect x="748" y="161" width="396" height="371" rx="17"/></clipPath>
  </defs>
  <rect width="1200" height="630" fill="#f6f5ef"/>
  <rect x="540" width="660" height="630" fill="#08383b"/>
  <g font-family="Arial, sans-serif">
    <text x="56" y="78" fill="#08244a" font-size="29" font-weight="700" letter-spacing="-.8">Receipt Cycle</text>
    <text x="52" y="224" fill="#08244a" font-size="74" font-weight="700" letter-spacing="-3">Receipts in.</text>
    <text x="52" y="307" fill="#087f78" font-size="74" font-weight="700" letter-spacing="-3">Clarity out.</text>
    <text x="56" y="369" fill="#465867" font-size="22"><tspan x="56">Scan receipts, track expenses,</tspan><tspan x="56" dy="32">and keep your business in view.</tspan></text>
    <path d="M56 519h36" stroke="#087f78" stroke-width="4"/>
    <text x="56" y="558" fill="#08244a" font-size="20" font-weight="700">receiptcycle.com</text>
    <text x="586" y="103" fill="#a7d4ce" font-size="14" font-weight="700" letter-spacing="2">FROM RECEIPT TO RECORD</text>
  </g>
  <g transform="rotate(-8 658 347)" filter="url(#paper-shadow)"><image x="563" y="176" width="191" height="345" xlink:href="${data("svg+xml", receipt)}"/></g>
  <rect x="748" y="161" width="396" height="371" rx="17" fill="#fff" filter="url(#panel-shadow)"/>
  <image x="748" y="161" width="396" height="371" xlink:href="${data("png", details)}" clip-path="url(#panel)"/>
  </svg>`;
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true, quality: 100 }).toBuffer();
  await writeFile(path.join(dir, "receipt-cycle-business-records-2026.png"), png);
  // Keep the old stable URL useful for previously cached shares, too.
  await writeFile(path.join(root, "public/og-image.png"), png);
  const screenshot = await sharp(capture).resize(1120, 565, { fit: "inside" }).png().toBuffer();
  await sharp({ create: { width: 1200, height: 675, channels: 3, background: "#f1f6f5" } })
    .composite([{ input: screenshot, gravity: "centre" }])
    .png({ compressionLevel: 9, palette: true, quality: 100 })
    .toFile(path.join(dir, "receipt-cycle-receipt-review.png"));
}
