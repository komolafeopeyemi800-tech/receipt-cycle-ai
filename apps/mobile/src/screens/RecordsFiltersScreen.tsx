import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "../lib/api";
import { api } from "../lib/api";
import { AppButton, IconTile, SearchInput, SegmentedTabs, SelectField } from "../components/ui/FinanceUI";
import { defaultRecordsFilters, useRecordsFilters, type RecordsFilters, type RecordsSort } from "../contexts/RecordsFilterContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { colors, radius, spacing, uiType } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";

const typeOptions = ["all", "expense", "income"] as const;
const sorts: Array<{ value: RecordsSort; label: string }> = [
  { value: "newest", label: "Date (Newest First)" },
  { value: "oldest", label: "Date (Oldest First)" },
  { value: "amount_high", label: "Amount (High to Low)" },
  { value: "amount_low", label: "Amount (Low to High)" },
];

function categoryIcon(name: string): React.ComponentProps<typeof Ionicons>["name"] {
  const key = name.toLowerCase();
  if (key.includes("food") || key.includes("dining")) return "restaurant-outline";
  if (key.includes("shop")) return "bag-outline";
  if (key.includes("transport")) return "car-outline";
  if (key.includes("bill") || key.includes("utilit")) return "receipt-outline";
  if (key.includes("travel")) return "airplane-outline";
  if (key.includes("business")) return "business-outline";
  return "pricetag-outline";
}

