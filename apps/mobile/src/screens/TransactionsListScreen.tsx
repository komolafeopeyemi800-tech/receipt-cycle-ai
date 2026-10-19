import { plural } from "../lib/plural";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "../lib/api";
import { api } from "../lib/api";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useCsvExport } from "../hooks/useCsvExport";
import type { ExportTransaction } from "../lib/export/exportModel";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { TransactionGlyph } from "../components/ui/PremiumIcon";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, gradients, type as typeScale } from "../theme/tokens";
import {
  addMonthsYm,
  buildSummary,
  formatMonthYearLabel,
  todayYm,
  ymToDateRange,
} from "../utils/transactionMath";
import type { DocTx } from "../types/transaction";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { ScreenHeader } from "../components/ScreenHeader";
import { FinancialPeriodSummary } from "../components/FinancialPeriodSummary";
import { SectionHeader } from "../components/ui/FinanceUI";
import { useRecordsFilters } from "../contexts/RecordsFilterContext";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Records">,
  NativeStackNavigationProp<RootStackParamList>
>;

type FlatRow = { kind: "day"; day: string } | { kind: "tx"; tx: DocTx };
const noopLongPress = (_id: string) => {};

const DayHeader = memo(function DayHeader({ day, formatDate }: { day: string; formatDate: (d: string) => string }) {
  return <Text style={styles.dayHeader}>{formatDate(day)}</Text>;
});

const TxRow = memo(function TxRow({
  tx,
  selectionMode,
  selected,
  onPress,
  onLongPress,
  formatMoney,
  formatDate,
}: {
  tx: DocTx;
  selectionMode: boolean;
  selected: boolean;
  onPress: (id: string) => void;
  onLongPress: (id: string) => void;
  formatMoney: (n: number) => string;
  formatDate: (d: string) => string;
}) {
  const amountText = `${tx.type === "expense" ? "-" : "+"}${formatMoney(tx.amount)}`;
  return (
    <View style={styles.rowWrap}>
      <Pressable
        style={({ pressed }) => [styles.rowPressTarget, pressed && styles.rowPressed]}
        onPress={() => onPress(tx.id)}
        onLongPress={() => onLongPress(tx.id)}
      >
        <View style={styles.row}>
          {selectionMode ? <Ionicons name={selected ? "checkbox" : "square-outline"} size={22} color={selected ? colors.primary : colors.gray400} /> : null}
          <TransactionGlyph merchant={tx.merchant} category={tx.category} type={tx.type} size={36} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.merchant} numberOfLines={1}>{tx.merchant || tx.category}</Text>
            <Text style={styles.meta} numberOfLines={1}>{tx.category} · {formatDate(tx.date)} · {tx.type}</Text>
          </View>
          {amountText.length > 11 ? (
            <Text style={[styles.amt, tx.type === "expense" ? styles.expense : styles.income]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.58}>{amountText}</Text>
          ) : (
            <Text style={[styles.amt, tx.type === "expense" ? styles.expense : styles.income]} numberOfLines={1}>{amountText}</Text>
          )}
          <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
        </View>
      </Pressable>
    </View>
  );
});

