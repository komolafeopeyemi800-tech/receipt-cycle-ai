import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppCard, IconTile, ScreenContainer } from "../components/ui/FinanceUI";
import { useSalesSetup } from "../contexts/SalesSetupContext";
import type { NotificationPreferences } from "../features/sales/setupData";
import { colors, spacing, uiType } from "../theme/tokens";

const rows: { key: keyof NotificationPreferences; title: string; description: string; icon: React.ComponentProps<typeof Ionicons>["name"]; tone: "mint" | "blue" | "rose" }[] = [
  { key: "invoiceReminders", title: "Invoice Reminders", description: "Get notified before invoices are due", icon: "calendar-outline", tone: "blue" },
  { key: "overdueReminders", title: "Overdue Reminders", description: "Remind you when invoices become overdue", icon: "notifications-outline", tone: "rose" },
  { key: "paymentConfirmations", title: "Payment Confirmations", description: "Get notified when payments are received", icon: "checkmark-circle-outline", tone: "mint" },
  { key: "budgetAlerts", title: "Budget Alerts", description: "Notify you when you are close to budget limits", icon: "bar-chart-outline", tone: "rose" },
  { key: "weeklyReports", title: "Weekly Reports", description: "Get a weekly summary of your business activity", icon: "mail-outline", tone: "blue" },
  { key: "marketingUpdates", title: "Marketing & Product Updates", description: "Tips, features and company news", icon: "megaphone-outline", tone: "rose" },
];

export function NotificationsScreen() {
  const { reminders, saveReminders, ready } = useSalesSetup();
  const preferences = reminders;

  function setValue(key: keyof NotificationPreferences, value: boolean) {
    saveReminders({ ...reminders, [key]: value });
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="Notifications & Reminders" back />
      {!ready ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <AppCard style={styles.card}>
          {rows.map((row, index) => <View key={row.key} style={[styles.row, index < rows.length - 1 && styles.divider]}>
            <IconTile icon={row.icon} tone={row.tone} size={38} />
            <View style={styles.copy}>
              <Text style={styles.title}>{row.title}</Text>
              <Text style={styles.description}>{row.description}</Text>
            </View>
            <Switch value={preferences[row.key]} onValueChange={(value) => setValue(row.key, value)} trackColor={{ false: colors.gray200, true: colors.primary }} thumbColor="#fff" accessibilityLabel={row.title} />
          </View>)}
        </AppCard>
        <Text style={styles.note}>Reminder choices are saved to your account and shared with the web app.</Text>
      </ScrollView>}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xxxl },
  page: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  card: { paddingVertical: 0 },
  row: { minHeight: 74, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  copy: { flex: 1, minWidth: 0 },
  title: { color: colors.textPrimary, fontSize: uiType.body, fontWeight: "700" },
  description: { color: colors.textSecondary, fontSize: uiType.caption, lineHeight: 16, marginTop: 2 },
  note: { color: colors.gray500, fontSize: uiType.caption, lineHeight: 17, textAlign: "center", marginTop: spacing.md, paddingHorizontal: spacing.xl },
});
