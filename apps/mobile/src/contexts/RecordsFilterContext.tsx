import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type RecordsSort = "newest" | "oldest" | "amount_high" | "amount_low";
export type RecordsFilters = {
  search: string;
  type: "all" | "expense" | "income";
  category: string | null;
  startDate: string | null;
  endDate: string | null;
  accountId: string | null;
  sort: RecordsSort;
};

export const defaultRecordsFilters: RecordsFilters = {
  search: "", type: "all", category: null, startDate: null, endDate: null, accountId: null, sort: "newest",
};

const Context = createContext<{
  filters: RecordsFilters;
  setFilters: (next: RecordsFilters) => void;
  clearFilters: () => void;
} | null>(null);

export function RecordsFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<RecordsFilters>(defaultRecordsFilters);
  const value = useMemo(() => ({ filters, setFilters, clearFilters: () => setFilters(defaultRecordsFilters) }), [filters]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useRecordsFilters() {
  const value = useContext(Context);
  if (!value) throw new Error("useRecordsFilters requires RecordsFilterProvider");
  return value;
}