export function TransactionsListScreen() {
  const navigation = useNavigation<Nav>();
  const { workspace, ready } = useWorkspace();
  const { user, token } = useAuth();
  const removeTx = useMutation(api.transactions.remove);
  const { exportRows } = useCsvExport({ loadAll: false });
  const { formatMoney, formatMoneyCompact, formatDate } = usePreferences();
  const { filters, setFilters } = useRecordsFilters();
  const [period, setPeriod] = useState<"month" | "all">("all");
  const [selectedYm, setSelectedYm] = useState(() => todayYm());
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const range =
    period === "month"
      ? (() => {
          const { start, end } = ymToDateRange(selectedYm);
          return { startStr: start, endStr: end };
        })()
      : null;
  const allBase = useQuery(
    api.transactions.list,
    ready
      ? {
          workspace,
          userId: user?.id,
          startDate: range?.startStr,
          endDate: range?.endStr,
        }
      : "skip",
  );
  const all = allBase;
  const filter = filters.type;
  const setFilter = (type: "all" | "expense" | "income") =>
    setFilters({ ...filters, type, category: null });

  const summary = useMemo(() => buildSummary((all ?? []) as DocTx[]), [all]);

  const baseFiltered = useMemo(() => {
    const raw = (all ?? []) as DocTx[];
    return filter === "all" ? raw : raw.filter((t) => t.type === filter);
  }, [all, filter]);

  const list = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const result = baseFiltered.filter((t) => {
      if (
        filters.category &&
        (t.category?.trim() || "Uncategorized") !== filters.category
      )
        return false;
      if (filters.accountId && String(t.accountId) !== filters.accountId)
        return false;
      if (filters.startDate && t.date < filters.startDate) return false;
      if (filters.endDate && t.date > filters.endDate) return false;
      if (
        search &&
        ![t.merchant, t.category, t.description, String(t.amount)].some(
          (value) => value?.toLowerCase().includes(search),
        )
      )
        return false;
      return true;
    });
    return result.sort((a, b) => {
      if (filters.sort === "oldest") return a.date.localeCompare(b.date);
      if (filters.sort === "amount_high") return b.amount - a.amount;
      if (filters.sort === "amount_low") return a.amount - b.amount;
      return b.date.localeCompare(a.date);
    });
  }, [baseFiltered, filters]);

  const groupedByDate = useMemo(() => {
    if (filters.sort === "amount_high" || filters.sort === "amount_low")
      return list.map((tx): [string, DocTx[]] => [tx.date, [tx]]);
    const map = new Map<string, DocTx[]>();
    for (const tx of list) {
      const d = tx.date;
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(tx);
    }
    return Array.from(map.entries()).sort((a, b) =>
      filters.sort === "oldest"
        ? a[0].localeCompare(b[0])
        : b[0].localeCompare(a[0]),
    );
  }, [list, filters.sort]);

  // One flat list (day headings and rows) so only what is on screen is drawn, even with thousands of transactions.
  const flatRows = useMemo(() => {
    const out: ({ kind: "day"; day: string } | { kind: "tx"; tx: DocTx })[] = [];
    for (const [day, txs] of groupedByDate) {
      out.push({ kind: "day", day });
      for (const tx of txs) out.push({ kind: "tx", tx });
    }
    return out;
  }, [groupedByDate]);

  useEffect(() => {
    if (filters.startDate || filters.endDate) setPeriod("all");
  }, [filters.startDate, filters.endDate]);

  const loading = !ready || all === undefined;

  const toggleSelected = (id: string) => setSelectedIds((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const leaveSelection = () => { setSelectionMode(false); setSelectedIds(new Set()); };

  async function exportSelected() {
    const rows = list.filter((row) => selectedIds.has(row.id));
    if (!rows.length) return;
    try {
      setBulkBusy(true);
      await exportRows(rows as ExportTransaction[], "xlsx");
      leaveSelection();
    } catch {
      Alert.alert("Export failed", "The selected transactions could not be exported.");
    } finally { setBulkBusy(false); }
  }

  function deleteSelected() {
    if (!selectedIds.size || !token) return;
    Alert.alert("Delete transactions?", `Delete ${selectedIds.size} selected transaction${selectedIds.size === 1 ? "" : "s"}? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void (async () => {
        try {
          setBulkBusy(true);
          for (const id of selectedIds) await removeTx({ id, userId: user?.id, token });
          leaveSelection();
        } catch { Alert.alert("Delete failed", "Some transactions could not be deleted."); }
        finally { setBulkBusy(false); }
      })() },
    ]);
  }

  const openTx = useCallback(
    (id: string) => navigation.navigate("TransactionDetail", { transactionId: id }),
    [navigation],
  );
  const longPressTx = useCallback((id: string) => {
    setSelectionMode(true);
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);
  const pressTx = useCallback(
    (id: string) => (selectionMode ? toggleSelected(id) : openTx(id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectionMode, openTx],
  );
  const renderRow = useCallback(
    ({ item: row }: { item: FlatRow }) =>
      row.kind === "day" ? (
        <DayHeader day={row.day} formatDate={formatDate} />
      ) : (
        <TxRow
          tx={row.tx}
          selectionMode={selectionMode}
          selected={selectedIds.has(row.tx.id)}
          onPress={pressTx}
          onLongPress={selectionMode ? noopLongPress : longPressTx}
          formatMoney={formatMoney}
          formatDate={formatDate}
        />
      ),
    [selectionMode, selectedIds, pressTx, longPressTx, formatMoney, formatDate],
  );

  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <ScreenHeader title="Transactions" />
      <FlatList keyboardShouldPersistTaps="handled"
        data={flatRows}
        keyExtractor={(row) => (row.kind === "day" ? `d-${row.day}` : row.tx.id)}
        contentContainerStyle={styles.pad}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={6}
        windowSize={5}
        updateCellsBatchingPeriod={30}
        removeClippedSubviews
        ListHeaderComponent={<>
        <FinancialPeriodSummary
          mode={period}
          onModeChange={(m) => {
            setPeriod(m);
            if (m === "month") setSelectedYm(todayYm());
            if (m === "month" && (filters.startDate || filters.endDate))
              setFilters({ ...filters, startDate: null, endDate: null });
          }}
          monthLabel={formatMonthYearLabel(selectedYm)}
          onPrevMonth={() => setSelectedYm((ym) => addMonthsYm(ym, -1))}
          onNextMonth={() => setSelectedYm((ym) => addMonthsYm(ym, 1))}
          selectedYm={selectedYm}
          onSelectYm={(ym) => {
            setSelectedYm(ym);
          }}
          expense={summary.totalExpenses}
          income={summary.totalIncome}
          total={summary.netBalance}
          formatCompact={formatMoneyCompact}
          filter={filter}
          onFilterChange={setFilter}
        />

        <SectionHeader title="All Transactions" actionLabel={selectionMode ? "Done" : undefined} onAction={selectionMode ? leaveSelection : undefined} />
        <View style={styles.recordsTools}>
          <Pressable style={styles.filterTool} onPress={() => navigation.navigate("RecordsFilters")}><Ionicons name="funnel-outline" size={17} color={colors.primary} /><Text style={styles.filterToolText}>Filter & search</Text></Pressable>
        </View>
        <View style={styles.bulkBar}>
          <Pressable style={styles.bulkChip} disabled={!list.length} onPress={() => { setSelectionMode(true); setSelectedIds(selectedIds.size === list.length ? new Set() : new Set(list.map((row) => row.id))); }} accessibilityRole="button">
            <Ionicons name={selectionMode && selectedIds.size === list.length && list.length > 0 ? "checkbox" : "checkbox-outline"} size={18} color={colors.primary} />
            <Text style={styles.bulkChipText}>{selectionMode && selectedIds.size === list.length && list.length > 0 ? "Clear" : "Select all"}</Text>
          </Pressable>
          <Pressable style={styles.bulkChip} disabled={bulkBusy || !list.length} onPress={() => { if (!selectedIds.size) { setSelectionMode(true); Alert.alert("Choose transactions", "Tap the transactions you want to download, then tap Download again."); } else void exportSelected(); }} accessibilityRole="button">
            <Ionicons name="download-outline" size={18} color={selectedIds.size ? colors.primary : colors.gray500} />
            <Text style={[styles.bulkChipText, !selectedIds.size && { color: colors.gray500 }]}>Download</Text>
          </Pressable>
          <Pressable style={styles.bulkChip} disabled={bulkBusy || !list.length} onPress={() => { if (!selectedIds.size) { setSelectionMode(true); Alert.alert("Choose transactions", "Tap the transactions you want to delete, then tap Delete again."); } else deleteSelected(); }} accessibilityRole="button">
            <Ionicons name="trash-outline" size={18} color={selectedIds.size ? colors.rose600 : colors.gray500} />
            <Text style={[styles.bulkChipText, { color: selectedIds.size ? colors.rose600 : colors.gray500 }]}>Delete</Text>
          </Pressable>
        </View>
        {selectionMode ? <Text style={styles.bulkCount}>{selectedIds.size} selected</Text> : null}
        {filters.search ||
        filters.category ||
        filters.startDate ||
        filters.endDate ||
        filters.accountId ||
        filters.sort !== "newest" ? (
          <Pressable
            style={styles.activeFilter}
            onPress={() => navigation.navigate("RecordsFilters")}
          >
            <Ionicons name="funnel-outline" size={15} color={colors.primary} />
            <Text style={styles.activeFilterText}>
              Filters applied · Edit filters
            </Text>
          </Pressable>
        ) : null}

        </>}
        ListEmptyComponent={
loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : baseFiltered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={36} color={colors.gray400} />
            <Text style={styles.emptyTitle}>No transactions</Text>
            <Text style={styles.emptySub}>Tap + to scan or add manually.</Text>
          </View>
        ) : list.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="funnel-outline" size={36} color={colors.gray400} />
            <Text style={styles.emptyTitle}>No matching records</Text>
            <Text style={styles.emptySub}>Change your search or filters.</Text>
          </View>
        ) : null
        }
        ListFooterComponent={<>
        {!loading && list.length > 0 ? (
          <View style={styles.listEnd}>
            <Text style={styles.listEndTxt}>
              {list.length === 1
                ? "1 transaction"
                : plural(list.length, "transaction")}
            </Text>
          </View>
        ) : null}
        <View style={{ height: 100 }} />
        </>}
        renderItem={renderRow}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { padding: 16 },
  recordsTools: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  filterTool: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: colors.mintSoft },
  filterToolText: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  selectAllTool: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 8 },
  selectAllText: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  bulkBar: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  bulkChip: { flex: 1, minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  bulkChipText: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  bulkCount: { marginBottom: 8, color: colors.textPrimary, fontSize: 13, fontWeight: "800" },
  bulkAction: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 5 },
  bulkIconAction: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: colors.gray100 },
  bulkExport: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  bulkDelete: { color: colors.rose600, fontSize: 12, fontWeight: "800" },
  activeFilter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: colors.mintSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 10,
  },
  activeFilterText: {
    color: colors.primary,
    fontSize: typeScale.sm,
    fontWeight: "700",
  },
  sectionLbl: {
    fontSize: typeScale.sm,
    fontWeight: "700",
    color: colors.gray600,
    marginBottom: 8,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  addBtnTxt: { color: "#fff", fontWeight: "700", fontSize: typeScale.body },
  catBlock: { marginBottom: 12 },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.surface,
    maxWidth: "100%",
  },
  chipOn: { borderColor: colors.primary, backgroundColor: colors.emerald50 },
  chipTxt: { fontSize: typeScale.sm, fontWeight: "600", color: colors.gray700 },
  chipTxtOn: { color: colors.primary },
  dayGroup: { marginBottom: 10 },
  dayHeader: {
    fontSize: typeScale.xs,
    fontWeight: "800",
    color: colors.gray500,
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowPressTarget: { borderRadius: 10 },
  rowPressed: { transform: [{ scale: 0.985 }] },
  rowWrap: { marginBottom: 6 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.emerald50,
    alignItems: "center",
    justifyContent: "center",
  },
  merchant: {
    fontSize: typeScale.bodyStrong,
    fontWeight: "600",
    color: colors.gray900,
  },
  meta: { fontSize: typeScale.md, color: colors.gray500, marginTop: 2 },
  amt: {
    width: 136,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: -0.15,
    marginRight: 4,
    textAlign: "right",
  },
  listEnd: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray200,
  },
  listEndTxt: {
    fontSize: typeScale.xs,
    color: colors.gray500,
    fontWeight: "600",
  },
  expense: { color: colors.rose600 },
  income: { color: colors.primary },
  empty: { alignItems: "center", padding: 28 },
  emptyTitle: {
    fontSize: typeScale.title,
    fontWeight: "700",
    color: colors.gray900,
    marginTop: 10,
  },
  emptySub: {
    fontSize: typeScale.body,
    color: colors.gray600,
    textAlign: "center",
    marginTop: 6,
  },
});
