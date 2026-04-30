/**
 * Per-route SEO metadata + JSON-LD. Used by:
 *   - the `<Seo>` component at runtime (SPA nav updates),
 *   - `scripts/prerender.mjs` at build time (per-route HTML w/ correct head).
 *
 * Keep this file framework-free (no React, no imports from src/*) so the
 * build-time prerender script can import it directly with esbuild/tsx.
 */
import { BLOG_POSTS, type BlogPost } from "./blogPosts";
import { SITE_FAQ_ITEMS } from "./siteFaq";

export const SITE_URL = "https://receiptcycle.com";
export const SITE_NAME = "Receipt Cycle";
export const DEFAULT_OG = `${SITE_URL}/og-image.png?v=3`;

export type Jsonld = Record<string, unknown>;

export interface RouteSeo {
  path: string;
  title: string;
  description: string;
  ogImage?: string;
  ogType?: "website" | "article";
  structuredData?: Jsonld[];
  /** Plain-text body injected into <noscript> for JS-less crawlers. */
  noscriptHtml?: string;
}

const organization: Jsonld = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512.png?v=3`,
  email: "support@receiptcycle.com",
  sameAs: ["https://x.com/receiptcycle", "https://www.instagram.com/receiptcycle"],
};

const softwareApp: Jsonld = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  operatingSystem: "iOS, Android, Web",
  applicationCategory: "FinanceApplication",
  description:
    "AI-powered receipt scanner and expense tracker. Capture purchases, catch money leaks, and keep audit-ready records for tax time.",
  image: DEFAULT_OG,
  url: SITE_URL,
  offers: [
    { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
    { "@type": "Offer", price: "9.99", priceCurrency: "USD", name: "Pro Monthly" },
    { "@type": "Offer", price: "89.99", priceCurrency: "USD", name: "Pro Yearly" },
  ],
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", ratingCount: "124" },
  publisher: { "@type": "Organization", name: SITE_NAME },
};

function breadcrumb(trail: Array<{ name: string; path: string }>): Jsonld {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${SITE_URL}${t.path === "/" ? "/" : t.path}`,
    })),
  };
}

function blogPostSchema(post: BlogPost): Jsonld {
  const postImage = post.featuredImage?.startsWith("http")
    ? post.featuredImage
    : `${SITE_URL}${post.featuredImage}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    author: { "@type": "Organization", name: post.author },
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    image: postImage || DEFAULT_OG,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon-512.png?v=3` },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
    keywords: post.tags.join(", "),
  };
}

