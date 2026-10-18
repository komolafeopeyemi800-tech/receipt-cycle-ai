import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, useQuery } from "@mobile-lib/api";
import type { Transaction } from "@/types/transaction";
import { AppChrome } from "@/components/layout/AppChrome";
import { Surface, WorkspaceHeader } from "@/components/workspace/DesktopWorkspaceUI";
import { useWebAuth } from "@/contexts/WebAuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useWebExport, type ExportAction } from "@/hooks/useWebExport";
import { isGoogleSaveConfigured, preloadGoogleIdentity } from "@/lib/googleDriveWeb";

function when(d: Date) {
  return `${d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}, ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

function BackupExportInner() {
  const { user, token } = useWebAuth();
  const { workspace, ready } = useWorkspace();
  const exp = useWebExport();
  const googleConfigured = isGoogleSaveConfigured();

  // Any answer from the server means the account is reachable and everything saved is stored there.
  const reachable = useQuery(api.notifications.preferences, token ? { token } : "skip");
  const records = useQuery(api.transactions.list, ready && user ? { workspace, userId: user.id } : "skip") as Transaction[] | undefined;
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  useEffect(() => {
    if (reachable && !checkedAt) setCheckedAt(new Date());
  }, [reachable, checkedAt]);
  useEffect(() => {
    if (googleConfigured) void preloadGoogleIdentity().catch(() => undefined);
  }, [googleConfigured]);

  const online = Boolean(checkedAt);
  const count = records?.length ?? exp.rowCount;
  const blocked = exp.disabledByAdmin || exp.proRequired;
  const busy = exp.busy !== null;

  function start(action: ExportAction) {
    if (exp.proRequired) window.dispatchEvent(new Event("receipt-cycle:open-pricing"));
    void exp.run(action);
  }

  const cards: { action: ExportAction; icon: string; title: string; text: string; cta: string; badge?: string }[] = [
    {
      action: "xlsx",
      icon: "fa-file-excel",
      title: "Download Excel report",
      text: "A colour-styled workbook with totals, by category, by month, by week and by day, then every transaction with a link to its receipt or document.",
      cta: "Download Excel report",
      badge: "Recommended",
    },
    {
      action: "csv",
      icon: "fa-file-csv",
      title: "Download CSV",
      text: "A plain table of your transactions that opens in any spreadsheet or accounting tool.",
      cta: "Download CSV",
    },
    {
      action: "google",
      icon: "fa-brands fa-google-drive",
      title: "Save to Google",
      text: "Sign in with Google and the report is saved straight into your own Google Drive as a Google Sheet. Nothing is downloaded to this device.",
      cta: "Save to Google Sheets",
    },
  ];

  return (
    <div className="min-h-full text-slate-900">
      <WorkspaceHeader
        eyebrow="Your data"
        title="Backup & Export"
        description="See that your records are safe, and take a copy whenever you like."
      />

      <div
        role="status"
        className={`mb-5 flex items-start gap-3 rounded-md border p-4 text-sm ${
          online ? "border-teal-200 bg-teal-50 text-teal-900" : "border-slate-200 bg-slate-50 text-slate-600"
        }`}
      >
        <i className={`fas ${online ? "fa-circle-check text-teal-700" : "fa-spinner fa-spin text-slate-500"} mt-0.5`} aria-hidden />
        <div>
          <p className="font-bold">
            {online ? "Your records are backed up and synchronized to your Receipt Cycle account." : "Checking your backup..."}
          </p>
          {checkedAt ? (
            <p className="mt-1 text-xs">
              Last synced: {when(checkedAt)}
              {typeof count === "number" ? ` · ${count.toLocaleString()} ${count === 1 ? "record" : "records"}` : ""}
            </p>
          ) : null}
        </div>
      </div>

      {exp.disabledByAdmin ? (
        <p className="mb-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Export is currently disabled by admin. Your backup above stays on.</p>
      ) : exp.proRequired ? (
        <p className="mb-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Spreadsheet export is included with Pro.{" "}
          <button type="button" className="font-bold underline" onClick={() => window.dispatchEvent(new Event("receipt-cycle:open-pricing"))}>
            See plans
          </button>
          . Your backup above is on for everyone.
        </p>
      ) : count === 0 ? (
        <p className="mb-5 rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">
          No records yet. <Link to="/transactions" className="font-bold text-teal-700 underline">Add a transaction</Link> and then you can export it.
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => {
          const isGoogle = c.action === "google";
          const unavailable = blocked || (isGoogle && !googleConfigured);
          const working = exp.busy === c.action;
          const result = exp.done?.action === c.action ? exp.done : null;
          return (
            <Surface key={c.action} className="flex flex-col p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-50 text-lg text-teal-700">
                  <i className={`fas ${c.icon}`} aria-hidden />
                </span>
                <h2 className="text-base font-extrabold text-slate-900">{c.title}</h2>
              </div>
              {c.badge ? <p className="mt-2 inline-block self-start rounded-full bg-teal-700 px-2 py-0.5 text-[11px] font-bold text-white">{c.badge}</p> : null}
              <p className="mt-3 flex-1 text-sm text-slate-600">{c.text}</p>
              {isGoogle && !googleConfigured ? (
                <p className="mt-2 text-xs text-slate-500">Saving to Google is not set up for this site yet.</p>
              ) : null}
              <button
                type="button"
                disabled={unavailable || busy}
                onClick={() => start(c.action)}
                className={`mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[5px] px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${
                  c.badge ? "bg-teal-700 text-white hover:bg-teal-800" : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                }`}
              >
                <i className={`fas ${working ? "fa-spinner fa-spin" : isGoogle ? "fa-cloud-arrow-up" : "fa-download"}`} aria-hidden />
                {working ? (isGoogle ? "Saving..." : "Preparing...") : c.cta}
              </button>
              {result ? (
                <p role="status" className="mt-3 text-sm font-semibold text-teal-800">
                  {result.sheet ? (
                    <>
                      Saved to your Google Drive.{" "}
                      <a href={result.sheet.webViewLink} target="_blank" rel="noopener noreferrer" className="underline">
                        Open in Google Sheets
                      </a>
                    </>
                  ) : (
                    `Downloaded ${result.count.toLocaleString()} ${result.count === 1 ? "record" : "records"}.`
                  )}
                </p>
              ) : null}
            </Surface>
          );
        })}
      </div>

      {exp.error ? (
        <p role="alert" className="mt-5 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          {exp.error.message}
          {exp.error.code === "pro" ? (
            <>
              {" "}
              <button type="button" className="font-bold underline" onClick={() => window.dispatchEvent(new Event("receipt-cycle:open-pricing"))}>
                See plans
              </button>
            </>
          ) : null}
        </p>
      ) : null}

      <p className="mt-6 text-xs text-slate-500">
        Save to Google creates the file in your own Google Drive with a limited permission that only covers files created by Receipt Cycle. We do not keep your Google access.
        {" "}
        <Link to="/settings" className="font-semibold text-teal-700 underline">Back to settings</Link>
      </p>
    </div>
  );
}

export default function BackupExport() {
  return (
    <AppChrome>
      <BackupExportInner />
    </AppChrome>
  );
}
