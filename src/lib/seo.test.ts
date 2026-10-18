import { afterEach, describe, expect, it } from "vitest";
import { applySeo, canonicalUrl } from "@/lib/seo";
import { allPrerenderRoutes, getRouteSeo } from "@/content/routesSeo";
import { pageUrl } from "@/lib/schema";

function head(selector: string): Element | null {
  return document.head.querySelector(selector);
}

function jsonLdBlocks(): unknown[] {
  return [...document.head.querySelectorAll('script[type="application/ld+json"]')].map((n) => JSON.parse(n.textContent ?? ""));
}

afterEach(() => {
  document.head.innerHTML = "";
});

describe("applySeo (client navigation) matches the prerendered route data", () => {
  it("writes the same canonical and JSON-LD the prerender uses, for every public route", () => {
    for (const route of allPrerenderRoutes()) {
      applySeo({
        title: route.title,
        description: route.description,
        path: route.path,
        ogImage: route.ogImage,
        ogImageAlt: route.ogImageAlt,
        ogImageWidth: route.ogImageWidth,
        ogImageHeight: route.ogImageHeight,
        ogType: route.ogType,
        article: route.article,
        structuredData: route.structuredData,
        noindex: route.noindex,
      });
      expect(head('link[rel="canonical"]')?.getAttribute("href")).toBe(pageUrl(route.path));
      expect(canonicalUrl(route.path)).toBe(pageUrl(route.path));
      expect(head('meta[property="og:url"]')?.getAttribute("content")).toBe(pageUrl(route.path));
      expect(head('meta[name="author"]')?.getAttribute("content")).toBe("Receipt Cycle");
      const blocks = jsonLdBlocks();
      if (route.noindex) {
        expect(head('meta[name="robots"]')?.getAttribute("content")).toBe("noindex,nofollow");
        expect(blocks).toHaveLength(0);
      } else {
        expect(head('meta[name="robots"]')?.getAttribute("content")).toContain("max-snippet:-1");
        expect(blocks).toEqual(JSON.parse(JSON.stringify(route.structuredData)));
      }
    }
  });

  it("replaces schema and article tags when navigating from a blog post to a private screen", () => {
    const post = allPrerenderRoutes().find((r) => r.path.startsWith("/blog/"))!;
    applySeo({ title: post.title, description: post.description, path: post.path, ogType: "article", article: post.article, ogImageWidth: 1600, ogImageHeight: 900, structuredData: post.structuredData });
    expect(head('meta[property="article:published_time"]')?.getAttribute("content")).toBe(post.article?.publishedTime);
    expect(head('meta[property="og:image:width"]')?.getAttribute("content")).toBe("1600");
    expect(jsonLdBlocks()).toHaveLength(1);

    applySeo({ title: "Receipt Cycle app", description: "x", path: "/dashboard", noindex: true });
    expect(document.head.querySelectorAll('meta[property^="article:"]')).toHaveLength(0);
    expect(jsonLdBlocks()).toHaveLength(0);
    expect(head('meta[name="robots"]')?.getAttribute("content")).toBe("noindex,nofollow");
    expect(head('meta[property="og:image:width"]')?.getAttribute("content")).toBe("1200");
  });

  it("the pricing route is indexable even though it lives in the app shell", () => {
    const pricing = getRouteSeo("/pricing")!;
    expect(pricing.noindex).toBeUndefined();
    expect(pricing.structuredData).toHaveLength(1);
  });
});