function faqSchema(): Jsonld {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: SITE_FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

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

function blogPostNoscript(post: BlogPost): string {
  const body = post.body
    .map((b) => {
      if (b.kind === "p") return `<p>${escapeHtml(b.text)}</p>`;
      if (b.kind === "h2") return `<h2 id="${b.id}">${escapeHtml(b.text)}</h2>`;
      if (b.kind === "h3") return `<h3 id="${b.id}">${escapeHtml(b.text)}</h3>`;
      if (b.kind === "h4") return `<h4 id="${b.id}">${escapeHtml(b.text)}</h4>`;
      if (b.kind === "image") {
        const safeSrc = escapeHtml(b.src);
        const safeAlt = escapeHtml(b.alt);
        const caption = b.caption ? `<figcaption>${escapeHtml(b.caption)}</figcaption>` : "";
        return `<figure><img src="${safeSrc}" alt="${safeAlt}"/>${caption}</figure>`;
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
      if (b.kind === "ul") return `<ul>${b.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
      if (b.kind === "ol") return `<ol>${b.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ol>`;
      if (b.kind === "quote")
        return `<blockquote>${escapeHtml(b.text)}${b.cite ? `<footer>${escapeHtml(b.cite)}</footer>` : ""}</blockquote>`;
      return `<aside><strong>${escapeHtml(b.title)}</strong><p>${escapeHtml(b.text)}</p></aside>`;
    })
    .join("\n");
  const inner = `<p><em>${escapeHtml(post.tldr)}</em></p>${body}`;
  return noscriptWrap(post.title, inner);
}

const staticRoutes: RouteSeo[] = [
  {
    path: "/",
    title: "Receipt Cycle — AI Receipt Scanner & Expense Tracker",
    description:
      "Scan receipts, track spending automatically, and catch money leaks before they stack. AI expense tracker and budget manager for freelancers and small teams.",
    structuredData: [organization, softwareApp, {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/blog?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    }],
    noscriptHtml: noscriptWrap(
      "Scan once. See your money clearly.",
      `<p>Receipt Cycle is an AI-powered receipt scanner and expense tracker for freelancers and small teams. Scan purchases, catch money leaks, and keep audit-ready records for tax time.</p>
       <ul>
         <li>Receipt OCR that reads merchant, date, amount, and line items.</li>
         <li>Import bank and card statements (CSV/PDF).</li>
         <li>Voice and quick-add transactions.</li>
         <li>AI finance coach grounded in your own ledger.</li>
         <li>Money-leak detection for subscriptions and duplicates.</li>
         <li>Budgets and tax-ready CSV exports.</li>
       </ul>`,
    ),
  },
  {
    path: "/about",
    title: "About Receipt Cycle — Why We Built an AI Expense Tracker",
    description:
      "Why Receipt Cycle exists, who it's for, and the principles that guide how we build an AI receipt scanner and expense tracker people actually use.",
    structuredData: [
      organization,
      breadcrumb([
        { name: "Home", path: "/" },
        { name: "About", path: "/about" },
      ]),
    ],
    noscriptHtml: noscriptWrap(
      "About Receipt Cycle",
      `<p>Receipt Cycle is an AI-powered expense tracker and receipt scanner built for freelancers, independent professionals, and small teams.</p>
       <p>We started Receipt Cycle because finance tools fail when capture is harder than ignoring the problem. Our goal is simple: compress the grind of bookkeeping so you can justify every dollar, reclaim tax-time hours, and catch money leaks while they're still small.</p>
       <p>Contact us at <a href="mailto:support@receiptcycle.com">support@receiptcycle.com</a>.</p>`,
    ),
  },
  {
    path: "/blog",
    title: "Receipt Cycle Blog — Expense Tracking, Tax Tips, and Money Leaks",
    description:
      "Practical articles on receipt scanning, expense tracking, tax preparation for freelancers, and how to catch money leaks before they drain your business.",
    structuredData: [
      organization,
      {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: `${SITE_NAME} Blog`,
        url: `${SITE_URL}/blog`,
        blogPost: BLOG_POSTS.map((p) => ({
          "@type": "BlogPosting",
          headline: p.title,
          url: `${SITE_URL}/blog/${p.slug}`,
          datePublished: p.datePublished,
          dateModified: p.dateModified,
          author: { "@type": "Organization", name: p.author },
          description: p.description,
        })),
      },
      breadcrumb([
        { name: "Home", path: "/" },
        { name: "Blog", path: "/blog" },
      ]),
    ],
    noscriptHtml: noscriptWrap(
      "Receipt Cycle Blog",
      `<p>Practical articles on expense tracking, receipt scanning, and catching money leaks.</p>
       <ul>${BLOG_POSTS.map(
          (p) =>
            `<li><a href="/blog/${p.slug}"><strong>${escapeHtml(p.title)}</strong></a> — ${escapeHtml(p.description)}</li>`,
        ).join("")}</ul>`,
    ),
  },
  {
    path: "/pricing",
    title: "Pricing — Receipt Cycle Free, Pro Monthly, Pro Yearly",
    description:
      "Simple pricing for Receipt Cycle. Start free. Unlock AI finance coach, unlimited scanning, bank imports, and money-leak alerts with Pro Monthly or Pro Yearly.",
    structuredData: [organization, softwareApp],
    noscriptHtml: noscriptWrap(
      "Receipt Cycle Pricing",
      `<ul>
         <li><strong>Free</strong> — basic receipt scanning and transaction tracking.</li>
         <li><strong>Pro Monthly</strong> — unlimited scanning, AI finance coach, bank imports, exports, money-leak alerts.</li>
         <li><strong>Pro Yearly</strong> — same as Pro Monthly, annual discount.</li>
       </ul>`,
    ),
  },
  {
    path: "/faq",
    title: "FAQ — Receipt Cycle",
    description:
      "Answers to common questions about Receipt Cycle: how scanning works, where data is stored, offline support, and how the web and mobile apps fit together.",
    // Keep FAQ page schema focused to avoid unsupported/unnamed rich-result items.
    structuredData: [faqSchema()],
    noscriptHtml: noscriptWrap(
      "Frequently asked questions",
      `<dl>${SITE_FAQ_ITEMS.map(
        (i) => `<dt><strong>${escapeHtml(i.q)}</strong></dt><dd>${escapeHtml(i.a)}</dd>`,
      ).join("")}</dl>`,
    ),
  },
  {
    path: "/contact",
    title: "Contact Receipt Cycle — We Reply in One Business Day",
    description:
      "Reach the Receipt Cycle team for support, billing, partnerships, or press. We reply to every email within one business day.",
    structuredData: [organization],
    noscriptHtml: noscriptWrap(
      "Contact us",
      `<p>Email <a href="mailto:support@receiptcycle.com">support@receiptcycle.com</a>. We reply within one business day.</p>`,
    ),
  },
  {
    path: "/privacy",
    title: "Privacy Policy — Receipt Cycle",
    description:
      "How Receipt Cycle collects, uses, and protects your data. Encryption at rest and in transit, user-controlled deletion, GDPR/CCPA compliance.",
    structuredData: [organization],
  },
  {
    path: "/terms",
    title: "Terms of Service — Receipt Cycle",
    description: "Terms of service for Receipt Cycle web and mobile apps.",
    structuredData: [organization],
  },
  {
    path: "/refund-policy",
    title: "Refund Policy — Receipt Cycle",
    description:
      "Our refund policy for Receipt Cycle Pro Monthly and Pro Yearly plans.",
    structuredData: [organization],
  },
  {
    path: "/cookies",
    title: "Cookie Policy — Receipt Cycle",
    description: "How Receipt Cycle uses cookies on the marketing site and the web app.",
    structuredData: [organization],
  },
];

export function getRouteSeo(path: string): RouteSeo | undefined {
  const normalized = path.replace(/\/$/, "") || "/";
  return staticRoutes.find((r) => (r.path === "/" ? normalized === "/" : r.path === normalized));
}

export function allPrerenderRoutes(): RouteSeo[] {
  const blog = BLOG_POSTS.map<RouteSeo>((post) => ({
    path: `/blog/${post.slug}`,
    title: `${post.title} — Receipt Cycle`,
    description: post.description,
    ogImage: post.featuredImage?.startsWith("http")
      ? post.featuredImage
      : `${SITE_URL}${post.featuredImage}`,
    ogType: "article",
    structuredData: [
      organization,
      blogPostSchema(post),
      breadcrumb([
        { name: "Home", path: "/" },
        { name: "Blog", path: "/blog" },
        { name: post.title, path: `/blog/${post.slug}` },
      ]),
    ],
    noscriptHtml: blogPostNoscript(post),
  }));
  return [...staticRoutes, ...blog];
}

export function getBlogPostSeo(slug: string): RouteSeo | undefined {
  return allPrerenderRoutes().find((r) => r.path === `/blog/${slug}`);
}
