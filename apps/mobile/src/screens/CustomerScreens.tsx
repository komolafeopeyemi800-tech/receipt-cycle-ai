import { SafeActionFooter } from "../components/ui/SafeActionFooter";
import { ContactPickerModal } from "../components/ContactPickerModal";
import { useLeaveConfirmation } from "../hooks/useLeaveConfirmation";
import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { readAsStringAsync } from "expo-file-system/legacy";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenHeader } from "../components/ScreenHeader";
import { ContactAction, ContactInfoRow, InitialsAvatar } from "../components/ui/SalesSetupUI";
import { AppButton, AppCard, EmptyState, FormField, KpiCard, ScreenContainer, SearchInput, SectionHeader, SegmentedTabs, StatusBadge } from "../components/ui/FinanceUI";
import { usePreferences } from "../contexts/PreferencesContext";
import { useInvoiceFlow } from "../contexts/InvoiceFlowContext";
import { useEstimateFlow } from "../contexts/EstimateFlowContext";
import { usePaymentFlow } from "../contexts/PaymentFlowContext";
import { useSalesSetup } from "../contexts/SalesSetupContext";
import { useAuth } from "../contexts/AuthContext";
import { useAction, api } from "../lib/api";
import type { CustomerStatus } from "../features/sales/setupData";
import type { RootStackParamList } from "../navigation/types";
import { colors, radius, spacing, uiType } from "../theme/tokens";

type RootNav = NativeStackNavigationProp<RootStackParamList>;
type CustomerFilter = "All" | "Active" | "Prospects" | "Inactive";

function openContactUrl(url: string, unavailableMessage: string) {
  void Linking.canOpenURL(url).then((supported) => supported ? Linking.openURL(url) : Alert.alert("Unavailable", unavailableMessage)).catch(() => Alert.alert("Unavailable", unavailableMessage));
}

export function CustomersScreen() {
  const navigation = useNavigation<RootNav>();
  const { customers } = useSalesSetup();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CustomerFilter>("All");
  const rows = useMemo(() => customers.filter((customer) => {
    const normalized = search.trim().toLowerCase();
    const matchesSearch = !normalized || [customer.name, customer.businessName, customer.email, customer.phone].some((value) => value.toLowerCase().includes(normalized));
    const matchesFilter = filter === "All" || customer.status === (filter === "Prospects" ? "prospect" : filter.toLowerCase());
    return matchesSearch && matchesFilter;
  }), [customers, filter, search]);

  return <ScreenContainer>
    <ScreenHeader title="Customers" />
    <FlatList
      initialNumToRender={12}
      windowSize={9}
      removeClippedSubviews
      data={rows}
      keyExtractor={(item) => item.id}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={<View style={styles.listHeader}><SearchInput value={search} onChangeText={setSearch} placeholder="Search customers..." /><SegmentedTabs options={["All", "Active", "Prospects", "Inactive"] as const} value={filter} onChange={setFilter} /></View>}
      renderItem={({ item }) => <Pressable onPress={() => navigation.navigate("SalesCustomerDetail", { customerId: item.id })} style={({ pressed }) => [styles.customerRow, pressed && styles.pressed]} accessibilityRole="button">
        <InitialsAvatar name={item.name} email={item.email} />
        <View style={styles.rowMain}><Text style={styles.rowTitle} numberOfLines={1}>{item.name}</Text>{item.email ? <Text style={styles.rowMeta} numberOfLines={1}>{item.email}</Text> : null}{item.phone ? <Text style={styles.rowMeta}>{item.phone}</Text> : null}</View>
        <StatusBadge status={item.status} />
        <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
      </Pressable>}
      ListEmptyComponent={<EmptyState icon="people-outline" title="No customers found" description="Try another search or add a customer." />}
    />
    <View style={styles.stickyAction}><AppButton label="Add customer" icon="add" onPress={() => navigation.navigate("SalesCustomerForm")} /></View>
  </ScreenContainer>;
}

