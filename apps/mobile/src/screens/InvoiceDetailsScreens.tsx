import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useActionSheet } from "@expo/react-native-action-sheet";
import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppButton, AppCard, FormField, ScreenContainer, SelectField } from "../components/ui/FinanceUI";
import { SafeActionFooter } from "../components/ui/SafeActionFooter";
import { useInvoiceFlow } from "../contexts/InvoiceFlowContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useSalesSetup } from "../contexts/SalesSetupContext";
import { addDaysYmd, calculateInvoiceTotals, paymentTermsDays, type DiscountType } from "../features/invoices/model";
import type { RootStackParamList } from "../navigation/types";
import { colors, radius, spacing, uiType } from "../theme/tokens";

type RootNav = NativeStackNavigationProp<RootStackParamList>;

function usePicker() {
  const { showActionSheetWithOptions } = useActionSheet();
  return (title: string, options: string[], onSelect: (value: string) => void) => {
    const labels = [...options, "Cancel"];
    showActionSheetWithOptions({ title, options: labels, cancelButtonIndex: labels.length - 1 }, (index) => {
      if (index === undefined || index === labels.length - 1) return;
      if (options[index]) onSelect(options[index]!);
    });
  };
}

export function InvoiceDiscountTaxScreen() {
  const navigation = useNavigation<RootNav>();
  const { draft, updateDraft } = useInvoiceFlow();
  const { currency, formatMoney } = usePreferences();
  const pick = usePicker();
  const [discountInput, setDiscountInput] = useState(draft.discountValue ? String(draft.discountValue) : "");
  const [shippingInput, setShippingInput] = useState(draft.shipping ? String(draft.shipping) : "");
  const totals = calculateInvoiceTotals(draft);

  function numberValue(value: string) {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }

  return <ScreenContainer>
    <ScreenHeader title="Discount & Tax" back />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.subtotal}>{formatMoney(totals.subtotal)}</Text></View>
      <SelectField label="Discount Type" icon="pricetag-outline" value={draft.discountType === "percentage" ? "Percentage" : "Fixed amount"} onPress={() => pick("Discount type", ["Percentage", "Fixed amount"], (value) => updateDraft({ discountType: (value === "Percentage" ? "percentage" : "fixed") as DiscountType }))} />
      <View style={styles.valueRow}><View style={{ flex: 1 }}><FormField label="Discount" icon="remove-circle-outline" value={discountInput} onChangeText={(value) => { setDiscountInput(value); updateDraft({ discountValue: numberValue(value) }); }} keyboardType="decimal-pad" placeholder="0" prefix={draft.discountType === "fixed" ? (currency === "USD" ? "$" : currency) : undefined} suffix={draft.discountType === "percentage" ? "%" : undefined} /></View><Text style={styles.negative}>-{formatMoney(totals.discountAmount)}</Text></View>
      <SelectField label="Tax" icon="receipt-outline" value={draft.taxRate > 0 ? `${draft.taxLabel} (${draft.taxRate}%)` : "No tax"} onPress={() => pick("Tax rate", ["No tax", "Sales Tax (5%)", "Sales Tax (8.25%)", "Sales Tax (10%)"], (value) => updateDraft({ taxRate: Number(value.match(/[\d.]+/)?.[0] ?? 0), taxLabel: value === "No tax" ? draft.taxLabel : "Sales Tax" }))} />
      <View style={styles.taxAmount}><Text style={styles.summaryLabel}>Calculated tax</Text><Text style={styles.positive}>+{formatMoney(totals.taxAmount)}</Text></View>
      <FormField label="Shipping" icon="car-outline" value={shippingInput} onChangeText={(value) => { setShippingInput(value); updateDraft({ shipping: numberValue(value) }); }} keyboardType="decimal-pad" placeholder="0.00" prefix={currency === "USD" ? "$" : currency} />
      <View style={styles.totalRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>{formatMoney(totals.total)}</Text></View>
      {totals.discountAmount > 0 ? <AppCard style={styles.savings}><View style={styles.savingIcon}><Ionicons name="pricetag-outline" size={20} color="#fff" /></View><View style={{ flex: 1 }}><Text style={styles.savingTitle}>You’re saving {formatMoney(totals.discountAmount)}</Text><Text style={styles.savingCopy}>The discount has been applied to this invoice.</Text></View></AppCard> : null}
    </ScrollView>
    <SafeActionFooter><AppButton label="Continue to Extras" icon="arrow-forward" onPress={() => navigation.navigate("InvoiceExtras")} /></SafeActionFooter>
  </ScreenContainer>;
}

