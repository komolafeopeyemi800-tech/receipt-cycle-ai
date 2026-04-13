import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { WhopSignInButton } from "../components/WhopSignInButton";
import { colors, gradients, type as typeScale } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";
import { getRememberedEmailAsync } from "../lib/rememberedEmail";
import { openHttpsOrExternalUrl } from "../lib/openExternalUrl";
import { PRICING_PAGE_URL, WEB_SIGNIN_URL } from "../constants/urls";

export function SignInScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const last = await getRememberedEmailAsync();
      if (last) setEmail(last);
    })();
  }, []);

  const onGoogleError = useCallback((message: string) => {
    setErr(message);
  }, []);

  async function onSubmit() {
    setErr(null);
    setBusy(true);
    try {
      const { error } = await signIn(email.trim(), password);
      if (error) setErr(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={["top", "left", "right"]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              <View style={styles.logoMark}>
                <Ionicons name="receipt-outline" size={32} color="#fff" />
              </View>
              <Text style={styles.brand}>Receipt Cycle</Text>
              <Text style={styles.title}>Sign in</Text>
              <Text style={styles.sub}>
                Your session stays on this device until you sign out. Use the same email on web and mobile.
              </Text>
            </View>

            <View style={styles.card}>
              <WhopSignInButton onError={(m) => setErr(m)} disabled={busy} />

              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <Text style={styles.orTxt}>or</Text>
                <View style={styles.orLine} />
              </View>

              <GoogleSignInButton onError={onGoogleError} />

              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <Text style={styles.orTxt}>or email</Text>
                <View style={styles.orLine} />
              </View>

              <View style={styles.field}>
                <Text style={styles.lbl}>Email</Text>
                <TextInput
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@company.com"
                  placeholderTextColor={colors.gray400}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.lbl}>Password</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.gray400}
                />
              </View>

              {err && <Text style={styles.err}>{err}</Text>}

              <Pressable style={[styles.btn, busy && { opacity: 0.7 }]} onPress={onSubmit} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Sign in</Text>}
              </Pressable>

              <Pressable style={styles.forgotRow} onPress={() => navigation.navigate("ForgotPassword")}>
                <Text style={styles.forgot}>Forgot password?</Text>
              </Pressable>

              <View style={styles.webFallbackRow}>
                <Pressable
                  style={styles.webFallbackBtn}
                  onPress={() => {
                    void openHttpsOrExternalUrl(WEB_SIGNIN_URL);
                  }}
                >
                  <Text style={styles.webFallbackTxt}>Open web auth</Text>
                </Pressable>
                <Pressable
                  style={styles.webFallbackBtn}
                  onPress={() => {
                    void openHttpsOrExternalUrl(PRICING_PAGE_URL);
                  }}
                >
                  <Text style={styles.webFallbackTxt}>Open web pricing</Text>
                </Pressable>
              </View>
            </View>

            <Pressable style={styles.linkRow} onPress={() => navigation.navigate("SignUp")}>
              <Text style={styles.link}>Create account</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 36,
    justifyContent: "center",
  },
  hero: { alignItems: "center", marginBottom: 22 },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  brand: { fontSize: 13, fontWeight: "700", color: colors.gray500, letterSpacing: 0.6, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: "800", color: colors.gray900 },
  sub: {
    fontSize: typeScale.sm,
    color: colors.gray500,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 320,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  field: {},
  lbl: { fontSize: typeScale.sm, fontWeight: "600", color: colors.gray600, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: typeScale.body,
    color: colors.gray900,
    backgroundColor: "#fff",
  },
  err: { color: colors.rose600, fontSize: typeScale.md, marginBottom: 4 },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  btnTxt: { color: "#fff", fontWeight: "700", fontSize: typeScale.body },
  forgotRow: { alignItems: "center", marginTop: 8 },
  forgot: { fontSize: typeScale.md, color: colors.gray600, fontWeight: "600" },
  orRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 4 },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.gray200 },
  orTxt: { fontSize: typeScale.sm, color: colors.gray400, fontWeight: "600" },
  linkRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 22 },
  link: { fontSize: typeScale.body, color: colors.primary, fontWeight: "600" },
  webFallbackRow: { flexDirection: "row", gap: 8, marginTop: 2 },
  webFallbackBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  webFallbackTxt: { fontSize: typeScale.sm, color: colors.gray700, fontWeight: "600" },
});
