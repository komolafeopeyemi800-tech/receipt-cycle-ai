import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/** App is personal-only; workspace is always `personal`. */
export type WorkspaceId = "personal";

const STORAGE_KEY = "receiptcycle_workspace";

type Ctx = {
  workspace: WorkspaceId;
  /** No-op — kept so existing call sites do not break. */
  setWorkspace: (w: string) => void;
  ready: boolean;
};

const WorkspaceContext = createContext<Ctx | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, "personal");
      } catch {
        /* ignore */
      }
      setReady(true);
    })();
  }, []);

  const setWorkspace = useCallback(async (_w: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, "personal");
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ workspace: "personal" as const, setWorkspace, ready }),
    [setWorkspace, ready],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
