import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppButton, EmptyState, FormField, IconTile, ScreenContainer, SearchInput, SelectField, SegmentedTabs, StatusBadge } from "../components/ui/FinanceUI";
import { SafeActionFooter } from "../components/ui/SafeActionFooter";
import { usePreferences } from "../contexts/PreferencesContext";
import { useSalesSetup } from "../contexts/SalesSetupContext";
import type { CatalogItemKind } from "../features/sales/setupData";
import type { RootStackParamList } from "../navigation/types";
import { colors, radius, spacing, uiType } from "../theme/tokens";

type RootNav = NativeStackNavigationProp<RootStackParamList>;
type CatalogFilter = "All" | "Services" | "Products" | "Active";

function itemAppearance(category: string) {
  const key = category.toLowerCase();
  if (key.includes("design")) return { icon: "color-palette-outline" as const, tone: "amber" as const };
  if (key.includes("develop")) return { icon: "code-slash-outline" as const, tone: "purple" as const };
  if (key.includes("market")) return { icon: "megaphone-outline" as const, tone: "purple" as const };
  if (key.includes("manage")) return { icon: "calendar-outline" as const, tone: "amber" as const };
  return { icon: "briefcase-outline" as const, tone: "blue" as const };
}

export function ItemsServicesScreen() {
  const navigation = useNavigation<RootNav>();
  const { items } = useSalesSetup();
  const { formatMoney } = usePreferences();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CatalogFilter>("All");
  const rows = useMemo(() => items.filter((item) => {
    const normalized = search.trim().toLowerCase();
    const matchesSearch = !normalized || [item.name, item.description, item.category].some((value) => value.toLowerCase().includes(normalized));
    const matchesFilter = filter === "All" || (filter === "Active" ? item.active : item.kind === (filter === "Services" ? "service" : "product"));
    return matchesSearch && matchesFilter;
  }), [filter, items, search]);

  return <ScreenContainer>
    <ScreenHeader title="Items & Services" />
    <FlatList
      data={rows}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={<View style={styles.listHeader}><SearchInput value={search} onChangeText={setSearch} placeholder="Search items and services..." /><SegmentedTabs options={["All", "Services", "Products", "Active"] as const} value={filter} onChange={setFilter} /></View>}
      renderItem={({ item }) => {
        const appearance = itemAppearance(item.category);
        return <Pressable onPress={() => navigation.navigate("SalesItemForm", { itemId: item.id })} style={({ pressed }) => [styles.itemRow, pressed && { opacity: 0.72 }]} accessibilityRole="button">
          <IconTile icon={appearance.icon} tone={appearance.tone} size={42} />
          <View style={styles.rowMain}><Text style={styles.rowTitle} numberOfLines={1}>{item.name}</Text><Text style={styles.rowMeta} numberOfLines={1}>{item.description}</Text><Text style={styles.price}>{formatMoney(item.unitPrice)} / {item.kind === "service" ? "hour" : "unit"}</Text></View>
          {!item.active ? <StatusBadge status="inactive" /> : null}
          <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
        </Pressable>;
      }}
      ListEmptyComponent={<EmptyState icon="cube-outline" title="No items found" description="Try another filter or add an item or service." />}
    />
    <View style={styles.stickyAction}><AppButton label="Add item or service" icon="add" onPress={() => navigation.navigate("SalesItemForm")} /></View>
  </ScreenContainer>;
}

