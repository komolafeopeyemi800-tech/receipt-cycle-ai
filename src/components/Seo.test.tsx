import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { Seo, SeoForPath } from "./Seo";
import { allPrerenderRoutes, getRouteSeo } from "@/content/routesSeo";
import { SOCIAL_IMAGE } from "@/lib/socialImage";

afterEach(() => {
  cleanup();
  document.head.innerHTML = "";
});

const content = (selector: string) => document.head.querySelector(selector)?.getAttribute("content");
const graphs = () => [...document.head.querySelectorAll('script[type="application/ld+json"]')].map(n => JSON.parse(n.textContent ?? ""));

describe("SEO hydration and route navigation", () => {
  it("replaces the owned server graph and preserves article dimensions and facts", () => {
    const article = allPrerenderRoutes().find(r => r.ogType === "article")!;
    const serverGraph = document.createElement("script");
    serverGraph.type = "application/ld+json";
    serverGraph.dataset.seo = "1";
    serverGraph.textContent = JSON.stringify(article.structuredData?.[0]);
    document.head.appendChild(serverGraph);

    const view = render(<Seo {...article} />);
    expect(graphs()).toEqual(article.structuredData);
    expect(content('meta[property="og:image:width"]')).toBe(String(article.ogImageWidth));
    expect(content('meta[property="og:image:height"]')).toBe(String(article.ogImageHeight));
    expect(content('meta[property="article:published_time"]')).toBe(article.article?.publishedTime);
    expect(content('meta[property="og:image:type"]')).toBe("image/webp");

    view.rerender(<SeoForPath path="/" />);
    expect(graphs()).toEqual(getRouteSeo("/")?.structuredData);
    expect(document.head.querySelectorAll('meta[property^="article:"]')).toHaveLength(0);
    expect(content('meta[property="og:image"]')).toBe(SOCIAL_IMAGE.url);
    expect(content('meta[property="og:image:height"]')).toBe("630");
    expect(content('meta[property="og:image:type"]')).toBe("image/png");
  });

  it("clears the public graph when entering a noindex account shell", () => {
    const view = render(<SeoForPath path="/pricing" />);
    expect(graphs()).toHaveLength(1);
    view.rerender(<Seo title="Sign in" description="Sign in to your workspace." path="/signin" noindex />);
    expect(graphs()).toHaveLength(0);
    expect(content('meta[name="robots"]')).toBe("noindex,nofollow");
  });
});
