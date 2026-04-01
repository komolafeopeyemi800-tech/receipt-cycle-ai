import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PRICING_PLANS } from "../constants/pricing";
import { PRICING_PAGE_URL } from "../constants/urls";
import { colors, gradients, type as typeScale } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";

/** Short bullets aligned with web `Pricing.tsx` cards */
const PLAN_FEATURES: Record<string, string[]> = {
  weekly: ["All premium features", "Unlimited scans", "Cancel anytime"],
  monthly: ["All premium features", "Unlimited scans", "Priority support"],
  yearly: ["All premium features", "Unlimited scans", "Priority support", "Early access"],
};

export function PricingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  async function openWebsite() {
    try {
      await Linking.openURL(PRICING_PAGE_URL);
    } catch {
      /* handled by showing URL in UI */
    }
  }

  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <View style={[styles.top, { paddingTop: Math.max(insets.top, 10) }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={20} color={colors.gray900} />
        </Pressable>
        <Text style={styles.screenTitle}>Pricing</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
        <Text style={styles.lead}>Same plans as the website — pick what fits you.</Text>

        {PRICING_PLANS.map((p) => (
          <View key={p.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.planName}>{p.name}</Text>
              <Text style={styles.price}>
                {p.price}
                <Text style={styles.period}>{p.period}</Text>
              </Text>
              <Text style={styles.blurb}>{p.blurb}</Text>
            </View>
            {(PLAN_FEATURES[p.id] ?? []).map((line) => (
              <View key={line} style={styles.bulletRow}>
                <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                <Text style={styles.bulletTxt}>{line}</Text>
              </View>
            ))}
          </View>
        ))}

        <Pressable style={styles.linkBtn} onPress={() => void openWebsite()}>
          <Text style={styles.linkBtnTxt}>Open pricing page in browser</Text>
          <Ionicons name="open-outline" size={14} color={colors.primary} />
        </Pressable>
        <Text style={styles.urlHint} numberOfLines={2}>
          {PRICING_PAGE_URL}
        </Text>

        <View style={{ height: 32 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 6,
  },
  screenTitle: { fontSize: typeScale.title, fontWeight: "700", color: colors.gray900 },
  pad: { paddingHorizontal: 14, paddingBottom: 20 },
  lead: {
    fontSize: typeScale.sm,
    color: colors.gray600,
    marginBottom: 12,
    lineHeight: 18,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 10,
    backgroundColor: colors.surface,
    padding: 10,
    marginBottom: 8,
  },
  cardTop: { marginBottom: 6 },
  planName: { fontSize: typeScale.md, fontWeight: "700", color: colors.gray800 },
  price: { fontSize: typeScale.bodyStrong, fontWeight: "800", color: colors.gray900, marginTop: 4 },
  period: { fontSize: typeScale.sm, fontWeight: "600", color: colors.gray600 },
  blurb: { fontSize: typeScale.xs, color: colors.gray500, marginTop: 4 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 4 },
  bulletTxt: { flex: 1, fontSize: typeScale.xs, color: colors.gray700, lineHeight: 16 },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignSelf: "center",
  },
  linkBtnTxt: { fontSize: typeScale.sm, fontWeight: "600", color: colors.primary },
  urlHint: { fontSize: 10, color: colors.gray400, textAlign: "center", marginTop: 6, paddingHorizontal: 8 },
});
