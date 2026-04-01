import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useState, useCallback, useEffect, type FormEvent, type ChangeEvent, type CSSProperties } from "react";
import { useLocation } from "react-router-dom";
import { TransactionList } from "@/components/transactions/TransactionList";
import type { Transaction } from "@/hooks/use-transactions";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useWebAuth } from "@/contexts/WebAuthContext";
import { AppChrome } from "@/components/layout/AppChrome";

/** Brand teal — keep aligned with mobile */
const primary = "#0f766e";

function normalizeExtracted(data: unknown): {
  total_amount?: number;
  merchant_name?: string;
  category?: string;
  date?: string;
  payment_method?: string;
  items?: { name?: string; price?: number }[];
} {
  if (!data || typeof data !== "object") return {};
  const o = data as Record<string, unknown>;
  const inner =
    o.data && typeof o.data === "object"
      ? (o.data as Record<string, unknown>)
      : o.extracted_data && typeof o.extracted_data === "object"
        ? (o.extracted_data as Record<string, unknown>)
        : o;

  const num = (v: unknown) => {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const n = parseFloat(v.replace(/[^0-9.-]/g, ""));
      return Number.isFinite(n) ? n : NaN;
    }
    return NaN;
  };
  const ta = num(inner.total_amount);

  return {
    total_amount: Number.isFinite(ta) ? ta : undefined,
    merchant_name: typeof inner.merchant_name === "string" ? inner.merchant_name : undefined,
    category: typeof inner.category === "string" ? inner.category : undefined,
    date: typeof inner.date === "string" ? inner.date : undefined,
    payment_method: typeof inner.payment_method === "string" ? inner.payment_method : undefined,
    items: Array.isArray(inner.items) ? (inner.items as { name?: string; price?: number }[]) : undefined,
  };
}

