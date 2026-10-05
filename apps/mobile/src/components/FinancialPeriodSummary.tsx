import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppCard, KpiCard } from "./ui/FinanceUI";
import { colors, radius, spacing, uiType } from "../theme/tokens";

export type PeriodMode = "month" | "all";
type Filter = "all" | "expense" | "income";

type Props = {
  mode: PeriodMode;
  onModeChange: (mode: PeriodMode) => void;
  monthLabel: string;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  monthNavDisabled?: boolean;
  expense: number;
  income: number;
  total: number;
  formatCompact: (amount: number) => string;
  filter?: Filter;
  onFilterChange?: (filter: Filter) => void;
  variant?: "records" | "analysis";
};

export function FinancialPeriodSummary({ mode, onModeChange, monthLabel, onPrevMonth, onNextMonth, monthNavDisabled, expense, income, total, formatCompact, filter, onFilterChange, variant = "records" }: Props) {
  const [filterOpen, setFilterOpen] = useState(false);
  const hasFilter = filter !== undefined && onFilterChange !== undefined;
  return <View style={styles.wrap}>
    <View style={styles.controls}>
      <View style={styles.modeRow}>
        {(["month", "all"] as const).map((item) => <Pressable key={item} onPress={() => onModeChange(item)} style={[styles.modeChip, mode === item && styles.modeChipActive]} accessibilityRole="button" accessibilityState={{ selected: mode === item }}><Text style={[styles.modeText, mode === item && styles.modeTextActive]}>{item === "month" ? "Month" : "All time"}</Text></Pressable>)}
      </View>
      <View style={styles.controlEnd}>
        {hasFilter ? <Pressable style={styles.iconButton} onPress={() => setFilterOpen(true)} accessibilityLabel="Filter records"><Ionicons name="options-outline" size={19} color={colors.gray600} /></Pressable> : null}
        <Pressable style={styles.iconButton} onPress={() => onModeChange("month")} accessibilityLabel="Choose month"><Ionicons name="calendar-outline" size={19} color={colors.gray600} /></Pressable>
      </View>
    </View>
    {mode === "month" ? <View style={styles.monthNav}>
      <Pressable onPress={onPrevMonth} disabled={monthNavDisabled} accessibilityLabel="Previous month" style={styles.monthArrow}><Ionicons name="chevron-back" size={18} color={colors.primary} /></Pressable>
      <Text style={styles.monthLabel}>{monthLabel}</Text>
      <Pressable onPress={onNextMonth} disabled={monthNavDisabled} accessibilityLabel="Next month" style={styles.monthArrow}><Ionicons name="chevron-forward" size={18} color={colors.primary} /></Pressable>
    </View> : null}
    {variant === "analysis" ? <View style={styles.analysisCards}>
      <KpiCard title="Total Income" value={formatCompact(income)} tone="positive" />
      <KpiCard title="Total Expense" value={formatCompact(expense)} tone="negative" />
    </View> : <AppCard style={styles.totalsCard}>
      <View style={styles.totalsRow}>
        <View style={styles.totalCol}><Text style={styles.totalLabel}>EXPENSE</Text><Text style={[styles.totalValue, { color: colors.danger }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>{formatCompact(expense)}</Text></View>
        <View style={styles.totalCol}><Text style={styles.totalLabel}>INCOME</Text><Text style={[styles.totalValue, { color: colors.success }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>{formatCompact(income)}</Text></View>
        <View style={styles.totalCol}><Text style={styles.totalLabel}>TOTAL</Text><Text style={[styles.totalValue, { color: total < 0 ? colors.danger : colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>{total < 0 ? "-" : ""}{formatCompact(Math.abs(total))}</Text></View>
      </View>
    </AppCard>}
    {hasFilter ? <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}><Pressable style={styles.backdrop} onPress={() => setFilterOpen(false)}><Pressable style={styles.modal} onPress={(event) => event.stopPropagation()}><Text style={styles.modalTitle}>Show transactions</Text>{(["all", "expense", "income"] as const).map((item) => <Pressable key={item} style={[styles.modalRow, filter === item && styles.modalRowActive]} onPress={() => { onFilterChange(item); setFilterOpen(false); }}><Text style={styles.modalRowText}>{item === "all" ? "All" : item === "expense" ? "Expenses only" : "Income only"}</Text>{filter === item ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}</Pressable>)}<Pressable onPress={() => setFilterOpen(false)} style={styles.close}><Text style={styles.closeText}>Close</Text></Pressable></Pressable></Pressable></Modal> : null}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  controls: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  modeRow: { flexDirection: "row", gap: spacing.xs },
  modeChip: { minWidth: 56, minHeight: 30, paddingHorizontal: spacing.md, alignItems: "center", justifyContent: "center", borderRadius: radius.pill, borderColor: colors.border, borderWidth: 1, backgroundColor: colors.surface },
  modeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeText: { color: colors.gray600, fontSize: uiType.caption, fontWeight: "700" },
  modeTextActive: { color: "#fff" },
  controlEnd: { flexDirection: "row" },
  iconButton: { width: 34, height: 34, justifyContent: "center", alignItems: "center" },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.medium },
  monthArrow: { width: 36, height: 32, alignItems: "center", justifyContent: "center" },
  monthLabel: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "700" },
  totalsCard: { paddingHorizontal: spacing.sm, paddingVertical: spacing.md },
  totalsRow: { flexDirection: "row", gap: spacing.xs },
  totalCol: { flex: 1, minWidth: 0, alignItems: "center" },
  totalLabel: { color: colors.gray500, fontSize: 10, fontWeight: "700", marginBottom: spacing.xs },
  totalValue: { width: "100%", textAlign: "center", fontSize: uiType.secondary, fontWeight: "800" },
  analysisCards: { flexDirection: "row", gap: spacing.sm },
  backdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.45)", justifyContent: "center", padding: spacing.xxl },
  modal: { backgroundColor: colors.surface, borderRadius: radius.large, padding: spacing.lg },
  modalTitle: { color: colors.textPrimary, fontSize: uiType.sectionTitle, fontWeight: "800", marginBottom: spacing.md },
  modalRow: { borderColor: colors.border, borderWidth: 1, borderRadius: radius.medium, minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  modalRowActive: { borderColor: colors.primary, backgroundColor: colors.mintSoft },
  modalRowText: { color: colors.textPrimary, fontSize: uiType.body, fontWeight: "600" },
  close: { alignItems: "center", padding: spacing.md },
  closeText: { color: colors.gray600, fontSize: uiType.body, fontWeight: "600" },
});
