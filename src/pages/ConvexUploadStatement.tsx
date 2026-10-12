import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@mobile-lib/api";
import { api, type StatementRow } from "@mobile-lib/api";
import { parseStatementCsv } from "@mobile-lib/statementCsv";
import { describeParse, importInChunks } from "@mobile-lib/statementUpload";
import { apiStatementTools } from "@mobile-lib/statementParse/apiTools";
import { readStatement } from "@mobile-lib/statementParse/pipeline";
import { apiClient } from "@/lib/api";
import { loadStatementEngine } from "@/lib/statementReader";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useWebAuth } from "@/contexts/WebAuthContext";
import { AppChrome } from "@/components/layout/AppChrome";

const primary = "#0f766e";

function defaultCategory(type: "expense" | "income") {
  return type === "expense" ? "Other" : "Salary";
}

/** Web: statement import (CSV, Excel, PDF, Word). Every file is read in the browser; the API is only asked for AI help as a last resort. */
function ConvexUploadStatementInner() {
  const navigate = useNavigate();
  const { workspace, ready } = useWorkspace();
  const { user, token } = useWebAuth();
  const userId = user!.id;
  const runtime = useQuery(api.admin.publicConfig, {});
  const bulkImport = useMutation(api.transactions.bulkImport);
  const uploadReceipt = useMutation(api.receipts.upload);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const runImport = useCallback(
    async (file: File) => {
      if (file.type.startsWith("image/")) {
        navigate("/transactions#upload-document", { state: { uploadFile: file } });
        return;
      }
      if (!ready) {
        setMsg("Workspace loading…");
        return;
      }
      if (!token) {
        setMsg("Sign in again to continue.");
        return;
      }
      if (runtime?.maintenanceMode) {
        setMsg("System is in maintenance mode.");
        return;
      }
      if (runtime?.uploadEnabled === false) {
        setMsg("Upload is currently disabled by admin.");
        return;
      }
      setBusy(true);
      setMsg(null);
      try {
        const name = file.name.toLowerCase();
        let rows: StatementRow[] | null = null;
        let note = "";

        // CSV: try the fast in-browser reader first (works offline, tuned for bank exports).
        if (name.endsWith(".csv") || file.type.includes("csv")) {
          const local = parseStatementCsv(await file.text());
          if (local.ok) {
            rows = local.rows.map((r) => ({
              amount: r.amount,
              type: r.type,
              category: defaultCategory(r.type),
              date: r.date,
              merchant: r.merchant,
              description: r.description,
            }));
            note = local.warnings.join(" ");
          }
        }

        // Excel, PDF, Word (or a CSV the quick reader could not understand): read in the browser with anydoc.
        if (!rows) {
          setMsg("Reading your file…");
          const engine = await loadStatementEngine();
          const tools = apiStatementTools(apiClient);
          const parsed = await readStatement(new Uint8Array(await file.arrayBuffer()), {
            fileName: file.name,
            engine,
            ai: tools.ai,
            cache: tools.cache,
          });
          if (parsed.status !== "ok") {
            setMsg(parsed.message ?? "Could not read this file.");
            return;
          }
          rows = parsed.rows;
          note = describeParse(parsed);
        }

        const total = rows.length;
        const evidenceKey = (await uploadReceipt({ file, fileName: file.name })).key;
        const res = await importInChunks(
          rows,
          (chunk) =>
            bulkImport({ workspace, userId, token, receipt_url: evidenceKey, rows: chunk.map((r) => ({ ...r, payment_method: "Import" })) }),
          (done) => setMsg(`Importing… ${done} of ${total}`),
        );
        setMsg(`Imported ${res.inserted} transaction(s).${note ? ` ${note}` : ""}`);
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Import failed");
      } finally {
        setBusy(false);
      }
    },
    [ready, workspace, userId, token, bulkImport, uploadReceipt, runtime?.maintenanceMode, runtime?.uploadEnabled, navigate],
  );

  const onPick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".jpg,.jpeg,.png,.webp,.csv,.xlsx,.xls,.ods,.pdf,.docx,.odt,image/*,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    input.onchange = () => {
      const f = input.files?.[0];
      if (f) void runImport(f);
    };
    input.click();
  };

  return (
    <div style={{ color: "#0f172a" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <Link to="/" style={{ fontSize: 13, color: primary, fontWeight: 600 }}>
            ← Back
          </Link>
          <Link to="/transactions" style={{ fontSize: 13, color: primary, fontWeight: 600 }}>
            Transactions →
          </Link>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>Add documents</h1>
        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16, lineHeight: 1.45 }}>
          Upload one source and Receipt Cycle will choose the right extraction flow for receipts, invoices, statements, spreadsheets and PDFs.
        </p>
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files?.[0];
            if (file) void runImport(file);
          }}
          style={{
            border: "2px dashed #cbd5e1",
            borderRadius: 8,
            padding: "96px 24px",
            textAlign: "center",
            background: "#f8fafc",
          }}
        >
          <div style={{ color: "#94a3b8", fontSize: 58, lineHeight: 1, marginBottom: 22 }}><i className="far fa-folder-open" /></div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Upload your files</h2>
          <p style={{ margin: "10px 0 20px", color: "#64748b", fontSize: 16 }}>Drag and drop files or browse</p>
          <button
            type="button"
            onClick={onPick}
            disabled={busy || !ready}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: busy || !ready ? "#94a3b8" : primary,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "13px 24px",
              fontWeight: 700,
              fontSize: 13,
              cursor: busy || !ready ? "not-allowed" : "pointer",
            }}
          >
            {busy ? "Importing…" : "Choose file"}
          </button>
          <p style={{ marginTop: 22, color: "#64748b", fontSize: 14 }}>Upload any <span style={{ color: "#2563eb", background: "#eff6ff", padding: "4px 8px", borderRadius: 5 }}>receipt</span> · <span style={{ color: "#7c3aed", background: "#f5f3ff", padding: "4px 8px", borderRadius: 5 }}>invoice</span> · <span style={{ color: "#c2410c", background: "#fff7ed", padding: "4px 8px", borderRadius: 5 }}>credit card statement</span> or <span style={{ color: "#047857", background: "#ecfdf5", padding: "4px 8px", borderRadius: 5 }}>bank statement</span></p>
          <p style={{ marginTop: 14, color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>PDF, JPG, PNG, CSV, Excel or Word</p>
          {msg && (
            <p style={{ fontSize: 12, color: msg.startsWith("Imported") ? primary : "#b91c1c", marginTop: 12, lineHeight: 1.4 }}>
              {msg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConvexUploadStatement() {
  const runtime = useQuery(api.admin.publicConfig, {});
  if (runtime?.maintenanceMode) {
    return (
      <main style={{ minHeight: "100vh", background: "#fff", color: "#0f172a", padding: "16px 18px" }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <h1 style={{ fontSize: 17, fontWeight: 700 }}>Upload unavailable</h1>
          <p style={{ fontSize: 12, color: "#64748b" }}>System is in maintenance mode.</p>
        </div>
      </main>
    );
  }
  return (
    <AppChrome>
      <ConvexUploadStatementInner />
    </AppChrome>
  );
}
