import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { getRouteSeo } from "@/content/routesSeo";
import BusinessBudgetingSoftwareLanding from "./BusinessBudgetingSoftwareLanding";

describe("BusinessBudgetingSoftwareLanding", () => {
  it("keeps the budgeting intent focused and switches each audience illustration", () => {
    const { container } = render(
      <MemoryRouter>
        <BusinessBudgetingSoftwareLanding />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/business budgeting software that keeps spending in view/i);

    const hero = container.querySelector("main section");
    expect(hero).not.toBeNull();
    expect(within(hero as HTMLElement).getAllByRole("link", { name: /set your first budget/i })).toHaveLength(1);
    expect(within(hero as HTMLElement).queryByRole("link", { name: /see how/i })).not.toBeInTheDocument();

    const visibleCopy = container.textContent ?? "";
    const words = visibleCopy.trim().split(/\s+/).filter(Boolean);
    expect(words.length).toBeGreaterThanOrEqual(1700);
    expect(visibleCopy).not.toContain("â€”");
    expect(visibleCopy).toMatch(/small business budgeting software/i);
    expect(visibleCopy).toMatch(/business budget tracker/i);
    expect(visibleCopy).toMatch(/business budgeting app/i);
    expect(visibleCopy).toMatch(/expense budget software/i);
    expect(visibleCopy).toMatch(/budget management software/i);
    expect(visibleCopy).toMatch(/monthly category limits/i);
    expect(visibleCopy).toMatch(/budget versus actual/i);
    expect(visibleCopy).toMatch(/budget alerts/i);

    const audienceTabs = screen.getAllByRole("tab");
    expect(audienceTabs).toHaveLength(4);
    fireEvent.click(screen.getByRole("tab", { name: /service-business operators/i }));
    expect(screen.getByRole("tabpanel").querySelector("img")).toHaveAttribute(
      "src",
      "/landing/audiences/budget-service-operator.webp",
    );
  });

  it("has unique metadata and matching budgeting FAQ schema", () => {
    const seo = getRouteSeo("/business-budgeting-software/");

    expect(seo?.title).toBe("Business Budgeting Software for Small Teams | Receipt Cycle");
    expect(seo?.path).toBe("/business-budgeting-software");
    expect(seo?.ogImage).toContain("business-budgeting-software-og.png");
    expect(seo?.structuredData).toEqual(expect.arrayContaining([expect.objectContaining({ "@type": "FAQPage" })]));
    expect(JSON.stringify(seo?.structuredData)).not.toContain("AggregateRating");
  });
});