export function InvoiceExtrasScreen() {
  const navigation = useNavigation<RootNav>();
  const { draft, updateDraft } = useInvoiceFlow();
  const { businessProfile } = useSalesSetup();
  const pick = usePicker();
  const [attaching, setAttaching] = useState(false);

  async function addAttachment() {
    setAttaching(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const directory = new Directory(Paths.document, "ReceiptCycle", "InvoiceAttachments");
      directory.create({ idempotent: true, intermediates: true });
      const safeName = asset.name.replace(/[^A-Za-z0-9._-]/g, "-");
      const destination = new File(directory, `${Date.now()}-${safeName}`);
      new File(asset.uri).copy(destination);
      updateDraft({ attachment: { name: asset.name, uri: destination.uri, mimeType: asset.mimeType ?? "application/octet-stream" } });
    } catch { Alert.alert("Attachment unavailable", "The selected file could not be saved."); }
    finally { setAttaching(false); }
  }

  return <ScreenContainer>
    <ScreenHeader title="Invoice Extras" back />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <FormField label="Notes" icon="chatbox-ellipses-outline" value={draft.notes} onChangeText={(notes) => updateDraft({ notes })} placeholder="Thank you for your business!" multiline />
      <SelectField label="Terms & Conditions" icon="document-text-outline" value={draft.terms} onPress={() => pick("Payment terms", ["Due on receipt", "Net 7", "Net 15", "Net 30", "Net 60"], (terms) => updateDraft({ terms, dueDate: addDaysYmd(draft.issueDate, paymentTermsDays(terms)) }))} />
      <View style={styles.switchRow}><View style={{ flex: 1 }}><Text style={styles.switchTitle}>Signature</Text><Text style={styles.switchMeta}>Add a typed signature to the invoice.</Text></View><Switch value={draft.signatureEnabled} onValueChange={(signatureEnabled) => updateDraft({ signatureEnabled })} trackColor={{ false: colors.gray200, true: "#82d8c7" }} thumbColor={draft.signatureEnabled ? colors.primary : "#fff"} /></View>
      {draft.signatureEnabled ? <View style={styles.signatureBox}><FormField label="Signature Name" icon="pencil-outline" value={draft.signatureText} onChangeText={(signatureText) => updateDraft({ signatureText })} placeholder="Alex Rivera" /><Text style={styles.signaturePreview}>{draft.signatureText || "Your signature"}</Text></View> : null}
      <View style={styles.assetRow}>
        <Pressable onPress={() => navigation.navigate("BusinessProfile")} style={styles.assetCard} accessibilityRole="button" accessibilityLabel="Change business logo">{businessProfile.logoUri ? <Image source={{ uri: businessProfile.logoUri }} style={styles.logo} /> : <View style={styles.logoMark}><Ionicons name="leaf-outline" size={25} color="#fff" /></View>}<Text style={styles.assetTitle}>{businessProfile.businessName || "Receipt Cycle"}</Text><Text style={styles.assetMeta}>Tap to change</Text></Pressable>
        <Pressable onPress={() => void addAttachment()} style={styles.assetCard} accessibilityRole="button" accessibilityLabel="Add invoice attachment"><Ionicons name={draft.attachment ? "document-attach-outline" : "attach-outline"} size={34} color={colors.textPrimary} /><Text style={styles.assetTitle} numberOfLines={1}>{draft.attachment?.name ?? (attaching ? "Adding..." : "Add file")}</Text><Text style={styles.assetMeta}>{draft.attachment ? "Tap to replace" : "PDF, image, etc."}</Text></Pressable>
      </View>
    </ScrollView>
    <SafeActionFooter><AppButton label="Continue to Preview" icon="arrow-forward" onPress={() => navigation.navigate("InvoicePreview")} /></SafeActionFooter>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xl },
  summaryLabel: { color: colors.gray600, fontSize: uiType.body },
  subtotal: { color: colors.textPrimary, fontSize: uiType.body, fontWeight: "800" },
  valueRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  negative: { color: colors.danger, fontSize: uiType.secondary, fontWeight: "800", paddingTop: spacing.md },
  taxAmount: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: -spacing.xs, marginBottom: spacing.lg, paddingHorizontal: spacing.xs },
  positive: { color: colors.success, fontSize: uiType.secondary, fontWeight: "800" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: spacing.xl, marginTop: spacing.md },
  totalLabel: { color: colors.textPrimary, fontSize: uiType.sectionTitle, fontWeight: "900" },
  totalValue: { color: colors.primary, fontSize: 24, fontWeight: "900" },
  savings: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.mintSoft, borderColor: "#d2f0e7", marginTop: spacing.xl },
  savingIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  savingTitle: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
  savingCopy: { color: colors.gray600, fontSize: uiType.caption, lineHeight: 16, marginTop: 3 },
  switchRow: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.md },
  switchTitle: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
  switchMeta: { color: colors.gray500, fontSize: uiType.caption, marginTop: 3 },
  signatureBox: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.medium, backgroundColor: colors.surface, padding: spacing.md, marginBottom: spacing.lg },
  signaturePreview: { color: colors.textPrimary, fontSize: 27, fontStyle: "italic", textAlign: "center", marginTop: -spacing.sm, marginBottom: spacing.sm },
  assetRow: { flexDirection: "row", gap: spacing.sm },
  assetCard: { flex: 1, minHeight: 142, borderWidth: 1, borderColor: colors.border, borderRadius: radius.medium, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", padding: spacing.sm },
  logo: { width: 48, height: 48, borderRadius: radius.medium, marginBottom: spacing.sm },
  logoMark: { width: 48, height: 48, borderRadius: radius.medium, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  assetTitle: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800", textAlign: "center" },
  assetMeta: { color: colors.gray500, fontSize: uiType.caption, marginTop: 4 },
});
