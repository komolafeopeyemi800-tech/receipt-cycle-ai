/**
 * One pure builder for all JSON-LD on receiptcycle.com.
 *
 * Used by src/content/routesSeo.ts, which feeds both the client (<Seo> / applySeo) and the build-time
 * prerender (scripts/prerender.mjs), so the markup on a first page load and after client navigation is
 * identical. Keep this file framework-free: no React, no DOM, no import.meta.env, no "@/" aliases.
 *
 * Rules the builder enforces:
 *  - every page gets ONE connected @graph with stable @ids (organization, website, app, webpage, ...)
 *  - nothing is invented: no ratings, reviews, awards, download links, or social profiles that are not real
 *  - FAQPage is only produced from FAQ items the caller says are visible on the page
 *  - prices come from src/lib/pricingPaywall.ts, the same numbers the pricing page shows
 */
import { PAYWALL_PRICING, PAYWALL_TIER_FEATURES } from "./pricingPaywall";

export const SITE_URL = "https://receiptcycle.com";
export const SITE_NAME = "Receipt Cycle";
export const SUPPORT_EMAIL = "support@receiptcycle.com";
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.receiptcycle.mobile&udm=14";
export const LEGAL_NAME = "TempEmailGen";
export const IN_LANGUAGE = "en-US";

/**
 * Social profiles linked from the site footer and contact page (src/content/site.ts defaults).
 * Confirm both profiles are live before relying on them as `sameAs`.
 */
export const SOCIAL_PROFILES = ["https://x.com/receiptcycle", "https://www.instagram.com/receiptcycle"] as const;

export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const APP_ID = `${SITE_URL}/#app`;
export const LOGO_ID = `${SITE_URL}/#logo`;

export type Jsonld = Record<string, unknown>;

export interface Crumb {
  name: string;
  path: string;
}

export interface ImageRef {
  /** Absolute URL, or a path starting with "/". */
  url: string;
  width: number;
  height: number;
  alt?: string;
  /** Short image name for ImageObject.name (defaults to nothing). */
  name?: string;
}

export interface FaqEntry {
  q: string;
  a: string;
}

export interface CitationRef {
  name: string;
  url: string;
}

export const DEFAULT_OG_IMAGE: ImageRef = {
  url: `${SITE_URL}/og-image.png?v=3`,
  width: 1200,
  height: 630,
  alt: "Receipt Cycle: scan once, see your money clearly",
};

const LOGO: ImageRef = {
  url: `${SITE_URL}/icon-512.png?v=3`,
  width: 512,
  height: 512,
  alt: "Receipt Cycle logo",
};

/** Real features of the product, taken from the home page, landing pages and pricing page. */
export const APP_FEATURES: readonly string[] = [
  "Receipt capture with AI extraction of merchant, date, total, tax, and line items",
  "Expense and income records with categories, accounts, and notes",
  "Customer records and a reusable products and services catalog",
  "Estimates and invoices with tax, discounts, and payment terms",
  "Payment records, balances, and payment receipts",
  "Monthly category budgets compared with recorded spending",
  "Income, expense, cash flow, and overdue invoice reports",
  "Ask AI questions about saved records",
  "CSV transaction export on paid plans",
];

/* ------------------------------------------------------------------------------------------------ */
/* URL helpers                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

/** Canonical page URL: root keeps its slash, everything else has no trailing slash. */
export function pageUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (p === "/") return `${SITE_URL}/`;
  return `${SITE_URL}${p.replace(/\/+$/, "")}`;
}

export function absoluteUrl(urlOrPath: string): string {
  return /^https?:\/\//i.test(urlOrPath) ? urlOrPath : `${SITE_URL}${urlOrPath.startsWith("/") ? "" : "/"}${urlOrPath}`;
}

export function countWords(text: string): number {
  const matches = text.trim().match(/\S+/g);
  return matches ? matches.length : 0;
}

