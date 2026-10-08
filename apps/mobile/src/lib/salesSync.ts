import { useEffect, useRef } from "react";
import { useApiClient } from "./api";
import { diffCollection, getSalesEngine, type KeyValueStore, type SalesHandler, type SalesKind, type SalesOp, type SalesSyncEngine } from "./salesSyncCore";

export * from "./salesSyncCore";

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
type SalesData = Record<string, unknown>;
const SINGLETON_ID = "singleton";

export type SalesSyncHandle = {
  /** Report a local edit to a collection (list of records with an id). */
  collection: <T>(kind: SalesKind, prev: T[], next: T[], idOf: (item: T) => string) => void;
  /** Report a local edit to a single settings record. */
  single: (kind: SalesKind, prev: unknown, next: unknown) => void;
  /** Report a batch of already-computed operations. */
  push: (ops: SalesOp[]) => void;
  syncNow: () => void;
};

/**
 * React hook: joins the shared engine for this user + workspace while the screen is mounted.
 * `getLocal` / `apply` may change every render; the latest ones are always used.
 */
export function useSalesSync(opts: {
  userId: string | undefined;
  workspace: string;
  kv: KeyValueStore;
  kinds: SalesKind[];
  /** True once this screen's own saved copy has been loaded; anything it holds that the server lacks is then uploaded. */
  ready: boolean;
  getLocal: SalesHandler["getLocal"];
  apply: SalesHandler["apply"];
}): SalesSyncHandle {
  const client = useApiClient();
  const latest = useRef(opts);
  latest.current = opts;
  const engineRef = useRef<SalesSyncEngine | null>(null);
  const handlerRef = useRef<SalesHandler | null>(null);
  const { userId, workspace, ready } = opts;

  useEffect(() => {
    if (!userId) return;
    const engine = getSalesEngine(client, userId, workspace, latest.current.kv);
    const handler: SalesHandler = {
      kinds: latest.current.kinds,
      getLocal: () => latest.current.getLocal(),
      apply: (changes) => latest.current.apply(changes),
    };
    engineRef.current = engine;
    handlerRef.current = handler;
    engine.acquire();
    const off = engine.register(handler);
    const unsubscribeToken = client.onTokenChange((token) => {
      if (token) void engine.syncNow();
    });
    const unsubscribeForeground = latest.current.kv.onForeground?.(() => void engine.syncNow());
    return () => {
      off();
      unsubscribeToken();
      unsubscribeForeground?.();
      engine.release();
      engineRef.current = null;
      handlerRef.current = null;
    };
  }, [client, userId, workspace]);

  useEffect(() => {
    if (ready && userId && engineRef.current && handlerRef.current) void engineRef.current.adopt(handlerRef.current);
  }, [ready, client, userId, workspace]);

  const handle = useRef<SalesSyncHandle>({
    collection: (kind, prev, next, idOf) => engineRef.current?.push(diffCollection(kind, prev, next, idOf)),
    single: (kind, prev, next) => {
      if (!same(prev, next)) engineRef.current?.push([{ op: "put", kind, id: SINGLETON_ID, data: next as SalesData }]);
    },
    push: (ops) => engineRef.current?.push(ops),
    syncNow: () => void engineRef.current?.syncNow(),
  });
  return handle.current;
}
