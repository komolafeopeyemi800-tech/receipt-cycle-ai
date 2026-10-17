import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAction, useMutation, useQuery } from "@mobile-lib/api";
import { api } from "@mobile-lib/api";
import { describeParse, importInChunks } from "@mobile-lib/statementUpload";
import { apiReadDocument, apiStatementTools } from "@mobile-lib/statementParse/apiTools";
import { parseCsvText } from "@mobile-lib/statementParse/csv";
import { readStatement, readStatementPhoto, type ParseResult } from "@mobile-lib/statementParse/pipeline";
import {
  type PreviewRow,
  documentToRow,
  markExistingDuplicates,
  importPayload,
  money,
  previewTotals,
  setFlagged,
  swapDirections,
  toPreviewRows,
  toggleRow,
  updateRow,
} from "@mobile-lib/statementParse/preview";
import { apiClient } from "@/lib/api";
import { loadStatementEngine } from "@/lib/statementReader";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useWebAuth } from "@/contexts/WebAuthContext";
import { AppChrome } from "@/components/layout/AppChrome";

const primary = "#0f766e";
const PAGE = 200;

type Review = { rows: PreviewRow[]; warnings: string[]; note: string; file: File; shown: number };

const cell: React.CSSProperties = { padding: "6px 8px", borderTop: "1px solid #e2e8f0", fontSize: 13, verticalAlign: "middle" };
const input: React.CSSProperties = { border: "1px solid #cbd5e1", borderRadius: 4, padding: "4px 6px", fontSize: 13, width: "100%", boxSizing: "border-box" };
const pill: React.CSSProperties = { border: `1px solid ${primary}`, color: primary, background: "#fff", borderRadius: 16, padding: "5px 12px", fontWeight: 600, fontSize: 12, cursor: "pointer" };

const today = () => new Date().toISOString().slice(0, 10);

