import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useWorkspace } from "./WorkspaceContext";
import type { MoneyIcon } from "../features/money/model";

type Appearance = { categoryIcons: Record<string, MoneyIcon>; archivedCategoryIds: string[]; accountColors: Record<string, string> };
const emptyAppearance: Appearance = { categoryIcons: {}, archivedCategoryIds: [], accountColors: {} };
type ContextValue = {
  ready: boolean; appearance: Appearance;
  setCategoryIcon: (id: string, icon: MoneyIcon) => void;
  setCategoryArchived: (id: string, archived: boolean) => void;
  setAccountColor: (id: string, color: string) => void;
};
const Context = createContext<ContextValue | null>(null);

export function MoneyAppearanceProvider({ children }: { children: ReactNode }) {
  const { workspace } = useWorkspace();
  const [appearance, setAppearance] = useState<Appearance>(emptyAppearance);
  const [loadedWorkspace, setLoadedWorkspace] = useState<string | null>(null);
  const key = `receipt_cycle_money_appearance_${workspace}`;

  useEffect(() => {
    let live = true;
    setLoadedWorkspace(null);
    void AsyncStorage.getItem(key).then((raw) => {
      if (!live) return;
      if (!raw) { setAppearance(emptyAppearance); setLoadedWorkspace(workspace); return; }
      try {
        const parsed = JSON.parse(raw) as Partial<Appearance>;
        setAppearance({ categoryIcons: parsed.categoryIcons ?? {}, archivedCategoryIds: parsed.archivedCategoryIds ?? [], accountColors: parsed.accountColors ?? {} });
      } catch { setAppearance(emptyAppearance); }
      setLoadedWorkspace(workspace);
    }).catch(() => { if (live) { setAppearance(emptyAppearance); setLoadedWorkspace(workspace); } });
    return () => { live = false; };
  }, [key, workspace]);

  const persist = (next: Appearance) => { void AsyncStorage.setItem(key, JSON.stringify(next)); };
  const value = useMemo<ContextValue>(() => ({
    ready: loadedWorkspace === workspace,
    appearance,
    setCategoryIcon: (id, icon) => setAppearance((current) => { const next = { ...current, categoryIcons: { ...current.categoryIcons, [id]: icon } }; persist(next); return next; }),
    setCategoryArchived: (id, archived) => setAppearance((current) => { const ids = new Set(current.archivedCategoryIds); if (archived) ids.add(id); else ids.delete(id); const next = { ...current, archivedCategoryIds: [...ids] }; persist(next); return next; }),
    setAccountColor: (id, color) => setAppearance((current) => { const next = { ...current, accountColors: { ...current.accountColors, [id]: color } }; persist(next); return next; }),
  }), [appearance, loadedWorkspace, workspace, key]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useMoneyAppearance() {
  const value = useContext(Context);
  if (!value) throw new Error("useMoneyAppearance requires MoneyAppearanceProvider");
  return value;
}
