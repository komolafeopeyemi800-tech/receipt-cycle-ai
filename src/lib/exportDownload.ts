import { apiClient } from "@/lib/api";
import { buildBookkeepingWorkbook } from "@mobile-lib/export/bookkeepingWorkbook";
import { buildTransactionsCsv } from "@mobile-lib/export/exportCsv";
import { buildItemsCsv } from "@mobile-lib/export/itemsCsv";
import { exportFileName, type DateFormatId, type ExportTransaction } from "@mobile-lib/export/exportModel";
import { loadExportData } from "@mobile-lib/export/loadExportData";
import { saveWorkbookToGoogleSheets, type SavedGoogleSheet } from "@mobile-lib/export/googleSheets";
import { todayLocalYmd } from "@mobile-lib/dates";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export type ExportPrefs = { token: string; currency: string; dateFormat: DateFormatId; numberFormat: string; businessName?: string };

async function buildExport(format: "xlsx" | "csv" | "items", rows: ExportTransaction[], prefs: ExportPrefs, prefix: string) {
  const loaded = await loadExportData(apiClient, prefs.token, rows);
  const opts = {
    businessName: prefs.businessName,
    currency: prefs.currency,
    dateFormat: prefs.dateFormat,
    numberFormat: prefs.numberFormat,
    generatedOn: todayLocalYmd(),
    documents: loaded.documents,
    links: loaded.links,
  };
  const part = format === "xlsx" ? buildBookkeepingWorkbook(rows, opts).bytes : format === "items" ? buildItemsCsv(rows, opts) : buildTransactionsCsv(rows, opts);
  return { part, fileName: exportFileName(prefix, todayLocalYmd(), format === "xlsx" ? "xlsx" : "csv") };
}

/** Build the styled workbook (or CSV) for these transactions and save it through the browser. */
export async function downloadTransactionsExport(
  /** "items" is one row per item bought, for tracking prices across receipts. */
  format: "xlsx" | "csv" | "items",
  rows: ExportTransaction[],
  prefs: ExportPrefs,
  prefix = "receipt-cycle-transactions",
): Promise<void> {
  const { part, fileName } = await buildExport(format, rows, prefs, prefix);
  const blob = new Blob([part as BlobPart], { type: format === "xlsx" ? XLSX_MIME : "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Build the same styled workbook and create it as a Google Sheet in the person's Drive (nothing is downloaded). */
export async function saveTransactionsToGoogleSheets(
  accessToken: string,
  rows: ExportTransaction[],
  prefs: ExportPrefs,
  prefix = "receipt-cycle-transactions",
): Promise<SavedGoogleSheet> {
  const { part, fileName } = await buildExport("xlsx", rows, prefs, prefix);
  return saveWorkbookToGoogleSheets(accessToken, part as Uint8Array, fileName);
}
