import { useState, type ComponentProps } from "react";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadows, spacing, uiType } from "../theme/tokens";
import { IconTile } from "./ui/FinanceUI";
import { useInvoiceFlow } from "../contexts/InvoiceFlowContext";
import { useEstimateFlow } from "../contexts/EstimateFlowContext";
import { usePaymentFlow } from "../contexts/PaymentFlowContext";

type TabName = "Home" | "Records" | "Sales" | "More";
type IconName = ComponentProps<typeof Ionicons>["name"];

const tabIcons: Record<TabName, IconName> = {
  Home: "home-outline",
  Records: "file-tray-full-outline",
  Sales: "briefcase-outline",
  More: "person-circle-outline",
};
const moreModuleIcons: Record<string, IconName> = { Budgets: "pie-chart-outline", Accounts: "wallet-outline", Categories: "grid-outline" };
const salesModuleIcons: Record<string, IconName> = { SalesInvoices: "document-text-outline", SalesEstimates: "document-outline", SalesPayments: "card-outline", SalesReports: "bar-chart-outline" };

const actions: { title: string; subtitle: string; icon: IconName; tone: "mint" | "blue" | "rose" | "amber"; route?: string; params?: object }[] = [
  { title: "Scan receipt", subtitle: "Capture and extract with AI", icon: "camera-outline", tone: "mint", route: "ScanReceipt" },
  { title: "Upload document", subtitle: "Import a document or statement", icon: "cloud-upload-outline", tone: "blue", route: "UploadStatement" },
  { title: "Add expense", subtitle: "Manually add an expense", icon: "remove-outline", tone: "rose", route: "AddTransaction", params: { initialType: "expense" } },
  { title: "Add income", subtitle: "Record income or a deposit", icon: "add-outline", tone: "mint", route: "AddTransaction", params: { initialType: "income" } },
  { title: "Create invoice", subtitle: "Bill your customer", icon: "document-text-outline", tone: "blue", route: "InvoiceCreate" },
  { title: "Create estimate", subtitle: "Send a quotation", icon: "document-outline", tone: "amber", route: "EstimateCreate" },
  { title: "Record payment", subtitle: "Track a customer payment", icon: "card-outline", tone: "blue", route: "PaymentCreate" },
];

export function ReceiptCycleTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { startNewInvoice } = useInvoiceFlow();
  const { startNewEstimate } = useEstimateFlow();
  const { startNewPayment } = usePaymentFlow();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const bottomPad = Math.max(insets.bottom, Platform.OS === "ios" ? 8 : 6);
  const routeByName = Object.fromEntries(state.routes.map((r) => [r.name, r]));

  const renderTab = (name: TabName) => {
    const route = routeByName[name];
    if (!route) return null;
    const index = state.routes.findIndex((r) => r.key === route.key);
    const isFocused = state.index === index;
    const nested = name === "More" || name === "Sales" ? route.state as { index?: number; routes?: { name: string }[] } | undefined : undefined;
    const moduleName = nested?.routes?.[nested.index ?? 0]?.name;
    const contextualIcons = name === "More" ? moreModuleIcons : name === "Sales" ? salesModuleIcons : {};
    const contextualModule = moduleName && contextualIcons[moduleName] ? moduleName : null;
    const label = name === "More" ? "Me" : contextualModule === "SalesInvoices" ? "Invoices" : contextualModule === "SalesEstimates" ? "Estimates" : contextualModule === "SalesPayments" ? "Payments" : contextualModule === "SalesReports" ? "Reports" : contextualModule ?? descriptors[route.key]?.options.tabBarLabel ?? name;
    const icon = name === "More" ? tabIcons.More : contextualModule ? contextualIcons[contextualModule]! : tabIcons[name];
    const openTab = () => {
      const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
      if (event.defaultPrevented) return;
      // Always return Me to its landing screen. React Navigation otherwise keeps
      // the previous nested More route (for example Budgets or Categories).
      if (name === "More") navigation.navigate("More", { screen: "MoreHome" });
      else navigation.navigate(name);
    };
    return <Pressable key={name} style={styles.tabBtn} onPress={openTab} accessibilityRole="tab" accessibilityState={{ selected: isFocused }} accessibilityLabel={String(label)}>
      <Ionicons name={icon} size={21} color={isFocused ? colors.primary : colors.gray500} />
      <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{String(label)}</Text>
    </Pressable>;
  };

  const runAction = (action: (typeof actions)[number]) => {
    setOpen(false);
    if (!action.route) return;
    const root = navigation.getParent() as unknown as { navigate: (name: string, params?: object) => void } | undefined;
    if (action.route === "InvoiceCreate") startNewInvoice();
    if (action.route === "EstimateCreate") startNewEstimate();
    if (action.route === "PaymentCreate") startNewPayment();
    root?.navigate(action.route, action.params);
  };

  return <>
    <View style={[styles.wrap, { paddingBottom: bottomPad }]}>
      <View style={styles.barRow}>
        {renderTab("Home")}
        {renderTab("Records")}
        <View style={styles.fabGap}><Pressable style={styles.fab} onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel="Create new"><Ionicons name="add" size={28} color="#fff" /></Pressable></View>
        {renderTab("Sales")}
        {renderTab("More")}
      </View>
    </View>
    <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
      <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
        <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.sheetHead}><Text style={styles.sheetTitle}>Create new</Text><Pressable onPress={() => setOpen(false)} accessibilityLabel="Close actions"><Ionicons name="close" size={23} color={colors.gray600} /></Pressable></View>
          {actions.map((action, index) => <Pressable key={action.title} onPress={() => runAction(action)} style={[styles.actionRow, index < actions.length - 1 && styles.divider]} accessibilityRole="button" accessibilityLabel={action.title}>
            <IconTile icon={action.icon} tone={action.tone} size={40} />
            <View style={styles.actionCopy}><Text style={styles.actionTitle}>{action.title}</Text><Text style={styles.actionSubtitle}>{action.subtitle}</Text></View>
            <Ionicons name="chevron-forward" size={18} color={colors.gray500} />
          </Pressable>)}
        </Pressable>
      </Pressable>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 5 },
  barRow: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 5, minHeight: 54 },
  tabBtn: { flex: 1, minWidth: 0, alignItems: "center", justifyContent: "center", gap: 2, minHeight: 49 },
  tabLabel: { color: colors.gray500, fontSize: 10, fontWeight: "600" },
  tabLabelActive: { color: colors.primary, fontWeight: "800" },
  fabGap: { width: 63, alignItems: "center", justifyContent: "flex-end" },
  fab: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: 8, ...shadows.floating },
  backdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.47)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.extraLarge, borderTopRightRadius: radius.extraLarge, paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  handle: { width: 30, height: 4, borderRadius: 2, backgroundColor: colors.gray400, alignSelf: "center", marginBottom: spacing.md },
  sheetHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  sheetTitle: { fontSize: uiType.sectionTitle, fontWeight: "800", color: colors.textPrimary },
  actionRow: { flexDirection: "row", minHeight: 63, alignItems: "center", gap: spacing.md },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  actionCopy: { flex: 1, minWidth: 0 },
  actionTitle: { fontSize: uiType.body, fontWeight: "700", color: colors.textPrimary },
  actionSubtitle: { fontSize: uiType.caption, color: colors.gray500, marginTop: 2 },
});
