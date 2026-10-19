/**
 * Per-route SEO metadata + JSON-LD. Used by:
 *   - the `<Seo>` component at runtime (SPA nav updates),
 *   - `scripts/prerender.mjs` at build time (per-route HTML w/ correct head),
 *   - `scripts/generate-seo-assets.mjs` (sitemap.xml, robots.txt, llms.txt, llms-full.txt).
 *
 * All JSON-LD is produced by `src/lib/schema.ts` from the data below, so the markup cannot drift from the
 * page copy. Keep this file framework-free (no React, no "@/" imports) so the build scripts can bundle it.
 */
import { BLOG_POSTS, type BlogPost } from "./blogPosts";
import { SITE_FAQ_ITEMS } from "./siteFaq";
import { LANDING_PAGES } from "./landingPages";
import { landingFaqs } from "./landingFaqs";
import { overallScore } from "../lib/appTones";
import { extractInlineLinks, hostnameOf, isInternalHref, stripInlineLinks, tokenizeInline } from "../lib/blogMarkdown";
import { PAYWALL_PRICING, PAYWALL_TIER_FEATURES, formatUsd } from "../lib/pricingPaywall";
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
  buildPageGraph,
  countWords,
  pageUrl,
  type CitationRef,
  type ImageRef,
  type Jsonld,
  type PageKind,
} from "../lib/schema";

export { SITE_URL, SITE_NAME };
export const DEFAULT_OG = DEFAULT_OG_IMAGE.url;
export type { Jsonld };

export type ChangeFreq = "daily" | "weekly" | "monthly" | "yearly";

export interface ArticleMeta {
  publishedTime: string;
  modifiedTime: string;
  section: string;
  tags: string[];
}

export interface RouteSeo {
  path: string;
  title: string;
  description: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogType?: "website" | "article";
  structuredData?: Jsonld[];
  /** Plain-text body injected into <noscript> for JS-less crawlers. */
  noscriptHtml?: string;
  /** Tell crawlers not to index the page (no schema is emitted for these routes). */
  noindex?: boolean;
  /** Article facts for og:article:* meta tags. */
  article?: ArticleMeta;
  /** Sitemap facts. Only indexable routes carry them. */
  dateModified?: string;
  changefreq?: ChangeFreq;
  priority?: number;
  /** What the page is, for llms.txt / llms-full.txt. */
  kind?: PageKind;
  /** One-line plain-language description for AI-facing files. */
  summary?: string;
}

/** Real "last updated" dates. Update these when the page content changes meaningfully. */
export const PAGE_DATES = {
  home: "2026-10-12",
  about: "2026-10-12",
  contact: "2026-10-12",
  faq: "2026-10-05",
  pricing: "2026-10-16",
  /** Mirrors the "Last updated" line on each legal page (checked by a test). */
  privacy: "2026-10-16",
  deleteAccount: "2026-10-16",
  terms: "2026-02-02",
  refundPolicy: "2026-10-08",
  cookies: "2026-04-09",
} as const;

/** Signed-in app screens and auth flows. Never indexed, never in the sitemap, disallowed in robots.txt. */
export const PRIVATE_ROUTE_PATHS: readonly string[] = [
  "/signin",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/checkout-return",
  "/onboarding",
  "/dashboard",
  "/transactions",
  "/insights",
  "/budgets",
  "/accounts",
  "/categories",
  "/sales",
  "/customers",
  "/items-services",
  "/business-profile",
  "/invoice-settings",
  "/invoices",
  "/estimates",
  "/payments",
  "/reports",
  "/reports/cash-flow",
  "/reports/overdue",
  "/ai-assistant",
  "/notifications",
  "/subscription",
  "/profile",
  "/more",
  "/upload-statement",
  "/settings",
  "/backup-export",
  "/admin",
];

