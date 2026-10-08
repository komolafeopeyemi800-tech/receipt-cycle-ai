import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { applyToCollection, SINGLETON_ID, useSalesSync, type KeyValueStore, type SalesChange, type SalesData, type SalesKind, type SalesOp } from "@mobile-lib/salesSync";
import { useWebAuth } from "@/contexts/WebAuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import * as shared from "@/lib/salesAdapters";

/** Browser storage as a key-value store for the sync engine. */
const webKv: KeyValueStore = {
  get: async (key) => { try { return localStorage.getItem(key); } catch { return null; } },
  onForeground: (cb) => { const run = () => { if (document.visibilityState === "visible") cb(); }; document.addEventListener("visibilitychange", run); window.addEventListener("focus", run); window.addEventListener("online", run); return () => { document.removeEventListener("visibilitychange", run); window.removeEventListener("focus", run); window.removeEventListener("online", run); }; },
  set: async (key, value) => { try { localStorage.setItem(key, value); } catch { /* ignore */ } },
};

export type DesktopCustomer = { id: string; name: string; company: string; email: string; phone: string; address: string; status: "active" | "prospect" | "inactive"; notes: string; _raw?: SalesData };
export type DesktopCatalogItem = { id: string; name: string; description: string; kind: "service" | "product"; price: number; category: string; active: boolean; _raw?: SalesData };
export type DesktopLineItem = { id: string; name: string; description: string; quantity: number; rate: number; catalogItemId?: string };
export type DesktopInvoice = { id: string; number: string; customerId: string; issueDate: string; dueDate: string; status: "draft" | "sent" | "paid" | "overdue" | "partially_paid"; items: DesktopLineItem[]; discountPct: number; taxPct: number; paidAmount: number; notes: string; discountFixed?: number; shipping?: number; _raw?: SalesData };
export type DesktopEstimate = { id: string; number: string; customerId: string; issueDate: string; validUntil: string; status: "draft" | "sent" | "accepted" | "expired"; items: DesktopLineItem[]; discountPct: number; taxPct: number; terms: string; discountFixed?: number; shipping?: number; _raw?: SalesData };
export type DesktopPayment = { id: string; invoiceId: string; amount: number; date: string; method: string; reference: string; receiptNumber: string; _raw?: SalesData };
export type BusinessProfile = { name: string; email: string; phone: string; address: string; taxId: string; website: string; _raw?: SalesData };
export type InvoicePreferences = { currency: string; dateFormat: string; prefix: string; taxRate: number; taxLabel: string; paymentTerms: string; notes: string; accent: string; _raw?: SalesData };
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
  removeCustomer: (id: string) => void;
  removeItem: (id: string) => void;
  removeInvoice: (id: string) => void;
  removeEstimate: (id: string) => void;
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
export function documentTotal(doc: Pick<DesktopInvoice, "items" | "discountPct" | "taxPct" | "discountFixed" | "shipping">) { const subtotal = invoiceSubtotal(doc); const pct = Math.min(100, Math.max(0, num(doc.discountPct))); const discount = pct > 0 || !(num(doc.discountFixed) > 0) ? subtotal * pct / 100 : Math.min(subtotal, num(doc.discountFixed)); const taxable = Math.max(0, subtotal - discount); return round2(taxable + taxable * Math.max(0, num(doc.taxPct)) / 100 + Math.max(0, num(doc.shipping))); }
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
  const { workspace } = useWorkspace();
  const key = `receipt_cycle_desktop_business_${user?.id ?? "guest"}_${workspace}`;
  const [state, setState] = useState<DesktopBusinessState>(initial);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Data saved before workspaces existed lived under the user-only key; carry it over once.
      const raw = localStorage.getItem(key) ?? (workspace === "personal" ? localStorage.getItem(`receipt_cycle_desktop_business_${user?.id ?? "guest"}`) : null);
      const restored = raw ? { ...initial, ...(JSON.parse(raw) as Partial<DesktopBusinessState>) } : initial;
      const migrated = removeLegacyDemoRecords(restored);
      setState(migrated);
      if (raw && JSON.stringify(migrated) !== JSON.stringify(restored)) localStorage.setItem(key, JSON.stringify(migrated));
    } catch { setState(initial); }
    setLoadedKey(key);
  }, [key]);
  const defaultsJson = useMemo(() => ({ business: JSON.stringify(shared.businessToShared(initial.business, undefined)), prefs: JSON.stringify(shared.prefsToShared(initial.invoicePreferences, undefined)), reminders: JSON.stringify(shared.remindersToShared(initial.reminders)) }), []);
  const sync = useSalesSync({
    userId: user?.id,
    workspace,
    kv: webKv,
    kinds: ["customer", "item", "invoice", "estimate", "payment", "business_profile", "invoice_settings", "reminders"],
    ready: loadedKey === key,
    getLocal: () => {
      const now = new Date().toISOString();
      const out: { kind: SalesKind; id: string; data: SalesData }[] = [
        ...state.customers.map((r) => ({ kind: "customer" as const, id: r.id, data: shared.customerToShared(r) })),
        ...state.items.map((r) => ({ kind: "item" as const, id: r.id, data: shared.itemToShared(r) })),
        ...state.invoices.map((r) => ({ kind: "invoice" as const, id: shared.invoiceSyncId(r.number), data: shared.invoiceToShared(r, state.customers, state.invoicePreferences, now) })),
        ...state.estimates.map((r) => ({ kind: "estimate" as const, id: shared.estimateSyncId(r.number), data: shared.estimateToShared(r, state.customers, state.invoicePreferences, now) })),
        ...state.payments.map((r) => ({ kind: "payment" as const, id: r.id, data: shared.paymentToShared(r, state.invoices, state.customers, now) })),
      ];
      // Settings that were never changed are not uploaded, so a fresh device cannot overwrite another device's real settings.
      if (JSON.stringify(shared.businessToShared(state.business, undefined)) !== defaultsJson.business) out.push({ kind: "business_profile", id: SINGLETON_ID, data: shared.businessToShared(state.business, state.business._raw) });
      if (JSON.stringify(shared.prefsToShared(state.invoicePreferences, undefined)) !== defaultsJson.prefs) out.push({ kind: "invoice_settings", id: SINGLETON_ID, data: shared.prefsToShared(state.invoicePreferences, state.invoicePreferences._raw) });
      if (JSON.stringify(shared.remindersToShared(state.reminders)) !== defaultsJson.reminders) out.push({ kind: "reminders", id: SINGLETON_ID, data: shared.remindersToShared(state.reminders) });
      return out;
    },
    apply: (changes: SalesChange[]) => {
      setState((current) => {
        let next: DesktopBusinessState = {
          ...current,
          customers: applyToCollection("customer", current.customers, changes, (r) => r.id, shared.customerFromShared),
          items: applyToCollection("item", current.items, changes, (r) => r.id, shared.itemFromShared),
          invoices: applyToCollection("invoice", current.invoices, changes, (r) => shared.invoiceSyncId(r.number), shared.invoiceFromShared),
          estimates: applyToCollection("estimate", current.estimates, changes, (r) => shared.estimateSyncId(r.number), shared.estimateFromShared),
        };
        const invoicesNow = next.invoices;
        next = { ...next, payments: applyToCollection("payment", current.payments, changes, (r) => r.id, (d) => shared.paymentFromShared(d, invoicesNow)) };
        for (const change of changes) {
          if (change.kind === "business_profile" && change.data) next = { ...next, business: shared.businessFromShared(change.data) };
          if (change.kind === "invoice_settings" && change.data) next = { ...next, invoicePreferences: shared.prefsFromShared(change.data) };
          if (change.kind === "reminders" && change.data) next = { ...next, reminders: shared.remindersFromShared(change.data) };
        }
        try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
    },
  });

  /** Reports what changed between two states to the sync engine (only records the person actually edited are re-stamped). */
  function reportChanges(prev: DesktopBusinessState, next: DesktopBusinessState) {
    const now = new Date().toISOString();
    const changed = <T,>(a: T[], b: T[], id: (x: T) => string) => { const before = new Map(a.map((x) => [id(x), JSON.stringify(x)])); return b.filter((x) => before.get(id(x)) !== JSON.stringify(x)); };
    const removed = <T,>(a: T[], b: T[], id: (x: T) => string) => { const keep = new Set(b.map(id)); return a.filter((x) => !keep.has(id(x))); };
    const ops: SalesOp[] = [];
    const put = (kind: SalesKind, id: string, data: SalesData) => ops.push({ op: "put", kind, id, data });
    const del = (kind: SalesKind, id: string) => ops.push({ op: "delete", kind, id });
    for (const r of changed(prev.customers, next.customers, (x) => x.id)) put("customer", r.id, shared.customerToShared(r));
    for (const r of removed(prev.customers, next.customers, (x) => x.id)) del("customer", r.id);
    for (const r of changed(prev.items, next.items, (x) => x.id)) put("item", r.id, shared.itemToShared(r));
    for (const r of removed(prev.items, next.items, (x) => x.id)) del("item", r.id);
    const invId = (x: DesktopInvoice) => shared.invoiceSyncId(x.number);
    for (const r of changed(prev.invoices, next.invoices, (x) => x.id)) put("invoice", invId(r), shared.invoiceToShared(r, next.customers, next.invoicePreferences, now));
    for (const r of removed(prev.invoices, next.invoices, invId)) del("invoice", invId(r));
    const estId = (x: DesktopEstimate) => shared.estimateSyncId(x.number);
    for (const r of changed(prev.estimates, next.estimates, (x) => x.id)) put("estimate", estId(r), shared.estimateToShared(r, next.customers, next.invoicePreferences, now));
    for (const r of removed(prev.estimates, next.estimates, estId)) del("estimate", estId(r));
    for (const r of changed(prev.payments, next.payments, (x) => x.id)) put("payment", r.id, shared.paymentToShared(r, next.invoices, next.customers, now));
    for (const r of removed(prev.payments, next.payments, (x) => x.id)) del("payment", r.id);
    if (JSON.stringify(shared.businessToShared(prev.business, undefined)) !== JSON.stringify(shared.businessToShared(next.business, undefined))) put("business_profile", SINGLETON_ID, shared.businessToShared(next.business, next.business._raw));
    if (JSON.stringify(shared.prefsToShared(prev.invoicePreferences, undefined)) !== JSON.stringify(shared.prefsToShared(next.invoicePreferences, undefined))) put("invoice_settings", SINGLETON_ID, shared.prefsToShared(next.invoicePreferences, next.invoicePreferences._raw));
    if (JSON.stringify(prev.reminders) !== JSON.stringify(next.reminders)) put("reminders", SINGLETON_ID, shared.remindersToShared(next.reminders));
    sync.push(ops);
  }

  function update(recipe: (current: DesktopBusinessState) => DesktopBusinessState) { setState((current) => { const next = recipe(current); try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ } reportChanges(current, next); return next; }); }

  const value = useMemo<Value>(() => ({
    ...state,
    ready: loadedKey === key,
    saveCustomer: (row) => update((current) => ({ ...current, customers: replaceById(current.customers, row) })),
    saveItem: (row) => update((current) => ({ ...current, items: replaceById(current.items, row) })),
    saveInvoice: (row) => update((current) => ({ ...current, invoices: replaceById(current.invoices, row) })),
    saveEstimate: (row) => update((current) => ({ ...current, estimates: replaceById(current.estimates, row) })),
    removeCustomer: (id) => update((current) => ({ ...current, customers: current.customers.filter((row) => row.id !== id) })),
    removeItem: (id) => update((current) => ({ ...current, items: current.items.filter((row) => row.id !== id) })),
    removeInvoice: (id) => update((current) => ({ ...current, invoices: current.invoices.filter((row) => row.id !== id), payments: current.payments.filter((row) => row.invoiceId !== id) })),
    removeEstimate: (id) => update((current) => ({ ...current, estimates: current.estimates.filter((row) => row.id !== id) })),
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
