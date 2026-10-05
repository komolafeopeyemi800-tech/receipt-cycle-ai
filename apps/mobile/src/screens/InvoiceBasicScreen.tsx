import { useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppButton, AppCard, FormField, ScreenContainer, SearchInput, SegmentedTabs, SelectField, StatusBadge } from "../components/ui/FinanceUI";
import { DocumentProgress } from "../components/ui/SalesDocumentUI";
import { InitialsAvatar } from "../components/ui/SalesSetupUI";
import { useInvoiceFlow } from "../contexts/InvoiceFlowContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useSalesSetup } from "../contexts/SalesSetupContext";
import { addDaysYmd } from "../features/invoices/model";
import type { SalesCustomer } from "../features/sales/setupData";
import type { RootStackParamList } from "../navigation/types";
import { colors, radius, spacing, uiType } from "../theme/tokens";

type RootNav = NativeStackNavigationProp<RootStackParamList>;
type CustomerKind = "Individual" | "Business";

export function InvoiceBasicScreen() {
  const navigation = useNavigation<RootNav>();
  const { draft, updateDraft, saveDraft } = useInvoiceFlow();
  const { customers } = useSalesSetup();
  const { formatDate } = usePreferences();
  const [dateTarget, setDateTarget] = useState<"issue" | "due" | null>(null);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const customer = customers.find((item) => item.id === draft.customerId);

  function saveCurrentDraft() {
    if (!customer) { Alert.alert("Choose a customer", "Select a customer before saving this draft."); return; }
    saveDraft("draft");
    Alert.alert("Draft saved", `${draft.invoiceNumber} is saved on this device.`);
  }

  function continueFlow() {
    if (!draft.invoiceNumber.trim()) { Alert.alert("Invoice number required", "Enter an invoice number before continuing."); return; }
    if (!customer) { Alert.alert("Choose a customer", "Select or add the customer receiving this invoice."); return; }
    if (draft.dueDate < draft.issueDate) { Alert.alert("Check the due date", "The due date cannot be before the issue date."); return; }
    navigation.navigate("InvoiceLineItem");
  }

  function onDate(selected?: Date) {
    if (Platform.OS === "android") setDateTarget(null);
    if (!selected || !dateTarget) return;
    const value = `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}-${String(selected.getDate()).padStart(2, "0")}`;
    if (dateTarget === "issue") updateDraft({ issueDate: value, ...(draft.dueDate < value ? { dueDate: addDaysYmd(value, 30) } : {}) });
    else updateDraft({ dueDate: value });
  }

  return <ScreenContainer>
    <ScreenHeader title="Create Invoice" back rightLabel="Save Draft" onRightPress={saveCurrentDraft} />
    <DocumentProgress active={1} />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <FormField label="Invoice Number" icon="document-text-outline" value={draft.invoiceNumber} onChangeText={(invoiceNumber) => updateDraft({ invoiceNumber })} required />
        <DateRow label="Issue Date" value={formatDate(draft.issueDate)} onPress={() => setDateTarget("issue")} />
        <DateRow label="Due Date" value={`${formatDate(draft.dueDate)} (${draft.terms})`} onPress={() => setDateTarget("due")} />
        <SelectField label="Customer" icon="person-outline" value={customer?.name ?? "Select a customer"} onPress={() => setCustomerPickerOpen(true)} required />
        {customer ? <AppCard style={styles.selectedCustomer}><InitialsAvatar name={customer.name} size={38} /><View style={{ flex: 1 }}><Text style={styles.customerName}>{customer.name}</Text><Text style={styles.customerMeta}>{customer.email || customer.phone || "Customer selected"}</Text></View><StatusBadge status={customer.status} /></AppCard> : null}
        <AppCard style={styles.nextCard}><View style={styles.nextIcon}><Ionicons name="receipt-outline" size={22} color="#fff" /></View><View style={{ flex: 1 }}><Text style={styles.nextTitle}>Next step</Text><Text style={styles.nextCopy}>Add line items, then adjust tax, discount, and extras.</Text></View></AppCard>
      </ScrollView>
      {dateTarget ? <View style={styles.datePickerWrap}><DateTimePicker value={new Date(`${dateTarget === "issue" ? draft.issueDate : draft.dueDate}T12:00:00`)} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={(_, selected) => onDate(selected)} />{Platform.OS === "ios" ? <Pressable onPress={() => setDateTarget(null)}><Text style={styles.done}>Done</Text></Pressable> : null}</View> : null}
      <View style={styles.footer}><AppButton label="Continue to Items" icon="arrow-forward" onPress={continueFlow} /></View>
    </KeyboardAvoidingView>
    <CustomerPickerSheet visible={customerPickerOpen} selectedId={draft.customerId} onSelect={(customerId) => { updateDraft({ customerId }); setCustomerPickerOpen(false); }} onClose={() => setCustomerPickerOpen(false)} />
  </ScreenContainer>;
}

function DateRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return <View style={styles.fieldBlock}><Text style={styles.label}>{label}</Text><Pressable onPress={onPress} style={styles.dateRow} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`}><Text style={styles.dateValue}>{value}</Text><Ionicons name="calendar-outline" size={19} color={colors.primary} /></Pressable></View>;
}

export function CustomerPickerSheet({ visible, selectedId, onSelect, onClose }: { visible: boolean; selectedId: string | null; onSelect: (id: string) => void; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { customers, saveCustomer } = useSalesSetup();
  const [mode, setMode] = useState<"list" | "add">("list");
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<CustomerKind>("Individual");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const rows = useMemo(() => customers.filter((customer) => customer.status !== "inactive" && (!search.trim() || `${customer.name} ${customer.businessName} ${customer.email}`.toLowerCase().includes(search.trim().toLowerCase()))), [customers, search]);

  function close() { setMode("list"); onClose(); }
  function addCustomer() {
    const displayName = kind === "Business" ? businessName.trim() : name.trim();
    if (!displayName) { Alert.alert(`${kind} name required`, `Enter a ${kind.toLowerCase()} name before adding this customer.`); return; }
    const id = saveCustomer({ name: displayName, businessName: kind === "Business" ? displayName : "", email: email.trim(), phone: phone.trim(), billingAddress: address.trim(), taxId: "", notes: notes.trim(), status: "active" });
    onSelect(id);
    setName(""); setBusinessName(""); setEmail(""); setPhone(""); setAddress(""); setNotes("");
    setMode("list");
  }

  return <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
    <Pressable style={styles.backdrop} onPress={close}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ justifyContent: "flex-end" }}>
        <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.sheetHead}><Text style={styles.sheetTitle}>{mode === "add" ? "Add Customer" : "Select Customer"}</Text><Pressable onPress={close} accessibilityLabel="Close customer sheet"><Ionicons name="close" size={24} color={colors.gray600} /></Pressable></View>
          {mode === "list" ? <>
            <SearchInput value={search} onChangeText={setSearch} placeholder="Search customers..." />
            <ScrollView style={styles.customerList} keyboardShouldPersistTaps="handled">
              {rows.map((customer) => <Pressable key={customer.id} onPress={() => onSelect(customer.id)} style={[styles.customerRow, selectedId === customer.id && styles.customerRowSelected]}><InitialsAvatar name={customer.name} size={40} /><View style={{ flex: 1 }}><Text style={styles.customerName}>{customer.name}</Text><Text style={styles.customerMeta}>{customer.email || customer.phone || "No contact details"}</Text></View>{selectedId === customer.id ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : <Ionicons name="chevron-forward" size={18} color={colors.gray400} />}</Pressable>)}
            </ScrollView>
            <AppButton label="Add new customer" icon="add" onPress={() => setMode("add")} />
          </> : <ScrollView style={styles.addForm} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <SegmentedTabs options={["Individual", "Business"] as const} value={kind} onChange={setKind} />
            {kind === "Individual" ? <FormField label="Full Name" icon="person-outline" value={name} onChangeText={setName} placeholder="Sarah Chen" required /> : <FormField label="Business Name" icon="business-outline" value={businessName} onChangeText={setBusinessName} placeholder="Bright Co" required />}
            <FormField label="Email" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="sarah@brightco.com" keyboardType="email-address" autoCapitalize="none" />
            <FormField label="Phone" icon="call-outline" value={phone} onChangeText={setPhone} placeholder="+1 415 555 0123" keyboardType="phone-pad" />
            <FormField label="Address" icon="location-outline" value={address} onChangeText={setAddress} placeholder={'123 Market Street\nSan Francisco, CA 94103'} multiline />
            <FormField label="Notes" icon="document-text-outline" value={notes} onChangeText={setNotes} placeholder="Preferred payment method..." multiline />
            <AppButton label="Add Customer" onPress={addCustomer} />
            <Pressable onPress={() => setMode("list")} style={styles.backToList}><Text style={styles.backToListText}>Back to customer list</Text></Pressable>
          </ScrollView>}
        </Pressable>
      </KeyboardAvoidingView>
    </Pressable>
  </Modal>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  fieldBlock: { marginBottom: spacing.md },
  label: { fontSize: uiType.secondary, color: colors.gray700, fontWeight: "600", marginBottom: 5 },
  dateRow: { minHeight: 46, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.medium, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md },
  dateValue: { color: colors.textPrimary, fontSize: uiType.body },
  selectedCustomer: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: -spacing.xs, marginBottom: spacing.lg },
  customerName: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
  customerMeta: { color: colors.gray500, fontSize: uiType.caption, marginTop: 3 },
  nextCard: { backgroundColor: colors.mintSoft, borderColor: "#d8f2ea", flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.sm },
  nextIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  nextTitle: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
  nextCopy: { color: colors.gray600, fontSize: uiType.secondary, lineHeight: 18, marginTop: 3 },
  datePickerWrap: { backgroundColor: colors.surface, paddingHorizontal: spacing.lg },
  done: { textAlign: "right", color: colors.primary, fontWeight: "800", paddingVertical: spacing.sm },
  footer: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider, padding: spacing.lg },
  backdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.48)", justifyContent: "flex-end" },
  sheet: { maxHeight: "88%", backgroundColor: colors.surface, borderTopLeftRadius: radius.extraLarge, borderTopRightRadius: radius.extraLarge, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  handle: { width: 32, height: 4, borderRadius: 2, backgroundColor: colors.gray400, alignSelf: "center", marginBottom: spacing.md },
  sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  sheetTitle: { color: colors.textPrimary, fontSize: uiType.screenTitle, fontWeight: "800" },
  customerList: { maxHeight: 390, marginTop: spacing.md, marginBottom: spacing.md },
  customerRow: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs },
  customerRowSelected: { backgroundColor: colors.surfaceSoft },
  addForm: { maxHeight: 610 },
  backToList: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  backToListText: { color: colors.primary, fontSize: uiType.secondary, fontWeight: "800" },
});
