import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { DocTx } from "../types/transaction";
import { colors, spacing, uiType } from "../theme/tokens";

/** Compact six-month comparison, driven by saved transactions. */
export function IncomeExpenseBars({ transactions }: { transactions: DocTx[] }) {
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
  return <View>
    <View style={styles.legend}><View style={[styles.dot, { backgroundColor: colors.primary }]} /><Text style={styles.legendText}>Income</Text><View style={[styles.dot, { backgroundColor: colors.danger }]} /><Text style={styles.legendText}>Expense</Text></View>
    {!hasData ? <Text style={styles.empty}>No income or expense records in the last six months.</Text> : null}
    <View style={styles.plot}>{months.map((month) => <View key={month.key} style={styles.month}><View style={styles.bars}><View style={[styles.bar, { height: `${Math.max(3, (month.income / peak) * 100)}%`, backgroundColor: colors.primary }]} /><View style={[styles.bar, { height: `${Math.max(3, (month.expense / peak) * 100)}%`, backgroundColor: colors.danger }]} /></View><Text style={styles.monthLabel}>{month.label}</Text></View>)}</View>
  </View>;
}

const styles = StyleSheet.create({
  legend: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 5, marginBottom: spacing.sm },
  dot: { width: 7, height: 7, borderRadius: 4, marginLeft: spacing.sm },
  legendText: { fontSize: uiType.caption, color: colors.gray600 },
  empty: { color: colors.gray500, fontSize: uiType.secondary, textAlign: "center", marginBottom: spacing.sm },
  plot: { height: 114, flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.divider, borderTopWidth: 1, borderTopColor: colors.divider },
  month: { flex: 1, alignItems: "center" },
  bars: { flex: 1, width: "100%", flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 3, paddingHorizontal: 3 },
  bar: { width: 8, minHeight: 3, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  monthLabel: { color: colors.gray600, fontSize: uiType.caption, paddingVertical: 4 },
});
