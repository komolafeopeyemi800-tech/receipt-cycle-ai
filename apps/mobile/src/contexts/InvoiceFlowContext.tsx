import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createInvoiceDraft, createSavedInvoice, type InvoiceDraft, type InvoiceLineItem, type InvoiceStatus, type SavedInvoice } from "../features/invoices/model";
import { useAuth } from "./AuthContext";
import { useSalesSetup } from "./SalesSetupContext";
import { useWorkspace } from "./WorkspaceContext";

type InvoiceFlowState = { draft: InvoiceDraft; invoices: SavedInvoice[] };
export type InvoiceConversionSource = Pick<InvoiceDraft, "customerId" | "items" | "discountType" | "discountValue" | "taxRate" | "taxLabel" | "shipping" | "notes" | "terms" | "signatureEnabled" | "signatureText" | "attachment">;
type ContextValue = InvoiceFlowState & {
  ready: boolean;
  startNewInvoice: () => void;
  updateDraft: (patch: Partial<InvoiceDraft>) => void;
  addLineItem: (item: InvoiceLineItem) => void;
  removeLineItem: (id: string) => void;
  saveDraft: (status?: InvoiceStatus) => SavedInvoice | null;
  loadInvoice: (invoiceNumber: string) => boolean;
  convertToInvoice: (source: InvoiceConversionSource) => SavedInvoice | null;
  applyPayment: (invoiceNumber: string, amount: number) => void;
};

const InvoiceFlowContext = createContext<ContextValue | null>(null);

export function InvoiceFlowProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const { customers, invoiceSettings } = useSalesSetup();
  const [state, setState] = useState<InvoiceFlowState>(() => ({ draft: createInvoiceDraft(invoiceSettings, []), invoices: [] }));
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const storageKey = `receipt_cycle_invoice_flow_${user?.id ?? "guest"}_${workspace}`;

  useEffect(() => {
    let live = true;
    setLoadedKey(null);
    void AsyncStorage.getItem(storageKey).then((raw) => {
      if (!live) return;
      if (!raw) setState({ draft: createInvoiceDraft(invoiceSettings, []), invoices: [] });
      else {
        try {
          const parsed = JSON.parse(raw) as Partial<InvoiceFlowState>;
          const invoices = Array.isArray(parsed.invoices) ? parsed.invoices : [];
          setState({ draft: parsed.draft?.invoiceNumber ? parsed.draft : createInvoiceDraft(invoiceSettings, invoices), invoices });
        } catch { setState({ draft: createInvoiceDraft(invoiceSettings, []), invoices: [] }); }
      }
      setLoadedKey(storageKey);
    }).catch(() => { if (live) { setState({ draft: createInvoiceDraft(invoiceSettings, []), invoices: [] }); setLoadedKey(storageKey); } });
    return () => { live = false; };
  }, [storageKey]);

  function update(recipe: (current: InvoiceFlowState) => InvoiceFlowState) {
    setState((current) => {
      const next = recipe(current);
      void AsyncStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  const value = useMemo<ContextValue>(() => ({
    ...state,
    ready: loadedKey === storageKey,
    startNewInvoice: () => update((current) => ({ ...current, draft: createInvoiceDraft(invoiceSettings, current.invoices) })),
    updateDraft: (patch) => update((current) => ({ ...current, draft: { ...current.draft, ...patch } })),
    addLineItem: (item) => update((current) => ({ ...current, draft: { ...current.draft, items: [...current.draft.items, item] } })),
    removeLineItem: (id) => update((current) => ({ ...current, draft: { ...current.draft, items: current.draft.items.filter((item) => item.id !== id) } })),
    saveDraft: (status = "draft") => {
      const customer = customers.find((item) => item.id === state.draft.customerId);
      if (!customer) return null;
      const invoice = createSavedInvoice(state.draft, customer, status);
      update((current) => ({ ...current, invoices: current.invoices.some((item) => item.invoiceNumber === invoice.invoiceNumber) ? current.invoices.map((item) => item.invoiceNumber === invoice.invoiceNumber ? invoice : item) : [invoice, ...current.invoices] }));
      return invoice;
    },
    loadInvoice: (invoiceNumber) => {
      const invoice = state.invoices.find((item) => item.invoiceNumber === invoiceNumber);
      if (!invoice) return false;
      const { customerName: _customerName, status: _status, total: _total, updatedAt: _updatedAt, sentAt: _sentAt, ...draft } = invoice;
      update((current) => ({ ...current, draft }));
      return true;
    },
    convertToInvoice: (source) => {
      const customer = customers.find((item) => item.id === source.customerId);
      if (!customer) return null;
      const base = createInvoiceDraft(invoiceSettings, state.invoices);
      const draft: InvoiceDraft = { ...base, ...source, items: source.items.map((item) => ({ ...item, id: `invoice-line-${Date.now()}-${Math.random()}` })) };
      const invoice = createSavedInvoice(draft, customer, "draft");
      update((current) => ({ draft, invoices: [invoice, ...current.invoices.filter((item) => item.invoiceNumber !== invoice.invoiceNumber)] }));
      return invoice;
    },
    applyPayment: (invoiceNumber, amount) => update((current) => ({
      ...current,
      invoices: current.invoices.map((invoice) => {
        if (invoice.invoiceNumber !== invoiceNumber) return invoice;
        const amountPaid = Math.min(invoice.total, Math.max(0, (invoice.amountPaid ?? 0) + amount));
        return { ...invoice, amountPaid, status: amountPaid >= invoice.total ? "paid" : "partially_paid", updatedAt: new Date().toISOString() };
      }),
    })),
  }), [state, loadedKey, storageKey, customers, invoiceSettings]);

  return <InvoiceFlowContext.Provider value={value}>{children}</InvoiceFlowContext.Provider>;
}

export function useInvoiceFlow() {
  const value = useContext(InvoiceFlowContext);
  if (!value) throw new Error("useInvoiceFlow requires InvoiceFlowProvider");
  return value;
}
