import sharp from "sharp";

const [input, output, widthArg = "1600", qualityArg = "88"] = process.argv.slice(2);

if (!input || !output) {
  throw new Error("Usage: node scripts/optimize-image.mjs <input> <output> [width] [quality]");
}

const width = Number(widthArg);
const quality = Number(qualityArg);

await sharp(input)
  .resize({ width, withoutEnlargement: true })
  .webp({ quality, smartSubsample: true })
  .toFile(output);

const metadata = await sharp(output).metadata();
console.log(`${output}: ${metadata.width}x${metadata.height}`);
