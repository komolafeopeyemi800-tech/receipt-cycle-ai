import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { getRouteSeo } from "@/content/routesSeo";
import ExpenseReportingSoftwareLanding from "./ExpenseReportingSoftwareLanding";

describe("ExpenseReportingSoftwareLanding", () => {
  it("keeps the expense-reporting intent focused and switches audience artwork", () => {
    const { container } = render(
      <MemoryRouter>
        <ExpenseReportingSoftwareLanding />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/expense report software for a complete business view/i);

    const hero = container.querySelector("main section");
    expect(hero).not.toBeNull();
    expect(within(hero as HTMLElement).getAllByRole("link", { name: /create your reporting workspace/i })).toHaveLength(1);
    expect(within(hero as HTMLElement).queryByRole("link", { name: /see how/i })).not.toBeInTheDocument();

    const visibleCopy = container.textContent ?? "";
    const words = visibleCopy.trim().split(/\s+/).filter(Boolean);
    expect(words.length).toBeGreaterThanOrEqual(1700);
    expect(visibleCopy).not.toContain("â€”");
    expect(visibleCopy).toMatch(/expense reporting software/i);
    expect(visibleCopy).toMatch(/business expense reporting software/i);
    expect(visibleCopy).toMatch(/expense report app/i);
    expect(visibleCopy).toMatch(/small business expense reporting/i);
    expect(visibleCopy).toMatch(/expense management and reporting/i);
    expect(visibleCopy).toMatch(/business financial reports/i);
    expect(visibleCopy).toMatch(/business spending reports/i);
    expect(visibleCopy).toMatch(/automated expense reports/i);
    expect(visibleCopy).toMatch(/cash flow/i);
    expect(visibleCopy).toMatch(/overdue invoices/i);

    expect(screen.getAllByRole("tab")).toHaveLength(4);
    fireEvent.click(screen.getByRole("tab", { name: /operations administrators/i }));
    expect(screen.getByRole("tabpanel").querySelector("img")).toHaveAttribute(
      "src",
      "/landing/audiences/report-operations-admin.webp",
    );
  });

  it("has unique metadata and matching reporting FAQ schema", () => {
    const seo = getRouteSeo("/expense-reporting-software/");

    expect(seo?.title).toBe("Expense Report Software for Small Business | Receipt Cycle");
    expect(seo?.path).toBe("/expense-reporting-software");
    expect(seo?.ogImage).toContain("expense-reporting-software-og.png");
    expect(seo?.structuredData).toEqual(expect.arrayContaining([expect.objectContaining({ "@type": "FAQPage" })]));
    expect(JSON.stringify(seo?.structuredData)).not.toContain("AggregateRating");
  });
});
