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

function line(id: string, name: string, quantity: number, rate: number, description = ""): DesktopLineItem { return { id, name, quantity, rate, description }; }
const initial: DesktopBusinessState = {
  customers: [
    { id: "cus-acme", name: "Alex Carter", company: "Acme Corp", email: "alex@acme.com", phone: "+1 415 555 0101", address: "123 Market Street, San Francisco, CA 94103", status: "active", notes: "Quarterly design and consulting work." },
    { id: "cus-xyz", name: "Maya Lewis", company: "XYZ Media", email: "maya@xyzmedia.com", phone: "+1 628 555 0142", address: "48 Mission Street, San Francisco, CA", status: "active", notes: "Prefers email updates." },
    { id: "cus-bright", name: "Jordan Lee", company: "Bright Co.", email: "billing@brightco.com", phone: "+1 650 555 0188", address: "456 Innovation Drive, San Jose, CA", status: "active", notes: "Net 30 account." },
    { id: "cus-global", name: "Priya Shah", company: "Global Tech", email: "accounts@globaltech.com", phone: "+1 669 555 0167", address: "12 Innovation Way, San Jose, CA", status: "prospect", notes: "New enterprise lead." },
  ],
  items: [
    { id: "item-web", name: "Website Design", description: "Responsive website design and implementation", kind: "service", price: 2500, category: "Design", active: true },
    { id: "item-dev", name: "Development", description: "Frontend and backend development", kind: "service", price: 120, category: "Engineering", active: true },
    { id: "item-content", name: "Content Setup", description: "Content entry and SEO setup", kind: "service", price: 85, category: "Marketing", active: true },
    { id: "item-logo", name: "Logo Design", description: "Brand mark and export package", kind: "service", price: 800, category: "Design", active: true },
  ],
  invoices: [
    { id: "inv-12", number: "INV-0012", customerId: "cus-acme", issueDate: "2026-09-12", dueDate: "2026-09-26", status: "sent", items: [line("li-1", "Website Design", 1, 2500)], discountPct: 0, taxPct: 0, paidAmount: 0, notes: "Thank you for your business." },
    { id: "inv-11", number: "INV-0011", customerId: "cus-xyz", issueDate: "2026-09-10", dueDate: "2026-09-24", status: "paid", items: [line("li-2", "Development", 10, 120)], discountPct: 0, taxPct: 0, paidAmount: 1200, notes: "Paid in full." },
    { id: "inv-10", number: "INV-0010", customerId: "cus-bright", issueDate: "2026-09-08", dueDate: "2026-09-22", status: "overdue", items: [line("li-3", "Website Design", 1, 2500), line("li-4", "Content Setup", 8, 85)], discountPct: 0, taxPct: 0, paidAmount: 1000, notes: "Payment reminder sent." },
  ],
  estimates: [
    { id: "est-7", number: "EST-0007", customerId: "cus-acme", issueDate: "2026-09-14", validUntil: "2026-09-28", status: "sent", items: [line("eli-1", "Website Design", 1, 2500), line("eli-2", "Development", 40, 120), line("eli-3", "Content Setup", 8, 85)], discountPct: 10, taxPct: 8.25, terms: "Valid for 30 days from the issue date." },
    { id: "est-6", number: "EST-0006", customerId: "cus-xyz", issueDate: "2026-09-10", validUntil: "2026-09-24", status: "accepted", items: [line("eli-4", "Logo Design", 1, 800)], discountPct: 0, taxPct: 0, terms: "Net 30." },
  ],
  payments: [
    { id: "pay-1", invoiceId: "inv-11", amount: 1200, date: "2026-09-12", method: "Bank Transfer", reference: "TRF12345678", receiptNumber: "RCPT-0018" },
    { id: "pay-2", invoiceId: "inv-10", amount: 1000, date: "2026-09-14", method: "Card", reference: "CRD92817433", receiptNumber: "RCPT-0019" },
  ],
  business: { name: "Receipt Cycle Studio", email: "hello@receiptcycle.app", phone: "+1 415 555 0101", address: "1234 Market Street, San Francisco, CA 94103", taxId: "12-3456789", website: "https://receiptcycle.app" },
  invoicePreferences: { currency: "USD", dateFormat: "MM/DD/YYYY", prefix: "INV", taxRate: 8.25, taxLabel: "Sales Tax", paymentTerms: "Net 30", notes: "Thank you for your business!", accent: "#0f766e" },
  reminders: { invoice: true, overdue: true, payment: true, budget: true, weekly: false, marketing: true },
};

function replaceById<T extends { id: string }>(rows: T[], row: T) { return rows.some((item) => item.id === row.id) ? rows.map((item) => item.id === row.id ? row : item) : [row, ...rows]; }
export function invoiceSubtotal(invoice: Pick<DesktopInvoice, "items"> | Pick<DesktopEstimate, "items">) { return invoice.items.reduce((sum, item) => sum + item.quantity * item.rate, 0); }
export function documentTotal(doc: Pick<DesktopInvoice, "items" | "discountPct" | "taxPct"> | Pick<DesktopEstimate, "items" | "discountPct" | "taxPct">) { const subtotal = invoiceSubtotal(doc); const discounted = subtotal * (1 - doc.discountPct / 100); return Math.round((discounted + discounted * doc.taxPct / 100) * 100) / 100; }

const Ctx = createContext<Value | null>(null);

export function DesktopBusinessProvider({ children }: { children: ReactNode }) {
  const { user } = useWebAuth();
  const key = `receipt_cycle_desktop_business_${user?.id ?? "guest"}`;
  const [state, setState] = useState<DesktopBusinessState>(initial);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      setState(raw ? { ...initial, ...(JSON.parse(raw) as Partial<DesktopBusinessState>) } : initial);
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
      const invoice: DesktopInvoice = { id: `inv-${Date.now()}`, number: `INV-${String(state.invoices.length + 13).padStart(4, "0")}`, customerId: estimate.customerId, issueDate: new Date().toISOString().slice(0, 10), dueDate: estimate.validUntil, status: "draft", items: estimate.items.map((item) => ({ ...item, id: `li-${Date.now()}-${item.id}` })), discountPct: estimate.discountPct, taxPct: estimate.taxPct, paidAmount: 0, notes: estimate.terms };
      update((current) => ({ ...current, invoices: [invoice, ...current.invoices], estimates: current.estimates.map((row) => row.id === estimateId ? { ...row, status: "accepted" } : row) }));
      return invoice;
    },
    recordPayment: (invoiceId, amount, method) => {
      const invoice = state.invoices.find((row) => row.id === invoiceId);
      if (!invoice || amount <= 0) return null;
      const payment: DesktopPayment = { id: `pay-${Date.now()}`, invoiceId, amount, method, date: new Date().toISOString().slice(0, 10), reference: `${method.slice(0, 3).toUpperCase()}${Date.now().toString().slice(-8)}`, receiptNumber: `RCPT-${String(state.payments.length + 18).padStart(4, "0")}` };
      const newPaid = Math.min(documentTotal(invoice), invoice.paidAmount + amount);
      update((current) => ({ ...current, payments: [payment, ...current.payments], invoices: current.invoices.map((row) => row.id === invoiceId ? { ...row, paidAmount: newPaid, status: newPaid >= documentTotal(row) ? "paid" : "partially_paid" } : row) }));
      return payment;
    },
  }), [state, loadedKey, key]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDesktopBusiness() { const value = useContext(Ctx); if (!value) throw new Error("useDesktopBusiness must be used inside DesktopBusinessProvider"); return value; }
