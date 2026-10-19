import { useEffect, useMemo, useState } from "react";
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
import { colors, radius, shadows, spacing, uiType } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";
import { PremiumIcon } from "../components/ui/PremiumIcon";

type Filter = "All" | "Cash" | "Cards" | "Bank" | "Savings";
const filters: Filter[] = ["All", "Cash", "Cards", "Bank", "Savings"];
function matchesFilter(iconKey: string, filter: Filter) {
  if (filter === "All") return true;
  const type = accountType(iconKey).label;
  return filter === "Cards" ? type === "Card" : type === filter;
}

export function AccountsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { workspace, ready, accounts, loading } = useAccountsData();
  const { appearance } = useMoneyAppearance();
  const { formatMoney } = usePreferences();
  const [filter, setFilter] = useState<Filter>("All");
  const [showBalance, setShowBalance] = useState(true);
  const ensure = useMutation(api.accounts.ensureSeed);
  useEffect(() => {
    if (ready) void ensure({ workspace });
  }, [ready, workspace, ensure]);
  const totalBalance = roundMoney(
    accounts.reduce((sum, row) => sum + row.balance, 0),
  );
  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of accounts) counts.set(accountType(row.iconKey).label, (counts.get(accountType(row.iconKey).label) ?? 0) + 1);
    return [...counts.entries()];
  }, [accounts]);
  const visible = useMemo(
    () => accounts.filter((row) => matchesFilter(row.iconKey, filter)),
    [accounts, filter],
  );

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Accounts"
        rightIcon="add"
        onRightPress={() => navigation.navigate("AccountForm")}
      />
      <ScrollView keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={["#0f766e", "#115e59"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}><Ionicons name="wallet-outline" size={22} color="#fff" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroLabel}>Total balance</Text>
              <Text style={styles.heroAmount} numberOfLines={1} adjustsFontSizeToFit>{showBalance ? formatMoney(totalBalance) : "••••••"}</Text>
            </View>
            <Pressable onPress={() => setShowBalance((value) => !value)} hitSlop={10} accessibilityLabel={showBalance ? "Hide balances" : "Show balances"} style={styles.heroEye}>
              <Ionicons name={showBalance ? "eye-outline" : "eye-off-outline"} size={20} color="#fff" />
            </Pressable>
          </View>
          <View style={styles.heroChips}>
            <View style={styles.heroChip}><Text style={styles.heroChipText}>{accounts.length} {accounts.length === 1 ? "account" : "accounts"}</Text></View>
            {typeCounts.map(([label, count]) => <View key={label} style={styles.heroChip}><Text style={styles.heroChipText}>{count} {label}</Text></View>)}
          </View>
        </LinearGradient>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {filters.map((item) => (
            <Pressable
              key={item}
              style={[styles.filter, filter === item && styles.filterActive]}
              onPress={() => setFilter(item)}
              accessibilityRole="tab"
              accessibilityState={{ selected: filter === item }}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item && styles.filterTextActive,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="wallet-outline"
            title="No accounts here"
            description="Add an account or choose another filter."
          />
        ) : (
          visible.map((account) => {
            const type = accountType(account.iconKey);
            const tint = appearance.accountColors[account.id] ?? colors.primary;
            const share = totalBalance > 0 && account.balance > 0 ? Math.min(1, account.balance / totalBalance) : 0;
            return (
              <Pressable
                key={account.id}
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
                onPress={() => navigation.navigate("AccountDetail", { accountId: account.id })}
                accessibilityRole="button"
                accessibilityLabel={`${account.name}, ${formatMoney(account.balance)}`}
              >
                <View style={styles.cardTop}>
                  <PremiumIcon icon={type.icon} accent={tint} size={46} />
                  <View style={styles.rowText}>
                    <Text style={styles.rowName} numberOfLines={1}>{account.name}</Text>
                    <View style={[styles.typePill, { backgroundColor: `${tint}1f` }]}><Text style={[styles.typePillText, { color: tint }]}>{type.label}</Text></View>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={[styles.rowBalance, { color: account.balance < 0 ? colors.danger : colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{showBalance ? formatMoney(account.balance) : "••••••"}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
                  </View>
                </View>
                {share > 0 ? <View style={styles.shareTrack}><View style={[styles.shareFill, { width: `${Math.max(4, Math.round(share * 100))}%`, backgroundColor: tint }]} /></View> : null}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 100 },
  hero: { borderRadius: 6, padding: spacing.lg, marginBottom: spacing.lg },
  heroTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  heroIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  heroLabel: { color: "rgba(255,255,255,0.78)", fontSize: uiType.secondary, fontWeight: "600" },
  heroAmount: { color: "#fff", fontSize: 28, fontWeight: "800", marginTop: 2 },
  heroEye: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  heroChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: spacing.md },
  heroChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.16)" },
  heroChipText: { color: "#fff", fontSize: uiType.caption, fontWeight: "700" },
  filters: { gap: 5, paddingBottom: spacing.lg },
  filter: {
    borderRadius: radius.small,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#edf3fa",
  },
  filterActive: { backgroundColor: colors.primary },
  filterText: {
    color: colors.gray600,
    fontSize: uiType.caption,
    fontWeight: "700",
  },
  filterTextActive: { color: "#fff" },
  card: { backgroundColor: colors.surface, borderRadius: 6, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm, ...shadows.card },
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  cardRight: { flexDirection: "row", alignItems: "center", gap: 4, maxWidth: "42%" },
  typePill: { alignSelf: "flex-start", marginTop: 4, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  typePillText: { fontSize: 11, fontWeight: "800" },
  shareTrack: { height: 4, borderRadius: 2, backgroundColor: colors.gray100, marginTop: spacing.md, overflow: "hidden" },
  shareFill: { height: 4, borderRadius: 2 },
  rowText: { flex: 1 },
  rowName: {
    color: colors.textPrimary,
    fontSize: uiType.body,
    fontWeight: "700",
  },
  rowBalance: { fontSize: uiType.sectionTitle, fontWeight: "800", textAlign: "right" },
});
