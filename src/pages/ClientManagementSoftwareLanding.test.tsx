import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { getRouteSeo } from "@/content/routesSeo";
import ClientManagementSoftwareLanding from "./ClientManagementSoftwareLanding";

describe("ClientManagementSoftwareLanding", () => {
  it("keeps the client-management intent focused and switches audience artwork", () => {
    const { container } = render(
      <MemoryRouter>
        <ClientManagementSoftwareLanding />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/client management software for small business billing/i);

    const hero = container.querySelector("main section");
    expect(hero).not.toBeNull();
    expect(within(hero as HTMLElement).getAllByRole("link", { name: /add your first customer/i })).toHaveLength(1);
    expect(within(hero as HTMLElement).queryByRole("link", { name: /see how/i })).not.toBeInTheDocument();

    const visibleCopy = container.textContent ?? "";
    const words = visibleCopy.trim().split(/\s+/).filter(Boolean);
    expect(words.length).toBeGreaterThanOrEqual(1700);
    expect(visibleCopy).not.toContain("â€”");
    expect(visibleCopy).toMatch(/customer management software/i);
    expect(visibleCopy).toMatch(/client management app/i);
    expect(visibleCopy).toMatch(/customer database/i);
    expect(visibleCopy).toMatch(/client invoice management/i);
    expect(visibleCopy).toMatch(/customer billing software/i);
    expect(visibleCopy).toMatch(/client management for freelancers/i);
    expect(visibleCopy).toMatch(/outstanding balance/i);
    expect(visibleCopy).toMatch(/reusable item catalog/i);

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(4);
    fireEvent.click(screen.getByRole("tab", { name: /service businesses/i }));
    expect(screen.getByRole("tabpanel").querySelector("img")).toHaveAttribute(
      "src",
      "/landing/audiences/client-service-business.webp",
    );
  });

  it("has unique metadata and matching client-management FAQ schema", () => {
    const seo = getRouteSeo("/client-management-software/");

    expect(seo?.title).toBe("Client Management Software for Small Business | Receipt Cycle");
    expect(seo?.path).toBe("/client-management-software");
    expect(seo?.ogImage).toContain("client-management-software-og.png");
    expect(seo?.structuredData).toEqual(expect.arrayContaining([expect.objectContaining({ "@type": "FAQPage" })]));
    expect(JSON.stringify(seo?.structuredData)).not.toContain("AggregateRating");
  });
});
