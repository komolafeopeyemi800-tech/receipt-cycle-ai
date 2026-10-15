import type { InvoiceSettings } from "../sales/setupData";
import { ACCENTS, DEFAULT_ACCENT, type DocKind, type DocTemplate, type PaperSize } from "./layout";

export type ResolvedStyle = { template: DocTemplate; accent: string; paper: PaperSize; formatDate: (ymd: string) => string };

const fallbackDate = (ymd: string) => ymd;
let formatDateFn: (ymd: string) => string = fallbackDate;
let settings: InvoiceSettings | null = null;

/** Called by <DocumentStyleSync/> whenever settings or the date format change, so every PDF is built with the current look. */
export function setDocumentStyleSource(next: InvoiceSettings | null, formatDate: (ymd: string) => string) {
  settings = next;
  formatDateFn = formatDate || fallbackDate;
}

export function resolveDocumentStyle(kind: DocKind, source: InvoiceSettings | null = settings, formatDate: (ymd: string) => string = formatDateFn): ResolvedStyle {
  const template = (kind === "ESTIMATE" ? source?.estimateTemplate : source?.invoiceTemplate) === "compact" ? "compact" : "standard";
  const raw = kind === "ESTIMATE" ? source?.estimateColor : source?.invoiceColor;
  const accent = ACCENTS.some((a) => a.hex === raw) ? (raw as string) : DEFAULT_ACCENT;
  return { template, accent, paper: source?.paperSize === "letter" ? "letter" : "a4", formatDate };
}

export function getDocumentStyle(kind: DocKind): ResolvedStyle {
  return resolveDocumentStyle(kind);
}
