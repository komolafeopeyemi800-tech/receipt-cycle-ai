/**
 * Guards for everything search engines and AI systems read: JSON-LD, sitemap, robots.txt, llms.txt.
 * Iterates over every public route so a new page or a copy change cannot silently break the markup.
 */
import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import {
  BLOG_POSTS,
  LANDING_PAGES,
  NOINDEX_PUBLIC_PATHS,
  PAGE_DATES,
  PRIVATE_ROUTE_PATHS,
  SITE_FAQ_ITEMS,
  allPrerenderRoutes,
  blogCitations,
  blogPostText,
  getRouteSeo,
  indexableRoutes,
  landingFaqs,
  privateRoutes,
  type RouteSeo,
} from "@/content/routesSeo";
import {
  authorNode,
  ORG_ID,
  APP_ID,
  PLAY_STORE_URL,
  SITE_URL,
  WEBSITE_ID,
  buildPageGraph,
  countWords,
  pageUrl,
  type Jsonld,
} from "@/lib/schema";
import type { BlogPost } from "@/content/blogPosts";
import { PAYWALL_PRICING } from "@/lib/pricingPaywall";
import { buildLlmsFullTxt, buildLlmsTxt, buildRobotsTxt, buildSitemapXml, AI_BOTS } from "@/lib/seoFiles";

const ROOT = path.resolve(__dirname, "../..");
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

const publicRoutes = allPrerenderRoutes();
const indexable = indexableRoutes();

function graphOf(route: RouteSeo): Jsonld[] {
  const blocks = route.structuredData ?? [];
  expect(blocks).toHaveLength(1);
  // Round trip exactly like the page does (JSON.stringify into a script tag, parsed by the crawler).
  const parsed = JSON.parse(JSON.stringify(blocks[0])) as Jsonld;
  expect(parsed["@context"]).toBe("https://schema.org");
  expect(Array.isArray(parsed["@graph"])).toBe(true);
  return parsed["@graph"] as Jsonld[];
}

type Visitor = (key: string, value: unknown, trail: string[]) => void;
function walk(node: unknown, visit: Visitor, trail: string[] = []): void {
  if (Array.isArray(node)) {
    node.forEach((n) => walk(n, visit, trail));
    return;
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      visit(k, v, trail);
      walk(v, visit, [...trail, k]);
    }
  }
}

function definedIds(graph: Jsonld[]): Set<string> {
  const ids = new Set<string>();
  walk(graph, (k, v) => {
    if (k === "@id" && typeof v === "string") ids.add(v);
  });
  return ids;
}

function referencedIds(graph: Jsonld[]): string[] {
  const refs: string[] = [];
  const collect = (n: unknown) => {
    if (Array.isArray(n)) return n.forEach(collect);
    if (n && typeof n === "object") {
      const o = n as Record<string, unknown>;
      const keys = Object.keys(o);
      if (keys.length === 1 && keys[0] === "@id" && typeof o["@id"] === "string") refs.push(o["@id"] as string);
      Object.values(o).forEach(collect);
    }
  };
  collect(graph);
  return refs;
}

function nodesOfType(graph: Jsonld[], type: string): Jsonld[] {
  return graph.filter((n) => (Array.isArray(n["@type"]) ? n["@type"].includes(type) : n["@type"] === type));
}

