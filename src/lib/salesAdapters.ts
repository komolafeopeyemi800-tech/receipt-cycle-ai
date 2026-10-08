/**
 * Translates between the web app's business records (DesktopBusinessContext) and the shared records stored in the
 * Cloudflare database, which use the same shape as the mobile app. Anything the web app does not use (fixed discounts,
 * shipping, signatures, attachments, ...) is kept in `_raw` and written back untouched, so a web edit never wipes
 * what the phone saved.
 */
import type { SalesData } from "@mobile-lib/salesSync";
import {
  documentTotal,
  invoiceBalance,
  localDate,
  type BusinessProfile,
  type DesktopCatalogItem,
  type DesktopCustomer,
  type DesktopEstimate,
  type DesktopInvoice,
  type DesktopLineItem,
  type DesktopPayment,
  type InvoicePreferences,
  type ReminderPreferences,
} from "@/contexts/DesktopBusinessContext";

type Raw = SalesData | undefined;
const raw = (value: { _raw?: SalesData } | undefined): SalesData => value?._raw ?? {};
const str = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);
const numeric = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const invoiceSyncId = (number: string) => `inv:${number}`;
export const estimateSyncId = (number: string) => `est:${number}`;

// --- customers -------------------------------------------------------------------------------------------------

export const customerToShared = (c: DesktopCustomer): SalesData => ({
  ...raw(c),
  id: c.id,
  name: c.name,
  businessName: c.company,
  email: c.email,
  phone: c.phone,
  billingAddress: c.address,
  taxId: str(raw(c).taxId),
  notes: c.notes,
  status: c.status,
  createdAt: str(raw(c).createdAt, localDate()),
});
export const customerFromShared = (d: SalesData): DesktopCustomer => ({
  id: str(d.id),
  name: str(d.name),
  company: str(d.businessName),
  email: str(d.email),
  phone: str(d.phone),
  address: str(d.billingAddress),
  status: (["active", "prospect", "inactive"].includes(str(d.status)) ? d.status : "active") as DesktopCustomer["status"],
  notes: str(d.notes),
  _raw: d,
});

// --- catalog items ---------------------------------------------------------------------------------------------

export const itemToShared = (i: DesktopCatalogItem): SalesData => ({
  ...raw(i),
  id: i.id,
  kind: i.kind,
  name: i.name,
  description: i.description,
  unitPrice: i.price,
  taxRate: str(raw(i).taxRate, "Default"),
  category: i.category,
  isDefault: raw(i).isDefault === true,
  active: i.active,
});
export const itemFromShared = (d: SalesData): DesktopCatalogItem => ({
  id: str(d.id),
  name: str(d.name),
  description: str(d.description),
  kind: d.kind === "product" ? "product" : "service",
  price: numeric(d.unitPrice),
  category: str(d.category),
  active: d.active !== false,
  _raw: d,
});

// --- invoices and estimates ------------------------------------------------------------------------------------

const linesToShared = (lines: DesktopLineItem[], before: unknown): SalesData[] => {
  const old = new Map((Array.isArray(before) ? (before as SalesData[]) : []).map((l) => [str(l.id), l]));
  return lines.map((l) => ({ ...(old.get(l.id) ?? {}), id: l.id, name: l.name, description: l.description, quantity: l.quantity, rate: l.rate }));
};
const linesFromShared = (lines: unknown): DesktopLineItem[] =>
  (Array.isArray(lines) ? (lines as SalesData[]) : []).map((l, i) => ({
    id: str(l.id, `line-${i}`),
    name: str(l.name),
    description: str(l.description),
    quantity: numeric(l.quantity),
    rate: numeric(l.rate),
    ...(l.catalogItemId ? { catalogItemId: str(l.catalogItemId) } : {}),
  }));

const discountToShared = (doc: { discountPct: number; discountFixed?: number }) =>
  doc.discountPct > 0 || !(numeric(doc.discountFixed) > 0)
    ? { discountType: "percentage", discountValue: doc.discountPct }
    : { discountType: "fixed", discountValue: numeric(doc.discountFixed) };
