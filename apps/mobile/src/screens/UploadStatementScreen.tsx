import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FontAwesome5 } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useAction, useApiClient, useMutation, useQuery } from "../lib/api";
import { api } from "../lib/api";
import { colors, type as typeScale } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useAuth } from "../contexts/AuthContext";
import { useSubscriptionState } from "../hooks/useSubscriptionState";
import { apiReadDocument, apiStatementTools } from "../lib/statementParse/apiTools";
import { decodeText, parseCsvText } from "../lib/statementParse/csv";
import { parseDate } from "../lib/statementParse/normalize";
import { parseXlsxBytes } from "../lib/statementParse/xlsx";
import { FILE_TOO_BIG, MAX_FILE_BYTES, PHOTO_LONG_EDGE, SCAN_UNRELIABLE, readPdfOnServer, readStatementPhoto } from "../lib/statementParse/pipeline";
import { receiptDocument, statementDocument, storeOriginal } from "../lib/statementParse/original";
import type { DocKind, DocMeta } from "../lib/statementParse/docMeta";
import {
  type PreviewRow,
  importPayload,
  markExistingDuplicates,
  money,
  previewTotals,
  setFlagged,
  setRowType,
  swapDirections,
  toPreviewRows,
  toggleRow,
  updateRow,
} from "../lib/statementParse/preview";
import { importInChunks } from "../lib/statementUpload";
import { userFacingError, userFacingErrorFromUnknown } from "../lib/userFacingErrors";
import type { ScannedExtracted } from "../types/transaction";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Picked = {
  uri: string;
  name: string;
  mime: string;
  /** "statement" = Excel, PDF or Word: imported from the web app (phones cannot run the reader). */
  kind: "image" | "csv" | "xlsx" | "pdf" | "statement";
};

/** What a photo or PDF is: a statement (many rows, read by text recognition) or a receipt / invoice (one transaction). */
type Intent = "statement" | "receipt" | "invoice";

export const STATEMENT_WAIT = "Reading your statement. This can take up to 30 seconds.";
export const DOCUMENT_WAIT = "Reading your document. This can take up to 30 seconds.";

const PREVIEW_PAGE = 100;

/** A big camera photo, brought to about 2000 px on its long edge (faster upload, fits the 10 MB limit). Small photos are left alone. */
async function shrinkPhoto(uri: string): Promise<string> {
  try {
    const info = await ImageManipulator.manipulateAsync(uri, [], {});
    if (Math.max(info.width, info.height) <= 2400) return uri;
    const resize = info.width >= info.height ? { width: PHOTO_LONG_EDGE } : { height: PHOTO_LONG_EDGE };
    return (await ImageManipulator.manipulateAsync(uri, [{ resize }], { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG })).uri;
  } catch {
    return uri;
  }
}

/** Images are scanned; CSV, Excel, PDF and Word are read as statements. */
function classify(name: string, mime: string): "image" | "csv" | "xlsx" | "pdf" | "statement" | null {
  const n = name.toLowerCase();
  if (n.match(/\.(jpg|jpeg|png|webp|heic)$/i) || mime.startsWith("image/")) return "image";
  if (n.endsWith(".csv") || mime.includes("csv")) return "csv";
  if (n.endsWith(".pdf") || mime === "application/pdf") return "pdf";
  if (n.match(/\.(xlsx|xls|ods)$/i) || mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || mime === "application/vnd.ms-excel" || mime === "application/vnd.oasis.opendocument.spreadsheet") return "xlsx";
  if (n.match(/\.(xlsx|xls|xlsb|ods|pdf|docx|odt)$/i) || mime === "application/pdf" || mime.includes("spreadsheet") || mime.includes("wordprocessing")) {
    return "statement";
  }
  return null;
}

