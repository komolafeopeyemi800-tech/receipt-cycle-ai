import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppCard, IconTile, ScreenContainer } from "../components/ui/FinanceUI";
import { useSubscriptionState } from "../hooks/useSubscriptionState";
import { colors, spacing, uiType } from "../theme/tokens";

export function PricingScreen() {
  const subscription = useSubscriptionState();
  const usage = subscription?.pro ? "Unlimited" : `${subscription?.trialAddsUsed ?? 0} / ${subscription?.trialAddsLimit ?? 25}`;
  const accessLabel = subscription?.pro ? "Pro access" : subscription?.phase === "trial" ? "Trial access" : "Free access";
  const daysRemaining = subscription?.pro
    ? null
    : Math.max(0, Math.ceil(((subscription?.trialEndsAt ?? Date.now()) - Date.now()) / 86_400_000));
  const aiAccess = subscription?.pro
    ? "Unlimited"
    : subscription?.canUseAiFeatures
      ? `${subscription.trialAddsRemaining} transaction${subscription.trialAddsRemaining === 1 ? "" : "s"} remaining`
      : "Trial limit reached";

  return (
    <ScreenContainer>
      <ScreenHeader title="Plan & Access" back />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <IconTile icon={subscription?.pro ? "diamond" : "person-outline"} tone={subscription?.pro ? "amber" : "mint"} size={58} />
          <Text style={styles.title}>{accessLabel}</Text>
          <Text style={styles.subtitle}>Your access is synchronized securely across Receipt Cycle.</Text>
        </View>

        <AppCard style={styles.activeCard}>
          <Ionicons name={subscription?.pro ? "checkmark-circle" : "information-circle-outline"} size={22} color={subscription?.pro ? colors.success : colors.primary} />
          <View style={styles.flex}>
            <Text style={styles.activeTitle}>{subscription?.pro ? "Pro is active" : subscription?.phase === "trial" ? "Your trial is active" : "Free plan"}</Text>
            <Text style={styles.activeText}>{subscription?.pro ? "Unlimited records and eligible Pro features are available on this device." : subscription?.phase === "trial" ? `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining in your trial. Access ends when the timer expires or 25 transactions are reached.` : "Your trial access has ended. Existing records remain available."}</Text>
          </View>
        </AppCard>

        <AppCard style={styles.usageCard}>
          <Text style={styles.usageTitle}>Your usage</Text>
          <UsageRow label="Transactions" value={usage} />
          <UsageRow label="Trial countdown" value={subscription?.pro ? "Not applicable" : daysRemaining && daysRemaining > 0 ? `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left` : "Ended"} />
          <UsageRow label="AI features" value={aiAccess} />
          <UsageRow label="CSV export" value={subscription?.canExportCsv ? "Available" : "Not included"} />
        </AppCard>
      </ScrollView>
    </ScreenContainer>
  );
}

function UsageRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.usageRow}><Text style={styles.usageLabel}>{label}</Text><Text style={styles.usageValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  page: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  hero: { alignItems: "center", paddingVertical: spacing.lg },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: "900", lineHeight: 28, textAlign: "center", marginTop: spacing.md },
  subtitle: { color: colors.textSecondary, fontSize: uiType.body, lineHeight: 21, textAlign: "center", marginTop: spacing.xs, maxWidth: 320 },
  activeCard: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, backgroundColor: colors.emerald50, marginBottom: spacing.md },
  flex: { flex: 1 },
  activeTitle: { color: colors.textPrimary, fontSize: uiType.body, fontWeight: "800" },
  activeText: { color: colors.textSecondary, fontSize: uiType.caption, lineHeight: 18, marginTop: 2 },
  usageCard: { backgroundColor: colors.surfaceSoft, marginBottom: spacing.md },
  usageTitle: { color: colors.textPrimary, fontSize: uiType.body, fontWeight: "800", marginBottom: spacing.sm },
  usageRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  usageLabel: { color: colors.textSecondary, fontSize: uiType.secondary },
  usageValue: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "700", textAlign: "right", flexShrink: 1 },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, backgroundColor: colors.emerald50, borderRadius: 6, padding: spacing.md },
  noticeTitle: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800", marginBottom: 3 },
  noticeText: { flex: 1, color: colors.textSecondary, fontSize: uiType.caption, lineHeight: 18 },
});
