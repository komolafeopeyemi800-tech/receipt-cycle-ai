import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "../lib/api";
import { useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../lib/api";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppCard, EmptyState, SegmentedTabs } from "../components/ui/FinanceUI";
import {
  BudgetDonut,
  BudgetProgress,
  CategoryGlyph,
  MoneySection,
} from "../components/ui/MoneyModuleUI";
import { useMoneyAppearance } from "../contexts/MoneyAppearanceContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useMonthMoneyData } from "../features/money/useMoneyData";
import {
  addMonthsYm,
  formatMonthYearLabel,
  roundMoney,
  todayYm,
} from "../utils/transactionMath";
import { colors, radius, spacing, uiType } from "../theme/tokens";
import type {
  MoreStackParamList,
  RootStackParamList,
} from "../navigation/types";

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<MoreStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function BudgetsScreen() {
  const navigation = useNavigation<Nav>();
  const { formatMoney } = usePreferences();
  const { appearance } = useMoneyAppearance();
  const [month, setMonth] = useState(todayYm);
  const [showPicker, setShowPicker] = useState(false);
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const { workspace, ready, categories, budgets, amountByCategory, loading } =
    useMonthMoneyData(month);
  const ensureCats = useMutation(api.categories.ensureSeed);
  useEffect(() => {
    if (ready) void ensureCats({ workspace });
  }, [ready, workspace, ensureCats]);

  const rows = useMemo(() => {
    const visible = categories.filter((cat) => cat.kind === kind);
    return visible.map((cat) => ({
      ...cat,
      limit:
        budgets.find((budget) => budget.category === cat.name)?.limitAmount ??
        0,
      amount: amountByCategory[kind].get(cat.name) ?? 0,
    }));
  }, [categories, budgets, amountByCategory, kind]);
  const totalBudget = roundMoney(rows.reduce((sum, row) => sum + row.limit, 0));
  const totalUsed = roundMoney(
    rows.reduce((sum, row) => sum + (row.limit > 0 ? row.amount : 0), 0),
  );
  const budgeted = rows.filter((row) => row.limit > 0);
  const unbudgeted = rows.filter((row) => row.limit <= 0);
  const remaining = roundMoney(totalBudget - totalUsed);
  const percent =
    totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0;
  const label = kind === "expense" ? "Spent" : "Received";

  return (
    <View style={styles.root}>
      <ScreenHeader title="Budgets" />
      <ScrollView keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.monthRow}>
          <Pressable
            onPress={() => setMonth((value) => addMonthsYm(value, -1))}
            style={styles.monthArrow}
            accessibilityLabel="Previous month"
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={colors.textPrimary}
            />
          </Pressable>
          <Pressable
            onPress={() => setMonth((value) => addMonthsYm(value, 1))}
            style={styles.monthLabel}
            accessibilityLabel="Next month"
          >
            <Text style={styles.monthText}>{formatMonthYearLabel(month)}</Text>
            <Ionicons name="chevron-forward" size={15} color={colors.primary} />
          </Pressable>
          <Pressable
            onPress={() => setShowPicker(true)}
            style={styles.monthArrow}
            accessibilityLabel="Choose month"
          >
            <Ionicons
              name="calendar-outline"
              size={19}
              color={colors.primary}
            />
          </Pressable>
        </View>
        {showPicker ? (
          <>
            <DateTimePicker
              value={new Date(`${month}-01T12:00:00`)}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, selected) => {
                if (Platform.OS === "android") setShowPicker(false);
                if (selected)
                  setMonth(
                    `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}`,
                  );
              }}
            />
            {Platform.OS === "ios" ? (
              <Pressable onPress={() => setShowPicker(false)}>
                <Text style={styles.pickerDone}>Done</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}

        <View style={styles.overview}>
          <BudgetDonut value={totalUsed} max={totalBudget} size={124}>
            <Text
              style={styles.donutValue}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatMoney(totalBudget)}
            </Text>
            <Text style={styles.donutLabel}>Total Budget</Text>
          </BudgetDonut>
          <View style={styles.overviewNumbers}>
            <View style={styles.overviewStat}>
              <Ionicons name="close-circle" size={17} color={colors.rose600} />
              <View>
                <Text style={styles.statValue}>{formatMoney(totalUsed)}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            </View>
            <View style={styles.overviewStat}>
              <Ionicons
                name="checkmark-circle"
                size={17}
                color={colors.success}
              />
              <View>
                <Text
                  style={[
                    styles.statValue,
                    remaining < 0 && { color: colors.danger },
                  ]}
                >
                  {formatMoney(remaining)}
                </Text>
                <Text style={styles.statLabel}>Remaining</Text>
              </View>
            </View>
            <Text style={styles.percent}>{percent}% used</Text>
          </View>
        </View>

        <SegmentedTabs
          options={["expense", "income"] as const}
          value={kind}
          onChange={setKind}
        />
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon="pie-chart-outline"
            title="No categories yet"
            description="Add a category to plan your money."
          />
        ) : (
          <>
            <MoneySection
              title={`Budgeted categories · ${formatMonthYearLabel(month)}`}
            />
            {budgeted.length === 0 ? (
              <AppCard style={styles.emptyBudgeted}>
                <Ionicons
                  name="wallet-outline"
                  size={20}
                  color={colors.primary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.emptyBudgetedTitle}>
                    No budgets set yet
                  </Text>
                  <Text style={styles.emptyBudgetedText}>
                    Choose a category below to set the first limit for this
                    month.
                  </Text>
                </View>
              </AppCard>
            ) : (
              budgeted.map((row) => {
                const used = Math.round((row.amount / row.limit) * 100);
                const left = roundMoney(row.limit - row.amount);
                return (
                  <Pressable
                    key={row.id}
                    style={styles.budgetedRow}
                    onPress={() =>
                      navigation.navigate("BudgetDetail", {
                        category: row.name,
                        month,
                        kind,
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`${row.name} budget`}
                  >
                    <CategoryGlyph
                      name={row.name}
                      color={row.color}
                      icon={appearance.categoryIcons[row.id]}
                      size={52}
                    />
                    <View style={styles.rowMain}>
                      <View style={styles.rowHeading}>
                        <Text style={styles.rowName} numberOfLines={1}>
                          {row.name}
                        </Text>
                        <Ionicons
                          name="ellipsis-horizontal"
                          size={19}
                          color={colors.gray500}
                        />
                      </View>
                      <View style={styles.budgetFacts}>
                        <Text style={styles.factText}>
                          Limit{" "}
                          <Text style={styles.factValue}>
                            {formatMoney(row.limit)}
                          </Text>
                        </Text>
                        <Text style={styles.factText}>
                          {label}{" "}
                          <Text
                            style={[
                              styles.factValue,
                              row.amount > row.limit && {
                                color: colors.danger,
                              },
                            ]}
                          >
                            {formatMoney(row.amount)}
                          </Text>
                        </Text>
                      </View>
                      <View style={styles.remainingLine}>
                        <Text style={styles.factText}>Remaining</Text>
                        <Text
                          style={[
                            styles.remainingValue,
                            left < 0 && { color: colors.danger },
                          ]}
                        >
                          {formatMoney(left)}
                        </Text>
                      </View>
                      <BudgetProgress
                        value={row.amount}
                        max={row.limit}
                        color={
                          row.amount > row.limit
                            ? colors.danger
                            : colors.primary
                        }
                        height={8}
                      />
                      <Text style={styles.usedLabel}>{used}% used</Text>
                    </View>
                  </Pressable>
                );
              })
            )}
            {unbudgeted.length ? (
              <>
                <MoneySection title="Not budgeted this month" />
                <View style={styles.unbudgetedCard}>
                  {unbudgeted.map((row, index) => (
                    <Pressable
                      key={row.id}
                      style={[
                        styles.unbudgetedRow,
                        index !== unbudgeted.length - 1 && styles.rowDivider,
                      ]}
                      onPress={() =>
                        navigation.navigate("BudgetSet", {
                          category: row.name,
                          month,
                          kind,
                        })
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Set budget for ${row.name}`}
                    >
                      <CategoryGlyph
                        name={row.name}
                        color={row.color}
                        icon={appearance.categoryIcons[row.id]}
                        size={46}
                      />
                      <Text style={styles.unbudgetedName} numberOfLines={1}>
                        {row.name}
                      </Text>
                      <View style={styles.setBudgetButton}>
                        <Text style={styles.setBudgetText}>Set budget</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
          </>
        )}
        <AppCard style={styles.helpCard}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.primary}
          />
          <Text style={styles.helpText}>
            The total compares categories with a budget set for this month.
            Other transactions remain visible in Records.
          </Text>
        </AppCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 100 },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.md,
  },
  monthArrow: {
    width: 34,
    height: 36,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: {
    flex: 1,
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  monthText: {
    fontSize: uiType.body,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  pickerDone: {
    color: colors.primary,
    fontWeight: "700",
    textAlign: "right",
    marginBottom: spacing.sm,
  },
  overview: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  donutValue: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
    maxWidth: 92,
    textAlign: "center",
  },
  donutLabel: { fontSize: 10, color: colors.gray600, marginTop: 2 },
  overviewNumbers: { flex: 1, gap: 9 },
  overviewStat: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  statValue: { fontSize: 15, fontWeight: "800", color: colors.primary },
  statLabel: { fontSize: uiType.caption, color: colors.gray600 },
  percent: {
    textAlign: "center",
    fontSize: uiType.caption,
    fontWeight: "800",
    color: colors.gray700,
  },
  budgetedRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.large,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowMain: { flex: 1, minWidth: 0, gap: 5 },
  rowHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowName: {
    flex: 1,
    fontSize: uiType.body,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  budgetFacts: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  factText: { fontSize: uiType.caption, color: colors.gray600 },
  factValue: { fontWeight: "800", color: colors.textPrimary },
  remainingLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  remainingValue: {
    color: colors.success,
    fontSize: uiType.caption,
    fontWeight: "800",
  },
  usedLabel: {
    color: colors.gray500,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "right",
  },
  emptyBudgeted: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
    backgroundColor: colors.mintSoft,
  },
  emptyBudgetedTitle: {
    fontWeight: "800",
    color: colors.textPrimary,
    fontSize: uiType.secondary,
  },
  emptyBudgetedText: {
    marginTop: 2,
    color: colors.gray600,
    fontSize: uiType.caption,
    lineHeight: 16,
  },
  unbudgetedCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.large,
    paddingHorizontal: spacing.md,
    overflow: "hidden",
  },
  unbudgetedRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  unbudgetedName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: uiType.secondary,
    fontWeight: "700",
  },
  setBudgetButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.small,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  setBudgetText: {
    color: colors.primaryDark,
    fontSize: uiType.caption,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  helpCard: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.blueSoft,
    marginTop: spacing.xl,
  },
  helpText: {
    flex: 1,
    fontSize: uiType.caption,
    color: colors.gray700,
    lineHeight: 16,
  },
});
