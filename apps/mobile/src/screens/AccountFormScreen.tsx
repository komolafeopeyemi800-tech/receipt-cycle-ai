import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "../lib/api";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Id } from "../lib/api";
import { api } from "../lib/api";
import { AppButton, FormField } from "../components/ui/FinanceUI";
import { SafeActionFooter } from "../components/ui/SafeActionFooter";
import { ModuleDetailHeader } from "../components/ui/MoneyModuleUI";
import { useMoneyAppearance } from "../contexts/MoneyAppearanceContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { accountTypes, appearanceColors } from "../features/money/model";
import { userFacingErrorFromUnknown } from "../lib/userFacingErrors";
import { colors, radius, spacing, uiType } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";

export function AccountFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "AccountForm">>();
  const id = route.params?.accountId as Id<"accounts"> | undefined;
  const { workspace, ready } = useWorkspace();
  const { currency } = usePreferences();
  const { appearance, setAccountColor } = useMoneyAppearance();
  const account = useQuery(api.accounts.get, id && ready ? { id, workspace } : "skip");
  const create = useMutation(api.accounts.create);
  const update = useMutation(api.accounts.update);
  const [typeKey, setTypeKey] = useState(accountTypes[0]!.key);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("0.00");
  const [color, setColor] = useState<string>(appearanceColors[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!account) return;
    setTypeKey(account.iconKey);
    setName(account.name);
    setBalance(String(account.balance));
    setColor(appearance.accountColors[account.id] ?? appearanceColors[0]);
  }, [account?.id]);

  async function save() {
    const trimmed = name.trim();
    const numeric = Number(balance.replace(/,/g, "").trim());
    if (trimmed.length < 2) { Alert.alert("Account name", "Enter at least two characters."); return; }
    if (!Number.isFinite(numeric)) { Alert.alert("Opening balance", "Enter a valid amount."); return; }
    setSaving(true);
    try {
      if (id) {
        await update({ id, name: trimmed, balance: numeric, iconKey: typeKey });
        setAccountColor(id, color);
      } else {
        const created = await create({ workspace, name: trimmed, balance: numeric, iconKey: typeKey });
        setAccountColor(String(created), color);
      }
      navigation.goBack();
    } catch (error) { Alert.alert("Could not save account", userFacingErrorFromUnknown(error)); }
    finally { setSaving(false); }
  }

  return <View style={styles.root}>
    <ModuleDetailHeader title={id ? "Edit Account" : "Add Account"} onBack={() => navigation.goBack()} />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {id && account === undefined ? <ActivityIndicator color={colors.primary} /> : null}
        <Text style={styles.label}>Account Type</Text>
        <View style={styles.typeGrid}>{accountTypes.map((item) => <Pressable key={item.key} style={[styles.typeTile, typeKey === item.key && styles.typeTileSelected]} onPress={() => setTypeKey(item.key)} accessibilityRole="radio" accessibilityState={{ selected: typeKey === item.key }}><Ionicons name={item.icon} size={22} color={typeKey === item.key ? "#fff" : colors.blue600} /><Text style={[styles.typeText, typeKey === item.key && styles.typeTextSelected]}>{item.label}</Text></Pressable>)}</View>
        <FormField label="Account Name" icon="wallet-outline" value={name} onChangeText={setName} placeholder="e.g. Business Checking" required />
        <FormField label={id ? "Current Balance" : "Opening Balance"} icon="cash-outline" prefix={currency === "USD" ? "$" : currency} value={balance} onChangeText={setBalance} keyboardType="decimal-pad" required />
        <Text style={styles.label}>Icon</Text>
        <View style={styles.iconRow}>{accountTypes.slice(0, 5).map((item) => <Pressable key={item.key} style={[styles.iconOption, typeKey === item.key && styles.iconOptionSelected]} onPress={() => setTypeKey(item.key)}><Ionicons name={item.icon} size={20} color={typeKey === item.key ? colors.primary : colors.blue600} /></Pressable>)}</View>
        <Text style={styles.label}>Color</Text>
        <View style={styles.colorRow}>{appearanceColors.map((hex) => <Pressable key={hex} onPress={() => setColor(hex)} style={[styles.colorRing, color === hex && styles.colorRingSelected]} accessibilityLabel={`Select ${hex} color`}><View style={[styles.colorDot, { backgroundColor: hex }]} /></Pressable>)}</View>
      </ScrollView>
      <SafeActionFooter><AppButton label={saving ? "Saving…" : id ? "Save Account" : "Create Account"} onPress={() => void save()} disabled={saving || !ready || Boolean(id && !account)} /></SafeActionFooter>
    </KeyboardAvoidingView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  label: { color: colors.gray700, fontSize: uiType.secondary, fontWeight: "700", marginBottom: spacing.sm },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.xl },
  typeTile: { width: "31%", minHeight: 62, backgroundColor: colors.surfaceSoft, borderRadius: radius.medium, alignItems: "center", justifyContent: "center", gap: 4 },
  typeTileSelected: { backgroundColor: colors.primary }, typeText: { color: colors.textPrimary, fontSize: uiType.caption }, typeTextSelected: { color: "#fff", fontWeight: "700" },
  iconRow: { flexDirection: "row", gap: 9, marginBottom: spacing.lg }, iconOption: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.blueSoft, alignItems: "center", justifyContent: "center" }, iconOptionSelected: { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.mintSoft },
  colorRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.lg }, colorRing: { padding: 3, borderRadius: 30, borderWidth: 2, borderColor: "transparent" }, colorRingSelected: { borderColor: colors.primary }, colorDot: { width: 24, height: 24, borderRadius: 12 },
  footer: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider, padding: spacing.lg },
});
