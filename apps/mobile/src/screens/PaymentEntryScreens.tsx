import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useMutation } from "../lib/api";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../lib/api";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppButton, AppCard, EmptyState, FormField, IconTile, ScreenContainer, SearchInput, SegmentedTabs, SelectField } from "../components/ui/FinanceUI";
import { SafeActionFooter } from "../components/ui/SafeActionFooter";
import { InitialsAvatar } from "../components/ui/SalesSetupUI";
import { usePaymentFlow } from "../contexts/PaymentFlowContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { accountType } from "../features/money/model";
import { useAccountsData } from "../features/money/useMoneyData";
import type { PaymentInvoice, PaymentMethod } from "../features/payments/model";
import { userFacingErrorFromUnknown } from "../lib/userFacingErrors";
import type { RootStackParamList } from "../navigation/types";
import { colors, radius, spacing, uiType } from "../theme/tokens";

type RootNav = NativeStackNavigationProp<RootStackParamList>;

export function PaymentCreateScreen() {
  const navigation = useNavigation<RootNav>();
  const { draft, availableInvoices, updateDraft, recordPayment } = usePaymentFlow();
  const { currency, formatMoney, formatDate } = usePreferences();
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [amount, setAmount] = useState(draft.amount ? String(draft.amount) : "");
  const [saving, setSaving] = useState(false);
  const invoice = availableInvoices.find((item) => item.invoiceNumber === draft.invoiceNumber);
  const balance = invoice ? Math.max(0, invoice.total - invoice.amountPaid) : 0;

  function onDate(selected?: Date) {
    if (Platform.OS === "android") setDateOpen(false);
    if (!selected) return;
    updateDraft({ paymentDate: `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}-${String(selected.getDate()).padStart(2, "0")}` });
  }

  async function save() {
    if (!draft.invoiceNumber) { Alert.alert("Choose an invoice", "Select the invoice this payment should be applied to."); return; }
    if (!draft.accountId) { Alert.alert("Choose an account", "Select the account receiving this payment."); return; }
    const numeric = Number(amount.replace(/,/g, ""));
    if (!Number.isFinite(numeric) || numeric <= 0) { Alert.alert("Amount required", "Enter an amount greater than zero."); return; }
    setSaving(true);
    try {
      const payment = await recordPayment(numeric);
      navigation.replace("PaymentConfirmation", { paymentId: payment.id });
    } catch (error) { Alert.alert("Could not record payment", userFacingErrorFromUnknown(error)); }
    finally { setSaving(false); }
  }

  return <ScreenContainer>
    <ScreenHeader title="Record Payment" back />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <SelectField label="Invoice" icon="document-text-outline" value={invoice ? `${invoice.invoiceNumber} · ${formatMoney(balance)} due` : "Choose an invoice"} onPress={() => setInvoiceOpen(true)} required />
        {invoice ? <AppCard style={styles.customerCard}><InitialsAvatar name={invoice.customerName} size={38} /><View style={{ flex: 1 }}><Text style={styles.customerName}>{invoice.customerName}</Text><Text style={styles.customerMeta}>Balance due {formatMoney(balance)}</Text></View><Pressable onPress={() => navigation.navigate("PaymentInvoiceDetail", { invoiceNumber: invoice.invoiceNumber })}><Ionicons name="chevron-forward" size={19} color={colors.primary} /></Pressable></AppCard> : null}
        <FormField label="Amount Received" icon="cash-outline" prefix={currency === "USD" ? "$" : currency} value={amount} onChangeText={(value) => { setAmount(value); const parsed = Number(value.replace(/,/g, "")); updateDraft({ amount: Number.isFinite(parsed) ? parsed : 0 }); }} placeholder="0.00" keyboardType="decimal-pad" required />
        <View style={styles.fieldBlock}><Text style={styles.label}>Payment Date <Text style={{ color: colors.rose600 }}>*</Text></Text><Pressable style={styles.dateRow} onPress={() => setDateOpen(true)}><Ionicons name="calendar-outline" size={18} color={colors.primary} /><Text style={styles.dateValue}>{formatDate(draft.paymentDate)}</Text><Ionicons name="calendar" size={18} color={colors.gray500} /></Pressable></View>
        <SelectField label="Payment Method & Account" icon="card-outline" value={draft.accountName ? `${draft.method} · ${draft.accountName}` : "Choose method and account"} onPress={() => navigation.navigate("PaymentMethod")} required />
        <FormField label="Note" icon="document-text-outline" value={draft.note} onChangeText={(note) => updateDraft({ note })} placeholder="First installment payment" multiline />
      </ScrollView>
      {dateOpen ? <View style={styles.datePicker}><DateTimePicker value={new Date(`${draft.paymentDate}T12:00:00`)} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={(_, selected) => onDate(selected)} />{Platform.OS === "ios" ? <Pressable onPress={() => setDateOpen(false)}><Text style={styles.done}>Done</Text></Pressable> : null}</View> : null}
      <SafeActionFooter><AppButton label={saving ? "Recording Payment..." : "Save Payment"} onPress={() => void save()} disabled={saving || !invoice || !draft.accountId || !(Number(amount) > 0) || Number(amount) > balance} /></SafeActionFooter>
    </KeyboardAvoidingView>
    <InvoicePicker visible={invoiceOpen} invoices={availableInvoices} selected={draft.invoiceNumber} onClose={() => setInvoiceOpen(false)} onSelect={(invoiceNumber) => { updateDraft({ invoiceNumber, amount: 0 }); setAmount(""); setInvoiceOpen(false); }} />
  </ScreenContainer>;
}

