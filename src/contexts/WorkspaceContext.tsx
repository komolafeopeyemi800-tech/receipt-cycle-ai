import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/** Personal-only — aligned with `apps/mobile/src/contexts/WorkspaceContext.tsx`. */
export type WorkspaceId = "personal";

const STORAGE_KEY = "receiptcycle_workspace";

type Ctx = {
  workspace: WorkspaceId;
  /** No-op — kept for existing call sites. */
  setWorkspace: (w: string) => void;
  ready: boolean;
};

const WorkspaceContext = createContext<Ctx | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "personal");
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const setWorkspace = useCallback((_w: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, "personal");
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ workspace: "personal" as const, setWorkspace, ready }),
    [setWorkspace],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
