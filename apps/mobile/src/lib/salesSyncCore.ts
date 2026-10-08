/**
 * Keeps invoices, estimates, payments, customers, catalog items and business settings identical on the web app and
 * the mobile app. Both apps stay "local first" (they read and write their own saved copy so the UI is instant and
 * works offline) and this engine mirrors that copy to the Cloudflare API: local changes are pushed, remote changes are
 * pulled and handed back to the app. One engine per user + workspace is shared by every screen that needs it.
 * (This file has no React so it can be unit tested; the React hook lives in salesSync.ts.)
 */
import type { ApiClient } from "./api/client";

export const SALES_KINDS = ["customer", "item", "invoice", "estimate", "payment", "business_profile", "invoice_settings", "reminders"] as const;
export type SalesKind = (typeof SALES_KINDS)[number];
export type SalesData = Record<string, unknown>;
export type SalesChange = { kind: SalesKind; id: string; data: SalesData | null };
export type KeyValueStore = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  /** Optional: calls back when the app comes back to the foreground / the tab regains focus / the network returns. */
  onForeground?: (callback: () => void) => () => void;
};

export type SalesOp = { op: "put"; kind: SalesKind; id: string; data: SalesData } | { op: "delete"; kind: SalesKind; id: string };
type Op = SalesOp;
type Meta = { since: number; known: string[]; pending: Op[] };
type PullResponse = { serverTime: number; records: { kind: SalesKind; id: string; data: SalesData | null; updatedAt: number; deleted: boolean }[] };

/** What one screen/context registers: which kinds it owns, how to read its local copy, how to apply remote changes. */
export type SalesHandler = {
  kinds: SalesKind[];
  getLocal: () => { kind: SalesKind; id: string; data: SalesData }[];
  apply: (changes: SalesChange[]) => void;
};

export const SINGLETON_ID = "singleton";
const keyOf = (kind: string, id: string) => `${kind}|${id}`;
const SYNC_EVERY_MS = 30_000;
const FLUSH_DELAY_MS = 500;

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Compares two versions of a collection and returns the operations that turn the first into the second.
 * Pure, so it is covered by unit tests.
 */
export function diffCollection<T>(kind: SalesKind, prev: T[], next: T[], idOf: (item: T) => string): Op[] {
  const before = new Map(prev.map((item) => [idOf(item), item]));
  const after = new Map(next.map((item) => [idOf(item), item]));
  const ops: Op[] = [];
  for (const [id, item] of after) {
    if (!before.has(id) || !same(before.get(id), item)) ops.push({ op: "put", kind, id, data: item as unknown as SalesData });
  }
  for (const id of before.keys()) if (!after.has(id)) ops.push({ op: "delete", kind, id });
  return ops;
}

/** Applies remote changes to a local collection (upsert / delete by id). Pure. */
export function applyToCollection<T>(kind: SalesKind, items: T[], changes: SalesChange[], idOf: (item: T) => string, put: (data: SalesData) => T): T[] {
  let next = items;
  for (const change of changes) {
    if (change.kind !== kind) continue;
    if (change.data === null) {
      next = next.filter((item) => idOf(item) !== change.id);
    } else {
      const row = put(change.data);
      next = next.some((item) => idOf(item) === change.id) ? next.map((item) => (idOf(item) === change.id ? row : item)) : [row, ...next];
    }
  }
  return next;
}

export class SalesSyncEngine {
  private handlers = new Set<SalesHandler>();
  private meta: Meta = { since: 0, known: [], pending: [] };
  private loaded: Promise<void>;
  private timer: ReturnType<typeof setInterval> | null = null;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private running: Promise<void> | null = null;
  private again = false;
  private refs = 0;

