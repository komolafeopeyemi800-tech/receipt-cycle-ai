import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createEstimateDraft, createSavedEstimate, type EstimateDraft, type EstimateStatus, type SavedEstimate } from "../features/estimates/model";
import type { InvoiceLineItem } from "../features/invoices/model";
import { useAuth } from "./AuthContext";
import { useSalesSetup } from "./SalesSetupContext";
import { useWorkspace } from "./WorkspaceContext";

type State = { draft: EstimateDraft; estimates: SavedEstimate[] };
type Value = State & {
  ready: boolean;
  startNewEstimate: () => void;
  updateDraft: (patch: Partial<EstimateDraft>) => void;
  addItem: (item: InvoiceLineItem) => void;
  updateItem: (id: string, patch: Partial<InvoiceLineItem>) => void;
  removeItem: (id: string) => void;
  saveEstimate: (status?: EstimateStatus) => SavedEstimate | null;
  loadEstimate: (estimateNumber: string) => boolean;
  duplicateEstimate: (estimateNumber: string) => string | null;
  setEstimateStatus: (estimateNumber: string, status: EstimateStatus) => void;
};

const Context = createContext<Value | null>(null);

export function EstimateFlowProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const { customers, invoiceSettings } = useSalesSetup();
  const [state, setState] = useState<State>(() => ({ draft: createEstimateDraft(invoiceSettings, []), estimates: [] }));
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const storageKey = `receipt_cycle_estimate_flow_${user?.id ?? "guest"}_${workspace}`;

  useEffect(() => {
    let live = true;
    setLoadedKey(null);
    void AsyncStorage.getItem(storageKey).then((raw) => {
      if (!live) return;
      if (!raw) setState({ draft: createEstimateDraft(invoiceSettings, []), estimates: [] });
      else {
        try { const parsed = JSON.parse(raw) as Partial<State>; const estimates = Array.isArray(parsed.estimates) ? parsed.estimates : []; setState({ estimates, draft: parsed.draft?.estimateNumber ? parsed.draft : createEstimateDraft(invoiceSettings, estimates) }); }
        catch { setState({ draft: createEstimateDraft(invoiceSettings, []), estimates: [] }); }
      }
      setLoadedKey(storageKey);
    }).catch(() => { if (live) { setState({ draft: createEstimateDraft(invoiceSettings, []), estimates: [] }); setLoadedKey(storageKey); } });
    return () => { live = false; };
  }, [storageKey]);

  function update(recipe: (current: State) => State) { setState((current) => { const next = recipe(current); void AsyncStorage.setItem(storageKey, JSON.stringify(next)); return next; }); }

  const value = useMemo<Value>(() => ({
    ...state, ready: loadedKey === storageKey,
    startNewEstimate: () => update((current) => ({ ...current, draft: createEstimateDraft(invoiceSettings, current.estimates) })),
    updateDraft: (patch) => update((current) => ({ ...current, draft: { ...current.draft, ...patch } })),
    addItem: (item) => update((current) => ({ ...current, draft: { ...current.draft, items: [...current.draft.items, item] } })),
    updateItem: (id, patch) => update((current) => ({ ...current, draft: { ...current.draft, items: current.draft.items.map((item) => item.id === id ? { ...item, ...patch } : item) } })),
    removeItem: (id) => update((current) => ({ ...current, draft: { ...current.draft, items: current.draft.items.filter((item) => item.id !== id) } })),
    saveEstimate: (status = "draft") => {
      const customer = customers.find((item) => item.id === state.draft.customerId); if (!customer) return null;
      const estimate = createSavedEstimate(state.draft, customer, status);
      update((current) => ({ ...current, estimates: current.estimates.some((item) => item.estimateNumber === estimate.estimateNumber) ? current.estimates.map((item) => item.estimateNumber === estimate.estimateNumber ? estimate : item) : [estimate, ...current.estimates] }));
      return estimate;
    },
    loadEstimate: (estimateNumber) => { const estimate = state.estimates.find((item) => item.estimateNumber === estimateNumber); if (!estimate) return false; const { customerName: _name, status: _status, total: _total, updatedAt: _updated, acceptedAt: _accepted, ...draft } = estimate; update((current) => ({ ...current, draft })); return true; },
    duplicateEstimate: (estimateNumber) => {
      const source = state.estimates.find((item) => item.estimateNumber === estimateNumber); if (!source) return null;
      const next = createEstimateDraft(invoiceSettings, state.estimates); const draft: EstimateDraft = { ...next, customerId: source.customerId, reference: source.reference, items: source.items.map((item) => ({ ...item, id: `estimate-line-${Date.now()}-${Math.random()}` })), discountType: source.discountType, discountValue: source.discountValue, taxRate: source.taxRate, taxLabel: source.taxLabel, notes: source.notes, terms: source.terms, validityDays: source.validityDays };
      update((current) => ({ ...current, draft })); return draft.estimateNumber;
    },
    setEstimateStatus: (estimateNumber, status) => update((current) => ({ ...current, estimates: current.estimates.map((item) => item.estimateNumber === estimateNumber ? { ...item, status, updatedAt: new Date().toISOString(), ...(status === "accepted" ? { acceptedAt: new Date().toISOString() } : {}) } : item) })),
  }), [state, loadedKey, storageKey, customers, invoiceSettings]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useEstimateFlow() { const value = useContext(Context); if (!value) throw new Error("useEstimateFlow requires EstimateFlowProvider"); return value; }
