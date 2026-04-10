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
import { useAuth } from "../contexts/AuthContext";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { WhopSignInButton } from "../components/WhopSignInButton";
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
      const { error } = await signUp(email.trim(), password, name.trim() || undefined);
      if (error) setErr(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <LinearGradient colors={[...gradients.page]} style={styles.flex}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.back} onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={colors.gray900} />
          </Pressable>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.sub}>Create an account — email and password are stored securely via Convex.</Text>

          <WhopSignInButton label="Sign up with Whop" onError={(m) => setErr(m)} disabled={busy} />

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orTxt}>or</Text>
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
              placeholder="At least 6 characters"
              placeholderTextColor={colors.gray400}
            />
          </View>
          {err && <Text style={styles.err}>{err}</Text>}
          <Pressable style={[styles.btn, busy && { opacity: 0.7 }]} onPress={onSubmit} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Sign up</Text>}
          </Pressable>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orTxt}>or Google</Text>
            <View style={styles.orLine} />
          </View>

          <GoogleSignInButton onError={onGoogleError} />

          <Pressable style={styles.linkRow} onPress={() => navigation.navigate("SignIn")}>
            <Text style={styles.link}>Already have an account? Sign in</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
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
  orRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 18, marginBottom: 12 },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.gray200 },
  orTxt: { fontSize: typeScale.sm, color: colors.gray400, fontWeight: "600" },
  linkRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 16 },
  link: { fontSize: typeScale.body, color: colors.primary, fontWeight: "600" },
});
