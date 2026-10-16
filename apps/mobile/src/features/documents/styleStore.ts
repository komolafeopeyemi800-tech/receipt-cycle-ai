import type { InvoiceSettings } from "../sales/setupData";
import { ACCENTS, DEFAULT_ACCENT, DEFAULT_DOC_OPTIONS, type DocKind, type DocOptions, type DocTemplate, type PaperSize } from "./layout";

export type ResolvedStyle = { template: DocTemplate; accent: string; paper: PaperSize; formatDate: (ymd: string) => string; options: DocOptions; paymentInstructions: string };

const fallbackDate = (ymd: string) => ymd;
let formatDateFn: (ymd: string) => string = fallbackDate;
let settings: InvoiceSettings | null = null;
let loaded = false;

/** Called by <DocumentStyleSync/> whenever settings or the date format change, so every PDF is built with the current look. */
export function setDocumentStyleSource(next: InvoiceSettings | null, formatDate: (ymd: string) => string, ready = true) {
  loaded = ready && next !== null;
  settings = next;
  formatDateFn = formatDate || fallbackDate;
}

export function resolveDocumentStyle(kind: DocKind, source: InvoiceSettings | null = settings, formatDate: (ymd: string) => string = formatDateFn): ResolvedStyle {
  const template = (kind === "ESTIMATE" ? source?.estimateTemplate : source?.invoiceTemplate) === "compact" ? "compact" : "standard";
  const raw = kind === "ESTIMATE" ? source?.estimateColor : source?.invoiceColor;
  const accent = ACCENTS.some((a) => a.hex === raw) ? (raw as string) : DEFAULT_ACCENT;
  const saved = (kind === "ESTIMATE" ? source?.docOptions?.ESTIMATE : source?.docOptions?.INVOICE) ?? {};
  return { template, accent, paper: source?.paperSize === "letter" ? "letter" : "a4", formatDate, options: { ...DEFAULT_DOC_OPTIONS, ...saved } as DocOptions, paymentInstructions: source?.paymentInstructions ?? "" };
}

/** The saved style for PDFs. Refuses to answer before the settings are loaded, so nobody gets a generic default by accident. */
export function getDocumentStyle(kind: DocKind): ResolvedStyle {
  if (!loaded) throw new Error("Your invoice style settings are still loading. Please try again in a moment.");
  return resolveDocumentStyle(kind);
}
