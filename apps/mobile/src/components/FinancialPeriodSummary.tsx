import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, type as typeScale } from "../theme/tokens";

export type PeriodMode = "month" | "all";

type Filter = "all" | "expense" | "income";

type Props = {
  mode: PeriodMode;
  onModeChange: (m: PeriodMode) => void;
  /** When mode is month */
  monthLabel: string;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  monthNavDisabled?: boolean;
  expense: number;
  income: number;
  total: number;
  formatCompact: (n: number) => string;
  /** Records: filter list. Omit on Analysis. */
  filter?: Filter;
  onFilterChange?: (f: Filter) => void;
};

export function FinancialPeriodSummary({
  mode,
  onModeChange,
  monthLabel,
  onPrevMonth,
  onNextMonth,
  monthNavDisabled,
  expense,
  income,
  total,
  formatCompact,
  filter,
  onFilterChange,
}: Props) {
  const [filterOpen, setFilterOpen] = useState(false);
  const showFilter = filter != null && onFilterChange != null;

  return (
    <View style={styles.card}>
      <View style={styles.modeRow}>
        {(["month", "all"] as const).map((m) => (
          <Pressable
            key={m}
            style={[styles.modeChip, mode === m && styles.modeChipOn]}
            onPress={() => onModeChange(m)}
          >
            <Text style={[styles.modeTxt, mode === m && styles.modeTxtOn]}>{m === "month" ? "Month" : "All time"}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.navRow}>
        <Pressable
          style={[styles.navBtn, (monthNavDisabled || mode !== "month") && styles.navBtnOff]}
          onPress={() => mode === "month" && onPrevMonth?.()}
          disabled={monthNavDisabled || mode !== "month"}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color={mode === "month" && !monthNavDisabled ? colors.gray800 : colors.gray400} />
        </Pressable>

        <Text style={styles.monthTitle} numberOfLines={1}>
          {mode === "month" ? monthLabel : "All dates in view"}
        </Text>

        <Pressable
          style={[styles.navBtn, (monthNavDisabled || mode !== "month") && styles.navBtnOff]}
          onPress={() => mode === "month" && onNextMonth?.()}
          disabled={monthNavDisabled || mode !== "month"}
          hitSlop={8}
        >
          <Ionicons name="chevron-forward" size={22} color={mode === "month" && !monthNavDisabled ? colors.gray800 : colors.gray400} />
        </Pressable>

        {showFilter ? (
          <Pressable style={styles.filterBtn} onPress={() => setFilterOpen(true)} hitSlop={8}>
            <Ionicons name="options-outline" size={20} color={colors.gray700} />
          </Pressable>
        ) : (
          <View style={styles.filterBtn} />
        )}
      </View>

      <View style={styles.totalsRow}>
        <View style={styles.col}>
          <Text style={styles.colLbl}>EXPENSE</Text>
          <Text
            style={[styles.colVal, { color: colors.rose600 }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
          >
            {formatCompact(expense)}
          </Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.colLbl}>INCOME</Text>
          <Text
            style={[styles.colVal, { color: colors.green600 }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
          >
            {formatCompact(income)}
          </Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.colLbl}>TOTAL</Text>
          <Text
            style={[styles.colVal, { color: total < 0 ? colors.rose600 : colors.gray900 }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
          >
            {formatCompact(total)}
          </Text>
        </View>
      </View>

      {showFilter ? (
        <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setFilterOpen(false)}>
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Show transactions</Text>
              {(["all", "expense", "income"] as const).map((f) => (
                <Pressable
                  key={f}
                  style={[styles.modalRow, filter === f && styles.modalRowOn]}
                  onPress={() => {
                    onFilterChange?.(f);
                    setFilterOpen(false);
                  }}
                >
                  <Text style={[styles.modalRowTxt, filter === f && styles.modalRowTxtOn]}>
                    {f === "all" ? "All" : f === "expense" ? "Expenses only" : "Income only"}
                  </Text>
                  {filter === f ? <Ionicons name="checkmark" size={20} color={colors.primary} /> : null}
                </Pressable>
              ))}
              <Pressable style={styles.modalClose} onPress={() => setFilterOpen(false)}>
                <Text style={styles.modalCloseTxt}>Close</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: 10,
  },
  modeRow: { flexDirection: "row", gap: 6, marginBottom: 8 },
  modeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.gray100,
  },
  modeChipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeTxt: { fontSize: typeScale.xs, fontWeight: "700", color: colors.gray600 },
  modeTxtOn: { color: "#fff" },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 4,
  },
  navBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  navBtnOff: { opacity: 0.45 },
  monthTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: typeScale.md,
    fontWeight: "700",
    color: colors.gray900,
  },
  filterBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  totalsRow: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray200,
    paddingTop: 10,
    gap: 4,
  },
  col: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    paddingHorizontal: 2,
  },
  colLbl: {
    fontSize: typeScale.xs,
    fontWeight: "700",
    color: colors.gray500,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  colVal: {
    fontSize: typeScale.body,
    fontWeight: "700",
    color: colors.gray900,
    width: "100%",
    textAlign: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
  },
  modalTitle: { fontSize: typeScale.bodyStrong, fontWeight: "800", color: colors.gray900, marginBottom: 12 },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  modalRowOn: { borderColor: colors.primary, backgroundColor: colors.emerald50 },
  modalRowTxt: { fontSize: typeScale.body, fontWeight: "600", color: colors.gray800 },
  modalRowTxtOn: { color: colors.primary },
  modalClose: { paddingVertical: 12, alignItems: "center" },
  modalCloseTxt: { color: colors.gray600, fontWeight: "600", fontSize: typeScale.sm },
});
