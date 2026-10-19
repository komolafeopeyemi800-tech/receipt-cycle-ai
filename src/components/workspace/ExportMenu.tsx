import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useWebExport, type ExportAction } from "@/hooks/useWebExport";
import { preloadGoogleIdentity } from "@/lib/googleDriveWeb";

const LABEL: Record<ExportAction, string> = {
  xlsx: "Excel report",
  csv: "CSV",
  google: "Save to Google Sheets",
};
const ICON: Record<ExportAction, string> = {
  xlsx: "fa-file-excel",
  csv: "fa-file-csv",
  google: "fa-brands fa-google-drive",
};

/**
 * Export menu for the Transactions page: the styled Excel report, plain CSV, or save straight to Google Sheets,
 * for the selected rows or for every record.
 */
export function ExportMenu({ selectedIds }: { selectedIds: Set<string> }) {
  const exp = useWebExport();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const hasSelection = selectedIds.size > 0;

  useEffect(() => {
    if (!open) return;
    void preloadGoogleIdentity().catch(() => undefined);
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(action: ExportAction, scope: "selected" | "all") {
    setOpen(false);
    if (exp.proRequired) window.dispatchEvent(new Event("receipt-cycle:open-pricing"));
    void exp.run(action, scope === "selected" ? selectedIds : undefined);
  }

  const busy = exp.busy !== null;
  const item = "flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left sm:min-h-0 sm:py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none disabled:opacity-50";
  const group = (scope: "selected" | "all") => (
    <div role="group" aria-label={scope === "selected" ? `Selected transactions (${selectedIds.size})` : "All transactions"}>
      <p className="px-4 pb-1 pt-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
        {scope === "selected" ? `Selected (${selectedIds.size})` : "All records"}
      </p>
      {(["xlsx", "csv", "google"] as const).map((a) => (
        <button
          key={a}
          type="button"
          role="menuitem"
          disabled={scope === "selected" && !hasSelection}
          onClick={() => choose(a, scope)}
          className={item}
        >
          <i className={`fas ${ICON[a]} w-5 text-center text-teal-700`} aria-hidden />
          <span>{LABEL[a]}{a === "xlsx" ? " (recommended)" : ""}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-2 rounded-[5px] border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
      >
        <i className={`fas ${busy ? "fa-spinner fa-spin" : "fa-download"}`} aria-hidden />
        {busy ? "Working..." : "Export"}
        <i className="fas fa-chevron-down text-[10px]" aria-hidden />
      </button>
      {open ? (
        <>
        {/* On a phone the menu is a sheet at the bottom of the screen, so it can never run off the edge. */}
        <div className="fixed inset-0 z-20 bg-slate-900/40 sm:hidden" aria-hidden onClick={() => setOpen(false)} />
        <div role="menu" aria-label="Export transactions" className="fixed inset-x-3 bottom-3 z-30 max-h-[80dvh] overflow-y-auto border border-slate-200 bg-white pb-1 shadow-lg sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:mt-2 sm:max-h-none sm:w-80">
          {hasSelection ? group("selected") : null}
          {group("all")}
          <div className="mt-1 border-t border-slate-100 px-4 py-2.5">
            <Link to="/backup-export" onClick={() => setOpen(false)} className="text-xs font-bold text-teal-700 underline-offset-2 hover:underline">
              Backup &amp; Export page
            </Link>
          </div>
        </div>
        </>
      ) : null}

      {exp.error || exp.done ? (
        <div
          role={exp.error ? "alert" : "status"}
          className={`fixed bottom-4 left-4 right-4 z-50 rounded-md border p-4 text-sm shadow-lg sm:left-auto sm:max-w-sm ${
            exp.error ? "border-rose-200 bg-rose-50 text-rose-900" : "border-teal-200 bg-teal-50 text-teal-900"
          }`}
        >
          <div className="flex items-start gap-3">
            <p className="flex-1">
              {exp.error
                ? exp.error.message
                : exp.done?.sheet
                  ? `Saved ${exp.done.count} records to your Google Drive as a Google Sheet.`
                  : `Downloaded ${exp.done?.count} records.`}
              {exp.done?.sheet ? (
                <>
                  {" "}
                  <a href={exp.done.sheet.webViewLink} target="_blank" rel="noopener noreferrer" className="font-bold underline">
                    Open in Google Sheets
                  </a>
                </>
              ) : null}
            </p>
            <button type="button" onClick={exp.reset} aria-label="Dismiss message" className="font-bold">
              <i className="fas fa-xmark" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
