import { useMemo, useState } from "react";
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, type CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppButton, AppCard, EmptyState, IconTile, KpiCard, ScreenContainer, SearchInput, SectionHeader, SegmentedTabs, StatusBadge } from "../components/ui/FinanceUI";
import { usePreferences } from "../contexts/PreferencesContext";
import { useInvoiceFlow } from "../contexts/InvoiceFlowContext";
import { usePaymentFlow } from "../contexts/PaymentFlowContext";
import { previewEstimates, previewInvoices, previewPayments, previewSalesMetrics, salesDataMode, type SalesEstimate, type SalesInvoice } from "../features/sales/previewData";
import type { RootStackParamList, SalesStackParamList } from "../navigation/types";
import { colors, radius, spacing, uiType } from "../theme/tokens";

type Nav = CompositeNavigationProp<NativeStackNavigationProp<SalesStackParamList>, NativeStackNavigationProp<RootStackParamList>>;
type Document = SalesInvoice | SalesEstimate;
type ListKind = "invoice" | "estimate";

function PreviewBanner() {
  return <View style={styles.previewBanner}><Ionicons name="eye-outline" size={14} color={colors.primary} /><Text style={styles.previewText}>Sales preview data</Text></View>;
}

function DocumentRow({ item, kind, formatMoney, formatDate, onPress, onConvert }: { item: Document; kind: ListKind; formatMoney: (n: number) => string; formatDate: (d: string) => string; onPress: () => void; onConvert?: () => void }) {
  const tone = item.status === "overdue" || item.status === "expired" ? "rose" : item.status === "paid" || item.status === "accepted" ? "mint" : "blue";
  return (
    <View style={styles.documentBlock}><Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${kind} ${item.id}, ${item.customer}, ${formatMoney(item.amount)}`} style={({ pressed }) => [styles.documentRow, pressed && { backgroundColor: colors.surfaceSoft }]}>
      <IconTile icon="document-text-outline" tone={tone} size={36} />
      <View style={styles.documentMain}>
        <Text style={styles.documentId} numberOfLines={1}>{item.id}</Text>
        <Text style={styles.documentMeta} numberOfLines={1}>{item.customer}</Text>
        <Text style={styles.documentDate}>{formatDate(item.issuedAt)}</Text>
      </View>
      <View style={styles.documentRight}>
        <Text style={styles.documentAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{formatMoney(item.amount)}</Text>
        <StatusBadge status={item.status} />
      </View>
      <Ionicons name="chevron-forward" size={17} color={colors.gray500} />
    </Pressable>
    {kind === "estimate" && (item.status === "sent" || item.status === "accepted") && onConvert ? <Pressable onPress={onConvert} style={styles.convertButton} accessibilityRole="button"><Text style={styles.convertText}>Convert to Invoice</Text></Pressable> : null}
    </View>
  );
}

function DocumentSheet({ item, kind, formatMoney, formatDate, onClose }: { item: Document | null; kind: ListKind; formatMoney: (n: number) => string; formatDate: (d: string) => string; onClose: () => void }) {
  return (
    <Modal visible={item !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalPanel} onPress={(event) => event.stopPropagation()}>
          {item ? <>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeading}><Text style={styles.modalTitle}>{kind === "invoice" ? "Invoice" : "Estimate"} preview</Text><Pressable onPress={onClose} accessibilityLabel="Close preview"><Ionicons name="close" size={24} color={colors.gray600} /></Pressable></View>
            <Text style={styles.modalId}>{item.id}</Text>
            <StatusBadge status={item.status} />
            <View style={styles.modalLine}><Text style={styles.modalLabel}>Customer</Text><Text style={styles.modalValue}>{item.customer}</Text></View>
            <View style={styles.modalLine}><Text style={styles.modalLabel}>Issue date</Text><Text style={styles.modalValue}>{formatDate(item.issuedAt)}</Text></View>
            <View style={styles.modalLine}><Text style={styles.modalLabel}>Total</Text><Text style={[styles.modalValue, { color: colors.primary, fontWeight: "800" }]}>{formatMoney(item.amount)}</Text></View>
            <Text style={styles.modalNote}>This is sample sales data for visual review. Document editing and sending will be connected in the dedicated workflow worksheet.</Text>
            <AppButton label="Close" onPress={onClose} style={{ marginTop: spacing.lg }} />
          </> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function SalesHubScreen() {
  const navigation = useNavigation<Nav>();
  const { formatMoney, formatDate } = usePreferences();
  const { invoices: savedInvoices } = useInvoiceFlow();
  const { payments } = usePaymentFlow();
  const [period, setPeriod] = useState<"This Month" | "All Time">("This Month");
  const activity = [
    { key: "payment", title: "Payment received", subtitle: previewPayments[0].customer, amount: previewPayments[0].amount, date: previewPayments[0].paidAt, tone: "mint" as const, icon: "cash-outline" as const },
    { key: "invoice", title: "Invoice sent", subtitle: previewInvoices[1].customer, amount: previewInvoices[1].amount, date: previewInvoices[1].issuedAt, tone: "blue" as const, icon: "document-text-outline" as const },
    { key: "estimate", title: "Estimate created", subtitle: previewEstimates[0].customer, amount: previewEstimates[0].amount, date: previewEstimates[0].issuedAt, tone: "blue" as const, icon: "document-outline" as const },
    { key: "overdue", title: "Invoice overdue", subtitle: previewInvoices[2].customer, amount: previewInvoices[2].amount, date: previewInvoices[2].issuedAt, tone: "rose" as const, icon: "alert-circle-outline" as const },
  ];
  const localOutstanding = savedInvoices.filter((item) => item.status === "sent" || item.status === "overdue" || item.status === "partially_paid").reduce((sum, item) => sum + Math.max(0, item.total - (item.amountPaid ?? 0)), 0);
  const localPaid = payments.filter((item) => item.status !== "refunded").reduce((sum, item) => sum + item.amount, 0);
  const localOverdue = savedInvoices.filter((item) => item.status === "overdue").reduce((sum, item) => sum + item.total, 0);
  const outstandingCount = 2 + savedInvoices.filter((item) => item.status === "sent" || item.status === "overdue" || item.status === "partially_paid").length;
  return (
    <ScreenContainer>
      <ScreenHeader title="Sales" onRightPress={() => navigation.navigate("BusinessProfile")} />
      <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
        <View style={styles.periodRow}><SegmentedTabs options={["This Month", "All Time"] as const} value={period} onChange={setPeriod} /><Ionicons name="calendar-outline" size={20} color={colors.gray600} /></View>
        {salesDataMode === "preview" ? <PreviewBanner /> : null}
        <View style={styles.kpiRow}>
          <Pressable style={styles.kpiPress} onPress={() => navigation.navigate("SalesInvoices")}><KpiCard title="Outstanding Invoices" value={formatMoney(previewSalesMetrics.outstanding + localOutstanding)} detail={`${outstandingCount} invoices`} /></Pressable>
          <Pressable style={styles.kpiPress} onPress={() => navigation.navigate("SalesPayments")}><KpiCard title={period === "This Month" ? "Paid This Month" : "Total Paid"} value={formatMoney((period === "This Month" ? previewSalesMetrics.paidThisMonth : previewPayments.reduce((sum, payment) => sum + payment.amount, 0)) + localPaid)} detail={`${previewPayments.length + payments.length} payments`} tone="positive" /></Pressable>
        </View>
        <View style={styles.kpiRow}>
          <Pressable style={styles.kpiPress} onPress={() => navigation.navigate("SalesInvoices")}><KpiCard title="Overdue" value={formatMoney(previewSalesMetrics.overdue + localOverdue)} detail={`${1 + savedInvoices.filter((item) => item.status === "overdue").length} invoices`} tone="negative" /></Pressable>
          <Pressable style={styles.kpiPress} onPress={() => navigation.navigate("SalesEstimates")}><KpiCard title="Open Estimates" value={formatMoney(previewSalesMetrics.openEstimates)} detail="1 estimate" tone="info" /></Pressable>
        </View>
        <View style={styles.shortcuts}>
          <Pressable style={styles.shortcut} onPress={() => navigation.navigate("SalesInvoices")}><IconTile icon="document-text-outline" tone="blue" size={32} /><Text style={styles.shortcutLabel}>Invoices</Text><Ionicons name="chevron-forward" size={16} color={colors.gray400} /></Pressable>
          <Pressable style={styles.shortcut} onPress={() => navigation.navigate("SalesEstimates")}><IconTile icon="document-outline" tone="amber" size={32} /><Text style={styles.shortcutLabel}>Estimates</Text><Ionicons name="chevron-forward" size={16} color={colors.gray400} /></Pressable>
          <Pressable style={styles.shortcut} onPress={() => navigation.navigate("SalesPayments")}><IconTile icon="card-outline" tone="mint" size={32} /><Text style={styles.shortcutLabel}>Payments</Text><Ionicons name="chevron-forward" size={16} color={colors.gray400} /></Pressable>
        </View>
        <SectionHeader title="Recent Activity" actionLabel="See all" onAction={() => navigation.navigate("SalesInvoices")} />
        <AppCard style={styles.activityCard}>
          {activity.map((item, index) => <View key={item.key} style={[styles.activityRow, index !== activity.length - 1 && styles.rowDivider]}><IconTile icon={item.icon} tone={item.tone} size={34} /><View style={styles.activityMain}><Text style={styles.activityTitle}>{item.title}</Text><Text style={styles.activitySubtitle}>{item.subtitle}</Text></View><View style={styles.activityValue}><Text style={[styles.activityAmount, item.key === "payment" && { color: colors.success }, item.key === "overdue" && { color: colors.danger }]}>{item.key === "payment" ? "+" : ""}{formatMoney(item.amount)}</Text><Text style={styles.activitySubtitle}>{formatDate(item.date)}</Text></View></View>)}
        </AppCard>
        <View style={styles.manageSection}>
          <SectionHeader title="Sales workspace" />
          <AppCard style={styles.manageCard}>
            {[
              { label: "Customers", detail: "Contacts and billing details", icon: "people-outline" as const, tone: "blue" as const, onPress: () => navigation.navigate("SalesCustomers") },
              { label: "Items & Services", detail: "Products, services, and rates", icon: "cube-outline" as const, tone: "amber" as const, onPress: () => navigation.navigate("SalesItems") },
              { label: "Business Profile", detail: "Identity shown on sales documents", icon: "business-outline" as const, tone: "mint" as const, onPress: () => navigation.navigate("BusinessProfile") },
              { label: "Invoice Settings", detail: "Currency, tax, terms, and numbering", icon: "options-outline" as const, tone: "purple" as const, onPress: () => navigation.navigate("InvoiceSettings") },
            ].map((item, index, rows) => <Pressable key={item.label} onPress={item.onPress} style={[styles.manageRow, index !== rows.length - 1 && styles.rowDivider]} accessibilityRole="button"><IconTile icon={item.icon} tone={item.tone} size={36} /><View style={styles.activityMain}><Text style={styles.activityTitle}>{item.label}</Text><Text style={styles.activitySubtitle}>{item.detail}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.gray400} /></Pressable>)}
          </AppCard>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function SalesList({ kind }: { kind: ListKind }) {
  const navigation = useNavigation<Nav>();
  const { formatMoney, formatDate } = usePreferences();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<Document | null>(null);
  const source: Document[] = kind === "invoice" ? previewInvoices : previewEstimates;
  const filters = kind === "invoice" ? ["All", "Draft", "Sent", "Paid", "Overdue"] : ["All", "Draft", "Sent", "Accepted", "Expired"];
  const rows = useMemo(() => source.filter((item) => (filter === "All" || item.status === filter.toLowerCase()) && (item.id.toLowerCase().includes(search.trim().toLowerCase()) || item.customer.toLowerCase().includes(search.trim().toLowerCase()))), [source, filter, search]);
  const title = kind === "invoice" ? "Invoices" : "Estimates";
  return (
    <ScreenContainer>
      <ScreenHeader title={title} back rightIcon="add-circle" onRightPress={() => Alert.alert(`${kind === "invoice" ? "Invoice" : "Estimate"} builder`, "This creation flow is scheduled for its dedicated worksheet. The list shown here uses preview data.")} />
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={<><PreviewBanner /><SearchInput value={search} onChangeText={setSearch} placeholder={`Search ${title.toLowerCase()} or customers`} /><View style={styles.filters}><SegmentedTabs options={filters} value={filter} onChange={setFilter} /></View></>}
        renderItem={({ item }) => <DocumentRow item={item} kind={kind} formatMoney={formatMoney} formatDate={formatDate} onPress={() => setSelected(item)} onConvert={() => Alert.alert("Estimate conversion", "Conversion will be connected when the estimate and invoice builders are implemented.")} />}
        ListEmptyComponent={<EmptyState icon="document-outline" title={`No ${title.toLowerCase()} found`} description="Try another search or status filter." />}
      />
      <DocumentSheet item={selected} kind={kind} formatMoney={formatMoney} formatDate={formatDate} onClose={() => setSelected(null)} />
    </ScreenContainer>
  );
}

export function SalesInvoicesScreen() { return <SalesList kind="invoice" />; }
export function SalesEstimatesScreen() { return <SalesList kind="estimate" />; }

const styles = StyleSheet.create({
  pageContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  periodRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
  previewBanner: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.mintSoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4, marginBottom: spacing.md },
  previewText: { color: colors.primary, fontSize: uiType.caption, fontWeight: "700" },
  kpiRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  kpiPress: { flex: 1, minWidth: 0 },
  shortcuts: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.xl },
  shortcut: { flex: 1, minHeight: 50, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.medium, flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.sm, gap: spacing.sm },
  shortcutLabel: { flex: 1, color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "700" },
  activityCard: { paddingVertical: 0, paddingHorizontal: spacing.sm },
  activityRow: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  activityMain: { flex: 1, minWidth: 0 },
  activityTitle: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "700" },
  activitySubtitle: { color: colors.gray500, fontSize: uiType.caption, marginTop: 2 },
  activityValue: { alignItems: "flex-end" },
  activityAmount: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "700" },
  manageSection: { marginTop: spacing.xl },
  manageCard: { paddingVertical: 0, paddingHorizontal: spacing.sm },
  manageRow: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxxl },
  filters: { marginTop: spacing.md },
  documentRow: { minHeight: 73, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderBottomColor: colors.divider, borderBottomWidth: 1, paddingHorizontal: 2, paddingVertical: spacing.sm, backgroundColor: colors.surface },
  documentBlock: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.divider },
  convertButton: { alignSelf: "center", borderColor: "#b9d7fa", borderWidth: 1, borderRadius: radius.small, paddingHorizontal: spacing.lg, paddingVertical: 5, marginBottom: spacing.sm },
  convertText: { color: colors.blue600, fontSize: uiType.caption, fontWeight: "700" },
  documentMain: { flex: 1, minWidth: 0 },
  documentId: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
  documentMeta: { color: colors.gray600, fontSize: uiType.caption, marginTop: 2 },
  documentDate: { color: colors.gray500, fontSize: uiType.caption, marginTop: 2 },
  documentRight: { alignItems: "flex-end", gap: 4, maxWidth: 105 },
  documentAmount: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "700" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.42)", justifyContent: "flex-end" },
  modalPanel: { backgroundColor: colors.surface, borderTopLeftRadius: radius.extraLarge, borderTopRightRadius: radius.extraLarge, padding: spacing.xl, paddingBottom: spacing.xxxl },
  modalHandle: { width: 32, height: 4, borderRadius: 2, backgroundColor: colors.gray400, alignSelf: "center", marginBottom: spacing.xl },
  modalHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: uiType.screenTitle, fontWeight: "800", color: colors.textPrimary },
  modalId: { fontSize: uiType.body, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.sm },
  modalLine: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.divider, paddingVertical: spacing.md },
  modalLabel: { color: colors.gray600, fontSize: uiType.body },
  modalValue: { color: colors.textPrimary, fontSize: uiType.body },
  modalNote: { color: colors.gray500, fontSize: uiType.secondary, lineHeight: 18, marginTop: spacing.lg },
});