export function UploadStatementScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { workspace, ready } = useWorkspace();
  const { user, token } = useAuth();
  const sub = useSubscriptionState();
  const aiScanOk = Boolean(token && (!sub || sub.canUseAiFeatures));
  const canImportRows = Boolean(user?.id && (!sub || sub.canCreateTransaction));
  const bulkImport = useMutation(api.transactions.bulkImport);
  const storeDoc = useAction(api.documents.upload);
  const ensureCats = useMutation(api.categories.ensureSeed);
  const scanImage = useAction(api.scanReceipt.scanFromBase64);
  const scanText = useAction(api.scanReceipt.scanFromDocumentText);
  const runtime = useQuery(api.admin.publicConfig, {});

  const [picked, setPicked] = useState<Picked | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  /** Rows read from the file, waiting for the person to check them before anything is saved. */
  const [review, setReview] = useState<ReviewState | null>(null);
  const [intent, setIntent] = useState<Intent | null>(null);
  const client = useApiClient();
  const existing = useQuery(api.transactions.list, ready ? { workspace, userId: user?.id } : "skip");

  /** Show rows for review; any that match a transaction the person already has start unticked. */
  const showReview = useCallback(
    (rows: Parameters<typeof toPreviewRows>[0], warnings: string[], doc?: { kind: DocKind; meta: DocMeta }) => {
      const marked = markExistingDuplicates(toPreviewRows(rows), (existing ?? []) as never);
      setReview({ rows: marked.rows, warnings: marked.warning ? [...warnings, marked.warning] : warnings, shown: PREVIEW_PAGE, doc });
    },
    [existing],
  );

  /** The picked file in the shape the upload API takes (a Blob on the web, a file reference on the phone). */
  const originalFile = useCallback(async (p: Picked) => (Platform.OS === "web" ? await (await fetch(p.uri)).blob() : { uri: p.uri, name: p.name, type: p.mime || "application/octet-stream" }), []);

  const reset = useCallback(() => {
    setPicked(null);
    setPreviewText(null);
    setStatus(null);
    setReview(null);
    setIntent(null);
  }, []);

  const loadPreview = useCallback(async (p: Picked) => {
    setPreviewText(null);
    if (p.kind !== "csv") return;
    try {
      const res = await fetch(p.uri);
      const txt = decodeText(new Uint8Array(await res.arrayBuffer()));
      setPreviewText(txt.slice(0, 8000));
    } catch (e) {
      setPreviewText(`(Could not load preview: ${userFacingErrorFromUnknown(e)})`);
    }
  }, []);

  const onPickNative = useCallback(async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ["*/*"], // any file; unsupported types are explained after picking
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0]!;
    if ((asset.size ?? 0) > MAX_FILE_BYTES) {
      Alert.alert("File too large", FILE_TOO_BIG);
      return;
    }
    const name = asset.name ?? "file";
    const mime = asset.mimeType ?? "application/octet-stream";
    const kind = classify(name, mime);
    if (!kind) {
      Alert.alert("Unsupported file", "Choose an image (JPG, PNG, …), a CSV, an Excel file (xlsx, xls, ods) or a PDF.");
      return;
    }
    const p: Picked = { uri: asset.uri, name, mime, kind };
    setPicked(p);
    setStatus(null);
    void loadPreview(p);
  }, [loadPreview]);

  const onPickWeb = useCallback(() => {
    if (typeof document === "undefined") return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.csv,.xlsx,.xls,.ods,.pdf,text/csv,application/pdf";
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return;
      void (async () => {
        if (f.size > MAX_FILE_BYTES) {
          Alert.alert("File too large", FILE_TOO_BIG);
          return;
        }
        const kind = classify(f.name, f.type);
        if (!kind) {
          Alert.alert("Unsupported file", "Choose an image, a CSV, an Excel file (xlsx, xls, ods) or a PDF.");
          return;
        }
        const uri = URL.createObjectURL(f);
        const p: Picked = { uri, name: f.name, mime: f.type, kind };
        setPicked(p);
        setStatus(null);
        if (kind === "csv") {
          const txt = await f.text();
          setPreviewText(txt.slice(0, 8000));
        } else {
          setPreviewText(null);
        }
      })();
    };
    input.click();
  }, []);

  const readBase64 = async (uri: string): Promise<string> => {
    const res = await fetch(uri);
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]!);
    return btoa(binary);
  };

  const processAiScan = useCallback(async () => {
    if (!picked || !ready) return;
    if (!token) {
      Alert.alert("Sign in", "Sign in to use smart read on uploads.");
      return;
    }
    if (sub && !sub.canUseAiFeatures) {
      Alert.alert("Feature unavailable", "Smart document reading is not included with your current access.");
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      if (picked.kind === "image") {
        const b64 = await readBase64(picked.uri);
        const mime = picked.mime.startsWith("image/") ? picked.mime : "image/jpeg";
        const result = await scanImage({ imageBase64: b64, mimeType: mime, sessionToken: token });
        const r = result as { extracted_data?: unknown; error?: string };
        let extracted = r.extracted_data as Record<string, unknown> | null | undefined;
        if (extracted && typeof extracted === "object" && "data" in extracted && (extracted as { data?: unknown }).data) {
          extracted = (extracted as { data: Record<string, unknown> }).data;
        }
        if (r.error || !extracted || Object.keys(extracted).length === 0) {
          Alert.alert("Scan", r.error ?? "Could not read document.");
          return;
        }
        const doc = receiptDocument(extracted);
        const stored = await storeOriginal(storeDoc as never, await originalFile(picked), picked.name, doc.kind, doc.meta);
        navigation.navigate("ScanReview", { scannedData: extracted as ScannedExtracted, source: "upload", receiptUri: picked.uri, ...(stored.key ? { receiptKey: stored.key } : {}) });
        reset();
        return;
      }

      const res = await fetch(picked.uri);
      const fullText = await res.text();

      const result = await scanText({ text: fullText, sessionToken: token });
      const r = result as { extracted_data?: unknown; error?: string };
      let extracted = r.extracted_data as Record<string, unknown> | null | undefined;
      if (extracted && typeof extracted === "object" && "data" in extracted && (extracted as { data?: unknown }).data) {
        extracted = (extracted as { data: Record<string, unknown> }).data;
      }
      if (r.error || !extracted || Object.keys(extracted).length === 0) {
        Alert.alert(
          "Scan",
          userFacingError(r.error ?? "Could not extract structured data. Try Import as table for CSV."),
        );
        return;
      }
      navigation.navigate("ScanReview", { scannedData: extracted as ScannedExtracted, source: "upload" });
      reset();
    } catch (e) {
      Alert.alert("Scan failed", userFacingErrorFromUnknown(e));
    } finally {
      setBusy(false);
    }
  }, [picked, ready, scanImage, scanText, navigation, reset, token, sub, storeDoc, originalFile]);

  /** Step 1: read the CSV on the phone and show what was found. Nothing is saved yet. */
  const prepareCsv = useCallback(async () => {
    if (!picked || !ready || (picked.kind !== "csv" && picked.kind !== "xlsx")) return;
    if (!user?.id || !token) {
      Alert.alert("Sign in required", "Sign in to import transactions into your account.");
      return;
    }
    if (sub && !sub.canCreateTransaction) {
      Alert.alert("Feature unavailable", "Statement importing is not included with your current access.");
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(picked.uri);
      const bytes = new Uint8Array(await res.arrayBuffer());
      // CSV bytes are decoded as UTF-8 or Windows-1252 (curly quotes survive); Excel workbooks are read sheet by sheet.
      const parsed = picked.kind === "xlsx" ? await parseXlsxBytes(bytes, picked.name, apiStatementTools(client).ai) : await parseCsvText(decodeText(bytes), apiStatementTools(client).ai);
      if (parsed.status !== "ok") {
        Alert.alert("Could not read this file", userFacingError(parsed.message ?? "Could not read this CSV. It needs Date, Description and Amount (or Debit/Credit) columns."));
        return;
      }
      showReview(parsed.rows, parsed.warnings, statementDocument(parsed));
    } catch (e) {
      Alert.alert("Could not read this file", userFacingErrorFromUnknown(e));
    } finally {
      setBusy(false);
    }
  }, [picked, ready, user?.id, token, sub, client, showReview]);

  /** Step 2: save only the rows the person left ticked. */
  const confirmImport = useCallback(async () => {
    if (!picked || !review || !user?.id || !token) return;
    const rows = importPayload(review.rows);
    if (rows.length === 0) {
      Alert.alert("Nothing selected", "Tick at least one transaction to import.");
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      await ensureCats({ workspace });
      const total = rows.length;
      // Keep the original file with the imported rows; failing to store it never blocks the import.
      const doc = review.doc ?? { kind: "other" as DocKind, meta: {} };
      const stored = await storeOriginal(storeDoc as never, await originalFile(picked), picked.name, doc.kind, doc.meta);
      const evidenceKey = stored.key ?? undefined;
      const out = await importInChunks(
        rows,
        (chunk) =>
          bulkImport({
            workspace,
            userId: user.id,
            token: token!,
            receipt_url: evidenceKey,
            rows: chunk.map((r) => ({ ...r, payment_method: "Import" })),
          }),
        (done) => setStatus(`Importing… ${done} of ${total}`),
      );
      setStatus(`Imported ${out.inserted} row(s).`);
      Alert.alert("Import complete", `Added ${out.inserted} transaction(s).${stored.note ? `\n\n${stored.note}` : ""}`, [
        { text: "OK", onPress: () => navigation.navigate("Main", { screen: "Records" }) },
      ]);
      reset();
    } catch (e) {
      Alert.alert("Import failed", userFacingErrorFromUnknown(e));
    } finally {
      setBusy(false);
    }
  }, [picked, review, workspace, user?.id, token, ensureCats, bulkImport, storeDoc, originalFile, navigation, reset]);

  /** Statement photo or PDF: read on the server (the phone cannot run the text reader); shown only if it adds up. */
  const readScannedStatement = useCallback(async () => {
    if (!picked || !ready || (picked.kind !== "image" && picked.kind !== "pdf")) return;
    if (!user?.id || !token) {
      Alert.alert("Sign in required", "Sign in to import transactions into your account.");
      return;
    }
    if (sub && !sub.canCreateTransaction) {
      Alert.alert("Feature unavailable", "Statement importing is not included with your current access.");
      return;
    }
    const isPng = /png/i.test(picked.mime) || /\.png$/i.test(picked.name);
    const isJpg = /jpe?g/i.test(picked.mime) || /\.jpe?g$/i.test(picked.name);
    if (picked.kind === "image" && !isPng && !isJpg) {
      Alert.alert("Use a JPG or PNG", "Statement photos need to be JPG or PNG. Take the photo again, or upload a CSV or Excel version at receiptcycle.com.");
      return;
    }
    setBusy(true);
    setStatus(STATEMENT_WAIT);
    try {
      const sendUri = picked.kind === "image" ? await shrinkPhoto(picked.uri) : picked.uri;
      const res = await fetch(sendUri);
      const bytes = new Uint8Array(await res.arrayBuffer());
      const { ai, cache } = apiStatementTools(client);
      const parsed = picked.kind === "pdf" ? await readPdfOnServer(bytes, ai, cache) : await readStatementPhoto(bytes, sendUri !== picked.uri ? "image/jpeg" : isPng ? "image/png" : "image/jpeg", ai, cache);
      if (parsed.status !== "ok") {
        Alert.alert("Could not read this statement", userFacingError(parsed.message ?? SCAN_UNRELIABLE));
        return;
      }
      showReview(parsed.rows, parsed.warnings, statementDocument(parsed));
    } catch (e) {
      Alert.alert("Could not read this statement", userFacingErrorFromUnknown(e));
    } finally {
      setStatus(null);
      setBusy(false);
    }
  }, [picked, ready, user?.id, token, sub, client, showReview]);

  /** A PDF receipt or invoice: read on the server (Azure receipt / invoice models), then the same review screen as camera receipts. */
  const readServerDocument = useCallback(async () => {
    if (!picked || !ready || (picked.kind !== "pdf" && picked.kind !== "image")) return;
    if (!token) {
      Alert.alert("Sign in", "Sign in to read documents.");
      return;
    }
    setBusy(true);
    setStatus(DOCUMENT_WAIT);
    try {
      const res = await fetch(picked.uri);
      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.length > MAX_FILE_BYTES) {
        Alert.alert("File too large", FILE_TOO_BIG);
        return;
      }
      const isPng = /png/i.test(picked.mime) || /\.png$/i.test(picked.name);
      const isJpg = /jpe?g/i.test(picked.mime) || /\.jpe?g$/i.test(picked.name);
      if (picked.kind === "image" && !isPng && !isJpg) {
        Alert.alert("Use a JPG or PNG", "Invoice photos need to be JPG or PNG. Take the photo again.");
        return;
      }
      const mimeType = picked.kind === "pdf" ? "application/pdf" : isPng ? "image/png" : "image/jpeg";
      const extracted = await apiReadDocument(client)(bytes, { kind: intent === "invoice" ? "invoice" : "auto", mimeType });
      const doc = receiptDocument(extracted as never);
      const stored = await storeOriginal(storeDoc as never, await originalFile(picked), picked.name, doc.kind, doc.meta);
      navigation.navigate("ScanReview", { scannedData: extracted, source: "upload", ...(picked.kind === "image" ? { receiptUri: picked.uri } : {}), ...(stored.key ? { receiptKey: stored.key } : {}) });
      reset();
    } catch (e) {
      Alert.alert("Could not read this document", userFacingErrorFromUnknown(e));
    } finally {
      setStatus(null);
      setBusy(false);
    }
  }, [picked, ready, token, client, navigation, reset, intent, storeDoc, originalFile]);

  const canPick = () => {
    if (!ready || busy) return false;
    if (runtime?.maintenanceMode) {
      Alert.alert("Unavailable", "System is in maintenance mode.");
      return false;
    }
    if (runtime?.mobileUploadPageEnabled === false) {
      Alert.alert("Unavailable", "This page is currently disabled by admin.");
      return false;
    }
    if (runtime?.uploadEnabled === false) {
      Alert.alert("Unavailable", "Upload is currently disabled by admin.");
      return false;
    }
    return true;
  };

  const onPick = () => {
    if (!canPick()) return;
    if (Platform.OS === "web") onPickWeb();
    else void onPickNative();
  };

  const onPickGallery = async () => {
    if (!canPick()) return;
    if (Platform.OS === "web") { onPickWeb(); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.78 });
    if (res.canceled || !res.assets[0]) return;
    const asset = res.assets[0];
    if ((asset.fileSize ?? 0) > MAX_FILE_BYTES) {
      Alert.alert("File too large", FILE_TOO_BIG);
      return;
    }
    const p: Picked = { uri: asset.uri, name: asset.fileName ?? "receipt-image.jpg", mime: asset.mimeType ?? "image/jpeg", kind: "image" };
    setPicked(p);
    setStatus(null);
    void loadPreview(p);
  };

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={{ paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
    >
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={21} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Upload document</Text>
        <View style={{ width: 24 }} />
      </View>

      {!picked ? (
        <View style={styles.uploadContent}>
          <Pressable style={styles.dropZone} onPress={onPick} disabled={busy || !ready} accessibilityRole="button" accessibilityLabel="Choose a file to upload">
            <View style={styles.folderIcon}><Ionicons name="folder-open-outline" size={48} color={colors.gray500} /></View>
            <Text style={styles.title}>Upload your files</Text>
            <Text style={styles.sub}>Tap here to choose a receipt or invoice photo, or a bank or card statement as a PDF, a photo or a CSV. Excel statements are imported at receiptcycle.com.</Text>
            <View style={styles.documentKinds}><Text style={[styles.kindChip, styles.receiptChip]}>receipt</Text><Text style={[styles.kindChip, styles.invoiceChip]}>invoice</Text><Text style={[styles.kindChip, styles.cardChip]}>card statement</Text><Text style={[styles.kindChip, styles.bankChip]}>bank statement</Text></View>
            <Text style={styles.fileTypes}>Phone: JPG, PNG, PDF, CSV · Web: also Excel · up to 10 MB</Text>
            <Pressable style={styles.chooseButton} onPress={onPick} disabled={busy || !ready}><Ionicons name="cloud-upload-outline" size={17} color="#fff" /><Text style={styles.chooseText}>Browse files</Text></Pressable>
          </Pressable>
          <View style={styles.infoCard}><Ionicons name="sparkles-outline" size={19} color={colors.primary} /><Text style={styles.infoText}>Receipt images open with a visual evidence preview and editable extracted fields. Statements are prepared as transaction rows for review.</Text></View>
        </View>
      ) : (
        <View style={styles.card}>
          {sub && !sub.pro && sub.blockReason ? (
            <Text style={styles.limitHint}>{sub.blockReason}</Text>
          ) : null}
          <Text style={styles.fileName}>{picked.name}</Text>
          <Text style={styles.meta}>
            {picked.kind.toUpperCase()} · {picked.mime || "unknown type"}
          </Text>

          {picked.kind === "image" ? (
            <Image source={{ uri: picked.uri }} style={styles.previewImg} resizeMode="contain" />
          ) : picked.kind === "pdf" || picked.kind === "xlsx" ? (
            review ? null : <Text style={styles.previewTxt}>{picked.kind === "pdf" ? "PDF selected." : "Excel workbook selected."}</Text>
          ) : picked.kind === "statement" ? (
            <Text style={styles.previewTxt}>
              Word files and binary .xlsb workbooks cannot be read. Save it as .xlsx, CSV or PDF and choose it again.
            </Text>
          ) : review ? null : (
            <ScrollView keyboardShouldPersistTaps="handled" style={styles.previewBox} nestedScrollEnabled>
              <Text style={styles.previewTxt}>
                {previewText ?? (busy ? "Loading preview…" : "No text preview.")}
              </Text>
            </ScrollView>
          )}

          {(picked.kind === "image" || picked.kind === "pdf") && !intent && !review ? (
            <View style={styles.reviewBox}>
              <Text style={styles.reviewTitle}>What is this {picked.kind === "pdf" ? "PDF" : "photo"}?</Text>
              <Pressable style={styles.btn} onPress={() => setIntent("statement")} accessibilityRole="button">
                <Text style={styles.btnTxt}>Bank or card statement</Text>
              </Pressable>
              <Pressable style={styles.btnSecondary} onPress={() => setIntent("receipt")} accessibilityRole="button">
                <Text style={styles.btnSecondaryTxt}>Receipt</Text>
              </Pressable>
              <Pressable style={styles.btnSecondary} onPress={() => setIntent("invoice")} accessibilityRole="button">
                <Text style={styles.btnSecondaryTxt}>Invoice</Text>
              </Pressable>
            </View>
          ) : null}

          {(picked.kind === "image" || picked.kind === "pdf") && intent === "statement" && !review ? (
            <>
              <Pressable
                style={[styles.btn, (busy || !ready || !canImportRows) && { opacity: 0.55 }]}
                onPress={() => void readScannedStatement()}
                disabled={busy || !ready || !canImportRows}
                accessibilityRole="button"
              >
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Read statement</Text>}
              </Pressable>
              <Text style={styles.scanHint}>
                {busy ? STATEMENT_WAIT : "The rows are shown only when they add up to the opening and closing balance printed on the statement. You review them before anything is saved."}
              </Text>
            </>
          ) : null}

          {((picked.kind === "pdf" && (intent === "receipt" || intent === "invoice")) || (picked.kind === "image" && intent === "invoice")) ? (
            <>
              <Pressable
                style={[styles.btn, (busy || !ready || !aiScanOk) && { opacity: 0.55 }]}
                onPress={() => void readServerDocument()}
                disabled={busy || !ready || !aiScanOk}
                accessibilityRole="button"
              >
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>{intent === "invoice" ? "Read invoice" : "Read receipt"}</Text>}
              </Pressable>
              <Text style={styles.scanHint}>{busy ? DOCUMENT_WAIT : "Opens the review screen: check the total and date, then save. Invoice numbers, due dates and line items are kept in the note."}</Text>
            </>
          ) : null}

          {picked.kind === "image" && intent === "receipt" ? (
            <>
          <Pressable
            style={[styles.btn, (busy || !ready || !aiScanOk) && { opacity: 0.55 }]}
            onPress={() => void processAiScan()}
            disabled={busy || !ready || !aiScanOk}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <FontAwesome5 name="magic" size={14} color="#fff" />
                <Text style={styles.btnTxt}>Scan with AI</Text>
              </>
            )}
          </Pressable>
          <Text style={styles.scanHint}>Opens review screen — edit text, then save (same as camera receipts).</Text>
            </>
          ) : null}

          {(picked.kind === "csv" || picked.kind === "xlsx") && !review ? (
            <Pressable
              style={[styles.btn, (busy || !ready || !canImportRows) && { opacity: 0.55 }]}
              onPress={() => void prepareCsv()}
              disabled={busy || !ready || !canImportRows}
              accessibilityRole="button"
              accessibilityLabel="Read the transactions in this file"
            >
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Read transactions</Text>}
            </Pressable>
          ) : null}

          {review ? <ReviewPanel review={review} setReview={setReview} busy={busy} onImport={() => void confirmImport()} /> : null}

          <Pressable style={styles.linkBtn} onPress={reset} disabled={busy}>
            <Text style={styles.linkTxt}>Choose a different file</Text>
          </Pressable>

          {status ? <Text style={styles.hint}>{status}</Text> : null}
        </View>
      )}
    </ScrollView>
  );
}

