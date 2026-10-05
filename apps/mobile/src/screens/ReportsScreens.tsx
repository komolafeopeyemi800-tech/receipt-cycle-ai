import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "../lib/api";
import { api } from "../lib/api";
import { IncomeExpenseBars } from "../components/IncomeExpenseBars";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppButton, AppCard, IconTile, KpiCard, ScreenContainer, SectionHeader, SegmentedTabs } from "../components/ui/FinanceUI";
import { useAuth } from "../contexts/AuthContext";
import { usePaymentFlow } from "../contexts/PaymentFlowContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import type { PaymentInvoice } from "../features/payments/model";
import type { RootStackParamList, SalesStackParamList } from "../navigation/types";
import { colors, radius, spacing, uiType } from "../theme/tokens";
import type { DocTx } from "../types/transaction";
import { buildSummary, roundMoney, todayYm, ymToDateRange } from "../utils/transactionMath";

type ReportsPeriod = "this_month" | "all_time";
type CashPeriod = "last_6_months" | "this_year";
type InvoiceFilter = "all" | "overdue" | "due_soon" | "paid";

function useAllTransactions() {
  const { workspace, ready } = useWorkspace();
  const { user } = useAuth();
  return useQuery(api.transactions.list, ready ? { workspace, userId: user?.id } : "skip") as DocTx[] | undefined;
}

function balance(invoice: PaymentInvoice) {
  return roundMoney(Math.max(0, invoice.total - invoice.amountPaid));
}

function localDate(ymd: string) {
  return new Date(`${ymd}T00:00:00`);
}

function daysBetween(from: Date, to: Date) {
  return Math.max(0, Math.ceil((to.getTime() - from.getTime()) / 86_400_000));
}

function monthSubset(rows: DocTx[]) {
  const { start, end } = ymToDateRange(todayYm());
  return rows.filter((row) => row.date >= start && row.date <= end);
}

export function ReportsHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SalesStackParamList>>();
  const root = navigation.getParent()?.getParent() as NativeStackNavigationProp<RootStackParamList> | undefined;
  const { paymentInvoices, payments } = usePaymentFlow();
  const { formatMoney, formatMoneyCompact } = usePreferences();
  const rows = useAllTransactions();
  const [period, setPeriod] = useState<ReportsPeriod>("this_month");
  const selected = useMemo(() => period === "this_month" ? monthSubset(rows ?? []) : rows ?? [], [period, rows]);
  const summary = useMemo(() => buildSummary(selected), [selected]);
  const outstanding = useMemo(() => roundMoney(paymentInvoices.reduce((sum, invoice) => sum + balance(invoice), 0)), [paymentInvoices]);
  const paidCount = useMemo(() => paymentInvoices.filter((invoice) => balance(invoice) === 0).length, [paymentInvoices]);
  const received = useMemo(() => roundMoney(payments.filter((payment) => payment.status !== "refunded").reduce((sum, payment) => sum + payment.amount, 0)), [payments]);

  return (
    <ScreenContainer>
      <ScreenHeader title="Reports" />
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <SegmentedTabs options={["this_month", "all_time"] as const} value={period} onChange={setPeriod} />
        {rows === undefined ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : <>
          <View style={styles.kpiRow}>
            <KpiCard title="Income" value={formatMoneyCompact(summary.totalIncome)} detail={`${summary.transactionCount} records`} tone="positive" />
            <KpiCard title="Expenses" value={formatMoneyCompact(summary.totalExpenses)} detail="Saved entries" tone="negative" />
          </View>

          <Pressable onPress={() => root?.navigate("CashFlowReport")} accessibilityRole="button">
            <AppCard style={styles.profitCard}>
              <View style={styles.flexCopy}>
                <Text style={styles.mutedLabel}>Profit</Text>
                <Text style={[styles.heroValue, { color: summary.netBalance >= 0 ? colors.success : colors.danger }]}>{formatMoney(summary.netBalance)}</Text>
                <Text style={styles.detail}>{summary.netBalance >= 0 ? "Income after expenses" : "Expenses exceed income"}</Text>
              </View>
              <IconTile icon="bar-chart-outline" tone="mint" size={46} />
              <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
            </AppCard>
          </Pressable>

          <View style={styles.kpiRow}>
            <Pressable style={styles.flexPress} onPress={() => root?.navigate("OverdueInvoicesReport")}><KpiCard title="Outstanding invoices" value={formatMoneyCompact(outstanding)} detail={`${paymentInvoices.filter((invoice) => balance(invoice) > 0).length} invoices`} tone="negative" /></Pressable>
            <Pressable style={styles.flexPress} onPress={() => navigation.navigate("SalesPayments")}><KpiCard title="Payments received" value={formatMoneyCompact(received)} detail={`${paidCount} paid invoices`} tone="positive" /></Pressable>
          </View>

          <AppCard>
            <SectionHeader title="Income vs Expense" actionLabel="Cash flow" onAction={() => root?.navigate("CashFlowReport")} />
            <IncomeExpenseBars transactions={rows ?? []} />
          </AppCard>

          <AppCard style={styles.toolCard}>
            <Text style={styles.sectionTitle}>Reports & insights</Text>
            <ReportLink icon="cash-outline" tone="mint" title="Cash Flow Report" description="Follow money coming in and going out" onPress={() => root?.navigate("CashFlowReport")} />
            <ReportLink icon="alert-circle-outline" tone="rose" title="Overdue Invoices" description="Review balances and send reminders" onPress={() => root?.navigate("OverdueInvoicesReport")} />
            <ReportLink icon="sparkles-outline" tone="purple" title="Ask AI" description="Ask questions about your saved records" onPress={() => root?.navigate("FinanceCoach")} last />
          </AppCard>
        </>}
      </ScrollView>
    </ScreenContainer>
  );
}

