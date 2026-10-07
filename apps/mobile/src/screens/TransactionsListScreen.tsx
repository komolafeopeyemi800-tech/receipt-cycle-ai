import { useEffect, useMemo, useState } from "react";
import { useQuery } from "../lib/api";
import { api } from "../lib/api";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, gradients, type as typeScale } from "../theme/tokens";
import {
  addMonthsYm,
  buildSummary,
  formatMonthYearLabel,
  todayYm,
  ymToDateRange,
} from "../utils/transactionMath";
import type { DocTx } from "../types/transaction";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { QuickActionsRow } from "../components/QuickActionsRow";
import { ScreenHeader } from "../components/ScreenHeader";
import { FinancialPeriodSummary } from "../components/FinancialPeriodSummary";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { useSubscriptionState } from "../hooks/useSubscriptionState";
import { AppButton, IconTile, SectionHeader } from "../components/ui/FinanceUI";
import { useRecordsFilters } from "../contexts/RecordsFilterContext";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";

type Nav = CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, "Records">,
    NativeStackNavigationProp<RootStackParamList>
>;

export function TransactionsListScreen() {
  const navigation = useNavigation<Nav>();
  const { workspace, ready } = useWorkspace();
  const { user } = useAuth();
  const sub = useSubscriptionState();
  const { formatMoney, formatMoneyCompact, formatDate } = usePreferences();
  const { filters, setFilters } = useRecordsFilters();
  const [period, setPeriod] = useState<"month" | "all">("all");
  const [selectedYm, setSelectedYm] = useState(() => todayYm());
  const range =
    period === "month"
      ? (() => {
          const { start, end } = ymToDateRange(selectedYm);
          return { startStr: start, endStr: end };
        })()
      : null;
  const all = useQuery(
    api.transactions.list,
    ready
      ? {
          workspace,
          userId: user?.id,
          startDate: range?.startStr,
          endDate: range?.endStr,
        }
      : "skip",
  );
  const filter = filters.type;
  const setFilter = (type: "all" | "expense" | "income") => setFilters({ ...filters, type, category: null });

  const summary = useMemo(() => buildSummary((all ?? []) as DocTx[]), [all]);

  const baseFiltered = useMemo(() => {
    const raw = (all ?? []) as DocTx[];
    return filter === "all" ? raw : raw.filter((t) => t.type === filter);
  }, [all, filter]);

  const list = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const result = baseFiltered.filter((t) => {
      if (filters.category && (t.category?.trim() || "Uncategorized") !== filters.category) return false;
      if (filters.accountId && String(t.accountId) !== filters.accountId) return false;
      if (filters.startDate && t.date < filters.startDate) return false;
      if (filters.endDate && t.date > filters.endDate) return false;
      if (search && ![t.merchant, t.category, t.description, String(t.amount)].some((value) => value?.toLowerCase().includes(search))) return false;
      return true;
    });
    return result.sort((a, b) => {
      if (filters.sort === "oldest") return a.date.localeCompare(b.date);
      if (filters.sort === "amount_high") return b.amount - a.amount;
      if (filters.sort === "amount_low") return a.amount - b.amount;
      return b.date.localeCompare(a.date);
    });
  }, [baseFiltered, filters]);

  const groupedByDate = useMemo(() => {
    if (filters.sort === "amount_high" || filters.sort === "amount_low") return list.map((tx): [string, DocTx[]] => [tx.date, [tx]]);
    const map = new Map<string, DocTx[]>();
    for (const tx of list) {
      const d = tx.date;
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(tx);
    }
    return Array.from(map.entries()).sort((a, b) => filters.sort === "oldest" ? a[0].localeCompare(b[0]) : b[0].localeCompare(a[0]));
  }, [list, filters.sort]);

  useEffect(() => {
    if (filters.startDate || filters.endDate) setPeriod("all");
  }, [filters.startDate, filters.endDate]);

  const loading = !ready || all === undefined;

  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <ScreenHeader title="Records" />
      <ScrollView
        contentContainerStyle={styles.pad}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <FinancialPeriodSummary
          mode={period}
          onModeChange={(m) => {
            setPeriod(m);
            if (m === "month") setSelectedYm(todayYm());
            if (m === "month" && (filters.startDate || filters.endDate)) setFilters({ ...filters, startDate: null, endDate: null });
          }}
          monthLabel={formatMonthYearLabel(selectedYm)}
          onPrevMonth={() => setSelectedYm((ym) => addMonthsYm(ym, -1))}
          onNextMonth={() => setSelectedYm((ym) => addMonthsYm(ym, 1))}
          expense={summary.totalExpenses}
          income={summary.totalIncome}
          total={summary.netBalance}
          formatCompact={formatMoneyCompact}
          filter={filter}
          onFilterChange={setFilter}
        />

        <SectionHeader title="Quick Actions" />
        <QuickActionsRow />

        <AppButton label="Add transaction" icon="add" onPress={() => navigation.getParent()?.navigate("AddTransaction" as never)} style={{ marginBottom: 18 }} />
        <SectionHeader title="Recent Transactions" actionLabel="Filters" onAction={() => navigation.navigate("RecordsFilters")} />
        {filters.search || filters.category || filters.startDate || filters.endDate || filters.accountId || filters.sort !== "newest" ? <Pressable style={styles.activeFilter} onPress={() => navigation.navigate("RecordsFilters")}><Ionicons name="funnel-outline" size={15} color={colors.primary} /><Text style={styles.activeFilterText}>Filters applied · Edit filters</Text></Pressable> : null}

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : baseFiltered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={36} color={colors.gray400} />
            <Text style={styles.emptyTitle}>No transactions</Text>
            <Text style={styles.emptySub}>Tap + to scan or add manually.</Text>
          </View>
        ) : list.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="funnel-outline" size={36} color={colors.gray400} />
            <Text style={styles.emptyTitle}>No matching records</Text>
            <Text style={styles.emptySub}>Change your search or filters.</Text>
          </View>
        ) : (
          groupedByDate.map(([day, txs]) => (
            <View key={day} style={styles.dayGroup}>
              <Text style={styles.dayHeader}>{formatDate(day)}</Text>
              {txs.map((tx) => (
                <AnimatedPressable
                  key={tx.id}
                  containerStyle={styles.rowWrap}
                  style={styles.rowPressTarget}
                  onPress={() => navigation.navigate("TransactionDetail", { transactionId: tx.id })}
                  pressedScale={0.985}
                >
                  <View style={styles.row}>
                    <IconTile icon={tx.type === "income" ? "cash-outline" : "receipt-outline"} tone={tx.type === "income" ? "mint" : "amber"} size={36} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.merchant} numberOfLines={1}>
                        {tx.merchant || tx.category}
                      </Text>
                      <Text style={styles.meta} numberOfLines={1}>
                        {tx.category} · {formatDate(tx.date)} · {tx.type}
                      </Text>
                    </View>
                    <Text
                      style={[styles.amt, tx.type === "expense" ? styles.expense : styles.income]}
                      numberOfLines={1}
                    >
                      {tx.type === "expense" ? "-" : "+"}
                      {formatMoney(tx.amount)}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
                  </View>
                </AnimatedPressable>
              ))}
            </View>
          ))
        )}
        {!loading && list.length > 0 ? (
          <View style={styles.listEnd}>
            <Text style={styles.listEndTxt}>
              {list.length === 1 ? "1 transaction" : `${list.length} transactions`}
            </Text>
          </View>
        ) : null}
        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { padding: 16 },
  activeFilter: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: colors.mintSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 10 },
  activeFilterText: { color: colors.primary, fontSize: typeScale.sm, fontWeight: "700" },
  sectionLbl: {
    fontSize: typeScale.sm,
    fontWeight: "700",
    color: colors.gray600,
    marginBottom: 8,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  addBtnTxt: { color: "#fff", fontWeight: "700", fontSize: typeScale.body },
  catBlock: { marginBottom: 12 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.surface,
    maxWidth: "100%",
  },
  chipOn: { borderColor: colors.primary, backgroundColor: colors.emerald50 },
  chipTxt: { fontSize: typeScale.sm, fontWeight: "600", color: colors.gray700 },
  chipTxtOn: { color: colors.primary },
  dayGroup: { marginBottom: 10 },
  dayHeader: {
    fontSize: typeScale.xs,
    fontWeight: "800",
    color: colors.gray500,
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowPressTarget: { borderRadius: 10 },
  rowWrap: { marginBottom: 6 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.emerald50,
    alignItems: "center",
    justifyContent: "center",
  },
  merchant: { fontSize: typeScale.bodyStrong, fontWeight: "600", color: colors.gray900 },
  meta: { fontSize: typeScale.md, color: colors.gray500, marginTop: 2 },
  amt: { fontSize: typeScale.bodyStrong, fontWeight: "700", marginRight: 4, maxWidth: 120, textAlign: "right" },
  listEnd: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray200,
  },
  listEndTxt: { fontSize: typeScale.xs, color: colors.gray500, fontWeight: "600" },
  expense: { color: colors.rose600 },
  income: { color: colors.primary },
  empty: { alignItems: "center", padding: 28 },
  emptyTitle: { fontSize: typeScale.title, fontWeight: "700", color: colors.gray900, marginTop: 10 },
  emptySub: { fontSize: typeScale.body, color: colors.gray600, textAlign: "center", marginTop: 6 },
});
