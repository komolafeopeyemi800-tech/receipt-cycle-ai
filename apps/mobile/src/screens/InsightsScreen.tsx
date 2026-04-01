import { useCallback, useMemo, useState } from "react";
import { useAction, useQuery } from "convex/react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../../convex/_generated/api";
import { colors, gradients, type as typeScale } from "../theme/tokens";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";
import type { DocTx } from "../types/transaction";
import {
  addMonthsYm,
  formatMonthYearLabel,
  roundMoney,
  todayYm,
  ymToDateRange,
} from "../utils/transactionMath";
import { ExpensePieChart } from "../components/ExpensePieChart";
import { ScreenHeader } from "../components/ScreenHeader";
import { FinancialPeriodSummary } from "../components/FinancialPeriodSummary";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Analysis">,
  NativeStackNavigationProp<RootStackParamList>
>;

const CAT_PALETTE = ["#0f766e", "#2563eb", "#7c3aed", "#ea580c", "#db2777", "#0ea5e9", "#64748b", "#059669"];

export function InsightsScreen() {
  const navigation = useNavigation<Nav>();
  const { workspace, ready } = useWorkspace();
  const { user } = useAuth();
  const { formatMoney, formatMoneyCompact } = usePreferences();
  const [period, setPeriod] = useState<"month" | "all">("all");
  const [selectedYm, setSelectedYm] = useState(() => todayYm());
  const range =
    period === "month"
      ? (() => {
          const { start, end } = ymToDateRange(selectedYm);
          return { startStr: start, endStr: end };
        })()
      : null;

  const all = useQuery(
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

  const leakScan = useAction(api.moneyLeak.analyzeMoneyLeaks);

  const [sliceModal, setSliceModal] = useState<{ label: string; value: number; pct: number } | null>(null);
  const [leakBusy, setLeakBusy] = useState(false);
  const [leakResult, setLeakResult] = useState<{
    summary: string;
    findings: { title: string; detail: string; severity: string }[];
    tips: string[];
    error?: string;
  } | null>(null);

  const { expense, income, byCategory, totalExp, pieSlices } = useMemo(() => {
    const raw = (all ?? []) as DocTx[];
    let exp = 0;
    let inc = 0;
    const map = new Map<string, number>();
    for (const t of raw) {
      if (t.type === "expense") {
        exp += t.amount;
        map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
      } else if (t.type === "income") inc += t.amount;
    }
    const pairs = [...map.entries()].sort((a, b) => b[1] - a[1]);
    const pieSlices = pairs.slice(0, 8).map(([label, value]) => ({ label, value }));
    return {
      expense: roundMoney(exp),
      income: roundMoney(inc),
      byCategory: pairs,
      totalExp: roundMoney(exp),
      pieSlices,
    };
  }, [all]);

  const loading = !ready || all === undefined;

  const periodLabel = period === "month" ? formatMonthYearLabel(selectedYm) : "All time (loaded data)";

  const runLeakScan = useCallback(async () => {
    const raw = (all ?? []) as DocTx[];
    if (raw.length === 0) {
      setLeakResult({ summary: "", findings: [], tips: [], error: "Add transactions first." });
      return;
    }
    setLeakBusy(true);
    setLeakResult(null);
    try {
      const rows = raw.slice(0, 400).map((t) => ({
        date: t.date,
        amount: t.amount,
        type: t.type,
        category: t.category,
        merchant: t.merchant ?? undefined,
        description: t.description ?? undefined,
      }));
      const out = await leakScan({ periodLabel, rows });
      if (!out.ok) {
        setLeakResult({
          summary: "",
          findings: [],
          tips: [],
          error: out.error ?? "Analysis failed.",
        });
        return;
      }
      setLeakResult({
        summary: out.summary,
        findings: out.findings ?? [],
        tips: out.tips ?? [],
      });
    } catch (e) {
      setLeakResult({
        summary: "",
        findings: [],
        tips: [],
        error: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setLeakBusy(false);
    }
  }, [all, leakScan, periodLabel]);

  const net = roundMoney(income - expense);

  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <ScreenHeader title="Analysis" />
      <View style={{ paddingHorizontal: 14, paddingTop: 4 }}>
        <FinancialPeriodSummary
          mode={period}
          onModeChange={(m) => {
            setPeriod(m);
            if (m === "month") setSelectedYm(todayYm());
          }}
          monthLabel={formatMonthYearLabel(selectedYm)}
          onPrevMonth={() => setSelectedYm((ym) => addMonthsYm(ym, -1))}
          onNextMonth={() => setSelectedYm((ym) => addMonthsYm(ym, 1))}
          expense={expense}
          income={income}
          total={net}
          formatCompact={formatMoneyCompact}
        />
      </View>
      <ScrollView contentContainerStyle={styles.pad}>
        <View style={styles.card}>
          <Text style={styles.cardHdr}>Expense distribution</Text>
          <Text style={styles.subHint}>Tap the chart or a legend row for details.</Text>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
          ) : pieSlices.length === 0 ? (
            <Text style={styles.empty}>No expense data in this period yet.</Text>
          ) : (
            <ExpensePieChart
              data={pieSlices}
              total={totalExp}
              onSlicePress={(label, value, pct) => setSliceModal({ label, value, pct })}
              formatMoney={formatMoney}
            />
          )}
        </View>

        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.cardHdr}>Money leak detection</Text>
          <Text style={styles.subHint}>
            AI checks: micro-fees, duplicate subscriptions, high fees, double charges, unusual spikes — for this period.
          </Text>
          <Pressable style={[styles.leakBtn, leakBusy && { opacity: 0.75 }]} onPress={() => void runLeakScan()} disabled={leakBusy || loading}>
            {leakBusy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="sparkles" size={16} color="#fff" />
                <Text style={styles.leakBtnTxt}>Run AI analysis</Text>
              </>
            )}
          </Pressable>
          {leakResult?.error ? (
            <Text style={styles.leakErr}>{leakResult.error}</Text>
          ) : leakResult ? (
            <View style={styles.leakOut}>
              <Text style={styles.leakSummary}>{leakResult.summary}</Text>
              {leakResult.findings.map((f, i) => (
                <View
                  key={i}
                  style={[
                    styles.findingCard,
                    f.severity === "high" ? styles.findingHigh : f.severity === "medium" ? styles.findingMed : styles.findingLow,
                  ]}
                >
                  <Text style={styles.findingTitle}>{f.title}</Text>
                  <Text style={styles.findingDetail}>{f.detail}</Text>
                  <Text style={styles.sevTag}>{f.severity}</Text>
                </View>
              ))}
              {leakResult.tips.length > 0 ? (
                <>
                  <Text style={styles.tipsHdr}>Tips</Text>
                  {leakResult.tips.map((t, i) => (
                    <Text key={i} style={styles.tipLine}>
                      • {t}
                    </Text>
                  ))}
                </>
              ) : null}
            </View>
          ) : null}
        </View>

        <Text style={[styles.sectionStandalone, { marginTop: 16 }]}>By category</Text>
        <Text style={styles.subHint}>Tap a row to open transactions for that category.</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
        ) : byCategory.length === 0 ? (
          <Text style={styles.empty}>No expense data in this period yet.</Text>
        ) : (
          byCategory.map(([cat, amt], idx) => {
            const pct = totalExp > 0 ? (amt / totalExp) * 100 : 0;
            const border = CAT_PALETTE[idx % CAT_PALETTE.length];
            return (
              <Pressable
                key={cat}
                style={[styles.catCard, { borderLeftColor: border }]}
                onPress={() => navigation.navigate("CategoryBreakdown", { category: cat })}
              >
                <View style={styles.catCardTop}>
                  <View style={[styles.catIcon, { backgroundColor: border + "22" }]}>
                    <Ionicons name="pricetag" size={16} color={border} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.catCardName} numberOfLines={1}>
                      {cat}
                    </Text>
                  </View>
                  <View style={styles.catMetric}>
                    <Text style={styles.catCardAmt} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                      {formatMoney(amt)}
                    </Text>
                    <Text style={styles.catCardPct}>{pct.toFixed(1)}%</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
                </View>
                <View style={styles.trackOuter}>
                  <View style={[styles.trackFill, { width: `${Math.min(100, pct)}%`, backgroundColor: border }]} />
                </View>
              </Pressable>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={sliceModal != null} transparent animationType="fade" onRequestClose={() => setSliceModal(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSliceModal(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            {sliceModal ? (
              <>
                <Text style={styles.modalTitle}>{sliceModal.label}</Text>
                <Text style={styles.modalLine}>
                  <Text style={styles.modalLbl}>Share of expenses: </Text>
                  {sliceModal.pct.toFixed(1)}%
                </Text>
                <Text style={styles.modalLine}>
                  <Text style={styles.modalLbl}>Amount: </Text>
                  {formatMoney(sliceModal.value)}
                </Text>
                <Pressable
                  style={styles.modalPrimary}
                  onPress={() => {
                    const c = sliceModal.label;
                    setSliceModal(null);
                    navigation.navigate("CategoryBreakdown", { category: c });
                  }}
                >
                  <Text style={styles.modalPrimaryTxt}>View transactions</Text>
                </Pressable>
                <Pressable style={styles.modalGhost} onPress={() => setSliceModal(null)}>
                  <Text style={styles.modalGhostTxt}>Close</Text>
                </Pressable>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { paddingHorizontal: 16, paddingTop: 8 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.surface,
    padding: 12,
  },
  cardHdr: {
    fontSize: typeScale.sm,
    fontWeight: "700",
    color: colors.gray700,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionStandalone: {
    fontSize: typeScale.sm,
    fontWeight: "800",
    color: colors.gray600,
    letterSpacing: 0.4,
  },
  subHint: { fontSize: typeScale.sm, color: colors.gray500, marginBottom: 8, lineHeight: 16 },
  empty: { fontSize: typeScale.md, color: colors.gray500, textAlign: "center", padding: 16 },
  leakBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  leakBtnTxt: { color: "#fff", fontWeight: "700", fontSize: typeScale.md },
  leakErr: { color: colors.rose600, fontSize: typeScale.sm, marginTop: 8 },
  leakOut: { marginTop: 8, gap: 10 },
  leakSummary: { fontSize: typeScale.md, color: colors.gray800, lineHeight: 20, marginBottom: 4 },
  findingCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: "#fafafa",
  },
  findingHigh: { borderLeftWidth: 4, borderLeftColor: "#dc2626" },
  findingMed: { borderLeftWidth: 4, borderLeftColor: "#ea580c" },
  findingLow: { borderLeftWidth: 4, borderLeftColor: "#64748b" },
  findingTitle: { fontSize: typeScale.md, fontWeight: "700", color: colors.gray900 },
  findingDetail: { fontSize: typeScale.sm, color: colors.gray700, marginTop: 6, lineHeight: 18 },
  sevTag: { fontSize: typeScale.xs, fontWeight: "700", color: colors.gray500, marginTop: 6, textTransform: "uppercase" },
  tipsHdr: { fontSize: typeScale.sm, fontWeight: "700", color: colors.gray700, marginTop: 8 },
  tipLine: { fontSize: typeScale.sm, color: colors.gray800, marginTop: 4, lineHeight: 18 },
  catCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderLeftWidth: 5,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  catCardTop: { flexDirection: "row", alignItems: "center", gap: 10, paddingRight: 4 },
  catIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  catCardName: { fontSize: typeScale.sm, fontWeight: "600", color: colors.gray900 },
  catMetric: { alignItems: "flex-end", width: 96 },
  catCardPct: { fontSize: typeScale.xs, color: colors.gray500, marginTop: 2, textAlign: "right" },
  catCardAmt: {
    fontSize: typeScale.sm,
    fontWeight: "700",
    color: colors.rose600,
    marginRight: 2,
    width: "100%",
    textAlign: "right",
  },
  trackOuter: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gray100,
    marginTop: 10,
    overflow: "hidden",
  },
  trackFill: { height: "100%", borderRadius: 3 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: typeScale.headline, fontWeight: "800", color: colors.gray900, marginBottom: 12 },
  modalLine: { fontSize: typeScale.body, color: colors.gray800, marginBottom: 8 },
  modalLbl: { fontWeight: "700", color: colors.gray600 },
  modalPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  modalPrimaryTxt: { color: "#fff", fontWeight: "700", fontSize: typeScale.body },
  modalGhost: { paddingVertical: 12, alignItems: "center" },
  modalGhostTxt: { color: colors.gray600, fontWeight: "600" },
});