const discountFromShared = (d: SalesData) =>
  d.discountType === "fixed"
    ? { discountPct: 0, discountFixed: numeric(d.discountValue) }
    : { discountPct: numeric(d.discountValue), discountFixed: 0 };

export const invoiceToShared = (inv: DesktopInvoice, customers: DesktopCustomer[], prefs: InvoicePreferences, now: string): SalesData => {
  const r = raw(inv);
  return {
    ...r,
    invoiceNumber: inv.number,
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    customerId: inv.customerId || null,
    customerName: customers.find((c) => c.id === inv.customerId)?.name ?? str(r.customerName),
    items: linesToShared(inv.items, r.items),
    ...discountToShared(inv),
    taxRate: inv.taxPct,
    taxLabel: str(r.taxLabel, prefs.taxLabel || "Tax"),
    shipping: numeric(inv.shipping),
    notes: inv.notes,
    terms: str(r.terms, prefs.paymentTerms),
    signatureEnabled: r.signatureEnabled === true,
    signatureText: str(r.signatureText),
    attachment: r.attachment ?? null,
    status: inv.status,
    total: documentTotal(inv),
    amountPaid: inv.paidAmount,
    updatedAt: now,
  };
};
export const invoiceFromShared = (d: SalesData): DesktopInvoice => ({
  id: invoiceSyncId(str(d.invoiceNumber)),
  number: str(d.invoiceNumber),
  customerId: str(d.customerId),
  issueDate: str(d.issueDate),
  dueDate: str(d.dueDate),
  status: (["draft", "sent", "paid", "overdue", "partially_paid"].includes(str(d.status)) ? d.status : "draft") as DesktopInvoice["status"],
  items: linesFromShared(d.items),
  ...discountFromShared(d),
  taxPct: numeric(d.taxRate),
  shipping: numeric(d.shipping),
  paidAmount: numeric(d.amountPaid),
  notes: str(d.notes),
  _raw: d,
});

export const estimateToShared = (est: DesktopEstimate, customers: DesktopCustomer[], prefs: InvoicePreferences, now: string): SalesData => {
  const r = raw(est);
  return {
    ...r,
    estimateNumber: est.number,
    estimateDate: est.issueDate,
    validUntil: est.validUntil,
    customerId: est.customerId || null,
    customerName: customers.find((c) => c.id === est.customerId)?.name ?? str(r.customerName),
    reference: str(r.reference),
    items: linesToShared(est.items, r.items),
    ...discountToShared(est),
    taxRate: est.taxPct,
    taxLabel: str(r.taxLabel, prefs.taxLabel || "Tax"),
    shipping: numeric(est.shipping),
    notes: str(r.notes),
    terms: est.terms,
    validityDays: numeric(r.validityDays, 30),
    customerSignatureEnabled: r.customerSignatureEnabled === true,
    signatureText: str(r.signatureText),
    attachments: Array.isArray(r.attachments) ? r.attachments : [],
    status: est.status,
    total: documentTotal(est),
    updatedAt: now,
  };
};
export const estimateFromShared = (d: SalesData): DesktopEstimate => ({
  id: estimateSyncId(str(d.estimateNumber)),
  number: str(d.estimateNumber),
  customerId: str(d.customerId),
  issueDate: str(d.estimateDate),
  validUntil: str(d.validUntil),
  status: (["draft", "sent", "accepted", "expired"].includes(str(d.status)) ? d.status : "draft") as DesktopEstimate["status"],
  items: linesFromShared(d.items),
  ...discountFromShared(d),
  taxPct: numeric(d.taxRate),
  shipping: numeric(d.shipping),
  terms: str(d.terms),
  _raw: d,
});

// --- payments --------------------------------------------------------------------------------------------------

