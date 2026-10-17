/**
 * Photos of statements, prepared in the browser before they are read: the long edge is brought to about 2000 px (a huge
 * camera photo uploads faster and fits the 10 MB limit), and for a second try the page is also turned grey and its contrast
 * stretched. Anything it cannot handle is returned unchanged.
 */
const LONG_EDGE = 2000;

async function draw(file: File | Blob, gray: boolean): Promise<Blob | null> {
  if (typeof createImageBitmap !== "function") return null;
  const bitmap = await createImageBitmap(file);
  const scale = LONG_EDGE / Math.max(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  if (gray) {
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = img.data;
    let lo = 255;
    let hi = 0;
    for (let i = 0; i < d.length; i += 4) {
      const g = (d[i]! * 299 + d[i + 1]! * 587 + d[i + 2]! * 114) / 1000;
      d[i] = d[i + 1] = d[i + 2] = g;
      if (g < lo) lo = g;
      if (g > hi) hi = g;
    }
    const span = Math.max(1, hi - lo);
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.min(255, Math.max(0, ((d[i]! - lo) * 255) / span));
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    ctx.putImageData(img, 0, 0);
  }
  return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
}

/** A large photo brought down to about 2000 px; small ones are left alone. */
export async function shrinkForUpload(file: File): Promise<File> {
  if (!/^image\/(png|jpeg)$/.test(file.type) || file.size < 2.5 * 1024 * 1024) return file;
  try {
    const blob = await draw(file, false);
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}

/** The second try for a photo that could not be read: 2000 px, grey, contrast stretched. */
export async function sharpenForRetry(file: File): Promise<{ bytes: Uint8Array; mime: string } | null> {
  try {
    const blob = await draw(file, true);
    return blob ? { bytes: new Uint8Array(await blob.arrayBuffer()), mime: "image/jpeg" } : null;
  } catch {
    return null;
  }
}