function imageObject(img: ImageRef, id?: string): Jsonld {
  const url = absoluteUrl(img.url);
  return {
    "@type": "ImageObject",
    ...(id ? { "@id": id } : {}),
    url,
    contentUrl: url,
    width: img.width,
    height: img.height,
    ...(img.name ? { name: img.name } : {}),
    ...(img.alt ? { caption: img.alt } : {}),
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* Site-wide entities                                                                                */
/* ------------------------------------------------------------------------------------------------ */

export function organizationNode(): Jsonld {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    legalName: LEGAL_NAME,
    url: `${SITE_URL}/`,
    description:
      "Receipt Cycle is a web and Android workspace for receipts, expenses, customers, estimates, invoices, payment records, budgets, and reports, built for freelancers, independent professionals, and small businesses.",
    logo: imageObject(LOGO, LOGO_ID),
    image: { "@id": LOGO_ID },
    email: SUPPORT_EMAIL,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: SUPPORT_EMAIL,
        url: pageUrl("/contact"),
        availableLanguage: ["English"],
      },
    ],
    sameAs: [...SOCIAL_PROFILES],
  };
}

export function websiteNode(): Jsonld {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    description:
      "Capture receipts, organize expenses, prepare estimates and invoices, record payments, set budgets, and review reports in one connected workspace.",
    inLanguage: IN_LANGUAGE,
    publisher: { "@id": ORG_ID },
  };
}

function money(n: number): string {
  return Number.isInteger(n) ? `${n}.00` : n.toFixed(2);
}

/** Plans with the real prices from the pricing page. */
export function offerNodes(): Jsonld[] {
  const { monthlyUsd, yearlyUsd, lifetimeUsd, trialDays, currency } = PAYWALL_PRICING;
  const pricingUrl = pageUrl("/pricing");
  return [
    {
      "@type": "Offer",
      name: "Free",
      description: `${PAYWALL_TIER_FEATURES.free[0]}; ${PAYWALL_TIER_FEATURES.free[1].toLowerCase()}. ${PAYWALL_TIER_FEATURES.free[4]}.`,
      url: pricingUrl,
      price: "0",
      priceCurrency: currency,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "0",
        priceCurrency: currency,
      },
    },
    {
      "@type": "Offer",
      name: "Pro Monthly",
      description: "Unlimited transactions, receipt scan, upload and manual entry, budgets, full edit access, and CSV export. Billed monthly.",
      url: pricingUrl,
      price: money(monthlyUsd),
      priceCurrency: currency,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: money(monthlyUsd),
        priceCurrency: currency,
        billingDuration: "P1M",
        billingIncrement: 1,
        unitText: "month",
      },
    },
    {
      "@type": "Offer",
      name: "Pro Yearly",
      description: `Everything in Pro Monthly. ${trialDays}-day free trial, then $${money(yearlyUsd)} per year.`,
      url: pricingUrl,
      price: money(yearlyUsd),
      priceCurrency: currency,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: money(yearlyUsd),
        priceCurrency: currency,
        billingDuration: "P1Y",
        billingIncrement: 1,
        unitText: "year",
      },
    },
    {
      "@type": "Offer",
      name: "Pro Lifetime",
      description: `Everything in Pro Monthly for a single payment of $${money(lifetimeUsd)}. No monthly charges. Launch offer.`,
      url: pricingUrl,
      price: money(lifetimeUsd),
      priceCurrency: currency,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: money(lifetimeUsd),
        priceCurrency: currency,
      },
    },
  ];
}

export interface AppOptions {
  featureList?: readonly string[];
  /** Add the plan offers (only where the page shows the prices). */
  withOffers?: boolean;
}

