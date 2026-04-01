import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { data as ISO_CURRENCY_DATA } from "currency-codes";
import { DATE_FORMAT_OPTIONS } from "../lib/preferences";
import { usePreferences } from "../contexts/PreferencesContext";
import { colors, gradients, type as typeScale } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";

type Row = { code: string; label: string; search: string };

export function RegionalPreferencesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { currency, setCurrency, dateFormat, setDateFormat, formatMoney } = usePreferences();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");

  const allRows = useMemo(() => {
    return ISO_CURRENCY_DATA.map((c) => ({
      code: c.code,
      label: `${c.code} — ${c.currency}`,
      search: `${c.code} ${c.currency} ${(c.countries ?? []).join(" ")}`.toLowerCase(),
    })).sort((a, b) => a.code.localeCompare(b.code));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter((r) => r.search.includes(q));
  }, [allRows, query]);

  const currentLabel = useMemo(() => allRows.find((r) => r.code === currency)?.label ?? currency, [allRows, currency]);

  const onPickCurrency = useCallback(
    async (code: string) => {
      await setCurrency(code);
      setPickerOpen(false);
      setQuery("");
    },
    [setCurrency],
  );

  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <View style={[styles.top, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={colors.gray900} />
        </Pressable>
        <Text style={styles.screenTitle}>Localization</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>MAIN CURRENCY</Text>
        <Text style={styles.hint}>
          Used for amounts in Records, Analysis, Scan review, and exports. When signed in, currency and date format sync to
          your account. Example: {formatMoney(1234.56)}
        </Text>
        <Pressable style={styles.currencyCard} onPress={() => setPickerOpen(true)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.currencyCardLbl}>Selected currency</Text>
            <Text style={styles.currencyCardVal}>{currentLabel}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
        </Pressable>
        <Text style={styles.miniHint}>Tap to open the full ISO 4217 list ({allRows.length} currencies). Search by code or name.</Text>

        <Text style={[styles.section, { marginTop: 20 }]}>DATE FORMAT</Text>
        <Text style={styles.hint}>How dates appear in lists and details (stored values stay YYYY-MM-DD).</Text>
        <View style={styles.card}>
          {DATE_FORMAT_OPTIONS.map((d) => (
            <Pressable
              key={d.id}
              style={[styles.row, dateFormat === d.id && styles.rowOn]}
              onPress={() => void setDateFormat(d.id)}
            >
              <Text style={styles.rowTxt}>{d.label}</Text>
              {dateFormat === d.id ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
            </Pressable>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={[styles.modalRoot, { paddingTop: insets.top + 8 }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setPickerOpen(false)} hitSlop={12}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>All currencies</Text>
            <View style={{ width: 56 }} />
          </View>
          <TextInput
            style={styles.search}
            placeholder="Search code, name, country…"
            placeholderTextColor={colors.gray400}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={24}
            windowSize={10}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.pickerRow, item.code === currency && styles.pickerRowOn]}
                onPress={() => void onPickCurrency(item.code)}
              >
                <Text style={styles.pickerRowTxt}>{item.label}</Text>
                {item.code === currency ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
              </Pressable>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No matches.</Text>}
          />
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  screenTitle: { fontSize: typeScale.headline, fontWeight: "700", color: colors.gray900 },
  pad: { paddingHorizontal: 16, paddingBottom: 24 },
  section: { fontSize: typeScale.xs, fontWeight: "700", color: colors.gray500, letterSpacing: 0.6, marginBottom: 6 },
  hint: { fontSize: typeScale.sm, color: colors.gray600, marginBottom: 10, lineHeight: 20 },
  miniHint: { fontSize: typeScale.xs, color: colors.gray500, marginTop: 8, lineHeight: 18 },
  currencyCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 10,
  },
  currencyCardLbl: { fontSize: typeScale.xs, fontWeight: "700", color: colors.gray500, marginBottom: 4 },
  currencyCardVal: { fontSize: typeScale.bodyStrong, fontWeight: "700", color: colors.gray900 },
  card: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  rowOn: { backgroundColor: "#ecfdf5" },
  rowTxt: { fontSize: typeScale.body, color: colors.gray900, flex: 1 },
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
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray100,
  },
  pickerRowOn: { backgroundColor: "#ecfdf5" },
  pickerRowTxt: { fontSize: typeScale.body, color: colors.gray900, flex: 1, paddingRight: 8 },
  empty: { textAlign: "center", color: colors.gray500, marginTop: 24 },
});
