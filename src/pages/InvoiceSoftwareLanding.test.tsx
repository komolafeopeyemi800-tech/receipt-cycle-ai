import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import InvoiceSoftwareLanding from "./InvoiceSoftwareLanding";

describe("InvoiceSoftwareLanding audience selector", () => {
  it("updates the illustration for each selected audience", () => {
    render(
      <MemoryRouter>
        <InvoiceSoftwareLanding />
      </MemoryRouter>,
    );

    const cases = [
      ["Freelancers", "invoice-freelancer.webp", "freelancer preparing a client invoice"],
      ["Consultants", "invoice-consultant.webp", "consultant reviewing an approved client invoice"],
      ["Small business owners", "invoice-small-business.webp", "small business owner billing from a workshop"],
      ["Small teams", "invoice-small-team.webp", "small team reviewing invoices together"],
    ] as const;

    for (const [label, filename, altText] of cases) {
      const tab = screen.getByRole("tab", { name: label });
      fireEvent.click(tab);

      expect(tab).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("img", { name: new RegExp(altText, "i") })).toHaveAttribute(
        "src",
        expect.stringContaining(filename),
      );
    }
  });

  it("supports arrow-key navigation between audiences", () => {
    render(
      <MemoryRouter>
        <InvoiceSoftwareLanding />
      </MemoryRouter>,
    );

    const freelancerTab = screen.getByRole("tab", { name: "Freelancers" });
    fireEvent.keyDown(freelancerTab, { key: "ArrowDown" });

    expect(screen.getByRole("tab", { name: "Consultants" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("img", { name: /consultant reviewing an approved client invoice/i })).toHaveAttribute(
      "src",
      expect.stringContaining("invoice-consultant.webp"),
    );
  });
});
