import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MOBILE_PAYWALL_BENEFITS, MOBILE_PAYWALL_TRUST } from "../lib/playStoreUiCopy";
import {
  PAYWALL_PLANS,
  yearlyDiscountPercent,
  equivalentMonthlyFromYearly,
  paywallPlanDetailLine,
  type PaywallPlanId,
} from "../lib/pricingPaywall";
import { expoWhopCheckoutUrl, expoWhopManageUrl } from "../constants/urls";
import { openHttpsOrExternalUrl } from "../lib/openExternalUrl";
import type { RootStackParamList } from "../navigation/types";

/** Same order as PAYWALL_BENEFITS */
const BENEFIT_ICONS = [
  "mic",
  "color-wand-outline",
  "happy-outline",
  "infinite",
  "phone-portrait-outline",
  "chatbubbles-outline",
] as const;

export function PricingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [plan, setPlan] = useState<PaywallPlanId>("yearly");
  const discountPct = yearlyDiscountPercent();

  async function openCheckout() {
    const url = expoWhopCheckoutUrl(plan);
    if (plan === "free") {
      if (url) {
        try {
          await openHttpsOrExternalUrl(url);
        } catch {
          Alert.alert("Could not open checkout", url);
        }
        return;
      }
      navigation.navigate("Main");
      return;
    }
    if (!url) {
      Alert.alert(
        "Checkout not configured",
        "Add EXPO_PUBLIC_WHOP_CHECKOUT_MONTHLY_URL and EXPO_PUBLIC_WHOP_CHECKOUT_YEARLY_URL to apps/mobile/.env.local (same folder as app.json), then stop Expo and run `npx expo start -c` so Metro picks them up. EAS: set env in eas.json or EAS Secrets.",
      );
      return;
    }
    try {
      await openHttpsOrExternalUrl(url);
    } catch {
      Alert.alert("Could not open checkout", url);
    }
  }

  async function openManage() {
    const url = expoWhopManageUrl();
    try {
      await openHttpsOrExternalUrl(url);
    } catch {
      Alert.alert("Could not open link", url);
    }
  }

  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 10) }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color="#e4e4e7" />
        </Pressable>
        <Text style={styles.topTitle}>Receipt Cycle Pro</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>Free, monthly, or yearly · phone + web</Text>
        <Text style={styles.headline}>{MOBILE_PAYWALL_TRUST.headline}</Text>
        <Text style={styles.sub}>{MOBILE_PAYWALL_TRUST.quote}</Text>

        <View style={styles.benefitBlock}>
          {MOBILE_PAYWALL_BENEFITS.map((b, i) => (
            <View key={b.title} style={styles.benefitCard}>
              <View style={styles.benefitIcon}>
                <Ionicons name={BENEFIT_ICONS[i] ?? "star-outline"} size={22} color="#2dd4bf" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.benefitTitle}>{b.title}</Text>
                <Text style={styles.benefitBody}>{b.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.planSectionLbl}>CHOOSE YOUR PLAN</Text>
        <View style={styles.planCol}>
          {PAYWALL_PLANS.map((p) => {
            const on = plan === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => setPlan(p.id)}
                style={[styles.planCard, on ? styles.planCardOn : styles.planCardOff]}
              >
                <View style={styles.planCardHeader}>
                  <Text style={styles.planHintTop} numberOfLines={2}>
                    {p.hint}
                  </Text>
                  {p.id === "yearly" ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeTxt}>−{discountPct}%</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.planLbl}>{p.label}</Text>
                <Text style={styles.planPrice}>{p.priceLine}</Text>
                <Text style={styles.planHint}>{p.periodNote}</Text>
                {p.id === "yearly" ? (
                  <Text style={styles.planEquiv}>~{equivalentMonthlyFromYearly()}/mo eq.</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.trialNote}>{paywallPlanDetailLine(plan)}</Text>

        <Pressable onPress={() => void openCheckout()} style={styles.ctaWrap}>
          <LinearGradient colors={["#f43f5e", "#fb923c"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
            <Ionicons
              name={plan === "free" ? "arrow-forward-outline" : "lock-open-outline"}
              size={20}
              color="#fff"
            />
            <Text style={styles.ctaTxt}>
              {plan === "free"
                ? "Continue with Free"
                : plan === "yearly"
                  ? "Start your free week"
                  : "Subscribe — Monthly"}
            </Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={() => void openManage()} style={styles.linkBtn}>
          <Text style={styles.linkTxt}>Restore purchases / manage on Whop</Text>
        </Pressable>

        <View style={{ height: 8 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#09090b" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#27272a",
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  topTitle: { fontSize: 15, fontWeight: "700", color: "#fafafa" },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28 },
  kicker: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#5eead4",
    marginBottom: 6,
  },
  headline: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "800",
    color: "#fafafa",
    lineHeight: 30,
  },
  sub: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: "#a1a1aa",
    paddingHorizontal: 4,
  },
  benefitBlock: { marginTop: 20, gap: 10 },
  benefitCard: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#27272a",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitTitle: { fontSize: 15, fontWeight: "700", color: "#fafafa" },
  benefitBody: { marginTop: 4, fontSize: 13, lineHeight: 19, color: "#a1a1aa" },
  planSectionLbl: {
    marginTop: 28,
    marginBottom: 10,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#71717a",
  },
  planCol: { gap: 10 },
  planCard: {
    minHeight: 108,
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
  },
  planCardOn: { backgroundColor: "#18181b", borderColor: "#fafafa" },
  planCardOff: { backgroundColor: "#18181b90", borderColor: "#27272a" },
  planCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  planHintTop: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "#71717a",
    textTransform: "uppercase",
  },
  badge: {
    flexShrink: 0,
    marginTop: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.45)",
  },
  badgeTxt: { fontSize: 10, fontWeight: "800", color: "#34d399" },
  planLbl: { fontSize: 14, fontWeight: "700", color: "#e4e4e7", marginTop: 4 },
  planPrice: { marginTop: 6, fontSize: 20, fontWeight: "800", color: "#fafafa" },
  planHint: { marginTop: 2, fontSize: 11, color: "#71717a" },
  planEquiv: { marginTop: 6, fontSize: 10, color: "#71717a" },
  trialNote: {
    marginTop: 14,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    color: "#71717a",
    paddingHorizontal: 4,
  },
  ctaWrap: { marginTop: 18, borderRadius: 16, overflow: "hidden" },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  ctaTxt: { fontSize: 16, fontWeight: "800", color: "#fff" },
  linkBtn: { marginTop: 14, paddingVertical: 8, alignItems: "center" },
  linkTxt: { fontSize: 14, fontWeight: "600", color: "#a1a1aa", textDecorationLine: "underline" },
});
