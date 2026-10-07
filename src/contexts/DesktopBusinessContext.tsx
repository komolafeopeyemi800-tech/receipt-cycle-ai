import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useWebAuth } from "@/contexts/WebAuthContext";

export type DesktopCustomer = { id: string; name: string; company: string; email: string; phone: string; address: string; status: "active" | "prospect" | "inactive"; notes: string };
export type DesktopCatalogItem = { id: string; name: string; description: string; kind: "service" | "product"; price: number; category: string; active: boolean };
export type DesktopLineItem = { id: string; name: string; description: string; quantity: number; rate: number };
export type DesktopInvoice = { id: string; number: string; customerId: string; issueDate: string; dueDate: string; status: "draft" | "sent" | "paid" | "overdue" | "partially_paid"; items: DesktopLineItem[]; discountPct: number; taxPct: number; paidAmount: number; notes: string };
export type DesktopEstimate = { id: string; number: string; customerId: string; issueDate: string; validUntil: string; status: "draft" | "sent" | "accepted" | "expired"; items: DesktopLineItem[]; discountPct: number; taxPct: number; terms: string };
export type DesktopPayment = { id: string; invoiceId: string; amount: number; date: string; method: string; reference: string; receiptNumber: string };
export type BusinessProfile = { name: string; email: string; phone: string; address: string; taxId: string; website: string };
export type InvoicePreferences = { currency: string; dateFormat: string; prefix: string; taxRate: number; taxLabel: string; paymentTerms: string; notes: string; accent: string };
export type ReminderPreferences = { invoice: boolean; overdue: boolean; payment: boolean; budget: boolean; weekly: boolean; marketing: boolean };

type DesktopBusinessState = {
  customers: DesktopCustomer[];
  items: DesktopCatalogItem[];
  invoices: DesktopInvoice[];
  estimates: DesktopEstimate[];
  payments: DesktopPayment[];
  business: BusinessProfile;
  invoicePreferences: InvoicePreferences;
  reminders: ReminderPreferences;
};

type Value = DesktopBusinessState & {
  ready: boolean;
  saveCustomer: (row: DesktopCustomer) => void;
  saveItem: (row: DesktopCatalogItem) => void;
  saveInvoice: (row: DesktopInvoice) => void;
  saveEstimate: (row: DesktopEstimate) => void;
  saveBusiness: (row: BusinessProfile) => void;
  saveInvoicePreferences: (row: InvoicePreferences) => void;
  saveReminders: (row: ReminderPreferences) => void;
  convertEstimate: (estimateId: string) => DesktopInvoice | null;
  recordPayment: (invoiceId: string, amount: number, method: string) => DesktopPayment | null;
};

const initial: DesktopBusinessState = {
  customers: [],
  items: [],
  invoices: [],
  estimates: [],
  payments: [],
  business: { name: "", email: "", phone: "", address: "", taxId: "", website: "" },
  invoicePreferences: { currency: "USD", dateFormat: "MM/DD/YYYY", prefix: "INV", taxRate: 0, taxLabel: "Tax", paymentTerms: "Net 30", notes: "", accent: "#0f766e" },
  reminders: { invoice: true, overdue: true, payment: true, budget: true, weekly: false, marketing: true },
};

const legacyDemoIds = {
  customers: new Set(["cus-acme", "cus-xyz", "cus-bright", "cus-global"]),
  items: new Set(["item-web", "item-dev", "item-content", "item-logo"]),
  invoices: new Set(["inv-10", "inv-11", "inv-12"]),
  estimates: new Set(["est-6", "est-7"]),
  payments: new Set(["pay-1", "pay-2"]),
};

function removeLegacyDemoRecords(state: DesktopBusinessState): DesktopBusinessState {
  const business = state.business.name === "Receipt Cycle Studio" && state.business.email === "hello@receiptcycle.app"
    ? initial.business
    : state.business;
  return {
    ...state,
    customers: state.customers.filter((row) => !legacyDemoIds.customers.has(row.id)),
    items: state.items.filter((row) => !legacyDemoIds.items.has(row.id)),
    invoices: state.invoices.filter((row) => !legacyDemoIds.invoices.has(row.id)),
    estimates: state.estimates.filter((row) => !legacyDemoIds.estimates.has(row.id)),
    payments: state.payments.filter((row) => !legacyDemoIds.payments.has(row.id)),
    business,
  };
}

