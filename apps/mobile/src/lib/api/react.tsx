/**
 * React bindings. `useQuery` / `useMutation` / `useAction` have the same shape as Convex's hooks so
 * screens barely changed, but they run on TanStack Query over plain HTTP:
 *  - queries refetch on window focus / reconnect and after any mutation (no background polling: each
 *    poll is a request, and the Workers free plan allows 100,000 a day)
 *  - the whole cache is dropped when the signed-in user changes
 */
import { onlineManager, useQuery as useRQ, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { ApiRequestError, type ApiClient } from "./client";
import type { FnRef } from "./registry";

const ClientContext = createContext<ApiClient | null>(null);

/** Must sit inside a TanStack `QueryClientProvider`. */
export function ApiProvider({ client, children }: { client: ApiClient; children: ReactNode }) {
  const queryClient = useQueryClient();
  useEffect(() => client.onTokenChange(() => queryClient.clear()), [client, queryClient]);
  return <ClientContext.Provider value={client}>{children}</ClientContext.Provider>;
}

export function useApiClient(): ApiClient {
  const client = useContext(ClientContext);
  if (!client) throw new Error("useApiClient must be used within ApiProvider");
  return client;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_k, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );
}

const isClientError = (e: unknown) => e instanceof ApiRequestError && e.status >= 400 && e.status < 500;

/** `undefined` while loading (or on error / "skip"), otherwise the result, exactly like Convex. */
export function useQuery<A, R>(ref: FnRef<A, R>, args: A | "skip"): R | undefined {
  const client = useApiClient();
  const skip = args === "skip";
  const q = useRQ({
    queryKey: ["api", ref.name, skip ? null : stableStringify(args)],
    queryFn: async () => (await ref.run(client, args as A)) ?? null,
    enabled: !skip,
    staleTime: 30_000,
    retry: (count, err) => count < 1 && !isClientError(err),
  });
  return skip ? undefined : (q.data as R | undefined);
}

/** Runs the call, then refreshes every query so screens show the new data. */
export function useMutation<A, R>(ref: FnRef<A, R>): (args: A) => Promise<R> {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useCallback(
    async (args: A) => {
      const result = await ref.run(client, args);
      void queryClient.invalidateQueries({ queryKey: ["api"] });
      return result;
    },
    [client, queryClient, ref],
  );
}

/** For calls that do not change stored data (AI, sign-in, email). */
export function useAction<A, R>(ref: FnRef<A, R>): (args: A) => Promise<R> {
  const client = useApiClient();
  return useCallback((args: A) => ref.run(client, args), [client, ref]);
}

export type ConnectionState = {
  isWebSocketConnected: boolean;
  hasEverConnected: boolean;
  connectionRetries: number;
};

/** There is no socket any more; "connected" now means the device is online. */
export function useConnectionState(): ConnectionState {
  const online = useSyncExternalStore(
    (cb) => onlineManager.subscribe(cb),
    () => onlineManager.isOnline(),
    () => true,
  );
  return useMemo(() => ({ isWebSocketConnected: online, hasEverConnected: true, connectionRetries: online ? 0 : 3 }), [online]);
}
