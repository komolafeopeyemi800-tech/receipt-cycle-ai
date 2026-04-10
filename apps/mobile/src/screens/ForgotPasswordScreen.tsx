import { useState } from "react";
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
import { formatAuthError } from "../lib/authErrors";
import { colors, gradients, type as typeScale } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";

export function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);

  async function onSubmit() {
    setErr(null);
    setInfo(null);
    setDevToken(null);
    const trimmed = email.trim();
    if (!trimmed.includes("@")) {
      setErr("Enter a valid email address.");
      return;
    }
    setBusy(true);
    try {
      const res = await requestPasswordReset(trimmed);
      if (!res.ok) {
        setErr(formatAuthError(res.error));
        return;
      }
      if (res.emailSent) {
        setInfo("Check your email for a link to reset your password.");
      } else if (res.devToken) {
        setDevToken(res.devToken);
        setInfo(
          "Email is not configured on the server. Copy the token below, tap “Enter reset code”, and paste it with your new password.",
        );
      } else {
        setInfo("No account found for that email. Check the spelling or create an account.");
      }
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
          <Text style={styles.title}>Forgot password</Text>
          <Text style={styles.sub}>We&apos;ll email a link to reset your password (email/password accounts).</Text>

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

          {err ? <Text style={styles.err}>{err}</Text> : null}
          {info ? <Text style={styles.info}>{info}</Text> : null}
          {devToken ? (
            <Text selectable style={styles.tokenBox}>
              {devToken}
            </Text>
          ) : null}

          <Pressable style={[styles.btn, busy && { opacity: 0.7 }]} onPress={() => void onSubmit()} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Send reset link</Text>}
          </Pressable>

          <Pressable style={styles.linkRow} onPress={() => navigation.navigate("ResetPassword", { token: devToken ?? undefined })}>
            <Text style={styles.link}>Enter reset code</Text>
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
  info: { color: colors.gray700, fontSize: typeScale.md, marginBottom: 8, lineHeight: 20 },
  tokenBox: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: typeScale.sm,
    color: colors.gray900,
    backgroundColor: colors.gray100,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  btnTxt: { color: "#fff", fontWeight: "700", fontSize: typeScale.body },
  linkRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 20 },
  link: { fontSize: typeScale.body, color: colors.primary, fontWeight: "600" },
});
