import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { getStoredRefreshToken } from "../lib/driveBackupStorage";
import type { SavedGoogleSheet } from "../lib/export/googleSheets";
import { ScreenHeader } from "../components/ScreenHeader";
import { ScreenContainer } from "../components/ui/FinanceUI";
import { api, useQuery } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useCsvExport } from "../hooks/useCsvExport";
import { colors, spacing, uiType } from "../theme/tokens";

function when(d: Date) {
  return `${d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} • ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

export function BackupExportScreen() {
  const { token } = useAuth();
  // Any answer from the server means the account is reachable and everything saved is stored there.
  const reachable = useQuery(api.notifications.preferences, token ? { token } : "skip");
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  useEffect(() => { if (reachable && !checkedAt) setCheckedAt(new Date()); }, [reachable, checkedAt]);
  const { exportXlsxDownload, exportCsvDownload, saveAllToGoogleSheets, canExport, exportDisabledByAdmin } = useCsvExport();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [saving, setSaving] = useState(false);
  const [sheet, setSheet] = useState<SavedGoogleSheet | null>(null);
  /** Set when we sent the person to link Google Drive, so the save continues when they come back. */
  const resumeAfterLink = useRef(false);

  const online = Boolean(checkedAt);
  function onExport() {
    if (exportDisabledByAdmin) return Alert.alert("Export disabled", "Export is currently turned off.");
    if (!canExport) return Alert.alert("Pro feature", "Exporting your data is part of Pro access.");
    void exportXlsxDownload();
  }
  function onExportCsv() {
    if (exportDisabledByAdmin) return Alert.alert("Export disabled", "Export is currently turned off.");
    if (!canExport) return Alert.alert("Pro feature", "Exporting your data is part of Pro access.");
    void exportCsvDownload();
  }

  const saveToSheets = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setSheet(null);
    try {
      const result = await saveAllToGoogleSheets();
      if (result.status === "saved") setSheet(result.sheet);
      else if (result.status === "not_linked") {
        Alert.alert(
          "Link Google Drive first",
          "To save your report as a Google Sheet, connect your Google account once. Then your report is created in your own Google Drive. Nothing needs to be downloaded.",
          [
            { text: "Not now", style: "cancel" },
            { text: "Link Google", onPress: () => { resumeAfterLink.current = true; navigation.navigate("GoogleDriveBackup"); } },
          ],
        );
      }
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving, saveAllToGoogleSheets, navigation]);

  // Back from the Google link screen: continue the save if Drive is now linked.
  useFocusEffect(
    useCallback(() => {
      if (!resumeAfterLink.current) return;
      resumeAfterLink.current = false;
      void getStoredRefreshToken().then((t) => { if (t) void saveToSheets(); });
    }, [saveToSheets]),
  );

  function onSaveToSheets() {
    if (exportDisabledByAdmin) return Alert.alert("Export disabled", "Export is currently turned off.");
    if (!canExport) return Alert.alert("Pro feature", "Exporting your data is part of Pro access.");
    void saveToSheets();
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="Backup & Export Data" back />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={[styles.banner, !online && styles.bannerWait]}>
          <Ionicons name={online ? "information-circle" : "time-outline"} size={22} color={online ? colors.primary : colors.gray500} />
          <Text style={[styles.bannerText, !online && { color: colors.gray500 }]}>{online ? "Your account is connected and your records sync to your Receipt Cycle account." : "Checking your backup…"}</Text>
        </View>
        <View style={styles.hero}>{online ? <Ionicons name="sync" size={86} color="#fff" /> : <ActivityIndicator color="#fff" size="large" />}</View>
        <Text style={styles.title}>Backup & Export Data</Text>
        <Text style={styles.body}>Your records are saved to your Receipt Cycle account whenever you are online, so you can get them back on a new phone by signing in again. You can also download a spreadsheet copy below.</Text>
        {checkedAt ? <Text style={styles.last}>Last synced: {when(checkedAt)}</Text> : null}
        <Pressable accessibilityRole="button" onPress={onExport} style={styles.button}>
          <Ionicons name="download-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Export Excel</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onExportCsv} style={{ marginTop: spacing.md, padding: spacing.sm }}>
          <Text style={{ color: colors.primary, fontSize: uiType.body, fontWeight: "600" }}>Export CSV</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={saving} onPress={onSaveToSheets} style={[styles.outlineButton, saving && { opacity: 0.6 }]}>
          {saving ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="logo-google" size={18} color={colors.primary} />}
          <Text style={styles.outlineText}>{saving ? "Saving to Google..." : "Save to Google Sheets"}</Text>
        </Pressable>
        {sheet ? (
          <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(sheet.webViewLink)} style={{ marginTop: spacing.md, padding: spacing.sm }}>
            <Text style={{ color: colors.primary, fontSize: uiType.body, fontWeight: "700", textDecorationLine: "underline" }}>Saved to your Google Drive. Open in Google Sheets</Text>
          </Pressable>
        ) : null}
        {!canExport && !exportDisabledByAdmin ? <Text style={styles.note}>Downloading a spreadsheet of your data is a Pro feature. Your backup above is always on for everyone.</Text> : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: { padding: spacing.lg, paddingBottom: spacing.xxxl, alignItems: "center" },
  banner: { flexDirection: "row", alignItems: "center", gap: spacing.sm, alignSelf: "stretch", backgroundColor: "#E6F4EE", borderRadius: 14, padding: spacing.md },
  bannerWait: { backgroundColor: colors.gray100 },
  bannerText: { flex: 1, color: colors.primary, fontSize: uiType.body, lineHeight: 22 },
  hero: { width: 150, height: 150, borderRadius: 75, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: spacing.xxxl },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: "800", marginTop: spacing.xl },
  body: { color: colors.textSecondary, fontSize: uiType.body, lineHeight: 24, textAlign: "center", marginTop: spacing.sm, paddingHorizontal: spacing.sm },
  last: { color: colors.gray500, fontSize: uiType.body, marginTop: spacing.xl },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, alignSelf: "stretch", minHeight: 52, borderRadius: 14, backgroundColor: colors.primary, marginTop: spacing.xxl },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: uiType.body },
  outlineButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, alignSelf: "stretch", minHeight: 52, borderRadius: 14, borderWidth: 1.5, borderColor: colors.primary, marginTop: spacing.md },
  outlineText: { color: colors.primary, fontWeight: "800", fontSize: uiType.body },
  note: { color: colors.gray500, fontSize: uiType.caption, textAlign: "center", marginTop: spacing.md, lineHeight: 18 },
});
