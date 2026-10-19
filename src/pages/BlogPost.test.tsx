import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { BlogPost as BlogPostData } from "@/content/blogPosts";

const demoPost: BlogPostData = {
  slug: "demo-rich-post",
  title: "Demo rich article",
  description: "Demo description",
  featuredImage: "/landing/blog-maximize-tax-refund-by-scanning-receipts.webp?v=1",
  featuredImageAlt: "A phone scanning a receipt",
  featuredImageWidth: 1600,
  featuredImageHeight: 900,
  category: "Receipt scanning",
  datePublished: "2026-04-01",
  dateModified: "2026-05-02",
  author: "Receipt Cycle Team",
  readMinutes: 4,
  tags: ["demo"],
  tldr: "Short answer with a [source](https://example.org/source) link.",
  resources: [
    { label: "Example source", href: "https://www.example.org/docs/page", note: "Primary documentation" },
    { label: "Our pricing", href: "/pricing" },
  ],
  faq: [{ question: "Is it good?", answer: "Yes, see [the guide](/blog/some-guide) and [IRS](https://www.irs.gov/p463)." }],
  body: [
    { kind: "p", text: "Read [our pricing](/pricing) and [an outside study](https://example.org/study) today." },
    { kind: "h2", text: "Scores", id: "scores" },
    {
      kind: "scoreTable",
      caption: "Feature comparison scores",
      columns: ["Speed", "Cost", "Export"],
      rows: [
        { app: "Receipt Cycle", scores: [90, 81, 100] },
        { app: "Expensify", scores: [70, 60, 55] },
        { app: "Mystery App", scores: [10, 20, 30] },
      ],
      note: "Scores are editorial.",
    },
    {
      kind: "table",
      caption: "Tone table",
      columns: ["App", "Best for"],
      rows: [
        ["Wave", "Free bookkeeping"],
        ["QuickBooks Online", "Accountants"],
        ["Unknown Co", "Anything"],
      ],
      tones: true,
    },
    { kind: "cta", title: "Try it free", text: "Start now.", label: "Create account", href: "/signup", note: "No card needed" },
    { kind: "cta", title: "Read more", text: "External.", label: "Open docs", href: "https://example.org/docs" },
    { kind: "image", src: "/landing/hero-phone.png", alt: "Phone", caption: "Caption", width: 1376, height: 768, title: "Phone screenshot", href: "https://example.org/phone" },
  ],
};

vi.mock("@/content/blogPosts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/content/blogPosts")>();
  return {
    ...actual,
    getPostBySlug: (slug: string) => (slug === "demo-rich-post" ? demoPost : actual.getPostBySlug(slug)),
  };
});

import BlogPost from "./BlogPost";
import { aiSummaryLinks, articleSummaryPrompt } from "@/lib/blogAiSummary";

const path = "/blog/best-receipt-scanner-app-small-business-2026";
const canonicalUrl = `https://receiptcycle.com${path}`;