function InvoicePicker({ visible, invoices, selected, onClose, onSelect }: { visible: boolean; invoices: PaymentInvoice[]; selected: string | null; onClose: () => void; onSelect: (invoiceNumber: string) => void }) {
  const { formatMoney, formatDate } = usePreferences();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"Open" | "Overdue" | "All">("Open");
  const [choice, setChoice] = useState(selected);
  useEffect(() => { if (visible) setChoice(selected); }, [selected, visible]);
  const rows = useMemo(() => invoices.filter((invoice) => (filter === "All" || filter === "Open" && invoice.status !== "overdue" || filter === "Overdue" && invoice.status === "overdue") && (!search.trim() || `${invoice.invoiceNumber} ${invoice.customerName}`.toLowerCase().includes(search.trim().toLowerCase()))), [filter, invoices, search]);
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={styles.backdrop} onPress={onClose}><Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
      <View style={styles.handle} /><View style={styles.sheetHead}><Text style={styles.sheetTitle}>Choose Invoice</Text><Pressable onPress={onClose} accessibilityLabel="Close invoice picker"><Ionicons name="close" size={23} color={colors.gray600} /></Pressable></View>
      <SearchInput value={search} onChangeText={setSearch} placeholder="Search invoices or customers" />
      <View style={{ marginTop: spacing.md }}><SegmentedTabs options={["Open", "Overdue", "All"] as const} value={filter} onChange={setFilter} /></View>
      <ScrollView style={styles.invoiceList}>
        {rows.map((invoice) => <Pressable key={`${invoice.preview}-${invoice.invoiceNumber}`} style={styles.invoiceRow} onPress={() => setChoice(invoice.invoiceNumber)} accessibilityRole="radio" accessibilityState={{ checked: choice === invoice.invoiceNumber }}>
          <Ionicons name={choice === invoice.invoiceNumber ? "radio-button-on" : "radio-button-off"} size={21} color={choice === invoice.invoiceNumber ? colors.primary : colors.gray400} />
          <InitialsAvatar name={invoice.customerName} size={36} /><View style={{ flex: 1 }}><Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text><Text style={styles.customerMeta}>{invoice.customerName}</Text><Text style={[styles.due, invoice.status === "overdue" && { color: colors.danger }]}>Due {formatDate(invoice.dueDate)}</Text></View><View style={{ alignItems: "flex-end" }}><Text style={styles.invoiceAmount}>{formatMoney(invoice.total)}</Text><Text style={styles.customerMeta}>Balance</Text><Text style={styles.customerMeta}>{formatMoney(invoice.total - invoice.amountPaid)}</Text></View>
        </Pressable>)}
        {!rows.length ? <EmptyState icon="document-text-outline" title="No invoices found" description="Try another search or status." /> : null}
      </ScrollView>
      <AppButton label="Select Invoice" onPress={() => choice && onSelect(choice)} disabled={!choice} />
    </Pressable></Pressable>
  </Modal>;
}

const methods: { value: PaymentMethod; icon: "cash-outline" | "business-outline" | "card-outline" | "phone-portrait-outline"; tone: "mint" | "blue" | "purple" }[] = [
  { value: "Cash", icon: "cash-outline", tone: "mint" }, { value: "Bank Transfer", icon: "business-outline", tone: "blue" },
  { value: "Card", icon: "card-outline", tone: "blue" }, { value: "Mobile Money", icon: "phone-portrait-outline", tone: "purple" },
];

