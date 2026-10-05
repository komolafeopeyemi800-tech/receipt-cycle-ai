import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppCard, IconTile, ScreenContainer, SectionHeader } from "../components/ui/FinanceUI";
import type { MoreStackParamList, RootStackParamList } from "../navigation/types";
import { colors, spacing, uiType } from "../theme/tokens";

type NestedDestination = "Budgets" | "Accounts" | "Categories";
type RootDestination = "Settings" | "FinanceCoach" | "Notifications" | "Pricing" | "BusinessProfile" | "InvoiceSettings";
type Entry = { title: string; description: string; icon: React.ComponentProps<typeof Ionicons>["name"]; tone: "mint" | "blue" | "rose" | "amber" | "purple"; action: () => void };

export function MoreHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const root = navigation.getParent()?.getParent() as NativeStackNavigationProp<RootStackParamList> | undefined;
  const openNested = (destination: NestedDestination) => navigation.navigate(destination);
  const openRoot = (destination: RootDestination) => root?.navigate(destination);
  const openReports = () => root?.navigate("Main", { screen: "Sales", params: { screen: "SalesReports" } });
  const openWeb = async (url: string, fallback: string) => {
    try {
      if (await Linking.canOpenURL(url)) await Linking.openURL(url);
      else Alert.alert(fallback, "This link is unavailable on this device.");
    } catch {
      Alert.alert(fallback, "This link is unavailable right now.");
    }
  };

  const business: Entry[] = [
    { title: "Reports", description: "Cash flow, invoices and business insights", icon: "bar-chart-outline", tone: "mint", action: openReports },
    { title: "Business Profile", description: "Manage your business details", icon: "business-outline", tone: "blue", action: () => openRoot("BusinessProfile") },
    { title: "Invoice Settings", description: "Defaults, terms and branding", icon: "document-text-outline", tone: "amber", action: () => openRoot("InvoiceSettings") },
    { title: "Categories", description: "Manage income and expense categories", icon: "pricetags-outline", tone: "mint", action: () => openNested("Categories") },
    { title: "Accounts", description: "Bank accounts, cash and wallets", icon: "wallet-outline", tone: "blue", action: () => openNested("Accounts") },
  ];
  const utilities: Entry[] = [
    { title: "Ask AI", description: "Questions grounded in your records", icon: "sparkles-outline", tone: "purple", action: () => openRoot("FinanceCoach") },
    { title: "Notifications & Reminders", description: "Control business alerts", icon: "notifications-outline", tone: "rose", action: () => openRoot("Notifications") },
    { title: "Profile & Account", description: "Security, exports and preferences", icon: "person-circle-outline", tone: "blue", action: () => openRoot("Settings") },
    { title: "Go Premium", description: "Unlimited records, AI and exports", icon: "diamond-outline", tone: "amber", action: () => openRoot("Pricing") },
  ];
  const support: Entry[] = [
    { title: "Help & Support", description: "FAQs and customer support", icon: "help-buoy-outline", tone: "blue", action: () => void openWeb("https://receiptcycle.app/support", "Help & Support") },
    { title: "Send Feedback", description: "Help us improve Receipt Cycle", icon: "chatbox-ellipses-outline", tone: "amber", action: () => void openWeb("mailto:support@receiptcycle.app?subject=Receipt%20Cycle%20feedback", "Send Feedback") },
    { title: "Privacy Policy", description: "How we protect your data", icon: "lock-closed-outline", tone: "blue", action: () => void openWeb("https://receiptcycle.app/privacy", "Privacy Policy") },
    { title: "Terms of Service", description: "App terms and conditions", icon: "document-outline", tone: "purple", action: () => void openWeb("https://receiptcycle.app/terms", "Terms of Service") },
  ];

  return (
    <ScreenContainer>
      <ScreenHeader title="More" />
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <MoreGroup title="Business" entries={business} />
        <MoreGroup title="Tools & account" entries={utilities} />
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
  group: { marginBottom: spacing.xl },
  card: { paddingVertical: 0 },
  row: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  copy: { flex: 1, minWidth: 0 },
  title: { color: colors.textPrimary, fontSize: uiType.body, fontWeight: "700" },
  description: { color: colors.textSecondary, fontSize: uiType.caption, marginTop: 2 },
  version: { color: colors.gray500, fontSize: uiType.caption, textAlign: "center", marginBottom: spacing.xl },
});
