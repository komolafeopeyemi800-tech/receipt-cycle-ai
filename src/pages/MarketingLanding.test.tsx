import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import MarketingLanding from "./MarketingLanding";
import { getRouteSeo } from "@/content/routesSeo";
import { PLAY_STORE_URL } from "@/content/site";

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
    expect(screen.getAllByRole("link", { name: /^invoices$/i })[0]).toHaveAttribute("href", "/invoice-software/");
    expect(screen.getAllByRole("link", { name: /^receipt capture$/i })[0]).toHaveAttribute("href", "/ai-receipt-scanner/");
  });

  it("uses claim-safe homepage metadata", () => {
    const seo = getRouteSeo("/");
    expect(seo?.title).toContain("Connected Business Records");
    expect(JSON.stringify(seo?.structuredData)).not.toContain("AggregateRating");
    expect(JSON.stringify(seo?.structuredData)).not.toContain("ratingCount");
  });

  it("sends every Google Play call to action to the live app listing", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /open navigation/i }));
    const storeLinks = screen.getAllByRole("link").filter((link) => link.getAttribute("href")?.includes("play.google.com"));
    expect(storeLinks.length).toBeGreaterThanOrEqual(4);
    for (const link of storeLinks) {
      expect(link).toHaveAttribute("href", PLAY_STORE_URL);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("places an accessible product walkthrough after the hero", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /see receipt cycle in action/i })).toBeInTheDocument();
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(5);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("tab", { name: /^budgets$/i }));
    expect(screen.getByRole("tab", { name: /^budgets$/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("button", { name: /play product demonstration/i })).not.toBeInTheDocument();
  });

  it("lets visitors inspect every verified workflow without waiting for autoplay", () => {
    renderPage();

    fireEvent.click(screen.getByRole("tab", { name: /^capture$/i }));
    expect(screen.getByRole("heading", { name: /review receipt/i })).toBeInTheDocument();
    expect(screen.getByAltText(/oak street grill receipt/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /^transactions$/i }));
    expect(screen.getByRole("heading", { name: /records and documents/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /cloudnest workspace/i }));
    expect(screen.getAllByText(/cloudnest-invoice-1048\.pdf/i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /horizon community bank/i }));
    expect(screen.getAllByText(/closing balance/i).length).toBeGreaterThan(0);
    expect(screen.getByAltText("Shell logo")).toHaveAttribute("src", "/brand-logos/shell.svg");
    expect(screen.getByText(/brand names and logos belong to their owners/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /brightgrid electric/i }));
    expect(screen.getByRole("heading", { name: /brightgrid electric/i })).toBeInTheDocument();
    expect(screen.getAllByText(/^tax$/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("tab", { name: /invoices & estimates/i }));
    expect(screen.getByRole("heading", { name: /live document preview/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^invoice$/i }));
    expect(screen.getByText("INV-2026-014")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /more settings/i }));
    expect(screen.getByRole("button", { name: /tax summary/i })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("tab", { name: /^budgets$/i }));
    fireEvent.click(screen.getByRole("button", { name: /groceries/i }));
    expect(screen.getByText("Groceries budget")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /payments & reminders/i }));
    expect(screen.getByRole("heading", { name: /invoice activity/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /northstar creative/i }));
    expect(screen.getByText(/reminder ready for review/i)).toBeInTheDocument();
  }, 15_000);
});
