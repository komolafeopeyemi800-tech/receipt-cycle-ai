import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../convex/_generated/api";
import { colors, gradients, type as typeScale } from "../theme/tokens";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useAuth } from "../contexts/AuthContext";
import type { DocTx } from "../types/transaction";
import { expenseTotalsByCategory, roundMoney, ymToDateRange } from "../utils/transactionMath";
import { ScreenHeader } from "../components/ScreenHeader";
import { SetBudgetModal } from "../components/SetBudgetModal";
import { usePreferences } from "../contexts/PreferencesContext";
import type { Id } from "../../convex/_generated/dataModel";

function monthStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(ym: string, delta: number) {
  const [y, m] = ym.split("-").map((x) => parseInt(x, 10));
  const d = new Date(y, m - 1 + delta, 1);
  return monthStr(d);
}

type CatRow = { id: Id<"categories">; name: string; color: string };

export function BudgetsScreen() {
  const { workspace, ready } = useWorkspace();
  const { user } = useAuth();
  const { formatMoney } = usePreferences();
  const [month, setMonth] = useState(() => monthStr(new Date()));
  const range = useMemo(() => ymToDateRange(month), [month]);

  const cats = useQuery(api.categories.list, ready ? { workspace } : "skip");
  const budgets = useQuery(api.budgets.listForMonth, ready ? { workspace, month } : "skip");
  const txs = useQuery(
    api.transactions.list,
    ready ? { workspace, userId: user?.id, startDate: range.start, endDate: range.end } : "skip",
  );
  const upsert = useMutation(api.budgets.upsert);
  const ensureCats = useMutation(api.categories.ensureSeed);

  const [budgetModal, setBudgetModal] = useState<CatRow | null>(null);

  useEffect(() => {
    if (!ready) return;
    void ensureCats({ workspace });
  }, [ready, workspace, ensureCats]);

  const expenseCats = useMemo(() => (cats ?? []).filter((c) => c.kind === "expense"), [cats]);

  const budgetByCat = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of budgets ?? []) m.set(b.category, b.limitAmount);
    return m;
  }, [budgets]);

  const spentByCat = useMemo(() => {
    return expenseTotalsByCategory((txs ?? []) as DocTx[], range.start, range.end);
  }, [txs, range.start, range.end]);

  /** Sum of limits for categories that have a budget row this month */
  const totalBudget = useMemo(
    () => roundMoney((budgets ?? []).reduce((s, b) => s + b.limitAmount, 0)),
    [budgets],
  );

  /** Spending only in categories that have a budget — matches total budget comparison */
  const totalSpentBudgeted = useMemo(() => {
    if (!budgets?.length) return 0;
    let s = 0;
    for (const b of budgets) {
      s += spentByCat.get(b.category) ?? 0;
    }
    return roundMoney(s);
  }, [budgets, spentByCat]);

  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!budgets) return;
    setDraft((prev) => {
      const next = { ...prev };
      for (const b of budgets) {
        if (next[b.category] === undefined) next[b.category] = String(b.limitAmount);
      }
      return next;
    });
  }, [budgets, month]);

  const setBudget = async (category: string, raw?: string) => {
    const r = raw ?? draft[category] ?? "";
    const n = parseFloat(r.replace(/,/g, ""));
    if (!Number.isFinite(n) || n <= 0) {
      Alert.alert("Budget", "Enter a positive amount.");
      return;
    }
    try {
      await upsert({ workspace, category, month, limitAmount: roundMoney(n) });
    } catch (e) {
      Alert.alert("Budget", e instanceof Error ? e.message : "Could not save");
    }
  };

  const loading = !ready || cats === undefined || budgets === undefined || txs === undefined;

  const modalInitialLimit = budgetModal
    ? draft[budgetModal.name] ?? String(budgetByCat.get(budgetModal.name) ?? "")
    : "";

  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <ScreenHeader title="Budgets" subtitle={month} />
      <View style={styles.monthNav}>
        <Pressable style={styles.monthBtn} onPress={() => setMonth((m) => shiftMonth(m, -1))}>
          <Ionicons name="chevron-back" size={22} color={colors.gray800} />
        </Pressable>
        <Text style={styles.monthNavTxt}>{month}</Text>
        <Pressable style={styles.monthBtn} onPress={() => setMonth((m) => shiftMonth(m, 1))}>
          <Ionicons name="chevron-forward" size={22} color={colors.gray800} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.pad}>
        <View style={styles.summary}>
          <View style={styles.sumCell}>
            <Text style={styles.sumLbl}>TOTAL BUDGET</Text>
            <Text style={styles.sumVal} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
              {formatMoney(totalBudget)}
            </Text>
          </View>
          <View style={styles.sumCell}>
            <Text style={styles.sumLbl}>SPENT (BUDGETED)</Text>
            <Text style={[styles.sumVal, { color: colors.rose600 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
              {formatMoney(totalSpentBudgeted)}
            </Text>
          </View>
        </View>
        <Text style={styles.sectionHint}>
          Totals compare only categories with a budget set for this month. Other spending is still shown per category
          below.
        </Text>
        <Text style={styles.section}>Expense categories</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
        ) : (
          expenseCats.map((c) => {
            const limit = budgetByCat.get(c.name) ?? 0;
            const spent = spentByCat.get(c.name) ?? 0;
            const left = roundMoney(limit - spent);
            return (
              <View key={String(c.id)} style={styles.row}>
                <View style={[styles.dot, { backgroundColor: c.color }]} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.rowTitle} numberOfLines={2}>
                    {c.name}
                  </Text>
                  <Text style={styles.rowMeta}>
                    Spent {formatMoney(spent)} · Budget {formatMoney(limit)} ·{" "}
                    <Text style={left >= 0 ? styles.leftOk : styles.leftBad}>{formatMoney(left)} left</Text>
                  </Text>
                </View>
                <Pressable style={styles.setBudgetBtn} onPress={() => setBudgetModal(c as CatRow)}>
                  <Text style={styles.setBudgetBtnTxt}>SET BUDGET</Text>
                </Pressable>
              </View>
            );
          })
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      <SetBudgetModal
        visible={budgetModal !== null}
        onClose={() => setBudgetModal(null)}
        categoryName={budgetModal?.name ?? ""}
        categoryColor={budgetModal?.color ?? colors.gray400}
        monthYm={month}
        initialLimit={modalInitialLimit || (budgetModal ? String(budgetByCat.get(budgetModal.name) ?? "") : "")}
        onConfirm={async (n) => {
          if (!budgetModal) return;
          setDraft((d) => ({ ...d, [budgetModal.name]: String(n) }));
          await setBudget(budgetModal.name, String(n));
        }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  monthBtn: { padding: 8 },
  monthNavTxt: { fontSize: typeScale.bodyStrong, fontWeight: "700", color: colors.gray900 },
  pad: { paddingHorizontal: 16, paddingTop: 8 },
  summary: { flexDirection: "row", gap: 10, marginBottom: 8 },
  sumCell: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.surface,
  },
  sumLbl: { fontSize: typeScale.xs, fontWeight: "700", color: colors.gray500, letterSpacing: 0.5 },
  sumVal: { fontSize: typeScale.md, fontWeight: "700", color: colors.gray900, marginTop: 4 },
  sectionHint: { fontSize: typeScale.sm, color: colors.gray500, marginBottom: 12, lineHeight: 16 },
  section: { fontSize: typeScale.md, fontWeight: "700", color: colors.gray800, marginBottom: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rowTitle: { fontSize: typeScale.md, fontWeight: "600", color: colors.gray900 },
  rowMeta: { fontSize: typeScale.xs, color: colors.gray500, marginTop: 4, lineHeight: 16 },
  leftOk: { color: colors.green600, fontWeight: "700" },
  leftBad: { color: colors.rose600, fontWeight: "700" },
  setBudgetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.emerald50,
  },
  setBudgetBtnTxt: { fontSize: 10, fontWeight: "800", color: colors.primary, letterSpacing: 0.3 },
});
