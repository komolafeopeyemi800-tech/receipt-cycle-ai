import { todayLocalYmd } from "../lib/dates";
import { Alert, Platform } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { api, useQuery } from "../lib/api";
import { apiClient } from "../lib/apiClient";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useSubscriptionState } from "./useSubscriptionState";
import { userFacingErrorFromUnknown } from "../lib/userFacingErrors";
import { buildBookkeepingWorkbook } from "../lib/export/bookkeepingWorkbook";
import { buildTransactionsCsv } from "../lib/export/exportCsv";
import { exportFileName, type ExportTransaction } from "../lib/export/exportModel";
import { loadExportData } from "../lib/export/loadExportData";
import { saveWorkbookToGoogleSheets, GoogleSheetsError, type SavedGoogleSheet } from "../lib/export/googleSheets";
import { getStoredRefreshToken } from "../lib/driveBackupStorage";
import { getAccessTokenFromRefresh } from "../lib/performDriveBackup";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Everything needed to download the person's transactions as a styled Excel workbook (or CSV). */
export function useCsvExport(options: { loadAll?: boolean } = {}) {
  const { user, token } = useAuth();
  const sub = useSubscriptionState();
  const prefs = usePreferences();
  const runtime = useQuery(api.admin.publicConfig, {});
  const backupRows = useQuery(
    api.transactions.exportForBackup,
    options.loadAll !== false && user?.id && token && sub?.canExportCsv ? { userId: user.id, token } : "skip",
  );

  /** Shared entitlement checks. Returns false (after telling the person why) when export is not allowed. */
  function allowed(): boolean {
    if (runtime?.exportEnabled === false) {
      Alert.alert("Export disabled", "Export is currently disabled by admin.");
      return false;
    }
    if (sub && !sub.canExportCsv) {
      Alert.alert("Pro export", "Spreadsheet export is a Pro feature. To review or update your account access, open Receipt Cycle on the web.", [{ text: "OK" }]);
      return false;
    }
    if (!user?.id || !token) {
      Alert.alert("Export", "Sign in again to export your records.");
      return false;
    }
    return true;
  }

  /** Load receipt links and build the report options. Shared by the file export and Save to Google Sheets. */
  async function buildOptions(rows: ExportTransaction[], authToken: string) {
    const loaded = await loadExportData(apiClient, authToken, rows);
    return {
      businessName: (user as { name?: string } | null)?.name || undefined,
      currency: prefs.currency,
      dateFormat: prefs.dateFormat,
      numberFormat: prefs.numberFormat,
      generatedOn: todayLocalYmd(),
      documents: loaded.documents,
      links: loaded.links,
    };
  }

  /** Build and share a file for `rows` (default: all transactions). */
  async function run(format: "xlsx" | "csv", rows: ExportTransaction[], prefix: string) {
    if (!token) return;
    const fileName = exportFileName(prefix, todayLocalYmd(), format);
    try {
      const opts = await buildOptions(rows, token);
      const bytes = format === "xlsx" ? buildBookkeepingWorkbook(rows, opts).bytes : null;
      const csv = format === "csv" ? buildTransactionsCsv(rows, opts) : null;
      const mime = format === "xlsx" ? XLSX_MIME : "text/csv";

      if (Platform.OS === "web") {
        const blob = new Blob([(bytes ?? csv) as BlobPart], { type: mime });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
        Alert.alert("Exported", "Spreadsheet downloaded to your laptop.");
        return;
      }

      const dir = new Directory(Paths.document, "ReceiptCycle", "Exports");
      if (!dir.exists) dir.create({ intermediates: true });
      const file = new File(dir, fileName);
      if (!file.exists) file.create({ overwrite: true });
      if (bytes) file.write(bytes);
      else file.write(csv as string, { encoding: "utf8" });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: mime,
          dialogTitle: "Export transactions spreadsheet",
          UTI: format === "xlsx" ? "org.openxmlformats.spreadsheetml.sheet" : "public.comma-separated-values-text",
        });
      }
      Alert.alert(
        "Downloaded",
        canShare
          ? `${format === "xlsx" ? "Excel workbook" : "CSV"} exported. If you selected Save/Drive/Email in the share sheet, your file is there now.`
          : `File saved on this device:\n\n${file.uri}\n\nOpen Files / Documents to find the ReceiptCycle/Exports folder.`,
        [{ text: "Copy path", onPress: () => void Clipboard.setStringAsync(file.uri) }, { text: "OK" }],
      );
    } catch (e) {
      Alert.alert("Export failed", userFacingErrorFromUnknown(e));
    }
  }

  async function exportAll(format: "xlsx" | "csv") {
    if (!allowed()) return;
    if (backupRows === undefined) {
      Alert.alert("Export", "Still loading your transactions. Try again in a moment.");
      return;
    }
    if (backupRows.length === 0) {
      Alert.alert("Export", "No transactions to export yet.");
      return;
    }
    await run(format, backupRows as ExportTransaction[], "receipt-cycle-transactions");
  }

  /**
   * Save the Excel report into the person's Google Drive as a Google Sheet, using the Drive link made on the
   * Google Drive backup screen. Returns "not_linked" (nothing done) when Drive has not been linked yet.
   */
  async function saveAllToGoogleSheets(): Promise<{ status: "saved"; sheet: SavedGoogleSheet } | { status: "not_linked" } | { status: "failed" }> {
    if (!allowed()) return { status: "failed" };
    if (backupRows === undefined) {
      Alert.alert("Export", "Still loading your transactions. Try again in a moment.");
      return { status: "failed" };
    }
    if (backupRows.length === 0) {
      Alert.alert("Export", "No transactions to export yet.");
      return { status: "failed" };
    }
    const refresh = await getStoredRefreshToken();
    if (!refresh || !token) return { status: "not_linked" };
    try {
      const rows = backupRows as ExportTransaction[];
      const accessToken = await getAccessTokenFromRefresh(refresh);
      const opts = await buildOptions(rows, token);
      const bytes = buildBookkeepingWorkbook(rows, opts).bytes;
      const fileName = exportFileName("receipt-cycle-transactions", todayLocalYmd(), "xlsx");
      const sheet = await saveWorkbookToGoogleSheets(accessToken, bytes, fileName, { mode: "copy" });
      return { status: "saved", sheet };
    } catch (e) {
      const message = e instanceof GoogleSheetsError ? e.message : userFacingErrorFromUnknown(e);
      Alert.alert("Could not save to Google", message);
      return { status: "failed" };
    }
  }

  /** Export only these rows (used by "Download" on selected transactions). */
  async function exportRows(rows: ExportTransaction[], format: "xlsx" | "csv" = "xlsx") {
    if (!allowed()) return;
    if (!rows.length) return;
    await run(format, rows, "receipt-cycle-selected");
  }

  return {
    exportXlsxDownload: () => exportAll("xlsx"),
    /** Secondary option: plain CSV (now with a document link column). */
    exportCsvDownload: () => exportAll("csv"),
    exportRows,
    saveAllToGoogleSheets,
    canExport: !(sub && !sub.canExportCsv) && runtime?.exportEnabled !== false,
    exportDisabledByAdmin: runtime?.exportEnabled === false,
    rowCount: backupRows?.length,
  };
}