export function appNode(opts: AppOptions = {}): Jsonld {
  return {
    "@type": "SoftwareApplication",
    "@id": APP_ID,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description:
      "Receipt Cycle is a web and Android app that captures receipts with AI extraction and keeps expenses, customers, estimates, invoices, payments, budgets, and reports connected in one workspace.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Android, Web",
    downloadUrl: PLAY_STORE_URL,
    installUrl: PLAY_STORE_URL,
    browserRequirements: "Requires JavaScript. Works in current versions of Chrome, Edge, Firefox, and Safari.",
    inLanguage: IN_LANGUAGE,
    image: absoluteUrl(DEFAULT_OG_IMAGE.url),
    featureList: [...(opts.featureList && opts.featureList.length ? opts.featureList : APP_FEATURES)],
    publisher: { "@id": ORG_ID },
    creator: { "@id": ORG_ID },
    ...(opts.withOffers ? { offers: offerNodes() } : {}),
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* Page builders                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

export type PageKind =
  | "home"
  | "landing"
  | "about"
  | "contact"
  | "pricing"
  | "faq"
  | "legal"
  | "blogIndex"
  | "article";

export interface BlogIndexItem {
  slug: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified: string;
  author: string;
}

export interface ArticleInput {
  slug: string;
  headline: string;
  description: string;
  image: ImageRef;
  /** Additional in-article images (ImageObject entries after the hero). */
  images?: ImageRef[];
  datePublished: string;
  dateModified: string;
  authorName: string;
  keywords: string[];
  section: string;
  wordCount: number;
  minutes: number;
  /** Sources that are really linked from the article text. */
  citations: CitationRef[];
}

export interface PageSchemaInput {
  path: string;
  kind: PageKind;
  /** Short page name (not the full <title>). */
  name: string;
  description: string;
  image?: ImageRef;
  datePublished?: string;
  dateModified?: string;
  /** Breadcrumb trail including Home and the current page. Omit on the home page. */
  breadcrumb?: Crumb[];
  /** Only FAQ items that are visible on the page. */
  faq?: readonly FaqEntry[];
  /** CSS selectors of the answer-first text, for speakable markup. */
  speakable?: string[];
  /** Page-specific features that the page documents (landing pages). */
  featureList?: readonly string[];
  /** What the page is about, besides the app (landing pages). */
  topic?: string;
  article?: ArticleInput;
  blogItems?: readonly BlogIndexItem[];
}

function questionNodes(faq: readonly FaqEntry[]): Jsonld[] {
  return faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  }));
}

function breadcrumbNode(url: string, trail: readonly Crumb[]): Jsonld {
  return {
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: pageUrl(t.path),
    })),
  };
}

/** Breadcrumb as a stand-alone JSON-LD block (kept for callers that only need a trail). */
export function breadcrumbSchema(trail: readonly Crumb[], path: string): Jsonld {
  return { "@context": "https://schema.org", ...breadcrumbNode(pageUrl(path), trail) };
}

function webPageType(kind: PageKind): string | string[] {
  switch (kind) {
    case "about":
      return "AboutPage";
    case "contact":
      return "ContactPage";
    case "faq":
      return "FAQPage";
    case "blogIndex":
      return "CollectionPage";
    default:
      return "WebPage";
  }
}

/**
 * Build the connected @graph for one public page. Returns an array with a single JSON-LD document so it
 * can be dropped straight into `structuredData`.
 */
