import { describe, expect, it, vi } from "vitest";
import site, { canonicalRedirect } from "../../workers/site/index";
import { LEGACY_BLOG_ROUTES } from "@/content/legacyBlogRoutes";

describe("canonical edge routing", () => {
  it.each([
    ["http://www.receiptcycle.com/pricing/?utm_source=test", "https://receiptcycle.com/pricing?utm_source=test"],
    ["http://receiptcycle.com/", "https://receiptcycle.com/"],
    ["https://www.receiptcycle.com/privacy/index.html?q=1", "https://receiptcycle.com/privacy?q=1"],
    ["https://receiptcycle.com/signup/?next=%2Fpricing", "https://receiptcycle.com/signup?next=%2Fpricing"],
  ])("consolidates %s in one permanent redirect", (from, to) => {
    expect(canonicalRedirect(from)).toEqual({ url: to, status: 308 });
  });
  it.each(Object.entries(LEGACY_BLOG_ROUTES))("preserves published article %s", (oldPath, newPath) => {
    expect(canonicalRedirect(`https://www.receiptcycle.com${oldPath}/?ref=old`)).toEqual({ url: `https://receiptcycle.com${newPath}?ref=old`, status: 301 });
  });
  it("does not redirect canonical pages, local previews, or unrelated paths", () => {
    for (const url of ["https://receiptcycle.com/pricing", "http://localhost:8788/pricing", "https://demo.workers.dev/pricing", "https://receiptcycle.com/api/webhook/"]) expect(canonicalRedirect(url)).toBeNull();
  });
  it("preserves actual 404 status and makes error/preview responses noindex", async () => {
    const fetch = vi.fn(async () => new Response("missing", { status: 404, headers: { "Content-Type": "text/plain" } }));
    const response = await site.fetch(new Request("https://receiptcycle.com/assets/missing.js"), { ASSETS: { fetch } });
    expect(response.status).toBe(404);
    expect(response.headers.get("X-Robots-Tag")).toContain("noindex");
    expect(response.headers.get("Content-Type")).toBe("text/plain");
  });
  it("keeps mutable HTML caching and excludes version previews from indexing", async () => {
    const fetch = vi.fn(async () => new Response("<h1>Page</h1>", { headers: { "Content-Type": "text/html", "Cache-Control": "no-cache", ETag: "version" } }));
    const response = await site.fetch(new Request("https://preview.workers.dev/"), { ASSETS: { fetch } });
    expect(response.headers.get("Cache-Control")).toBe("no-cache");
    expect(response.headers.get("ETag")).toBe("version");
    expect(response.headers.get("X-Robots-Tag")).toContain("noindex");
  });
});
