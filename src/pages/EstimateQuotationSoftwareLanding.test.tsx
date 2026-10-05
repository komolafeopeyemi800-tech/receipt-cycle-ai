import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { getRouteSeo } from "@/content/routesSeo";
import EstimateQuotationSoftwareLanding from "./EstimateQuotationSoftwareLanding";

describe("EstimateQuotationSoftwareLanding", () => {
  it("keeps a focused hero and complete commercial copy", () => {
    const { container } = render(
      <MemoryRouter>
        <EstimateQuotationSoftwareLanding />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/estimate software for service businesses and independent contractors/i);

    const hero = container.querySelector("main section");
    expect(hero).not.toBeNull();
    expect(within(hero as HTMLElement).getAllByRole("link", { name: /create your first estimate/i })).toHaveLength(1);
    expect(within(hero as HTMLElement).queryByRole("link", { name: /see how/i })).not.toBeInTheDocument();

    const visibleCopy = container.textContent ?? "";
    const words = visibleCopy.trim().split(/\s+/).filter(Boolean);
    expect(words.length).toBeGreaterThanOrEqual(1600);
    expect(visibleCopy).not.toContain("—");
    expect(visibleCopy).toMatch(/estimate generator/i);
    expect(visibleCopy).toMatch(/quotation management software/i);
    expect(visibleCopy).toMatch(/contractor estimating software/i);
    expect(visibleCopy).toMatch(/quote and invoice software/i);

    const audienceTabs = screen.getAllByRole("tab");
    expect(audienceTabs).toHaveLength(4);
    fireEvent.click(screen.getByRole("tab", { name: /service contractors/i }));
    expect(screen.getByRole("tabpanel").querySelector("img")).toHaveAttribute("src", "/landing/audiences/estimate-service-contractor.webp");
  });

  it("has unique SEO metadata and matching FAQ schema", () => {
    const seo = getRouteSeo("/estimate-quotation-software/");

    expect(seo?.title).toBe("Estimate Software & Quotation Maker | Receipt Cycle");
    expect(seo?.path).toBe("/estimate-quotation-software");
    expect(seo?.ogImage).toContain("estimate-quotation-software-og.png");
    expect(seo?.structuredData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ "@type": "FAQPage" }),
      ]),
    );
  });
});
