import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { cloneDefaultSalesSetupState, type BusinessProfile, type CatalogItem, type InvoiceSettings, type SalesCustomer, type SalesSetupState } from "../features/sales/setupData";
import { useAuth } from "./AuthContext";
import { useWorkspace } from "./WorkspaceContext";

type CustomerDraft = Omit<SalesCustomer, "id" | "createdAt"> & { id?: string; createdAt?: string };
type ItemDraft = Omit<CatalogItem, "id"> & { id?: string };

type SalesSetupContextValue = SalesSetupState & {
  ready: boolean;
  saveCustomer: (customer: CustomerDraft) => string;
  setCustomerStatus: (id: string, status: SalesCustomer["status"]) => void;
  saveItem: (item: ItemDraft) => string;
  setItemActive: (id: string, active: boolean) => void;
  saveBusinessProfile: (profile: BusinessProfile) => void;
  saveInvoiceSettings: (settings: InvoiceSettings) => void;
};

const SalesSetupContext = createContext<SalesSetupContextValue | null>(null);

function normalizeState(parsed: Partial<SalesSetupState>): SalesSetupState {
  const defaults = cloneDefaultSalesSetupState();
  const demoCustomers = new Set(["customer-acme", "customer-xyz", "customer-bright", "customer-abc", "customer-global", "customer-walk-in"]);
  const demoItems = new Set(["item-consulting", "item-design", "item-web", "item-marketing", "item-project", "item-misc"]);
  return {
    customers: Array.isArray(parsed.customers) ? parsed.customers.filter((item) => !demoCustomers.has(item.id)) : defaults.customers,
    items: Array.isArray(parsed.items) ? parsed.items.filter((item) => !demoItems.has(item.id)) : defaults.items,
    businessProfile: { ...defaults.businessProfile, ...(parsed.businessProfile ?? {}) },
    invoiceSettings: { ...defaults.invoiceSettings, ...(parsed.invoiceSettings ?? {}) },
  };
}

export function SalesSetupProvider({ children }: { children: ReactNode }) {
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const [state, setState] = useState<SalesSetupState>(() => cloneDefaultSalesSetupState());
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);
  const storageKey = `receipt_cycle_sales_setup_${user?.id ?? "guest"}_${workspace}`;

  useEffect(() => {
    let live = true;
    setLoadedStorageKey(null);
    void AsyncStorage.getItem(storageKey).then((raw) => {
      if (!live) return;
      if (!raw) {
        setState(cloneDefaultSalesSetupState());
      } else {
        try { setState(normalizeState(JSON.parse(raw) as Partial<SalesSetupState>)); }
        catch { setState(cloneDefaultSalesSetupState()); }
      }
      setLoadedStorageKey(storageKey);
    }).catch(() => {
      if (live) { setState(cloneDefaultSalesSetupState()); setLoadedStorageKey(storageKey); }
    });
    return () => { live = false; };
  }, [storageKey, workspace]);

  const update = (recipe: (current: SalesSetupState) => SalesSetupState) => {
    setState((current) => {
      const next = recipe(current);
      void AsyncStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  const value = useMemo<SalesSetupContextValue>(() => ({
    ...state,
    ready: loadedStorageKey === storageKey,
    saveCustomer: (draft) => {
      const id = draft.id ?? `customer-${Date.now()}`;
      const customer: SalesCustomer = { ...draft, id, createdAt: draft.createdAt ?? new Date().toISOString().slice(0, 10) };
      update((current) => ({ ...current, customers: current.customers.some((item) => item.id === id) ? current.customers.map((item) => item.id === id ? customer : item) : [customer, ...current.customers] }));
      return id;
    },
    setCustomerStatus: (id, status) => update((current) => ({ ...current, customers: current.customers.map((customer) => customer.id === id ? { ...customer, status } : customer) })),
    saveItem: (draft) => {
      const id = draft.id ?? `item-${Date.now()}`;
      const item: CatalogItem = { ...draft, id };
      update((current) => ({ ...current, items: current.items.some((row) => row.id === id) ? current.items.map((row) => row.id === id ? item : row) : [item, ...current.items] }));
      return id;
    },
    setItemActive: (id, active) => update((current) => ({ ...current, items: current.items.map((item) => item.id === id ? { ...item, active } : item) })),
    saveBusinessProfile: (businessProfile) => update((current) => ({ ...current, businessProfile })),
    saveInvoiceSettings: (invoiceSettings) => update((current) => ({ ...current, invoiceSettings })),
  }), [state, loadedStorageKey, storageKey]);

  return <SalesSetupContext.Provider value={value}>{children}</SalesSetupContext.Provider>;
}

export function useSalesSetup() {
  const value = useContext(SalesSetupContext);
  if (!value) throw new Error("useSalesSetup requires SalesSetupProvider");
  return value;
}
