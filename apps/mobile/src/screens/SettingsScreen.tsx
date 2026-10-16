import { type ComponentProps } from "react";
import { Alert, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
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

  const runtime = useQuery(api.admin.publicConfig, {});

  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
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
            title="Backup & Export Data"
            sub="Backup status and spreadsheet download"
            onPress={() => navigation.navigate("BackupExport")}
          />
          <Divider />
          <RowNav
            icon="diamond-outline"
            title="Plan & Access"
            sub={sub?.pro ? "Pro access active" : sub?.phase === "trial" ? "Trial active" : "Free access"}
            onPress={() => navigation.navigate("Pricing")}
          />
          <Divider />
          <RowNav
            icon="globe-outline"
            title="Language & Region"
            sub="Currency, language and date format"
            onPress={() => navigation.navigate("RegionalPreferences")}
          />
          <Divider />
          <RowNav
            icon="document-text-outline"
            title="Invoice & Estimate Settings"
            sub="Numbering, tax, terms, style, colour and signature"
            onPress={() => navigation.navigate("InvoiceSettings")}
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
  showChevron = true,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  sub: string;
  onPress?: () => void;
  compact?: boolean;
  showChevron?: boolean;
}) {
  return (
    <Pressable style={[styles.row, compact && styles.rowCompact]} onPress={onPress}>
      <Ionicons name={icon} size={compact ? 17 : 20} color={colors.gray600} style={{ marginRight: 8 }} />
      <View style={{ flex: 1 }}>
        <Text style={compact ? styles.rowTitleSm : styles.rowTitle}>{title}</Text>
        <Text style={compact ? styles.rowSubSm : styles.rowSub}>{sub}</Text>
      </View>
      {showChevron ? <Ionicons name="chevron-forward" size={compact ? 16 : 18} color={colors.gray400} /> : null}
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
