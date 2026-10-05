import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppCard, IconTile } from "../components/ui/FinanceUI";
import { BudgetProgress, CategoryGlyph, ModuleDetailHeader, MoneySection } from "../components/ui/MoneyModuleUI";
import { useMoneyAppearance } from "../contexts/MoneyAppearanceContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useMonthMoneyData } from "../features/money/useMoneyData";
import { formatMonthYearLabel, roundMoney } from "../utils/transactionMath";
import { colors, radius, spacing, uiType } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";

export function BudgetDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "BudgetDetail">>();
  const { category, month, kind } = route.params;
  const { categories, budgets, transactions, loading } = useMonthMoneyData(month);
  const { formatMoney, formatDate } = usePreferences();
  const { appearance } = useMoneyAppearance();
  const [tab, setTab] = useState<"Trend" | "Transactions">("Trend");
  const cat = categories.find((item) => item.name === category && item.kind === kind);
  const limit = budgets.find((item) => item.category === category)?.limitAmount ?? 0;
  const rows = useMemo(() => transactions.filter((tx) => tx.category === category && tx.type === kind).sort((a, b) => b.date.localeCompare(a.date)), [transactions, category, kind]);
  const used = roundMoney(rows.reduce((sum, tx) => sum + Math.abs(tx.amount), 0));
  const remaining = roundMoney(limit - used);
  const percent = limit > 0 ? Math.round((used / limit) * 100) : 0;
  const days = useMemo(() => {
    const [year, number] = month.split("-").map(Number);
    const count = new Date(year, number, 0).getDate();
    const daily = new Map<number, number>();
    for (const tx of rows) { const day = Number(tx.date.slice(8, 10)); daily.set(day, (daily.get(day) ?? 0) + Math.abs(tx.amount)); }
    let cumulative = 0;
    return Array.from({ length: count }, (_, index) => { cumulative += daily.get(index + 1) ?? 0; return cumulative; });
  }, [month, rows]);
  const axisMax = Math.max(limit, used, 1);
  const edit = () => navigation.navigate("BudgetSet", { category, month, kind });

  return <View style={styles.root}>
    <ModuleDetailHeader title="Budget Detail" onBack={() => navigation.goBack()} actionIcon="ellipsis-horizontal" onAction={() => Alert.alert("Budget options", category, [{ text: "Edit budget", onPress: edit }, { text: "Cancel", style: "cancel" }])} />
    {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 28 }} /> : <FlatList
      data={tab === "Trend" ? rows.slice(0, 5) : rows}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
      ListHeaderComponent={<>
        <View style={styles.categoryHeader}><CategoryGlyph name={category} color={cat?.color} icon={cat ? appearance.categoryIcons[cat.id] : undefined} size={55} /><View><Text style={styles.categoryName}>{category}</Text><Text style={styles.month}>{formatMonthYearLabel(month)}</Text></View></View>
        <View style={styles.stats}><AppCard style={styles.stat}><Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{formatMoney(limit)}</Text><Text style={styles.statLabel}>Total Budget</Text></AppCard><AppCard style={styles.stat}><Text style={[styles.statValue, { color: colors.danger }]} numberOfLines={1} adjustsFontSizeToFit>{formatMoney(used)}</Text><Text style={styles.statLabel}>{kind === "expense" ? "Spent" : "Received"}</Text></AppCard><AppCard style={styles.stat}><Text style={[styles.statValue, { color: remaining < 0 ? colors.danger : colors.success }]} numberOfLines={1} adjustsFontSizeToFit>{formatMoney(remaining)}</Text><Text style={styles.statLabel}>Remaining</Text></AppCard></View>
        <View style={styles.progressRow}><BudgetProgress value={used} max={limit} color={used > limit && limit > 0 ? colors.danger : colors.primary} height={8} /><Text style={styles.progressLabel}>{percent}% used</Text></View>
        <View style={styles.tabs}>{(["Trend", "Transactions"] as const).map((name) => <Pressable key={name} style={[styles.tab, tab === name && styles.tabActive]} onPress={() => setTab(name)}><Text style={[styles.tabText, tab === name && styles.tabTextActive]}>{name}</Text></Pressable>)}</View>
        {tab === "Trend" ? <View style={styles.chartCard}><Text style={styles.chartTitle}>Cumulative {kind === "expense" ? "spending" : "income"}</Text><View style={styles.chartWrap}>{limit > 0 ? <View style={[styles.budgetLine, { top: Math.max(0, Math.round(124 * (1 - limit / axisMax))) }]} /> : null}<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bars}>{days.map((value, index) => <View key={index} style={styles.barCol}><View style={[styles.bar, { height: Math.max(2, Math.round((value / axisMax) * 124)) }]} /></View>)}</ScrollView></View><View style={styles.chartLegend}><View style={styles.legendDot} /><Text style={styles.legendText}>Actual</Text><View style={styles.legendDash} /><Text style={styles.legendText}>Budget</Text></View></View> : null}
        <MoneySection title={tab === "Trend" ? "Recent Transactions" : "Transactions"} action={tab === "Trend" && rows.length > 5 ? "See all" : undefined} onAction={() => setTab("Transactions")} />
      </>}
      renderItem={({ item }) => <Pressable style={styles.txRow} onPress={() => navigation.navigate("TransactionDetail", { transactionId: item.id })}><IconTile icon={item.type === "income" ? "cash-outline" : "receipt-outline"} tone={item.type === "income" ? "mint" : "amber"} size={34} /><View style={{ flex: 1 }}><Text style={styles.merchant} numberOfLines={1}>{item.merchant || item.category}</Text><Text style={styles.txDate}>{formatDate(item.date)}</Text></View><Text style={[styles.txAmount, item.type === "expense" && { color: colors.danger }]}>{item.type === "expense" ? "-" : "+"}{formatMoney(item.amount)}</Text></Pressable>}
      ListEmptyComponent={<Text style={styles.empty}>No {kind} transactions for this month.</Text>}
    />}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.lg, paddingBottom: 36 }, categoryHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.md }, categoryName: { color: colors.textPrimary, fontSize: uiType.sectionTitle, fontWeight: "800" }, month: { color: colors.gray600, fontSize: uiType.secondary, marginTop: 3 },
  stats: { flexDirection: "row", gap: 4, marginBottom: spacing.md }, stat: { flex: 1, minWidth: 0, padding: 6 }, statValue: { color: colors.primary, fontSize: 12, fontWeight: "800" }, statLabel: { color: colors.gray600, fontSize: 10, marginTop: 4 }, progressRow: { marginBottom: spacing.lg }, progressLabel: { color: colors.gray600, fontSize: uiType.caption, textAlign: "right", marginTop: 5 },
  tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.divider, marginBottom: spacing.md }, tab: { flex: 1, paddingVertical: 11, alignItems: "center" }, tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary }, tabText: { color: colors.gray600, fontSize: uiType.secondary, fontWeight: "700" }, tabTextActive: { color: colors.primary },
  chartCard: { backgroundColor: colors.surface, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.lg }, chartTitle: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "700", marginBottom: spacing.md }, chartWrap: { height: 132, borderBottomWidth: 1, borderBottomColor: colors.divider, justifyContent: "flex-end" }, budgetLine: { position: "absolute", top: 0, left: 0, right: 0, borderTopWidth: 1, borderStyle: "dashed", borderColor: colors.gray500 }, bars: { alignItems: "flex-end", gap: 3 }, barCol: { width: 6, height: 125, justifyContent: "flex-end" }, bar: { width: 6, borderTopLeftRadius: 2, borderTopRightRadius: 2, backgroundColor: colors.primary }, chartLegend: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: spacing.sm }, legendDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }, legendDash: { width: 13, borderTopWidth: 1, borderStyle: "dashed", borderColor: colors.gray500, marginLeft: 8 }, legendText: { fontSize: uiType.caption, color: colors.gray600 },
  txRow: { minHeight: 51, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider, backgroundColor: colors.surface, paddingHorizontal: spacing.sm }, merchant: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "700" }, txDate: { color: colors.gray500, fontSize: uiType.caption }, txAmount: { color: colors.success, fontSize: uiType.secondary, fontWeight: "800" }, empty: { color: colors.gray600, fontSize: uiType.body, textAlign: "center", marginTop: spacing.lg },
});
