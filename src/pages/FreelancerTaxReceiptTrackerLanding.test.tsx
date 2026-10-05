import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { getRouteSeo } from "@/content/routesSeo";
import FreelancerTaxReceiptTrackerLanding from "./FreelancerTaxReceiptTrackerLanding";

describe("FreelancerTaxReceiptTrackerLanding", () => {
  it("keeps the tax-preparation intent focused and switches each audience illustration", () => {
    const { container } = render(
      <MemoryRouter>
        <FreelancerTaxReceiptTrackerLanding />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /freelancer tax tracker for receipts and expense records/i,
    );

    const hero = container.querySelector("main section");
    expect(hero).not.toBeNull();
    expect(within(hero as HTMLElement).getAllByRole("link", { name: /organize your first tax receipt/i })).toHaveLength(1);
    expect(within(hero as HTMLElement).queryByRole("link", { name: /see how/i })).not.toBeInTheDocument();

    const visibleCopy = container.textContent ?? "";
    const words = visibleCopy.trim().split(/\s+/).filter(Boolean);
    expect(words.length).toBeGreaterThanOrEqual(1700);
    expect(visibleCopy).not.toContain("â€”");
    expect(visibleCopy).toMatch(/freelancer expense tracker/i);
    expect(visibleCopy).toMatch(/freelancer receipt tracker/i);
    expect(visibleCopy).toMatch(/tax receipt tracker/i);
    expect(visibleCopy).toMatch(/receipt tracker for taxes/i);
    expect(visibleCopy).toMatch(/self-employed expense tracker/i);
    expect(visibleCopy).toMatch(/business expense tracker for taxes/i);
    expect(visibleCopy).toMatch(/tax deduction tracker/i);
    expect(visibleCopy).toMatch(/CSV export/i);

    const audienceTabs = screen.getAllByRole("tab");
    expect(audienceTabs).toHaveLength(4);
    fireEvent.click(screen.getByRole("tab", { name: /self-employed contractors/i }));
    expect(screen.getByRole("tabpanel").querySelector("img")).toHaveAttribute(
      "src",
      "/landing/audiences/tax-service-contractor.webp",
    );
  });

  it("has unique metadata and tax-record FAQ schema without ratings", () => {
    const seo = getRouteSeo("/freelancer-tax-receipt-tracker/");

    expect(seo?.title).toBe("Freelancer Tax Tracker & Receipt Organizer | Receipt Cycle");
    expect(seo?.path).toBe("/freelancer-tax-receipt-tracker");
    expect(seo?.ogImage).toContain("freelancer-tax-receipt-tracker-og.png");
    expect(seo?.structuredData).toEqual(expect.arrayContaining([expect.objectContaining({ "@type": "FAQPage" })]));
    expect(JSON.stringify(seo?.structuredData)).not.toContain("AggregateRating");
  });
});
