import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { parseLooseStatementText, parseStatementCsv } from "@mobile-lib/statementCsv";
import { extractTextFromPdfArrayBuffer } from "@mobile-lib/pdfText";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useWebAuth } from "@/contexts/WebAuthContext";
import { AppChrome } from "@/components/layout/AppChrome";

const primary = "#0f766e";

function defaultCategory(type: "expense" | "income") {
  return type === "expense" ? "Other" : "Salary";
}

/** Web: CSV/PDF statement import into the shared ledger (aligned with the mobile app). */
function ConvexUploadStatementInner() {
  const { workspace, ready } = useWorkspace();
  const { user } = useWebAuth();
  const userId = user!.id;
  const runtime = useQuery(api.admin.publicConfig, {});
  const bulkImport = useMutation(api.transactions.bulkImport);
  const ensureCats = useMutation(api.categories.ensureSeed);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const runImport = useCallback(
    async (file: File) => {
      if (!ready) {
        setMsg("Workspace loading…");
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
        const isPdf = name.endsWith(".pdf") || file.type === "application/pdf";

        let parsed;
        if (isPdf) {
          let pdfText: string;
          try {
            const ab = await file.arrayBuffer();
            pdfText = await extractTextFromPdfArrayBuffer(ab);
          } catch (e) {
            setMsg(e instanceof Error ? e.message : "Could not read PDF. Try CSV export.");
            return;
          }
          parsed = parseLooseStatementText(pdfText);
        } else {
          const text = await file.text();
          parsed = parseStatementCsv(text);
        }

        if (!parsed.ok) {
          setMsg(parsed.error);
          return;
        }

        const rows = parsed.rows.map((r) => ({
          amount: r.amount,
          type: r.type,
          category: defaultCategory(r.type),
          date: r.date,
          merchant: r.merchant,
          description: r.description,
          payment_method: "Import",
        }));

        const res = await bulkImport({ workspace, userId, rows });

        const w = parsed.warnings.join(" ");
        setMsg(
          `Imported ${res.inserted} transaction(s).${res.truncated ? " (file was truncated to limit)" : ""}${w ? ` ${w}` : ""}`,
        );
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Import failed");
      } finally {
        setBusy(false);
      }
    },
    [ready, workspace, userId, ensureCats, bulkImport, runtime?.maintenanceMode, runtime?.uploadEnabled],
  );

  const onPick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,.pdf,application/pdf,text/csv,application/csv";
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
          CSV exports work best (columns: Date, Amount or Debit/Credit, Description). PDFs use text extraction and are
          best-effort — review on the Transactions page.
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
