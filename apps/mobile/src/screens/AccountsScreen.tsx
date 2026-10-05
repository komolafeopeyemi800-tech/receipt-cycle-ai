import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "../lib/api";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../lib/api";
import { ScreenHeader } from "../components/ScreenHeader";
import { EmptyState } from "../components/ui/FinanceUI";
import { useMoneyAppearance } from "../contexts/MoneyAppearanceContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { accountType } from "../features/money/model";
import { useAccountsData } from "../features/money/useMoneyData";
import { roundMoney } from "../utils/transactionMath";
import { colors, radius, spacing, uiType } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";

type Filter = "All" | "Cash" | "Cards" | "Bank" | "Savings";
const filters: Filter[] = ["All", "Cash", "Cards", "Bank", "Savings"];
function matchesFilter(iconKey: string, filter: Filter) {
  if (filter === "All") return true;
  const type = accountType(iconKey).label;
  return filter === "Cards" ? type === "Card" : type === filter;
}

export function AccountsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { workspace, ready, accounts, loading } = useAccountsData();
  const { appearance } = useMoneyAppearance();
  const { formatMoney } = usePreferences();
  const [filter, setFilter] = useState<Filter>("All");
  const [showBalance, setShowBalance] = useState(true);
  const ensure = useMutation(api.accounts.ensureSeed);
  useEffect(() => { if (ready) void ensure({ workspace }); }, [ready, workspace, ensure]);
  const totalBalance = roundMoney(accounts.reduce((sum, row) => sum + row.balance, 0));
  const visible = useMemo(() => accounts.filter((row) => matchesFilter(row.iconKey, filter)), [accounts, filter]);

  return <View style={styles.root}>
    <ScreenHeader title="Accounts" rightIcon="add" onRightPress={() => navigation.navigate("AccountForm")} />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.summary}><View style={styles.summaryTop}><View style={styles.summaryIcon}><Ionicons name="wallet-outline" size={21} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={styles.summaryLabel}>Total Balance</Text><Text style={styles.summaryAmount} numberOfLines={1} adjustsFontSizeToFit>{showBalance ? formatMoney(totalBalance) : "••••••"}</Text></View><Pressable onPress={() => setShowBalance((value) => !value)} accessibilityLabel={showBalance ? "Hide balances" : "Show balances"}><Ionicons name={showBalance ? "eye-outline" : "eye-off-outline"} size={19} color={colors.gray600} /></Pressable></View><View style={styles.summaryBottom}><Text style={styles.summaryCount}>{accounts.length} {accounts.length === 1 ? "account" : "accounts"}</Text><Ionicons name="chevron-forward" size={17} color={colors.primary} /></View></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{filters.map((item) => <Pressable key={item} style={[styles.filter, filter === item && styles.filterActive]} onPress={() => setFilter(item)} accessibilityRole="tab" accessibilityState={{ selected: filter === item }}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text></Pressable>)}</ScrollView>
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : visible.length === 0 ? <EmptyState icon="wallet-outline" title="No accounts here" description="Add an account or choose another filter." /> : visible.map((account) => { const type = accountType(account.iconKey); const tint = appearance.accountColors[account.id] ?? colors.primary; return <Pressable key={account.id} style={styles.row} onPress={() => navigation.navigate("AccountDetail", { accountId: account.id })} accessibilityRole="button" accessibilityLabel={`${account.name}, ${formatMoney(account.balance)}`}><View style={[styles.rowIcon, { backgroundColor: `${tint}1d` }]}><Ionicons name={type.icon} size={21} color={tint} /></View><View style={styles.rowText}><Text style={styles.rowName}>{account.name}</Text><Text style={[styles.rowBalance, { color: account.balance < 0 ? colors.danger : colors.success }]}>{showBalance ? formatMoney(account.balance) : "••••••"}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.gray500} /></Pressable>; })}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.lg, paddingBottom: 100 },
  summary: { borderRadius: radius.large, borderWidth: 1, borderColor: colors.border, backgroundColor: "#effbf8", overflow: "hidden", marginBottom: spacing.lg },
  summaryTop: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md }, summaryIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#d5f6ed", alignItems: "center", justifyContent: "center" }, summaryLabel: { color: colors.gray600, fontSize: uiType.secondary }, summaryAmount: { color: colors.textPrimary, fontSize: 22, fontWeight: "800", marginTop: 2 },
  summaryBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#ddf6f0", paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, summaryCount: { color: colors.gray600, fontSize: uiType.secondary },
  filters: { gap: 5, paddingBottom: spacing.lg }, filter: { borderRadius: radius.small, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: "#edf3fa" }, filterActive: { backgroundColor: colors.primary }, filterText: { color: colors.gray600, fontSize: uiType.caption, fontWeight: "700" }, filterTextActive: { color: "#fff" },
  row: { minHeight: 57, flexDirection: "row", alignItems: "center", gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider, backgroundColor: colors.surface, paddingVertical: spacing.sm }, rowIcon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" }, rowText: { flex: 1 }, rowName: { color: colors.textPrimary, fontSize: uiType.body, fontWeight: "700" }, rowBalance: { fontSize: uiType.body, fontWeight: "800", marginTop: 2 },
});
