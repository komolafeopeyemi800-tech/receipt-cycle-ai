import { useCallback, useEffect, useRef, useState } from "react";
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
import { useKeyboardHeight } from "../hooks/useKeyboardHeight";
import { useAuth } from "../contexts/AuthContext";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { colors, gradients, type as typeScale } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";
import { getRememberedEmailAsync } from "../lib/rememberedEmail";

export function SignInScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const keyboard = useKeyboardHeight();
  const scrollRef = useRef<ScrollView>(null);
  const revealPassword = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);

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
            ref={scrollRef}
            contentContainerStyle={[styles.scrollContent, keyboard > 0 && { paddingBottom: keyboard + 32 }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
            nestedScrollEnabled
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              <View style={styles.shield}><Ionicons name="shield-checkmark-outline" size={30} color={colors.primary} /></View>
              <Text style={styles.trustTitle}>Never lose another receipt with automated cloud backups</Text>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.sub}>Sign in to continue with the same account you use on the web.</Text>
            </View>

            <View style={styles.card}>
              <GoogleSignInButton onError={onGoogleError} />

              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <Text style={styles.orTxt}>or sign in with email</Text>
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
                  onFocus={revealPassword}
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
            </View>

            <View style={styles.newHere}>
              <Text style={styles.newHereText}>New to Receipt Cycle?</Text>
              <Pressable style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.8 }]} onPress={() => navigation.navigate("SignUp")} hitSlop={8} accessibilityRole="button" accessibilityLabel="Create account">
                <Text style={styles.createBtnTxt}>Create account</Text>
              </Pressable>
            </View>
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
  shield: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.mintSoft, alignItems: "center", justifyContent: "center", marginBottom: 9 },
  trustTitle: { maxWidth: 320, textAlign: "center", color: colors.gray900, fontSize: 19, lineHeight: 25, fontWeight: "800", marginBottom: 16 },
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
    borderRadius: 6,
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
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: typeScale.body,
    color: colors.gray900,
    backgroundColor: "#fff",
  },
  err: { color: colors.rose600, fontSize: typeScale.md, marginBottom: 4 },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 6,
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
  newHere: { alignItems: "center", marginTop: 26, gap: 12 },
  newHereText: { fontSize: 15, color: colors.gray600, fontWeight: "600" },
  createBtn: { alignSelf: "stretch", minHeight: 56, borderRadius: 6, borderWidth: 2, borderColor: colors.primary, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  createBtnTxt: { fontSize: 19, fontWeight: "800", color: colors.primary },
  linkRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 22 },
  link: { fontSize: typeScale.body, color: colors.primary, fontWeight: "600" },
});
