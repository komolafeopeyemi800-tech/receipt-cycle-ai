import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { getRouteSeo } from "@/content/routesSeo";
import BusinessTravelExpenseTrackerLanding from "./BusinessTravelExpenseTrackerLanding";

describe("BusinessTravelExpenseTrackerLanding", () => {
  it("keeps one travel intent and switches each audience illustration", () => {
    const { container } = render(
      <MemoryRouter>
        <BusinessTravelExpenseTrackerLanding />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/business travel expense tracker for the whole trip/i);

    const hero = container.querySelector("main section");
    expect(hero).not.toBeNull();
    expect(within(hero as HTMLElement).getAllByRole("link", { name: /track your first travel expense/i })).toHaveLength(1);
    expect(within(hero as HTMLElement).queryByRole("link", { name: /see how/i })).not.toBeInTheDocument();

    const visibleCopy = container.textContent ?? "";
    const words = visibleCopy.trim().split(/\s+/).filter(Boolean);
    expect(words.length).toBeGreaterThanOrEqual(1700);
    expect(visibleCopy).not.toContain("—");
    expect(visibleCopy).toMatch(/business travel expense tracking/i);
    expect(visibleCopy).toMatch(/business trip expense report/i);
    expect(visibleCopy).toMatch(/travel expense tracking software/i);
    expect(visibleCopy).toMatch(/business expense tracking software/i);
    expect(visibleCopy).toMatch(/small business expense tracker/i);
    expect(visibleCopy).toMatch(/business travel expense reconciliation/i);
    expect(visibleCopy).toMatch(/travel expense claims software/i);

    const audienceTabs = screen.getAllByRole("tab");
    expect(audienceTabs).toHaveLength(4);
    fireEvent.click(screen.getByRole("tab", { name: /field-service travelers/i }));
    expect(screen.getByRole("tabpanel").querySelector("img")).toHaveAttribute(
      "src",
      "/landing/audiences/travel-field-service.webp",
    );
  });

  it("has unique metadata and matching travel FAQ schema", () => {
    const seo = getRouteSeo("/business-travel-expense-tracker/");

    expect(seo?.title).toBe("Business Travel Expense Tracker & Trip Expenses | Receipt Cycle");
    expect(seo?.path).toBe("/business-travel-expense-tracker");
    expect(seo?.ogImage).toContain("business-travel-expense-tracker-og.png");
    expect(seo?.structuredData).toEqual(expect.arrayContaining([expect.objectContaining({ "@type": "FAQPage" })]));
    expect(JSON.stringify(seo?.structuredData)).not.toContain("AggregateRating");
  });
});
