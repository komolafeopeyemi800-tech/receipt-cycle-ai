import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppButton, EmptyState, IconTile, ScreenContainer, SearchInput, SegmentedTabs, StatusBadge } from "../components/ui/FinanceUI";
import { useEstimateFlow } from "../contexts/EstimateFlowContext";
import { usePreferences } from "../contexts/PreferencesContext";
import type { EstimateStatus } from "../features/estimates/model";
import type { RootStackParamList } from "../navigation/types";
import { colors, radius, spacing, uiType } from "../theme/tokens";

type Filter = "All" | "Draft" | "Sent" | "Accepted" | "Expired";
type ListRow = { estimateNumber: string; customerName: string; estimateDate: string; amount: number; status: EstimateStatus };

export function EstimateListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { estimates, startNewEstimate } = useEstimateFlow();
  const { formatMoney, formatDate } = usePreferences();
  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const rows = useMemo<ListRow[]>(() => estimates
    .map((item) => ({ estimateNumber: item.estimateNumber, customerName: item.customerName, estimateDate: item.estimateDate, amount: item.total, status: item.status }))
    .filter((item) => (filter === "All" || item.status === filter.toLowerCase()) && (!search.trim() || `${item.estimateNumber} ${item.customerName}`.toLowerCase().includes(search.trim().toLowerCase()))), [estimates, filter, search]);

  function createEstimate() {
    startNewEstimate();
    navigation.navigate("EstimateCreate");
  }

  function openEstimate(item: ListRow) {
    navigation.navigate("EstimateDetail", { estimateNumber: item.estimateNumber });
  }

  return <ScreenContainer>
    <ScreenHeader title="Estimates" rightIcon="add-circle" onRightPress={createEstimate} />
    <FlatList
      data={rows}
      keyExtractor={(item) => item.estimateNumber}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={<View style={styles.headerContent}>
        <SegmentedTabs options={["All", "Draft", "Sent", "Accepted", "Expired"] as const} value={filter} onChange={setFilter} />
        <SearchInput value={search} onChangeText={setSearch} placeholder="Search estimates or customers" />
      </View>}
      renderItem={({ item }) => <View style={styles.rowWrap}>
        <Pressable onPress={() => openEstimate(item)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.72 }]} accessibilityRole="button" accessibilityLabel={`${item.estimateNumber}, ${item.customerName}, ${formatMoney(item.amount)}, ${item.status}`}>
          <IconTile icon="document-outline" tone={item.status === "accepted" ? "mint" : item.status === "expired" ? "rose" : "blue"} size={38} />
          <View style={styles.main}><Text style={styles.number}>{item.estimateNumber}</Text><Text style={styles.customer}>{item.customerName}</Text><Text style={styles.date}>{formatDate(item.estimateDate)}</Text></View>
          <View style={styles.right}><Text style={styles.amount}>{formatMoney(item.amount)}</Text><StatusBadge status={item.status} /></View>
          <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
        </Pressable>
        {item.status === "accepted" ? <AppButton label="Convert to Invoice" variant="secondary" onPress={() => openEstimate(item)} style={styles.convertButton} /> : null}
      </View>}
      ListEmptyComponent={<EmptyState icon="document-outline" title={`No ${filter.toLowerCase()} estimates`} description="Create an estimate or choose another status." />}
    />
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxxl },
  headerContent: { gap: spacing.md, marginBottom: spacing.sm },
  rowWrap: { borderBottomWidth: 1, borderBottomColor: colors.divider, paddingBottom: spacing.sm },
  row: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface, paddingVertical: spacing.sm },
  main: { flex: 1, minWidth: 0 },
  number: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
  customer: { color: colors.gray600, fontSize: uiType.caption, marginTop: 3 },
  date: { color: colors.gray500, fontSize: uiType.caption, marginTop: 2 },
  right: { alignItems: "flex-end", gap: 5, maxWidth: 108 },
  amount: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" },
  convertButton: { minHeight: 34, marginLeft: 46 },
});