export function CustomerDetailScreen() {
  const navigation = useNavigation<RootNav>();
  const route = useRoute<RouteProp<RootStackParamList, "SalesCustomerDetail">>();
  const { customers, setCustomerStatus, deleteCustomer } = useSalesSetup();
  const { invoices: savedInvoices, loadInvoice } = useInvoiceFlow();
  const { estimates: savedEstimates } = useEstimateFlow();
  const { payments } = usePaymentFlow();
  const { formatMoney, formatDate } = usePreferences();
  const [tab, setTab] = useState<"Invoices" | "Estimates">("Invoices");
  const customer = customers.find((item) => item.id === route.params.customerId);
  if (!customer) return <ScreenContainer><ScreenHeader title="Customer" back /><EmptyState icon="person-outline" title="Customer unavailable" description="This customer may have been removed." /></ScreenContainer>;

  const invoices = savedInvoices.filter((item) => item.customerId === customer.id).map((item) => ({ id: item.invoiceNumber, customer: item.customerName, issuedAt: item.issueDate, amount: item.total, status: item.status }));
  const estimates = savedEstimates.filter((item) => item.customerId === customer.id).map((item) => ({ id: item.estimateNumber, customer: item.customerName, issuedAt: item.estimateDate, amount: item.total, status: item.status }));
  const totalInvoiced = invoices.reduce((sum, item) => sum + item.amount, 0);
  const amountPaid = payments.filter((item) => item.customerId === customer.id && item.status !== "refunded").reduce((sum, item) => sum + item.amount, 0);
  const balance = Math.max(0, totalInvoiced - amountPaid);
  const documents = tab === "Invoices" ? invoices : estimates;
  const customerId = customer.id;
  function openDocument(documentNumber: string) {
    if (tab === "Estimates") { navigation.navigate("EstimateDetail", { estimateNumber: documentNumber }); return; }
    const invoice = savedInvoices.find((row) => row.invoiceNumber === documentNumber);
    if (loadInvoice(documentNumber)) navigation.navigate(invoice?.items.length ? "InvoicePreview" : "InvoiceCreate");
  }
  const nextStatus: CustomerStatus = customer.status === "inactive" ? "active" : "inactive";

  function openMenu() {
    Alert.alert("Customer actions", undefined, [
      { text: "Edit customer", onPress: () => navigation.navigate("SalesCustomerForm", { customerId }) },
      { text: nextStatus === "active" ? "Mark active" : "Mark inactive", onPress: () => setCustomerStatus(customerId, nextStatus) },
      { text: "Delete customer", style: "destructive", onPress: () => Alert.alert("Delete customer?", "This also removes the customer from your web app. Their invoices stay.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => { deleteCustomer(customerId); navigation.goBack(); } }]) },
      { text: "Cancel", style: "cancel" },
    ], { cancelable: true });
  }

  return <ScreenContainer>
    <ScreenHeader title="Customer Details" back rightIcon="ellipsis-vertical" onRightPress={openMenu} />
    <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
      <View style={styles.customerHero}><InitialsAvatar name={customer.name} email={customer.email} size={58} /><View style={styles.heroMain}><View style={styles.heroTitleRow}><Text style={styles.heroTitle}>{customer.name}</Text><StatusBadge status={customer.status} /></View><Text style={styles.heroMeta}>{customer.businessName || "Individual customer"}</Text><Text style={styles.heroMeta}>Since {formatDate(customer.createdAt)}</Text></View></View>
      <View style={styles.contactActions}>
        <ContactAction icon="call-outline" label="Call" onPress={() => customer.phone ? openContactUrl(`tel:${customer.phone}`, "No calling app is available.") : Alert.alert("No phone number", "Add a phone number to this customer first.")} />
        <ContactAction icon="mail-outline" label="Email" onPress={() => customer.email ? openContactUrl(`mailto:${customer.email}`, "No email app is available.") : Alert.alert("No email address", "Add an email address to this customer first.")} />
        <ContactAction icon="chatbubble-outline" label="Message" onPress={() => customer.phone ? openContactUrl(`sms:${customer.phone}`, "No messaging app is available.") : Alert.alert("No phone number", "Add a phone number to this customer first.")} />
        <ContactAction icon="create-outline" label="Edit" onPress={() => navigation.navigate("SalesCustomerForm", { customerId: customer.id })} />
      </View>

      <SectionHeader title="Overview" />
      <View style={styles.kpiRow}><KpiCard title="Total Invoiced" value={formatMoney(totalInvoiced)} tone="positive" /><KpiCard title="Amount Paid" value={formatMoney(amountPaid)} tone="positive" /><KpiCard title="Balance Due" value={formatMoney(balance)} tone={balance > 0 ? "negative" : "neutral"} /></View>

      <SectionHeader title="Contact Information" actionLabel="Edit" onAction={() => navigation.navigate("SalesCustomerForm", { customerId: customer.id })} />
      <AppCard style={styles.infoCard}>
        {customer.email ? <ContactInfoRow icon="mail-outline" value={customer.email} /> : null}
        {customer.phone ? <ContactInfoRow icon="call-outline" value={customer.phone} /> : null}
        {customer.billingAddress ? <ContactInfoRow icon="location-outline" value={customer.billingAddress} /> : null}
        {customer.taxId ? <ContactInfoRow icon="lock-closed-outline" value={`Tax ID (EIN)\n${customer.taxId}`} /> : null}
        {!customer.email && !customer.phone && !customer.billingAddress ? <Text style={styles.rowMeta}>No contact details added yet.</Text> : null}
      </AppCard>

      <SegmentedTabs options={["Invoices", "Estimates"] as const} value={tab} onChange={setTab} />
      <AppCard style={styles.documentCard}>
        {documents.length ? documents.map((item, index) => <Pressable key={item.id} onPress={() => openDocument(item.id)} style={({ pressed }) => [styles.documentRow, index !== documents.length - 1 && styles.divider, pressed && { opacity: 0.7 }]} accessibilityRole="button" accessibilityLabel={`Open ${item.id}`}><Ionicons name="document-text-outline" size={20} color={colors.blue600} /><View style={styles.rowMain}><Text style={styles.rowTitle} numberOfLines={1}>{item.id}</Text><Text style={styles.rowMeta}>{formatDate(item.issuedAt)}</Text></View><View style={styles.documentRight}><Text style={styles.documentAmount} numberOfLines={1}>{formatMoney(item.amount)}</Text><StatusBadge status={item.status} /></View><Ionicons name="chevron-forward" size={16} color={colors.gray400} /></Pressable>) : <EmptyState icon="document-outline" title={`No ${tab.toLowerCase()}`} description={`This customer has no ${tab.toLowerCase()} yet.`} />}
      </AppCard>
    </ScrollView>
  </ScreenContainer>;
}

export function CustomerFormScreen() {
  const navigation = useNavigation<RootNav>();
  const route = useRoute<RouteProp<RootStackParamList, "SalesCustomerForm">>();
  const { customers, saveCustomer } = useSalesSetup();
  const { token } = useAuth();
  const parseCustomerText = useAction(api.voiceFinance.parseTransactionFromSpeech);
  const parseCustomerVoice = useAction(api.voiceFinance.voiceTransactionFromAudio);
  const existing = route.params?.customerId ? customers.find((item) => item.id === route.params?.customerId) : undefined;
  const [name, setName] = useState(existing?.name ?? "");
  const [businessName, setBusinessName] = useState(existing?.businessName ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [billingAddress, setBillingAddress] = useState(existing?.billingAddress ?? "");
  const [taxId, setTaxId] = useState(existing?.taxId ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const changed = name !== (existing?.name ?? "") || email !== (existing?.email ?? "") || phone !== (existing?.phone ?? "") || businessName !== (existing?.businessName ?? "") || billingAddress !== (existing?.billingAddress ?? "") || notes !== (existing?.notes ?? "");
  const { allowLeave } = useLeaveConfirmation(changed);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [smartOpen, setSmartOpen] = useState(false);
  const [smartText, setSmartText] = useState("");
  const [smartBusy, setSmartBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  function applySmartResult(value: Record<string, unknown>, sourceText: string) {
    const emailMatch = sourceText.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0] ?? "";
    const phoneMatch = sourceText.match(/(?:\+?\d[\d ()-]{7,}\d)/)?.[0] ?? "";
    const candidate = String(value.customerName ?? value.merchant ?? value.description ?? "").trim();
    if (candidate) setName(candidate);
    if (String(value.customerEmail ?? emailMatch).trim()) setEmail(String(value.customerEmail ?? emailMatch).trim());
    if (phoneMatch) setPhone(phoneMatch.trim());
    setNotes((current) => current || sourceText.trim());
    setSmartOpen(false);
  }

  async function fillFromText() {
    if (!token || !smartText.trim()) { Alert.alert("Customer AI", token ? "Describe the customer first." : "Sign in to use AI customer entry."); return; }
    setSmartBusy(true);
    try {
      const result = await parseCustomerText({ text: `Create a customer contact from this note: ${smartText}`, sessionToken: token, hints: {} });
      if (!result.ok || !result.draft) throw new Error(result.error || "Could not understand the customer details.");
      applySmartResult(result.draft as unknown as Record<string, unknown>, smartText);
    } catch (error) { Alert.alert("Customer AI", error instanceof Error ? error.message : "Could not fill the customer."); }
    finally { setSmartBusy(false); }
  }

  async function toggleCustomerVoice() {
    if (recording && recordingRef.current) {
      setRecording(false); setSmartBusy(true);
      try {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI(); recordingRef.current = null;
        if (!uri || !token) throw new Error("Sign in to use voice entry.");
        const audioBase64 = await readAsStringAsync(uri, { encoding: "base64" });
        const result = await parseCustomerVoice({ audioBase64, mimeType: "audio/m4a", language: "auto", sessionToken: token, hints: {} });
        if (!result.ok || !result.draft) throw new Error(result.error || "Could not understand the recording.");
        const transcript = result.transcript ?? ""; setSmartText(transcript); applySmartResult(result.draft as unknown as Record<string, unknown>, transcript);
      } catch (error) { Alert.alert("Customer voice", error instanceof Error ? error.message : "Could not fill the customer."); }
      finally { setSmartBusy(false); }
      return;
    }
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) { Alert.alert("Microphone", "Allow microphone access to add a customer by voice."); return; }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const created = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    recordingRef.current = created.recording; setRecording(true); setSmartOpen(true);
  }

  function onSave() {
    if (!name.trim()) { Alert.alert("Customer name required", "Enter a customer name before saving."); return; }
    saveCustomer({ id: existing?.id, createdAt: existing?.createdAt, name: name.trim(), businessName: businessName.trim(), email: email.trim(), phone: phone.trim(), billingAddress: billingAddress.trim(), taxId: taxId.trim(), notes: notes.trim(), status: existing?.status ?? "active" });
    allowLeave();
    navigation.goBack();
  }

  return <ScreenContainer>
    <ScreenHeader title={existing ? "Edit Customer" : "Add Customer"} back />
    <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Pressable onPress={() => setContactsOpen(true)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 44, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.primary, marginBottom: spacing.md }} accessibilityRole="button"><Ionicons name="people-outline" size={18} color={colors.primary} /><Text style={{ color: colors.primary, fontWeight: "800", fontSize: uiType.body }}>Fill from phone contacts</Text></Pressable>
      <ContactPickerModal visible={contactsOpen} onClose={() => setContactsOpen(false)} onPick={(c) => { setName(c.name); setBusinessName(c.businessName); setEmail(c.email); setPhone(c.phone); setBillingAddress(c.address); setContactsOpen(false); }} />
      {!existing ? <AppCard style={styles.customerAiCard}><View style={styles.customerAiHead}><View><Text style={styles.customerAiTitle}>Add with AI</Text><Text style={styles.customerAiCopy}>Speak or type the customer details, then review them.</Text></View><View style={styles.customerAiActions}><Pressable onPress={() => void toggleCustomerVoice()} style={[styles.customerAiIcon, recording && styles.customerAiRecording]}><Ionicons name={recording ? "stop" : "mic"} size={20} color={recording ? colors.rose600 : colors.primary} /></Pressable><Pressable onPress={() => setSmartOpen((value) => !value)} style={styles.customerAiIcon}><Ionicons name="create-outline" size={20} color={colors.blue600} /></Pressable></View></View>{smartOpen ? <View style={styles.customerAiInputRow}><TextInput value={smartText} onChangeText={setSmartText} placeholder="Sarah Chen, sarah@bright.co, +1 555 0100" placeholderTextColor={colors.gray400} multiline style={styles.customerAiInput} /> <Pressable onPress={() => void fillFromText()} disabled={smartBusy} style={styles.customerAiSend}>{smartBusy ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="arrow-forward" size={18} color="#fff" />}</Pressable></View> : null}</AppCard> : null}
      <FormField label="Customer Name" icon="person-outline" value={name} onChangeText={setName} placeholder="Enter customer name" required />
      <FormField label="Business Name" icon="business-outline" value={businessName} onChangeText={setBusinessName} placeholder="Enter business name (optional)" />
      <FormField label="Email Address" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="name@company.com" keyboardType="email-address" autoCapitalize="none" />
      <FormField label="Phone Number" icon="call-outline" value={phone} onChangeText={setPhone} placeholder="(555) 555-0123" keyboardType="phone-pad" />
      <FormField label="Billing Address" icon="location-outline" value={billingAddress} onChangeText={setBillingAddress} placeholder={'123 Street Address\nCity, State  ZIP Code'} multiline />
      <FormField label="Tax ID (EIN or SSN)" icon="lock-closed-outline" value={taxId} onChangeText={setTaxId} placeholder="12-3456789 (optional)" />
      <FormField label="Notes" icon="document-text-outline" value={notes} onChangeText={setNotes} placeholder="Add notes about this customer..." multiline />
    </ScrollView>
    <SafeActionFooter><AppButton label={existing ? "Save changes" : "Save customer"} onPress={onSave} /></SafeActionFooter>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  listHeader: { gap: spacing.md, paddingTop: spacing.md },
  customerRow: { minHeight: 72, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider, paddingVertical: spacing.sm },
  pressed: { opacity: 0.72 },
  rowMain: { flex: 1, minWidth: 0 },
  rowTitle: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
  rowMeta: { color: colors.gray500, fontSize: uiType.caption, marginTop: 2 },
  stickyAction: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm, backgroundColor: colors.background },
  detailContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  customerHero: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.md, marginBottom: spacing.lg },
  heroMain: { flex: 1, minWidth: 0 },
  heroTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  heroTitle: { color: colors.textPrimary, fontSize: uiType.sectionTitle, fontWeight: "800", flexShrink: 1 },
  heroMeta: { color: colors.gray500, fontSize: uiType.caption, marginTop: 3 },
  contactActions: { flexDirection: "row", marginBottom: spacing.xl },
  kpiRow: { flexDirection: "row", gap: spacing.xs, marginBottom: spacing.xl },
  infoCard: { marginBottom: spacing.xl },
  documentCard: { paddingVertical: 0 },
  documentRow: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  documentAmount: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800", textAlign: "right" },
  documentRight: { alignItems: "flex-end", gap: 4, maxWidth: "46%" },
  formContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  formButton: { marginTop: spacing.md },
  customerAiCard: { marginBottom: spacing.lg, backgroundColor: colors.purpleSoft, borderColor: colors.border },
  customerAiHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  customerAiTitle: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
  customerAiCopy: { color: colors.gray600, fontSize: uiType.caption, marginTop: 3, maxWidth: 205 },
  customerAiActions: { flexDirection: "row", gap: 7 },
  customerAiIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  customerAiRecording: { backgroundColor: colors.roseSoft, borderColor: colors.rose600 },
  customerAiInputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: spacing.md },
  customerAiInput: { flex: 1, minHeight: 72, maxHeight: 110, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.surface, color: colors.textPrimary, padding: 10, fontSize: uiType.secondary },
  customerAiSend: { width: 42, height: 42, borderRadius: 10, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
});