/** Public utility pages that exist but should not appear in search results. */
export const NOINDEX_PUBLIC_PATHS: readonly string[] = ["/impressum", "/cookie-settings", "/do-not-sell"];

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    if (c === "&") return "&amp;";
    if (c === "<") return "&lt;";
    if (c === ">") return "&gt;";
    if (c === '"') return "&quot;";
    return "&#39;";
  });
}

function noscriptWrap(title: string, innerHtml: string): string {
  return `<div style="font-family:Inter,system-ui,-apple-system,sans-serif;max-width:760px;margin:40px auto;padding:24px;color:#0f172a">
  <header><a href="/" style="color:#0f766e;text-decoration:none;font-weight:600">Receipt Cycle</a></header>
  <h1 style="margin:18px 0 12px 0;font-size:28px">${escapeHtml(title)}</h1>
  ${innerHtml}
  <nav style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:14px">
    <a href="/">Home</a> · <a href="/about">About</a> · <a href="/blog">Blog</a> ·
    <a href="/pricing">Pricing</a> · <a href="/faq">FAQ</a> · <a href="/contact">Contact</a>
  </nav>
</div>`;
}

/* ------------------------------------------------------------------------------------------------ */
/* Blog                                                                                              */
/* ------------------------------------------------------------------------------------------------ */

/** Plain-text of everything a reader sees in the article body (used for wordCount). Inline links count as their label only. */
export function blogPostText(post: BlogPost): string {
  const t = stripInlineLinks;
  const parts: string[] = [post.title, t(post.tldr), ...(post.keyTakeaways ?? []).map(t)];
  for (const b of post.body) {
    if (b.kind === "p" || b.kind === "h2" || b.kind === "h3" || b.kind === "h4") parts.push(t(b.text));
    else if (b.kind === "ul" || b.kind === "ol") parts.push(...b.items.map(t));
    else if (b.kind === "quote") parts.push(t(b.text));
    else if (b.kind === "callout") parts.push(b.title, t(b.text));
    else if (b.kind === "cta") parts.push(b.title, t(b.text), b.label, ...(b.note ? [t(b.note)] : []));
    else if (b.kind === "image" && b.caption) parts.push(t(b.caption));
    else if (b.kind === "links") parts.push(b.title, ...b.items.map((i) => i.label));
    else if (b.kind === "table") parts.push(b.caption, ...b.columns, ...b.rows.flat().map(t));
    else if (b.kind === "scoreTable") {
      parts.push(b.caption, ...b.columns, "Overall");
      for (const row of b.rows) {
        parts.push(row.app, ...row.scores.map((n) => `${n}%`), `${overallScore(row.scores)}%`);
      }
      if (b.note) parts.push(t(b.note));
    }
  }
  for (const item of post.faq ?? []) parts.push(item.question, t(item.answer));
  return parts.join(" ");
}

/** Every string in the article that may carry [label](href) links. */
function inlineTexts(post: BlogPost): string[] {
  const out: string[] = [post.tldr, ...(post.keyTakeaways ?? [])];
  for (const b of post.body) {
    if (b.kind === "p" || b.kind === "quote" || b.kind === "callout") out.push(b.text);
    else if (b.kind === "ul" || b.kind === "ol") out.push(...b.items);
    else if (b.kind === "table") out.push(...b.rows.flat());
    else if (b.kind === "cta") out.push(b.text, ...(b.note ? [b.note] : []));
    else if (b.kind === "scoreTable" && b.note) out.push(b.note);
    else if (b.kind === "image" && b.caption) out.push(b.caption);
  }
  for (const item of post.faq ?? []) out.push(item.answer);
  return out;
}

function isExternalSource(href: string): boolean {
  return /^https:\/\//.test(href) && hostnameOf(href) !== "receiptcycle.com";
}

