import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
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
import type { MainTabParamList, RootStackParamList } from "../navigation/types";

type Nav = CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, "Records">,
    NativeStackNavigationProp<RootStackParamList>
>;

export function TransactionsListScreen() {
  const navigation = useNavigation<Nav>();
  const { workspace, ready } = useWorkspace();
  const { user } = useAuth();
  const { formatMoney, formatMoneyCompact, formatDate } = usePreferences();
  const [period, setPeriod] = useState<"month" | "all">("all");
  const [selectedYm, setSelectedYm] = useState(() => todayYm());
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
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
  const [filter, setFilter] = useState<"all" | "expense" | "income">("all");

  const summary = useMemo(() => buildSummary((all ?? []) as DocTx[]), [all]);

  const baseFiltered = useMemo(() => {
    const raw = (all ?? []) as DocTx[];
    return filter === "all" ? raw : raw.filter((t) => t.type === filter);
  }, [all, filter]);

  const categoriesWithCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of baseFiltered) {
      const c = t.category?.trim() || "Uncategorized";
      m.set(c, (m.get(c) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [baseFiltered]);

  const list = useMemo(() => {
    if (!categoryFilter) return baseFiltered;
    return baseFiltered.filter((t) => (t.category?.trim() || "Uncategorized") === categoryFilter);
  }, [baseFiltered, categoryFilter]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, DocTx[]>();
    for (const tx of list) {
      const d = tx.date;
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(tx);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [list]);

  useEffect(() => {
    setCategoryFilter(null);
  }, [period, selectedYm, filter]);

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

        <Text style={styles.sectionLbl}>Quick actions</Text>
        <QuickActionsRow />

        <AnimatedPressable
          style={styles.addBtn}
          onPress={() => navigation.getParent()?.navigate("AddTransaction" as never)}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnTxt}>Add transaction</Text>
        </AnimatedPressable>

        {!loading && categoriesWithCounts.length > 0 ? (
          <View style={styles.catBlock}>
            <Text style={styles.sectionLbl}>Categories in this view</Text>
            <View style={styles.chipWrap}>
              <Pressable
                style={[styles.chip, categoryFilter === null && styles.chipOn]}
                onPress={() => setCategoryFilter(null)}
              >
                <Text style={[styles.chipTxt, categoryFilter === null && styles.chipTxtOn]}>All</Text>
              </Pressable>
              {categoriesWithCounts.map(([cat, n]) => (
                <Pressable
                  key={cat}
                  style={[styles.chip, categoryFilter === cat && styles.chipOn]}
                  onPress={() => setCategoryFilter((prev) => (prev === cat ? null : cat))}
                >
                  <Text style={[styles.chipTxt, categoryFilter === cat && styles.chipTxtOn]} numberOfLines={1}>
                    {cat} ({n})
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

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
            <Text style={styles.emptyTitle}>Nothing in this category</Text>
            <Text style={styles.emptySub}>Clear the category chip or pick another.</Text>
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
                    <View style={styles.rowIcon}>
                      <Ionicons name="receipt-outline" size={16} color={colors.primary} />
                    </View>
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
  pad: { padding: 14 },
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
  dayGroup: { marginBottom: 14 },
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
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
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
