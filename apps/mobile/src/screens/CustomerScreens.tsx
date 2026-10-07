import { useMemo, useState } from "react";
import { Alert, FlatList, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
import type { CustomerStatus } from "../features/sales/setupData";
import type { RootStackParamList } from "../navigation/types";
import { colors, spacing, uiType } from "../theme/tokens";

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
      data={rows}
      keyExtractor={(item) => item.id}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={<View style={styles.listHeader}><SearchInput value={search} onChangeText={setSearch} placeholder="Search customers..." /><SegmentedTabs options={["All", "Active", "Prospects", "Inactive"] as const} value={filter} onChange={setFilter} /></View>}
      renderItem={({ item }) => <Pressable onPress={() => navigation.navigate("SalesCustomerDetail", { customerId: item.id })} style={({ pressed }) => [styles.customerRow, pressed && styles.pressed]} accessibilityRole="button">
        <InitialsAvatar name={item.name} />
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
  const { customers, setCustomerStatus } = useSalesSetup();
  const { invoices: savedInvoices } = useInvoiceFlow();
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
  const nextStatus: CustomerStatus = customer.status === "inactive" ? "active" : "inactive";

  function openMenu() {
    Alert.alert("Customer actions", undefined, [
      { text: "Edit customer", onPress: () => navigation.navigate("SalesCustomerForm", { customerId }) },
      { text: nextStatus === "active" ? "Mark active" : "Mark inactive", onPress: () => setCustomerStatus(customerId, nextStatus) },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  return <ScreenContainer>
    <ScreenHeader title="Customer Details" back rightIcon="ellipsis-vertical" onRightPress={openMenu} />
    <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
      <View style={styles.customerHero}><InitialsAvatar name={customer.name} size={58} /><View style={styles.heroMain}><View style={styles.heroTitleRow}><Text style={styles.heroTitle}>{customer.name}</Text><StatusBadge status={customer.status} /></View><Text style={styles.heroMeta}>{customer.businessName || "Individual customer"}</Text><Text style={styles.heroMeta}>Since {formatDate(customer.createdAt)}</Text></View></View>
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
        {documents.length ? documents.map((item, index) => <View key={item.id} style={[styles.documentRow, index !== documents.length - 1 && styles.divider]}><Ionicons name="document-text-outline" size={20} color={colors.blue600} /><View style={styles.rowMain}><Text style={styles.rowTitle}>{item.id}</Text><Text style={styles.rowMeta}>{formatDate(item.issuedAt)}</Text></View><StatusBadge status={item.status} /><Text style={styles.documentAmount}>{formatMoney(item.amount)}</Text></View>) : <EmptyState icon="document-outline" title={`No ${tab.toLowerCase()}`} description={`This customer has no ${tab.toLowerCase()} yet.`} />}
      </AppCard>
    </ScrollView>
  </ScreenContainer>;
}

export function CustomerFormScreen() {
  const navigation = useNavigation<RootNav>();
  const route = useRoute<RouteProp<RootStackParamList, "SalesCustomerForm">>();
  const { customers, saveCustomer } = useSalesSetup();
  const existing = route.params?.customerId ? customers.find((item) => item.id === route.params?.customerId) : undefined;
  const [name, setName] = useState(existing?.name ?? "");
  const [businessName, setBusinessName] = useState(existing?.businessName ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [billingAddress, setBillingAddress] = useState(existing?.billingAddress ?? "");
  const [taxId, setTaxId] = useState(existing?.taxId ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");

  function onSave() {
    if (!name.trim()) { Alert.alert("Customer name required", "Enter a customer name before saving."); return; }
    saveCustomer({ id: existing?.id, createdAt: existing?.createdAt, name: name.trim(), businessName: businessName.trim(), email: email.trim(), phone: phone.trim(), billingAddress: billingAddress.trim(), taxId: taxId.trim(), notes: notes.trim(), status: existing?.status ?? "active" });
    navigation.goBack();
  }

  return <ScreenContainer>
    <ScreenHeader title={existing ? "Edit Customer" : "Add Customer"} back />
    <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <FormField label="Customer Name" icon="person-outline" value={name} onChangeText={setName} placeholder="Enter customer name" required />
      <FormField label="Business Name" icon="business-outline" value={businessName} onChangeText={setBusinessName} placeholder="Enter business name (optional)" />
      <FormField label="Email Address" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="name@company.com" keyboardType="email-address" autoCapitalize="none" />
      <FormField label="Phone Number" icon="call-outline" value={phone} onChangeText={setPhone} placeholder="(555) 555-0123" keyboardType="phone-pad" />
      <FormField label="Billing Address" icon="location-outline" value={billingAddress} onChangeText={setBillingAddress} placeholder={'123 Street Address\nCity, State  ZIP Code'} multiline />
      <FormField label="Tax ID (EIN or SSN)" icon="lock-closed-outline" value={taxId} onChangeText={setTaxId} placeholder="12-3456789 (optional)" />
      <FormField label="Notes" icon="document-text-outline" value={notes} onChangeText={setNotes} placeholder="Add notes about this customer..." multiline />
      <AppButton label={existing ? "Save changes" : "Save customer"} onPress={onSave} style={styles.formButton} />
    </ScrollView>
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
  documentAmount: { color: colors.textPrimary, fontSize: uiType.caption, fontWeight: "800" },
  formContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  formButton: { marginTop: spacing.md },
});
