import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppButton, AppCard, IconTile, ScreenContainer, SegmentedTabs } from "../components/ui/FinanceUI";
import { expoWhopCheckoutUrl, expoWhopManageUrl } from "../constants/urls";
import { useSubscriptionState } from "../hooks/useSubscriptionState";
import { openHttpsOrExternalUrl } from "../lib/openExternalUrl";
import { equivalentMonthlyFromYearly, formatUsd, PAYWALL_PRICING, PAYWALL_TIER_FEATURES, type PaywallPlanId, yearlyDiscountPercent } from "../lib/pricingPaywall";
import type { RootStackParamList } from "../navigation/types";
import { colors, radius, spacing, uiType } from "../theme/tokens";

type PaidPlan = "monthly" | "yearly";

export function PricingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const subscription = useSubscriptionState();
  const [plan, setPlan] = useState<PaidPlan>("yearly");

  async function openCheckout(target: PaywallPlanId = plan) {
    const url = expoWhopCheckoutUrl(target);
    if (target === "free") {
      if (url) {
        try { await openHttpsOrExternalUrl(url); }
        catch { Alert.alert("Could not open checkout", url); }
      } else navigation.navigate("Main");
      return;
    }
    if (!url) {
      Alert.alert("Checkout not configured", "The checkout link for this plan has not been configured yet.");
      return;
    }
    try { await openHttpsOrExternalUrl(url); }
    catch { Alert.alert("Could not open checkout", url); }
  }

  async function openManage() {
    const url = expoWhopManageUrl();
    try { await openHttpsOrExternalUrl(url); }
    catch { Alert.alert("Could not open link", url); }
  }

  const price = plan === "yearly" ? formatUsd(PAYWALL_PRICING.yearlyUsd) : formatUsd(PAYWALL_PRICING.monthlyUsd);
  const period = plan === "yearly" ? "/ year" : "/ month";
  const usage = subscription?.pro ? "Unlimited" : `${subscription?.trialAddsUsed ?? 0} / ${subscription?.trialAddsLimit ?? 25}`;

  return (
    <ScreenContainer>
      <ScreenHeader title="Go Premium" back />
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <IconTile icon="diamond-outline" tone="amber" size={58} />
          <Text style={styles.title}>Unlock More with Receipt Cycle Pro</Text>
          <Text style={styles.subtitle}>Powerful tools for growing businesses</Text>
        </View>

        {subscription?.pro ? <AppCard style={styles.activeCard}><Ionicons name="checkmark-circle" size={22} color={colors.success} /><View style={styles.flex}><Text style={styles.activeTitle}>Your Pro plan is active</Text><Text style={styles.activeText}>You have unlimited records and full feature access.</Text></View></AppCard> : null}

        <SegmentedTabs options={["monthly", "yearly"] as const} value={plan} onChange={setPlan} />
        <AppCard style={styles.planCard}>
          <View style={styles.planHeading}>
            <View><Text style={styles.planName}>Pro Plan</Text><View style={styles.priceRow}><Text style={styles.price}>{price}</Text><Text style={styles.period}>{period}</Text></View></View>
            {plan === "yearly" ? <View style={styles.saveBadge}><Text style={styles.saveText}>Save {yearlyDiscountPercent()}%</Text></View> : null}
          </View>
          <Text style={styles.billing}>{plan === "yearly" ? `About ${equivalentMonthlyFromYearly()} per month, billed annually after a ${PAYWALL_PRICING.trialDays}-day trial.` : "Flexible monthly billing. Cancel anytime on Whop."}</Text>
          <AppButton label={subscription?.pro ? "Manage subscription" : plan === "yearly" ? "Start your free week" : "Upgrade to Pro"} icon={subscription?.pro ? "settings-outline" : "sparkles-outline"} onPress={() => void (subscription?.pro ? openManage() : openCheckout())} style={styles.cta} />
          <View style={styles.features}>
            {PAYWALL_TIER_FEATURES.monthly.map((feature) => <View key={feature} style={styles.featureRow}><Ionicons name="checkmark-circle" size={18} color={colors.primary} /><Text style={styles.featureText}>{feature}</Text></View>)}
          </View>
        </AppCard>

        <AppCard style={styles.usageCard}>
          <Text style={styles.usageTitle}>Your usage</Text>
          <UsageRow label="Transactions" value={usage} />
          <UsageRow label="AI features" value={subscription?.canUseAiFeatures ? "Available" : "Locked"} />
          <UsageRow label="CSV export" value={subscription?.canExportCsv ? "Available" : "Pro only"} />
        </AppCard>

        {!subscription?.pro ? <Pressable onPress={() => void openCheckout("free")} style={styles.textButton}><Text style={styles.textButtonLabel}>Continue with Free</Text></Pressable> : null}
        <Pressable onPress={() => void openManage()} style={styles.textButton}><Text style={styles.manageLabel}>Restore purchases or manage on Whop</Text></Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

function UsageRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.usageRow}><Text style={styles.usageLabel}>{label}</Text><Text style={styles.usageValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  page: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxxl },
  hero: { alignItems: "center", paddingVertical: spacing.lg },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: "900", lineHeight: 28, textAlign: "center", marginTop: spacing.md, maxWidth: 310 },
  subtitle: { color: colors.textSecondary, fontSize: uiType.body, textAlign: "center", marginTop: spacing.xs },
  activeCard: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.emerald50, marginBottom: spacing.md },
  flex: { flex: 1 },
  activeTitle: { color: colors.textPrimary, fontSize: uiType.body, fontWeight: "800" },
  activeText: { color: colors.textSecondary, fontSize: uiType.caption, marginTop: 2 },
  planCard: { backgroundColor: "#f7fbff", borderColor: "#d8e7f5", padding: spacing.lg },
  planHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  planName: { color: colors.textPrimary, fontSize: uiType.sectionTitle, fontWeight: "800" },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginTop: 2 },
  price: { color: colors.textPrimary, fontSize: 26, fontWeight: "900" },
  period: { color: colors.gray600, fontSize: uiType.secondary, marginLeft: 4 },
  saveBadge: { borderRadius: radius.pill, backgroundColor: colors.emerald50, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  saveText: { color: colors.success, fontSize: uiType.caption, fontWeight: "800" },
  billing: { color: colors.textSecondary, fontSize: uiType.caption, lineHeight: 17, marginTop: spacing.sm },
  cta: { marginTop: spacing.md },
  features: { marginTop: spacing.lg, gap: spacing.sm },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  featureText: { flex: 1, color: colors.textPrimary, fontSize: uiType.secondary, lineHeight: 18 },
  usageCard: { marginTop: spacing.md, backgroundColor: colors.surfaceSoft },
  usageTitle: { color: colors.textPrimary, fontSize: uiType.body, fontWeight: "800", marginBottom: spacing.sm },
  usageRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  usageLabel: { color: colors.textSecondary, fontSize: uiType.secondary },
  usageValue: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "700" },
  textButton: { alignItems: "center", paddingVertical: spacing.md },
  textButtonLabel: { color: colors.primary, fontSize: uiType.body, fontWeight: "700" },
  manageLabel: { color: colors.gray600, fontSize: uiType.secondary, fontWeight: "600", textDecorationLine: "underline" },
});
