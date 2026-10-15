import { todayLocalYmd } from "../lib/dates";
import { Alert, Platform } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { api, useQuery } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useSubscriptionState } from "./useSubscriptionState";
import { userFacingErrorFromUnknown } from "../lib/userFacingErrors";

/** Everything needed to download the person's transactions as a spreadsheet. */
export function useCsvExport() {
  const { user, token } = useAuth();
  const sub = useSubscriptionState();
  const runtime = useQuery(api.admin.publicConfig, {});
  const backupRows = useQuery(
    api.transactions.exportForBackup,
    user?.id && token && sub?.canExportCsv ? { userId: user.id, token } : "skip",
  );
  function csvValue(v: unknown): string {
    if (v === null || v === undefined) return "";
    if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";

    // Normalize strings so line breaks / tabs don't break spreadsheet row parsing.
    const raw = String(v)
      .replace(/\r\n/g, " ")
      .replace(/[\r\n\t]/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    const needsQuotes = raw.includes(",") || raw.includes('"') || raw.includes("\n") || raw.includes("\r");
    const escaped = raw.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  }

  function buildCsv(rows: NonNullable<typeof backupRows>) {
    const header = ["date", "type", "category", "amount", "merchant", "description", "payment_method", "workspace", "subtotal", "tax", "currency", "line_items", "evidence_url"].join(",");
    const body = rows
      .map((t: (typeof rows)[number]) => {
        const data = t.receipt_data && typeof t.receipt_data === "object" ? t.receipt_data as { subtotal?: number; tax_amount?: number; currency?: string; items?: unknown[] } : null;
        return [
          csvValue(t.date),
          csvValue(t.type),
          csvValue(t.category),
          csvValue(t.amount),
          csvValue(t.merchant),
          csvValue(t.description),
          csvValue(t.payment_method),
          csvValue(t.workspace),
          csvValue(data?.subtotal),
          csvValue(data?.tax_amount),
          csvValue(data?.currency),
          csvValue(data?.items ? JSON.stringify(data.items) : ""),
          csvValue(t.evidence_url),
        ].join(",");
      })
      .join("\r\n");

    // BOM helps Excel open UTF-8 CSV cleanly.
    return `\uFEFF${header}\r\n${body}`;
  }

  async function exportCsvDownload() {
    if (runtime?.exportEnabled === false) {
      Alert.alert("Export disabled", "Export is currently disabled by admin.");
      return;
    }
    if (sub && !sub.canExportCsv) {
      Alert.alert(
        "Pro export",
        "CSV export is a Pro feature. To review or update your account access, open Receipt Cycle on the web.",
        [
          { text: "OK" },
        ],
      );
      return;
    }
    if (!user?.id) {
      Alert.alert("Export", "Sign in again to export your records.");
      return;
    }
    if (backupRows === undefined) {
      Alert.alert("Export", "Still loading your transactions. Try again in a moment.");
      return;
    }
    const rows = backupRows;
    if (rows.length === 0) {
      Alert.alert("Export", "No transactions to export yet.");
      return;
    }
    const fileName = `receipt-cycle-transactions-${todayLocalYmd()}.csv`;

    try {
      const csv = buildCsv(rows);
      if (Platform.OS === "web") {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
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
      file.write(csv, { encoding: "utf8" });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "text/csv",
          dialogTitle: "Export transactions spreadsheet",
          UTI: "public.comma-separated-values-text",
        });
      }

      Alert.alert(
        "Downloaded",
        canShare
          ? "CSV exported. If you selected Save/Drive/Email in the share sheet, your file is there now."
          : `CSV saved on this device:\n\n${file.uri}\n\nOpen Files / Documents to find the ReceiptCycle/Exports folder.`,
        [
          { text: "Copy path", onPress: () => void Clipboard.setStringAsync(file.uri) },
          { text: "OK" },
        ],
      );
    } catch (e) {
      Alert.alert("Export failed", userFacingErrorFromUnknown(e));
    }
  }

  return { exportCsvDownload, canExport: !(sub && !sub.canExportCsv) && runtime?.exportEnabled !== false, exportDisabledByAdmin: runtime?.exportEnabled === false, rowCount: backupRows?.length };
}