export const paymentToShared = (p: DesktopPayment, invoices: DesktopInvoice[], customers: DesktopCustomer[], now: string): SalesData => {
  const r = raw(p);
  const invoice = invoices.find((i) => i.id === p.invoiceId);
  const customer = customers.find((c) => c.id === invoice?.customerId);
  const total = invoice ? documentTotal(invoice) : numeric(r.invoiceTotal);
  const remaining = invoice ? invoiceBalance(invoice) : numeric(r.remainingBalance);
  return {
    ...r,
    id: p.id,
    receiptNumber: p.receiptNumber,
    invoiceNumber: invoice?.number ?? str(r.invoiceNumber) ?? null,
    amount: p.amount,
    paymentDate: p.date,
    method: p.method,
    accountId: r.accountId ?? null,
    accountName: str(r.accountName),
    note: str(r.note),
    customerId: invoice?.customerId ?? r.customerId ?? null,
    customerName: customer?.name ?? str(r.customerName),
    customerEmail: customer?.email ?? str(r.customerEmail),
    customerAddress: customer?.address ?? str(r.customerAddress),
    invoiceTotal: total,
    previousPaid: numeric(r.previousPaid, Math.max(0, (invoice?.paidAmount ?? 0) - p.amount)),
    remainingBalance: remaining,
    reference: p.reference,
    status: r.status ?? (remaining > 0 ? "partial" : "received"),
    transactionId: str(r.transactionId),
    createdAt: str(r.createdAt, now),
  };
};
export const paymentFromShared = (d: SalesData, invoices: DesktopInvoice[]): DesktopPayment => ({
  id: str(d.id),
  invoiceId: invoices.find((i) => i.number === str(d.invoiceNumber))?.id ?? invoiceSyncId(str(d.invoiceNumber)),
  amount: numeric(d.amount),
  date: str(d.paymentDate),
  method: str(d.method, "Bank Transfer"),
  reference: str(d.reference),
  receiptNumber: str(d.receiptNumber),
  _raw: d,
});

// --- settings --------------------------------------------------------------------------------------------------

export const businessToShared = (b: BusinessProfile, before: Raw): SalesData => ({
  ...(before ?? {}),
  logoUri: (before?.logoUri as string | null | undefined) ?? null,
  businessName: b.name,
  email: b.email,
  phone: b.phone,
  address: b.address,
  taxId: b.taxId,
  website: b.website,
});
export const businessFromShared = (d: SalesData): BusinessProfile => ({
  name: str(d.businessName),
  email: str(d.email),
  phone: str(d.phone),
  address: str(d.address),
  taxId: str(d.taxId),
  website: str(d.website),
  _raw: d,
});

export const prefsToShared = (p: InvoicePreferences, before: Raw): SalesData => ({
  ...(before ?? {}),
  currency: p.currency,
  dateFormat: p.dateFormat,
  invoicePrefix: p.prefix,
  defaultTaxRate: `${p.taxRate}%`,
  taxLabel: p.taxLabel,
  paymentTerms: p.paymentTerms,
  defaultNotes: p.notes,
  accent: p.accent,
});
export const prefsFromShared = (d: SalesData): InvoicePreferences => ({
  currency: str(d.currency, "USD"),
  dateFormat: str(d.dateFormat, "MM/DD/YYYY"),
  prefix: str(d.invoicePrefix, "INV"),
  taxRate: numeric(String(d.defaultTaxRate ?? "0").replace(/[^0-9.-]/g, "")),
  taxLabel: str(d.taxLabel, "Tax"),
  paymentTerms: str(d.paymentTerms, "Net 30"),
  notes: str(d.defaultNotes),
  accent: str(d.accent, "#0f766e"),
  _raw: d,
});

/** Shared names are the ones the phone uses. */
export const remindersToShared = (r: ReminderPreferences): SalesData => ({
  invoiceReminders: r.invoice,
  overdueReminders: r.overdue,
  paymentConfirmations: r.payment,
  budgetAlerts: r.budget,
  weeklyReports: r.weekly,
  marketingUpdates: r.marketing,
});
export const remindersFromShared = (d: SalesData): ReminderPreferences => ({
  invoice: d.invoiceReminders !== false,
  overdue: d.overdueReminders !== false,
  payment: d.paymentConfirmations !== false,
  budget: d.budgetAlerts !== false,
  weekly: d.weeklyReports === true,
  marketing: d.marketingUpdates !== false,
});
