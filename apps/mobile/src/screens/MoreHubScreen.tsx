import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppCard, IconTile, ScreenContainer, SectionHeader } from "../components/ui/FinanceUI";
import type { RootStackParamList } from "../navigation/types";
import { colors, spacing, uiType } from "../theme/tokens";

type NestedDestination = "Budgets" | "Accounts" | "Categories";
type RootDestination = "Settings" | "FinanceCoach" | "Notifications" | "Pricing" | "BusinessProfile" | "InvoiceSettings" | "ScanReceipt" | "UploadStatement" | "AddTransaction";
type Entry = { title: string; description: string; icon: React.ComponentProps<typeof Ionicons>["name"]; tone: "mint" | "blue" | "rose" | "amber" | "purple"; action: () => void };

export function MoreHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const openNested = (destination: NestedDestination) => navigation.navigate("Main", { screen: "More", params: { screen: destination } });
  const openRoot = (destination: RootDestination, params?: object) => (navigation as any).navigate(destination, params);
  const openReports = () => navigation.navigate("Main", { screen: "Sales", params: { screen: "SalesReports" } });
  const openSales = (screen: "SalesInvoices" | "SalesEstimates" | "SalesPayments" | "SalesCustomers" | "SalesItems") => navigation.navigate("Main", { screen: "Sales", params: { screen } });
  const openWeb = async (url: string, fallback: string) => {
    try {
      if (await Linking.canOpenURL(url)) await Linking.openURL(url);
      else Alert.alert(fallback, "This link is unavailable on this device.");
    } catch {
      Alert.alert(fallback, "This link is unavailable right now.");
    }
  };

  const capture: Entry[] = [
    { title: "Scan Receipt", description: "Capture a receipt and extract its details with AI", icon: "scan-outline", tone: "mint", action: () => openRoot("ScanReceipt") },
    { title: "Upload Document", description: "Import a statement, PDF, spreadsheet, or receipt image", icon: "cloud-upload-outline", tone: "blue", action: () => openRoot("UploadStatement") },
    { title: "Add Expense", description: "Record a business expense manually", icon: "arrow-up-circle-outline", tone: "rose", action: () => openRoot("AddTransaction", { initialType: "expense" }) },
    { title: "Add Income", description: "Record business income or a deposit", icon: "arrow-down-circle-outline", tone: "mint", action: () => openRoot("AddTransaction", { initialType: "income" }) },
  ];
  const business: Entry[] = [
    { title: "Invoices", description: "Create and manage customer invoices", icon: "document-text-outline", tone: "blue", action: () => openSales("SalesInvoices") },
    { title: "Estimates", description: "Prepare quotations and track decisions", icon: "calculator-outline", tone: "amber", action: () => openSales("SalesEstimates") },
    { title: "Payments", description: "Record payments and issue receipts", icon: "card-outline", tone: "mint", action: () => openSales("SalesPayments") },
    { title: "Customers", description: "Contacts, history and balances", icon: "people-outline", tone: "blue", action: () => openSales("SalesCustomers") },
    { title: "Items & Services", description: "Reusable products, services and rates", icon: "cube-outline", tone: "amber", action: () => openSales("SalesItems") },
    { title: "Reports", description: "Cash flow, invoices and business insights", icon: "bar-chart-outline", tone: "mint", action: openReports },
    { title: "Business Profile", description: "Manage your business details", icon: "business-outline", tone: "blue", action: () => openRoot("BusinessProfile") },
    { title: "Invoice Settings", description: "Defaults, terms and branding", icon: "document-text-outline", tone: "amber", action: () => openRoot("InvoiceSettings") },
    { title: "Categories", description: "Manage income and expense categories", icon: "pricetags-outline", tone: "mint", action: () => openNested("Categories") },
    { title: "Accounts", description: "Bank accounts, cash and wallets", icon: "wallet-outline", tone: "blue", action: () => openNested("Accounts") },
    { title: "Budgets", description: "Plan limits and compare spending", icon: "pie-chart-outline", tone: "purple", action: () => openNested("Budgets") },
  ];
  const utilities: Entry[] = [
    { title: "Ask AI", description: "Questions grounded in your records", icon: "sparkles-outline", tone: "purple", action: () => openRoot("FinanceCoach") },
    { title: "Notifications & Reminders", description: "Control business alerts", icon: "notifications-outline", tone: "rose", action: () => openRoot("Notifications") },
    { title: "Profile & Account", description: "Security, exports and preferences", icon: "person-circle-outline", tone: "blue", action: () => openRoot("Settings") },
    { title: "Go Premium", description: "Unlimited records, AI and exports", icon: "diamond-outline", tone: "amber", action: () => openRoot("Pricing") },
  ];
  const support: Entry[] = [
    { title: "Help & Support", description: "FAQs and customer support", icon: "help-buoy-outline", tone: "blue", action: () => void openWeb("https://receiptcycle.com/faq", "Help & Support") },
    { title: "Contact Support", description: "Contact the Receipt Cycle team", icon: "chatbox-ellipses-outline", tone: "amber", action: () => void openWeb("https://receiptcycle.com/contact", "Contact Support") },
    { title: "Privacy Policy", description: "How we protect your data", icon: "lock-closed-outline", tone: "blue", action: () => void openWeb("https://receiptcycle.com/privacy", "Privacy Policy") },
    { title: "Terms of Service", description: "App terms and conditions", icon: "document-outline", tone: "purple", action: () => void openWeb("https://receiptcycle.com/terms", "Terms of Service") },
  ];

  return (
    <ScreenContainer>
      <ScreenHeader title="All features" back />
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>Everything you can do in Receipt Cycle, organized so you can reach any tool quickly.</Text>
        <MoreGroup title="Capture & records" entries={capture} />
        <MoreGroup title="Sales & customers" entries={business} />
        <MoreGroup title="AI, account & preferences" entries={utilities} />
        <MoreGroup title="Support & legal" entries={support} />
        <Text style={styles.version}>Receipt Cycle v1.0.0</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

function MoreGroup({ title, entries }: { title: string; entries: Entry[] }) {
  return <View style={styles.group}>
    <SectionHeader title={title} />
    <AppCard style={styles.card}>
      {entries.map((entry, index) => <Pressable key={entry.title} onPress={entry.action} style={[styles.row, index < entries.length - 1 && styles.divider]} accessibilityRole="button" accessibilityLabel={entry.title}>
        <IconTile icon={entry.icon} tone={entry.tone} size={36} />
        <View style={styles.copy}><Text style={styles.title}>{entry.title}</Text><Text style={styles.description}>{entry.description}</Text></View>
        <Ionicons name="chevron-forward" size={18} color={colors.gray500} />
      </Pressable>)}
    </AppCard>
  </View>;
}

const styles = StyleSheet.create({
  page: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  intro: { color: colors.textSecondary, fontSize: uiType.body, lineHeight: 21, marginBottom: spacing.md },
  group: { marginBottom: spacing.xl },
  card: { paddingVertical: 0 },
  row: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  copy: { flex: 1, minWidth: 0 },
  title: { color: colors.textPrimary, fontSize: uiType.body, fontWeight: "700" },
  description: { color: colors.textSecondary, fontSize: uiType.caption, marginTop: 2 },
  version: { color: colors.gray500, fontSize: uiType.caption, textAlign: "center", marginBottom: spacing.xl },
});