export function CashFlowReportScreen() {
  const rows = useAllTransactions();
  const { formatMoney, formatMoneyCompact } = usePreferences();
  const [period, setPeriod] = useState<CashPeriod>("last_6_months");
  const selected = useMemo(() => {
    const all = rows ?? [];
    const now = new Date();
    const start = period === "this_year" ? `${now.getFullYear()}-01-01` : `${new Date(now.getFullYear(), now.getMonth() - 5, 1).getFullYear()}-${String(new Date(now.getFullYear(), now.getMonth() - 5, 1).getMonth() + 1).padStart(2, "0")}-01`;
    return all.filter((row) => row.date >= start);
  }, [period, rows]);
  const summary = useMemo(() => buildSummary(selected), [selected]);
  const netPositive = summary.netBalance >= 0;

  return (
    <ScreenContainer>
      <ScreenHeader title="Cash Flow Report" back />
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <SegmentedTabs options={["last_6_months", "this_year"] as const} value={period} onChange={setPeriod} />
        {rows === undefined ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : <>
          <View style={styles.kpiRow}>
            <KpiCard title="Total inflow" value={formatMoneyCompact(summary.totalIncome)} detail="Income records" tone="positive" />
            <KpiCard title="Total outflow" value={formatMoneyCompact(summary.totalExpenses)} detail="Expense records" tone="negative" />
          </View>
          <AppCard style={styles.netCard}>
            <IconTile icon="trending-up-outline" tone={netPositive ? "blue" : "rose"} size={48} />
            <View style={styles.flexCopy}>
              <Text style={styles.mutedLabel}>Net cash flow</Text>
              <Text style={[styles.heroValue, { color: netPositive ? colors.success : colors.danger }]}>{formatMoney(summary.netBalance)}</Text>
              <Text style={styles.detail}>{summary.savingsRate === null ? "Add income to calculate your cash-flow rate" : `${Math.abs(summary.savingsRate)}% of income ${netPositive ? "retained" : "overspent"}`}</Text>
            </View>
          </AppCard>
          <AppCard>
            <SectionHeader title="Monthly Cash Flow" />
            <IncomeExpenseBars transactions={selected} />
          </AppCard>
          <AppCard style={styles.insightCard}>
            <IconTile icon="bulb-outline" tone="purple" size={42} />
            <View style={styles.flexCopy}>
              <Text style={styles.rowTitle}>Key insight</Text>
              <Text style={styles.rowSub}>{selected.length === 0 ? "Add income and expenses to see a cash-flow insight." : netPositive ? `You kept ${formatMoney(summary.netBalance)} after expenses in this period.` : `Outflow exceeded inflow by ${formatMoney(Math.abs(summary.netBalance))} in this period.`}</Text>
            </View>
          </AppCard>
        </>}
      </ScrollView>
    </ScreenContainer>
  );
}

