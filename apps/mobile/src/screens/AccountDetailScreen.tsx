import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "../lib/api";
import type { Id } from "../lib/api";
import { api } from "../lib/api";
import { AppCard, IconTile } from "../components/ui/FinanceUI";
import {
  ModuleDetailHeader,
  MoneySection,
} from "../components/ui/MoneyModuleUI";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useMoneyAppearance } from "../contexts/MoneyAppearanceContext";
import { accountType } from "../features/money/model";
import { todayYm, addMonthsYm, roundMoney } from "../utils/transactionMath";
import { colors, radius, spacing, uiType } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";
import type { DocTx } from "../types/transaction";
import { TransactionGlyph } from "../components/ui/PremiumIcon";

type Period = "This Month" | "Last 3 Months" | "All Time";
export function AccountDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "AccountDetail">>();
  const { workspace, ready } = useWorkspace();
  const { user } = useAuth();
  const { formatMoney, formatDate } = usePreferences();
  const { appearance } = useMoneyAppearance();
  const id = route.params.accountId as Id<"accounts">;
  const account = useQuery(
    api.accounts.get,
    ready ? { id, workspace } : "skip",
  );
  const transactions = useQuery(
    api.transactions.list,
    ready ? { workspace, userId: user?.id, accountId: String(id) } : "skip",
  );
  const [period, setPeriod] = useState<Period>("This Month");
  const [showAll, setShowAll] = useState(false);
  // "See all" reveals the list in pages so an account with thousands of transactions never mounts them all at once.
  const [shownCount, setShownCount] = useState(60);
  const rows = useMemo(() => {
    const cutoff =
      period === "This Month"
        ? `${todayYm()}-01`
        : period === "Last 3 Months"
          ? `${addMonthsYm(todayYm(), -2)}-01`
          : "";
    return ((transactions ?? []) as DocTx[])
      .filter((tx) => tx.date >= cutoff)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, period]);
  const inflow = roundMoney(
    rows
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
  );
  const outflow = roundMoney(
    rows
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
  );
  const spending = useMemo(() => {
    const totals = new Map<string, number>();
    for (const tx of rows)
      if (tx.type === "expense")
        totals.set(
          tx.category,
          (totals.get(tx.category) ?? 0) + Math.abs(tx.amount),
        );
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);
  const tint = appearance.accountColors[String(id)] ?? colors.primary;
  const icon = accountType(account?.iconKey ?? "wallet").icon;

  return (
    <View style={styles.root}>
      <ModuleDetailHeader
        title="Account Detail"
        onBack={() => navigation.goBack()}
        actionIcon="create-outline"
        onAction={() =>
          navigation.navigate("AccountForm", { accountId: String(id) })
        }
      />
      {!ready || account === undefined || transactions === undefined ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 28 }} />
      ) : !account ? (
        <Text style={styles.empty}>This account is unavailable.</Text>
      ) : (
        <ScrollView keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient colors={["#0f766e", "#115e59"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={styles.heroRow}>
              <View style={styles.heroIcon}><Ionicons name={icon} size={26} color="#fff" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>{account.name}</Text>
                <View style={styles.typePill}><Text style={styles.typePillText}>{accountType(account.iconKey).label} account</Text></View>
              </View>
            </View>
            <Text style={styles.caption}>Current balance</Text>
            <Text style={[styles.balance, account.balance < 0 && { color: "#fecaca" }]} numberOfLines={1} adjustsFontSizeToFit>{formatMoney(account.balance)}</Text>
          </LinearGradient>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <View style={[styles.statIcon, { backgroundColor: "#dcfce7" }]}><Ionicons name="arrow-down" size={15} color={colors.success} /></View>
              <Text style={styles.statLabel}>Inflow</Text>
              <Text style={[styles.statValue, { color: colors.success }]} numberOfLines={1} adjustsFontSizeToFit>{formatMoney(inflow)}</Text>
            </View>
            <View style={styles.stat}>
              <View style={[styles.statIcon, { backgroundColor: "#fee2e2" }]}><Ionicons name="arrow-up" size={15} color={colors.danger} /></View>
              <Text style={styles.statLabel}>Outflow</Text>
              <Text style={[styles.statValue, { color: colors.danger }]} numberOfLines={1} adjustsFontSizeToFit>{formatMoney(outflow)}</Text>
            </View>
            <View style={styles.stat}>
              <View style={[styles.statIcon, { backgroundColor: "#e0f2fe" }]}><Ionicons name="swap-vertical" size={15} color={colors.blue600} /></View>
              <Text style={styles.statLabel}>Net</Text>
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{formatMoney(roundMoney(inflow - outflow))}</Text>
            </View>
          </View>
          <View style={styles.periods}>
            {(["This Month", "Last 3 Months", "All Time"] as const).map(
              (item) => (
                <Pressable
                  key={item}
                  onPress={() => setPeriod(item)}
                  style={[
                    styles.period,
                    period === item && styles.periodActive,
                  ]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: period === item }}
                >
                  <Text
                    style={[
                      styles.periodText,
                      period === item && styles.periodTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ),
            )}
          </View>
          <MoneySection
            title="Recent Transactions"
            action={
              rows.length > 5 ? (showAll ? "Show less" : "See all") : undefined
            }
            onAction={() => { setShowAll((value) => !value); setShownCount(60); }}
          />
          {rows.length === 0 ? (
            <Text style={styles.empty}>
              No linked transactions in this period.
            </Text>
          ) : (
            rows.slice(0, showAll ? shownCount : 5).map((tx) => (
              <Pressable
                key={tx.id}
                style={styles.row}
                onPress={() =>
                  navigation.navigate("TransactionDetail", {
                    transactionId: tx.id,
                  })
                }
              >
                <TransactionGlyph
                  merchant={tx.merchant}
                  category={tx.category}
                  type={tx.type}
                  size={34}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {tx.merchant || tx.category}
                  </Text>
                  <Text style={styles.rowDate}>{formatDate(tx.date)}</Text>
                </View>
                <Text
                  style={[
                    styles.rowAmount,
                    {
                      color:
                        tx.type === "expense" ? colors.danger : colors.success,
                    },
                  ]}
                >
                  {tx.type === "expense" ? "-" : "+"}
                  {formatMoney(Math.abs(tx.amount))}
                </Text>
              </Pressable>
            ))
          )}
          {showAll && rows.length > shownCount ? (
            <Pressable onPress={() => setShownCount((count) => count + 100)} accessibilityRole="button" style={styles.showMore}>
              <Text style={styles.showMoreText}>Show more ({rows.length - shownCount} remaining)</Text>
            </Pressable>
          ) : null}
          {spending.length > 0 ? (
            <>
              <MoneySection title="Spending by Category" />
              <AppCard style={{ paddingVertical: 3 }}>
                {spending.map(([name, amount]) => (
                  <Pressable
                    key={name}
                    style={styles.categoryRow}
                    onPress={() =>
                      navigation.navigate("CategoryBreakdown", {
                        category: name,
                      })
                    }
                  >
                    <Text style={styles.categoryName}>{name}</Text>
                    <Text style={styles.categoryAmount}>
                      {formatMoney(amount)}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={15}
                      color={colors.gray500}
                    />
                  </Pressable>
                ))}
              </AppCard>
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 42 },
  hero: { borderRadius: 0, padding: spacing.lg, marginBottom: spacing.md },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  heroIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  name: { fontSize: uiType.sectionTitle, color: "#fff", fontWeight: "800" },
  typePill: { alignSelf: "flex-start", marginTop: 4, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.18)" },
  typePillText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  caption: { color: "rgba(255,255,255,0.78)", fontSize: uiType.secondary, marginTop: spacing.lg },
  balance: { color: "#fff", fontSize: 30, fontWeight: "800", marginTop: 2 },
  stats: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  stat: { flex: 1, minWidth: 0, padding: spacing.md, borderRadius: 0, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  statIcon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  statValue: { color: colors.textPrimary, fontSize: uiType.body, fontWeight: "800", marginTop: 2 },
  statLabel: { fontSize: uiType.caption, color: colors.gray600 },
  periods: { flexDirection: "row", gap: 4, marginBottom: spacing.lg },
  period: {
    flex: 1,
    borderRadius: radius.small,
    backgroundColor: "#edf3fa",
    alignItems: "center",
    paddingVertical: 9,
  },
  periodActive: { backgroundColor: colors.primary },
  periodText: {
    color: colors.gray600,
    fontSize: uiType.caption,
    fontWeight: "700",
  },
  periodTextActive: { color: "#fff" },
  row: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
    paddingVertical: 5,
  },
  rowName: {
    color: colors.textPrimary,
    fontSize: uiType.secondary,
    fontWeight: "700",
  },
  rowDate: { color: colors.gray500, fontSize: uiType.caption },
  rowAmount: { fontSize: uiType.secondary, fontWeight: "800" },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 42,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  categoryName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: uiType.secondary,
  },
  categoryAmount: {
    color: colors.danger,
    fontSize: uiType.secondary,
    fontWeight: "700",
  },
  showMore: { alignItems: "center", paddingVertical: spacing.md },
  showMoreText: { color: colors.primary, fontSize: uiType.secondary, fontWeight: "800" },
  empty: { color: colors.gray600, textAlign: "center", padding: spacing.xl },
});
