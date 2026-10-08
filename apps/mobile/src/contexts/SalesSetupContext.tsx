import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { cloneDefaultSalesSetupState, defaultSalesSetupState, type NotificationPreferences, type BusinessProfile, type CatalogItem, type InvoiceSettings, type SalesCustomer, type SalesSetupState } from "../features/sales/setupData";
import { asyncKv } from "../lib/asyncKv";
import { applyToCollection, SINGLETON_ID, useSalesSync, type SalesChange, type SalesData } from "../lib/salesSync";
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
  deleteCustomer: (id: string) => void;
  deleteItem: (id: string) => void;
  saveBusinessProfile: (profile: BusinessProfile) => void;
  saveInvoiceSettings: (settings: InvoiceSettings) => void;
  saveReminders: (reminders: NotificationPreferences) => void;
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
    reminders: { ...defaults.reminders, ...(parsed.reminders ?? {}) },
  };
}

/** The logo is a file on this device, so only a web address or an embedded image is shared with other devices. */
const shareableProfile = (profile: BusinessProfile): BusinessProfile =>
  ({ ...profile, logoUri: profile.logoUri && /^(https?:|data:)/.test(profile.logoUri) ? profile.logoUri : null });

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

  const sync = useSalesSync({
    userId: user?.id,
    workspace,
    kv: asyncKv,
    kinds: ["customer", "item", "business_profile", "invoice_settings", "reminders"],
    ready: loadedStorageKey === storageKey,
    getLocal: () => [
      ...state.customers.map((row) => ({ kind: "customer" as const, id: row.id, data: row as unknown as SalesData })),
      ...state.items.map((row) => ({ kind: "item" as const, id: row.id, data: row as unknown as SalesData })),
      { kind: "business_profile" as const, id: SINGLETON_ID, data: shareableProfile(state.businessProfile) as unknown as SalesData },
      { kind: "invoice_settings" as const, id: SINGLETON_ID, data: state.invoiceSettings as unknown as SalesData },
      ...(JSON.stringify(state.reminders) !== JSON.stringify(defaultSalesSetupState.reminders) ? [{ kind: "reminders" as const, id: SINGLETON_ID, data: state.reminders as unknown as SalesData }] : []),
    ],
    apply: (changes: SalesChange[]) => {
      setState((current) => {
        const defaults = cloneDefaultSalesSetupState();
        let next: SalesSetupState = {
          ...current,
          customers: applyToCollection("customer", current.customers, changes, (r) => r.id, (d) => d as unknown as SalesCustomer),
          items: applyToCollection("item", current.items, changes, (r) => r.id, (d) => d as unknown as CatalogItem),
        };
        for (const change of changes) {
          if (change.kind === "business_profile" && change.data) next = { ...next, businessProfile: { ...defaults.businessProfile, ...(change.data as Partial<BusinessProfile>), logoUri: (change.data.logoUri as string | null | undefined) ?? current.businessProfile.logoUri } };
          if (change.kind === "invoice_settings" && change.data) next = { ...next, invoiceSettings: { ...defaults.invoiceSettings, ...(change.data as Partial<InvoiceSettings>) } };
          if (change.kind === "reminders" && change.data) next = { ...next, reminders: { ...defaults.reminders, ...(change.data as Partial<NotificationPreferences>) } };
        }
        void AsyncStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
    },
  });

  const update = (recipe: (current: SalesSetupState) => SalesSetupState) => {
    setState((current) => {
      const next = recipe(current);
      void AsyncStorage.setItem(storageKey, JSON.stringify(next));
      sync.collection("customer", current.customers, next.customers, (r) => r.id);
      sync.collection("item", current.items, next.items, (r) => r.id);
      sync.single("business_profile", shareableProfile(current.businessProfile), shareableProfile(next.businessProfile));
      sync.single("invoice_settings", current.invoiceSettings, next.invoiceSettings);
      sync.single("reminders", current.reminders, next.reminders);
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
    deleteCustomer: (id) => update((current) => ({ ...current, customers: current.customers.filter((customer) => customer.id !== id) })),
    deleteItem: (id) => update((current) => ({ ...current, items: current.items.filter((item) => item.id !== id) })),
    saveBusinessProfile: (businessProfile) => update((current) => ({ ...current, businessProfile })),
    saveInvoiceSettings: (invoiceSettings) => update((current) => ({ ...current, invoiceSettings })),
    saveReminders: (reminders) => update((current) => ({ ...current, reminders })),
  }), [state, loadedStorageKey, storageKey]);

  return <SalesSetupContext.Provider value={value}>{children}</SalesSetupContext.Provider>;
}

export function useSalesSetup() {
  const value = useContext(SalesSetupContext);
  if (!value) throw new Error("useSalesSetup requires SalesSetupProvider");
  return value;
}
