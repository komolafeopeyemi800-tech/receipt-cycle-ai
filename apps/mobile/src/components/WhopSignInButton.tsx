import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useWhopAuthRequest, getWhopNativeClientId, getWhopNativeRedirectUri } from "../lib/whopOAuthNative";
import { useAuth } from "../contexts/AuthContext";
import { type as typeScale } from "../theme/tokens";
import { userFacingError, userFacingErrorFromUnknown } from "../lib/userFacingErrors";

type Props = {
  label?: string;
  onError: (message: string) => void;
  disabled?: boolean;
};

export function WhopSignInButton({ label = "Continue with Whop", onError, disabled }: Props) {
  const { signInWithWhop } = useAuth();
  const clientId = getWhopNativeClientId();
  const redirectUri = getWhopNativeRedirectUri();
  const [request, response, promptAsync] = useWhopAuthRequest();
  const consumedRef = useRef(false);
  const [exchanging, setExchanging] = useState(false);

  const runExchange = useCallback(
    async (code: string, verifier: string) => {
      setExchanging(true);
      try {
        const { error } = await signInWithWhop(code, redirectUri, verifier);
        if (error) onError(userFacingError(error.message));
      } catch (e) {
        onError(userFacingErrorFromUnknown(e));
      } finally {
        setExchanging(false);
      }
    },
    [onError, redirectUri, signInWithWhop],
  );

  useEffect(() => {
    if (response?.type !== "success" || consumedRef.current) return;
    const code = response.params?.code;
    const verifier = request?.codeVerifier;
    if (!code || typeof code !== "string" || !verifier) {
      onError("Whop sign-in did not return a valid code.");
      return;
    }
    consumedRef.current = true;
    void runExchange(code, verifier);
  }, [response, request?.codeVerifier, onError, runExchange]);

  useEffect(() => {
    if (response?.type === "error") {
      onError(response.error?.message ?? "Whop sign-in was cancelled.");
    }
  }, [response, onError]);

  if (!clientId) return null;

  return (
    <Pressable
      style={({ pressed }) => [styles.btn, (disabled || exchanging || pressed) && { opacity: 0.88 }]}
      disabled={disabled || exchanging}
      onPress={() => {
        consumedRef.current = false;
        void promptAsync();
      }}
    >
      {exchanging ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <View style={styles.row}>
          <Text style={styles.icon}>W</Text>
          <Text style={styles.txt}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: "#6366f1",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  icon: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
    width: 22,
    textAlign: "center",
  },
  txt: { color: "#fff", fontWeight: "700", fontSize: typeScale.body },
});
