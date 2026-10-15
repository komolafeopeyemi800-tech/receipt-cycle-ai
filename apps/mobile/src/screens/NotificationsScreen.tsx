import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppCard, IconTile, ScreenContainer } from "../components/ui/FinanceUI";
import { api, useMutation, useQuery, type PushPreferences } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { requestPushRegistration } from "../lib/pushNotifications";
import { colors, spacing, uiType } from "../theme/tokens";

type PreferenceKey = Exclude<keyof PushPreferences, "userId" | "timezone" | "updatedAt">;
const rows: { key: PreferenceKey; title: string; description: string; icon: React.ComponentProps<typeof Ionicons>["name"]; tone: "mint" | "blue" | "rose" }[] = [
  { key: "dailyReminder", title: "Daily Reminder", description: "A gentle reminder to keep your records current", icon: "today-outline", tone: "mint" },
  { key: "invoiceReminders", title: "Invoice Reminders", description: "Get notified before invoices are due", icon: "calendar-outline", tone: "blue" },
  { key: "overdueReminders", title: "Overdue Reminders", description: "Remind you when invoices become overdue", icon: "notifications-outline", tone: "rose" },
  { key: "paymentConfirmations", title: "Payment Confirmations", description: "Get notified when payments are received", icon: "checkmark-circle-outline", tone: "mint" },
  { key: "budgetAlerts", title: "Budget Alerts", description: "Notify you when you are close to budget limits", icon: "bar-chart-outline", tone: "rose" },
  { key: "weeklyReports", title: "Weekly Reports", description: "Get a weekly summary of your business activity", icon: "mail-outline", tone: "blue" },
  { key: "marketingUpdates", title: "Marketing & Product Updates", description: "Tips, features and company news", icon: "megaphone-outline", tone: "rose" },
];

function phoneZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function NotificationsScreen() {
  const { token } = useAuth();
  const remote = useQuery(api.notifications.preferences, token ? { token } : "skip");
  const save = useMutation(api.notifications.savePreferences);
  const register = useMutation(api.notifications.registerDevice);
  const preferences = remote;

  async function setValue(key: PreferenceKey, value: boolean) {
    if (!token || !preferences) return;
    await save({ token, ...preferences, [key]: value, timezone: phoneZone() });
  }

  async function enableOnDevice() {
    if (!token) return;
    try {
      const result = await requestPushRegistration();
      if (!result.granted) {
        Alert.alert("Notifications are off", "You can enable notifications later from your phone settings.");
        return;
      }
      await register({ token, pushToken: result.token, platform: result.platform, deviceId: result.deviceId, permissionStatus: result.status });
      if (preferences) await save({ token, ...preferences, timezone: phoneZone() }); // so the daily reminder arrives at 7 pm where you are
      Alert.alert("Notifications allowed", "You will receive only the reminders switched on below.");
    } catch (error) {
      Alert.alert("Could not enable notifications", error instanceof Error ? error.message : "Please try again.");
    }
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="Notifications & Reminders" back />
      {!preferences ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <AppCard style={styles.permissionCard}>
          <View style={styles.permissionCopy}><Text style={styles.title}>Receive reminders on this device</Text><Text style={styles.description}>Choose this when you are ready. Receipt Cycle will then ask for your phone's permission.</Text></View>
          <Pressable accessibilityRole="button" onPress={() => void enableOnDevice()} style={styles.enableButton}><Text style={styles.enableText}>Enable</Text></Pressable>
        </AppCard>
        <AppCard style={styles.card}>
          {rows.map((row, index) => <View key={row.key} style={[styles.row, index < rows.length - 1 && styles.divider]}>
            <IconTile icon={row.icon} tone={row.tone} size={38} />
            <View style={styles.copy}>
              <Text style={styles.title}>{row.title}</Text>
              <Text style={styles.description}>{row.description}</Text>
            </View>
            <Switch value={preferences[row.key]} onValueChange={(value) => void setValue(row.key, value)} trackColor={{ false: colors.gray200, true: colors.primary }} thumbColor="#fff" accessibilityLabel={row.title} />
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
  permissionCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.md },
  permissionCopy: { flex: 1 },
  enableButton: { minHeight: 42, justifyContent: "center", paddingHorizontal: spacing.lg, borderRadius: 12, backgroundColor: colors.primary },
  testButton: { minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1, borderColor: colors.primary, marginBottom: spacing.md },
  testText: { color: colors.primary, fontWeight: "800", fontSize: uiType.body },
  enableText: { color: "#fff", fontWeight: "800", fontSize: uiType.body },
  row: { minHeight: 74, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  copy: { flex: 1, minWidth: 0 },
  title: { color: colors.textPrimary, fontSize: uiType.body, fontWeight: "700" },
  description: { color: colors.textSecondary, fontSize: uiType.caption, lineHeight: 16, marginTop: 2 },
  note: { color: colors.gray500, fontSize: uiType.caption, lineHeight: 17, textAlign: "center", marginTop: spacing.md, paddingHorizontal: spacing.xl },
});
