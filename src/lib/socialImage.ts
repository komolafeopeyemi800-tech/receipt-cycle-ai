/** Versioned filenames refresh social caches; all metadata consumers share these facts. */
export const SOCIAL_IMAGE = {
  url: "https://receiptcycle.com/social/receipt-cycle-business-records-2026.png",
  width: 1200,
  height: 630,
  alt: "Receipt Cycle: Receipts in. Clarity out. A sample receipt beside the extracted transaction details.",
} as const;

/** A representative product view without advertising copy for search image previews. */
export const SEARCH_IMAGE = {
  url: "https://receiptcycle.com/social/receipt-cycle-receipt-review.png",
  width: 1200,
  height: 675,
  alt: "Receipt Cycle receipt review with the source receipt and extracted merchant, date, total, category, and account.",
} as const;

export function imageMimeType(url: string): string | undefined {
  const extension = url.split(/[?#]/)[0].split(".").pop()?.toLowerCase();
  return ({ png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", avif: "image/avif", svg: "image/svg+xml" } as Record<string, string>)[extension ?? ""];
}
