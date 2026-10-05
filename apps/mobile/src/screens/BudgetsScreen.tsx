import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "../lib/api";
import { useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../lib/api";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppCard, EmptyState, SegmentedTabs } from "../components/ui/FinanceUI";
import { BudgetDonut, BudgetProgress, CategoryGlyph, MoneySection } from "../components/ui/MoneyModuleUI";
import { useMoneyAppearance } from "../contexts/MoneyAppearanceContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useMonthMoneyData } from "../features/money/useMoneyData";
import { addMonthsYm, formatMonthYearLabel, roundMoney, todayYm } from "../utils/transactionMath";
import { colors, radius, spacing, uiType } from "../theme/tokens";
import type { MoreStackParamList, RootStackParamList } from "../navigation/types";

type Nav = CompositeNavigationProp<NativeStackNavigationProp<MoreStackParamList>, NativeStackNavigationProp<RootStackParamList>>;

export function BudgetsScreen() {
  const navigation = useNavigation<Nav>();
  const { formatMoney } = usePreferences();
  const { appearance } = useMoneyAppearance();
  const [month, setMonth] = useState(todayYm);
  const [showPicker, setShowPicker] = useState(false);
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const { workspace, ready, categories, budgets, amountByCategory, loading } = useMonthMoneyData(month);
  const ensureCats = useMutation(api.categories.ensureSeed);
  useEffect(() => { if (ready) void ensureCats({ workspace }); }, [ready, workspace, ensureCats]);

  const rows = useMemo(() => {
    const visible = categories.filter((cat) => cat.kind === kind);
    return visible.map((cat) => ({ ...cat, limit: budgets.find((budget) => budget.category === cat.name)?.limitAmount ?? 0, amount: amountByCategory[kind].get(cat.name) ?? 0 }));
  }, [categories, budgets, amountByCategory, kind]);
  const totalBudget = roundMoney(rows.reduce((sum, row) => sum + row.limit, 0));
  const totalUsed = roundMoney(rows.reduce((sum, row) => sum + (row.limit > 0 ? row.amount : 0), 0));
  const remaining = roundMoney(totalBudget - totalUsed);
  const percent = totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0;
  const label = kind === "expense" ? "Spent" : "Received";

  return <View style={styles.root}>
    <ScreenHeader title="Budgets" />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.monthRow}>
        <Pressable onPress={() => setMonth((value) => addMonthsYm(value, -1))} style={styles.monthArrow} accessibilityLabel="Previous month"><Ionicons name="chevron-back" size={20} color={colors.textPrimary} /></Pressable>
        <Pressable onPress={() => setMonth((value) => addMonthsYm(value, 1))} style={styles.monthLabel} accessibilityLabel="Next month"><Text style={styles.monthText}>{formatMonthYearLabel(month)}</Text><Ionicons name="chevron-forward" size={15} color={colors.primary} /></Pressable>
        <Pressable onPress={() => setShowPicker(true)} style={styles.monthArrow} accessibilityLabel="Choose month"><Ionicons name="calendar-outline" size={19} color={colors.primary} /></Pressable>
      </View>
      {showPicker ? <><DateTimePicker value={new Date(`${month}-01T12:00:00`)} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={(_, selected) => { if (Platform.OS === "android") setShowPicker(false); if (selected) setMonth(`${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}`); }} />{Platform.OS === "ios" ? <Pressable onPress={() => setShowPicker(false)}><Text style={styles.pickerDone}>Done</Text></Pressable> : null}</> : null}

      <View style={styles.overview}>
        <BudgetDonut value={totalUsed} max={totalBudget} size={124}>
          <Text style={styles.donutValue} numberOfLines={1} adjustsFontSizeToFit>{formatMoney(totalBudget)}</Text>
          <Text style={styles.donutLabel}>Total Budget</Text>
        </BudgetDonut>
        <View style={styles.overviewNumbers}>
          <View style={styles.overviewStat}><Ionicons name="close-circle" size={17} color={colors.rose600} /><View><Text style={styles.statValue}>{formatMoney(totalUsed)}</Text><Text style={styles.statLabel}>{label}</Text></View></View>
          <View style={styles.overviewStat}><Ionicons name="checkmark-circle" size={17} color={colors.success} /><View><Text style={[styles.statValue, remaining < 0 && { color: colors.danger }]}>{formatMoney(remaining)}</Text><Text style={styles.statLabel}>Remaining</Text></View></View>
          <Text style={styles.percent}>{percent}% used</Text>
        </View>
      </View>

      <SegmentedTabs options={["expense", "income"] as const} value={kind} onChange={setKind} />
      <MoneySection title="Category Budgets" action="See all" onAction={() => navigation.navigate("Categories")} />
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} /> : rows.length === 0 ? <EmptyState icon="pie-chart-outline" title="No categories yet" description="Add a category to plan your money." /> : rows.map((row) => {
        const used = row.limit > 0 ? Math.round((row.amount / row.limit) * 100) : 0;
        return <Pressable key={row.id} style={styles.budgetRow} onPress={() => navigation.navigate(row.limit > 0 ? "BudgetDetail" : "BudgetSet", { category: row.name, month, kind })} accessibilityRole="button" accessibilityLabel={`${row.name} budget`}>
          <CategoryGlyph name={row.name} color={row.color} icon={appearance.categoryIcons[row.id]} size={38} />
          <View style={styles.rowMain}><Text style={styles.rowName} numberOfLines={1}>{row.name}</Text><Text style={styles.rowAmounts}>{formatMoney(row.amount)} / {row.limit > 0 ? formatMoney(row.limit) : "Set budget"}</Text><BudgetProgress value={row.amount} max={row.limit} color={row.amount > row.limit && row.limit > 0 ? colors.danger : colors.primary} /></View>
          <Text style={styles.rowPct}>{row.limit > 0 ? `${used}%` : "Add"}</Text>
        </Pressable>;
      })}
      <AppCard style={styles.helpCard}><Ionicons name="information-circle-outline" size={18} color={colors.primary} /><Text style={styles.helpText}>The total compares categories with a budget set for this month. Other transactions remain visible in Records.</Text></AppCard>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.lg, paddingBottom: 100 },
  monthRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.md },
  monthArrow: { width: 34, height: 36, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  monthLabel: { flex: 1, height: 36, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  monthText: { fontSize: uiType.body, fontWeight: "700", color: colors.textPrimary },
  pickerDone: { color: colors.primary, fontWeight: "700", textAlign: "right", marginBottom: spacing.sm },
  overview: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg },
  donutValue: { fontSize: 15, fontWeight: "800", color: colors.textPrimary, maxWidth: 92, textAlign: "center" }, donutLabel: { fontSize: 10, color: colors.gray600, marginTop: 2 },
  overviewNumbers: { flex: 1, gap: 9 }, overviewStat: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  statValue: { fontSize: 15, fontWeight: "800", color: colors.primary }, statLabel: { fontSize: uiType.caption, color: colors.gray600 }, percent: { textAlign: "center", fontSize: uiType.caption, fontWeight: "800", color: colors.gray700 },
  budgetRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowMain: { flex: 1, minWidth: 0, gap: 3 }, rowName: { fontSize: uiType.secondary, fontWeight: "700", color: colors.textPrimary }, rowAmounts: { fontSize: uiType.caption, color: colors.gray600 }, rowPct: { fontSize: uiType.caption, fontWeight: "700", color: colors.gray700, minWidth: 34, textAlign: "right" },
  helpCard: { flexDirection: "row", gap: 8, backgroundColor: colors.blueSoft, marginTop: spacing.xl }, helpText: { flex: 1, fontSize: uiType.caption, color: colors.gray700, lineHeight: 16 },
});