export function PaymentMethodScreen() {
  const navigation = useNavigation<RootNav>();
  const { draft, updateDraft } = usePaymentFlow();
  const { workspace, ready, accounts, loading } = useAccountsData();
  const ensure = useMutation(api.accounts.ensureSeed);
  useEffect(() => { if (ready) void ensure({ workspace }); }, [ensure, ready, workspace]);

  return <ScreenContainer>
    <ScreenHeader title="Payment Method & Account" back />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Select Payment Method</Text>
      <View style={styles.methodGrid}>{methods.map((method) => <Pressable key={method.value} onPress={() => updateDraft({ method: method.value })} style={[styles.methodCard, draft.method === method.value && styles.methodSelected]} accessibilityRole="radio" accessibilityState={{ checked: draft.method === method.value }}><IconTile icon={method.icon} tone={method.tone} size={44} />{draft.method === method.value ? <Ionicons name="checkmark-circle" size={21} color={colors.primary} style={styles.methodCheck} /> : null}<Text style={styles.methodLabel}>{method.value}</Text></Pressable>)}</View>
      <Text style={styles.sectionTitle}>Receive Into Account</Text>
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} /> : accounts.map((account) => { const type = accountType(account.iconKey); return <Pressable key={account.id} onPress={() => updateDraft({ accountId: account.id, accountName: account.name })} style={[styles.accountRow, draft.accountId === account.id && styles.accountSelected]} accessibilityRole="radio" accessibilityState={{ checked: draft.accountId === account.id }}><Ionicons name={draft.accountId === account.id ? "radio-button-on" : "radio-button-off"} size={21} color={draft.accountId === account.id ? colors.primary : colors.gray400} /><IconTile icon={type.icon} tone="blue" size={36} /><View style={{ flex: 1 }}><Text style={styles.accountName}>{account.name}</Text><Text style={styles.customerMeta}>{type.label} account · balance available</Text></View></Pressable>; })}
      {!loading && !accounts.length ? <EmptyState icon="wallet-outline" title="No accounts" description="Add an account before recording a payment." /> : null}
    </ScrollView>
    <SafeActionFooter><AppButton label="Confirm Selection" onPress={() => navigation.goBack()} disabled={!draft.accountId} /></SafeActionFooter>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  customerCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: -spacing.xs, marginBottom: spacing.md },
  customerName: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
  customerMeta: { color: colors.gray500, fontSize: uiType.caption, marginTop: 3 },
  fieldBlock: { marginBottom: spacing.md },
  label: { color: colors.gray700, fontSize: uiType.secondary, fontWeight: "700", marginBottom: 5 },
  dateRow: { minHeight: 46, flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.medium, backgroundColor: colors.surface, paddingHorizontal: spacing.md },
  dateValue: { flex: 1, color: colors.textPrimary, fontSize: uiType.body },
  datePicker: { backgroundColor: colors.surface, paddingHorizontal: spacing.lg },
  done: { color: colors.primary, fontWeight: "800", textAlign: "right", paddingVertical: spacing.sm },
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15,23,42,0.47)" },
  sheet: { maxHeight: "88%", backgroundColor: colors.surface, borderTopLeftRadius: radius.extraLarge, borderTopRightRadius: radius.extraLarge, padding: spacing.lg },
  handle: { width: 32, height: 4, backgroundColor: colors.gray400, borderRadius: 2, alignSelf: "center", marginBottom: spacing.md },
  sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  sheetTitle: { color: colors.textPrimary, fontSize: uiType.screenTitle, fontWeight: "900" },
  invoiceList: { maxHeight: 450, marginBottom: spacing.md },
  invoiceRow: { minHeight: 78, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider, paddingVertical: spacing.sm },
  invoiceNumber: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
  due: { color: colors.gray500, fontSize: uiType.caption, marginTop: 2 },
  invoiceAmount: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "900" },
  sectionTitle: { color: colors.textPrimary, fontSize: uiType.sectionTitle, fontWeight: "900", marginBottom: spacing.md },
  methodGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.xl },
  methodCard: { width: "48%", minHeight: 112, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.medium, alignItems: "center", justifyContent: "center", gap: spacing.sm, position: "relative" },
  methodSelected: { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.surfaceSoft },
  methodCheck: { position: "absolute", right: 7, top: 7 },
  methodLabel: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
  accountRow: { minHeight: 67, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.medium, backgroundColor: colors.surface, padding: spacing.sm, marginBottom: spacing.sm },
  accountSelected: { borderColor: colors.primary, backgroundColor: colors.surfaceSoft },
  accountName: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
});
