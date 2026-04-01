import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { data as ISO_CURRENCY_DATA } from "currency-codes";
import { ReceiptCycleLogo } from "../components/ReceiptCycleLogo";
import { getIsoCountries } from "../lib/isoCountries";
import { usePreferences } from "../contexts/PreferencesContext";
import { colors, gradients, type as typeScale } from "../theme/tokens";
import { PRICING_PLANS } from "../constants/pricing";

const ONBOARDING_DATA_KEY = "onboardingData";

const GOALS = [
  { id: "track", title: "Track incomes & expenses", sub: "Monitor transactions", icon: "trending-up-outline" as const },
  { id: "debts", title: "Manage debts / loans", sub: "Pay off faster", icon: "card-outline" as const },
  { id: "cut", title: "Cut down expenses", sub: "Reduce spending", icon: "trending-down-outline" as const },
  { id: "saving", title: "Saving", sub: "Build savings", icon: "wallet-outline" as const },
  { id: "manage", title: "All money in one place", sub: "Full overview", icon: "wallet-outline" as const },
];

const USECASES = [
  { id: "personal", title: "Personal budget", sub: "Household spending", icon: "home-outline" as const },
  { id: "expense", title: "Expense reports", sub: "Reimbursement", icon: "document-text-outline" as const },
  { id: "tax", title: "Tax deductions", sub: "Business expenses", icon: "receipt-outline" as const },
];

const INDUSTRIES = [
  { id: "construction", label: "Construction", icon: "build-outline" as const },
  { id: "health", label: "Health", icon: "medical-outline" as const },
  { id: "sales", label: "Sales", icon: "megaphone-outline" as const },
  { id: "real-estate", label: "Real estate", icon: "home-outline" as const },
  { id: "digital", label: "Digital products", icon: "laptop-outline" as const },
  { id: "food", label: "Food & beverage", icon: "restaurant-outline" as const },
  { id: "retail", label: "Retail", icon: "bag-outline" as const },
  { id: "consulting", label: "Consulting", icon: "construct-outline" as const },
  { id: "other", label: "Other", icon: "ellipsis-horizontal-outline" as const },
];

export type OnboardingPersisted = {
  currency: string;
  goals: string[];
  /** personal = default solo; workspace = plans to use shared workspaces */
  trackingMode: string;
  usecases: string[];
  country: string;
  industry: string;
  completed: boolean;
  completedAt: string;
};

type Props = { onDone: () => void };

type CurrencyRow = { code: string; label: string; search: string };