export function buildPageGraph(input: PageSchemaInput): Jsonld[] {
  const url = pageUrl(input.path);
  const webpageId = `${url}#webpage`;
  const primaryImageId = `${url}#primaryimage`;
  const image = input.image ?? DEFAULT_OG_IMAGE;
  const nodes: Jsonld[] = [];

  nodes.push(organizationNode(), websiteNode());

  const featureList = input.kind === "landing" ? input.featureList : undefined;
  nodes.push(appNode({ featureList, withOffers: input.kind === "pricing" }));

  const webpage: Jsonld = {
    "@type": webPageType(input.kind),
    "@id": webpageId,
    url,
    name: input.name,
    description: input.description,
    inLanguage: IN_LANGUAGE,
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORG_ID },
    primaryImageOfPage: { "@id": primaryImageId },
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    potentialAction: [{ "@type": "ReadAction", target: [url] }],
  };

  switch (input.kind) {
    case "home":
    case "landing":
    case "pricing":
      webpage.about = [{ "@id": APP_ID }];
      if (input.kind === "landing" && input.topic) {
        (webpage.about as Jsonld[]).push({ "@type": "Thing", name: input.topic });
      }
      if (input.kind === "pricing") webpage.mainEntity = { "@id": APP_ID };
      break;
    case "about":
    case "contact":
      webpage.about = { "@id": ORG_ID };
      webpage.mainEntity = { "@id": ORG_ID };
      break;
    case "legal":
      webpage.about = { "@id": ORG_ID };
      break;
    default:
      break;
  }

  if (input.speakable && input.speakable.length) {
    webpage.speakable = { "@type": "SpeakableSpecification", cssSelector: [...input.speakable] };
  }

  const crumbs = input.breadcrumb && input.breadcrumb.length > 1 ? input.breadcrumb : undefined;
  if (crumbs) webpage.breadcrumb = { "@id": `${url}#breadcrumb` };

  // FAQ: the /faq page is itself the FAQPage; other pages get a linked FAQPage node.
  if (input.faq && input.faq.length) {
    if (input.kind === "faq") {
      webpage.mainEntity = questionNodes(input.faq);
    } else {
      const faqId = `${url}#faq`;
      webpage.hasPart = [{ "@id": faqId }];
    }
  }

  const articleId = `${url}#article`;
  if (input.kind === "article" && input.article) {
    webpage.mainEntity = { "@id": articleId };
  }

  nodes.push(webpage);
  nodes.push(imageObject(image, primaryImageId));
  if (crumbs) nodes.push(breadcrumbNode(url, crumbs));

  if (input.faq && input.faq.length && input.kind !== "faq") {
    nodes.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      url: `${url}#faq`,
      name: `${input.name}: frequently asked questions`,
      inLanguage: IN_LANGUAGE,
      isPartOf: { "@id": webpageId },
      mainEntity: questionNodes(input.faq),
    });
  }

  if (input.kind === "article" && input.article) {
    const a = input.article;
    nodes.push({
      "@type": "BlogPosting",
      "@id": articleId,
      url,
      headline: a.headline,
      name: a.headline,
      description: a.description,
      image: [imageObject(a.image), ...(a.images ?? []).map((img) => imageObject(img))],
      datePublished: a.datePublished,
      dateModified: a.dateModified,
      author: { "@type": "Organization", name: a.authorName, url: `${SITE_URL}/` },
      publisher: { "@id": ORG_ID },
      isPartOf: { "@id": `${SITE_URL}/blog#blog` },
      mainEntityOfPage: { "@id": webpageId },
      articleSection: a.section,
      keywords: a.keywords.join(", "),
      wordCount: a.wordCount,
      timeRequired: `PT${Math.max(1, Math.round(a.minutes))}M`,
      inLanguage: IN_LANGUAGE,
      isAccessibleForFree: true,
      ...(a.citations.length
        ? { citation: a.citations.map((c) => ({ "@type": "CreativeWork", name: c.name, url: c.url })) }
        : {}),
    });
    nodes.push({
      "@type": "Blog",
      "@id": `${SITE_URL}/blog#blog`,
      url: pageUrl("/blog"),
      name: `${SITE_NAME} Blog`,
      publisher: { "@id": ORG_ID },
      inLanguage: IN_LANGUAGE,
    });
  }

  if (input.kind === "blogIndex" && input.blogItems) {
    const items = input.blogItems;
    const itemListId = `${url}#itemlist`;
    (webpage as Jsonld).mainEntity = { "@id": itemListId };
    (webpage as Jsonld).about = { "@id": `${url}#blog` };
    nodes.push({
      "@type": "Blog",
      "@id": `${url}#blog`,
      url,
      name: `${SITE_NAME} Blog`,
      description: input.description,
      publisher: { "@id": ORG_ID },
      inLanguage: IN_LANGUAGE,
      blogPost: items.map((p) => ({
        "@type": "BlogPosting",
        "@id": `${pageUrl(`/blog/${p.slug}`)}#article`,
        headline: p.title,
        url: pageUrl(`/blog/${p.slug}`),
        datePublished: p.datePublished,
        dateModified: p.dateModified,
        author: { "@type": "Organization", name: p.author, url: `${SITE_URL}/` },
      })),
    });
    nodes.push({
      "@type": "ItemList",
      "@id": itemListId,
      name: `${SITE_NAME} blog articles`,
      numberOfItems: items.length,
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      itemListElement: items.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: pageUrl(`/blog/${p.slug}`),
        name: p.title,
      })),
    });
  }

  return [{ "@context": "https://schema.org", "@graph": nodes }];
}
