import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useWebAuth } from "@/contexts/WebAuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { buildSummary, monthRangeISO, type DocTx } from "@/lib/transactionMath";

/** Sidebar / chrome stats — current calendar month, same list args pattern as dashboard month view. */
export function useConvexMonthlySummary() {
  const { user } = useWebAuth();
  const { workspace, ready: wsReady } = useWorkspace();
  const { startStr, endStr } = monthRangeISO();
  const all = useQuery(
    api.transactions.list,
    wsReady && user?.id
      ? { workspace, userId: String(user.id), startDate: startStr, endDate: endStr }
      : "skip",
  );

  const summary = useMemo(() => {
    if (all === undefined) return null;
    return buildSummary((all ?? []) as DocTx[]);
  }, [all]);

  const loading = !wsReady || (Boolean(user?.id) && all === undefined);

  return {
    summary,
    loading,
    hasUser: Boolean(user),
  };
}
