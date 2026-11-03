/** Publish the exact approved social banner; retain a separate product image for search.
 * Layout source: scripts/assets/receipt-cycle-social-2026-11-03.html.
 * Ordinary builds must never recreate the superseded receipt/panel composition.
 */
import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export async function makeSocialPreviews(root) {
  const dir = path.join(root, "public/social");
  await mkdir(dir, { recursive: true });
  const approved = await readFile(path.join(dir, "receipt-cycle-less-paperwork-2026-11.png"));
  const metadata = await sharp(approved).metadata();
  if (metadata.format !== "png" || metadata.width !== 1200 || metadata.height !== 630) {
    throw new Error("The approved Receipt Cycle social banner must be a 1200 x 630 PNG.");
  }
  // Keep previous share URLs useful without changing the approved artwork's pixels.
  await writeFile(path.join(dir, "receipt-cycle-business-records-2026.png"), approved);
  await writeFile(path.join(root, "public/og-image.png"), approved);

  // Search/application markup keeps a representative product view, not the advertising banner.
  const capture = await readFile(path.join(dir, "source/receipt-cycle-capture.png"));
  const screenshot = await sharp(capture).resize(1120, 565, { fit: "inside" }).png().toBuffer();
  await sharp({ create: { width: 1200, height: 675, channels: 3, background: "#f1f6f5" } })
    .composite([{ input: screenshot, gravity: "centre" }])
    .png({ compressionLevel: 9, palette: true, quality: 100 })
    .toFile(path.join(dir, "receipt-cycle-receipt-review.png"));
}
