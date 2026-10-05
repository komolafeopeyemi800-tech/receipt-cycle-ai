import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { getRouteSeo } from "@/content/routesSeo";
import PaymentTrackingSoftwareLanding from "./PaymentTrackingSoftwareLanding";

describe("PaymentTrackingSoftwareLanding", () => {
  it("keeps the payment intent focused and the audience illustrations interactive", () => {
    const { container } = render(
      <MemoryRouter>
        <PaymentTrackingSoftwareLanding />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/payment tracking software for invoicing and recurring billing/i);

    const hero = container.querySelector("main section");
    expect(hero).not.toBeNull();
    expect(within(hero as HTMLElement).getAllByRole("link", { name: /record your first payment/i })).toHaveLength(1);
    expect(within(hero as HTMLElement).queryByRole("link", { name: /see how/i })).not.toBeInTheDocument();

    const visibleCopy = container.textContent ?? "";
    const words = visibleCopy.trim().split(/\s+/).filter(Boolean);
    expect(words.length).toBeGreaterThanOrEqual(1600);
    expect(visibleCopy).not.toContain("â€”");
    expect(visibleCopy).toMatch(/payment management software/i);
    expect(visibleCopy).toMatch(/payment receipt generator/i);
    expect(visibleCopy).toMatch(/accounts receivable tracking software/i);
    expect(visibleCopy).toMatch(/business payment tracker/i);
    expect(visibleCopy).toMatch(/payment tracking for freelancers/i);

    const audienceTabs = screen.getAllByRole("tab");
    expect(audienceTabs).toHaveLength(4);
    fireEvent.click(screen.getByRole("tab", { name: /small teams/i }));
    expect(screen.getByRole("tabpanel").querySelector("img")).toHaveAttribute("src", "/landing/audiences/payment-small-team.webp");
  });

  it("has unique metadata and matching payment FAQ schema", () => {
    const seo = getRouteSeo("/payment-tracking-software/");

    expect(seo?.title).toBe("Payment Tracking Software & Receipt Manager | Receipt Cycle");
    expect(seo?.path).toBe("/payment-tracking-software");
    expect(seo?.ogImage).toContain("payment-tracking-software-og.png");
    expect(seo?.structuredData).toEqual(expect.arrayContaining([expect.objectContaining({ "@type": "FAQPage" })]));
  });
});
