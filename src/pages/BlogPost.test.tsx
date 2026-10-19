import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import BlogPost from "./BlogPost";
import { aiSummaryLinks, articleSummaryPrompt } from "@/lib/blogAiSummary";

const path = "/blog/best-receipt-scanner-app-small-business-2026";
const canonicalUrl = `https://receiptcycle.com${path}`;

function renderArticle() {
  return render(
    <MemoryRouter initialEntries={[path]}>
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
    expect(screen.getByRole("table", { name: /receipt scanner app comparison/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Frequently asked questions" })).toBeInTheDocument();
    expect(screen.getAllByRole("navigation", { name: "Table of contents" })).toHaveLength(2);
  });

  it("builds URL-encoded AI summary links with the canonical article URL", () => {
    expect(articleSummaryPrompt(canonicalUrl)).toBe(
      `Summarize this article and answer any follow-up questions I have about it: url=${canonicalUrl}`,
    );
    const links = aiSummaryLinks(canonicalUrl);
    expect(links.map((link) => link.label)).toEqual(["ChatGPT", "Perplexity", "Gemini", "Grok"]);
    for (const link of links) {
      expect(decodeURIComponent(link.href)).toContain(articleSummaryPrompt(canonicalUrl));
    }

    renderArticle();
    expect(screen.getByRole("link", { name: /summarize this article with chatgpt/i })).toHaveAttribute(
      "href",
      expect.stringContaining("url%3Dhttps%3A%2F%2Freceiptcycle.com%2Fblog%2Fbest-receipt-scanner-app-small-business-2026"),
    );
  });
});