export function OverdueInvoicesReportScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { paymentInvoices } = usePaymentFlow();
  const { formatMoney, formatMoneyCompact, formatDate } = usePreferences();
  const [filter, setFilter] = useState<InvoiceFilter>("overdue");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const categorized = useMemo(() => paymentInvoices.map((invoice) => {
    const remaining = balance(invoice);
    const due = localDate(invoice.dueDate);
    const isPaid = remaining === 0;
    const isOverdue = !isPaid && due < today;
    const days = isOverdue ? daysBetween(due, today) : daysBetween(today, due);
    const isDueSoon = !isPaid && !isOverdue && days <= 14;
    return { invoice, remaining, isPaid, isOverdue, isDueSoon, days };
  }), [paymentInvoices, today.getTime()]);
  const shown = categorized.filter((row) => filter === "all" || (filter === "paid" ? row.isPaid : filter === "overdue" ? row.isOverdue : row.isDueSoon));
  const overdue = categorized.filter((row) => row.isOverdue);
  const overdueAmount = roundMoney(overdue.reduce((sum, row) => sum + row.remaining, 0));
  const averageDays = overdue.length ? Math.round(overdue.reduce((sum, row) => sum + row.days, 0) / overdue.length) : 0;

  async function sendReminders() {
    const emails = overdue.map((row) => row.invoice.customerEmail.trim()).filter(Boolean);
    if (!emails.length) {
      Alert.alert("No email addresses", "Add customer email addresses before sending payment reminders.");
      return;
    }
    const subject = encodeURIComponent("Payment reminder from Receipt Cycle");
    const body = encodeURIComponent("Hello,\n\nThis is a friendly reminder that an invoice balance is overdue. Please reply if you need a copy or would like to discuss payment.\n\nThank you.");
    const url = `mailto:?bcc=${encodeURIComponent([...new Set(emails)].join(","))}&subject=${subject}&body=${body}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
    else Alert.alert("Email unavailable", "No email app is configured on this device.");
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="Overdue Invoices" back />
      <View style={styles.filterWrap}><SegmentedTabs options={["all", "overdue", "due_soon", "paid"] as const} value={filter} onChange={setFilter} /></View>
      <View style={[styles.kpiRow, styles.horizontalPage]}>
        <KpiCard title="Overdue amount" value={formatMoneyCompact(overdueAmount)} detail={`${overdue.length} invoices`} tone="negative" />
        <KpiCard title="Avg. days overdue" value={`${averageDays} days`} detail="Open balances" tone="info" />
      </View>
      <View style={styles.listHeading}><Text style={styles.sectionTitle}>{filter === "all" ? "All invoices" : filter === "paid" ? "Paid invoices" : filter === "due_soon" ? "Due soon" : "Overdue invoices"}</Text><Text style={styles.countLabel}>{shown.length}</Text></View>
      <ScrollView contentContainerStyle={styles.invoiceList} showsVerticalScrollIndicator={false}>
        {shown.length === 0 ? <AppCard style={styles.emptyCard}><Ionicons name="checkmark-circle-outline" size={34} color={colors.success} /><Text style={styles.rowTitle}>Nothing here</Text><Text style={styles.rowSub}>No invoices match this filter.</Text></AppCard> : shown.map(({ invoice, remaining, isPaid, isOverdue, days }) => (
          <Pressable key={invoice.invoiceNumber} onPress={() => navigation.navigate("PaymentInvoiceDetail", { invoiceNumber: invoice.invoiceNumber })} style={styles.invoiceRow} accessibilityRole="button">
            <IconTile icon="document-text-outline" tone={isPaid ? "mint" : isOverdue ? "rose" : "blue"} size={40} />
            <View style={styles.flexCopy}>
              <Text style={styles.rowTitle}>{invoice.customerName}</Text>
              <Text style={styles.rowSub}>{invoice.invoiceNumber} · Due {formatDate(invoice.dueDate)}</Text>
            </View>
            <View style={styles.amountCopy}>
              <Text style={[styles.amountText, { color: isOverdue ? colors.danger : isPaid ? colors.success : colors.textPrimary }]}>{isPaid ? "Paid" : formatMoney(remaining)}</Text>
              <Text style={[styles.daysText, isOverdue && { color: colors.danger }]}>{isPaid ? "Complete" : isOverdue ? `${days} days late` : `Due in ${days} days`}</Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.gray400} />
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.footerAction}><AppButton label="Send payment reminders" icon="notifications-outline" onPress={() => void sendReminders()} disabled={!overdue.length} /></View>
    </ScreenContainer>
  );
}

function ReportLink({ icon, tone, title, description, onPress, last }: { icon: React.ComponentProps<typeof Ionicons>["name"]; tone: "mint" | "rose" | "purple"; title: string; description: string; onPress: () => void; last?: boolean }) {
  return <Pressable onPress={onPress} style={[styles.reportRow, !last && styles.divider]} accessibilityRole="button"><IconTile icon={icon} tone={tone} size={38} /><View style={styles.flexCopy}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowSub}>{description}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.gray400} /></Pressable>;
}

const styles = StyleSheet.create({
  page: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxxl, gap: spacing.md },
  horizontalPage: { paddingHorizontal: spacing.lg },
  loader: { marginVertical: spacing.xxxl },
  kpiRow: { flexDirection: "row", gap: spacing.sm },
  flexPress: { flex: 1 },
  profitCard: { minHeight: 92, flexDirection: "row", alignItems: "center", gap: spacing.md },
  netCard: { minHeight: 100, flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: "#f5f9ff" },
  flexCopy: { flex: 1, minWidth: 0 },
  mutedLabel: { color: colors.gray600, fontSize: uiType.secondary, fontWeight: "600" },
  heroValue: { fontSize: uiType.kpi, fontWeight: "900", marginTop: 3 },
  detail: { color: colors.gray500, fontSize: uiType.caption, marginTop: 3 },
  toolCard: { paddingTop: spacing.md, paddingBottom: 0 },
  sectionTitle: { color: colors.textPrimary, fontSize: uiType.sectionTitle, fontWeight: "800" },
  reportRow: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: spacing.md },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowTitle: { color: colors.textPrimary, fontSize: uiType.body, fontWeight: "700" },
  rowSub: { color: colors.textSecondary, fontSize: uiType.caption, lineHeight: 16, marginTop: 2 },
  insightCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.purpleSoft },
  filterWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  listHeading: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  countLabel: { color: colors.gray500, fontSize: uiType.secondary, fontWeight: "700" },
  invoiceList: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  invoiceRow: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  amountCopy: { alignItems: "flex-end", maxWidth: 100 },
  amountText: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
  daysText: { color: colors.gray500, fontSize: uiType.caption, marginTop: 2 },
  emptyCard: { alignItems: "center", paddingVertical: spacing.xxl, gap: spacing.xs },
  footerAction: { padding: spacing.lg, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.divider, backgroundColor: colors.surface },
});
