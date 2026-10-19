import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
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
import { useKeyboardHeight } from "../hooks/useKeyboardHeight";
import { useAuth } from "../contexts/AuthContext";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { getRememberedEmailAsync } from "../lib/rememberedEmail";
import { colors, gradients, type as typeScale } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";

export function SignUpScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const keyboard = useKeyboardHeight();
  const scrollRef = useRef<ScrollView>(null);
  const revealLowerFields = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);

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
    if (!accepted) {
      setErr("Agree to the Terms of Service and Privacy Policy to create an account.");
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const { error } = await signUp(email.trim(), password, name.trim() || undefined);
      if (error) setErr(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView ref={scrollRef} contentContainerStyle={[styles.pad, keyboard > 0 && { paddingBottom: keyboard + 40 }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets nestedScrollEnabled scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
          <Pressable style={styles.back} onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={colors.gray900} />
          </Pressable>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.sub}>Continue with Google or create an account with your email and password.</Text>

          <View style={styles.trustHero}>
            <View style={styles.shield}><Ionicons name="shield-checkmark-outline" size={31} color={colors.primary} /></View>
            <Text style={styles.trustTitle}>Never lose another receipt with automated cloud backups</Text>
          </View>

          <GoogleSignInButton onError={onGoogleError} blocked={!accepted} onBlocked={() => setErr("Tick the box below to agree to the Terms of Service and Privacy Policy, then tap Continue with Google.")} />

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orTxt}>or create with email</Text>
            <View style={styles.orLine} />
          </View>
          <View style={styles.field}>
            <Text style={styles.lbl}>Name (optional)</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.gray400}
            />
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
              onFocus={revealLowerFields}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.gray400}
            />
          </View>
          <Pressable style={styles.consentRow} onPress={() => setAccepted((value) => !value)} accessibilityRole="checkbox" accessibilityState={{ checked: accepted }}>
            <Ionicons name={accepted ? "checkbox" : "square-outline"} size={24} color={accepted ? colors.primary : colors.gray500} />
            <Text style={styles.consentText}>I agree to the <Text style={styles.legalLink} onPress={() => void Linking.openURL("https://receiptcycle.com/terms")}>Terms of Service</Text> and <Text style={styles.legalLink} onPress={() => void Linking.openURL("https://receiptcycle.com/privacy")}>Privacy Policy</Text>.</Text>
          </Pressable>
          {err && <Text style={styles.err}>{err}</Text>}
          <Pressable style={[styles.btn, (!accepted || busy) && { opacity: 0.55 }]} onPress={onSubmit} disabled={busy || !accepted}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Sign up</Text>}
          </Pressable>

          <Pressable style={({ pressed }) => [styles.signInBtn, pressed && { opacity: 0.8 }]} onPress={() => navigation.navigate("SignIn")} hitSlop={8} accessibilityRole="button">
            <Text style={styles.signInTxt}>Already have an account? Sign in</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { padding: 16, paddingTop: 48, paddingBottom: 40 },
  back: { marginBottom: 12, alignSelf: "flex-start" },
  title: { fontSize: typeScale.headline, fontWeight: "700", color: colors.gray900 },
  sub: { fontSize: typeScale.body, color: colors.gray500, marginTop: 6, marginBottom: 20 },
  trustHero: { alignItems: "center", paddingVertical: 18, paddingHorizontal: 12, marginBottom: 14 },
  shield: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.mintSoft, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  trustTitle: { maxWidth: 310, textAlign: "center", color: colors.gray900, fontSize: 20, lineHeight: 27, fontWeight: "800" },
  consentRow: { flexDirection: "row", alignItems: "flex-start", gap: 9, marginVertical: 8 },
  consentText: { flex: 1, color: colors.gray600, fontSize: typeScale.sm, lineHeight: 19 },
  legalLink: { color: colors.primary, fontWeight: "700" },
  field: { marginBottom: 12 },
  lbl: { fontSize: typeScale.sm, fontWeight: "600", color: colors.gray600, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typeScale.body,
    color: colors.gray900,
    backgroundColor: colors.surface,
  },
  err: { color: colors.rose600, fontSize: typeScale.md, marginBottom: 8 },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  btnTxt: { color: "#fff", fontWeight: "700", fontSize: typeScale.body },
  orRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 18, marginBottom: 12 },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.gray200 },
  orTxt: { fontSize: typeScale.sm, color: colors.gray400, fontWeight: "600" },
  signInBtn: { marginTop: 18, minHeight: 52, alignItems: "center", justifyContent: "center" },
  signInTxt: { fontSize: 16, fontWeight: "700", color: colors.primary },
  linkRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 16 },
  link: { fontSize: typeScale.body, color: colors.primary, fontWeight: "600" },
});
