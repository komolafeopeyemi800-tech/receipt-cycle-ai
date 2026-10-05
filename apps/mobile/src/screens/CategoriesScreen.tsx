import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery } from "../lib/api";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../lib/api";
import { ScreenHeader } from "../components/ScreenHeader";
import { CategoryGlyph } from "../components/ui/MoneyModuleUI";
import { SegmentedTabs, EmptyState } from "../components/ui/FinanceUI";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useMoneyAppearance } from "../contexts/MoneyAppearanceContext";
import type { CategoryRow, MoneyKind } from "../features/money/model";
import { colors, radius, spacing, uiType } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";

export function CategoriesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { workspace, ready } = useWorkspace();
  const { appearance } = useMoneyAppearance();
  const ensure = useMutation(api.categories.ensureSeed);
  const list = useQuery(api.categories.list, ready ? { workspace } : "skip");
  const [kind, setKind] = useState<MoneyKind>("expense");
  const [showHidden, setShowHidden] = useState(false);
  useEffect(() => { if (ready) void ensure({ workspace }); }, [ready, workspace, ensure]);
  const rows = useMemo(() => ((list ?? []) as CategoryRow[]).filter((row) => row.kind === kind && (showHidden || !appearance.archivedCategoryIds.includes(row.id))), [list, kind, showHidden, appearance.archivedCategoryIds]);
  const hiddenCount = ((list ?? []) as CategoryRow[]).filter((row) => row.kind === kind && appearance.archivedCategoryIds.includes(row.id)).length;

  return <View style={styles.root}>
    <ScreenHeader title="Categories" rightIcon="add" onRightPress={() => navigation.navigate("CategoryEditor", { initialKind: kind })} />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <SegmentedTabs options={["expense", "income"] as const} value={kind} onChange={setKind} />
      {list === undefined ? <ActivityIndicator color={colors.primary} style={{ marginTop: 36 }} /> : rows.length === 0 ? <EmptyState icon="grid-outline" title={showHidden ? "No categories" : "No visible categories"} description="Add a category with the + button." /> : <View style={styles.grid}>{rows.map((category) => { const hidden = appearance.archivedCategoryIds.includes(category.id); return <Pressable key={category.id} style={[styles.tile, hidden && { opacity: 0.5 }]} onPress={() => navigation.navigate("CategoryEditor", { categoryId: category.id })} accessibilityRole="button" accessibilityLabel={`Edit ${category.name} category`}><CategoryGlyph name={category.name} color={category.color} icon={appearance.categoryIcons[category.id]} size={48} /><Text style={styles.tileName} numberOfLines={2}>{category.name}</Text>{hidden ? <Text style={styles.hiddenLabel}>Hidden</Text> : null}</Pressable>; })}</View>}
      {hiddenCount > 0 ? <Pressable style={styles.hiddenButton} onPress={() => setShowHidden((value) => !value)}><Text style={styles.hiddenButtonText}>{showHidden ? "Hide" : "Show"} hidden categories ({hiddenCount})</Text></Pressable> : null}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.lg, paddingBottom: 100 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 9, justifyContent: "flex-start" },
  tile: { width: "31%", minHeight: 94, borderRadius: radius.medium, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center", padding: 6, gap: 5 },
  tileName: { color: colors.textPrimary, fontSize: uiType.caption, textAlign: "center", fontWeight: "600" }, hiddenLabel: { color: colors.gray500, fontSize: 10 },
  hiddenButton: { alignItems: "center", padding: spacing.md, marginTop: spacing.lg }, hiddenButtonText: { color: colors.primary, fontSize: uiType.secondary, fontWeight: "700" },
});