type ReviewState = { rows: PreviewRow[]; warnings: string[]; shown: number; doc?: { kind: DocKind; meta: DocMeta } };

/** The check-before-saving step: totals, flags, and per-row tick boxes and in/out switches. */
function ReviewPanel({ review, setReview, busy, onImport }: { review: ReviewState; setReview: (r: ReviewState | null) => void; busy: boolean; onImport: () => void }) {
  const totals = previewTotals(review.rows);
  const update = (rows: PreviewRow[]) => setReview({ ...review, rows });
  const visible = review.rows.slice(0, review.shown);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState({ date: "", merchant: "", amount: "" });
  const startEdit = (r: PreviewRow) => {
    setDraft({ date: r.date, merchant: r.merchant ?? "", amount: String(r.amount) });
    setEditing(r.id);
  };
  const draftAmount = Number(draft.amount.replace(/[$,\s]/g, ""));
  const draftDate = parseDate(draft.date, "mdy");
  const draftOk = Number.isFinite(draftAmount) && draftAmount > 0 && draftDate !== null;
  const saveEdit = () => {
    if (editing === null || !draftOk) return;
    update(updateRow(review.rows, editing, { date: draftDate!, merchant: draft.merchant.trim() || undefined, amount: Math.round(draftAmount * 100) / 100 } as never));
    setEditing(null);
  };
  const transfersOn = review.rows.some((r) => r.transfer && r.selected);
  return (
    <View style={styles.reviewBox}>
      <Text style={styles.reviewTitle}>
        {totals.total} transaction{totals.total === 1 ? "" : "s"} found · {totals.selected} selected
      </Text>
      <Text style={styles.reviewSub}>
        Money in {money(totals.moneyIn)} · Money out {money(totals.moneyOut)}
      </Text>
      {review.warnings.map((w, i) => (
        <Text key={i} style={styles.reviewWarn}>{w}</Text>
      ))}
      <View style={styles.reviewActions}>
        <Pressable style={styles.chip} onPress={() => update(swapDirections(review.rows))} accessibilityRole="button" accessibilityLabel="Swap money in and money out for every row">
          <Text style={styles.chipTxt}>Swap in / out</Text>
        </Pressable>
        {totals.transfers > 0 ? (
          <Pressable style={styles.chip} onPress={() => update(setFlagged(review.rows, "transfer", !transfersOn))} accessibilityRole="button">
            <Text style={styles.chipTxt}>
              {transfersOn ? "Skip" : "Include"} {totals.transfers} transfer{totals.transfers === 1 ? "" : "s"}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {visible.map((r) => (
        <View key={r.id}>
        <View style={[styles.reviewRow, !r.selected && { opacity: 0.45 }]}>
          <Pressable onPress={() => update(toggleRow(review.rows, r.id))} hitSlop={8} accessibilityRole="checkbox" accessibilityState={{ checked: r.selected }} accessibilityLabel={`Include ${r.merchant ?? "transaction"}`}>
            <Ionicons name={r.selected ? "checkbox" : "square-outline"} size={22} color={r.selected ? colors.primary : colors.gray400} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.reviewMerchant} numberOfLines={1}>{r.merchant || "(no description)"}</Text>
            <Text style={styles.reviewMeta}>
              {r.date}
              {r.transfer ? " · Transfer" : ""}
              {r.duplicate ? " · Possible duplicate" : ""}
              {r.future ? " · Check the date" : ""}
              {r.existing ? " · Already in your records" : ""}
            </Text>
            <Pressable onPress={() => (editing === r.id ? setEditing(null) : startEdit(r))} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Edit ${r.merchant ?? "transaction"}`}>
              <Text style={styles.editLink}>{editing === r.id ? "Cancel" : "Edit"}</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => update(setRowType(review.rows, r.id, r.type === "expense" ? "income" : "expense"))} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Marked as ${r.type === "income" ? "money in" : "money out"}. Tap to change.`}>
            <Text style={[styles.reviewAmount, { color: r.type === "income" ? colors.primary : colors.gray900 }]}>
              {r.type === "income" ? "+" : "-"}{money(r.amount)}
            </Text>
            <Text style={styles.reviewMeta}>{r.type === "income" ? "money in" : "money out"}</Text>
          </Pressable>
        </View>
        {editing === r.id ? (
          <View style={styles.editBox}>
            <Text style={styles.editLabel}>Date (month/day/year or YYYY-MM-DD)</Text>
            <TextInput style={styles.editInput} value={draft.date} onChangeText={(t) => setDraft({ ...draft, date: t })} autoCapitalize="none" autoCorrect={false} returnKeyType="next" accessibilityLabel="Date" />
            <Text style={styles.editLabel}>Description</Text>
            <TextInput style={styles.editInput} value={draft.merchant} onChangeText={(t) => setDraft({ ...draft, merchant: t })} returnKeyType="next" accessibilityLabel="Description" />
            <Text style={styles.editLabel}>Amount</Text>
            <TextInput style={styles.editInput} value={draft.amount} onChangeText={(t) => setDraft({ ...draft, amount: t })} keyboardType="decimal-pad" returnKeyType="done" onSubmitEditing={saveEdit} accessibilityLabel="Amount" />
            {!draftOk ? <Text style={styles.reviewWarn}>Enter a real date and an amount above zero.</Text> : null}
            <Pressable style={[styles.chip, !draftOk && { opacity: 0.5 }]} onPress={saveEdit} disabled={!draftOk} accessibilityRole="button">
              <Text style={styles.chipTxt}>Save changes</Text>
            </Pressable>
          </View>
        ) : null}
        </View>
      ))}
      {review.shown < review.rows.length ? (
        <Pressable style={styles.linkBtn} onPress={() => setReview({ ...review, shown: review.shown + PREVIEW_PAGE })}>
          <Text style={styles.linkTxt}>Show more ({review.rows.length - review.shown} left)</Text>
        </Pressable>
      ) : null}
      <Pressable style={[styles.btn, (busy || totals.selected === 0) && { opacity: 0.55 }]} onPress={onImport} disabled={busy || totals.selected === 0} accessibilityRole="button">
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Import {totals.selected} transaction{totals.selected === 1 ? "" : "s"}</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerTitle: { fontSize: typeScale.headline, fontWeight: "700", color: colors.gray900 },
  uploadContent: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  dropZone: { minHeight: 330, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.gray200, borderRadius: 14, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", padding: 20, gap: 8 },
  folderIcon: { width: 72, height: 64, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  documentKinds: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 10 },
  kindChip: { overflow: "hidden", borderRadius: 5, paddingHorizontal: 8, paddingVertical: 4, fontSize: 11, fontWeight: "700" },
  receiptChip: { color: colors.blue600, backgroundColor: colors.blueSoft },
  invoiceChip: { color: "#7c3aed", backgroundColor: colors.purpleSoft },
  cardChip: { color: colors.rose600, backgroundColor: colors.roseSoft },
  bankChip: { color: colors.primary, backgroundColor: colors.mintSoft },
  fileTypes: { color: colors.gray400, fontSize: 11, fontWeight: "600", marginTop: 4 },
  chooseButton: { flexDirection: "row", gap: 8, backgroundColor: colors.primary, borderRadius: 8, minHeight: 42, minWidth: 170, alignItems: "center", justifyContent: "center", marginTop: 12 },
  chooseText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  tileGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: { width: "48%", minHeight: 110, borderRadius: 0, alignItems: "center", justifyContent: "center", gap: 6 },
  tileText: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
  tileHint: { color: colors.gray600, fontSize: 10 },
  infoCard: { flexDirection: "row", gap: 9, backgroundColor: colors.blueSoft, borderRadius: 0, padding: 14 },
  infoText: { flex: 1, fontSize: 11, color: colors.gray700, lineHeight: 17 },
  card: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.surface,
    alignItems: "stretch",
    gap: 10,
  },
  limitHint: {
    fontSize: typeScale.sm,
    color: "#78350f",
    backgroundColor: "#fffbeb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fcd34d",
    padding: 8,
    marginBottom: 8,
    lineHeight: 18,
  },
  title: { fontSize: typeScale.title, fontWeight: "700", color: colors.gray900, textAlign: "center" },
  sub: { fontSize: typeScale.body, color: colors.gray600, textAlign: "center", lineHeight: 20 },
  fileName: { fontSize: typeScale.bodyStrong, fontWeight: "700", color: colors.gray900 },
  meta: { fontSize: typeScale.sm, color: colors.gray500 },
  previewImg: { width: "100%", height: 220, backgroundColor: "#111", borderRadius: 0, marginVertical: 8 },
  previewBox: {
    maxHeight: 200,
    backgroundColor: "#fafafa",
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: 10,
  },
  previewTxt: { fontSize: 11, fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }), color: colors.gray800 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginTop: 8,
    minHeight: 48,
  },
  btnTxt: { color: "#fff", fontWeight: "700", fontSize: typeScale.body },
  scanHint: { fontSize: typeScale.sm, color: colors.gray600, textAlign: "center", lineHeight: 18 },
  btnSecondary: {
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnSecondaryTxt: { color: colors.primary, fontWeight: "700", fontSize: typeScale.body },
  linkBtn: { paddingVertical: 8, alignItems: "center" },
  linkTxt: { color: colors.gray600, fontWeight: "600", fontSize: typeScale.sm },
  reviewBox: { gap: 8 },
  reviewTitle: { fontSize: typeScale.bodyStrong, fontWeight: "700", color: colors.gray900 },
  reviewSub: { fontSize: typeScale.sm, color: colors.gray600 },
  reviewWarn: { fontSize: typeScale.sm, color: "#78350f", backgroundColor: "#fffbeb", borderRadius: 8, borderWidth: 1, borderColor: "#fcd34d", padding: 8, lineHeight: 18 },
  reviewActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.primary, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  chipTxt: { color: colors.primary, fontWeight: "700", fontSize: typeScale.sm },
  reviewRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.gray200 },
  reviewMerchant: { fontSize: typeScale.body, color: colors.gray900, fontWeight: "600" },
  editLink: { color: colors.primary, fontWeight: "700", fontSize: typeScale.sm, paddingVertical: 4 },
  editBox: { gap: 6, paddingBottom: 10, paddingLeft: 32 },
  editLabel: { fontSize: 11, color: colors.gray500 },
  editInput: { borderWidth: 1, borderColor: colors.gray200, borderRadius: 0, paddingHorizontal: 10, paddingVertical: 8, fontSize: typeScale.body, color: colors.gray900, backgroundColor: "#fff" },
  reviewMeta: { fontSize: 11, color: colors.gray500 },
  reviewAmount: { fontSize: typeScale.body, fontWeight: "700", textAlign: "right" },
  hint: { fontSize: typeScale.md, color: colors.primary, marginTop: 8, textAlign: "center" },
});
