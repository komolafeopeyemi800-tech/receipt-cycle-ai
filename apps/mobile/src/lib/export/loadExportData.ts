import { isStoredKey, type ExportDocument, type ExportTransaction } from "./exportModel";

/** The small part of ApiClient the export needs (so tests can pass a fake). */
export type ExportApi = {
  request<T>(method: string, path: string, opts?: { token?: string; body?: unknown }): Promise<T>;
};

export type LoadedExportData = {
  documents: ExportDocument[];
  /** R2 key -> signed URL that opens without signing in. Empty when links could not be created. */
  links: Record<string, string>;
  /** True when /api/documents exists on the server (false on 404 or on any other failure). */
  documentsAvailable: boolean;
};

const statusOf = (e: unknown) => (e && typeof e === "object" && "status" in e ? Number((e as { status: unknown }).status) : 0);
const CHUNK = 500;

/**
 * Fetches what the workbook needs besides the transactions: uploaded documents and openable links.
 * Never throws for a missing or failing documents/links endpoint: the workbook is still built from the transactions
 * (links then fall back to each transaction's own evidence link). Sign-in problems (401/403) are rethrown.
 */
export async function loadExportData(api: ExportApi, token: string, transactions: Pick<ExportTransaction, "receipt_url">[]): Promise<LoadedExportData> {
  let documents: ExportDocument[] = [];
  let documentsAvailable = false;
  try {
    const res = await api.request<unknown>("GET", "/api/documents", { token });
    const list = Array.isArray(res) ? res : Array.isArray((res as { documents?: unknown } | null)?.documents) ? (res as { documents: unknown[] }).documents : null;
    if (list) {
      documents = list.filter((d): d is ExportDocument => !!d && typeof d === "object" && typeof (d as ExportDocument).r2Key === "string");
      documentsAvailable = true;
    }
  } catch (e) {
    const s = statusOf(e);
    if (s === 401 || s === 403) throw e;
    documents = []; // 404 (endpoint not deployed yet) or any other hiccup
  }

  const keys = [...new Set([...transactions.map((t) => t.receipt_url).filter(isStoredKey), ...documents.map((d) => d.r2Key).filter(isStoredKey)])];
  const links: Record<string, string> = {};
  for (let i = 0; i < keys.length; i += CHUNK) {
    try {
      const res = await api.request<{ links?: Record<string, string> }>("POST", "/api/receipts/links", { token, body: { keys: keys.slice(i, i + CHUNK) } });
      Object.assign(links, res?.links ?? {});
    } catch (e) {
      const s = statusOf(e);
      if (s === 401 || s === 403) throw e;
      // Older server or a stale key: keep going with the evidence links the transactions already carry.
    }
  }
  return { documents, links, documentsAvailable };
}
