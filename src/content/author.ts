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
  bio: "Philip works in finance at a large company and writes about receipts, expense tracking and tax records for freelancers and small businesses.",
  /** Philip's own profiles, confirmed by the owner. Used for the author box and schema sameAs. */
  links: [
    { label: "YouTube", href: "https://www.youtube.com/channel/UCjurliHBAEnQwcvLO9twIpw" },
    { label: "Instagram", href: "https://www.instagram.com/learnwithphiliphustle" },
    { label: "Pinterest", href: "https://www.pinterest.com/LearnWithPhilipHustle/" },
    { label: "Facebook", href: "https://www.facebook.com/PhilipHustles" },
  ],
  /** The Receipt Cycle company channel. */
  companyYoutube: "https://www.youtube.com/@receiptcycle",
} as const;
