/**
 * The named human author shown on every article (byline, author box and schema Person).
 * Framework-free and free of imports, so schema.ts and the build scripts can use it.
 *
 * Keep this to facts the owner has confirmed: first name, brand, photo, social profiles. Do not add a surname, job title,
 * credentials or a longer biography until the owner supplies them. When a YouTube channel link is provided, add it to
 * `sameAs` and to `links`.
 */
export const AUTHOR = {
  /** Shown as the author name in bylines and in schema. */
  name: "Philip",
  /** "Philip at Receipt Cycle" */
  byline: "Philip at Receipt Cycle",
  /** About-page link used as the author's URL. */
  path: "/about",
  /** Retouched profile photo (512 px) and the small byline version (160 px), both in /public/authors. */
  image: "/authors/philip-512.webp",
  thumb: "/authors/philip-160.webp",
  /** Plain, confirmed description. */
  bio: "Philip writes about receipts, expense tracking and tax records for Receipt Cycle, for freelancers and small businesses.",
  /** Profiles that exist. Used for the author box links and schema sameAs. */
  links: [
    { label: "X", href: "https://x.com/receiptcycle" },
    { label: "Instagram", href: "https://www.instagram.com/receiptcycle" },
  ],
} as const;
