import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { colors, type as typeScale } from "../theme/tokens";

type Props = {
  mode: "signin" | "signup";
  initialEmail?: string;
};

/**
 * Passwordless sign-in: enter your email, then the 6-digit code we send. The first code for a new
 * email also creates the account. On success the auth context stores the session and the app moves on.
 */
export function EmailCodeForm({ mode, initialEmail = "" }: Props) {
  const { sendEmailCode, signInWithEmailCode } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!email && initialEmail) setEmail(initialEmail);
  }, [initialEmail, email]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function request() {
    setErr(null);
    setBusy(true);
    try {
      const { error } = await sendEmailCode(email.trim());
      if (error) {
        setErr(error.message);
        return;
      }
      setStep("code");
      setCooldown(30);
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setErr(null);
    setBusy(true);
    try {
      const { error } = await signInWithEmailCode(email.trim(), code.trim());
      if (error) setErr(error.message);
    } finally {
      setBusy(false);
    }
  }

  if (step === "code") {
    return (
      <View>
        <Text style={styles.help}>
          We sent a 6-digit code to {email.trim()}. It works for 10 minutes.
        </Text>
        <View style={styles.field}>
          <Text style={styles.lbl}>6-digit code</Text>
          <TextInput
            style={[styles.input, styles.codeInput]}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, ""))}
            placeholder="000000"
            placeholderTextColor={colors.gray400}
            autoFocus
          />
        </View>
        {err ? <Text style={styles.err}>{err}</Text> : null}
        <Pressable style={[styles.btn, (busy || code.length !== 6) && { opacity: 0.6 }]} onPress={() => void verify()} disabled={busy || code.length !== 6}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Continue</Text>}
        </Pressable>
        <View style={styles.links}>
          <Pressable onPress={() => { setStep("email"); setCode(""); setErr(null); }} hitSlop={8}>
            <Text style={styles.link}>Use a different email</Text>
          </Pressable>
          <Pressable onPress={() => void request()} disabled={busy || cooldown > 0} hitSlop={8}>
            <Text style={[styles.link, cooldown > 0 && { opacity: 0.5 }]}>{cooldown > 0 ? `Send again in ${cooldown}s` : "Send a new code"}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.field}>
        <Text style={styles.lbl}>Email</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@company.com"
          placeholderTextColor={colors.gray400}
        />
      </View>
      {err ? <Text style={styles.err}>{err}</Text> : null}
      <Pressable style={[styles.btn, busy && { opacity: 0.7 }]} onPress={() => void request()} disabled={busy || !email.includes("@")}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnTxt}>{mode === "signup" ? "Email me a sign-up code" : "Email me a sign-in code"}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 12 },
  lbl: { fontSize: typeScale.sm, fontWeight: "600", color: colors.gray700, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: typeScale.body,
    color: colors.gray900,
    backgroundColor: colors.surface,
  },
  codeInput: { textAlign: "center", fontSize: 22, letterSpacing: 8, fontWeight: "700" },
  help: { fontSize: typeScale.body, color: colors.gray600, marginBottom: 12 },
  err: { color: colors.rose600, fontSize: typeScale.body, marginBottom: 10 },
  btn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  btnTxt: { color: "#fff", fontSize: typeScale.body, fontWeight: "700" },
  links: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
  link: { color: colors.primary, fontSize: typeScale.sm, fontWeight: "700" },
});
