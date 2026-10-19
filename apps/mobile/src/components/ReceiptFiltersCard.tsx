import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, type as typeScale } from "../theme/tokens";
import type { DocTx } from "../types/transaction";
import type { ExportTransaction } from "../lib/export/exportModel";
import { NO_FILTER, applyReceiptFilters, filterChoices, filterFilePrefix, isFiltering, type ReceiptFilterState } from "../lib/receiptFilters";

type Props = {
  rows: DocTx[];
  filter: ReceiptFilterState;
  onChange: (next: ReceiptFilterState) => void;
  formatMoney: (n: number) => string;
  loading: boolean;
  /** All exportable rows (so the file has the full receipt data and links). */
  exportRows: ExportTransaction[] | undefined;
  onExport: (rows: ExportTransaction[], format: "xlsx" | "csv" | "items", prefix: string) => void;
  onOpen: (id: string) => void;
};

const TYPES: { id: ReceiptFilterState["type"]; label: string }[] = [
  { id: "all", label: "All" },
  { id: "expense", label: "Expenses" },
  { id: "income", label: "Income" },
];

/** Pick a category or merchant to see only those receipts, then export exactly that list. */
export function ReceiptFiltersCard({ rows, filter, onChange, formatMoney, loading, exportRows, onExport, onOpen }: Props) {
  const filtered = useMemo(() => applyReceiptFilters(rows, filter), [rows, filter]);
  const { categories } = useMemo(() => filterChoices(rows), [rows]);
  const active = isFiltering(filter);
  const spent = filtered.reduce((sum, t) => sum + (t.type === "income" ? 0 : t.amount), 0);
  const nothing = filtered.length === 0;

  function exportAs(format: "xlsx" | "csv" | "items") {
    const ids = new Set(filtered.map((t) => String(t.id)));
    const picked = (exportRows ?? []).filter((r) => ids.has(String(r.id)));
    const suffix = format === "items" ? "-items" : "";
    onExport(picked.length ? picked : [], format, `${filterFilePrefix(filter)}${suffix}`);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.hdr}>Find receipts</Text>
      <Text style={styles.hint}>Pick a category or a merchant to see only those receipts, then export that exact list.</Text>

      <Text style={styles.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
        <Chip label="All" on={!filter.category} onPress={() => onChange({ ...filter, category: "" })} />
        {categories.map((c) => (
          <Chip key={c} label={c} on={filter.category.toLowerCase() === c.toLowerCase()} onPress={() => onChange({ ...filter, category: c })} />
        ))}
      </ScrollView>

      <Text style={styles.label}>Merchant</Text>
      <TextInput
        style={styles.input}
        value={filter.merchant}
        onChangeText={(merchant) => onChange({ ...filter, merchant })}
        placeholder="All merchants (type part of a name)"
        placeholderTextColor={colors.gray400}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />

      <Text style={styles.label}>Type</Text>
      <View style={styles.chipsWrap}>
        {TYPES.map((t) => (
          <Chip key={t.id} label={t.label} on={filter.type === t.id} onPress={() => onChange({ ...filter, type: t.id })} />
        ))}
      </View>

      <View style={styles.countRow}>
        <Text style={styles.count}>
          {loading ? "Loading…" : `${filtered.length} ${filtered.length === 1 ? "receipt" : "receipts"}`}
          {active && !loading ? <Text style={styles.countStrong}>{`  ·  ${formatMoney(spent)} spent`}</Text> : null}
        </Text>
        {active ? (
          <Pressable onPress={() => onChange(NO_FILTER)} hitSlop={8}>
            <Text style={styles.clear}>Clear filters</Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable style={[styles.btn, styles.btnDark, (nothing || loading) && styles.disabled]} disabled={nothing || loading} onPress={() => exportAs("csv")}>
        <Ionicons name="document-text-outline" size={18} color="#fff" />
        <Text style={styles.btnTxt}>Export receipts (CSV)</Text>
      </Pressable>
      <Pressable style={[styles.btn, styles.btnTeal, (nothing || loading) && styles.disabled]} disabled={nothing || loading} onPress={() => exportAs("items")}>
        <Ionicons name="list-outline" size={18} color="#fff" />
        <Text style={styles.btnTxt}>Export items and prices (CSV)</Text>
      </Pressable>
      <Pressable style={[styles.btn, styles.btnLight, (nothing || loading) && styles.disabled]} disabled={nothing || loading} onPress={() => exportAs("xlsx")}>
        <Ionicons name="grid-outline" size={18} color={colors.gray800} />
        <Text style={[styles.btnTxt, { color: colors.gray800 }]}>Excel</Text>
      </Pressable>
      <Text style={styles.foot}>Items and prices lists every line on the filtered receipts and shows how each item's price changed since you last bought it.</Text>

      {active && !loading ? (
        <View style={styles.list}>
          {nothing ? (
            <Text style={styles.empty}>No receipts match these filters.</Text>
          ) : (
            filtered.slice(0, 50).map((t) => (
              <Pressable key={t.id} style={styles.row} onPress={() => onOpen(String(t.id))}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.rowName} numberOfLines={1}>{t.merchant || t.description || "Untitled"}</Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>{t.date} · {t.category}</Text>
                </View>
                <Text style={[styles.rowAmt, t.type === "income" && { color: colors.primary }]}>{formatMoney(t.amount)}</Text>
              </Pressable>
            ))
          )}
          {filtered.length > 50 ? <Text style={styles.more}>Showing the first 50. The export has all {filtered.length}.</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, on && styles.chipOn]} onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }}>
      <Text style={[styles.chipTxt, on && styles.chipTxtOn]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 6, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, marginBottom: 12 },
  hdr: { fontSize: 15, fontWeight: "800", color: colors.textPrimary },
  hint: { fontSize: typeScale.sm, color: colors.gray500, marginTop: 4, marginBottom: 6, lineHeight: 16 },
  label: { fontSize: typeScale.sm, fontWeight: "700", color: colors.gray600, marginTop: 10, marginBottom: 6 },
  chips: { gap: 8, paddingRight: 8 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { minHeight: 36, paddingHorizontal: 14, justifyContent: "center", borderWidth: 1, borderColor: colors.gray200, backgroundColor: colors.gray100, borderRadius: 18 },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTxt: { fontSize: typeScale.sm, fontWeight: "600", color: colors.gray700, maxWidth: 160 },
  chipTxtOn: { color: "#fff" },
  input: { minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 12, fontSize: 16, color: colors.gray900, backgroundColor: "#fff" },
  countRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, marginBottom: 8, gap: 8 },
  count: { flex: 1, fontSize: typeScale.sm, color: colors.gray600 },
  countStrong: { fontWeight: "700", color: colors.gray900 },
  clear: { fontSize: typeScale.sm, fontWeight: "700", color: colors.primary },
  btn: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 6, marginTop: 8, paddingHorizontal: 12 },
  btnDark: { backgroundColor: colors.gray900 },
  btnTeal: { backgroundColor: colors.primary },
  btnLight: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border },
  btnTxt: { color: "#fff", fontWeight: "700", fontSize: typeScale.md },
  disabled: { opacity: 0.45 },
  foot: { fontSize: 11, color: colors.gray500, marginTop: 10, lineHeight: 15 },
  list: { marginTop: 12, borderWidth: 1, borderColor: colors.gray200 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  rowName: { fontSize: typeScale.md, fontWeight: "700", color: colors.gray900 },
  rowMeta: { fontSize: typeScale.xs, color: colors.gray500, marginTop: 2 },
  rowAmt: { fontSize: typeScale.md, fontWeight: "700", color: colors.gray900 },
  empty: { padding: 14, fontSize: typeScale.sm, color: colors.gray500 },
  more: { padding: 10, fontSize: typeScale.xs, color: colors.gray500, textAlign: "center" },
});
