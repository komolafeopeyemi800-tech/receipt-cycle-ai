/**
 * Shrinks a photo in the browser before it is scanned or stored: longest side 1800 px, JPEG 80%.
 * A phone photo of 4-8 MB usually becomes 200-500 KB, which uploads faster, costs less to read with AI
 * and uses less storage. Anything it cannot handle (HEIC, GIF, no canvas support) is returned unchanged.
 */
export async function compressImage(file: File, maxSide = 1800, quality = 0.8): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || typeof createImageBitmap !== "function") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 400 * 1024) {
      bitmap.close();
      return file; // already small
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}