export function OnboardingScreen({ onDone }: Props) {
  const insets = useSafeAreaInsets();
  const { setCurrency } = usePreferences();
  const [step, setStep] = useState(1);
  const [currency, setCurrencyLocal] = useState("USD");
  const [goals, setGoals] = useState<string[]>([]);
  const [usecases, setUsecases] = useState<string[]>([]);
  const [country, setCountry] = useState("US");
  const [industry, setIndustry] = useState("");
  const [currencyModal, setCurrencyModal] = useState(false);
  const [countryModal, setCountryModal] = useState(false);
  const [currencyQuery, setCurrencyQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");

  const pct = useMemo(() => Math.round((step / 7) * 100), [step]);

  const currencyRows = useMemo<CurrencyRow[]>(() => {
    return ISO_CURRENCY_DATA.map((c) => ({
      code: c.code,
      label: `${c.code} — ${c.currency}`,
      search: `${c.code} ${c.currency} ${(c.countries ?? []).join(" ")}`.toLowerCase(),
    })).sort((a, b) => a.code.localeCompare(b.code));
  }, []);

  const filteredCurrencies = useMemo(() => {
    const q = currencyQuery.trim().toLowerCase();
    if (!q) return currencyRows;
    return currencyRows.filter((r) => r.search.includes(q));
  }, [currencyRows, currencyQuery]);

  const countryRows = useMemo(() => getIsoCountries(), []);
  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return countryRows;
    return countryRows.filter((r) => r.search.includes(q));
  }, [countryRows, countryQuery]);

  const currencyLabel = useMemo(
    () => currencyRows.find((r) => r.code === currency)?.label ?? currency,
    [currencyRows, currency],
  );

  const countryLabel = useMemo(() => {
    const row = countryRows.find((r) => r.code === country);
    return row ? `${row.code} — ${row.name}` : country;
  }, [countryRows, country]);

  const toggle = (arr: string[], id: string, set: (v: string[]) => void) => {
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  };

  const persistAndFinish = useCallback(async () => {
    const data: OnboardingPersisted = {
      currency: currency || "USD",
      goals,
      trackingMode: "personal",
      usecases,
      country: country || "US",
      industry: industry || "other",
      completed: true,
      completedAt: new Date().toISOString(),
    };
    try {
      await AsyncStorage.setItem(ONBOARDING_DATA_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
    await setCurrency(data.currency);
    onDone();
  }, [currency, goals, usecases, country, industry, setCurrency, onDone]);

  const skipEntireSetup = useCallback(async () => {
    const data: OnboardingPersisted = {
      currency: "USD",
      goals: [],
      trackingMode: "personal",
      usecases: [],
      country: "US",
      industry: "other",
      completed: true,
      completedAt: new Date().toISOString(),
    };
    try {
      await AsyncStorage.setItem(ONBOARDING_DATA_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
    await setCurrency("USD");
    onDone();
  }, [setCurrency, onDone]);

  const next = () => {
    if (step < 7) setStep((s) => s + 1);
    else void persistAndFinish();
  };

  const back = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient colors={[...gradients.page]} style={styles.flex}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
          {step > 1 ? (
            <Pressable style={styles.iconBtn} onPress={back} hitSlop={12}>
              <Ionicons name="arrow-back" size={24} color={colors.gray800} />
            </Pressable>
          ) : (
            <View style={styles.iconBtn} />
          )}
          <Pressable onPress={() => void skipEntireSetup()} hitSlop={12} style={styles.skipWrap}>
            <Text style={styles.skip}>Skip setup</Text>
          </Pressable>
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressTop}>
            <Text style={styles.stepLbl}>Step {step} of 7</Text>
            <Text style={styles.pctLbl}>{pct}%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct}%` }]} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoRow}>
            <ReceiptCycleLogo size={52} />
          </View>

          {step === 1 && (
            <>
              <Text style={styles.h2}>Main currency</Text>
              <Text style={styles.p}>Search all ISO 4217 currencies. Used for amounts and reports.</Text>
              <Pressable style={styles.choiceCard} onPress={() => setCurrencyModal(true)}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.choiceLbl}>Selected</Text>
                  <Text style={styles.choiceVal} numberOfLines={2}>
                    {currencyLabel}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={colors.gray400} />
              </Pressable>
              <Text style={styles.miniHint}>Tap to search {currencyRows.length}+ currencies by code, name, or country.</Text>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.h2}>Primary goals</Text>
              <Text style={styles.p}>Select all that apply.</Text>
              {GOALS.map((g) => (
                <Pressable
                  key={g.id}
                  style={[styles.card, goals.includes(g.id) && styles.cardOn]}
                  onPress={() => toggle(goals, g.id, setGoals)}
                >
                  <View style={styles.cardLeft}>
                    <Ionicons name={g.icon} size={22} color={goals.includes(g.id) ? colors.primary : colors.gray500} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.cardTitle}>{g.title}</Text>
                      <Text style={styles.cardSub}>{g.sub}</Text>
                    </View>
                  </View>
                  <Ionicons
                    name={goals.includes(g.id) ? "checkmark-circle" : "ellipse-outline"}
                    size={24}
                    color={goals.includes(g.id) ? colors.primary : colors.gray400}
                  />
                </Pressable>
              ))}
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.h2}>Personal finance</Text>
              <Text style={styles.p}>
                Receipt Cycle is built for your individual finances — one private space for receipts and
                transactions. There are no shared workspaces or team invites in this app.
              </Text>
              <View style={styles.infoCard}>
                <Ionicons name="shield-checkmark-outline" size={28} color={colors.primary} />
                <Text style={[styles.bigTitle, { textAlign: "center" }]}>Your data stays yours</Text>
                <Text style={[styles.bigSub, { textAlign: "center" }]}>
                  Sign in to sync securely with Convex. Export CSV anytime from Settings.
                </Text>
              </View>
            </>
          )}

          {step === 4 && (
            <>
              <Text style={styles.h2}>Focus areas</Text>
              <Text style={styles.p}>Optional — helps us prioritize features.</Text>
              {USECASES.map((u) => (
                <Pressable
                  key={u.id}
                  style={[styles.card, usecases.includes(u.id) && styles.cardOn]}
                  onPress={() => toggle(usecases, u.id, setUsecases)}
                >
                  <View style={styles.cardLeft}>
                    <Ionicons name={u.icon} size={22} color={usecases.includes(u.id) ? colors.primary : colors.gray500} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.cardTitle}>{u.title}</Text>
                      <Text style={styles.cardSub}>{u.sub}</Text>
                    </View>
                  </View>
                  <Ionicons
                    name={usecases.includes(u.id) ? "checkmark-circle" : "ellipse-outline"}
                    size={24}
                    color={usecases.includes(u.id) ? colors.primary : colors.gray400}
                  />
                </Pressable>
              ))}
            </>
          )}

          {step === 5 && (
            <>
              <Text style={styles.h2}>Country / region</Text>
              <Text style={styles.p}>Full ISO country list — search by name or code.</Text>
              <Pressable style={styles.choiceCard} onPress={() => setCountryModal(true)}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.choiceLbl}>Selected</Text>
                  <Text style={styles.choiceVal} numberOfLines={2}>
                    {countryLabel}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={colors.gray400} />
              </Pressable>
            </>
          )}

          {step === 6 && (
            <>
              <Text style={styles.h2}>Industry</Text>
              <Text style={styles.p}>Optional — helps tailor categories.</Text>
              <View style={styles.industryGrid}>
                {INDUSTRIES.map((i) => (
                  <Pressable
                    key={i.id}
                    style={[styles.industryChip, industry === i.id && styles.industryChipOn]}
                    onPress={() => setIndustry(i.id)}
                  >
                    <Ionicons name={i.icon} size={20} color={industry === i.id ? "#fff" : colors.primary} />
                    <Text style={[styles.industryTxt, industry === i.id && styles.industryTxtOn]} numberOfLines={2}>
                      {i.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {step === 7 && (
            <>
              <Text style={styles.h2}>You&apos;re ready</Text>
              <Text style={styles.p}>
                Add transactions or scan receipts. While you&apos;re signed in, transactions and preferences are saved to
                Convex (with a local cache on this device for speed).
              </Text>
              <View style={styles.doneBox}>
                <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
                <Text style={styles.doneTitle}>Setup complete</Text>
                <Text style={styles.cardSub}>You can change currency and date format anytime in Settings.</Text>
              </View>
              <Text style={styles.pricingTitle}>Premium pricing</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pricingRow}>
                {PRICING_PLANS.map((p) => (
                  <View key={p.id} style={styles.pricingCard}>
                    <Text style={styles.pricingName}>{p.name}</Text>
                    <Text style={styles.pricingPrice}>
                      {p.price}
                      <Text style={styles.pricingPeriod}>{p.period}</Text>
                    </Text>
                    <Text style={styles.pricingBlurb}>{p.blurb}</Text>
                  </View>
                ))}
              </ScrollView>
            </>
          )}
          <View style={{ height: 120 }} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <Pressable style={styles.mainBtn} onPress={next}>
            <Text style={styles.mainBtnTxt}>{step === 7 ? "Get started" : "Next"}</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </Pressable>
        </View>

        <Modal visible={currencyModal} animationType="slide" onRequestClose={() => setCurrencyModal(false)}>
          <View style={[styles.modalRoot, { paddingTop: insets.top + 8 }]}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setCurrencyModal(false)} hitSlop={12}>
                <Text style={styles.modalCancel}>Done</Text>
              </Pressable>
              <Text style={styles.modalTitle}>Currencies</Text>
              <View style={{ width: 56 }} />
            </View>
            <TextInput
              style={styles.search}
              placeholder="Search code, name, country…"
              placeholderTextColor={colors.gray400}
              value={currencyQuery}
              onChangeText={setCurrencyQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
            <FlatList
              data={filteredCurrencies}
              keyExtractor={(item) => item.code}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={28}
              windowSize={10}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.pickerRow, item.code === currency && styles.pickerRowOn]}
                  onPress={() => {
                    setCurrencyLocal(item.code);
                    setCurrencyModal(false);
                    setCurrencyQuery("");
                  }}
                >
                  <Text style={styles.pickerRowTxt}>{item.label}</Text>
                  {item.code === currency ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
                </Pressable>
              )}
              ListEmptyComponent={<Text style={styles.empty}>No matches.</Text>}
            />
          </View>
        </Modal>

        <Modal visible={countryModal} animationType="slide" onRequestClose={() => setCountryModal(false)}>
          <View style={[styles.modalRoot, { paddingTop: insets.top + 8 }]}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setCountryModal(false)} hitSlop={12}>
                <Text style={styles.modalCancel}>Done</Text>
              </Pressable>
              <Text style={styles.modalTitle}>Countries</Text>
              <View style={{ width: 56 }} />
            </View>
            <TextInput
              style={styles.search}
              placeholder="Search name or code…"
              placeholderTextColor={colors.gray400}
              value={countryQuery}
              onChangeText={setCountryQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={24}
              windowSize={10}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.pickerRow, item.code === country && styles.pickerRowOn]}
                  onPress={() => {
                    setCountry(item.code);
                    setCountryModal(false);
                    setCountryQuery("");
                  }}
                >
                  <Text style={styles.pickerRowTxt}>
                    {item.code} — {item.name}
                  </Text>
                  {item.code === country ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
                </Pressable>
              )}
              ListEmptyComponent={<Text style={styles.empty}>No matches.</Text>}
            />
          </View>
        </Modal>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 6,
  },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  skipWrap: { minHeight: 44, justifyContent: "center", paddingHorizontal: 8 },
  skip: { fontSize: typeScale.body, fontWeight: "700", color: colors.primary },
  progressWrap: { paddingHorizontal: 14, marginBottom: 10 },
  progressTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  stepLbl: { fontSize: typeScale.xs, fontWeight: "700", color: colors.gray500 },
  pctLbl: { fontSize: typeScale.xs, color: colors.gray400 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.gray200, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.primary, borderRadius: 3 },
  scroll: { paddingHorizontal: 14, paddingBottom: 16 },
  logoRow: { alignItems: "center", marginBottom: 8 },
  h2: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.gray900,
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 28,
  },
  p: {
    fontSize: typeScale.md,
    color: colors.gray600,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
    paddingHorizontal: 4,
  },
  miniHint: { fontSize: typeScale.xs, color: colors.gray500, textAlign: "center", marginTop: 10, lineHeight: 18 },
  choiceCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 14,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 10,
    minHeight: 56,
  },
  choiceLbl: { fontSize: typeScale.xs, fontWeight: "700", color: colors.gray500, marginBottom: 4 },
  choiceVal: { fontSize: typeScale.bodyStrong, fontWeight: "700", color: colors.gray900 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: 10,
    backgroundColor: colors.surface,
    minHeight: 52,
  },
  cardOn: { borderColor: colors.primary, backgroundColor: colors.emerald50 },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, minWidth: 0 },
  cardTitle: { fontSize: typeScale.body, fontWeight: "600", color: colors.gray900 },
  cardSub: { fontSize: typeScale.sm, color: colors.gray500, marginTop: 2 },
  bigCard: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: 12,
    backgroundColor: colors.surface,
    gap: 6,
    minHeight: 100,
  },
  bigCardOn: { borderColor: colors.primary, backgroundColor: colors.emerald50 },
  infoCard: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.emerald50,
    gap: 6,
    alignItems: "center",
  },
  bigTitle: { fontSize: 17, fontWeight: "800", color: colors.gray900 },
  bigSub: { fontSize: typeScale.sm, color: colors.gray600, lineHeight: 20 },
  industryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" },
  industryChip: {
    width: "48%",
    minHeight: 72,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  industryChipOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  industryTxt: { fontSize: typeScale.sm, fontWeight: "600", color: colors.gray800, textAlign: "center" },
  industryTxtOn: { color: "#fff" },
  doneBox: {
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.surface,
    marginTop: 6,
  },
  doneTitle: { fontSize: typeScale.bodyStrong, fontWeight: "700", marginTop: 8, color: colors.gray900 },
  pricingTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.gray500,
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  pricingRow: { flexDirection: "row", gap: 10, paddingHorizontal: 2, paddingBottom: 8 },
  pricingCard: {
    width: 200,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
  },
  pricingName: { fontSize: typeScale.xs, fontWeight: "700", color: colors.gray800 },
  pricingPrice: { fontSize: typeScale.md, fontWeight: "800", color: colors.gray900, marginTop: 4 },
  pricingPeriod: { fontSize: typeScale.xs, fontWeight: "600", color: colors.gray600 },
  pricingBlurb: { fontSize: 10, color: colors.gray500, marginTop: 4, lineHeight: 14 },
  footer: {
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    backgroundColor: "rgba(255,255,255,0.97)",
  },
  mainBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 52,
  },
  mainBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 17 },
  modalRoot: { flex: 1, backgroundColor: colors.surface },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  modalCancel: { fontSize: typeScale.body, fontWeight: "600", color: colors.primary, width: 56 },
  modalTitle: { fontSize: typeScale.bodyStrong, fontWeight: "700", color: colors.gray900 },
  search: {
    marginHorizontal: 14,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray100,
    minHeight: 48,
  },
  pickerRowOn: { backgroundColor: "#ecfdf5" },
  pickerRowTxt: { fontSize: typeScale.body, color: colors.gray900, flex: 1, paddingRight: 8 },
  empty: { textAlign: "center", color: colors.gray500, marginTop: 28 },
});