const BLOG_SECTIONS: Record<string, string> = {
  "maximize-tax-refund-by-scanning-receipts": "Tax records",
  "best-receipt-scanner-app-small-business-2026": "Receipt scanning",
  "freelancers-guide-tracking-business-expenses": "Expense tracking",
  "go-paperless-with-receipts": "Receipt scanning",
  "gig-workers-income-expense-guide": "Expense tracking",
  "scan-receipts-for-tax-refund": "Expense tracking",
  "best-expense-tracker-for-freelancers": "Tax records",
  "catch-subscription-creep": "Tax records",
  "import-bank-statements-expense-tracking": "Expense tracking",
  "what-is-a-receipt-scanner-freelancers-2026": "Receipt scanning",
  "receipt-scanner-tax-purposes-audit-ready-year-round": "Tax records",
  "expense-tracker-receipt-scanner-one-two-punch": "Receipt scanning",
  "how-ocr-receipt-scanning-works-ai-smarter": "AI and automation",
  "ai-in-finance-personal-business-money-management": "AI and automation",
};

export function blogSection(post: BlogPost): string {
  return BLOG_SECTIONS[post.slug] ?? "Expense tracking";
}

/** External sources that the article really links to. */
export function blogCitations(post: BlogPost): CitationRef[] {
  const out: CitationRef[] = (post.citations ?? []).map((citation) => ({
    name: citation.label,
    url: citation.href,
  }));
  const add = (name: string, url: string) => {
    if (!out.some((c) => c.url === url)) out.push({ name, url });
  };
  for (const r of post.resources ?? []) if (isExternalSource(r.href)) add(r.label, r.href);
  for (const b of post.body) {
    if (b.kind !== "links") continue;
    for (const item of b.items) {
      if (item.external && /^https:\/\//.test(item.href)) add(item.label, item.href);
    }
  }
  // External sources linked inline as [label](https://...). Internal links never count as citations.
  for (const text of inlineTexts(post)) {
    for (const link of extractInlineLinks(text)) {
      if (!isInternalHref(link.href) && isExternalSource(link.href)) add(link.label, link.href);
    }
  }
  return out;
}

/** Every blog feature image is a 1600 x 900 WebP (checked by a test). */
export const BLOG_IMAGE_SIZE = { width: 1600, height: 900 } as const;

export function blogImageUrl(post: BlogPost): string {
  return post.featuredImage.startsWith("http") ? post.featuredImage : `${SITE_URL}${post.featuredImage}`;
}

/** Escaped HTML for text that may contain [label](href) links. */
function inlineHtml(text: string): string {
  return tokenizeInline(text)
    .map((tok) => {
      if (tok.type === "text") return escapeHtml(tok.text);
      const attrs = isInternalHref(tok.href) ? "" : ` target="_blank" rel="noopener noreferrer"`;
      return `<a href="${escapeHtml(tok.href)}"${attrs}>${escapeHtml(tok.label)}</a>`;
    })
    .join("");
}

function blogPostNoscript(post: BlogPost): string {
  const body = post.body
    .map((b) => {
      if (b.kind === "p") return `<p>${inlineHtml(b.text)}</p>`;
      if (b.kind === "h2") return `<h2 id="${b.id}">${escapeHtml(b.text)}</h2>`;
      if (b.kind === "h3") return `<h3 id="${b.id}">${escapeHtml(b.text)}</h3>`;
      if (b.kind === "h4") return `<h4 id="${b.id}">${escapeHtml(b.text)}</h4>`;
      if (b.kind === "image") {
        const safeSrc = escapeHtml(b.src);
        const safeAlt = escapeHtml(b.alt);
        const caption = b.caption ? `<figcaption>${inlineHtml(b.caption)}</figcaption>` : "";
        const size = `${b.width ? ` width="${b.width}"` : ""}${b.height ? ` height="${b.height}"` : ""}${b.title ? ` title="${escapeHtml(b.title)}"` : ""}`;
        const img = `<img src="${safeSrc}" alt="${safeAlt}"${size}/>`;
        const linked = b.href ? `<a href="${escapeHtml(b.href)}">${img}</a>` : img;
        return `<figure>${linked}${caption}</figure>`;
      }
      if (b.kind === "links") {
        return `<section><h3>${escapeHtml(b.title)}</h3><ul>${b.items
          .map((item) => {
            const safeHref = escapeHtml(item.href);
            const safeLabel = escapeHtml(item.label);
            const attrs = item.external ? ` target="_blank" rel="noopener noreferrer"` : "";
            return `<li><a href="${safeHref}"${attrs}>${safeLabel}</a></li>`;
          })
          .join("")}</ul></section>`;
      }
      if (b.kind === "table") {
        const head = b.columns.map((column) => `<th scope="col">${escapeHtml(column)}</th>`).join("");
        const rows = b.rows
          .map((row) => `<tr>${row.map((cell, index) => index === 0 ? `<th scope="row">${inlineHtml(cell)}</th>` : `<td>${inlineHtml(cell)}</td>`).join("")}</tr>`)
          .join("");
        return `<table><caption>${escapeHtml(b.caption)}</caption><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
      }
      if (b.kind === "ul") return `<ul>${b.items.map((i) => `<li>${inlineHtml(i)}</li>`).join("")}</ul>`;
      if (b.kind === "ol") return `<ol>${b.items.map((i) => `<li>${inlineHtml(i)}</li>`).join("")}</ol>`;
      if (b.kind === "quote")
        return `<blockquote>${inlineHtml(b.text)}${b.cite ? `<footer>${escapeHtml(b.cite)}</footer>` : ""}</blockquote>`;
      if (b.kind === "cta")
        return `<aside><strong>${escapeHtml(b.title)}</strong><p>${inlineHtml(b.text)}</p><p><a href="${escapeHtml(b.href)}">${escapeHtml(b.label)}</a></p>${b.note ? `<p>${inlineHtml(b.note)}</p>` : ""}</aside>`;
      if (b.kind === "scoreTable") {
        const head = ["App", ...b.columns, "Overall"].map((column) => `<th scope="col">${escapeHtml(column)}</th>`).join("");
        const rows = b.rows
          .map(
            (row) =>
              `<tr><th scope="row">${escapeHtml(row.app)}</th>${row.scores.map((n) => `<td>${n}%</td>`).join("")}<td>${overallScore(row.scores)}%</td></tr>`,
          )
          .join("");
        return `<table><caption>${escapeHtml(b.caption)}</caption><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>${b.note ? `<p>${inlineHtml(b.note)}</p>` : ""}`;
      }
      return `<aside><strong>${escapeHtml(b.title)}</strong><p>${inlineHtml(b.text)}</p></aside>`;
    })
    .join("\n");
  const takeaways = post.keyTakeaways?.length
    ? `<section id="short-version"><h2>Key Takeaways</h2><ul>${post.keyTakeaways.map((item) => `<li>${inlineHtml(item)}</li>`).join("")}</ul></section>`
    : "";
  const faq = post.faq?.length
    ? `<section id="frequently-asked-questions"><h2>Frequently asked questions</h2>${post.faq.map((item) => `<h3>${escapeHtml(item.question)}</h3><p>${inlineHtml(item.answer)}</p>`).join("")}</section>`
    : "";
  const resourceItems = post.resources ?? (post.citations ?? []).map((c) => ({ ...c, note: undefined as string | undefined }));
  const resources = resourceItems.length
    ? `<section id="resources"><h2>Resources and sources</h2><ul>${resourceItems
        .map((r) => `<li><a href="${escapeHtml(r.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.label)}</a>${r.note ? ` ${escapeHtml(r.note)}` : ""}</li>`)
        .join("")}</ul></section>`
    : "";
  const inner = `<p data-speakable="summary"><em>${inlineHtml(post.tldr)}</em></p>${takeaways}${body}${faq}${resources}`;
  return noscriptWrap(post.title, inner);
}

function latestBlogModified(): string {
  return BLOG_POSTS.reduce((max, p) => (p.dateModified > max ? p.dateModified : max), "0000-00-00");
}

function blogRoute(post: BlogPost): RouteSeo {
  const path = `/blog/${post.slug}`;
  const image: ImageRef = {
    url: blogImageUrl(post),
    width: post.featuredImageWidth ?? BLOG_IMAGE_SIZE.width,
    height: post.featuredImageHeight ?? BLOG_IMAGE_SIZE.height,
    alt: post.featuredImageAlt ?? post.title,
    name: post.title,
  };
  const bodyImages: ImageRef[] = [];
  for (const b of post.body) {
    if (b.kind !== "image" || !b.width || !b.height) continue;
    const url = b.src.startsWith("http") ? b.src : `${SITE_URL}${b.src}`;
    if (!url.startsWith(`${SITE_URL}/`) || url === image.url || bodyImages.some((i) => i.url === url)) continue;
    bodyImages.push({ url, width: b.width, height: b.height, alt: stripInlineLinks(b.caption ?? b.alt), name: b.title ?? b.alt });
  }
  return {
    path,
    title: `${post.title} | ${SITE_NAME}`,
    description: post.description,
    ogImage: image.url,
    ogImageAlt: image.alt,
    ogImageWidth: image.width,
    ogImageHeight: image.height,
    ogType: "article",
    kind: "article",
    summary: stripInlineLinks(post.tldr),
    dateModified: post.dateModified,
    changefreq: "monthly",
    priority: 0.7,
    article: {
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified,
      section: blogSection(post),
      tags: post.tags,
    },
    structuredData: buildPageGraph({
      path,
      kind: "article",
      name: post.title,
      description: post.description,
      image,
      datePublished: post.datePublished,
      dateModified: post.dateModified,
      breadcrumb: [
        { name: "Home", path: "/" },
        { name: "Blog", path: "/blog" },
        { name: post.title, path },
      ],
      speakable: ["h1", "[data-speakable='summary']"],
      faq: post.faq?.map((item) => ({ q: item.question, a: stripInlineLinks(item.answer) })),
      article: {
        slug: post.slug,
        headline: post.title,
        description: post.description,
        image,
        images: bodyImages,
        datePublished: post.datePublished,
        dateModified: post.dateModified,
        authorName: post.author,
        keywords: post.tags,
        section: blogSection(post),
        wordCount: countWords(blogPostText(post)),
        minutes: post.readMinutes,
        citations: blogCitations(post),
      },
    }),
    noscriptHtml: blogPostNoscript(post),
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* Static routes                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

const HOME_SUMMARY =
  "Receipt Cycle brings receipts, expenses, customers, estimates, invoices, payment records, budgets, and reports into one workspace on the web and Android.";

function landingRoute(lp: (typeof LANDING_PAGES)[number]): RouteSeo {
  return {
    path: lp.path,
    title: lp.title,
    description: lp.description,
    ogImage: `${SITE_URL}${lp.ogImagePath}`,
    ogImageAlt: lp.ogImageAlt,
    kind: "landing",
    summary: lp.summary,
    dateModified: lp.dateModified,
    changefreq: "monthly",
    priority: 0.9,
    structuredData: buildPageGraph({
      path: lp.path,
      kind: "landing",
      name: lp.name,
      description: lp.description,
      image: { url: `${SITE_URL}${lp.ogImagePath}`, width: 1200, height: 630, alt: lp.ogImageAlt },
      dateModified: lp.dateModified,
      breadcrumb: [
        { name: "Home", path: "/" },
        { name: lp.breadcrumbName, path: lp.path },
      ],
      faq: landingFaqs(lp.path),
      featureList: lp.featureList,
      topic: lp.topic,
      speakable: ["h1", "h1 + p"],
    }),
    noscriptHtml: noscriptWrap(lp.noscriptTitle, lp.noscriptBody),
  };
}

function pricingNoscript(): string {
  const { monthlyUsd, yearlyUsd, lifetimeUsd, trialDays } = PAYWALL_PRICING;
  const list = (items: readonly string[]) => `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
  return `<p>Receipt Cycle has a free plan, monthly and yearly Pro plans, and a one-time Pro Lifetime plan. Payments are processed by Polar and subscriptions can be cancelled from your account.</p>
       <h2>Free: ${formatUsd(0)}</h2>${list(PAYWALL_TIER_FEATURES.free)}
       <h2>Pro Monthly: ${formatUsd(monthlyUsd)} per month, with a ${trialDays}-day free trial</h2>${list(PAYWALL_TIER_FEATURES.monthly)}
       <h2>Pro Yearly: ${formatUsd(yearlyUsd)} per year, with a ${trialDays}-day free trial</h2>${list(PAYWALL_TIER_FEATURES.yearly)}
       <h2>Pro Lifetime: ${formatUsd(lifetimeUsd)} one time</h2>${list(PAYWALL_TIER_FEATURES.lifetime)}`;
}

function simplePage(opts: {
  path: string;
  kind: PageKind;
  title: string;
  name: string;
  description: string;
  dateModified: string;
  changefreq: ChangeFreq;
  priority: number;
  noscript?: string;
  faq?: readonly { q: string; a: string }[];
  speakable?: string[];
  breadcrumb?: boolean;
  extra?: Partial<Parameters<typeof buildPageGraph>[0]>;
  summary?: string;
}): RouteSeo {
  return {
    path: opts.path,
    title: opts.title,
    description: opts.description,
    kind: opts.kind,
    summary: opts.summary ?? opts.description,
    dateModified: opts.dateModified,
    changefreq: opts.changefreq,
    priority: opts.priority,
    structuredData: buildPageGraph({
      path: opts.path,
      kind: opts.kind,
      name: opts.name,
      description: opts.description,
      dateModified: opts.dateModified,
      breadcrumb:
        opts.breadcrumb === false
          ? undefined
          : [
              { name: "Home", path: "/" },
              { name: opts.name, path: opts.path },
            ],
      faq: opts.faq,
      speakable: opts.speakable,
      ...opts.extra,
    }),
    ...(opts.noscript ? { noscriptHtml: opts.noscript } : {}),
  };
}

const faqAsEntries = SITE_FAQ_ITEMS.map((i) => ({ q: i.q, a: i.a }));

const staticRoutes: RouteSeo[] = [
  simplePage({
    path: "/",
    kind: "home",
    title: "Receipt Cycle | Connected Business Records and Billing",
    name: "Receipt Cycle: connected business records and billing",
    description:
      "Capture receipts, organize expenses, prepare estimates and invoices, record payments, set budgets, and review business activity in one connected workspace.",
    dateModified: PAGE_DATES.home,
    changefreq: "weekly",
    priority: 1.0,
    breadcrumb: false,
    faq: landingFaqs("/"),
    speakable: ["h1", "h1 + p"],
    summary: HOME_SUMMARY,
    noscript: noscriptWrap(
      "Keep the money side of your business connected",
      `<p>Receipt Cycle brings business records and billing into one practical workspace for freelancers, consultants, small businesses, and operations teams.</p>
       <ul>
         <li>Capture receipts and organize expense records.</li>
         <li>Prepare estimates and customer invoices.</li>
         <li>Record payments and remaining balances.</li>
         <li>Set budgets and review reports.</li>
         <li>Ask questions based on saved business records.</li>
       </ul>`,
    ),
  }),
  ...LANDING_PAGES.map(landingRoute),
  simplePage({
    path: "/about",
    kind: "about",
    title: "About Receipt Cycle | Why We Built an AI Expense Tracker",
    name: "About Receipt Cycle",
    description:
      "Why Receipt Cycle exists, who it's for, and the principles that guide how we build an AI receipt scanner and expense tracker people actually use.",
    dateModified: PAGE_DATES.about,
    changefreq: "monthly",
    priority: 0.6,
    noscript: noscriptWrap(
      "About Receipt Cycle",
      `<p>Receipt Cycle is an AI-powered expense tracker and receipt scanner built for freelancers, independent professionals, and small teams.</p>
       <p>We started Receipt Cycle because finance tools fail when capture is harder than ignoring the problem. Our goal is simple: compress the grind of bookkeeping so you can justify every dollar, reclaim tax-time hours, and catch money leaks while they're still small.</p>
       <p>Contact us at <a href="mailto:support@receiptcycle.com">support@receiptcycle.com</a>.</p>`,
    ),
  }),
  {
    path: "/blog",
    title: "Receipt Cycle Blog | Expense Tracking, Tax Tips, and Receipt Scanning",
    description:
      "Practical articles on receipt scanning, expense tracking, tax preparation for freelancers, and how to catch money leaks before they drain your business.",
    kind: "blogIndex",
    summary: "Practical guides on receipt scanning, expense tracking, and tax-time record keeping.",
    dateModified: latestBlogModified(),
    changefreq: "weekly",
    priority: 0.8,
    structuredData: buildPageGraph({
      path: "/blog",
      kind: "blogIndex",
      name: "Receipt Cycle Blog",
      description:
        "Practical articles on receipt scanning, expense tracking, tax preparation for freelancers, and how to catch money leaks before they drain your business.",
      dateModified: latestBlogModified(),
      breadcrumb: [
        { name: "Home", path: "/" },
        { name: "Blog", path: "/blog" },
      ],
      blogItems: BLOG_POSTS.map((p) => ({
        slug: p.slug,
        title: p.title,
        description: p.description,
        datePublished: p.datePublished,
        dateModified: p.dateModified,
        author: p.author,
      })),
    }),
    noscriptHtml: noscriptWrap(
      "Receipt Cycle Blog",
      `<p>Practical articles on expense tracking, receipt scanning, and catching money leaks.</p>
       <ul>${BLOG_POSTS.map(
          (p) => `<li><a href="/blog/${p.slug}"><strong>${escapeHtml(p.title)}</strong></a>: ${escapeHtml(p.description)}</li>`,
        ).join("")}</ul>`,
    ),
  },
  simplePage({
    path: "/pricing",
    kind: "pricing",
    title: "Pricing | Receipt Cycle Free, Pro Monthly, Yearly, and Lifetime",
    name: "Receipt Cycle pricing",
    description: `Receipt Cycle is free to start with a ${PAYWALL_PRICING.trialDays}-day Pro trial and up to 25 transactions. Pro costs ${formatUsd(PAYWALL_PRICING.monthlyUsd)} per month or ${formatUsd(PAYWALL_PRICING.yearlyUsd)} per year, both with a ${PAYWALL_PRICING.trialDays}-day free trial, or ${formatUsd(PAYWALL_PRICING.lifetimeUsd)} once for Pro Lifetime.`,
    dateModified: PAGE_DATES.pricing,
    changefreq: "monthly",
    priority: 0.8,
    speakable: ["h1"],
    noscript: noscriptWrap("Receipt Cycle pricing", pricingNoscript()),
  }),
  simplePage({
    path: "/faq",
    kind: "faq",
    title: "FAQ | Receipt Cycle",
    name: "Receipt Cycle frequently asked questions",
    description:
      "Answers to common questions about Receipt Cycle: web and Android access, receipt scanning, estimates and invoices, payments, budgets, AI, data and support.",
    dateModified: PAGE_DATES.faq,
    changefreq: "monthly",
    priority: 0.7,
    faq: faqAsEntries,
    speakable: ["h1"],
    noscript: noscriptWrap(
      "Frequently asked questions",
      `<dl>${SITE_FAQ_ITEMS.map((i) => `<dt><strong>${escapeHtml(i.q)}</strong></dt><dd>${escapeHtml(i.a)}</dd>`).join("")}</dl>`,
    ),
  }),
  simplePage({
    path: "/contact",
    kind: "contact",
    title: "Contact Receipt Cycle | We Reply in One Business Day",
    name: "Contact Receipt Cycle",
    description:
      "Reach the Receipt Cycle team for support, billing, partnerships, or press. We reply to every email within one business day.",
    dateModified: PAGE_DATES.contact,
    changefreq: "yearly",
    priority: 0.5,
    noscript: noscriptWrap(
      "Contact us",
      `<p>Email <a href="mailto:support@receiptcycle.com">support@receiptcycle.com</a>. We reply within one business day.</p>`,
    ),
  }),
  simplePage({
    path: "/privacy",
    kind: "legal",
    title: "Privacy Policy | Receipt Cycle",
    name: "Privacy Policy",
    description:
      "How Receipt Cycle collects, uses, shares, and protects personal information, and how to access, correct, or delete your data.",
    dateModified: PAGE_DATES.privacy,
    changefreq: "yearly",
    priority: 0.3,
  }),
  simplePage({
    path: "/delete-account",
    kind: "legal",
    title: "Delete Your Account | Receipt Cycle",
    name: "Delete your Receipt Cycle account",
    description:
      "How to delete your Receipt Cycle account and the data stored with it, from the Android app, the website, or by email.",
    dateModified: PAGE_DATES.deleteAccount,
    changefreq: "yearly",
    priority: 0.3,
  }),
  simplePage({
    path: "/terms",
    kind: "legal",
    title: "Terms of Service | Receipt Cycle",
    name: "Terms of Service",
    description: "Terms of service for the Receipt Cycle web and Android apps.",
    dateModified: PAGE_DATES.terms,
    changefreq: "yearly",
    priority: 0.3,
  }),
  simplePage({
    path: "/refund-policy",
    kind: "legal",
    title: "Refund Policy | Receipt Cycle",
    name: "Refund Policy",
    description: "Refund and cancellation policy for Receipt Cycle Pro Monthly, Pro Yearly and Pro Lifetime plans.",
    dateModified: PAGE_DATES.refundPolicy,
    changefreq: "yearly",
    priority: 0.3,
  }),
  simplePage({
    path: "/cookies",
    kind: "legal",
    title: "Cookie Policy | Receipt Cycle",
    name: "Cookie Policy",
    description: "How Receipt Cycle uses cookies on the public website and the web app.",
    dateModified: PAGE_DATES.cookies,
    changefreq: "yearly",
    priority: 0.3,
  }),
  // Utility pages that stay out of search results: no schema, noindex.
  ...NOINDEX_PUBLIC_PATHS.map<RouteSeo>((path) => ({
    path,
    title: `${path === "/impressum" ? "Impressum" : path === "/cookie-settings" ? "Cookie Settings" : "Do Not Sell or Share My Personal Information"} | ${SITE_NAME}`,
    description: "Receipt Cycle legal and privacy information.",
    noindex: true,
  })),
];

/** App screens that must never be indexed. */
export function privateRoutes(): RouteSeo[] {
  return PRIVATE_ROUTE_PATHS.map<RouteSeo>((path) => ({
    path,
    title: `${SITE_NAME} app`,
    description: "Sign in to Receipt Cycle to manage receipts, expenses, estimates, invoices, payments, budgets, and reports.",
    noindex: true,
  }));
}

export function getRouteSeo(path: string): RouteSeo | undefined {
  const normalized = path.replace(/\/$/, "") || "/";
  return staticRoutes.find((r) => (r.path === "/" ? normalized === "/" : r.path === normalized));
}

/** Every public route we prerender (indexable pages and noindex utility pages). */
export function allPrerenderRoutes(): RouteSeo[] {
  return [...staticRoutes, ...BLOG_POSTS.map(blogRoute)];
}

/** Routes that belong in sitemap.xml: indexable, with real dates. */
export function indexableRoutes(): RouteSeo[] {
  return allPrerenderRoutes().filter((r) => !r.noindex);
}

export function getBlogPostSeo(slug: string): RouteSeo | undefined {
  return allPrerenderRoutes().find((r) => r.path === `/blog/${slug}`);
}

export { BLOG_POSTS, SITE_FAQ_ITEMS, LANDING_PAGES, landingFaqs, pageUrl };
