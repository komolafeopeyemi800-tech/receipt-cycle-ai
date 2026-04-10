import { useMemo } from "react";
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
import { buildSummary, filterByMonth } from "../utils/transactionMath";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";
import { QuickActionsRow } from "../components/QuickActionsRow";
import type { DocTx } from "../types/transaction";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Records">,
  NativeStackNavigationProp<RootStackParamList>
>;

export function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { workspace, ready } = useWorkspace();
  const { user } = useAuth();
  const { formatMoney } = usePreferences();

  const all = useQuery(api.transactions.list, ready ? { workspace, userId: user?.id } : "skip");

  const { monthly, recent, summary } = useMemo(() => {
    const list = (all ?? []) as DocTx[];
    const monthlyTx = filterByMonth(list);
    return {
      monthly: monthlyTx,
      recent: list.slice(0, 5),
      summary: buildSummary(monthlyTx),
    };
  }, [all]);

  const displayName = "there";
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const loading = !ready || all === undefined;

  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <View style={styles.statusBar}>
        <Text style={styles.statusTime}>9:41</Text>
        <View style={styles.statusIcons}>
          <Ionicons name="cellular-outline" size={11} color={colors.gray900} />
          <Ionicons name="wifi-outline" size={11} color={colors.gray900} style={{ marginLeft: 6 }} />
          <Ionicons name="battery-full-outline" size={11} color={colors.gray900} style={{ marginLeft: 6 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.stickyHeader}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <LinearGradient colors={[...gradients.heroIcon]} style={styles.logoSm}>
                <Ionicons name="sync-outline" size={14} color="#fff" />
              </LinearGradient>
              <View>
                <Text style={styles.headerTitle}>Receipt Cycle</Text>
                <Text style={styles.headerSub}>Dashboard</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <Pressable style={styles.iconBtn} onPress={() => navigation.getParent()?.navigate("Notifications")}>
                <Ionicons name="notifications-outline" size={18} color={colors.gray700} />
              </Pressable>
              <Pressable style={styles.avatar} onPress={() => navigation.getParent()?.navigate("Settings" as never)}>
                <Ionicons name="person-outline" size={18} color={colors.gray600} />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.greeting}>
          <Text style={styles.greetTitle}>
            {greet}, {displayName}
          </Text>
          <Text style={styles.greetSub}>Here&apos;s your snapshot for today</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricsRow}>
              <LinearGradient
                colors={[...gradients.primaryBtn]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.metricCardPrimary}
              >
                <View style={styles.metricTop}>
                  <View>
                    <Text style={styles.metricLabelLight}>Net (this month)</Text>
                    <Text style={styles.metricValueLight} numberOfLines={1} adjustsFontSizeToFit>
                      {formatMoney(summary.netBalance)}
                    </Text>
                  </View>
                  <View style={styles.metricIconBubble}>
                    <Ionicons name="wallet-outline" size={20} color="#fff" />
                  </View>
                </View>
                <View style={styles.rateRow}>
                  <View style={styles.ratePill}>
                    {summary.savingsRate !== null ? (
                      <>
                        <Ionicons
                          name={summary.savingsRate >= 0 ? "arrow-up" : "arrow-down"}
                          size={11}
                          color="#fff"
                        />
                        <Text style={styles.rateText}>{Math.abs(summary.savingsRate).toFixed(1)}%</Text>
                      </>
                    ) : (
                      <Text style={styles.rateText}>—</Text>
                    )}
                  </View>
                  <Text style={styles.rateHint}>savings rate</Text>
                </View>
              </LinearGradient>

              <View style={styles.metricCard}>
                <View style={styles.metricTop}>
                  <View>
                    <Text style={styles.metricLabel}>Total Expenses</Text>
                    <Text style={styles.metricValueDark} numberOfLines={1} adjustsFontSizeToFit>
                      {formatMoney(summary.totalExpenses)}
                    </Text>
                  </View>
                  <View style={[styles.metricIconBg, { backgroundColor: "#ffe4e6" }]}>
                    <Ionicons name="card-outline" size={18} color={colors.rose600} />
                  </View>
                </View>
                <Text style={styles.metricFoot}>{summary.transactionCount} transactions</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricTop}>
                  <View>
                    <Text style={styles.metricLabel}>Total Income</Text>
                    <Text style={styles.metricValueDark} numberOfLines={1} adjustsFontSizeToFit>
                      {formatMoney(summary.totalIncome)}
                    </Text>
                  </View>
                  <View style={[styles.metricIconBg, { backgroundColor: "#dcfce7" }]}>
                    <Ionicons name="cash-outline" size={18} color={colors.green600} />
                  </View>
                </View>
                <View style={styles.rateRow}>
                  <Ionicons name="checkmark-circle-outline" size={12} color={colors.primary} />
                  <Text style={styles.thisMonth}>This month</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <QuickActionsRow />
            </View>

            {summary.categoryBreakdown.length > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionHead}>
                  <Text style={styles.cardTitle}>Spending Overview</Text>
                  <Pressable onPress={() => navigation.navigate("Analysis")}>
                    <Text style={styles.link}>View All</Text>
                  </Pressable>
                </View>
                <View style={styles.card}>
                  <Text style={styles.subheading}>TOP CATEGORIES</Text>
                  {summary.categoryBreakdown.slice(0, 3).map((cat) => (
                    <View key={cat.category} style={styles.catRow}>
                      <View style={styles.catLeft}>
                        <View style={styles.tagIcon}>
                          <Ionicons name="pricetag-outline" size={14} color={colors.primary} />
                        </View>
                        <View>
                          <Text style={styles.catName}>{cat.category}</Text>
                          <Text style={styles.catCount}>{cat.count} transactions</Text>
                        </View>
                      </View>
                      <Text style={styles.catAmt} numberOfLines={1}>
                        {formatMoney(cat.amount)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="pie-chart-outline" size={32} color={colors.gray400} />
                <Text style={styles.emptyTitle}>No spending data yet</Text>
                <Text style={styles.emptySub}>Add your first transaction to see spending insights</Text>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                <Pressable onPress={() => navigation.navigate("Records")}>
                  <Text style={styles.link}>View All</Text>
                </Pressable>
              </View>
              {recent.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptySub}>No transactions yet — scan a receipt or add one.</Text>
                </View>
              ) : (
                recent.map((tx) => (
                  <View key={tx.id} style={styles.txCard}>
                    <View style={styles.txIcon}>
                      <Ionicons name="receipt-outline" size={16} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txMerchant}>{tx.merchant || tx.category}</Text>
                      <Text style={styles.txMeta}>
                        {tx.category} · {tx.date}
                      </Text>
                    </View>
                    <Text style={[styles.txAmt, tx.type === "expense" ? styles.txExpense : styles.txIncome]} numberOfLines={1}>
                      {tx.type === "expense" ? "-" : "+"}
                      {formatMoney(tx.amount)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  statusBar: {
    height: 36,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  statusTime: { fontSize: typeScale.md, fontWeight: "600", color: colors.gray900 },
  statusIcons: { flexDirection: "row", alignItems: "center" },
  scroll: { paddingBottom: 24 },
  stickyHeader: {
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoSm: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: typeScale.title, fontWeight: "700", color: colors.gray900 },
  headerSub: { fontSize: typeScale.md, color: colors.gray500, marginTop: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.gray100,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  greeting: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 },
  greetTitle: { fontSize: typeScale.headline, fontWeight: "700", color: colors.gray900 },
  greetSub: { fontSize: typeScale.body, color: colors.gray600, marginTop: 4 },
  metricsRow: { paddingHorizontal: 16, gap: 10, paddingBottom: 6 },
  metricCardPrimary: {
    width: 176,
    borderRadius: 18,
    padding: 16,
    marginRight: 4,
  },
  metricCard: {
    width: 158,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginRight: 4,
  },
  metricTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  metricLabelLight: { fontSize: typeScale.sm, color: "rgba(255,255,255,0.88)", fontWeight: "600" },
  metricValueLight: { fontSize: typeScale.display, fontWeight: "700", color: "#fff", marginTop: 2 },
  metricLabel: { fontSize: typeScale.sm, color: colors.gray500, fontWeight: "600" },
  metricValueDark: { fontSize: 18, fontWeight: "700", color: colors.gray900, marginTop: 2 },
  metricIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  metricIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  metricFoot: { fontSize: typeScale.sm, color: colors.gray500 },
  rateRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  ratePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rateText: { fontSize: typeScale.sm, fontWeight: "700", color: "#fff" },
  rateHint: { fontSize: typeScale.sm, color: "rgba(255,255,255,0.88)" },
  thisMonth: { fontSize: typeScale.sm, color: colors.primary, fontWeight: "600" },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: { fontSize: typeScale.bodyStrong, fontWeight: "700", color: colors.gray900 },
  link: { fontSize: typeScale.md, fontWeight: "600", color: colors.primary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  cardTitle: { fontSize: typeScale.bodyStrong, fontWeight: "700", color: colors.gray900 },
  subheading: {
    fontSize: typeScale.xs,
    fontWeight: "700",
    color: colors.gray500,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.gray100,
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  catLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  tagIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  catName: { fontSize: typeScale.bodyStrong, fontWeight: "600", color: colors.gray900 },
  catCount: { fontSize: typeScale.md, color: colors.gray500, marginTop: 1 },
  catAmt: { fontSize: typeScale.bodyStrong, fontWeight: "700", color: colors.gray900 },
  emptyCard: {
    marginHorizontal: 16,
    padding: 20,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: 16,
  },
  emptyTitle: { fontSize: typeScale.bodyStrong, fontWeight: "700", color: colors.gray900, marginTop: 10 },
  emptySub: { fontSize: typeScale.body, color: colors.gray600, textAlign: "center", marginTop: 4 },
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.emerald50,
    alignItems: "center",
    justifyContent: "center",
  },
  txMerchant: { fontSize: typeScale.bodyStrong, fontWeight: "600", color: colors.gray900 },
  txMeta: { fontSize: typeScale.md, color: colors.gray500, marginTop: 2 },
  txAmt: { fontSize: typeScale.bodyStrong, fontWeight: "700" },
  txExpense: { color: colors.rose600 },
  txIncome: { color: colors.primary },
});
