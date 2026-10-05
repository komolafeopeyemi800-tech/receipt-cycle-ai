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
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FontAwesome5 } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useAction, useMutation, useQuery } from "../lib/api";
import { api } from "../lib/api";
import { colors, type as typeScale } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useAuth } from "../contexts/AuthContext";
import { useSubscriptionState } from "../hooks/useSubscriptionState";
import { parseStatementCsv } from "../lib/statementCsv";
import { userFacingError, userFacingErrorFromUnknown } from "../lib/userFacingErrors";
import type { ScannedExtracted } from "../types/transaction";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Picked = {
  uri: string;
  name: string;
  mime: string;
  kind: "image" | "csv";
};

function defaultCategory(type: "expense" | "income") {
  return type === "expense" ? "Other" : "Salary";
}

/** Only image or CSV — PDF removed (unreliable on device). */
function classify(name: string, mime: string): "image" | "csv" | null {
  const n = name.toLowerCase();
  if (n.match(/\.(jpg|jpeg|png|webp|heic)$/i) || mime.startsWith("image/")) return "image";
  if (n.endsWith(".csv") || mime.includes("csv")) return "csv";
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
  const ensureCats = useMutation(api.categories.ensureSeed);
  const scanImage = useAction(api.scanReceipt.scanFromBase64);
  const scanText = useAction(api.scanReceipt.scanFromDocumentText);
  const runtime = useQuery(api.admin.publicConfig, {});

  const [picked, setPicked] = useState<Picked | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const reset = useCallback(() => {
    setPicked(null);
    setPreviewText(null);
    setStatus(null);
  }, []);

  const loadPreview = useCallback(async (p: Picked) => {
    setPreviewText(null);
    if (p.kind === "image") return;
    try {
      const res = await fetch(p.uri);
      const txt = await res.text();
      setPreviewText(txt.slice(0, 8000));
    } catch (e) {
      setPreviewText(`(Could not load preview: ${userFacingErrorFromUnknown(e)})`);
    }
  }, []);

  const onPickNative = useCallback(async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "text/csv", "text/comma-separated-values", "application/csv"],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0]!;
    const name = asset.name ?? "file";
    const mime = asset.mimeType ?? "application/octet-stream";
    const kind = classify(name, mime);
    if (!kind) {
      Alert.alert("Unsupported file", "Choose an image (JPG, PNG, …) or a CSV file. PDF is not supported.");
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
    input.accept = "image/*,.csv,text/csv";
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return;
      void (async () => {
        const kind = classify(f.name, f.type);
        if (!kind) {
          Alert.alert("Unsupported file", "Choose an image or a CSV file. PDF is not supported.");
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
      Alert.alert("Upgrade needed", sub.blockReason ?? "Smart read on uploads requires Pro or an active trial slot.");
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
        navigation.navigate("ScanReview", { scannedData: extracted as ScannedExtracted, source: "upload" });
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
  }, [picked, ready, scanImage, scanText, navigation, reset, token, sub]);

  const importTable = useCallback(async () => {
    if (!picked || !ready || picked.kind !== "csv") return;
    if (!user?.id || !token) {
      Alert.alert("Sign in required", "Sign in to import transactions into your account.");
      return;
    }
    if (sub && !sub.canCreateTransaction) {
      Alert.alert("Upgrade needed", sub.blockReason ?? "Importing rows requires Pro or an available trial slot.");
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      await ensureCats({ workspace });
      const res = await fetch(picked.uri);
      const text = await res.text();
      const parsed = parseStatementCsv(text);

      if (!parsed.ok) {
        Alert.alert("Import", userFacingError(parsed.error));
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

      const out = await bulkImport({ workspace, userId: user.id, token: token!, rows });
      const w = [...parsed.warnings];
      if (out.truncated) w.push(`Import capped — only ${out.inserted} rows saved.`);
      setStatus(`Imported ${out.inserted} row(s).`);
      Alert.alert(
        "Import complete",
        `Added ${out.inserted} transaction(s).${w.length ? `\n\n${w.join("\n")}` : ""}`,
        [{ text: "OK", onPress: () => navigation.navigate("Main", { screen: "Records" }) }],
      );
      reset();
    } catch (e) {
      Alert.alert("Import failed", userFacingErrorFromUnknown(e));
    } finally {
      setBusy(false);
    }
  }, [picked, ready, workspace, user?.id, token, ensureCats, bulkImport, navigation, reset, sub]);

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
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
    if (res.canceled || !res.assets[0]) return;
    const asset = res.assets[0];
    const p: Picked = { uri: asset.uri, name: asset.fileName ?? "receipt-image.jpg", mime: asset.mimeType ?? "image/jpeg", kind: "image" };
    setPicked(p);
    setStatus(null);
    void loadPreview(p);
  };

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={{ paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
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
          <View style={styles.dropZone}>
            <Ionicons name="cloud-upload-outline" size={42} color={colors.primary} />
            <Text style={styles.title}>Upload a document</Text>
            <Text style={styles.sub}>Choose a receipt image or CSV document</Text>
            <Pressable style={styles.chooseButton} onPress={onPick} disabled={busy || !ready}><Text style={styles.chooseText}>Choose files</Text></Pressable>
          </View>
          <View style={styles.tileGrid}>
            <Pressable style={[styles.tile, { backgroundColor: colors.blueSoft }]} onPress={() => void onPickGallery()}><Ionicons name="images-outline" size={27} color={colors.blue600} /><Text style={styles.tileText}>Gallery</Text></Pressable>
            <Pressable style={[styles.tile, { backgroundColor: "#f3f7ff" }]} onPress={onPick}><Ionicons name="document-outline" size={27} color={colors.blue600} /><Text style={styles.tileText}>Files</Text></Pressable>
            <Pressable style={[styles.tile, { backgroundColor: colors.roseSoft, opacity: 0.65 }]} onPress={() => Alert.alert("PDF unavailable", "PDF upload is not supported on this device yet. Choose a JPG or PNG image instead.")}><Ionicons name="document-text-outline" size={27} color={colors.rose600} /><Text style={styles.tileText}>PDF</Text><Text style={styles.tileHint}>Coming soon</Text></Pressable>
            <Pressable style={[styles.tile, { backgroundColor: colors.mintSoft }]} onPress={() => void onPickGallery()}><Ionicons name="image-outline" size={27} color={colors.primary} /><Text style={styles.tileText}>Image</Text></Pressable>
          </View>
          <View style={styles.infoCard}><Ionicons name="bulb-outline" size={19} color={colors.amber600} /><Text style={styles.infoText}>AI extracts key details from JPG, PNG and other supported images. CSV files can also be imported as transaction rows.</Text></View>
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
          ) : (
            <ScrollView style={styles.previewBox} nestedScrollEnabled>
              <Text style={styles.previewTxt}>
                {previewText ?? (busy ? "Loading preview…" : "No text preview.")}
              </Text>
            </ScrollView>
          )}

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

          {picked.kind === "csv" ? (
            <Pressable
              style={[styles.btnSecondary, (busy || !ready || !canImportRows) && { opacity: 0.55 }]}
              onPress={() => void importTable()}
              disabled={busy || !ready || !canImportRows}
            >
              <Text style={styles.btnSecondaryTxt}>Import as bank / CSV table</Text>
            </Pressable>
          ) : null}

          <Pressable style={styles.linkBtn} onPress={reset} disabled={busy}>
            <Text style={styles.linkTxt}>Choose a different file</Text>
          </Pressable>

          {status ? <Text style={styles.hint}>{status}</Text> : null}
        </View>
      )}
    </ScrollView>
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
  dropZone: { minHeight: 222, borderWidth: 1.5, borderStyle: "dashed", borderColor: "#8ed8d0", borderRadius: 16, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", padding: 20, gap: 8 },
  chooseButton: { backgroundColor: colors.blueSoft, borderRadius: 12, minHeight: 38, minWidth: 170, alignItems: "center", justifyContent: "center", marginTop: 10 },
  chooseText: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  tileGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: { width: "48%", minHeight: 110, borderRadius: 12, alignItems: "center", justifyContent: "center", gap: 6 },
  tileText: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
  tileHint: { color: colors.gray600, fontSize: 10 },
  infoCard: { flexDirection: "row", gap: 9, backgroundColor: colors.blueSoft, borderRadius: 12, padding: 14 },
  infoText: { flex: 1, fontSize: 11, color: colors.gray700, lineHeight: 17 },
  card: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
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
  previewImg: { width: "100%", height: 220, backgroundColor: "#111", borderRadius: 12, marginVertical: 8 },
  previewBox: {
    maxHeight: 200,
    backgroundColor: "#fafafa",
    borderRadius: 12,
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
  hint: { fontSize: typeScale.md, color: colors.primary, marginTop: 8, textAlign: "center" },
});
