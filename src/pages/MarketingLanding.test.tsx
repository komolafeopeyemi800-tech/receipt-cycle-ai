import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import MarketingLanding from "./MarketingLanding";
import { getRouteSeo } from "@/content/routesSeo";

function renderPage() {
  return render(<MemoryRouter><MarketingLanding /></MemoryRouter>);
}

describe("MarketingLanding", () => {
  it("has one clear H1 and no invented social proof", () => {
    renderPage();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("The simpler way to run your business finances");
    expect(screen.queryByText(/average user rating/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/what our users say/i)).not.toBeInTheDocument();
  });

  it("exposes the product information architecture", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /products/i }));
    expect(screen.getAllByRole("link", { name: /invoices prepare/i })[0]).toHaveAttribute("href", "/invoice-software/");
    expect(screen.getAllByRole("link", { name: /receipt capture turn/i })[0]).toHaveAttribute("href", "/ai-receipt-scanner/");
  });

  it("uses claim-safe homepage metadata", () => {
    const seo = getRouteSeo("/");
    expect(seo?.title).toContain("Connected Business Records");
    expect(JSON.stringify(seo?.structuredData)).not.toContain("AggregateRating");
    expect(JSON.stringify(seo?.structuredData)).not.toContain("ratingCount");
  });
});
