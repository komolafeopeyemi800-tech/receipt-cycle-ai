import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
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
  const [categorizeItems, setCategorizeItems] = useState(true);
  const [showMore, setShowMore] = useState(true);

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
        routes: [{ name: "Main" }, { name: "AddTransaction", params: { scannedData: merged, source: route.params.source, receiptUri: route.params.receiptUri, receiptKey: route.params.receiptKey } }],
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
        <Text style={styles.title}>Review Receipt</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.reviewSuccess}><Ionicons name="sparkles-outline" size={19} color={colors.primary} /><View style={{ flex: 1 }}><Text style={styles.reviewSuccessTitle}>AI extracted this information</Text><Text style={styles.reviewSuccessSub}>Review and edit before saving</Text></View><Ionicons name="checkmark-circle" size={20} color={colors.success} /></View>
        <View style={styles.receiptPreview}>{route.params.receiptUri ? <Image source={{ uri: route.params.receiptUri }} resizeMode="contain" style={styles.previewImage} /> : <Text style={styles.receiptPreviewText}>{draft.formatted_receipt_text?.trim() || `${draft.merchant_name || "Receipt"}\n${draft.date || ""}\n${amountStr || ""}`}</Text>}</View>

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

        <View style={styles.card}>
          <View style={styles.toggleRow}><View style={{ flex: 1 }}><Text style={styles.cardHdr}>Line-item categorization</Text><Text style={styles.hintTxt}>Assign a separate category to every item.</Text></View><Switch value={categorizeItems} onValueChange={setCategorizeItems} trackColor={{ false: colors.gray200, true: colors.primary }} /></View>
        </View>

        <Pressable style={styles.detailsButton} onPress={() => setShowMore((value) => !value)}><Ionicons name={showMore ? "chevron-up" : "chevron-down"} size={16} color={colors.primary} /><Text style={styles.detailsButtonText}>{showMore ? "Hide" : "Show"} additional details</Text></Pressable>
        {showMore ? <View style={styles.card}>
          <Text style={styles.cardHdr}>Vendor and payment details</Text>
          <Text style={styles.fieldLbl}>Vendor address</Text><TextInput style={styles.input} value={draft.merchant_address ?? ""} onChangeText={(merchant_address) => setDraft((d) => ({ ...d, merchant_address }))} placeholder="Address on receipt" placeholderTextColor={colors.gray400} />
          <Text style={styles.fieldLbl}>Receipt number</Text><TextInput style={styles.input} value={draft.receipt_number ?? ""} onChangeText={(receipt_number) => setDraft((d) => ({ ...d, receipt_number }))} placeholder="Order or receipt number" placeholderTextColor={colors.gray400} />
          <Text style={styles.fieldLbl}>Country / currency</Text><View style={styles.inlineFields}><TextInput style={[styles.input, { flex: 1 }]} value={draft.country ?? ""} onChangeText={(country) => setDraft((d) => ({ ...d, country }))} placeholder="Country" placeholderTextColor={colors.gray400} /><TextInput style={[styles.input, { flex: 1 }]} value={draft.currency ?? ""} onChangeText={(currency) => setDraft((d) => ({ ...d, currency }))} placeholder="USD" placeholderTextColor={colors.gray400} /></View>
          <Text style={styles.fieldLbl}>Card type / last 4</Text><View style={styles.inlineFields}><TextInput style={[styles.input, { flex: 1 }]} value={draft.card_type ?? ""} onChangeText={(card_type) => setDraft((d) => ({ ...d, card_type }))} placeholder="Visa" placeholderTextColor={colors.gray400} /><TextInput style={[styles.input, { flex: 1 }]} value={draft.card_last4 ?? ""} onChangeText={(card_last4) => setDraft((d) => ({ ...d, card_last4 }))} placeholder="Last 4" placeholderTextColor={colors.gray400} keyboardType="number-pad" /></View>
          <Text style={styles.cardHdr}>Tax lines</Text>
          {(draft.taxes ?? (draft.tax_amount != null ? [{ type: "Sales Tax", amount: draft.tax_amount }] : [])).map((tax, index, taxes) => <View key={`${tax.type}-${index}`} style={styles.taxRow}><TextInput style={[styles.input, { flex: 1 }]} value={tax.type ?? ""} onChangeText={(type) => setDraft((d) => ({ ...d, taxes: taxes.map((row, rowIndex) => rowIndex === index ? { ...row, type } : row) }))} placeholder="Tax type" placeholderTextColor={colors.gray400} /><TextInput style={[styles.input, { width: 95 }]} value={tax.amount == null ? "" : String(tax.amount)} onChangeText={(amount) => setDraft((d) => ({ ...d, taxes: taxes.map((row, rowIndex) => rowIndex === index ? { ...row, amount: Number(amount) } : row) }))} keyboardType="decimal-pad" /><Pressable onPress={() => setDraft((d) => ({ ...d, taxes: taxes.filter((_, rowIndex) => rowIndex !== index) }))}><Ionicons name="trash-outline" size={19} color={colors.rose600} /></Pressable></View>)}
          <Pressable onPress={() => setDraft((d) => ({ ...d, taxes: [...(d.taxes ?? []), { type: "Sales Tax", amount: 0 }] }))}><Text style={styles.addLine}>+ Add tax line</Text></Pressable>
        </View> : null}

        {draft.items?.length ? (
          <View style={styles.card}>
            <Text style={styles.cardHdr}>Line items (from scan)</Text>
            {draft.items.map((item, index) => <View key={`${item.name}-${index}`} style={styles.itemEditor}><View style={{ flex: 1 }}><Text style={styles.itemsTxt}>{item.name} ×{item.quantity ?? 1} · {formatMoney(item.total ?? (item.price ?? 0) * (item.quantity ?? 1))}</Text>{categorizeItems ? <TextInput style={styles.itemCategory} value={item.category ?? draft.category ?? ""} onChangeText={(category) => setDraft((d) => ({ ...d, items: d.items?.map((row, rowIndex) => rowIndex === index ? { ...row, category } : row) }))} placeholder="Item category" placeholderTextColor={colors.gray400} /> : null}</View><Pressable onPress={() => setDraft((d) => ({ ...d, items: d.items?.filter((_, rowIndex) => rowIndex !== index) }))}><Ionicons name="trash-outline" size={19} color={colors.rose600} /></Pressable></View>)}
          </View>
        ) : null}

        <View style={styles.syncNote}><Ionicons name="cloud-upload-outline" size={16} color={colors.primary} style={{ marginRight: 8, marginTop: 2 }} /><Text style={styles.syncNoteTxt}>Your changes are saved with the transaction on the next screen.</Text></View>

      </ScrollView>
      <View style={[styles.actionDock, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <Pressable style={styles.dockAction} onPress={onRetake} accessibilityLabel="Delete scan and retake">
          <Ionicons name="trash-outline" size={22} color={colors.rose600} />
          <Text style={[styles.dockLabel, { color: colors.rose600 }]}>Retake</Text>
        </Pressable>
        <View style={styles.dockHint}><Ionicons name="create-outline" size={19} color={colors.primary} /><Text style={styles.dockHintText}>Edit fields above</Text></View>
        <Pressable style={styles.saveDockAction} onPress={onSave} accessibilityLabel="Continue and save transaction">
          <Ionicons name="checkmark" size={23} color="#fff" />
          <Text style={styles.saveDockLabel}>Save</Text>
        </Pressable>
      </View>
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
  title: { fontSize: typeScale.headline, fontWeight: "700", color: colors.textPrimary },
  pad: { paddingHorizontal: 16, paddingBottom: 112, paddingTop: 8 },
  reviewSuccess: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: colors.mintSoft, borderColor: "#c9eee2", borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  reviewSuccessTitle: { color: colors.primaryDark, fontSize: typeScale.body, fontWeight: "700" },
  reviewSuccessSub: { color: colors.gray600, fontSize: typeScale.sm, marginTop: 2 },
  previewRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  receiptPreview: { width: "100%", height: 250, borderRadius: 6, borderColor: colors.border, borderWidth: 1, backgroundColor: "#eef2f3", padding: 8, alignItems: "center", justifyContent: "center", marginBottom: 14, overflow: "hidden" },
  receiptPreviewText: { color: colors.gray700, fontSize: typeScale.sm, lineHeight: 17, textAlign: "center" },
  receiptPreviewLabel: { color: colors.gray500, fontSize: 11, marginTop: 4 },
  previewImage: { width: "100%", height: "100%" },
  syncNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    backgroundColor: "#ecfdf5",
    padding: 10,
    borderRadius: 6,
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
    borderRadius: 6,
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
    borderRadius: 6,
    padding: 12,
    marginBottom: 14,
    minHeight: 160,
    fontSize: typeScale.body,
    color: colors.gray900,
    lineHeight: 20,
  },
  fieldLbl: { fontSize: typeScale.xs, fontWeight: "600", color: colors.gray600, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 6,
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
    borderRadius: 6,
    backgroundColor: colors.surface,
    padding: 10,
    marginBottom: 10,
  },
  cardHdr: { fontSize: typeScale.xs, fontWeight: "700", color: colors.gray500, marginBottom: 6 },
  itemsTxt: { fontSize: typeScale.sm, color: colors.gray700, lineHeight: 18 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  detailsButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderWidth: 1, borderColor: colors.gray200, borderRadius: 6, paddingVertical: 11, marginBottom: 10, backgroundColor: colors.surface },
  detailsButtonText: { fontSize: typeScale.sm, color: colors.primary, fontWeight: "700" },
  inlineFields: { flexDirection: "row", gap: 8 },
  taxRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  addLine: { color: colors.primary, fontSize: typeScale.sm, fontWeight: "700", paddingVertical: 8 },
  itemEditor: { flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, borderTopColor: colors.gray100, paddingVertical: 10 },
  itemCategory: { borderWidth: 1, borderColor: colors.gray200, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 7, marginTop: 7, color: colors.gray900, fontSize: typeScale.sm },
  primary: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 6,
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
  actionDock: { position: "absolute", left: 0, right: 0, bottom: 0, minHeight: 78, paddingTop: 10, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider },
  dockAction: { width: 66, alignItems: "center", justifyContent: "center", gap: 3 },
  dockLabel: { fontSize: 11, fontWeight: "700" },
  dockHint: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  dockHintText: { fontSize: 12, color: colors.gray600, fontWeight: "600" },
  saveDockAction: { minWidth: 82, minHeight: 50, borderRadius: 6, backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  saveDockLabel: { color: "#fff", fontSize: 13, fontWeight: "800" },
});
