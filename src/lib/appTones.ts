/**
 * One shared colour palette for app/product tones used by blog comparison tables and pros/cons headers.
 * All class names are written out in full so Tailwind can see them. Text colours are the 800/900 steps,
 * which stay at or above 4.5:1 on the matching 50/100 tints.
 */
export interface AppTone {
  key: string;
  /** Solid dot / badge background. */
  dot: string;
  /** Slim bar fill. */
  bar: string;
  /** Soft row tint and the alternate (slightly stronger) tint. */
  tint: string;
  tintAlt: string;
  /** Thin left border colour (border-l-4 is added by the caller). */
  border: string;
  /** Left-side-only border colour, for use with border-l-4. */
  borderL: string;
  /** Readable text colour on the tint. */
  text: string;
  /** Badge: light background + readable text + ring. */
  badge: string;
}

const TONES: Record<string, AppTone> = {
  teal: {
    key: "teal",
    dot: "bg-teal-600",
    bar: "bg-teal-600",
    tint: "bg-teal-50",
    tintAlt: "bg-teal-100/60",
    border: "border-teal-600",
    borderL: "border-l-teal-600",
    text: "text-teal-900",
    badge: "bg-teal-50 text-teal-900 ring-teal-200",
  },
  blue: {
    key: "blue",
    dot: "bg-blue-600",
    bar: "bg-blue-600",
    tint: "bg-blue-50",
    tintAlt: "bg-blue-100/60",
    border: "border-blue-600",
    borderL: "border-l-blue-600",
    text: "text-blue-900",
    badge: "bg-blue-50 text-blue-900 ring-blue-200",
  },
  amber: {
    key: "amber",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
    tint: "bg-amber-50",
    tintAlt: "bg-amber-100/60",
    border: "border-amber-500",
    borderL: "border-l-amber-500",
    text: "text-amber-900",
    badge: "bg-amber-50 text-amber-900 ring-amber-200",
  },
  violet: {
    key: "violet",
    dot: "bg-violet-600",
    bar: "bg-violet-600",
    tint: "bg-violet-50",
    tintAlt: "bg-violet-100/60",
    border: "border-violet-600",
    borderL: "border-l-violet-600",
    text: "text-violet-900",
    badge: "bg-violet-50 text-violet-900 ring-violet-200",
  },
  rose: {
    key: "rose",
    dot: "bg-rose-600",
    bar: "bg-rose-600",
    tint: "bg-rose-50",
    tintAlt: "bg-rose-100/60",
    border: "border-rose-600",
    borderL: "border-l-rose-600",
    text: "text-rose-900",
    badge: "bg-rose-50 text-rose-900 ring-rose-200",
  },
  sky: {
    key: "sky",
    dot: "bg-sky-500",
    bar: "bg-sky-500",
    tint: "bg-sky-50",
    tintAlt: "bg-sky-100/60",
    border: "border-sky-500",
    borderL: "border-l-sky-500",
    text: "text-sky-900",
    badge: "bg-sky-50 text-sky-900 ring-sky-200",
  },
  green: {
    key: "green",
    dot: "bg-green-600",
    bar: "bg-green-600",
    tint: "bg-green-50",
    tintAlt: "bg-green-100/60",
    border: "border-green-600",
    borderL: "border-l-green-600",
    text: "text-green-900",
    badge: "bg-green-50 text-green-900 ring-green-200",
  },
  slate: {
    key: "slate",
    dot: "bg-slate-500",
    bar: "bg-slate-500",
    tint: "bg-slate-50",
    tintAlt: "bg-slate-100/70",
    border: "border-slate-400",
    borderL: "border-l-slate-400",
    text: "text-slate-900",
    badge: "bg-slate-50 text-slate-800 ring-slate-200",
  },
};

const APP_TONE_KEYS: Array<[string, string]> = [
  ["receipt cycle", "teal"],
  ["expensify", "blue"],
  ["shoeboxed", "amber"],
  ["wave", "violet"],
  ["zoho", "rose"],
  ["freshbooks", "sky"],
  ["quickbooks", "green"],
];

/** Tone for an app name (case-insensitive, matches "QuickBooks Online", "Zoho Expense", ...). Unknown names get slate. */
export function appTone(name: string): AppTone {
  const n = name.trim().toLowerCase();
  const hit = APP_TONE_KEYS.find(([needle]) => n === needle || n.startsWith(`${needle} `) || n.includes(needle));
  return TONES[hit ? hit[1] : "slate"];
}

export function isOurProduct(name: string): boolean {
  return name.trim().toLowerCase() === "receipt cycle";
}

export function overallScore(scores: number[]): number {
  if (!scores.length) return 0;
  return Math.round(scores.reduce((sum, n) => sum + n, 0) / scores.length);
}