/** Web: statement import (CSV, Excel, PDF, Word). Every file is read in the browser, shown for review, and only saved when the person confirms. */
function ConvexUploadStatementInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { workspace, ready } = useWorkspace();
  const { user, token } = useWebAuth();
  const userId = user!.id;
  const runtime = useQuery(api.admin.publicConfig, {});
  const bulkImport = useMutation(api.transactions.bulkImport);
  const uploadReceipt = useMutation(api.receipts.upload);
  const scanText = useAction(api.scanReceipt.scanFromDocumentText);
  const existing = useQuery(api.transactions.list, ready ? { workspace } : "skip");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  /** A photo waiting for the answer to "receipt or invoice, or a bank statement?". */
  const [pendingImage, setPendingImage] = useState<File | null>(null);

  /** Rows to review: transactions the person already has (same date, amount, merchant) start unticked. */
  const buildReview = useCallback(
    (rows: Parameters<typeof toPreviewRows>[0], warnings: string[], note: string, file: File): Review => {
      const marked = markExistingDuplicates(toPreviewRows(rows), (existing ?? []) as never);
      return { rows: marked.rows, warnings: marked.warning ? [...warnings, marked.warning] : warnings, note, file, shown: PAGE };
    },
    [existing],
  );

  const runRead = useCallback(
    async (file: File, imageAs?: "statement" | "receipt") => {
      if (file.type.startsWith("image/")) {
        if (imageAs === "receipt") {
          navigate("/transactions#upload-document", { state: { uploadFile: file } });
          return;
        }
        if (imageAs !== "statement") {
          setPendingImage(file);
          setMsg(null);
          return;
        }
        setPendingImage(null);
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
      setMsg("Reading your file…");
      setReview(null);
      try {
        // A photo of a bank or card statement: read by text recognition, shown only when it adds up to the printed balances.
        if (file.type.startsWith("image/")) {
          if (!/^image\/(png|jpeg)$/.test(file.type)) {
            setMsg("Statement photos need to be JPG or PNG.");
            return;
          }
          setMsg("Reading your statement. This can take up to 30 seconds.");
          const photo = await readStatementPhoto(new Uint8Array(await file.arrayBuffer()), file.type, apiStatementTools(apiClient).ai);
          if (photo.status !== "ok") {
            setMsg(photo.message ?? "We could not read this scan reliably. Upload a clearer scan or a CSV or Excel version.");
            return;
          }
          setReview(buildReview(photo.rows, photo.warnings, "", file));
          setMsg(null);
          return;
        }
        const name = file.name.toLowerCase();
        let parsed: ParseResult | null = null;
        let note = "";

        // CSV: the quick reader first (instant, works offline); the full reader (with AI column help) only if it fails.
        if (name.endsWith(".csv") || file.type.includes("csv")) {
          const local = await parseCsvText(await file.text());
          if (local.status === "ok") parsed = local;
        }

        // Excel, PDF, Word (or a CSV the quick reader could not understand): read in the browser with anydoc.
        if (!parsed) {
          const engine = await loadStatementEngine();
          const tools = apiStatementTools(apiClient);
          const read = await readStatement(new Uint8Array(await file.arrayBuffer()), {
            fileName: file.name,
            engine,
            ai: tools.ai,
            cache: tools.cache,
          });
          parsed = read;
          note = describeParse(read);
        }

        // An invoice or bill PDF is one transaction: read its total rather than hunting for statement rows.
        if (parsed.status === "document" && parsed.documentText) {
          setMsg(`This looks like ${parsed.documentKind === "receipt" ? "a receipt" : "an invoice"}. Reading its total and line items…`);
          let extracted: unknown = null;
          let problem: string | undefined;
          try {
            // Azure reads the invoice number, due date, PO, terms and every line item.
            extracted = await apiReadDocument(apiClient)(new Uint8Array(await file.arrayBuffer()), { kind: parsed.documentKind ?? "invoice", mimeType: "application/pdf" });
          } catch {
            const out = (await scanText({ text: parsed.documentText.slice(0, 40000), sessionToken: token })) as { extracted_data?: unknown; error?: string };
            problem = out.error;
            const data = out.extracted_data as Record<string, unknown> | null | undefined;
            extracted = data && "data" in data && data.data ? data.data : data;
          }
          const doc = documentToRow(extracted as never, today());
          if (!doc) {
            setMsg(problem ?? "Could not read a total from this invoice. Add it manually, or upload a clear photo of it.");
            return;
          }
          setReview(buildReview([doc.row], ["Read as one transaction (the document total). Its details and line items are saved in the note. Check the amount and date.", ...doc.warnings], note, file));
          setMsg(null);
          return;
        }

        // A scanned receipt or invoice PDF is not a statement: when the statement read is refused, try it as a document.
        if (parsed.status !== "ok" && parsed.fileType === "pdf" && parsed.needsOcr) {
          setMsg("Not a statement we can check. Trying it as a receipt or invoice…");
          try {
            const extracted = await apiReadDocument(apiClient)(new Uint8Array(await file.arrayBuffer()), { kind: "auto", mimeType: "application/pdf", pageCount: parsed.needsOcr.pageCount });
            const doc = documentToRow(extracted as never, today());
            if (doc) {
              setReview(buildReview([doc.row], ["Read as one transaction (the document total). Check the amount and date.", ...doc.warnings], note, file));
              setMsg(null);
              return;
            }
          } catch {
            /* keep the statement refusal message below */
          }
        }

        if (parsed.status !== "ok") {
          setMsg(parsed.message ?? "Could not read this file.");
          return;
        }
        setReview(buildReview(parsed.rows, parsed.warnings, note, file));
        setMsg(null);
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Could not read this file.");
      } finally {
        setBusy(false);
      }
    },
    [ready, token, runtime?.maintenanceMode, runtime?.uploadEnabled, navigate, scanText, buildReview],
  );

  const runImport = useCallback(async () => {
    if (!review || !token) return;
    const rows = importPayload(review.rows);
    if (rows.length === 0) {
      setMsg("Tick at least one transaction to import.");
      return;
    }
    setBusy(true);
    try {
      const total = rows.length;
      const evidenceKey = (await uploadReceipt({ file: review.file, fileName: review.file.name })).key;
      const res = await importInChunks(
        rows,
        (chunk) =>
          bulkImport({ workspace, userId, token, receipt_url: evidenceKey, rows: chunk.map((r) => ({ ...r, payment_method: "Import" })) }),
        (done) => setMsg(`Importing… ${done} of ${total}`),
      );
      setMsg(`Imported ${res.inserted} transaction(s).`);
      setReview(null);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }, [review, token, workspace, userId, bulkImport, uploadReceipt]);

  // A file chosen on the Transactions page arrives here in the router state: start reading it straight away.
  const started = useRef(false);
  useEffect(() => {
    const incoming = (location.state as { uploadFile?: File } | null)?.uploadFile;
    if (!incoming || started.current || !ready || !token) return;
    started.current = true;
    void runRead(incoming);
  }, [location.state, ready, token, runRead]);

  const onPick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".jpg,.jpeg,.png,.webp,.csv,.xlsx,.xls,.ods,.pdf,.docx,.odt,image/*,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    input.onchange = () => {
      const f = input.files?.[0];
      if (f) void runRead(f);
    };
    input.click();
  };

  const totals = review ? previewTotals(review.rows) : null;
  const update = (rows: PreviewRow[]) => review && setReview({ ...review, rows });
  const transfersOn = !!review?.rows.some((r) => r.transfer && r.selected);

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

        {pendingImage && !review ? (
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 20, background: "#fff", textAlign: "center" }}>
            <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800 }}>What is this photo?</h2>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "#475569" }}>{pendingImage.name}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button type="button" style={{ ...pill, background: primary, color: "#fff" }} onClick={() => void runRead(pendingImage, "receipt")}>
                Receipt or invoice
              </button>
              <button type="button" style={pill} onClick={() => void runRead(pendingImage, "statement")}>
                Bank or card statement
              </button>
              <button type="button" style={pill} onClick={() => setPendingImage(null)}>
                Choose a different file
              </button>
            </div>
          </div>
        ) : null}

        {review && totals ? (
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 16, background: "#fff" }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
              {totals.total} transaction{totals.total === 1 ? "" : "s"} found in {review.file.name}
            </h2>
            <p style={{ margin: "4px 0 10px", fontSize: 13, color: "#475569" }}>
              {totals.selected} selected · Money in {money(totals.moneyIn)} · Money out {money(totals.moneyOut)}. Nothing is saved until you press Import.
            </p>
            {[review.note, ...review.warnings].filter(Boolean).map((w, i) => (
              <p key={i} style={{ margin: "0 0 6px", fontSize: 12, color: "#78350f", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 6, padding: "6px 8px" }}>
                {w}
              </p>
            ))}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0" }}>
              <button type="button" style={pill} onClick={() => update(swapDirections(review.rows))}>
                Swap money in / out
              </button>
              {totals.transfers > 0 && (
                <button type="button" style={pill} onClick={() => update(setFlagged(review.rows, "transfer", !transfersOn))}>
                  {transfersOn ? "Skip" : "Include"} {totals.transfers} transfer{totals.transfers === 1 ? "" : "s"}
                </button>
              )}
              <button type="button" style={pill} onClick={() => { setReview(null); setMsg(null); }}>
                Choose a different file
              </button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                <thead>
                  <tr style={{ textAlign: "left", fontSize: 12, color: "#64748b" }}>
                    <th style={{ ...cell, borderTop: "none", width: 32 }} />
                    <th style={{ ...cell, borderTop: "none", width: 120 }}>Date</th>
                    <th style={{ ...cell, borderTop: "none" }}>Description</th>
                    <th style={{ ...cell, borderTop: "none", width: 110 }}>Amount</th>
                    <th style={{ ...cell, borderTop: "none", width: 110 }}>Type</th>
                    <th style={{ ...cell, borderTop: "none", width: 130 }}>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {review.rows.slice(0, review.shown).map((r) => (
                    <tr key={r.id} style={{ opacity: r.selected ? 1 : 0.5 }}>
                      <td style={cell}>
                        <input type="checkbox" checked={r.selected} aria-label={`Include ${r.merchant ?? "transaction"}`} onChange={() => update(toggleRow(review.rows, r.id))} />
                      </td>
                      <td style={cell}>
                        <input style={input} value={r.date} onChange={(e) => update(updateRow(review.rows, r.id, { date: e.target.value }))} aria-label="Date (YYYY-MM-DD)" />
                      </td>
                      <td style={cell}>
                        <input style={input} value={r.merchant ?? ""} onChange={(e) => update(updateRow(review.rows, r.id, { merchant: e.target.value }))} aria-label="Description" />
                      </td>
                      <td style={cell}>
                        <input
                          style={input}
                          defaultValue={String(r.amount)}
                          inputMode="decimal"
                          aria-label="Amount"
                          onBlur={(e) => {
                            const n = Number(e.target.value.replace(/[$,]/g, ""));
                            if (Number.isFinite(n) && n > 0) update(updateRow(review.rows, r.id, { amount: Math.round(n * 100) / 100 }));
                            else e.target.value = String(r.amount);
                          }}
                        />
                      </td>
                      <td style={cell}>
                        <select style={input} value={r.type} onChange={(e) => update(updateRow(review.rows, r.id, { type: e.target.value === "income" ? "income" : "expense" }))} aria-label="Money in or out">
                          <option value="expense">Money out</option>
                          <option value="income">Money in</option>
                        </select>
                      </td>
                      <td style={{ ...cell, fontSize: 12, color: "#b45309" }}>
                        {r.transfer ? "Transfer" : ""}
                        {r.duplicate ? "Possible duplicate" : ""}
                        {r.future ? "Check the date" : ""}
                        {r.existing ? "Already in your records" : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {review.shown < review.rows.length && (
              <button type="button" style={{ ...pill, marginTop: 8 }} onClick={() => setReview({ ...review, shown: review.shown + PAGE })}>
                Show more ({review.rows.length - review.shown} left)
              </button>
            )}
            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                onClick={() => void runImport()}
                disabled={busy || totals.selected === 0}
                style={{ background: busy || totals.selected === 0 ? "#94a3b8" : primary, color: "#fff", border: "none", borderRadius: 6, padding: "12px 22px", fontWeight: 700, fontSize: 14, cursor: busy ? "not-allowed" : "pointer" }}
              >
                {busy ? "Importing…" : `Import ${totals.selected} transaction${totals.selected === 1 ? "" : "s"}`}
              </button>
            </div>
            {msg && <p style={{ fontSize: 12, color: "#b91c1c", marginTop: 10 }}>{msg}</p>}
          </div>
        ) : pendingImage ? null : (
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const file = event.dataTransfer.files?.[0];
              if (file) void runRead(file);
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
              {busy ? "Reading…" : "Choose file"}
            </button>
            <p style={{ marginTop: 22, color: "#64748b", fontSize: 14 }}>Upload any <span style={{ color: "#2563eb", background: "#eff6ff", padding: "4px 8px", borderRadius: 5 }}>receipt</span> · <span style={{ color: "#7c3aed", background: "#f5f3ff", padding: "4px 8px", borderRadius: 5 }}>invoice</span> · <span style={{ color: "#c2410c", background: "#fff7ed", padding: "4px 8px", borderRadius: 5 }}>credit card statement</span> or <span style={{ color: "#047857", background: "#ecfdf5", padding: "4px 8px", borderRadius: 5 }}>bank statement</span></p>
            <p style={{ marginTop: 14, color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>PDF, JPG, PNG, CSV, Excel or Word</p>
            {msg && (
              <p style={{ fontSize: 12, color: msg.startsWith("Imported") ? primary : msg.endsWith("…") ? "#475569" : "#b91c1c", marginTop: 12, lineHeight: 1.4 }}>
                {msg}
              </p>
            )}
          </div>
        )}
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
