import { type ComponentProps } from "react";
import { Alert, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "../lib/api";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useSubscriptionState } from "../hooks/useSubscriptionState";
import { colors, gradients, type as typeScale } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";
import { userFacingErrorFromUnknown } from "../lib/userFacingErrors";

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, token, signOut } = useAuth();
  const sub = useSubscriptionState();
  const {
    reimbursements: reimb,
    setReimbursements: setReimb,
    txnNumber: txnNum,
    setTxnNumber: setTxnNum,
    scanPayment: scanPay,
    setScanPayment: setScanPay,
    requirePay: reqPay,
    setRequirePay: setReqPay,
    requireNotes: reqNotes,
    setRequireNotes: setReqNotes,
  } = usePreferences();
  const backupRows = useQuery(
    api.transactions.exportForBackup,
    user?.id && token && sub?.canExportCsv ? { userId: user.id, token } : "skip",
  );
  const runtime = useQuery(api.admin.publicConfig, {});

  function csvValue(v: unknown): string {
    if (v === null || v === undefined) return "";
    if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";

    // Normalize strings so line breaks / tabs don't break spreadsheet row parsing.
    const raw = String(v)
      .replace(/\r\n/g, " ")
      .replace(/[\r\n\t]/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    const needsQuotes = raw.includes(",") || raw.includes('"') || raw.includes("\n") || raw.includes("\r");
    const escaped = raw.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  }

  function buildCsv(rows: NonNullable<typeof backupRows>) {
    const header = ["date", "type", "category", "amount", "merchant", "description", "payment_method", "workspace"].join(",");
    const body = rows
      .map((t: (typeof rows)[number]) =>
        [
          csvValue(t.date),
          csvValue(t.type),
          csvValue(t.category),
          csvValue(t.amount),
          csvValue(t.merchant),
          csvValue(t.description),
          csvValue(t.payment_method),
          csvValue(t.workspace),
        ].join(","),
      )
      .join("\r\n");

    // BOM helps Excel open UTF-8 CSV cleanly.
    return `\uFEFF${header}\r\n${body}`;
  }

  async function exportCsvDownload() {
    if (runtime?.exportEnabled === false) {
      Alert.alert("Export disabled", "Export is currently disabled by admin.");
      return;
    }
    if (sub && !sub.canExportCsv) {
      Alert.alert(
        "Pro feature",
        "CSV export is included with Pro. Upgrade to download all your transactions.",
        [
          { text: "Not now", style: "cancel" },
          { text: "View plans", onPress: () => navigation.navigate("Pricing") },
        ],
      );
      return;
    }
    if (!user?.id) {
      Alert.alert("Export", "Sign in again to export your records.");
      return;
    }
    if (backupRows === undefined) {
      Alert.alert("Export", "Still loading your transactions. Try again in a moment.");
      return;
    }
    const rows = backupRows;
    if (rows.length === 0) {
      Alert.alert("Export", "No transactions to export yet.");
      return;
    }
    const fileName = `receipt-cycle-transactions-${new Date().toISOString().slice(0, 10)}.csv`;

    try {
      const csv = buildCsv(rows);
      if (Platform.OS === "web") {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
        Alert.alert("Exported", "Spreadsheet downloaded to your laptop.");
        return;
      }

      const dir = new Directory(Paths.document, "ReceiptCycle", "Exports");
      if (!dir.exists) dir.create({ intermediates: true });
      const file = new File(dir, fileName);
      if (!file.exists) file.create({ overwrite: true });
      file.write(csv, { encoding: "utf8" });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "text/csv",
          dialogTitle: "Export transactions spreadsheet",
          UTI: "public.comma-separated-values-text",
        });
      }

      Alert.alert(
        "Downloaded",
        canShare
          ? "CSV exported. If you selected Save/Drive/Email in the share sheet, your file is there now."
          : `CSV saved on this device:\n\n${file.uri}\n\nOpen Files / Documents to find the ReceiptCycle/Exports folder.`,
        [
          { text: "Copy path", onPress: () => void Clipboard.setStringAsync(file.uri) },
          { text: "OK" },
        ],
      );
    } catch (e) {
      Alert.alert("Export failed", userFacingErrorFromUnknown(e));
    }
  }

  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={colors.gray900} />
          </Pressable>
          <Text style={styles.screenTitle}>Profile & Account</Text>
          <View style={{ width: 28 }} />
        </View>

        {user && (
          <Pressable style={styles.profile} onPress={() => navigation.navigate("PersonalProfile")} accessibilityRole="button" accessibilityLabel="Edit personal profile">
            <View style={styles.avatar}>{user.image ? <Image source={{ uri: user.image }} style={styles.avatarImage} /> : <Ionicons name="person" size={25} color="#fff" />}</View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{user.name || "Receipt Cycle user"}</Text>
              <Text style={styles.email}>{user.email}</Text>
              <Text style={styles.ownerLabel}>Business Owner</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
          </Pressable>
        )}

        <Text style={styles.section}>ACCOUNT</Text>
        <View style={styles.card}>
          <RowNav
            icon="business-outline"
            title="Business"
            sub="Business profile and invoice identity"
            onPress={() => navigation.navigate("BusinessProfile")}
          />
          <Divider />
          <RowNav
            icon="shield-checkmark-outline"
            title="Security"
            sub="Password and account controls"
            onPress={() => navigation.navigate("AccountSettings")}
          />
          <Divider />
          <RowNav
            icon="download-outline"
            title="Export Data"
            sub={runtime?.exportEnabled === false ? "Disabled by admin" : sub && !sub.canExportCsv ? "Pro only — upgrade to export CSV" : "Download your transaction spreadsheet"}
            onPress={() => void exportCsvDownload()}
          />
          <Divider />
          <RowNav
            icon="diamond-outline"
            title="Manage Subscription"
            sub={sub?.pro ? "Pro plan active" : sub?.phase === "trial" ? "Free trial active" : "Free plan · View plans and billing"}
            onPress={() => navigation.navigate("Pricing")}
          />
          <Divider />
          <RowNav
            icon="globe-outline"
            title="Language & Region"
            sub="Currency, language and date format"
            onPress={() => navigation.navigate("RegionalPreferences")}
          />
        </View>

        <Text style={styles.section}>APP PREFERENCES</Text>
        <Text style={styles.sectionHint}>
          {runtime?.adminManagedPreferences
            ? "These preference toggles are centrally managed by admin."
            : "Toggles are saved to your account when signed in (and cached on this device)."}
        </Text>
        <View style={styles.card}>
          <RowToggle
            title="Reimbursements"
            sub="Allow expenses to be marked as reimbursable"
            value={reimb}
            disabled={runtime?.adminManagedPreferences}
            onValueChange={(v) => void setReimb(v)}
          />
          <Divider />
          <RowToggle
            title="Transaction number"
            sub="Show transaction number on each expense"
            value={txnNum}
            disabled={runtime?.adminManagedPreferences}
            onValueChange={(v) => void setTxnNum(v)}
          />
          <Divider />
          <RowToggle
            title="Scan payment method"
            sub="Show payment method picker on scanner"
            value={scanPay}
            disabled={runtime?.adminManagedPreferences}
            onValueChange={(v) => void setScanPay(v)}
          />
          <Divider />
          <RowToggle
            title="Require payment method"
            value={reqPay}
            disabled={runtime?.adminManagedPreferences}
            onValueChange={(v) => void setReqPay(v)}
          />
          <Divider />
          <RowToggle
            title="Require expense notes"
            value={reqNotes}
            disabled={runtime?.adminManagedPreferences}
            onValueChange={(v) => void setReqNotes(v)}
          />
        </View>

        <Text style={styles.section}>LOCALIZATION</Text>
        <View style={styles.card}>
          <RowNav
            icon="cash-outline"
            title="Currency & date format"
            sub="Default currency and how dates are shown"
            onPress={() => navigation.navigate("RegionalPreferences")}
          />
          <Divider />
          <RowNav
            icon="storefront-outline"
            title="Merchants & vendors"
            sub="Saved names for quick entry"
            onPress={() => navigation.navigate("MerchantsVendors")}
          />
          <Divider />
          <RowNav
            icon="location-outline"
            title="Saved locations"
            sub="Labels and addresses"
            onPress={() => navigation.navigate("SavedLocations")}
          />
        </View>

        <Text style={styles.section}>CUSTOMIZE</Text>
        <View style={styles.card}>
          <RowNav
            icon="pricetags-outline"
            title="Categories"
            sub="Edit expense categories"
            onPress={() => navigation.navigate("Main", { screen: "More", params: { screen: "Categories" } })}
          />
          <Divider />
          <RowNav
            icon="wallet-outline"
            title="Accounts"
            sub="Cash, card, savings"
            onPress={() => navigation.navigate("Main", { screen: "More", params: { screen: "Accounts" } })}
          />
          <Divider />
          <RowNav
            icon="pie-chart-outline"
            title="Analysis"
            sub="Spending overview"
            onPress={() => navigation.navigate("Main", { screen: "Analysis" })}
          />
        </View>

        <Text style={styles.section}>HELP & LEGAL</Text>
        <View style={styles.card}>
          <RowNav icon="help-buoy-outline" title="Help & Support" sub="FAQs and ways to contact us" onPress={() => void Linking.openURL("https://receiptcycle.com/faq")} />
          <Divider />
          <RowNav icon="lock-closed-outline" title="Privacy Policy" sub="How Receipt Cycle handles your data" onPress={() => void Linking.openURL("https://receiptcycle.com/privacy")} />
          <Divider />
          <RowNav icon="document-text-outline" title="Terms of Service" sub="Terms for the mobile and web apps" onPress={() => void Linking.openURL("https://receiptcycle.com/terms")} />
        </View>

        {user && (
          <Pressable
            style={styles.signOut}
            onPress={() => {
              void signOut();
              navigation.goBack();
            }}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.rose600} />
            <Text style={styles.signOutTxt}>Sign Out</Text>
          </Pressable>
        )}

        <Text style={styles.footer}>Receipt Cycle · Secure cloud workspace</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function RowToggle({
  title,
  sub,
  value,
  disabled,
  onValueChange,
}: {
  title: string;
  sub?: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{ false: colors.gray200, true: colors.teal600 }}
        thumbColor="#fff"
      />
    </View>
  );
}

