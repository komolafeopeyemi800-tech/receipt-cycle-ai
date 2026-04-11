/**
 * Generates Expo mobile icons + splash from the canonical web logo:
 *   public/brand/logo.png
 *
 * Run: npm run brand:mobile
 */
import sharp from "sharp";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "public/brand/logo.png");
const BRAND_TEAL = { r: 0x14, g: 0x91, b: 0x84 };

const OUT = {
  icon: path.join(ROOT, "apps/mobile/assets/icon.png"),
  splash: path.join(ROOT, "apps/mobile/assets/splash-icon.png"),
  androidFg: path.join(ROOT, "apps/mobile/assets/android-icon-foreground.png"),
  androidMono: path.join(ROOT, "apps/mobile/assets/android-icon-monochrome.png"),
  favicon: path.join(ROOT, "apps/mobile/assets/favicon.png"),
};

const ICON = 1024;
const SPLASH_W = 1284;
const SPLASH_H = 2778;

/** Apply circular alpha mask (removes white corners outside the mark). */
function maskCircleRgba(data, width, height, cx, cy, radius) {
  const r2 = radius * radius;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const i = (y * width + x) * 4;
      if (dx * dx + dy * dy > r2) {
        data[i + 3] = 0;
      }
    }
  }
}

async function toRawPng(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data: new Uint8Array(data), info };
}

async function rawToPng(data, width, height) {
  return sharp(Buffer.from(data), { raw: { width, height, channels: 4 } }).png().toBuffer();
}

async function main() {
  await readFile(SRC);

  const base1024 = await sharp(SRC)
    .resize(ICON, ICON, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();

  await sharp(base1024).png().toFile(OUT.icon);

  const { data, info } = await toRawPng(base1024);
  const cx = info.width / 2;
  const cy = info.height / 2;
  const radius = Math.min(info.width, info.height) * 0.48;
  maskCircleRgba(data, info.width, info.height, cx, cy, radius);
  const circular = await rawToPng(data, info.width, info.height);

  await sharp(circular).png().toFile(OUT.androidFg);

  const mono = await toRawPng(circular);
  for (let i = 0; i < mono.data.length; i += 4) {
    const a = mono.data[i + 3];
    if (a < 32) {
      mono.data[i] = 0;
      mono.data[i + 1] = 0;
      mono.data[i + 2] = 0;
      mono.data[i + 3] = 0;
      continue;
    }
    mono.data[i] = 255;
    mono.data[i + 1] = 255;
    mono.data[i + 2] = 255;
  }
  await sharp(Buffer.from(mono.data), { raw: { width: mono.info.width, height: mono.info.height, channels: 4 } })
    .png()
    .toFile(OUT.androidMono);

  const splashLogoSize = Math.round(Math.min(SPLASH_W, SPLASH_H) * 0.28);
  const logoOnSplash = await sharp(circular)
    .resize(splashLogoSize, splashLogoSize, { fit: "contain", background: { ...BRAND_TEAL, alpha: 0 } })
    .png()
    .toBuffer();

  const left = Math.round((SPLASH_W - splashLogoSize) / 2);
  const top = Math.round((SPLASH_H - splashLogoSize) / 2);

  await sharp({
    create: {
      width: SPLASH_W,
      height: SPLASH_H,
      channels: 3,
      background: BRAND_TEAL,
    },
  })
    .composite([{ input: logoOnSplash, left, top }])
    .png()
    .toFile(OUT.splash);

  await sharp(base1024).resize(48, 48, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } }).png().toFile(OUT.favicon);

  console.log("Wrote mobile brand assets from public/brand/logo.png:");
  console.log(Object.values(OUT).map((p) => "  " + path.relative(ROOT, p)).join("\n"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
