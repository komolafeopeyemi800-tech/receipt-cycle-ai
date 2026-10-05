import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useAction, useMutation, useQuery } from "@mobile-lib/api";
import { api, type StatementRow } from "@mobile-lib/api";
import { parseStatementCsv } from "@mobile-lib/statementCsv";
import { describeParse, importInChunks } from "@mobile-lib/statementUpload";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useWebAuth } from "@/contexts/WebAuthContext";
import { AppChrome } from "@/components/layout/AppChrome";

const primary = "#0f766e";

function defaultCategory(type: "expense" | "income") {
  return type === "expense" ? "Other" : "Salary";
}

/** Web: statement import (CSV, Excel, PDF, Word). CSV is read in the browser first; everything else is read by the API. */
function ConvexUploadStatementInner() {
  const { workspace, ready } = useWorkspace();
  const { user, token } = useWebAuth();
  const userId = user!.id;
  const runtime = useQuery(api.admin.publicConfig, {});
  const bulkImport = useMutation(api.transactions.bulkImport);
  const ensureCats = useMutation(api.categories.ensureSeed);
  const parseOnServer = useAction(api.uploads.parseStatement);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const runImport = useCallback(
    async (file: File) => {
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
        await ensureCats({ workspace });
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

        // Excel, PDF, Word (or a CSV the local reader could not understand): the API reads the file.
        if (!rows) {
          setMsg("Reading your file…");
          const parsed = await parseOnServer({ file, fileName: file.name });
          if (parsed.status !== "ok") {
            setMsg(parsed.message ?? "Could not read this file.");
            return;
          }
          rows = parsed.rows;
          note = describeParse(parsed);
        }

        const total = rows.length;
        const res = await importInChunks(
          rows,
          (chunk) =>
            bulkImport({ workspace, userId, token, rows: chunk.map((r) => ({ ...r, payment_method: "Import" })) }),
          (done) => setMsg(`Importing… ${done} of ${total}`),
        );
        setMsg(`Imported ${res.inserted} transaction(s).${note ? ` ${note}` : ""}`);
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Import failed");
      } finally {
        setBusy(false);
      }
    },
    [ready, workspace, userId, token, ensureCats, bulkImport, runtime?.maintenanceMode, runtime?.uploadEnabled],
  );

  const onPick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,.xlsx,.ods,.pdf,.docx,.odt,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    input.onchange = () => {
      const f = input.files?.[0];
      if (f) void runImport(f);
    };
    input.click();
  };

  return (
    <div style={{ color: "#0f172a" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <Link to="/" style={{ fontSize: 13, color: primary, fontWeight: 600 }}>
            ← Back
          </Link>
          <Link to="/transactions" style={{ fontSize: 13, color: primary, fontWeight: 600 }}>
            Transactions →
          </Link>
        </div>
        <h1 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px" }}>Upload statement</h1>
        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16, lineHeight: 1.45 }}>
          Upload a bank statement or sales report as Excel (.xlsx), CSV or PDF. Files with Date, Description and
          Amount (or Debit/Credit) columns are read instantly and free. Scanned PDFs need the AI helper.
        </p>
        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 16,
            textAlign: "center",
          }}
        >
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
              borderRadius: 10,
              padding: "10px 18px",
              fontWeight: 700,
              fontSize: 13,
              cursor: busy || !ready ? "not-allowed" : "pointer",
            }}
          >
            {busy ? "Importing…" : "Choose file"}
          </button>
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
