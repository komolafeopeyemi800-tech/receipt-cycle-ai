import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "../lib/api";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Id } from "../lib/api";
import { api } from "../lib/api";
import { AppButton, SegmentedTabs } from "../components/ui/FinanceUI";
import { ModuleDetailHeader } from "../components/ui/MoneyModuleUI";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useMoneyAppearance } from "../contexts/MoneyAppearanceContext";
import { appearanceColors, categoryIcons, defaultCategoryIcon, type CategoryRow, type MoneyIcon, type MoneyKind } from "../features/money/model";
import { userFacingErrorFromUnknown } from "../lib/userFacingErrors";
import { colors, radius, spacing, uiType } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";

export function CategoryEditorScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "CategoryEditor">>();
  const id = route.params?.categoryId as Id<"categories"> | undefined;
  const { workspace, ready } = useWorkspace();
  const { appearance, setCategoryIcon, setCategoryArchived } = useMoneyAppearance();
  const list = useQuery(api.categories.list, ready ? { workspace } : "skip");
  const category = ((list ?? []) as CategoryRow[]).find((row) => row.id === id);
  const create = useMutation(api.categories.create);
  const update = useMutation(api.categories.update);
  const remove = useMutation(api.categories.remove);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<MoneyKind>(route.params?.initialKind ?? "expense");
  const [icon, setIcon] = useState<MoneyIcon>("home-outline");
  const [color, setColor] = useState<string>(appearanceColors[0]);
  const [saving, setSaving] = useState(false);
  const archived = id ? appearance.archivedCategoryIds.includes(id) : false;

  useEffect(() => {
    if (!category) return;
    setName(category.name);
    setKind(category.kind);
    setIcon(appearance.categoryIcons[category.id] ?? defaultCategoryIcon(category.name));
    setColor(category.color);
  }, [category?.id]);

  async function save() {
    const trimmed = name.trim();
    if (trimmed.length < 2) { Alert.alert("Category name", "Enter at least two characters."); return; }
    setSaving(true);
    try {
      if (id) {
        await update({ id, name: trimmed, kind, color });
        setCategoryIcon(id, icon);
      } else {
        const created = await create({ workspace, name: trimmed, kind, color });
        setCategoryIcon(String(created), icon);
      }
      navigation.goBack();
    } catch (error) { Alert.alert("Could not save category", userFacingErrorFromUnknown(error)); }
    finally { setSaving(false); }
  }

  function confirmDelete() {
    if (!id) return;
    Alert.alert("Delete category", `Delete ${category?.name ?? "this category"}? Existing transactions will keep their category name.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { void remove({ id }).then(() => navigation.goBack()).catch((error) => Alert.alert("Could not delete category", userFacingErrorFromUnknown(error))); } },
    ]);
  }

  return <View style={styles.root}>
    <ModuleDetailHeader title={id ? "Edit Category" : "Add Category"} onBack={() => navigation.goBack()} />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {id && list === undefined ? <ActivityIndicator color={colors.primary} /> : null}
        <Text style={styles.label}>Category Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Home" placeholderTextColor={colors.gray400} accessibilityLabel="Category Name" />
        <Text style={styles.label}>Type</Text>
        <SegmentedTabs options={["expense", "income"] as const} value={kind} onChange={setKind} />
        <Text style={styles.label}>Icon</Text>
        <View style={styles.icons}>{categoryIcons.map((option) => <Pressable key={option.key} style={[styles.iconTile, icon === option.key && styles.iconSelected]} onPress={() => setIcon(option.key)} accessibilityLabel={`${option.label} icon`} accessibilityRole="radio" accessibilityState={{ selected: icon === option.key }}><Ionicons name={option.key} size={22} color={icon === option.key ? colors.primary : colors.blue600} /></Pressable>)}</View>
        <Text style={styles.label}>Color</Text>
        <View style={styles.colors}>{appearanceColors.map((hex) => <Pressable key={hex} onPress={() => setColor(hex)} style={[styles.colorRing, color === hex && styles.colorRingSelected]} accessibilityLabel={`Select ${hex} color`}><View style={[styles.colorDot, { backgroundColor: hex }]} /></Pressable>)}</View>
        {id ? <><Text style={styles.label}>More Options</Text><Pressable style={styles.option} onPress={() => setCategoryArchived(id, !archived)}><Ionicons name={archived ? "eye-outline" : "archive-outline"} size={20} color={colors.primary} /><View style={{ flex: 1 }}><Text style={styles.optionTitle}>{archived ? "Show Category" : "Hide Category"}</Text><Text style={styles.optionHint}>Changes visibility on this device</Text></View></Pressable><Pressable style={styles.option} onPress={confirmDelete}><Ionicons name="trash-outline" size={20} color={colors.danger} /><View style={{ flex: 1 }}><Text style={[styles.optionTitle, { color: colors.danger }]}>Delete Category</Text><Text style={styles.optionHint}>Permanently remove this category</Text></View></Pressable></> : null}
      </ScrollView>
      <View style={styles.footer}><AppButton label={saving ? "Saving…" : id ? "Save Category" : "Create Category"} onPress={() => void save()} disabled={saving || !ready || Boolean(id && !category)} /></View>
    </KeyboardAvoidingView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.lg, paddingBottom: spacing.xl },
  label: { color: colors.gray700, fontSize: uiType.secondary, fontWeight: "700", marginBottom: 7 },
  input: { height: 46, borderWidth: 1, borderColor: colors.border, borderRadius: radius.medium, backgroundColor: colors.surface, paddingHorizontal: spacing.md, color: colors.textPrimary, fontSize: uiType.body, marginBottom: spacing.lg },
  icons: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.lg }, iconTile: { width: "17%", height: 39, borderRadius: radius.medium, backgroundColor: colors.blueSoft, alignItems: "center", justifyContent: "center" }, iconSelected: { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.mintSoft },
  colors: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.lg }, colorRing: { padding: 3, borderRadius: 30, borderWidth: 2, borderColor: "transparent" }, colorRingSelected: { borderColor: colors.primary }, colorDot: { width: 23, height: 23, borderRadius: 12 },
  option: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.medium, minHeight: 54, padding: spacing.sm, marginBottom: 5 }, optionTitle: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "700" }, optionHint: { color: colors.gray600, fontSize: uiType.caption, marginTop: 1 },
  footer: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider, padding: spacing.lg },
});