export function ItemServiceFormScreen() {
  const navigation = useNavigation<RootNav>();
  const route = useRoute<RouteProp<RootStackParamList, "SalesItemForm">>();
  const { items, saveItem, deleteItem } = useSalesSetup();
  const { showActionSheetWithOptions } = useActionSheet();
  const existing = route.params?.itemId ? items.find((item) => item.id === route.params?.itemId) : undefined;
  const [kind, setKind] = useState<CatalogItemKind>(existing?.kind ?? "service");
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [unitPrice, setUnitPrice] = useState(existing ? String(existing.unitPrice) : "");
  const [taxRate, setTaxRate] = useState(existing?.taxRate ?? "Default");
  const [category, setCategory] = useState(existing?.category ?? "Other");
  const [isDefault, setIsDefault] = useState(existing?.isDefault ?? false);
  const [active, setActive] = useState(existing?.active ?? true);

  function choose(title: string, options: string[], current: string, onSelect: (value: string) => void) {
    const labels = [...options, "Cancel"];
    showActionSheetWithOptions({ title, options: labels, cancelButtonIndex: labels.length - 1 }, (index) => {
      if (index === undefined || index === labels.length - 1) return;
      onSelect(options[index] ?? current);
    });
  }

  function onSave() {
    const amount = Number(unitPrice.replace(/,/g, ""));
    if (!name.trim()) { Alert.alert("Name required", "Enter an item or service name before saving."); return; }
    if (!Number.isFinite(amount) || amount < 0) { Alert.alert("Valid price required", "Enter a unit price of zero or more."); return; }
    saveItem({ id: existing?.id, kind, name: name.trim(), description: description.trim(), unitPrice: amount, taxRate, category, isDefault, active });
    navigation.goBack();
  }

  return <ScreenContainer>
    <ScreenHeader title={existing ? "Edit Item / Service" : "Add Item / Service"} back />
    <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <SegmentedTabs options={["service", "product"] as const} value={kind} onChange={setKind} />
      <FormField label="Name" icon="pricetag-outline" value={name} onChangeText={setName} placeholder="Enter item or service name" required />
      <FormField label="Description" icon="document-text-outline" value={description} onChangeText={setDescription} placeholder="Describe what you offer..." multiline />
      <FormField label="Unit Price" icon="cash-outline" prefix="$" value={unitPrice} onChangeText={setUnitPrice} placeholder="0.00" keyboardType="decimal-pad" required />
      <SelectField label="Tax" icon="receipt-outline" value={taxRate} onPress={() => choose("Tax rate", ["Default", "8.25%", "5.00%", "No tax"], taxRate, setTaxRate)} />
      <SelectField label="Category" icon="grid-outline" value={category} onPress={() => choose("Category", ["Consulting", "Design", "Development", "Marketing", "Management", "Products", "Other"], category, setCategory)} />
      <View style={styles.switchRow}><View style={styles.switchMain}><Text style={styles.switchTitle}>Set as default for new invoices</Text><Text style={styles.switchMeta}>This item will be suggested when creating invoices.</Text></View><Switch value={isDefault} onValueChange={setIsDefault} trackColor={{ false: colors.gray200, true: "#84d9c8" }} thumbColor={isDefault ? colors.primary : "#fff"} /></View>
      <View style={styles.switchRow}><View style={styles.switchMain}><Text style={styles.switchTitle}>Available for sales</Text><Text style={styles.switchMeta}>Inactive items stay in history but leave new-item choices.</Text></View><Switch value={active} onValueChange={setActive} trackColor={{ false: colors.gray200, true: "#84d9c8" }} thumbColor={active ? colors.primary : "#fff"} /></View>
    </ScrollView>
    <SafeActionFooter><AppButton label={existing ? "Save changes" : "Save item"} onPress={onSave} />{existing ? <AppButton label="Delete item" variant="secondary" onPress={() => Alert.alert("Delete item?", "This also removes it from your web app.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => { deleteItem(existing.id); navigation.goBack(); } }])} /> : null}</SafeActionFooter>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  listHeader: { gap: spacing.md, paddingTop: spacing.md },
  itemRow: { minHeight: 74, flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.divider, paddingVertical: spacing.sm },
  rowMain: { flex: 1, minWidth: 0 },
  rowTitle: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
  rowMeta: { color: colors.gray500, fontSize: uiType.caption, marginTop: 2 },
  price: { color: colors.success, fontSize: uiType.caption, fontWeight: "800", marginTop: 3 },
  stickyAction: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm, backgroundColor: colors.background },
  formContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  switchRow: { minHeight: 70, borderWidth: 1, borderColor: colors.border, borderRadius: radius.medium, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  switchMain: { flex: 1, minWidth: 0 },
  switchTitle: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "700" },
  switchMeta: { color: colors.gray500, fontSize: uiType.caption, lineHeight: 16, marginTop: 3 },
  formButton: { marginTop: spacing.md },
});
