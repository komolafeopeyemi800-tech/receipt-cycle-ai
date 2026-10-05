import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { getRouteSeo } from "@/content/routesSeo";
import AiReceiptScannerLanding from "./AiReceiptScannerLanding";

describe("AiReceiptScannerLanding", () => {
  it("keeps the scanner intent focused and the audience illustrations interactive", () => {
    const { container } = render(
      <MemoryRouter>
        <AiReceiptScannerLanding />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/AI receipt scanner for faster expense capture/i);

    const hero = container.querySelector("main section");
    expect(hero).not.toBeNull();
    expect(within(hero as HTMLElement).getAllByRole("link", { name: /scan your first receipt/i })).toHaveLength(1);
    expect(within(hero as HTMLElement).queryByRole("link", { name: /see how/i })).not.toBeInTheDocument();

    const visibleCopy = container.textContent ?? "";
    const words = visibleCopy.trim().split(/\s+/).filter(Boolean);
    expect(words.length).toBeGreaterThanOrEqual(1600);
    expect(visibleCopy).not.toContain("—");
    expect(visibleCopy).toMatch(/AI receipt scanner app/i);
    expect(visibleCopy).toMatch(/receipt scanning software/i);
    expect(visibleCopy).toMatch(/receipt OCR software/i);
    expect(visibleCopy).toMatch(/receipt scanner for taxes/i);
    expect(visibleCopy).toMatch(/receipt tracking software/i);

    const audienceTabs = screen.getAllByRole("tab");
    expect(audienceTabs).toHaveLength(4);
    fireEvent.click(screen.getByRole("tab", { name: /operations teams/i }));
    expect(screen.getByRole("tabpanel").querySelector("img")).toHaveAttribute(
      "src",
      "/landing/audiences/scanner-operations.webp",
    );
  });

  it("has unique metadata and matching scanner FAQ schema", () => {
    const seo = getRouteSeo("/ai-receipt-scanner/");

    expect(seo?.title).toBe("AI Receipt Scanner & Receipt OCR App | Receipt Cycle");
    expect(seo?.path).toBe("/ai-receipt-scanner");
    expect(seo?.ogImage).toContain("ai-receipt-scanner-og.png");
    expect(seo?.structuredData).toEqual(expect.arrayContaining([expect.objectContaining({ "@type": "FAQPage" })]));
    expect(JSON.stringify(seo?.structuredData)).not.toContain("AggregateRating");
  });
});
