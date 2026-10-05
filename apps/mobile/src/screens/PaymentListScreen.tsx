import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppButton, EmptyState, IconTile, KpiCard, ScreenContainer, SearchInput, SegmentedTabs, StatusBadge } from "../components/ui/FinanceUI";
import { usePaymentFlow } from "../contexts/PaymentFlowContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { paymentListPreview, paymentPreviewMetrics, type PaymentStatus } from "../features/payments/model";
import type { RootStackParamList } from "../navigation/types";
import { colors, spacing, uiType } from "../theme/tokens";

type Filter = "All" | "Received" | "Partial" | "Refunded";
type Row = { id: string; receiptNumber: string; invoiceNumber: string; customerName: string; paymentDate: string; amount: number; status: PaymentStatus; preview: boolean };

export function PaymentListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { payments, startNewPayment } = usePaymentFlow();
  const { formatMoney, formatDate } = usePreferences();
  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const localReceived = payments.filter((item) => item.status !== "refunded").reduce((sum, item) => sum + item.amount, 0);
  const localRefunded = payments.filter((item) => item.status === "refunded").reduce((sum, item) => sum + item.amount, 0);
  const rows = useMemo<Row[]>(() => [
    ...payments.map((item) => ({ id: item.id, receiptNumber: item.receiptNumber, invoiceNumber: item.invoiceNumber ?? "", customerName: item.customerName, paymentDate: item.paymentDate, amount: item.amount, status: item.status, preview: false })),
    ...paymentListPreview.map((item) => ({ ...item, preview: true })),
  ].filter((item) => (filter === "All" || item.status === filter.toLowerCase()) && (!search.trim() || `${item.customerName} ${item.invoiceNumber} ${item.receiptNumber}`.toLowerCase().includes(search.trim().toLowerCase()))), [filter, payments, search]);

  function create() { startNewPayment(); navigation.navigate("PaymentCreate"); }
  function cycleFilter() {
    const options: Filter[] = ["All", "Received", "Partial", "Refunded"];
    setFilter(options[(options.indexOf(filter) + 1) % options.length]!);
  }
  function open(item: Row) {
    if (item.preview) navigation.navigate("PaymentInvoiceDetail", { invoiceNumber: item.invoiceNumber });
    else navigation.navigate("ReceiptPreview", { paymentId: item.id });
  }

  return <ScreenContainer>
    <ScreenHeader title="Payments" rightIcon="filter-outline" onRightPress={cycleFilter} />
    <FlatList
      data={rows}
      keyExtractor={(item) => `${item.preview ? "preview" : "local"}-${item.id}`}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={<View>
        <SegmentedTabs options={["All", "Received", "Partial", "Refunded"] as const} value={filter} onChange={setFilter} />
        <View style={styles.kpis}><KpiCard title="Total Received" value={formatMoney(paymentPreviewMetrics.received + localReceived)} detail="This month" tone="positive" /><KpiCard title="Total Refunded" value={formatMoney(paymentPreviewMetrics.refunded + localRefunded)} detail="This month" tone="negative" /></View>
        <SearchInput value={search} onChangeText={setSearch} placeholder="Search payments or invoices" />
        <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Recent Payments</Text><Text style={styles.seeAll}>{rows.length} records</Text></View>
      </View>}
      renderItem={({ item }) => <Pressable onPress={() => open(item)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.72 }]} accessibilityRole="button" accessibilityLabel={`${item.customerName}, ${formatMoney(item.amount)}, ${item.status}`}>
        <IconTile icon="cash-outline" tone={item.status === "refunded" ? "rose" : item.status === "partial" ? "blue" : "mint"} size={39} />
        <View style={styles.main}><Text style={styles.customer}>{item.customerName}</Text><Text style={styles.meta}>{item.invoiceNumber}</Text><Text style={styles.meta}>{formatDate(item.paymentDate)}{item.preview ? " · Preview" : ""}</Text></View>
        <View style={styles.right}><Text style={styles.amount}>{formatMoney(item.amount)}</Text><StatusBadge status={item.status} /></View>
      </Pressable>}
      ListEmptyComponent={<EmptyState icon="card-outline" title={`No ${filter.toLowerCase()} payments`} description="Record a payment or choose another status." />}
      ListFooterComponent={<AppButton label="Add Payment" icon="add" onPress={create} style={styles.addButton} />}
    />
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  kpis: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.xl, marginBottom: spacing.sm },
  sectionTitle: { color: colors.textPrimary, fontSize: uiType.sectionTitle, fontWeight: "900" },
  seeAll: { color: colors.blue600, fontSize: uiType.caption, fontWeight: "700" },
  row: { minHeight: 77, flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.divider, paddingVertical: spacing.sm },
  main: { flex: 1, minWidth: 0 },
  customer: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
  meta: { color: colors.gray500, fontSize: uiType.caption, marginTop: 2 },
  right: { alignItems: "flex-end", gap: 5 },
  amount: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "900" },
  addButton: { marginTop: spacing.lg },
});
