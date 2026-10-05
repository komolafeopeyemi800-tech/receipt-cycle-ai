import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useActionSheet } from "@expo/react-native-action-sheet";
import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppButton, AppCard, FormField, IconTile, ScreenContainer, SegmentedTabs, SelectField, StatusBadge } from "../components/ui/FinanceUI";
import { EstimateFlowFooter, estimateProgressLabels } from "../components/ui/EstimateUI";
import { DocumentProgress } from "../components/ui/SalesDocumentUI";
import { InitialsAvatar } from "../components/ui/SalesSetupUI";
import { useEstimateFlow } from "../contexts/EstimateFlowContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useSalesSetup } from "../contexts/SalesSetupContext";
import { calculateEstimateTotals } from "../features/estimates/model";
import { addDaysYmd, type DiscountType } from "../features/invoices/model";
import type { RootStackParamList } from "../navigation/types";
import { colors, radius, spacing, uiType } from "../theme/tokens";
import { CustomerPickerSheet } from "./InvoiceBasicScreen";

type RootNav = NativeStackNavigationProp<RootStackParamList>;

function usePicker() {
  const { showActionSheetWithOptions } = useActionSheet();
  return (title: string, options: string[], onSelect: (value: string) => void) => {
    const labels = [...options, "Cancel"];
    showActionSheetWithOptions({ title, options: labels, cancelButtonIndex: labels.length - 1 }, (index) => {
      if (index === undefined || index === labels.length - 1 || !options[index]) return;
      onSelect(options[index]!);
    });
  };
}

function DateRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return <View style={styles.fieldBlock}><Text style={styles.label}>{label}</Text><Pressable onPress={onPress} style={styles.dateRow} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`}><Text style={styles.dateValue}>{value}</Text><Ionicons name="calendar-outline" size={19} color={colors.primary} /></Pressable></View>;
}

export function EstimateBasicScreen() {
  const navigation = useNavigation<RootNav>();
  const { draft, updateDraft, saveEstimate } = useEstimateFlow();
  const { customers } = useSalesSetup();
  const { formatDate } = usePreferences();
  const [dateOpen, setDateOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const customer = customers.find((item) => item.id === draft.customerId);

  function save() {
    if (!customer) { Alert.alert("Choose a customer", "Select a customer before saving this draft."); return; }
    saveEstimate("draft");
    Alert.alert("Draft saved", `${draft.estimateNumber} is saved on this device.`);
  }

  function continueFlow() {
    if (!draft.estimateNumber.trim()) { Alert.alert("Estimate number required", "Enter an estimate number before continuing."); return; }
    if (!customer) { Alert.alert("Choose a customer", "Select or add the customer receiving this estimate."); return; }
    navigation.navigate("EstimateItems");
  }

  function onDate(selected?: Date) {
    if (Platform.OS === "android") setDateOpen(false);
    if (!selected) return;
    const estimateDate = `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}-${String(selected.getDate()).padStart(2, "0")}`;
    updateDraft({ estimateDate, validUntil: addDaysYmd(estimateDate, draft.validityDays) });
  }

  return <ScreenContainer>
    <ScreenHeader title="Create Estimate" back rightLabel="Save Draft" onRightPress={save} />
    <DocumentProgress active={1} labels={estimateProgressLabels} />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <FormField label="Estimate Number" icon="document-outline" value={draft.estimateNumber} onChangeText={(estimateNumber) => updateDraft({ estimateNumber })} required />
        <DateRow label="Estimate Date" value={formatDate(draft.estimateDate)} onPress={() => setDateOpen(true)} />
        <SelectField label="Customer" icon="person-outline" value={customer?.name ?? "Select a customer"} onPress={() => setCustomerOpen(true)} required />
        {customer ? <AppCard style={styles.customerCard}><InitialsAvatar name={customer.name} size={40} /><View style={{ flex: 1 }}><Text style={styles.customerName}>{customer.name}</Text><Text style={styles.customerMeta}>{customer.billingAddress || customer.email}</Text></View><StatusBadge status={customer.status} /></AppCard> : null}
        <FormField label="Reference" icon="bookmark-outline" value={draft.reference} onChangeText={(reference) => updateDraft({ reference })} placeholder="Website project, Q4 campaign" />
      </ScrollView>
      {dateOpen ? <View style={styles.datePicker}><DateTimePicker value={new Date(`${draft.estimateDate}T12:00:00`)} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={(_, selected) => onDate(selected)} />{Platform.OS === "ios" ? <Pressable onPress={() => setDateOpen(false)}><Text style={styles.done}>Done</Text></Pressable> : null}</View> : null}
      <EstimateFlowFooter nextLabel="Next: Add Items" onNext={continueFlow} />
    </KeyboardAvoidingView>
    <CustomerPickerSheet visible={customerOpen} selectedId={draft.customerId} onSelect={(customerId) => { updateDraft({ customerId }); setCustomerOpen(false); }} onClose={() => setCustomerOpen(false)} />
  </ScreenContainer>;
}

export function EstimateItemsScreen() {
  const navigation = useNavigation<RootNav>();
  const { draft, addItem, updateItem, removeItem } = useEstimateFlow();
  const { items } = useSalesSetup();
  const { currency, formatMoney } = usePreferences();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [rate, setRate] = useState("");

  function add() {
    const qty = Number(quantity);
    const unitRate = Number(rate.replace(/,/g, ""));
    if (!name.trim() || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(unitRate) || unitRate < 0) { Alert.alert("Check item details", "Enter a name, quantity above zero, and a valid rate."); return; }
    addItem({ id: `estimate-line-${Date.now()}`, name: name.trim(), description: description.trim(), quantity: qty, rate: unitRate });
    setName(""); setDescription(""); setQuantity("1"); setRate(""); setAdding(false);
  }

  function addCatalog(itemId: string) {
    const item = items.find((row) => row.id === itemId);
    if (!item) return;
    addItem({ id: `estimate-line-${Date.now()}-${item.id}`, catalogItemId: item.id, name: item.name, description: item.description, quantity: 1, rate: item.unitPrice });
  }

  return <ScreenContainer>
    <ScreenHeader title="Add Items" back />
    <DocumentProgress active={2} labels={estimateProgressLabels} />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {draft.items.map((item) => <AppCard key={item.id} style={styles.itemCard}>
        <View style={styles.itemHead}><IconTile icon={item.catalogItemId ? "cube-outline" : "code-slash-outline"} tone="blue" size={38} /><View style={{ flex: 1 }}><Text style={styles.itemName}>{item.name}</Text><Text style={styles.itemMeta} numberOfLines={2}>{item.description || "No description"}</Text></View><Pressable onPress={() => Alert.alert("Remove item?", item.name, [{ text: "Cancel", style: "cancel" }, { text: "Remove", style: "destructive", onPress: () => removeItem(item.id) }])}><Ionicons name="ellipsis-vertical" size={19} color={colors.gray500} /></Pressable></View>
        <View style={styles.itemMath}><TextInput value={String(item.quantity)} onChangeText={(value) => updateItem(item.id, { quantity: Math.max(0, Number(value) || 0) })} keyboardType="decimal-pad" style={styles.mathInput} accessibilityLabel={`${item.name} quantity`} /><Text style={styles.times}>×</Text><TextInput value={String(item.rate)} onChangeText={(value) => updateItem(item.id, { rate: Math.max(0, Number(value.replace(/,/g, "")) || 0) })} keyboardType="decimal-pad" style={[styles.mathInput, styles.rateInput]} accessibilityLabel={`${item.name} rate`} /><Text style={styles.equals}>=</Text><Text style={styles.lineAmount}>{formatMoney(item.quantity * item.rate)}</Text></View>
      </AppCard>)}
      {!adding ? <AppButton label="Add Item" icon="add" variant="secondary" onPress={() => setAdding(true)} /> : <AppCard style={styles.addCard}>
        <Text style={styles.sectionTitle}>Add a custom item</Text>
        <FormField label="Service or Product Name" icon="cube-outline" value={name} onChangeText={setName} placeholder="Website Design" required />
        <View style={styles.twoColumns}><View style={{ flex: 1 }}><FormField label="Quantity" icon="layers-outline" value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" required /></View><View style={{ flex: 1 }}><FormField label={`Rate (${currency})`} icon="cash-outline" value={rate} onChangeText={setRate} keyboardType="decimal-pad" required /></View></View>
        <FormField label="Description" icon="document-text-outline" value={description} onChangeText={setDescription} multiline />
        <View style={styles.inlineButtons}><AppButton label="Cancel" variant="secondary" onPress={() => setAdding(false)} style={{ flex: 1 }} /><AppButton label="Add" icon="add" onPress={add} style={{ flex: 1 }} /></View>
      </AppCard>}
      <Text style={styles.sectionTitle}>Items & Services</Text>
      <AppCard style={styles.catalogCard}>{items.filter((item) => item.active).slice(0, 4).map((item, index, rows) => <Pressable key={item.id} onPress={() => addCatalog(item.id)} style={[styles.catalogRow, index < rows.length - 1 && styles.divider]}><View style={{ flex: 1 }}><Text style={styles.itemName}>{item.name}</Text><Text style={styles.itemMeta}>{formatMoney(item.unitPrice)} / {item.kind === "service" ? "hour" : "unit"}</Text></View><View style={styles.addSmall}><Ionicons name="add" size={18} color={colors.primary} /></View></Pressable>)}</AppCard>
      <View style={styles.itemsTotal}><Text style={styles.itemMeta}>{draft.items.length} items</Text><Text style={styles.itemTotal}>{formatMoney(draft.items.reduce((sum, item) => sum + item.quantity * item.rate, 0))}</Text></View>
    </ScrollView>
    <EstimateFlowFooter onBack={() => navigation.goBack()} nextLabel="Next: Totals" onNext={() => navigation.navigate("EstimateTotals")} disabled={!draft.items.length} />
  </ScreenContainer>;
}

export function EstimateTotalsScreen() {
  const navigation = useNavigation<RootNav>();
  const { draft, updateDraft } = useEstimateFlow();
  const { currency, formatMoney } = usePreferences();
  const pick = usePicker();
  const [discount, setDiscount] = useState(draft.discountValue ? String(draft.discountValue) : "");
  const totals = calculateEstimateTotals(draft);
  const numberValue = (value: string) => { const parsed = Number(value.replace(/,/g, "")); return Number.isFinite(parsed) ? Math.max(0, parsed) : 0; };

  return <ScreenContainer>
    <ScreenHeader title="Discount & Totals" back />
    <DocumentProgress active={3} labels={estimateProgressLabels} />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.summaryLine}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryValue}>{formatMoney(totals.subtotal)}</Text></View>
      <Text style={styles.label}>Discount</Text>
      <SegmentedTabs options={["Percentage", "Fixed"] as const} value={draft.discountType === "percentage" ? "Percentage" : "Fixed"} onChange={(value) => updateDraft({ discountType: (value === "Percentage" ? "percentage" : "fixed") as DiscountType })} />
      <View style={styles.discountRow}><View style={{ flex: 1 }}><FormField label="Value" icon="pricetag-outline" value={discount} onChangeText={(value) => { setDiscount(value); updateDraft({ discountValue: numberValue(value) }); }} keyboardType="decimal-pad" suffix={draft.discountType === "percentage" ? "%" : undefined} prefix={draft.discountType === "fixed" ? (currency === "USD" ? "$" : currency) : undefined} /></View><Text style={styles.negative}>-{formatMoney(totals.discountAmount)}</Text></View>
      <SelectField label="Tax" icon="receipt-outline" value={draft.taxRate > 0 ? `${draft.taxLabel} (${draft.taxRate}%)` : "No tax"} onPress={() => pick("Tax rate", ["No tax", "Sales Tax (5%)", "Sales Tax (8.25%)", "Sales Tax (10%)"], (value) => updateDraft({ taxRate: Number(value.match(/[\d.]+/)?.[0] ?? 0), taxLabel: value === "No tax" ? draft.taxLabel : "Sales Tax" }))} />
      <AppCard style={styles.totalCard}>
        <View style={styles.totalSmall}><Text style={styles.itemMeta}>Subtotal</Text><Text style={styles.itemMeta}>{formatMoney(totals.subtotal)}</Text></View>
        <View style={styles.totalSmall}><Text style={styles.itemMeta}>Discount ({draft.discountType === "percentage" ? `${draft.discountValue}%` : "fixed"})</Text><Text style={styles.negative}>-{formatMoney(totals.discountAmount)}</Text></View>
        <View style={styles.totalSmall}><Text style={styles.itemMeta}>{draft.taxLabel} ({draft.taxRate}%)</Text><Text style={styles.itemMeta}>{formatMoney(totals.taxAmount)}</Text></View>
        <View style={styles.grandTotal}><Text style={styles.totalLabel}>Total ({currency})</Text><Text style={styles.totalValue}>{formatMoney(totals.total)}</Text></View>
      </AppCard>
    </ScrollView>
    <EstimateFlowFooter onBack={() => navigation.goBack()} nextLabel="Next: Extras" onNext={() => navigation.navigate("EstimateExtras")} />
  </ScreenContainer>;
}

export function EstimateExtrasScreen() {
  const navigation = useNavigation<RootNav>();
  const { draft, updateDraft, saveEstimate } = useEstimateFlow();
  const pick = usePicker();
  const [attaching, setAttaching] = useState(false);

  async function addAttachment() {
    setAttaching(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const directory = new Directory(Paths.document, "ReceiptCycle", "EstimateAttachments");
      directory.create({ idempotent: true, intermediates: true });
      const destination = new File(directory, `${Date.now()}-${asset.name.replace(/[^A-Za-z0-9._-]/g, "-")}`);
      new File(asset.uri).copy(destination);
      updateDraft({ attachments: [...draft.attachments, { name: asset.name, uri: destination.uri, mimeType: asset.mimeType ?? "application/octet-stream" }] });
    } catch { Alert.alert("Attachment unavailable", "The selected file could not be saved."); }
    finally { setAttaching(false); }
  }

  function create() {
    const saved = saveEstimate("draft");
    if (!saved) { Alert.alert("Estimate incomplete", "Choose a customer before creating this estimate."); return; }
    navigation.navigate("EstimatePreview");
  }

  return <ScreenContainer>
    <ScreenHeader title="Estimate Extras" back />
    <DocumentProgress active={4} labels={estimateProgressLabels} />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <FormField label="Terms & Conditions" icon="document-text-outline" value={draft.terms} onChangeText={(terms) => updateDraft({ terms })} multiline />
      <SelectField label="Validity Period" icon="calendar-outline" value={`${draft.validityDays} days`} onPress={() => pick("Validity period", ["7 days", "14 days", "30 days", "60 days", "90 days"], (value) => { const validityDays = Number(value.match(/\d+/)?.[0] ?? 30); updateDraft({ validityDays, validUntil: addDaysYmd(draft.estimateDate, validityDays) }); })} />
      <View style={styles.switchRow}><View style={{ flex: 1 }}><Text style={styles.switchTitle}>Customer Signature</Text><Text style={styles.itemMeta}>Include an approval signature field.</Text></View><Switch value={draft.customerSignatureEnabled} onValueChange={(customerSignatureEnabled) => updateDraft({ customerSignatureEnabled })} trackColor={{ false: colors.gray200, true: "#82d8c7" }} thumbColor={draft.customerSignatureEnabled ? colors.primary : "#fff"} /></View>
      {draft.customerSignatureEnabled ? <View style={styles.signatureBox}><FormField label="Signature" icon="pencil-outline" value={draft.signatureText} onChangeText={(signatureText) => updateDraft({ signatureText })} placeholder="Customer name" /><Text style={styles.signaturePreview}>{draft.signatureText || "Tap to add signature"}</Text></View> : null}
      <Text style={styles.sectionTitle}>Attachments</Text>
      {draft.attachments.map((attachment) => <AppCard key={attachment.uri} style={styles.attachmentRow}><Ionicons name="attach-outline" size={21} color={colors.primary} /><View style={{ flex: 1 }}><Text style={styles.itemName} numberOfLines={1}>{attachment.name}</Text><Text style={styles.itemMeta}>{attachment.mimeType}</Text></View><Pressable onPress={() => updateDraft({ attachments: draft.attachments.filter((item) => item.uri !== attachment.uri) })}><Ionicons name="close" size={20} color={colors.gray500} /></Pressable></AppCard>)}
      <AppButton label={attaching ? "Adding attachment..." : "Add Attachment"} icon="add" variant="secondary" disabled={attaching} onPress={() => void addAttachment()} />
    </ScrollView>
    <EstimateFlowFooter onBack={() => navigation.goBack()} nextLabel="Create Estimate" nextIcon="checkmark" onNext={create} />
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  fieldBlock: { marginBottom: spacing.md },
  label: { color: colors.gray700, fontSize: uiType.secondary, fontWeight: "700", marginBottom: 5 },
  dateRow: { minHeight: 46, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.medium, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md },
  dateValue: { color: colors.textPrimary, fontSize: uiType.body },
  datePicker: { backgroundColor: colors.surface, paddingHorizontal: spacing.lg },
  done: { textAlign: "right", color: colors.primary, fontWeight: "800", paddingVertical: spacing.sm },
  customerCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: -spacing.xs, marginBottom: spacing.md },
  customerName: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
  customerMeta: { color: colors.gray500, fontSize: uiType.caption, lineHeight: 15, marginTop: 3 },
  itemCard: { marginBottom: spacing.sm },
  itemHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  itemName: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
  itemMeta: { color: colors.gray500, fontSize: uiType.caption, marginTop: 3 },
  itemMath: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md },
  mathInput: { width: 54, height: 38, borderWidth: 1, borderColor: colors.border, borderRadius: radius.small, textAlign: "center", color: colors.textPrimary, backgroundColor: colors.surface },
  rateInput: { width: 82 },
  times: { color: colors.gray500 },
  equals: { color: colors.gray500 },
  lineAmount: { flex: 1, color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800", textAlign: "right" },
  addCard: { marginTop: spacing.sm, marginBottom: spacing.lg },
  sectionTitle: { color: colors.textPrimary, fontSize: uiType.sectionTitle, fontWeight: "800", marginTop: spacing.lg, marginBottom: spacing.sm },
  twoColumns: { flexDirection: "row", gap: spacing.sm },
  inlineButtons: { flexDirection: "row", gap: spacing.sm },
  catalogCard: { paddingVertical: 0 },
  catalogRow: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  addSmall: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.mintSoft, alignItems: "center", justifyContent: "center" },
  itemsTotal: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.lg },
  itemTotal: { color: colors.textPrimary, fontSize: uiType.body, fontWeight: "900" },
  summaryLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xl },
  summaryLabel: { color: colors.gray600, fontSize: uiType.body },
  summaryValue: { color: colors.textPrimary, fontSize: uiType.body, fontWeight: "900" },
  discountRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  negative: { color: colors.danger, fontSize: uiType.secondary, fontWeight: "800" },
  totalCard: { backgroundColor: colors.mintSoft, borderColor: "#d6eee7", marginTop: spacing.lg },
  totalSmall: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 },
  grandTotal: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: "#cde7df", marginTop: spacing.sm, paddingTop: spacing.md },
  totalLabel: { color: colors.textPrimary, fontSize: uiType.body, fontWeight: "900" },
  totalValue: { color: colors.primary, fontSize: 20, fontWeight: "900" },
  switchRow: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: spacing.md },
  switchTitle: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
  signatureBox: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.medium, padding: spacing.md, backgroundColor: colors.surface },
  signaturePreview: { color: colors.textPrimary, fontSize: 26, fontStyle: "italic", textAlign: "center", paddingVertical: spacing.md },
  attachmentRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
});
