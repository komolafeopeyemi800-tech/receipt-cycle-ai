import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import { colors, gradients, type as typeScale } from "../theme/tokens";
import type { RootStackParamList } from "../navigation/types";

export function ResetPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "ResetPassword">>();
  const { resetPasswordWithToken } = useAuth();

  const initialToken = route.params?.token ?? "";
  const [token, setToken] = useState(initialToken);

  useEffect(() => {
    const t = route.params?.token;
    if (t) setToken(t);
  }, [route.params?.token]);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit() {
    setErr(null);
    const t = token.trim();
    if (t.length < 16) {
      setErr("Paste the reset token from your email (or dev screen).");
      return;
    }
    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    if (password !== password2) {
      setErr("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await resetPasswordWithToken(t, password);
      if (error) {
        setErr(error.message);
        return;
      }
      Alert.alert("Password updated", "You can sign in with your new password.", [
        { text: "OK", onPress: () => navigation.navigate("SignIn") },
      ]);
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
          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.sub}>Enter the token from your email (or dev flow) and choose a new password.</Text>

          <Text style={styles.lbl}>Reset token</Text>
          <TextInput
            style={[styles.input, styles.inputTall]}
            autoCapitalize="none"
            autoCorrect={false}
            value={token}
            onChangeText={setToken}
            placeholder="Paste token"
            placeholderTextColor={colors.gray400}
            multiline
          />

          <View style={styles.field}>
            <Text style={styles.lbl}>New password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.gray400}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.lbl}>Confirm password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={password2}
              onChangeText={setPassword2}
              placeholder="Repeat password"
              placeholderTextColor={colors.gray400}
            />
          </View>

          {err ? <Text style={styles.err}>{err}</Text> : null}

          <Pressable style={[styles.btn, busy && { opacity: 0.7 }]} onPress={() => void onSubmit()} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Update password</Text>}
          </Pressable>

          <Pressable style={styles.linkRow} onPress={() => navigation.navigate("ForgotPassword")}>
            <Text style={styles.link}>Request a new link</Text>
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
  sub: { fontSize: typeScale.body, color: colors.gray500, marginTop: 6, marginBottom: 16 },
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
  inputTall: { minHeight: 72, textAlignVertical: "top" },
  err: { color: colors.rose600, fontSize: typeScale.md, marginBottom: 8 },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  btnTxt: { color: "#fff", fontWeight: "700", fontSize: typeScale.body },
  linkRow: { marginTop: 20, alignItems: "center" },
  link: { fontSize: typeScale.body, color: colors.primary, fontWeight: "600" },
});