function RowNav({
  icon,
  title,
  sub,
  onPress,
  compact,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  sub: string;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable style={[styles.row, compact && styles.rowCompact]} onPress={onPress}>
      <Ionicons name={icon} size={compact ? 17 : 20} color={colors.gray600} style={{ marginRight: 8 }} />
      <View style={{ flex: 1 }}>
        <Text style={compact ? styles.rowTitleSm : styles.rowTitle}>{title}</Text>
        <Text style={compact ? styles.rowSubSm : styles.rowSub}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={compact ? 16 : 18} color={colors.gray400} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { paddingHorizontal: 16, paddingTop: 48, paddingBottom: 24 },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  screenTitle: { fontSize: typeScale.headline, fontWeight: "700", color: colors.gray900 },
  profile: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 28 },
  avatarTxt: { color: "#fff", fontWeight: "700", fontSize: typeScale.title },
  profileName: { fontSize: typeScale.bodyStrong, fontWeight: "800", color: colors.gray900 },
  email: { fontSize: typeScale.sm, fontWeight: "500", color: colors.gray500, marginTop: 2 },
  ownerLabel: { fontSize: typeScale.sm, color: colors.primary, fontWeight: "700", marginTop: 2 },
  caption: { fontSize: typeScale.md, color: colors.gray500, marginTop: 2 },
  section: {
    fontSize: typeScale.xs,
    fontWeight: "700",
    color: colors.gray500,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 8,
  },
  sectionHint: {
    fontSize: typeScale.sm,
    color: colors.gray500,
    lineHeight: 18,
    marginBottom: 6,
    marginTop: -4,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 12 },
  rowCompact: { paddingVertical: 9, paddingHorizontal: 10 },
  rowTitle: { fontSize: typeScale.body, fontWeight: "600", color: colors.gray900 },
  rowTitleSm: { fontSize: typeScale.md, fontWeight: "600", color: colors.gray900 },
  rowSub: { fontSize: typeScale.sm, color: colors.gray500, marginTop: 2 },
  rowSubSm: { fontSize: typeScale.xs, color: colors.gray500, marginTop: 1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.gray200, marginLeft: 12 },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    paddingVertical: 12,
  },
  signOutTxt: { fontSize: typeScale.body, fontWeight: "700", color: colors.rose600 },
  footer: { fontSize: typeScale.sm, color: colors.gray400, textAlign: "center", marginTop: 16 },
});
