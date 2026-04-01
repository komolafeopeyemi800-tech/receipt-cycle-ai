import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useWebAuth } from "@/contexts/WebAuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { buildSummary, filterByMonth, type DocTx } from "@/lib/transactionMath";

/**
 * Sidebar / chrome stats — same Convex data + math as the dashboard (not legacy Supabase).
 */
export function useConvexMonthlySummary() {
  const { user } = useWebAuth();
  const { workspace, ready: wsReady } = useWorkspace();
  const all = useQuery(
    api.transactions.list,
    user && wsReady ? { workspace, userId: user.id } : "skip",
  );

  const summary = useMemo(() => {
    if (all === undefined) return null;
    return buildSummary(filterByMonth((all ?? []) as DocTx[]));
  }, [all]);

  const loading = !wsReady || (user !== null && all === undefined);

  return {
    summary,
    loading,
    hasUser: Boolean(user),
  };
}
