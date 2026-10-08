import { useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "../lib/api";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { buildSummary, filterByMonth } from "../utils/transactionMath";
import type { DocTx } from "../types/transaction";
import { colors, gradients, radius, shadows, spacing, uiType } from "../theme/tokens";

type IconName = ComponentProps<typeof Ionicons>["name"];

export function MobileHomeScreen() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { workspace, ready } = useWorkspace();
  const { user } = useAuth();
  const { formatMoney, formatDate } = usePreferences();
  const all = useQuery(api.transactions.list, ready ? { workspace, userId: user?.id } : "skip");
  const rows = (all ?? []) as DocTx[];
  const summary = useMemo(() => buildSummary(filterByMonth(rows)), [rows]);
  const firstName = user?.name?.trim().split(/\s+/)[0] || "there";
  const root = navigation.getParent();
  const openRoot = (route: string, params?: object) => root?.navigate(route, params);
  const promotionRef = useRef<ScrollView>(null);
  const [promotionIndex, setPromotionIndex] = useState(0);
  const promotionWidth = Math.max(260, width - spacing.lg * 2);
  const primaryTools: { label: string; icon: IconName; tone: string; action: () => void }[] = [
    { label: "AI capture", icon: "mic", tone: colors.purpleSoft, action: () => openRoot("AddTransaction", { initialMode: "ai" }) },
    { label: "Scan receipt", icon: "scan-outline", tone: colors.mintSoft, action: () => openRoot("ScanReceipt") },
    { label: "Add transaction", icon: "add-circle-outline", tone: colors.roseSoft, action: () => openRoot("AddTransaction") },
    { label: "Invoice", icon: "document-text-outline", tone: colors.blueSoft, action: () => openRoot("InvoiceCreate") },
    { label: "Estimate", icon: "calculator-outline", tone: colors.amberSoft, action: () => openRoot("EstimateCreate") },
  ];
  const secondaryTools: { label: string; icon: IconName; tone: string; action: () => void }[] = [
    { label: "Payment", icon: "card-outline", tone: colors.mintSoft, action: () => openRoot("PaymentCreate") },
    { label: "Reports", icon: "bar-chart-outline", tone: colors.purpleSoft, action: () => navigation.navigate("Analysis") },
    { label: "Customers", icon: "people-outline", tone: colors.blueSoft, action: () => navigation.navigate("Sales", { screen: "SalesCustomers" }) },
    { label: "Ask AI", icon: "sparkles-outline", tone: colors.purpleSoft, action: () => openRoot("FinanceCoach") },
    { label: "Budgets", icon: "pie-chart-outline", tone: colors.amberSoft, action: () => navigation.navigate("More", { screen: "Budgets" }) },
    { label: "Accounts", icon: "wallet-outline", tone: colors.mintSoft, action: () => navigation.navigate("More", { screen: "Accounts" }) },
    { label: "Categories", icon: "pricetags-outline", tone: colors.roseSoft, action: () => navigation.navigate("More", { screen: "Categories" }) },
    { label: "More", icon: "grid-outline", tone: colors.gray100, action: () => openRoot("AllFeatures") },
  ];
  const promotions = [
    { title: "Turn receipts into records", body: "Use the AI scanner to extract receipt details, then review before saving.", cta: "Try AI scanner", icon: "scan-outline" as IconName, tone: ["#0f766e", "#149184"] as const, action: () => openRoot("ScanReceipt") },
    { title: "Send a professional estimate", body: "Build a quotation, share it with a customer, and convert accepted work into an invoice.", cta: "Create estimate", icon: "calculator-outline" as IconName, tone: ["#1d4ed8", "#2563eb"] as const, action: () => openRoot("EstimateCreate") },
    { title: "Ask questions about your records", body: "Use Ask AI to explore saved income, expenses, categories, and spending patterns.", cta: "Open Ask AI", icon: "sparkles-outline" as IconName, tone: ["#6d28d9", "#8b5cf6"] as const, action: () => openRoot("FinanceCoach") },
    { title: "Plan before you spend", body: "Set category budgets and compare what you planned with what you actually spent.", cta: "Set a budget", icon: "pie-chart-outline" as IconName, tone: ["#b45309", "#f59e0b"] as const, action: () => navigation.navigate("More", { screen: "Budgets" }) },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setPromotionIndex((current) => {
        const next = (current + 1) % promotions.length;
        promotionRef.current?.scrollTo({ x: next * promotionWidth, animated: true });
        return next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [promotionWidth]);

  return <LinearGradient colors={[...gradients.page]} style={styles.flex}>
    <ScrollView contentContainerStyle={[styles.page, { paddingTop: Math.max(insets.top, spacing.lg) }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.identity}><Pressable style={styles.avatar} onPress={() => openRoot("PersonalProfile")} accessibilityRole="button" accessibilityLabel="Open my profile">{user?.image ? <Image source={{ uri: user.image }} style={styles.avatarImage} /> : <LinearGradient colors={[colors.primary, colors.blue600]} style={styles.avatarFallback}><Ionicons name="person" size={22} color="#fff" /></LinearGradient>}</Pressable><View style={styles.nameCopy}><Text style={styles.greeting} numberOfLines={1}>Hi, {firstName}</Text><Text style={styles.subtitle}>Your business at a glance</Text></View></View>
        <View style={styles.headerActions}><Pressable style={styles.iconButton} onPress={() => openRoot("Notifications")} accessibilityLabel="Notifications"><Ionicons name="notifications-outline" size={21} color={colors.textPrimary} /></Pressable></View>
      </View>
      {!ready || all === undefined ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : <>
        <LinearGradient colors={[colors.primaryDark, colors.primary, colors.teal600]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.balanceCard}>
          <View style={styles.balanceTop}><View style={styles.balanceCopy}><Text style={styles.balanceLabel}>Net this month</Text><Text style={styles.balanceAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.48}>{formatMoney(summary.netBalance)}</Text></View><View style={styles.balanceIcon}><Ionicons name="wallet-outline" size={24} color="#fff" /></View></View>
          <View style={styles.balanceDivider} /><View style={styles.balanceStats}><View style={styles.balanceStat}><Text style={styles.balanceStatLabel}>Income</Text><Text style={styles.balanceStatValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{formatMoney(summary.totalIncome)}</Text></View><View style={styles.balanceStat}><Text style={styles.balanceStatLabel}>Expenses</Text><Text style={styles.balanceStatValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{formatMoney(summary.totalExpenses)}</Text></View></View>
        </LinearGradient>
        <Pressable style={styles.latestStrip} onPress={() => navigation.navigate("Records")}><View style={styles.latestIcon}><Ionicons name={rows[0]?.type === "income" ? "arrow-down" : "receipt-outline"} size={17} color={colors.primary} /></View><View style={styles.latestCopy}><Text style={styles.latestTitle} numberOfLines={1}>{rows[0] ? (rows[0].merchant || rows[0].category) : "No transactions yet"}</Text><Text style={styles.latestMeta}>{rows[0] ? `${formatMoney(Math.abs(rows[0].amount))} · ${formatDate(rows[0].date)}` : "Your latest activity will appear here"}</Text></View><Text style={styles.historyLabel}>History</Text><Ionicons name="chevron-forward" size={17} color={colors.primary} /></Pressable>
        <View style={styles.primaryRow}>{primaryTools.map((tool) => <Pressable key={tool.label} style={styles.primaryTool} onPress={tool.action}><View style={[styles.primaryIcon, { backgroundColor: tool.tone }]}><Ionicons name={tool.icon} size={25} color={colors.primaryDark} /></View><Text style={styles.primaryLabel} numberOfLines={2}>{tool.label}</Text></Pressable>)}</View>
        <View style={styles.promotionWrap}><ScrollView ref={promotionRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(event) => setPromotionIndex(Math.round(event.nativeEvent.contentOffset.x / promotionWidth))}>{promotions.map((promo) => <Pressable key={promo.title} onPress={promo.action} style={{ width: promotionWidth }}><LinearGradient colors={[...promo.tone]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.promotion}><View style={styles.promotionCopy}><Text style={styles.promotionTitle}>{promo.title}</Text><Text style={styles.promotionBody}>{promo.body}</Text><View style={styles.promotionCta}><Text style={styles.promotionCtaText}>{promo.cta}</Text><Ionicons name="arrow-forward" size={15} color={colors.primaryDark} /></View></View><View style={styles.promotionIcon}><Ionicons name={promo.icon} size={35} color="#fff" /></View></LinearGradient></Pressable>)}</ScrollView><View style={styles.dots}>{promotions.map((promo, index) => <View key={promo.title} style={[styles.dot, index === promotionIndex && styles.dotActive]} />)}</View></View>
        <Text style={styles.toolsHeading}>Explore Receipt Cycle</Text>
        <View style={styles.toolCard}>{secondaryTools.map((tool) => <Pressable key={tool.label} style={styles.tool} onPress={tool.action}><View style={[styles.toolIcon, { backgroundColor: tool.tone }]}><Ionicons name={tool.icon} size={23} color={colors.primaryDark} /></View><Text style={styles.toolLabel} numberOfLines={2}>{tool.label}</Text></Pressable>)}</View>
        {rows.length === 0 ? <View style={styles.emptyCard}><View style={styles.emptyIcon}><Ionicons name="receipt-outline" size={28} color={colors.primary} /></View><Text style={styles.emptyTitle}>Start with your first real record</Text><Text style={styles.emptyText}>Scan a receipt, add an expense, or create an invoice. This workspace stays empty until you add your own business data.</Text><Pressable style={styles.emptyButton} onPress={() => openRoot("ScanReceipt")}><Ionicons name="camera-outline" size={18} color="#fff" /><Text style={styles.emptyButtonText}>Scan a receipt</Text></Pressable></View> : <><View style={styles.sectionHead}><Text style={styles.sectionTitle}>Recent activity</Text><Pressable onPress={() => navigation.navigate("Records")}><Text style={styles.sectionLink}>View all</Text></Pressable></View><View style={styles.activityCard}>{rows.slice(0, 4).map((tx, index) => <Pressable key={tx.id} style={[styles.activityRow, index < Math.min(rows.length, 4) - 1 && styles.rowDivider]} onPress={() => openRoot("TransactionDetail", { transactionId: tx.id })}><View style={[styles.activityIcon, { backgroundColor: tx.type === "income" ? colors.mintSoft : colors.amberSoft }]}><Ionicons name={tx.type === "income" ? "arrow-down-outline" : "receipt-outline"} size={19} color={tx.type === "income" ? colors.success : colors.warning} /></View><View style={styles.activityCopy}><Text style={styles.activityTitle} numberOfLines={1}>{tx.merchant || tx.category}</Text><Text style={styles.activityMeta}>{tx.category} · {formatDate(tx.date)}</Text></View><Text style={[styles.activityAmount, { color: tx.type === "income" ? colors.success : colors.textPrimary }]}>{tx.type === "income" ? "+" : "-"}{formatMoney(Math.abs(tx.amount))}</Text></Pressable>)}</View></>}
        <View style={styles.insightRow}><Pressable style={styles.insightCard} onPress={() => navigation.navigate("Analysis")}><Ionicons name="analytics-outline" size={22} color={colors.info} /><Text style={styles.insightTitle}>Spending insights</Text><Text style={styles.insightText}>Review categories and trends</Text></Pressable><Pressable style={styles.insightCard} onPress={() => openRoot("FinanceCoach")}><Ionicons name="sparkles-outline" size={22} color={colors.purple600} /><Text style={styles.insightTitle}>Ask AI</Text><Text style={styles.insightText}>Ask about your own records</Text></Pressable></View>
      </>}
    </ScrollView>
  </LinearGradient>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, page: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xl }, identity: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.md }, nameCopy: { flex: 1, minWidth: 0 },
  avatar: { width: 44, height: 44, borderRadius: 22, overflow: "hidden" }, avatarImage: { width: 44, height: 44, borderRadius: 22 }, avatarFallback: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  greeting: { color: colors.textPrimary, fontSize: uiType.sectionTitle, fontWeight: "800" }, subtitle: { color: colors.textSecondary, fontSize: uiType.secondary, marginTop: 2 }, headerActions: { flexDirection: "row", gap: spacing.sm }, iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }, loader: { marginVertical: 80 },
  balanceCard: { borderRadius: radius.extraLarge, padding: spacing.xl, ...shadows.floating }, balanceTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, balanceCopy: { flex: 1, minWidth: 0, paddingRight: spacing.md }, balanceLabel: { color: "rgba(255,255,255,0.78)", fontSize: uiType.caption, fontWeight: "700" }, balanceAmount: { color: "#fff", fontSize: 28, fontWeight: "800", marginTop: 5, width: "100%" }, balanceIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }, balanceDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.17)", marginVertical: spacing.md }, balanceStats: { flexDirection: "row", alignItems: "center", gap: spacing.md }, balanceStat: { flex: 1, minWidth: 0 }, balanceStatLabel: { color: "rgba(255,255,255,0.72)", fontSize: uiType.caption }, balanceStatValue: { color: "#fff", fontSize: 14, fontWeight: "800", marginTop: 3, width: "100%" },
  latestStrip: { minHeight: 58, marginTop: spacing.md, backgroundColor: colors.surface, borderRadius: radius.large, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm, ...shadows.card }, latestIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.mintSoft, alignItems: "center", justifyContent: "center" }, latestCopy: { flex: 1, minWidth: 0 }, latestTitle: { color: colors.textPrimary, fontSize: uiType.secondary, fontWeight: "800" }, latestMeta: { color: colors.textMuted, fontSize: uiType.caption, marginTop: 2 }, historyLabel: { color: colors.primary, fontSize: uiType.caption, fontWeight: "800" },
  primaryRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.md }, primaryTool: { flexGrow: 1, width: "30%", minWidth: 96, minHeight: 105, backgroundColor: colors.surface, borderRadius: radius.large, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", padding: spacing.sm, ...shadows.card }, primaryIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm }, primaryLabel: { minHeight: 28, color: colors.textPrimary, fontSize: uiType.caption, fontWeight: "700", textAlign: "center" },
  sectionTitle: { color: colors.textPrimary, fontSize: uiType.sectionTitle, fontWeight: "800", marginTop: spacing.xl, marginBottom: spacing.md }, toolsHeading: { color: colors.textPrimary, fontSize: uiType.sectionTitle, fontWeight: "800", marginTop: spacing.lg, marginBottom: spacing.md }, toolCard: { backgroundColor: colors.surface, borderRadius: radius.large, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.md, paddingHorizontal: spacing.xs, flexDirection: "row", flexWrap: "wrap", ...shadows.card }, tool: { width: "25%", alignItems: "center", paddingVertical: spacing.sm, paddingHorizontal: 2 }, toolIcon: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm }, toolLabel: { minHeight: 28, color: colors.textPrimary, fontSize: uiType.caption, fontWeight: "700", textAlign: "center" },
  promotionWrap: { marginTop: spacing.sm, borderRadius: radius.large, overflow: "hidden" }, promotion: { minHeight: 112, borderRadius: radius.large, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, flexDirection: "row", alignItems: "center" }, promotionCopy: { flex: 1, minWidth: 0, paddingRight: spacing.md }, promotionTitle: { color: "#fff", fontSize: uiType.body, fontWeight: "900" }, promotionBody: { color: "rgba(255,255,255,0.84)", fontSize: 11, lineHeight: 14, marginTop: 3 }, promotionCta: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fff", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 5, marginTop: spacing.sm }, promotionCtaText: { color: colors.primaryDark, fontSize: 10, fontWeight: "800" }, promotionIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" }, dots: { position: "absolute", bottom: 6, alignSelf: "center", flexDirection: "row", gap: 4 }, dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.45)" }, dotActive: { width: 14, backgroundColor: "#fff" },
  emptyCard: { marginTop: spacing.xl, backgroundColor: colors.surface, borderRadius: radius.large, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, alignItems: "center", ...shadows.card }, emptyIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.mintSoft, alignItems: "center", justifyContent: "center" }, emptyTitle: { color: colors.textPrimary, fontSize: uiType.sectionTitle, fontWeight: "800", marginTop: spacing.md }, emptyText: { color: colors.textSecondary, fontSize: uiType.body, lineHeight: 20, textAlign: "center", marginTop: spacing.sm }, emptyButton: { marginTop: spacing.lg, minHeight: 46, paddingHorizontal: spacing.xl, borderRadius: radius.medium, backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", gap: spacing.sm }, emptyButtonText: { color: "#fff", fontSize: uiType.body, fontWeight: "800" },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, sectionLink: { color: colors.primary, fontSize: uiType.secondary, fontWeight: "800", marginTop: spacing.xl, marginBottom: spacing.md }, activityCard: { backgroundColor: colors.surface, borderRadius: radius.large, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, ...shadows.card }, activityRow: { minHeight: 66, flexDirection: "row", alignItems: "center", gap: spacing.md }, rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider }, activityIcon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" }, activityCopy: { flex: 1, minWidth: 0 }, activityTitle: { color: colors.textPrimary, fontSize: uiType.body, fontWeight: "700" }, activityMeta: { color: colors.textMuted, fontSize: uiType.caption, marginTop: 3 }, activityAmount: { fontSize: uiType.body, fontWeight: "800" }, insightRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xl }, insightCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.large, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, ...shadows.card }, insightTitle: { color: colors.textPrimary, fontSize: uiType.body, fontWeight: "800", marginTop: spacing.md }, insightText: { color: colors.textSecondary, fontSize: uiType.caption, lineHeight: 16, marginTop: spacing.xs },
});