  constructor(
    private readonly client: ApiClient,
    readonly workspace: string,
    private readonly kv: KeyValueStore,
    private readonly metaKey: string,
  ) {
    this.loaded = this.kv
      .get(this.metaKey)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<Meta>;
        this.meta = {
          since: Number(parsed.since) || 0,
          known: Array.isArray(parsed.known) ? parsed.known : [],
          pending: Array.isArray(parsed.pending) ? parsed.pending : [],
        };
      })
      .catch(() => undefined);
  }

  acquire() {
    this.refs += 1;
    if (!this.timer) this.timer = setInterval(() => void this.syncNow(), SYNC_EVERY_MS);
  }

  release() {
    this.refs = Math.max(0, this.refs - 1);
    if (this.refs === 0 && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  get inUse() {
    return this.refs > 0;
  }

  register(handler: SalesHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /** Call once a handler's own saved copy has been loaded: anything it holds that the server has never seen is uploaded. */
  async adopt(handler: SalesHandler) {
    await this.loaded;
    const known = new Set(this.meta.known);
    const pending = new Set(this.meta.pending.map((o) => keyOf(o.kind, o.id)));
    for (const rec of handler.getLocal()) {
      const key = keyOf(rec.kind, rec.id);
      if (!known.has(key) && !pending.has(key)) this.queue({ op: "put", kind: rec.kind, id: rec.id, data: rec.data });
    }
    void this.syncNow();
  }

  /** Record a local change; it is uploaded shortly after. */
  push(ops: Op[]) {
    if (ops.length === 0) return;
    for (const o of ops) this.queue(o);
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = setTimeout(() => void this.syncNow(), FLUSH_DELAY_MS);
  }

  private queue(op: Op) {
    const key = keyOf(op.kind, op.id);
    this.meta.pending = [...this.meta.pending.filter((o) => keyOf(o.kind, o.id) !== key), op];
    void this.save();
  }

  private async save() {
    try {
      await this.kv.set(this.metaKey, JSON.stringify(this.meta));
    } catch {
      /* storage full or blocked: syncing still works for this session */
    }
  }

  /** Upload pending changes, then download what changed elsewhere. Safe to call at any time. */
  syncNow(): Promise<void> {
    if (this.running) {
      this.again = true;
      return this.running;
    }
    this.running = (async () => {
      try {
        await this.loaded;
        do {
          this.again = false;
          if (!this.client.getToken()) return;
          await this.flush();
          await this.pull();
        } while (this.again);
      } catch {
        /* offline or server error: pending changes stay queued and are retried on the next tick */
      } finally {
        this.running = null;
      }
    })();
    return this.running;
  }

  private async flush() {
    while (this.meta.pending.length > 0) {
      const batch = this.meta.pending.slice(0, 100);
      await this.client.request("POST", "/api/sales/batch", { body: { workspace: this.workspace, ops: batch } });
      // A newer local change to the same record may have been queued while this request was in flight: keep that one.
      this.meta.pending = this.meta.pending.filter((o) => !batch.includes(o));
      const known = new Set(this.meta.known);
      for (const o of batch) {
        if (o.op === "put") known.add(keyOf(o.kind, o.id));
        else known.delete(keyOf(o.kind, o.id));
      }
      this.meta.known = [...known];
      await this.save();
    }
  }

  private async pull() {
    const first = this.meta.since === 0;
    const res = await this.client.request<PullResponse>("GET", "/api/sales", {
      query: { workspace: this.workspace, since: this.meta.since || undefined },
    });
    const pending = new Set(this.meta.pending.map((o) => keyOf(o.kind, o.id)));
    const known = new Set(this.meta.known);
    const changes: SalesChange[] = [];
    const onServer = new Set<string>();
    for (const rec of res.records) {
      const key = keyOf(rec.kind, rec.id);
      onServer.add(key);
      if (pending.has(key)) continue; // our newer local edit wins until it is uploaded
      if (rec.deleted) known.delete(key);
      else known.add(key);
      changes.push({ kind: rec.kind, id: rec.id, data: rec.deleted ? null : rec.data });
    }
    if (first) {
      // A full download: anything we had synced before that is no longer on the server was deleted elsewhere.
      for (const key of [...known]) {
        if (onServer.has(key) || pending.has(key)) continue;
        known.delete(key);
        const [kind, ...rest] = key.split("|");
        changes.push({ kind: kind as SalesKind, id: rest.join("|"), data: null });
      }
    }
    this.meta.known = [...known];
    // Look back a few seconds on the next pull so a write that was still being saved when we asked is never missed.
    // If some change belongs to a kind nobody is listening for yet, keep the old position so it is delivered later.
    const listening = new Set([...this.handlers].flatMap((h) => h.kinds));
    const missed = this.handlers.size === 0 || changes.some((c) => !listening.has(c.kind));
    if (!missed) this.meta.since = Math.max(this.meta.since, res.serverTime - 5000);
    await this.save();
    if (changes.length === 0) return;
    for (const handler of this.handlers) {
      const mine = changes.filter((c) => handler.kinds.includes(c.kind));
      if (mine.length > 0) handler.apply(mine);
    }
  }
}

const engines = new Map<string, SalesSyncEngine>();

export function getSalesEngine(client: ApiClient, userId: string, workspace: string, kv: KeyValueStore): SalesSyncEngine {
  const key = `${userId}|${workspace}`;
  let engine = engines.get(key);
  if (!engine) {
    engine = new SalesSyncEngine(client, workspace, kv, `receipt_cycle_sales_sync_${userId}_${workspace}`);
    engines.set(key, engine);
  }
  return engine;
}

