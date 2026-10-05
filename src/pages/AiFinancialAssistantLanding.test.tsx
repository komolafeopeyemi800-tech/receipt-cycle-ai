import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { getRouteSeo } from "@/content/routesSeo";
import AiFinancialAssistantLanding from "./AiFinancialAssistantLanding";

describe("AiFinancialAssistantLanding", () => {
  it("keeps the AI analysis intent focused and switches role-specific artwork", () => {
    const { container } = render(
      <MemoryRouter>
        <AiFinancialAssistantLanding />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/AI financial assistant grounded in your business records/i);

    const hero = container.querySelector("main section");
    expect(hero).not.toBeNull();
    expect(within(hero as HTMLElement).getAllByRole("link", { name: /ask your first financial question/i })).toHaveLength(1);
    expect(within(hero as HTMLElement).queryByRole("link", { name: /see how/i })).not.toBeInTheDocument();

    const visibleCopy = container.textContent ?? "";
    const words = visibleCopy.trim().split(/\s+/).filter(Boolean);
    expect(words.length).toBeGreaterThanOrEqual(1700);
    expect(visibleCopy).not.toContain("—");
    expect(visibleCopy).not.toContain("Ã¢â‚¬â€");
    expect(visibleCopy).toMatch(/AI expense analysis/i);
    expect(visibleCopy).toMatch(/AI spending analysis/i);
    expect(visibleCopy).toMatch(/AI financial insights/i);
    expect(visibleCopy).toMatch(/AI business finance assistant/i);
    expect(visibleCopy).toMatch(/AI bookkeeping assistant/i);
    expect(visibleCopy).toMatch(/AI financial dashboard/i);
    expect(visibleCopy).toMatch(/AI expense tracker/i);
    expect(visibleCopy).toMatch(/AI expense reporting/i);
    expect(visibleCopy).toMatch(/merchant patterns/i);
    expect(visibleCopy).toMatch(/possible repeats/i);
    expect(visibleCopy).toMatch(/does not (silently edit|edit)/i);

    expect(screen.getAllByRole("tab")).toHaveLength(4);
    fireEvent.click(screen.getByRole("tab", { name: /operations administrators/i }));
    expect(screen.getByRole("tabpanel").querySelector("img")).toHaveAttribute(
      "src",
      "/landing/audiences/ai-assistant-operations-admin.webp",
    );
  });

  it("has unique metadata, software schema, and matching FAQ schema", () => {
    const seo = getRouteSeo("/ai-financial-assistant/");

    expect(seo?.title).toBe("AI Financial Assistant for Small Business | Receipt Cycle");
    expect(seo?.path).toBe("/ai-financial-assistant");
    expect(seo?.ogImage).toContain("ai-financial-assistant-og.png");
    expect(seo?.structuredData).toEqual(expect.arrayContaining([
      expect.objectContaining({ "@type": "WebPage" }),
      expect.objectContaining({ "@type": "FAQPage" }),
    ]));
    expect(JSON.stringify(seo?.structuredData)).not.toContain("AggregateRating");
  });
});
