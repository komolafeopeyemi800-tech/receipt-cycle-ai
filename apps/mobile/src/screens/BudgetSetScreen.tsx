import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "../lib/api";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../lib/api";
import { AppButton, AppCard, FormField } from "../components/ui/FinanceUI";
import { CategoryGlyph, ModuleDetailHeader } from "../components/ui/MoneyModuleUI";
import { useMoneyAppearance } from "../contexts/MoneyAppearanceContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useMonthMoneyData } from "../features/money/useMoneyData";
import { formatMonthYearLabel, roundMoney } from "../utils/transactionMath";
import { colors, radius, spacing, uiType } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";
import { userFacingErrorFromUnknown } from "../lib/userFacingErrors";
import { useSubscriptionState } from "../hooks/useSubscriptionState";

export function BudgetSetScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "BudgetSet">>();
  const { category, month, kind } = route.params;
  const { workspace, user, categories, budgets, loading } = useMonthMoneyData(month);
  const { currency } = usePreferences();
  const { appearance } = useMoneyAppearance();
  const sub = useSubscriptionState();
  const upsert = useMutation(api.budgets.upsert);
  const [amount, setAmount] = useState("");
  const [startMonth, setStartMonth] = useState(month);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const current = budgets.find((row) => row.category === category);
  const cat = categories.find((row) => row.name === category && row.kind === kind);
  const value = Number(amount.replace(/,/g, "").trim());
  const valid = Number.isFinite(value) && value > 0;

  useEffect(() => { if (current && !amount) setAmount(String(current.limitAmount)); }, [current?.limitAmount]);

  async function save() {
    if (!valid) { Alert.alert("Budget amount", "Enter an amount greater than zero."); return; }
    if (!user?.id) { Alert.alert("Sign in", "Sign in to save a budget."); return; }
    setSaving(true);
    try {
      await upsert({ workspace, userId: user.id, category, month: startMonth, limitAmount: roundMoney(value) });
      navigation.goBack();
    } catch (error) { Alert.alert("Could not save budget", userFacingErrorFromUnknown(error)); }
    finally { setSaving(false); }
  }

  return <View style={styles.root}>
    <ModuleDetailHeader title="Set Budget" onBack={() => navigation.goBack()} />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {loading ? <ActivityIndicator color={colors.primary} /> : <View style={styles.categoryHero}>
          <CategoryGlyph name={category} color={cat?.color} icon={cat ? appearance.categoryIcons[cat.id] : undefined} size={58} />
          <View><Text style={styles.categoryName}>{category}</Text><Text style={styles.categoryHint}>{kind === "expense" ? "Plan your spending" : "Set an income goal"}</Text></View>
        </View>}
        <FormField label={kind === "expense" ? "Budget Amount" : "Income Goal"} icon="cash-outline" prefix={currency === "USD" ? "$" : currency} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" required />
        <Text style={styles.label}>Recurrence</Text>
        <View style={styles.recurringRow}>{["Monthly", "Weekly", "Yearly"].map((option) => <Pressable key={option} style={[styles.recur, option === "Monthly" && styles.recurActive]} onPress={() => { if (option !== "Monthly") Alert.alert("Monthly budgets", "Weekly and yearly recurrence are not supported by the current budget service."); }}><Text style={[styles.recurText, option === "Monthly" && styles.recurTextActive]}>{option}</Text></Pressable>)}</View>
        <Text style={styles.label}>Start From</Text>
        <Pressable style={styles.monthInput} onPress={() => setShowPicker(true)}><Text style={styles.monthValue}>{formatMonthYearLabel(startMonth)}</Text><Ionicons name="calendar-outline" size={20} color={colors.primary} /></Pressable>
        {showPicker ? <><DateTimePicker value={new Date(`${startMonth}-01T12:00:00`)} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={(_, selected) => { if (Platform.OS === "android") setShowPicker(false); if (selected) setStartMonth(`${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}`); }} />{Platform.OS === "ios" ? <Pressable onPress={() => setShowPicker(false)}><Text style={styles.done}>Done</Text></Pressable> : null}</> : null}
        <AppCard style={styles.info}><Ionicons name="refresh-outline" size={20} color={colors.primary} /><Text style={styles.infoText}>This budget applies to {formatMonthYearLabel(startMonth)}. Set future months separately when your plan changes.</Text></AppCard>
        {sub && !sub.canMutateBudgets ? <Text style={styles.limit}>{sub.blockReason ?? "Your plan cannot edit budgets right now."}</Text> : null}
      </ScrollView>
      <View style={styles.footer}><AppButton label={saving ? "Saving…" : "Save Budget"} onPress={() => void save()} disabled={!valid || saving || loading || Boolean(sub && !sub.canMutateBudgets)} /></View>
    </KeyboardAvoidingView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  categoryHero: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.xxl },
  categoryName: { color: colors.textPrimary, fontSize: uiType.sectionTitle, fontWeight: "800" }, categoryHint: { color: colors.gray600, fontSize: uiType.secondary, marginTop: 3 },
  label: { color: colors.gray700, fontSize: uiType.secondary, fontWeight: "700", marginBottom: 7, marginTop: spacing.sm },
  recurringRow: { flexDirection: "row", gap: 4, marginBottom: spacing.lg }, recur: { flex: 1, height: 34, borderRadius: radius.small, backgroundColor: "#eff4fa", alignItems: "center", justifyContent: "center" }, recurActive: { backgroundColor: colors.primary }, recurText: { color: colors.gray600, fontSize: uiType.caption, fontWeight: "700" }, recurTextActive: { color: "#fff" },
  monthInput: { height: 48, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md }, monthValue: { fontSize: uiType.body, color: colors.textPrimary }, done: { color: colors.primary, textAlign: "right", fontWeight: "700", marginTop: 6 },
  info: { backgroundColor: colors.blueSoft, flexDirection: "row", gap: 10, marginTop: spacing.xl }, infoText: { flex: 1, color: colors.gray700, fontSize: uiType.secondary, lineHeight: 18 }, limit: { color: colors.danger, fontSize: uiType.secondary, marginTop: spacing.md },
  footer: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider, padding: spacing.lg },
});
