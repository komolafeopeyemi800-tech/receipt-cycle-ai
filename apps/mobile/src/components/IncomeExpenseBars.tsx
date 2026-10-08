import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { DocTx } from "../types/transaction";
import { colors, spacing, uiType } from "../theme/tokens";

/** Compact six-month comparison, driven by saved transactions. */
export function IncomeExpenseBars({ transactions }: { transactions: DocTx[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const subset = transactions.filter((item) => item.date.startsWith(key));
      return { key, label: date.toLocaleString(undefined, { month: "short" }), income: subset.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0), expense: subset.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0) };
    });
  }, [transactions]);
  const hasData = months.some((month) => month.income > 0 || month.expense > 0);
  const peak = Math.max(1, ...months.flatMap((month) => [month.income, month.expense]));
  const active = months.find((month) => month.key === selected);
  const compact = (value: number) => Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(value);
  return <View>
    <View style={styles.legend}><View style={[styles.dot, { backgroundColor: colors.primary }]} /><Text style={styles.legendText}>Income</Text><View style={[styles.dot, { backgroundColor: colors.danger }]} /><Text style={styles.legendText}>Expense</Text></View>
    {!hasData ? <Text style={styles.empty}>No income or expense records in the last six months.</Text> : null}
    {active ? <View style={styles.tooltip}><Text style={styles.tooltipMonth}>{active.label}</Text><Text style={styles.tooltipIncome}>Income {compact(active.income)}</Text><Text style={styles.tooltipExpense}>Expense {compact(active.expense)}</Text></View> : <Text style={styles.chartHint}>Tap a month to inspect its values</Text>}
    <View style={styles.plot}>{months.map((month) => <Pressable key={month.key} style={[styles.month, selected === month.key && styles.monthSelected]} onPress={() => setSelected((value) => value === month.key ? null : month.key)} accessibilityRole="button" accessibilityLabel={`${month.label}: income ${month.income}, expense ${month.expense}`}><View style={styles.bars}><View style={[styles.bar, { height: `${Math.max(3, (month.income / peak) * 100)}%`, backgroundColor: colors.primary }]} /><View style={[styles.bar, { height: `${Math.max(3, (month.expense / peak) * 100)}%`, backgroundColor: colors.danger }]} /></View><Text style={styles.monthLabel}>{month.label}</Text></Pressable>)}</View>
  </View>;
}

const styles = StyleSheet.create({
  legend: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 5, marginBottom: spacing.sm },
  dot: { width: 7, height: 7, borderRadius: 4, marginLeft: spacing.sm },
  legendText: { fontSize: uiType.caption, color: colors.gray600 },
  empty: { color: colors.gray500, fontSize: uiType.secondary, textAlign: "center", marginBottom: spacing.sm },
  chartHint: { color: colors.gray500, fontSize: uiType.caption, textAlign: "center", marginBottom: 6 },
  tooltip: { minHeight: 30, borderRadius: 9, backgroundColor: colors.surfaceSoft, paddingHorizontal: spacing.sm, marginBottom: 6, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  tooltipMonth: { color: colors.textPrimary, fontSize: uiType.caption, fontWeight: "800" },
  tooltipIncome: { color: colors.primary, fontSize: uiType.caption, fontWeight: "700" },
  tooltipExpense: { color: colors.danger, fontSize: uiType.caption, fontWeight: "700" },
  plot: { height: 114, flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.divider, borderTopWidth: 1, borderTopColor: colors.divider },
  month: { flex: 1, alignItems: "center" },
  monthSelected: { backgroundColor: colors.surfaceSoft, borderRadius: 7 },
  bars: { flex: 1, width: "100%", flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 3, paddingHorizontal: 3 },
  bar: { width: 8, minHeight: 3, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  monthLabel: { color: colors.gray600, fontSize: uiType.caption, paddingVertical: 4 },
});