describe("route inventory", () => {
  it("has at least the known public pages", () => {
    const paths = publicRoutes.map((r) => r.path);
    for (const p of ["/", "/pricing", "/faq", "/about", "/contact", "/blog", "/privacy", "/terms"]) {
      expect(paths).toContain(p);
    }
    expect(LANDING_PAGES).toHaveLength(10);
    expect(paths.filter((p) => p.startsWith("/blog/"))).toHaveLength(BLOG_POSTS.length);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("every route registered in App.tsx is either a prerendered public page or a private route", () => {
    const app = read("src/App.tsx");
    const declared = [...app.matchAll(/<Route[^>]*\spath="([^"]+)"/g)].map((m) => m[1]);
    const known = new Set<string>([
      ...publicRoutes.map((r) => r.path),
      ...PRIVATE_ROUTE_PATHS,
      "/blog/:slug",
      "*",
    ]);
    const missing = declared.filter((p) => !known.has(p));
    expect(missing).toEqual([]);
  });
});

describe("JSON-LD on indexable pages", () => {
  for (const route of indexable) {
    describe(route.path, () => {
      const graph = graphOf(route);
      const url = pageUrl(route.path);

      it("parses and has one connected graph with the core entities", () => {
        const ids = definedIds(graph);
        expect(ids.has(ORG_ID)).toBe(true);
        expect(ids.has(WEBSITE_ID)).toBe(true);
        expect(ids.has(APP_ID)).toBe(true);
        expect(ids.has(`${url}#webpage`)).toBe(true);
        expect(JSON.stringify(graph).length).toBeLessThan(120_000);
      });

      it("has unique @ids and every @id reference resolves inside the graph", () => {
        const top = graph.map((n) => n["@id"]).filter(Boolean) as string[];
        expect(new Set(top).size).toBe(top.length);
        const defined = definedIds(graph);
        for (const ref of referencedIds(graph)) {
          expect(defined.has(ref), `unresolved reference ${ref}`).toBe(true);
        }
      });

      it("uses absolute receiptcycle.com URLs (except social profiles and cited sources)", () => {
        walk(graph, (k, v, trail) => {
          if (typeof v !== "string") return;
          if (!["url", "item", "contentUrl", "@id", "target", "image"].includes(k)) return;
          if (trail.includes("citation") || trail.includes("sameAs")) return;
          expect(v.startsWith(`${SITE_URL}/`) || v === SITE_URL, `${k}=${v}`).toBe(true);
        });
        const webpage = graph.find((n) => n["@id"] === `${url}#webpage`) as Jsonld;
        expect(webpage.url).toBe(url);
        // The canonical the prerender and applySeo write is pageUrl(route.path): same string as schema url.
        expect(pageUrl(route.path)).toBe(webpage.url);
      });

      it("has no ratings, reviews, or awards", () => {
        const text = JSON.stringify(graph);
        expect(text).not.toMatch(/aggregateRating|"review"|"reviewRating"|ratingValue|ratingCount|reviewCount|"award"/);
      });

      it("sets language, publisher link, and a real modification date", () => {
        const webpage = graph.find((n) => n["@id"] === `${url}#webpage`) as Jsonld;
        expect(webpage.inLanguage).toBe("en-US");
        expect(webpage.isPartOf).toEqual({ "@id": WEBSITE_ID });
        expect(String(webpage.dateModified)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(Number.isNaN(Date.parse(String(webpage.dateModified)))).toBe(false);
        expect(route.dateModified).toBe(webpage.dateModified);
      });

      it("has a sequential breadcrumb that ends on this page (except on the home page)", () => {
        const crumbs = nodesOfType(graph, "BreadcrumbList");
        if (route.path === "/") {
          expect(crumbs).toHaveLength(0);
          return;
        }
        expect(crumbs).toHaveLength(1);
        const items = crumbs[0].itemListElement as Array<{ position: number; name: string; item: string }>;
        items.forEach((it, i) => expect(it.position).toBe(i + 1));
        expect(items[0].item).toBe(`${SITE_URL}/`);
        expect(items[items.length - 1].item).toBe(url);
        for (const it of items) expect(it.name.length).toBeGreaterThan(0);
      });

      it("carries no em or en dashes in schema text it writes", () => {
        // Blog headlines copy the visible H1, so only check non-article pages and the page-level fields.
        if (route.kind === "article") return;
        const webpage = graph.find((n) => n["@id"] === `${url}#webpage`) as Jsonld;
        expect(String(webpage.name) + String(webpage.description)).not.toMatch(/[–—]/);
      });
    });
  }
});

describe("FAQPage markup matches the visible FAQ data", () => {
  const faqNodes = (graph: Jsonld[]) => nodesOfType(graph, "FAQPage");
  const entries = (faq: Jsonld) =>
    (faq.mainEntity as Array<{ name: string; acceptedAnswer: { text: string } }>).map((q) => ({
      q: q.name,
      a: q.acceptedAnswer.text,
    }));

  it("/faq equals the SITE_FAQ_ITEMS rendered by FaqPage", () => {
    const route = getRouteSeo("/faq") as RouteSeo;
    const faqs = faqNodes(graphOf(route));
    expect(faqs).toHaveLength(1);
    expect(entries(faqs[0])).toEqual(SITE_FAQ_ITEMS.map((i) => ({ q: i.q, a: i.a })));
    expect(read("src/pages/FaqPage.tsx")).toContain("SITE_FAQ_ITEMS");
  });

  const pagesWithFaq: Array<[string, string]> = [
    ["/", "src/pages/MarketingLanding.tsx"],
    ...LANDING_PAGES.map((lp): [string, string] => [
      lp.path,
      `src/pages/${lp.path
        .slice(1)
        .split("-")
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join("")}Landing.tsx`,
    ]),
  ];

  for (const [routePath, file] of pagesWithFaq) {
    it(`${routePath} FAQPage equals the items the page renders`, () => {
      const route = getRouteSeo(routePath) as RouteSeo;
      const faqs = faqNodes(graphOf(route));
      expect(faqs).toHaveLength(1);
      expect(entries(faqs[0])).toEqual(landingFaqs(routePath).map((i) => ({ q: i.q, a: i.a })));
      expect(faqs[0].mainEntity as unknown[]).not.toHaveLength(0);
      // The page component must render the same data source the schema is built from.
      const source = fs.existsSync(path.join(ROOT, file)) ? read(file) : "";
      expect(source, `${file} should render landingFaqs("${routePath}")`).toContain(`landingFaqs("${routePath}")`);
    });
  }

  it("pages without a visible FAQ carry no FAQPage", () => {
    for (const p of ["/pricing", "/about", "/contact", "/blog", "/privacy", "/terms"]) {
      expect(faqNodes(graphOf(getRouteSeo(p) as RouteSeo))).toHaveLength(0);
    }
    for (const r of publicRoutes.filter((x) => x.path.startsWith("/blog/") && !BLOG_POSTS.find((post) => `/blog/${post.slug}` === x.path)?.faq?.length)) {
      expect(faqNodes(graphOf(r))).toHaveLength(0);
    }
  });

  it("blog FAQ schema matches the FAQ shown in the article", () => {
    for (const post of BLOG_POSTS.filter((item) => item.faq?.length)) {
      const route = publicRoutes.find((item) => item.path === `/blog/${post.slug}`) as RouteSeo;
      const [faq] = faqNodes(graphOf(route));
      const questions = faq.mainEntity as Array<Record<string, unknown>>;
      expect(questions).toHaveLength(post.faq!.length);
      expect(questions.map((item) => item.name)).toEqual(post.faq!.map((item) => item.question));
      expect(JSON.stringify(questions)).toContain(post.faq![0].answer.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"));
    }
  });
});

describe("blog posts", () => {
  for (const post of BLOG_POSTS) {
    it(`${post.slug} has a complete BlogPosting`, () => {
      const route = getRouteSeo(`/blog/${post.slug}`) ?? publicRoutes.find((r) => r.path === `/blog/${post.slug}`)!;
      const graph = graphOf(route);
      const [a] = nodesOfType(graph, "BlogPosting");
      expect(a).toBeTruthy();
      expect(a.headline).toBe(post.title);
      expect(String(a.headline).length).toBeLessThanOrEqual(110);
      expect(a.description).toBe(post.description);
      expect(a.datePublished).toBe(post.datePublished);
      expect(a.dateModified).toBe(post.dateModified);
      for (const d of [a.datePublished, a.dateModified]) {
        expect(String(d)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(Number.isNaN(Date.parse(String(d)))).toBe(false);
      }
      expect(Date.parse(String(a.dateModified))).toBeGreaterThanOrEqual(Date.parse(String(a.datePublished)));
      const [img] = a.image as Array<Record<string, unknown>>;
      expect(String(img.url)).toMatch(/^https:\/\/receiptcycle\.com\/landing\/blog-.*\.webp/);
      expect(img.width).toBe(post.featuredImageWidth ?? 1600);
      expect(img.height).toBe(post.featuredImageHeight ?? 900);
      expect(img.caption).toBe(post.featuredImageAlt ?? post.title);
      expect(a.author).toMatchObject({ "@type": post.author === "Philip" ? "Person" : "Organization", name: post.author });
      expect(a.publisher).toEqual({ "@id": ORG_ID });
      expect(a.mainEntityOfPage).toEqual({ "@id": `${pageUrl(route.path)}#webpage` });
      expect(a.wordCount).toBe(countWords(blogPostText(post)));
      expect(a.wordCount as number).toBeGreaterThan(300);
      expect(a.timeRequired).toBe(`PT${post.readMinutes}M`);
      expect(a.inLanguage).toBe("en-US");
      expect(typeof a.articleSection).toBe("string");
      expect(a.keywords).toBe(post.tags.join(", "));
      // Citations come from visible external resource links and explicitly researched source metadata.
      const externalLinks = [
        ...(post.citations ?? []).map((citation) => citation.href),
        ...(post.resources ?? []).map((r) => r.href),
        ...post.body.flatMap((b) => (b.kind === "links" ? b.items.filter((i) => i.external).map((i) => i.href) : [])),
        ...(JSON.stringify(post).match(/\]\((https:\/\/[^)\s"\\]+)\)/g) ?? []).map((m) => m.slice(2, -1)),
      ].filter((href) => !href.startsWith("https://receiptcycle.com"));
      const cited = ((a.citation as Array<{ url: string }>) ?? []).map((c) => c.url);
      expect(cited.sort()).toEqual([...new Set(externalLinks)].sort());
      expect(route.ogType).toBe("article");
      expect(route.article?.publishedTime).toBe(post.datePublished);
      expect(route.ogImageWidth).toBe(post.featuredImageWidth ?? 1600);
    });
  }

  it("the blog index lists every post once, in order, with absolute URLs", () => {
    const graph = graphOf(getRouteSeo("/blog") as RouteSeo);
    const [list] = nodesOfType(graph, "ItemList");
    const items = list.itemListElement as Array<{ position: number; url: string; name: string }>;
    expect(items).toHaveLength(BLOG_POSTS.length);
    items.forEach((it, i) => {
      expect(it.position).toBe(i + 1);
      expect(it.url).toBe(`${SITE_URL}/blog/${BLOG_POSTS[i].slug}`);
      expect(it.name).toBe(BLOG_POSTS[i].title);
    });
    expect(nodesOfType(graph, "CollectionPage")).toHaveLength(1);
    expect(nodesOfType(graph, "Blog")).toHaveLength(1);
  });
});

describe("page types and entity details", () => {
  it("uses the specific schema.org page type", () => {
    const type = (p: string) => nodesOfType(graphOf(getRouteSeo(p) as RouteSeo), "WebPage").length;
    const graph = (p: string) => graphOf(getRouteSeo(p) as RouteSeo);
    expect(nodesOfType(graph("/about"), "AboutPage")).toHaveLength(1);
    expect(nodesOfType(graph("/contact"), "ContactPage")).toHaveLength(1);
    expect(nodesOfType(graph("/faq"), "FAQPage")).toHaveLength(1);
    expect(nodesOfType(graph("/blog"), "CollectionPage")).toHaveLength(1);
    expect(type("/pricing")).toBe(1);
  });

  it("organization has legal name, logo with size, contact point and only the known social profiles", () => {
    const graph = graphOf(getRouteSeo("/") as RouteSeo);
    const [org] = nodesOfType(graph, "Organization");
    expect(org.legalName).toBe("TempEmailGen");
    expect(org.logo).toMatchObject({ width: 512, height: 512 });
    expect(JSON.stringify(org.contactPoint)).toContain("support@receiptcycle.com");
    expect(org.sameAs).toEqual(["https://x.com/receiptcycle", "https://www.instagram.com/receiptcycle"]);
  });

  it("the website has no SearchAction because the site has no search", () => {
    for (const r of indexable) expect(JSON.stringify(r.structuredData)).not.toContain("SearchAction");
  });

  it("the app claims only the platforms that ship and links to the live Google Play listing", () => {
    for (const r of indexable) {
      const [app] = nodesOfType(graphOf(r), "SoftwareApplication");
      expect(app.operatingSystem).toBe("Android, Web");
      expect(app.downloadUrl).toBe(PLAY_STORE_URL);
      expect(app.installUrl).toBe(PLAY_STORE_URL);
      expect(app).not.toHaveProperty("aggregateRating");
    }
  });

  it("pricing offers use the real prices from pricingPaywall", () => {
    const [app] = nodesOfType(graphOf(getRouteSeo("/pricing") as RouteSeo), "SoftwareApplication");
    const offers = app.offers as Array<{ name: string; price: string; priceCurrency: string; priceSpecification: Record<string, unknown> }>;
    const byName = Object.fromEntries(offers.map((o) => [o.name, o]));
    expect(Number(byName["Free"].price)).toBe(0);
    expect(Number(byName["Pro Monthly"].price)).toBe(PAYWALL_PRICING.monthlyUsd);
    expect(Number(byName["Pro Yearly"].price)).toBe(PAYWALL_PRICING.yearlyUsd);
    expect(Number(byName["Pro Lifetime"].price)).toBe(PAYWALL_PRICING.lifetimeUsd);
    expect(byName["Pro Monthly"].priceSpecification.billingDuration).toBe("P1M");
    expect(byName["Pro Yearly"].priceSpecification.billingDuration).toBe("P1Y");
    expect(byName["Pro Lifetime"].priceSpecification.billingDuration).toBeUndefined();
    for (const o of offers) expect(o.priceCurrency).toBe("USD");
    // The pricing page shows exactly these numbers.
    expect(PAYWALL_PRICING.monthlyUsd).toBe(3.5);
    expect(PAYWALL_PRICING.yearlyUsd).toBe(35);
    expect(PAYWALL_PRICING.lifetimeUsd).toBe(60);
  });

  it("offers appear only where the prices are shown", () => {
    for (const r of indexable) {
      const [app] = nodesOfType(graphOf(r), "SoftwareApplication");
      if (r.path === "/pricing") expect(app.offers).toBeTruthy();
      else expect(app.offers).toBeUndefined();
    }
  });

  it("legal pages use the date printed on the page", () => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const human = (iso: string) => {
      const [y, m, d] = iso.split("-").map(Number);
      return `${months[m - 1]} ${d}, ${y}`;
    };
    const files: Record<string, [string, string]> = {
      "/privacy": ["src/pages/legal/PrivacyPolicy.tsx", PAGE_DATES.privacy],
      "/delete-account": ["src/pages/legal/DeleteAccount.tsx", PAGE_DATES.deleteAccount],
      "/terms": ["src/pages/legal/TermsOfService.tsx", PAGE_DATES.terms],
      "/refund-policy": ["src/pages/legal/RefundPolicy.tsx", PAGE_DATES.refundPolicy],
    };
    for (const [route, [file, iso]] of Object.entries(files)) {
      expect(read(file)).toContain(`updated="${human(iso)}"`);
      expect(getRouteSeo(route)?.dateModified).toBe(iso);
    }
    // The cookie policy uses the LegalLayout default.
    expect(read("src/pages/legal/LegalLayout.tsx")).toContain(`updated = "${human(PAGE_DATES.cookies)}"`);
  });
});

describe("authenticated and utility routes", () => {
  it("are noindex and carry no structured data", () => {
    const routes = [...privateRoutes(), ...publicRoutes.filter((r) => NOINDEX_PUBLIC_PATHS.includes(r.path))];
    expect(routes.length).toBe(PRIVATE_ROUTE_PATHS.length + NOINDEX_PUBLIC_PATHS.length);
    for (const r of routes) {
      expect(r.noindex, r.path).toBe(true);
      expect(r.structuredData, r.path).toBeUndefined();
    }
  });

  it("never appear in the sitemap and are disallowed (private) in robots.txt", () => {
    const sitemap = buildSitemapXml();
    const robots = buildRobotsTxt();
    for (const p of PRIVATE_ROUTE_PATHS) {
      expect(sitemap).not.toContain(`<loc>${SITE_URL}${p}</loc>`);
      expect(robots).toContain(`Disallow: ${p}\n`);
    }
    for (const p of NOINDEX_PUBLIC_PATHS) expect(sitemap).not.toContain(`${SITE_URL}${p}<`);
  });

  it("no public page is accidentally disallowed", () => {
    const disallowed = [...buildRobotsTxt().matchAll(/^Disallow: (\S+)$/gm)].map((m) => m[1]);
    for (const r of indexable) {
      for (const d of disallowed) expect(r.path.startsWith(d), `${r.path} blocked by ${d}`).toBe(false);
    }
  });
});

describe("sitemap, robots, llms files", () => {
  it("sitemap lists exactly the indexable routes with real, varied dates", () => {
    const xml = buildSitemapXml();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.sort()).toEqual(indexable.map((r) => pageUrl(r.path)).sort());
    const mods = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
    for (const m of mods) {
      expect(m).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Date.parse(m)).toBeLessThanOrEqual(Date.now());
    }
    expect(new Set(mods).size).toBeGreaterThan(3);
    for (const r of indexable) expect(r.dateModified, r.path).toBeTruthy();
  });

  it("committed public files are in sync with the generators (run `npm run seo:assets`)", () => {
    expect(read("public/sitemap.xml")).toBe(buildSitemapXml());
    expect(read("public/robots.txt")).toBe(buildRobotsTxt());
    expect(read("public/llms.txt")).toBe(buildLlmsTxt());
    expect(read("public/llms-full.txt")).toBe(buildLlmsFullTxt());
  });

  it("robots.txt allows the AI crawlers that matter and references the sitemap", () => {
    const robots = buildRobotsTxt();
    for (const bot of [
      "GPTBot",
      "OAI-SearchBot",
      "ChatGPT-User",
      "ClaudeBot",
      "Claude-SearchBot",
      "Claude-User",
      "PerplexityBot",
      "Perplexity-User",
      "Google-Extended",
      "Applebot-Extended",
    ]) {
      expect(AI_BOTS).toContain(bot);
      expect(robots).toContain(`User-agent: ${bot}\n`);
    }
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
    expect(robots).not.toMatch(/^Disallow: \/$/m);
  });

  const publicPaths = new Set(publicRoutes.map((r) => r.path));
  const extraFiles = new Set(["/sitemap.xml", "/llms.txt", "/llms-full.txt"]);
  for (const [name, text] of [
    ["llms.txt", buildLlmsTxt()],
    ["llms-full.txt", buildLlmsFullTxt()],
  ] as const) {
    it(`${name} links only to real routes and has no stale claims`, () => {
      const urls = [...text.matchAll(/https:\/\/receiptcycle\.com[^\s)\]>"']*/g)].map((m) => m[0].replace(/[.,;:]+$/, ""));
      expect(urls.length).toBeGreaterThan(10);
      for (const u of urls) {
        const p = u.replace(SITE_URL, "").replace(/#.*$/, "") || "/";
        const norm = p.length > 1 ? p.replace(/\/$/, "") : p;
        expect(publicPaths.has(norm) || extraFiles.has(norm), `${name}: ${u}`).toBe(true);
      }
      expect(text).not.toMatch(/Convex|Whop|finance coach|iOS, Android|—|–/i);
      expect(text).toContain("support@receiptcycle.com");
      expect(text).toContain("$3.50");
      expect(text).toContain("$35");
      expect(text).toContain("$60");
    });
  }

  it("llms.txt mentions every indexable page", () => {
    const text = buildLlmsTxt();
    for (const r of indexable) expect(text, r.path).toContain(pageUrl(r.path));
  });
});

describe("image files referenced by schema exist with the stated size", () => {
  it("og, logo and blog images exist", async () => {
    const sharp = (await import("sharp")).default;
    const checks: Array<[string, number, number]> = [
      ["public/og-image.png", 1200, 630],
      ["public/icon-512.png", 512, 512],
      ...LANDING_PAGES.map((lp): [string, number, number] => [`public${lp.ogImagePath}`, 1200, 630]),
      ...BLOG_POSTS.map((p): [string, number, number] => [`public${p.featuredImage.replace(/\?.*$/, "")}`, p.featuredImageWidth ?? 1600, p.featuredImageHeight ?? 900]),
    ];
    for (const [file, w, h] of checks) {
      const meta = await sharp(path.join(ROOT, file)).metadata();
      expect([file, meta.width, meta.height]).toEqual([file, w, h]);
    }
  });
});

describe("receipt scanner comparison editorial guardrails", () => {
  it("stays within the agreed length (2,000 to 2,800 words) and avoids em dashes", () => {
    const post = BLOG_POSTS.find((item) => item.slug === "best-receipt-scanner-app-small-business-2026");
    expect(post).toBeDefined();
    const text = blogPostText(post!);
    expect(countWords(text)).toBeGreaterThanOrEqual(2000);
    expect(countWords(text)).toBeLessThanOrEqual(2800);
    expect(text).not.toContain("—");
  });
});

describe("rich blog blocks in text, citations and schema", () => {
  const demo: BlogPost = {
    slug: "demo",
    title: "Demo",
    description: "Demo",
    featuredImage: "/landing/x.webp",
    datePublished: "2026-01-01",
    dateModified: "2026-01-02",
    author: "Team",
    readMinutes: 3,
    tags: [],
    tldr: "Short [source one](https://example.org/one) answer.",
    resources: [{ label: "Res", href: "https://example.org/res", note: "n" }],
    faq: [{ question: "Q?", answer: "Read [the guide](/blog/some-guide) or [IRS](https://www.irs.gov/p463)." }],
    body: [
      { kind: "p", text: "See [our pricing](/pricing) and [Example](https://example.org/one) now." },
      { kind: "cta", title: "Try it", text: "Start [free](/signup).", label: "Create account", href: "/signup", note: "No card" },
      { kind: "scoreTable", caption: "Scores", columns: ["Speed", "Cost"], rows: [{ app: "Receipt Cycle", scores: [90, 81] }, { app: "Expensify", scores: [70, 60] }], note: "Higher is better" },
      { kind: "table", caption: "T", columns: ["App", "Note"], rows: [["Wave", "a [link](https://example.org/wave) here"]], tones: true },
    ],
  };

  it("counts visible link labels only and includes score table and cta text", () => {
    const text = blogPostText(demo);
    expect(text).not.toMatch(/\]\(|https?:\/\//);
    expect(text).toContain("Short source one answer.");
    expect(text).toContain("90% 81% 86%");
    expect(text).toContain("70% 60% 65%");
    expect(text).toContain("Overall");
    expect(text).toContain("Create account");
    expect(text).toContain("Higher is better");
    expect(text).toContain("Read the guide or IRS.");
  });

  it("cites real external sources from inline links and resources, deduped, never internal links", () => {
    const urls = blogCitations(demo).map((c) => c.url).sort();
    expect(urls).toEqual(
      ["https://example.org/one", "https://example.org/res", "https://example.org/wave", "https://www.irs.gov/p463"].sort(),
    );
  });

  it("lists the hero and in-article images as ImageObject entries", () => {
    const hero = { url: `${SITE_URL}/landing/x.webp`, width: 1600, height: 900, alt: "Hero alt", name: "Demo" };
    const inline = { url: `${SITE_URL}/landing/y.webp`, width: 800, height: 450, alt: "Caption", name: "Inline" };
    const [doc] = buildPageGraph({
      path: "/blog/demo",
      kind: "article",
      name: "Demo",
      description: "Demo",
      image: hero,
      article: {
        slug: "demo",
        headline: "Demo",
        description: "Demo",
        image: hero,
        images: [inline],
        datePublished: "2026-01-01",
        dateModified: "2026-01-02",
        authorName: "Team",
        keywords: [],
        section: "S",
        wordCount: 10,
        minutes: 3,
        citations: [],
      },
    });
    const post = (doc["@graph"] as Jsonld[]).find((n) => n["@type"] === "BlogPosting") as Jsonld;
    const images = post.image as Array<Record<string, unknown>>;
    expect(images).toHaveLength(2);
    expect(images[0]).toMatchObject({ "@type": "ImageObject", url: hero.url, width: 1600, height: 900, caption: "Hero alt", name: "Demo" });
    expect(images[1]).toMatchObject({ url: inline.url, width: 800, height: 450, caption: "Caption", name: "Inline" });
  });

  it("describes the author Philip as a Person and any other author as an Organization", () => {
    expect(authorNode("Philip")).toMatchObject({
      "@type": "Person",
      name: "Philip",
      image: "https://receiptcycle.com/authors/philip-512.webp",
      worksFor: { "@id": ORG_ID },
    });
    expect(authorNode("Someone Else")).toMatchObject({ "@type": "Organization", name: "Someone Else" });
  });

  it("adds a VideoObject for each embedded YouTube video and none otherwise", () => {
    const base = {
      path: "/blog/demo-video",
      kind: "article" as const,
      name: "Demo",
      description: "Demo",
      image: { url: "https://receiptcycle.com/landing/blog-demo.webp", width: 1600, height: 900, alt: "Alt", name: "Demo" },
    };
    const article = {
      slug: "demo-video",
      headline: "Demo",
      description: "Demo",
      image: base.image,
      datePublished: "2026-01-01",
      dateModified: "2026-01-02",
      authorName: "Philip",
      keywords: [],
      section: "S",
      wordCount: 10,
      minutes: 3,
      citations: [],
    };
    const [none] = buildPageGraph({ ...base, article });
    expect((none["@graph"] as Jsonld[]).some((n) => n["@type"] === "VideoObject")).toBe(false);
    const [withVideo] = buildPageGraph({
      ...base,
      article: { ...article, videos: [{ id: "abc123XYZ_-", title: "How it works", description: "A short demo.", uploadDate: "2026-10-01" }] },
    });
    const video = (withVideo["@graph"] as Jsonld[]).find((n) => n["@type"] === "VideoObject") as Jsonld;
    expect(video).toMatchObject({
      name: "How it works",
      uploadDate: "2026-10-01",
      embedUrl: "https://www.youtube.com/embed/abc123XYZ_-",
      thumbnailUrl: ["https://i.ytimg.com/vi/abc123XYZ_-/hqdefault.jpg"],
    });
  });
});
