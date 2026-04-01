import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ResponseType,
  makeRedirectUri,
  useAuthRequest,
  type AuthSessionResult,
} from "expo-auth-session";
import { useAuth } from "../contexts/AuthContext";
import {
  clearGoogleDriveSession,
  getDriveWeeklyEnabled,
  getLastDriveBackupAt,
  getStoredDriveEmail,
  getStoredRefreshToken,
  setDriveWeeklyEnabled,
  storeGoogleDriveSession,
} from "../lib/driveBackupStorage";
import { getGoogleOAuthClientId } from "../lib/googleDriveEnv";
import {
  GOOGLE_DISCOVERY,
  exchangeGoogleAuthCode,
  runDriveBackupWithStoredCredentials,
} from "../lib/performDriveBackup";
import {
  registerDriveWeeklyBackgroundTask,
  unregisterDriveWeeklyBackgroundTask,
} from "../tasks/driveBackupTask";
import { colors, gradients, type as typeScale } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";

WebBrowser.maybeCompleteAuthSession();

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/drive.file",
];

function formatWhen(ms: number | null) {
  if (ms == null) return "Never";
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return "Unknown";
  }
}

export function GoogleDriveBackupScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const clientId = useMemo(() => getGoogleOAuthClientId(), []);

  const redirectUri = useMemo(
    () =>
      makeRedirectUri({
        scheme: "receiptcycle",
        path: "google-drive-oauth",
      }),
    [],
  );

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: clientId ?? "missing-client-id",
      scopes: SCOPES,
      redirectUri,
      responseType: ResponseType.Code,
      usePKCE: true,
      extraParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
    GOOGLE_DISCOVERY,
  );

  const [linked, setLinked] = useState(false);
  const [driveEmail, setDriveEmail] = useState<string | null>(null);
  const [weekly, setWeekly] = useState(false);
  const [lastAt, setLastAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshLocalState = useCallback(async () => {
    const rt = await getStoredRefreshToken();
    const em = await getStoredDriveEmail();
    const w = await getDriveWeeklyEnabled();
    const la = await getLastDriveBackupAt();
    setLinked(!!rt);
    setDriveEmail(em);
    setWeekly(w);
    setLastAt(la);
  }, []);

  useEffect(() => {
    void refreshLocalState();
  }, [refreshLocalState]);

  const handleAuthResult = useCallback(
    async (res: AuthSessionResult) => {
      if (res.type !== "success" || !user) return;
      const code = res.params.code;
      if (!code || !request?.codeVerifier) {
        Alert.alert("Google", "Could not complete sign-in (missing code).");
        return;
      }
      setBusy(true);
      try {
        const token = await exchangeGoogleAuthCode(code, request.codeVerifier, redirectUri);
        const refresh = token.refreshToken;
        if (!refresh) {
          Alert.alert(
            "Google Drive",
            "No refresh token returned. Remove app access in Google Account settings and try again with consent.",
          );
          return;
        }
        await storeGoogleDriveSession({
          refreshToken: refresh,
          convexUserId: user.id,
          email: user.email,
        });
        await refreshLocalState();
        const w = await getDriveWeeklyEnabled();
        if (w) await registerDriveWeeklyBackgroundTask();
        Alert.alert("Connected", "Google Drive is linked. Weekly backups will upload JSON exports when due.");
      } catch (e) {
        Alert.alert("Google", e instanceof Error ? e.message : "Connection failed");
      } finally {
        setBusy(false);
      }
    },
    [user, request?.codeVerifier, redirectUri, refreshLocalState],
  );

  useEffect(() => {
    if (response) void handleAuthResult(response);
  }, [response, handleAuthResult]);

  async function onDisconnect() {
    Alert.alert("Disconnect Google Drive?", "Automatic backups will stop.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Disconnect",
        style: "destructive",
        onPress: () => {
          void (async () => {
            await clearGoogleDriveSession();
            await setDriveWeeklyEnabled(false);
            await unregisterDriveWeeklyBackgroundTask();
            await refreshLocalState();
          })();
        },
      },
    ]);
  }

  async function onToggleWeekly(v: boolean) {
    setWeekly(v);
    await setDriveWeeklyEnabled(v);
    if (v && linked) {
      await registerDriveWeeklyBackgroundTask();
    } else {
      await unregisterDriveWeeklyBackgroundTask();
    }
  }

  async function onBackupNow() {
    if (!linked) {
      Alert.alert("Not connected", "Link Google Drive first.");
      return;
    }
    setBusy(true);
    try {
      await runDriveBackupWithStoredCredentials();
      await refreshLocalState();
      Alert.alert("Backed up", "Your transactions were uploaded to Google Drive.");
    } catch (e) {
      Alert.alert("Backup failed", e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  const missingConfig = !clientId;

  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <View style={[styles.top, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={colors.gray900} />
        </Pressable>
        <Text style={styles.screenTitle}>Google Drive backup</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        {missingConfig ? (
          <View style={styles.warnBox}>
            <Text style={styles.warnTitle}>Setup required</Text>
            <Text style={styles.warnTxt}>
              Add OAuth client IDs to your environment:{"\n\n"}
              • EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID (iOS){"\n"}
              • EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID (Android){"\n\n"}
              In Google Cloud Console, enable Drive API and register these redirect URIs for the same client IDs:{"\n"}
              • <Text style={{ fontWeight: "700" }}>{redirectUri}</Text> (Drive backup){"\n"}•{" "}
              <Text style={{ fontWeight: "700" }}>receiptcycle://google-signin</Text> (Sign in with Google)
            </Text>
          </View>
        ) : null}

        <Text style={styles.lead}>
          Link your Google account so Receipt Cycle can upload encrypted-style JSON backups to{" "}
          <Text style={{ fontWeight: "700" }}>your</Text> Drive (app-created files only). Backups run about once per week
          when the app opens or when the OS runs a background refresh.
        </Text>

        <View style={styles.card}>
          <Text style={styles.rowLbl}>Status</Text>
          <Text style={styles.rowVal}>{linked ? "Connected" : "Not connected"}</Text>
          {driveEmail ? <Text style={styles.sub}>{driveEmail}</Text> : null}
          <Text style={styles.sub}>Last backup: {formatWhen(lastAt)}</Text>

          {!linked ? (
            <Pressable
              style={[styles.primaryBtn, (!request || busy || missingConfig) && { opacity: 0.6 }]}
              disabled={!request || busy || missingConfig}
              onPress={() => void promptAsync({ showInRecents: Platform.OS === "ios" })}
            >
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryTxt}>Link Google Drive</Text>}
            </Pressable>
          ) : (
            <>
              <Pressable style={[styles.primaryBtn, busy && { opacity: 0.7 }]} disabled={busy} onPress={() => void onBackupNow()}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryTxt}>Back up now</Text>}
              </Pressable>
              <Pressable style={styles.ghostBtn} onPress={() => void onDisconnect()}>
                <Text style={styles.ghostTxt}>Disconnect</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.rowLbl}>Weekly automatic backup</Text>
              <Text style={styles.sub}>Requires Google linked + signed in. Best-effort in background.</Text>
            </View>
            <Switch
              value={weekly}
              onValueChange={(v) => void onToggleWeekly(v)}
              disabled={!linked}
              trackColor={{ false: colors.gray200, true: colors.teal600 }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  screenTitle: { fontSize: typeScale.headline, fontWeight: "700", color: colors.gray900 },
  pad: { paddingHorizontal: 16, paddingBottom: 24 },
  lead: { fontSize: typeScale.sm, color: colors.gray600, lineHeight: 20, marginBottom: 16 },
  warnBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    padding: 12,
    marginBottom: 14,
  },
  warnTitle: { fontWeight: "800", color: "#991b1b", marginBottom: 6 },
  warnTxt: { fontSize: typeScale.sm, color: "#7f1d1d", lineHeight: 20 },
  card: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    backgroundColor: colors.surface,
    padding: 14,
    marginBottom: 12,
  },
  rowLbl: { fontSize: typeScale.xs, fontWeight: "800", color: colors.gray500, letterSpacing: 0.5 },
  rowVal: { fontSize: typeScale.bodyStrong, fontWeight: "800", color: colors.gray900, marginTop: 4 },
  sub: { fontSize: typeScale.sm, color: colors.gray600, marginTop: 6, lineHeight: 18 },
  primaryBtn: {
    marginTop: 14,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryTxt: { color: "#fff", fontWeight: "800", fontSize: typeScale.body },
  ghostBtn: { marginTop: 10, paddingVertical: 12, alignItems: "center" },
  ghostTxt: { color: colors.rose600, fontWeight: "700" },
  toggleRow: { flexDirection: "row", alignItems: "center" },
});