export function RecordsFiltersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { filters, setFilters } = useRecordsFilters();
  const [draft, setDraft] = useState<RecordsFilters>(filters);
  const [picker, setPicker] = useState<"start" | "end" | null>(null);
  const [showSort, setShowSort] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  const { workspace, ready } = useWorkspace();
  const categories = useQuery(api.categories.list, ready ? { workspace } : "skip");
  const accounts = useQuery(api.accounts.list, ready ? { workspace } : "skip");
  const visibleCategories = ((categories ?? []) as Array<{ id: string; name: string; kind: "expense" | "income" }>).filter((item) => draft.type === "all" || item.kind === draft.type);
  const accountRows = (accounts ?? []) as Array<{ id: string; name: string }>;
  const accountName = draft.accountId ? accountRows.find((account) => String(account.id) === draft.accountId)?.name ?? "Account" : "All Accounts";
  const update = (patch: Partial<RecordsFilters>) => setDraft((current) => ({ ...current, ...patch }));
  const onDate = (_: unknown, selected?: Date) => {
    if (Platform.OS === "android") setPicker(null);
    if (!selected || !picker) return;
    const iso = `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}-${String(selected.getDate()).padStart(2, "0")}`;
    update(picker === "start" ? { startDate: iso } : { endDate: iso });
  };

  return <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
    <View style={styles.header}>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityLabel="Back"><Ionicons name="arrow-back" size={22} color={colors.textPrimary} /></Pressable>
      <Text style={styles.title}>Records Filters & Search</Text>
      <Pressable onPress={() => setDraft(defaultRecordsFilters)} hitSlop={8}><Text style={styles.clear}>Clear</Text></Pressable>
    </View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <SearchInput value={draft.search} onChangeText={(search) => update({ search })} placeholder="Search transactions, merchants..." />
      <Text style={styles.label}>Type</Text>
      <SegmentedTabs options={typeOptions} value={draft.type} onChange={(type) => update({ type, category: null })} />
      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryGrid}>
        <Pressable style={styles.category} onPress={() => update({ category: null })} accessibilityLabel="All categories">
          <IconTile icon="apps-outline" tone="mint" size={40} /><Text style={[styles.categoryText, draft.category === null && styles.selectedText]}>All</Text>
        </Pressable>
        {visibleCategories.map((item) => <Pressable key={String(item.id)} style={styles.category} onPress={() => update({ category: item.name })} accessibilityLabel={item.name}>
          <View style={[styles.categoryCircle, draft.category === item.name && styles.categorySelected]}><Ionicons name={categoryIcon(item.name)} size={20} color={draft.category === item.name ? "#fff" : colors.primary} /></View>
          <Text style={[styles.categoryText, draft.category === item.name && styles.selectedText]} numberOfLines={1}>{item.name}</Text>
        </Pressable>)}
      </View>
      <Text style={styles.label}>Date Range</Text>
      <View style={styles.dateRow}>
        <Pressable style={styles.dateButton} onPress={() => setPicker("start")}><Ionicons name="calendar-outline" size={18} color={colors.primary} /><Text style={styles.dateText}>{draft.startDate ?? "From date"}</Text></Pressable>
        <Ionicons name="arrow-forward" size={16} color={colors.gray500} />
        <Pressable style={styles.dateButton} onPress={() => setPicker("end")}><Text style={styles.dateText}>{draft.endDate ?? "To date"}</Text></Pressable>
      </View>
      {draft.startDate || draft.endDate ? <Pressable onPress={() => update({ startDate: null, endDate: null })}><Text style={styles.smallAction}>Clear dates</Text></Pressable> : null}
      {picker ? <><DateTimePicker value={new Date(`${picker === "start" ? draft.startDate ?? new Date().toISOString().slice(0, 10) : draft.endDate ?? new Date().toISOString().slice(0, 10)}T12:00:00`)} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={onDate} />{Platform.OS === "ios" ? <Pressable onPress={() => setPicker(null)}><Text style={styles.smallAction}>Done</Text></Pressable> : null}</> : null}
      <SelectField label="Account" icon="wallet-outline" value={accountName} onPress={() => setShowAccounts((value) => !value)} />
      {showAccounts ? <View style={styles.optionBox}><Pressable style={styles.option} onPress={() => { update({ accountId: null }); setShowAccounts(false); }}><Text>All Accounts</Text></Pressable>{accountRows.map((account) => <Pressable key={String(account.id)} style={styles.option} onPress={() => { update({ accountId: String(account.id) }); setShowAccounts(false); }}><Text>{account.name}</Text></Pressable>)}</View> : null}
      <SelectField label="Sort By" icon="swap-vertical-outline" value={sorts.find((sort) => sort.value === draft.sort)?.label ?? "Date (Newest First)"} onPress={() => setShowSort((value) => !value)} />
      {showSort ? <View style={styles.optionBox}>{sorts.map((sort) => <Pressable key={sort.value} style={styles.option} onPress={() => { update({ sort: sort.value }); setShowSort(false); }}><Text>{sort.label}</Text></Pressable>)}</View> : null}
    </ScrollView>
    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}><AppButton label="Show results" onPress={() => { if (draft.startDate && draft.endDate && draft.startDate > draft.endDate) { Alert.alert("Date range", "The start date must be before the end date."); return; } setFilters(draft); navigation.goBack(); }} /></View>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.divider, backgroundColor: colors.surface },
  title: { fontSize: uiType.sectionTitle, fontWeight: "700", color: colors.textPrimary }, clear: { color: colors.primary, fontSize: uiType.secondary, fontWeight: "700" },
  content: { padding: spacing.lg, paddingBottom: 60 }, label: { fontSize: uiType.secondary, fontWeight: "700", color: colors.gray700, marginTop: spacing.xl, marginBottom: spacing.sm },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: spacing.md }, category: { width: "25%", alignItems: "center", minHeight: 65, paddingHorizontal: 2 },
  categoryCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.mintSoft, alignItems: "center", justifyContent: "center" }, categorySelected: { backgroundColor: colors.primary },
  categoryText: { fontSize: uiType.caption, color: colors.gray700, marginTop: 5, textAlign: "center" }, selectedText: { color: colors.primary, fontWeight: "700" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm }, dateButton: { flex: 1, minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: radius.medium, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: spacing.sm }, dateText: { fontSize: uiType.secondary, color: colors.textPrimary }, smallAction: { color: colors.primary, fontSize: uiType.secondary, fontWeight: "700", marginTop: spacing.sm },
  optionBox: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.medium, marginBottom: spacing.md, overflow: "hidden" }, option: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider },
});