function replaceById<T extends { id: string }>(rows: T[], row: T) { return rows.some((item) => item.id === row.id) ? rows.map((item) => item.id === row.id ? row : item) : [row, ...rows]; }
const num = (value: unknown) => { const n = Number(value); return Number.isFinite(n) ? n : 0; };
const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
/** Local calendar date as YYYY-MM-DD (toISOString() would shift to UTC and be off by a day near midnight). */
export function localDate(date: Date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
export function addDaysLocal(days: number) { const date = new Date(); date.setDate(date.getDate() + days); return localDate(date); }
/** Days from a payment-terms label such as "Net 30" ("Due on receipt" -> 0). */
export function paymentTermDays(terms: string) { const match = /(\d+)/.exec(terms); return match ? Number(match[1]) : 0; }
/** Next sequential document number: highest trailing number already used + 1 (safe when rows are removed or prefixes change). */
export function nextDocNumber(prefix: string, existing: string[]) { const highest = existing.reduce((max, value) => { const match = /(\d+)\s*$/.exec(value); return match ? Math.max(max, Number(match[1])) : max; }, 0); return `${prefix}-${String(highest + 1).padStart(4, "0")}`; }
export function invoiceSubtotal(invoice: Pick<DesktopInvoice, "items"> | Pick<DesktopEstimate, "items">) { return invoice.items.reduce((sum, item) => sum + num(item.quantity) * num(item.rate), 0); }
export function documentTotal(doc: Pick<DesktopInvoice, "items" | "discountPct" | "taxPct"> | Pick<DesktopEstimate, "items" | "discountPct" | "taxPct">) { const subtotal = invoiceSubtotal(doc); const discounted = subtotal * (1 - Math.min(100, Math.max(0, num(doc.discountPct))) / 100); return round2(discounted + discounted * Math.max(0, num(doc.taxPct)) / 100); }
/** Amount still owed on an invoice, rounded to cents and never negative. */
export function invoiceBalance(invoice: DesktopInvoice) { return Math.max(0, round2(documentTotal(invoice) - num(invoice.paidAmount))); }
/** Drafts have not been issued, so they do not count toward receivables. */
export function openBalance(invoice: DesktopInvoice) { return invoice.status === "draft" ? 0 : invoiceBalance(invoice); }
/** Effective status: paid when settled, overdue when unpaid past the due date (the stored status never ages on its own). */
export function invoiceStatus(invoice: DesktopInvoice): DesktopInvoice["status"] {
  if (invoice.status === "draft") return "draft";
  if (invoice.status === "paid" || (documentTotal(invoice) > 0 && invoiceBalance(invoice) === 0)) return "paid";
  if (invoice.dueDate && invoice.dueDate < localDate()) return "overdue";
  if (invoice.status === "overdue") return num(invoice.paidAmount) > 0 ? "partially_paid" : "sent";
  return invoice.status;
}
export function estimateStatus(estimate: DesktopEstimate): DesktopEstimate["status"] {
  if ((estimate.status === "draft" || estimate.status === "sent") && estimate.validUntil && estimate.validUntil < localDate()) return "expired";
  return estimate.status;
}

const Ctx = createContext<Value | null>(null);

export function DesktopBusinessProvider({ children }: { children: ReactNode }) {
  const { user } = useWebAuth();
  const key = `receipt_cycle_desktop_business_${user?.id ?? "guest"}`;
  const [state, setState] = useState<DesktopBusinessState>(initial);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      const restored = raw ? { ...initial, ...(JSON.parse(raw) as Partial<DesktopBusinessState>) } : initial;
      const migrated = removeLegacyDemoRecords(restored);
      setState(migrated);
      if (raw && JSON.stringify(migrated) !== JSON.stringify(restored)) localStorage.setItem(key, JSON.stringify(migrated));
    } catch { setState(initial); }
    setLoadedKey(key);
  }, [key]);
  function update(recipe: (current: DesktopBusinessState) => DesktopBusinessState) { setState((current) => { const next = recipe(current); try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ } return next; }); }

  const value = useMemo<Value>(() => ({
    ...state,
    ready: loadedKey === key,
    saveCustomer: (row) => update((current) => ({ ...current, customers: replaceById(current.customers, row) })),
    saveItem: (row) => update((current) => ({ ...current, items: replaceById(current.items, row) })),
    saveInvoice: (row) => update((current) => ({ ...current, invoices: replaceById(current.invoices, row) })),
    saveEstimate: (row) => update((current) => ({ ...current, estimates: replaceById(current.estimates, row) })),
    saveBusiness: (row) => update((current) => ({ ...current, business: row })),
    saveInvoicePreferences: (row) => update((current) => ({ ...current, invoicePreferences: row })),
    saveReminders: (row) => update((current) => ({ ...current, reminders: row })),
    convertEstimate: (estimateId) => {
      const estimate = state.estimates.find((row) => row.id === estimateId);
      if (!estimate) return null;
      const invoice: DesktopInvoice = { id: `inv-${Date.now()}`, number: nextDocNumber(state.invoicePreferences.prefix || "INV", state.invoices.map((row) => row.number)), customerId: estimate.customerId, issueDate: localDate(), dueDate: addDaysLocal(paymentTermDays(state.invoicePreferences.paymentTerms)), status: "draft", items: estimate.items.map((item) => ({ ...item, id: `li-${Date.now()}-${item.id}` })), discountPct: estimate.discountPct, taxPct: estimate.taxPct, paidAmount: 0, notes: estimate.terms };
      update((current) => ({ ...current, invoices: [invoice, ...current.invoices], estimates: current.estimates.map((row) => row.id === estimateId ? { ...row, status: "accepted" } : row) }));
      return invoice;
    },
    recordPayment: (invoiceId, amount, method) => {
      const invoice = state.invoices.find((row) => row.id === invoiceId);
      if (!invoice) return null;
      // Never record more than what is owed, so payment history always sums to paidAmount.
      const applied = round2(Math.min(num(amount), invoiceBalance(invoice)));
      if (!(applied > 0)) return null;
      const payment: DesktopPayment = { id: `pay-${Date.now()}`, invoiceId, amount: applied, method, date: localDate(), reference: `${method.slice(0, 3).toUpperCase()}${Date.now().toString().slice(-8)}`, receiptNumber: `RCPT-${String(state.payments.length + 1).padStart(4, "0")}` };
      update((current) => ({ ...current, payments: [payment, ...current.payments], invoices: current.invoices.map((row) => { if (row.id !== invoiceId) return row; const newPaid = round2(Math.min(documentTotal(row), num(row.paidAmount) + applied)); return { ...row, paidAmount: newPaid, status: round2(documentTotal(row) - newPaid) <= 0 ? "paid" : "partially_paid" }; }) }));
      return payment;
    },
  }), [state, loadedKey, key]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDesktopBusiness() { const value = useContext(Ctx); if (!value) throw new Error("useDesktopBusiness must be used inside DesktopBusinessProvider"); return value; }
