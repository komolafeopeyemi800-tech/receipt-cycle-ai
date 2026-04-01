import { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { CommonActions, useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, gradients, type as typeScale } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";
import type { ScannedExtracted } from "../types/transaction";
import { usePreferences } from "../contexts/PreferencesContext";

function docTypeLabel(t?: string) {
  if (!t) return "Document";
  return t
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function ScanReviewScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "ScanReview">>();
  const { formatMoney } = usePreferences();

  const initial = route.params.scannedData;
  const [draft, setDraft] = useState<ScannedExtracted>(() => ({ ...initial }));
  const [amountStr, setAmountStr] = useState(
    initial.total_amount != null && initial.total_amount > 0 ? String(initial.total_amount) : "",
  );

  const hasTotal = amountStr.trim().length > 0 && Number.isFinite(parseFloat(amountStr)) && parseFloat(amountStr) > 0;
  const notReceipt = draft.tags?.some((x) => x.toLowerCase().includes("not_a_receipt"));
  const lowConf = draft.ocr_confidence === "low" || draft.ocr_confidence === "medium";

  const itemsLine = useMemo(() => {
    if (!draft.items?.length) return null;
    return draft.items
      .map((i) => {
        const p =
          i.price != null && Number.isFinite(i.price) ? formatMoney(Number(i.price)) : "?";
        return `${i.name} ×${i.quantity ?? 1} @ ${p}`;
      })
      .join("\n");
  }, [draft.items, formatMoney]);

  const onSave = () => {
    const n = parseFloat(amountStr.replace(/,/g, ""));
    const merged: ScannedExtracted = {
      ...draft,
      total_amount: Number.isFinite(n) && n > 0 ? n : undefined,
      merchant_name: draft.merchant_name?.trim() || undefined,
      formatted_receipt_text: draft.formatted_receipt_text?.trim() || undefined,
      time: draft.time?.trim() || undefined,
    };
    /** Drop ScanReceipt from the stack so Save / Back does not reopen the camera */
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [{ name: "Main" }, { name: "AddTransaction", params: { scannedData: merged, source: route.params.source } }],
      }),
    );
  };

  const onRetake = () => {
    navigation.goBack();
  };

  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <View style={[styles.top, { paddingTop: Math.max(insets.top, 10) }]}>
        <Pressable onPress={onRetake} hitSlop={12}>
          <Ionicons name="chevron-back" size={20} color={colors.gray900} />
        </Pressable>
        <Text style={styles.title}>Review scan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.syncNote}>
          <Ionicons name="cloud-upload-outline" size={16} color={colors.primary} style={{ marginRight: 8, marginTop: 2 }} />
          <Text style={styles.syncNoteTxt}>
            Your edits apply here first. The transaction syncs to Convex after you tap Save on the next screen.
          </Text>
        </View>

        <Text style={styles.lead}>
          Fix any OCR mistakes below. The receipt-style text is saved with your transaction as reference.
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>{docTypeLabel(draft.document_type)}</Text>
          </View>
          {draft.ocr_confidence ? (
            <View style={[styles.badge, styles.badgeMuted]}>
              <Text style={styles.badgeTxtMuted}>OCR: {draft.ocr_confidence}</Text>
            </View>
          ) : null}
        </View>

        {draft.detected_languages && draft.detected_languages.length > 0 ? (
          <View style={styles.chipRow}>
            <Ionicons name="language-outline" size={14} color={colors.gray600} />
            <Text style={styles.chipLbl}>Languages: </Text>
            <Text style={styles.chipVal}>{draft.detected_languages.join(", ")}</Text>
          </View>
        ) : null}

        {draft.tags && draft.tags.length > 0 ? (
          <View style={styles.tagWrap}>
            {draft.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagTxt}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {notReceipt ? (
          <View style={styles.warnBox}>
            <Ionicons name="alert-circle-outline" size={18} color="#b45309" />
            <Text style={styles.warnTxt}>Tagged as not a standard receipt — check fields before saving.</Text>
          </View>
        ) : null}

        {lowConf ? (
          <View style={styles.hintBox}>
            <Text style={styles.hintTxt}>Confidence is {draft.ocr_confidence} — edit as needed.</Text>
          </View>
        ) : null}

        <Text style={styles.sectionHdr}>Document text (editable)</Text>
        <TextInput
          style={styles.ticketInput}
          multiline
          value={draft.formatted_receipt_text ?? ""}
          onChangeText={(t) => setDraft((d) => ({ ...d, formatted_receipt_text: t }))}
          placeholder="Formatted receipt or notes…"
          placeholderTextColor={colors.gray400}
          textAlignVertical="top"
        />

        <Text style={styles.sectionHdr}>Transaction fields</Text>
        <Text style={styles.fieldLbl}>Merchant</Text>
        <TextInput
          style={styles.input}
          value={draft.merchant_name ?? ""}
          onChangeText={(t) => setDraft((d) => ({ ...d, merchant_name: t }))}
          placeholder="Store name"
          placeholderTextColor={colors.gray400}
        />
        <Text style={styles.fieldLbl}>Total amount (number)</Text>
        <TextInput
          style={styles.input}
          value={amountStr}
          onChangeText={setAmountStr}
          placeholder="0.00"
          placeholderTextColor={colors.gray400}
          keyboardType="decimal-pad"
        />
        {!hasTotal ? (
          <Text style={styles.missingAmt}>Enter a total to continue, or add it on the next screen.</Text>
        ) : (
          <Text style={styles.previewAmt}>Preview: {formatMoney(parseFloat(amountStr))}</Text>
        )}

        <Text style={styles.fieldLbl}>Date</Text>
        <TextInput
          style={styles.input}
          value={draft.date ?? ""}
          onChangeText={(t) => setDraft((d) => ({ ...d, date: t }))}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.gray400}
        />
        <Text style={styles.fieldLbl}>Time (if on receipt)</Text>
        <TextInput
          style={styles.input}
          value={draft.time ?? ""}
          onChangeText={(t) => setDraft((d) => ({ ...d, time: t }))}
          placeholder="e.g. 14:32 or 2:32 PM"
          placeholderTextColor={colors.gray400}
        />
        <Text style={styles.fieldLbl}>Category</Text>
        <TextInput
          style={styles.input}
          value={draft.category ?? ""}
          onChangeText={(t) => setDraft((d) => ({ ...d, category: t }))}
          placeholder="Category"
          placeholderTextColor={colors.gray400}
        />
        <Text style={styles.fieldLbl}>Payment</Text>
        <TextInput
          style={styles.input}
          value={draft.payment_method ?? ""}
          onChangeText={(t) => setDraft((d) => ({ ...d, payment_method: t }))}
          placeholder="Card, cash…"
          placeholderTextColor={colors.gray400}
        />

        {itemsLine ? (
          <View style={styles.card}>
            <Text style={styles.cardHdr}>Line items (from scan)</Text>
            <Text style={styles.itemsTxt}>{itemsLine}</Text>
          </View>
        ) : null}

        <Pressable style={styles.primary} onPress={onSave}>
          <Text style={styles.primaryTxt}>Looks good — save transaction</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={onRetake}>
          <Ionicons name="camera-outline" size={16} color={colors.primary} />
          <Text style={styles.secondaryTxt}>Retake scan</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 6,
  },
  title: { fontSize: typeScale.title, fontWeight: "700", color: colors.gray900 },
  pad: { paddingHorizontal: 14, paddingBottom: 28 },
  syncNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    backgroundColor: "#ecfdf5",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  syncNoteTxt: {
    flex: 1,
    fontSize: typeScale.sm,
    color: colors.gray700,
    lineHeight: 20,
  },
  lead: { fontSize: typeScale.sm, color: colors.gray600, marginBottom: 12, lineHeight: 18 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  badge: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  badgeTxt: { fontSize: typeScale.xs, fontWeight: "700", color: colors.primary },
  badgeMuted: { backgroundColor: "#f8fafc", borderColor: colors.gray200 },
  badgeTxtMuted: { fontSize: typeScale.xs, fontWeight: "600", color: colors.gray600 },
  chipRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4, marginBottom: 8 },
  chipLbl: { fontSize: typeScale.sm, color: colors.gray600 },
  chipVal: { fontSize: typeScale.sm, fontWeight: "600", color: colors.gray900, flex: 1 },
  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  tag: {
    backgroundColor: "#fff7ed",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  tagTxt: { fontSize: typeScale.xs, fontWeight: "600", color: "#9a3412" },
  warnBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#fffbeb",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fde68a",
    marginBottom: 10,
  },
  warnTxt: { flex: 1, fontSize: typeScale.sm, color: "#92400e", lineHeight: 18 },
  hintBox: { marginBottom: 10 },
  hintTxt: { fontSize: typeScale.xs, color: colors.gray600 },
  sectionHdr: {
    fontSize: typeScale.bodyStrong,
    fontWeight: "700",
    color: colors.gray900,
    marginBottom: 8,
    marginTop: 4,
  },
  ticketInput: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    minHeight: 160,
    fontSize: typeScale.sm,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    color: colors.gray900,
    lineHeight: 20,
  },
  fieldLbl: { fontSize: typeScale.xs, fontWeight: "600", color: colors.gray600, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typeScale.body,
    marginBottom: 10,
    backgroundColor: colors.surface,
    color: colors.gray900,
  },
  previewAmt: { fontSize: typeScale.sm, color: colors.primary, fontWeight: "600", marginBottom: 8 },
  missingAmt: { fontSize: typeScale.xs, color: "#b45309", marginBottom: 8 },
  card: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 10,
    backgroundColor: colors.surface,
    padding: 10,
    marginBottom: 10,
  },
  cardHdr: { fontSize: typeScale.xs, fontWeight: "700", color: colors.gray500, marginBottom: 6 },
  itemsTxt: { fontSize: typeScale.sm, color: colors.gray700, lineHeight: 18 },
  primary: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  primaryTxt: { color: "#fff", fontWeight: "700", fontSize: typeScale.body },
  secondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    marginTop: 6,
  },
  secondaryTxt: { fontSize: typeScale.sm, fontWeight: "700", color: colors.primary },
});