function ConvexTransactionsInner() {
  const location = useLocation();
  const { workspace, ready } = useWorkspace();
  const { user } = useWebAuth();
  const userId = user!.id;
  const transactions = useQuery(api.transactions.list, ready ? { workspace, userId } : "skip");
  const createTx = useMutation(api.transactions.create);
  const removeTx = useMutation(api.transactions.remove);
  const seedDemo = useMutation(api.transactions.seedDemo);
  const scanFromBase64 = useAction(api.scanReceipt.scanFromBase64);
  const runtime = useQuery(api.admin.publicConfig, {});

  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("Food & Dining");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [busy, setBusy] = useState(false);
  const [scanMsg, setScanMsg] = useState<string | null>(null);

  const rows: Transaction[] = (transactions ?? []) as Transaction[];

  const handleScanFile = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      e.target.value = "";
      if (!f) return;
      setScanMsg(null);
      setBusy(true);
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const data = reader.result as string;
            const b64 = data.includes(",") ? data.split(",")[1]! : data;
            resolve(b64);
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(f);
        });
        if (runtime?.maintenanceMode || runtime?.scannerEnabled === false) {
          setScanMsg("Scanner is currently unavailable.");
          return;
        }
        const result = await scanFromBase64({ imageBase64: base64, mimeType: f.type || "image/jpeg" });
        if ("error" in result && result.error) {
          setScanMsg(result.error);
          return;
        }
        const extracted = normalizeExtracted(result.extracted_data);
        if (typeof extracted.total_amount === "number") setAmount(String(extracted.total_amount));
        if (extracted.merchant_name) setMerchant(extracted.merchant_name);
        if (extracted.category) setCategory(extracted.category);
        if (extracted.date) setDate(extracted.date);
        setScanMsg("Receipt scanned — review fields, then save.");
      } catch (err) {
        setScanMsg(err instanceof Error ? err.message : "Scan failed");
      } finally {
        setBusy(false);
      }
    },
    [scanFromBase64, runtime?.maintenanceMode, runtime?.scannerEnabled],
  );

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    if (runtime?.maintenanceMode) {
      setScanMsg("System is in maintenance mode.");
      return;
    }
    if (runtime?.manualAddEnabled === false) {
      setScanMsg("Manual add is currently disabled by admin.");
      return;
    }
    setBusy(true);
    try {
      await createTx({
        workspace,
        userId,
        amount: n,
        type,
        category,
        merchant: merchant || undefined,
        date,
        description: undefined,
        payment_method: "Manual",
        tags: [],
        is_recurring: false,
        entrySource: "manual",
      });
      setAmount("");
      setMerchant("");
      setScanMsg(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    await removeTx({ id: id as Id<"transactions">, userId });
  }

  async function handleSeed() {
    setBusy(true);
    try {
      await seedDemo({ workspace });
    } finally {
      setBusy(false);
    }
  }

  const card: CSSProperties = {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  };

  const labelStyle: CSSProperties = { fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 };
  const inputStyle: CSSProperties = {
    width: "100%",
    fontSize: 13,
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    boxSizing: "border-box",
  };

  return (
    <div style={{ color: "#0f172a" }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <div style={{ marginBottom: 6 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>Records</h1>
        </div>
        <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 14px", lineHeight: 1.45 }}>
          Upload a receipt image to run OCR (camera capture lives on the mobile app). Same personal ledger as the
          Expo app when both use this Convex deployment.
        </p>

        <div style={{ ...card, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: primary,
              cursor: busy || !ready ? "default" : "pointer",
            }}
          >
            <input type="file" accept="image/*" disabled={busy || !ready} onChange={handleScanFile} hidden />
            Upload receipt to scan
          </label>
          <button
            type="button"
            onClick={handleSeed}
            disabled={busy || !ready}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#fff",
              fontSize: 12,
              cursor: busy || !ready ? "not-allowed" : "pointer",
            }}
          >
            Add demo row
          </button>
          {scanMsg && <span style={{ fontSize: 12, color: primary }}>{scanMsg}</span>}
        </div>

        <form id="add-transaction" onSubmit={handleAdd} style={{ ...card, maxWidth: 480 }}>
          <div style={{ display: "grid", gap: 10, marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <label style={{ flex: "1 1 120px" }}>
                <span style={labelStyle}>Type</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "expense" | "income")}
                  style={{ ...inputStyle, width: "100%" }}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </label>
              <label style={{ flex: "1 1 120px" }}>
                <span style={labelStyle}>Amount</span>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  style={inputStyle}
                />
              </label>
              <label style={{ flex: "1 1 140px" }}>
                <span style={labelStyle}>Date</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
              </label>
            </div>
            <label>
              <span style={labelStyle}>Merchant</span>
              <input value={merchant} onChange={(e) => setMerchant(e.target.value)} style={inputStyle} />
            </label>
            <label>
              <span style={labelStyle}>Category</span>
              <input value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle} />
            </label>
          </div>
          <button
            type="submit"
            disabled={busy || !ready}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 13,
              border: "none",
              background: primary,
              color: "#fff",
              cursor: busy || !ready ? "not-allowed" : "pointer",
              opacity: busy || !ready ? 0.7 : 1,
            }}
          >
            {busy ? "Saving…" : "Add transaction"}
          </button>
        </form>

        {transactions === undefined ? (
          <p style={{ fontSize: 13, color: "#64748b" }}>Loading…</p>
        ) : (
          <TransactionList transactions={rows} loading={false} variant="table" onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}

export default function ConvexTransactions() {
  const runtime = useQuery(api.admin.publicConfig, {});
  if (runtime?.maintenanceMode || runtime?.webTransactionsEnabled === false) {
    return (
      <main style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", padding: "16px 18px 32px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>Transactions unavailable</h1>
          <p style={{ color: "#64748b", fontSize: 13 }}>
            {runtime?.maintenanceMode ? "System is in maintenance mode." : "Transactions page is disabled by admin."}
          </p>
        </div>
      </main>
    );
  }
  return (
    <AppChrome>
      <ConvexTransactionsInner />
    </AppChrome>
  );
}
