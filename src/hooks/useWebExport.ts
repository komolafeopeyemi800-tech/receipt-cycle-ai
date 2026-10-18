import { useCallback, useState } from "react";
import { api, useQuery } from "@mobile-lib/api";
import type { ExportTransaction } from "@mobile-lib/export/exportModel";
import { GoogleSheetsError, type SavedGoogleSheet } from "@mobile-lib/export/googleSheets";
import { useWebAuth } from "@/contexts/WebAuthContext";
import { useWebPreferences } from "@/contexts/WebPreferencesContext";
import { useSubscriptionState } from "@/hooks/use-subscription-state";
import { downloadTransactionsExport, saveTransactionsToGoogleSheets } from "@/lib/exportDownload";
import { GoogleWebAuthError, requestDriveAccessToken } from "@/lib/googleDriveWeb";

export type ExportAction = "xlsx" | "csv" | "google";

export type ExportErrorCode =
  | "disabled"
  | "pro"
  | "signed_out"
  | "loading"
  | "empty"
  | "nothing_selected"
  | "google_auth"
  | "google_save"
  | "failed";

export type ExportError = { code: ExportErrorCode; message: string };

export type ExportDone = { action: ExportAction; count: number; sheet?: SavedGoogleSheet };

/**
 * Shared by the Transactions page and the Backup & Export page.
 * Enforces the same rules as Settings: admin switch (runtime.exportEnabled) and Pro (subscription.canExportCsv).
 */
export function useWebExport() {
  const { user, token } = useWebAuth();
  const sub = useSubscriptionState();
  const runtime = useQuery(api.admin.publicConfig, {});
  const { currency, dateFormat, numberFormat } = useWebPreferences();
  const backupRows = useQuery(
    api.transactions.exportForBackup,
    user?.id && token && sub?.canExportCsv ? { userId: user.id, token } : "skip",
  ) as ExportTransaction[] | undefined;

  const [busy, setBusy] = useState<ExportAction | null>(null);
  const [error, setError] = useState<ExportError | null>(null);
  const [done, setDone] = useState<ExportDone | null>(null);

  const disabledByAdmin = runtime?.exportEnabled === false;
  const proRequired = Boolean(sub && !sub.canExportCsv);
  const canExport = !disabledByAdmin && !proRequired;

  const reset = useCallback(() => {
    setError(null);
    setDone(null);
  }, []);

  /** `selectedIds` limits the export to those transactions; leave it out to export everything. */
  const run = useCallback(
    async (action: ExportAction, selectedIds?: Set<string>) => {
      setError(null);
      setDone(null);
      const fail = (code: ExportErrorCode, message: string) => {
        setError({ code, message });
      };
      if (disabledByAdmin) return fail("disabled", "Export is currently disabled by admin.");
      if (proRequired) return fail("pro", "Spreadsheet export is included with Pro. Open Pricing to upgrade and export your transactions.");
      if (!user?.id || !token) return fail("signed_out", "Sign in again to export your records.");
      if (backupRows === undefined) return fail("loading", "Still loading your transactions. Try again in a moment.");
      const rows = selectedIds ? backupRows.filter((r) => selectedIds.has(String(r.id))) : backupRows;
      if (selectedIds && rows.length === 0) return fail("nothing_selected", "Select at least one transaction first.");
      if (rows.length === 0) return fail("empty", "No transactions to export yet.");

      const prefs = { token, currency, dateFormat, numberFormat, businessName: (user as { name?: string }).name || undefined };
      const prefix = selectedIds ? "receipt-cycle-selected" : "receipt-cycle-transactions";
      setBusy(action);
      try {
        if (action === "google") {
          // Sign in first, straight from the click, so the browser does not block the Google window.
          let accessToken: string;
          try {
            accessToken = await requestDriveAccessToken();
          } catch (e) {
            if (e instanceof GoogleWebAuthError) return fail("google_auth", e.message);
            throw e;
          }
          const sheet = await saveTransactionsToGoogleSheets(accessToken, rows, prefs, prefix);
          setDone({ action, count: rows.length, sheet });
        } else {
          await downloadTransactionsExport(action, rows, prefs, prefix);
          setDone({ action, count: rows.length });
        }
      } catch (e) {
        if (e instanceof GoogleSheetsError) fail("google_save", e.message);
        else fail("failed", e instanceof Error && e.message ? e.message : "The export could not be created. Please try again.");
      } finally {
        setBusy(null);
      }
    },
    [backupRows, currency, dateFormat, disabledByAdmin, numberFormat, proRequired, token, user],
  );

  return {
    run,
    reset,
    busy,
    error,
    done,
    canExport,
    disabledByAdmin,
    proRequired,
    /** undefined while loading (or for non-Pro accounts, where it is not fetched). */
    rowCount: backupRows?.length,
    loadingRows: canExport && backupRows === undefined,
  };
}
