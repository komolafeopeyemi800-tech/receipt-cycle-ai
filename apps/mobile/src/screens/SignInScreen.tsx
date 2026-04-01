import { useCallback, useState } from "react";
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
import { useAuth } from "../contexts/AuthContext";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { colors, gradients, type as typeScale } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";

export function SignInScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.sub}>
            Use the email and password for your account (same on mobile and web). Session is stored in secure storage on
            device, or in the browser on web.
          </Text>

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

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orTxt}>or</Text>
            <View style={styles.orLine} />
          </View>

          <GoogleSignInButton onError={onGoogleError} />

          <Pressable style={styles.linkRow} onPress={() => navigation.navigate("SignUp")}>
            <Text style={styles.link}>Create account</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { padding: 16, paddingTop: 56, paddingBottom: 40 },
  title: { fontSize: typeScale.headline, fontWeight: "700", color: colors.gray900 },
  sub: { fontSize: typeScale.body, color: colors.gray500, marginTop: 6, marginBottom: 20 },
  field: { marginBottom: 12 },
  lbl: { fontSize: typeScale.sm, fontWeight: "600", color: colors.gray600, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typeScale.body,
    color: colors.gray900,
    backgroundColor: colors.surface,
  },
  err: { color: colors.rose600, fontSize: typeScale.md, marginBottom: 8 },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  btnTxt: { color: "#fff", fontWeight: "700", fontSize: typeScale.body },
  forgotRow: { alignItems: "center", marginTop: 14 },
  forgot: { fontSize: typeScale.md, color: colors.gray600, fontWeight: "600" },
  orRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 18, marginBottom: 12 },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.gray200 },
  orTxt: { fontSize: typeScale.sm, color: colors.gray400, fontWeight: "600" },
  linkRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 16 },
  link: { fontSize: typeScale.body, color: colors.primary, fontWeight: "600" },
});