function renderArticle(entry = path) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/blog/:slug" element={<BlogPost />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("BlogPost article layout", () => {
  it("shows the author details, short version, takeaways, comparison, and FAQ", () => {
    renderArticle();

    expect(screen.getByRole("heading", { level: 1, name: /best receipt scanner app/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Article details")).toHaveTextContent("Receipt Cycle Team");
    expect(screen.getAllByText("Here’s the short version").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Key Takeaways" })).toBeInTheDocument();
    expect(screen.getAllByRole("table", { name: /compared by fit, price and catch/i })[0]).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Frequently asked questions" })).toBeInTheDocument();
    expect(screen.getAllByRole("navigation", { name: "Table of contents" })).toHaveLength(2);
  });

  it("builds URL-encoded AI summary links with the canonical article URL", () => {
    expect(articleSummaryPrompt(canonicalUrl)).toBe(
      `Summarize this article and answer any follow-up questions I have about it: url=${canonicalUrl}`,
    );
    const links = aiSummaryLinks(canonicalUrl);
    expect(links.map((link) => link.label)).toEqual(["ChatGPT", "Perplexity", "Claude", "Gemini", "Grok"]);
    for (const link of links) {
      expect(decodeURIComponent(link.href)).toContain(articleSummaryPrompt(canonicalUrl));
    }
    expect(links.find((l) => l.label === "Claude")!.href).toMatch(/^https:\/\/claude\.ai\/new\?q=/);

    renderArticle();
    expect(screen.getByRole("link", { name: /summarize this article with chatgpt/i })).toHaveAttribute(
      "href",
      expect.stringContaining("url%3Dhttps%3A%2F%2Freceiptcycle.com%2Fblog%2Fbest-receipt-scanner-app-small-business-2026"),
    );
  });
});

describe("BlogPost hero", () => {
  it("renders the breadcrumb, AI logo buttons with accessible names, and one eager hero image", () => {
    const { container } = renderArticle("/blog/demo-rich-post");
    const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(crumbs).getByText("Receipt scanning")).toHaveAttribute("aria-current", "page");

    for (const name of ["ChatGPT", "Perplexity", "Claude", "Gemini", "Grok"]) {
      const link = screen.getByRole("link", { name: `Summarize this article with ${name}` });
      expect(link).toHaveAttribute("title", `Summarize with ${name}`);
      expect(link.querySelector("img")).toHaveAttribute("src", expect.stringMatching(/^\/brand-logos\/ai\/.*\.svg$/));
    }

    const hero = screen.getByAltText("A phone scanning a receipt");
    expect(hero).toHaveAttribute("width", "1600");
    expect(hero).toHaveAttribute("height", "900");
    expect(hero).toHaveAttribute("loading", "eager");
    expect(hero).toHaveAttribute("fetchpriority", "high");
    expect(container.querySelectorAll('img[src*="blog-maximize-tax-refund"]')).toHaveLength(1);

    const details = screen.getByLabelText("Article details");
    expect(details).toHaveTextContent("Published April 1, 2026");
    expect(details).toHaveTextContent("Updated May 2, 2026");
    expect(details).toHaveTextContent("4 min read");
  });
});

describe("BlogPost rich blocks", () => {
  it("renders the score table with rounded overall averages and highlights Receipt Cycle", () => {
    renderArticle("/blog/demo-rich-post");
    const table = screen.getByRole("table", { name: "Feature comparison scores" });
    const ours = within(table).getByRole("columnheader", { name: /Receipt Cycle/ });
    expect(ours).toHaveAttribute("data-ours", "true");
    expect(within(ours).getByText("Our product")).toBeInTheDocument();
    const expensify = within(table).getByRole("columnheader", { name: /Expensify/ });
    expect(expensify).not.toHaveAttribute("data-ours");
    // overall row: (90 + 81 + 100) / 3 = 90.33 -> 90 and (70 + 60 + 55) / 3 = 61.67 -> 62
    const overall = within(table).getByRole("row", { name: /^Overall/ });
    expect(within(overall).getByText("90%")).toBeInTheDocument();
    expect(within(overall).getByText("62%")).toBeInTheDocument();
    // phone cards carry the same numbers
    const cards = screen.getByRole("list", { name: "Feature comparison scores" });
    expect(within(cards).getAllByText("Overall")).toHaveLength(3);
    expect(within(cards).getByText("62%")).toBeInTheDocument();
    expect(screen.getByText("Scores are editorial.")).toBeInTheDocument();
  });

  it("colours table rows by the app named in the first cell", () => {
    renderArticle("/blog/demo-rich-post");
    const table = screen.getByRole("table", { name: "Tone table" });
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows.map((r) => r.getAttribute("data-tone"))).toEqual(["violet", "green", "slate"]);
    expect(rows[0].className).toContain("border-l-violet-600");
  });

  it("renders cta cards with internal and external buttons", () => {
    renderArticle("/blog/demo-rich-post");
    const internal = screen.getByRole("link", { name: "Create account" });
    expect(internal).toHaveAttribute("href", "/signup");
    expect(internal).not.toHaveAttribute("target");
    expect(screen.getByText("No card needed")).toBeInTheDocument();
    const external = screen.getByRole("link", { name: "Open docs" });
    expect(external).toHaveAttribute("href", "https://example.org/docs");
    expect(external).toHaveAttribute("target", "_blank");
    expect(external).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders inline markdown links: internal with the router, external in a new tab", () => {
    renderArticle("/blog/demo-rich-post");
    const internal = screen.getByRole("link", { name: "our pricing" });
    expect(internal).toHaveAttribute("href", "/pricing");
    expect(internal).not.toHaveAttribute("target");
    const external = screen.getByRole("link", { name: "an outside study" });
    expect(external).toHaveAttribute("href", "https://example.org/study");
    expect(external).toHaveAttribute("target", "_blank");
    expect(external).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: "the guide" })).toHaveAttribute("href", "/blog/some-guide");
    expect(screen.getByRole("link", { name: "IRS" })).toHaveAttribute("target", "_blank");
    expect(document.body.textContent).not.toMatch(/\]\(/);
  });

  it("renders image attributes and wraps linked images", () => {
    renderArticle("/blog/demo-rich-post");
    const img = screen.getByAltText("Phone");
    expect(img).toHaveAttribute("width", "1376");
    expect(img).toHaveAttribute("height", "768");
    expect(img).toHaveAttribute("title", "Phone screenshot");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
    const wrapper = img.closest("a");
    expect(wrapper).toHaveAttribute("href", "https://example.org/phone");
    expect(wrapper).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("lists resources after the FAQ, in the table of contents, with hostnames and notes", () => {
    renderArticle("/blog/demo-rich-post");
    const heading = screen.getByRole("heading", { level: 2, name: "Resources and sources" });
    expect(heading).toHaveAttribute("id", "resources");
    const section = heading.closest("section")!;
    expect(within(section).getByRole("link", { name: "Example source" })).toHaveAttribute("href", "https://www.example.org/docs/page");
    expect(within(section).getByText("example.org")).toBeInTheDocument();
    expect(within(section).getByText("Primary documentation")).toBeInTheDocument();
    expect(within(section).getByRole("link", { name: "Our pricing" })).toHaveAttribute("href", "/pricing");
    const faq = screen.getByRole("heading", { name: "Frequently asked questions" });
    expect(faq.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    for (const toc of screen.getAllByRole("navigation", { name: "Table of contents" })) {
      expect(within(toc).getByRole("link", { name: /Resources and sources/ })).toHaveAttribute("href", "#resources");
    }
  });
});
