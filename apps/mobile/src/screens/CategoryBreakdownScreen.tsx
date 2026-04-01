import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { colors, gradients, type as typeScale } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { DocTx } from "../types/transaction";
import { monthRangeISO, roundMoney } from "../utils/transactionMath";

export function CategoryBreakdownScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "CategoryBreakdown">>();
  const { workspace, ready } = useWorkspace();
  const { user } = useAuth();
  const { formatMoney, formatDate } = usePreferences();
  const category = route.params.category;

  const [period, setPeriod] = useState<"month" | "all">("month");
  const range = period === "month" ? monthRangeISO() : null;

  const rows = useQuery(
    api.transactions.list,
    ready
      ? {
          workspace,
          userId: user?.id,
          category,
          startDate: range?.startStr,
          endDate: range?.endStr,
        }
      : "skip",
  );

  const { totalExp, totalInc } = useMemo(() => {
    const list = (rows ?? []) as DocTx[];
    let exp = 0;
    let inc = 0;
    for (const t of list) {
      if (t.type === "expense") exp += t.amount;
      if (t.type === "income") inc += t.amount;
    }
    return { totalExp: roundMoney(exp), totalInc: roundMoney(inc) };
  }, [rows]);

  const allExpensesMonth = useQuery(
    api.transactions.list,
    ready && period === "month"
      ? { workspace, userId: user?.id, startDate: monthRangeISO().startStr, endDate: monthRangeISO().endStr }
      : "skip",
  );

  const pct = useMemo(() => {
    if (period !== "month") return null;
    const raw = (allExpensesMonth ?? []) as DocTx[];
    const monthExp = raw.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    if (monthExp <= 0) return null;
    return roundMoney((totalExp / monthExp) * 100);
  }, [allExpensesMonth, period, totalExp]);

  const loading = !ready || rows === undefined;

  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.gray900} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {category}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.periodRow}>
        {(["month", "all"] as const).map((p) => (
          <Pressable key={p} style={[styles.periodChip, period === p && styles.periodChipOn]} onPress={() => setPeriod(p)}>
            <Text style={[styles.periodTxt, period === p && styles.periodTxtOn]}>{p === "month" ? "This month" : "All time"}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.summary}>
        <View style={styles.sumBox}>
          <Text style={styles.sumLbl}>Category expenses</Text>
          <Text style={styles.sumVal}>{formatMoney(totalExp)}</Text>
        </View>
        {pct != null ? (
          <View style={styles.sumBox}>
            <Text style={styles.sumLbl}>% of monthly expenses</Text>
            <Text style={styles.sumVal}>{pct.toFixed(1)}%</Text>
          </View>
        ) : null}
        {totalInc > 0 ? (
          <View style={styles.sumBox}>
            <Text style={styles.sumLbl}>Income in category</Text>
            <Text style={[styles.sumVal, { color: colors.primary }]}>{formatMoney(totalInc)}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.sectionHdr}>Transactions</Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : (rows?.length ?? 0) === 0 ? (
        <Text style={styles.empty}>No transactions in this view.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {(rows as DocTx[]).map((tx) => (
            <Pressable
              key={tx.id}
              style={styles.row}
              onPress={() => navigation.navigate("TransactionDetail", { transactionId: tx.id })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.merchant}>{tx.merchant || tx.category}</Text>
                <Text style={styles.meta}>
                  {formatDate(tx.date)} · {tx.type}
                </Text>
              </View>
              <Text style={[styles.amt, tx.type === "expense" ? styles.exp : styles.inc]}>
                {tx.type === "expense" ? "-" : "+"}
                {formatMoney(tx.amount)}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
            </Pressable>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700", color: colors.gray900 },
  periodRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: "#fff",
  },
  periodChipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodTxt: { fontSize: typeScale.sm, fontWeight: "700", color: colors.gray700 },
  periodTxtOn: { color: "#fff" },
  summary: { paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  sumBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  sumLbl: { fontSize: typeScale.xs, fontWeight: "700", color: colors.gray500 },
  sumVal: { fontSize: typeScale.title, fontWeight: "800", color: colors.gray900, marginTop: 4 },
  sectionHdr: {
    fontSize: typeScale.xs,
    fontWeight: "800",
    color: colors.gray500,
    paddingHorizontal: 16,
    marginBottom: 8,
    letterSpacing: 0.6,
  },
  empty: { textAlign: "center", color: colors.gray500, marginTop: 20, paddingHorizontal: 24 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  merchant: { fontSize: typeScale.bodyStrong, fontWeight: "600", color: colors.gray900 },
  meta: { fontSize: typeScale.sm, color: colors.gray500, marginTop: 2 },
  amt: { fontSize: typeScale.bodyStrong, fontWeight: "700", marginRight: 4 },
  exp: { color: colors.rose600 },
  inc: { color: colors.primary },
});
