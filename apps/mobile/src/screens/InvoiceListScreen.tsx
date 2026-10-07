import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenHeader } from "../components/ScreenHeader";
import { EmptyState, IconTile, ScreenContainer, SearchInput, SegmentedTabs, StatusBadge } from "../components/ui/FinanceUI";
import { useInvoiceFlow } from "../contexts/InvoiceFlowContext";
import { usePreferences } from "../contexts/PreferencesContext";
import type { InvoiceStatus } from "../features/invoices/model";
import type { RootStackParamList } from "../navigation/types";
import { colors, radius, spacing, uiType } from "../theme/tokens";

type Filter = "Draft" | "Sent" | "Paid" | "Overdue";
type ListRow = { invoiceNumber: string; customerName: string; issuedAt: string; amount: number; status: InvoiceStatus };

export function InvoiceListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { invoices, startNewInvoice, loadInvoice } = useInvoiceFlow();
  const { formatMoney, formatDate } = usePreferences();
  const [filter, setFilter] = useState<Filter>("Draft");
  const [search, setSearch] = useState("");
  const rows = useMemo<ListRow[]>(() => invoices
    .map((invoice) => ({ invoiceNumber: invoice.invoiceNumber, customerName: invoice.customerName, issuedAt: invoice.issueDate, amount: invoice.total, status: invoice.status }))
    .filter((invoice) => invoice.status === filter.toLowerCase() && (!search.trim() || `${invoice.invoiceNumber} ${invoice.customerName}`.toLowerCase().includes(search.trim().toLowerCase()))), [filter, invoices, search]);

  function createInvoice() {
    startNewInvoice();
    navigation.navigate("InvoiceCreate");
  }

  function openInvoice(item: ListRow) {
    const invoice = invoices.find((row) => row.invoiceNumber === item.invoiceNumber);
    if (loadInvoice(item.invoiceNumber)) navigation.navigate(invoice?.items.length ? "InvoicePreview" : "InvoiceCreate");
  }

  return <ScreenContainer>
    <ScreenHeader title="Invoices" rightIcon="add-circle" onRightPress={createInvoice} />
    <FlatList
      data={rows}
      keyExtractor={(item) => item.invoiceNumber}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={<View style={styles.headerContent}>
        <SegmentedTabs options={["Draft", "Sent", "Paid", "Overdue"] as const} value={filter} onChange={setFilter} />
        <SearchInput value={search} onChangeText={setSearch} placeholder="Search invoices or customers" />
      </View>}
      renderItem={({ item }) => <Pressable onPress={() => openInvoice(item)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.72 }]} accessibilityRole="button" accessibilityLabel={`${item.invoiceNumber}, ${item.customerName}, ${formatMoney(item.amount)}, ${item.status}`}>
        <IconTile icon="document-text-outline" tone={item.status === "paid" ? "mint" : item.status === "overdue" ? "rose" : "blue"} size={38} />
        <View style={styles.main}><Text style={styles.number}>{item.invoiceNumber}</Text><Text style={styles.customer}>{item.customerName}</Text><Text style={styles.date}>{formatDate(item.issuedAt)}</Text></View>
        <View style={styles.right}><Text style={styles.amount}>{formatMoney(item.amount)}</Text><StatusBadge status={item.status} /></View>
        <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
      </Pressable>}
      ListEmptyComponent={<EmptyState icon="document-text-outline" title={`No ${filter.toLowerCase()} invoices`} description="Create an invoice or choose another status." />}
    />
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxxl },
  headerContent: { gap: spacing.md, marginBottom: spacing.sm },
  row: { minHeight: 78, flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.divider, paddingVertical: spacing.sm },
  main: { flex: 1, minWidth: 0 },
  number: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
  customer: { color: colors.gray600, fontSize: uiType.caption, marginTop: 3 },
  date: { color: colors.gray500, fontSize: uiType.caption, marginTop: 2 },
  right: { alignItems: "flex-end", gap: 5, maxWidth: 108 },
  amount: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
});
