/**
 * Tiny SEO helper — updates `document.title` and key `<meta>` tags on client
 * navigation so SPA routes still have correct tags (not just the initial HTML).
 *
 * Shipping this alongside the build-time prerender script means:
 *   - Crawlers that fetch `/about/index.html` see the prerendered head.
 *   - Users navigating client-side see the right tags in the browser UI too.
 */
export const SITE_URL = "https://receiptcycle.com";
export const SITE_NAME = "Receipt Cycle";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png?v=3`;
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export type StructuredData = Record<string, unknown>;

export interface SeoMeta {
  /** Full page title (we don't auto-append site name; you control it). */
  title: string;
  description: string;
  /** Path-only (we resolve it to absolute with SITE_URL). */
  path: string;
  ogImage?: string;
  ogType?: "website" | "article";
  /** Optional extra JSON-LD blocks (Article, FAQPage, Breadcrumb, etc.). */
  structuredData?: StructuredData[];
  /** Set to true to tell crawlers not to index the page. */
  noindex?: boolean;
}

/** Canonical URL for a given path. */
export function canonicalUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p === "/" ? "/" : p.replace(/\/$/, "")}`;
}

function upsertMeta(selector: string, attrs: Record<string, string>): void {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
  if (!el) {
    const tag = selector.startsWith("link") ? "link" : "meta";
    el = document.createElement(tag) as HTMLMetaElement | HTMLLinkElement;
    document.head.appendChild(el);
  }
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
}

function removeSeoJsonLd(): void {
  if (typeof document === "undefined") return;
  document.head.querySelectorAll('script[type="application/ld+json"][data-seo="1"]').forEach((n) => n.remove());
}

function appendJsonLd(data: StructuredData): void {
  if (typeof document === "undefined") return;
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.setAttribute("data-seo", "1");
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

/**
 * Apply SEO meta for the current route. Call from a `useEffect` in each page,
 * or use the `<Seo>` component wrapper.
 */
export function applySeo(meta: SeoMeta): void {
  if (typeof document === "undefined") return;

  const canonical = canonicalUrl(meta.path);
  const ogImage = meta.ogImage ?? DEFAULT_OG_IMAGE;
  const ogType = meta.ogType ?? "website";

  document.title = meta.title;

  upsertMeta('meta[name="description"]', { name: "description", content: meta.description });
  upsertMeta('link[rel="canonical"]', { rel: "canonical", href: canonical });
  upsertMeta('meta[name="robots"]', {
    name: "robots",
    content: meta.noindex
      ? "noindex,nofollow"
      : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
  });

  upsertMeta('meta[property="og:title"]', { property: "og:title", content: meta.title });
  upsertMeta('meta[property="og:description"]', { property: "og:description", content: meta.description });
  upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
  upsertMeta('meta[property="og:type"]', { property: "og:type", content: ogType });
  upsertMeta('meta[property="og:image"]', { property: "og:image", content: ogImage });
  upsertMeta('meta[property="og:image:secure_url"]', { property: "og:image:secure_url", content: ogImage });
  upsertMeta('meta[property="og:image:width"]', { property: "og:image:width", content: String(OG_IMAGE_WIDTH) });
  upsertMeta('meta[property="og:image:height"]', { property: "og:image:height", content: String(OG_IMAGE_HEIGHT) });
  upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: SITE_NAME });

  upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
  upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: meta.title });
  upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: meta.description });
  upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: ogImage });

  removeSeoJsonLd();
  for (const block of meta.structuredData ?? []) {
    appendJsonLd(block);
  }
}

/** Breadcrumb helper (use on deep pages like /blog/:slug). */
export function breadcrumbSchema(
  trail: Array<{ name: string; path: string }>,
): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: canonicalUrl(t.path),
    })),
  };
}
