import { apiClient } from "@/lib/api";
import { buildBookkeepingWorkbook } from "@mobile-lib/export/bookkeepingWorkbook";
import { buildTransactionsCsv } from "@mobile-lib/export/exportCsv";
import { exportFileName, type DateFormatId, type ExportTransaction } from "@mobile-lib/export/exportModel";
import { loadExportData } from "@mobile-lib/export/loadExportData";
import { todayLocalYmd } from "@mobile-lib/dates";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Build the styled workbook (or CSV) for these transactions and save it through the browser. */
export async function downloadTransactionsExport(
  format: "xlsx" | "csv",
  rows: ExportTransaction[],
  prefs: { token: string; currency: string; dateFormat: DateFormatId; numberFormat: string; businessName?: string },
): Promise<void> {
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
  const part = format === "xlsx" ? buildBookkeepingWorkbook(rows, opts).bytes : buildTransactionsCsv(rows, opts);
  const blob = new Blob([part as BlobPart], { type: format === "xlsx" ? XLSX_MIME : "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = exportFileName("receipt-cycle-transactions", todayLocalYmd(), format);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
