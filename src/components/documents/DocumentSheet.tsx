import { useEffect, useMemo, useState } from "react";
import { useDesktopBusiness, type BusinessProfile, type DesktopCustomer, type DesktopEstimate, type DesktopInvoice, type InvoicePreferences } from "@/contexts/DesktopBusinessContext";
import { useWebPreferences } from "@/contexts/WebPreferencesContext";
import { buildWebDocument, showableLogo, type DocKind, type DocLayout, type DocLogo } from "@/lib/documents/build";
import { layoutToSvgPages, printLayout } from "@/lib/documents/svg";

/** Measures the business logo (when it is an embedded image or web address) so the layout can fit it. */
function useLogo(uri: string | null | undefined): DocLogo | null {
  const shown = showableLogo(uri);
  const [logo, setLogo] = useState<DocLogo | null>(null);
  useEffect(() => {
    setLogo(null);
    if (!shown || typeof Image === "undefined") return;
    let live = true;
    const img = new Image();
    img.onload = () => {
      if (live && img.naturalWidth && img.naturalHeight) setLogo({ uri: shown, width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = shown;
    return () => {
      live = false;
    };
  }, [shown]);
  return logo;
}

/**
 * The document exactly as the phone app lays it out (same engine, same saved style and "what to show" switches),
 * plus a print function that sends only the document to the printer.
 */
export function useDocumentLayout(
  kind: DocKind,
  doc: DesktopInvoice | DesktopEstimate | null,
  /** Lets the settings page preview unsaved choices with a sample customer. */
  override: { prefs?: InvoicePreferences; business?: BusinessProfile; customers?: DesktopCustomer[] } = {},
) {
  const ctx = useDesktopBusiness();
  const customers = override.customers ?? ctx.customers;
  const business = override.business ?? ctx.business;
  const invoicePreferences = override.prefs ?? ctx.invoicePreferences;
  const { currency, formatDate, numberFormat } = useWebPreferences();
  const logo = useLogo(business.logoUri);
  const layout = useMemo<DocLayout | null>(
    () => (doc ? buildWebDocument(kind, doc, { customers, business, prefs: invoicePreferences, currency, formatDate, logo }) : null),
    // numberFormat is read by the engine through a module setting, so a change must rebuild the layout
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kind, doc, customers, business, invoicePreferences, currency, formatDate, logo, numberFormat],
  );
  const print = () => {
    if (layout && doc) printLayout(layout, `${kind === "INVOICE" ? "Invoice" : "Estimate"} ${doc.number}`);
  };
  return { layout, print };
}

/** Shows each page of a laid-out document, scaled to the width it is given. */
export function DocumentPages({ layout }: { layout: DocLayout | null }) {
  const pages = useMemo(() => (layout ? layoutToSvgPages(layout) : []), [layout]);
  if (!layout) return null;
  return (
    <div className="mx-auto w-full max-w-2xl space-y-3" data-testid="document-pages">
      {pages.map((svg, index) => (
        <div
          key={index}
          className="w-full overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
          style={{ aspectRatio: `${layout.w} / ${layout.h}` }}
          // The markup is built by our own layout code from escaped text, never from raw user HTML.
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ))}
    </div>
  );
}
