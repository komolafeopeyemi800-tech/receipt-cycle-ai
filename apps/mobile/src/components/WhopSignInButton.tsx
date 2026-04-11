import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
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

  const configured = Boolean(clientId);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || exchanging }}
      disabled={disabled || exchanging}
      onPress={() => {
        if (!configured) return;
        consumedRef.current = false;
        void promptAsync();
      }}
      style={({ pressed }) => [
        styles.hit,
        (disabled || exchanging) && styles.hitDisabled,
        pressed && configured && styles.hitPressed,
        !configured && styles.hitUnconfigured,
      ]}
      android_ripple={configured ? { color: "rgba(255,255,255,0.28)" } : undefined}
    >
      <LinearGradient
        colors={["#f97316", "#f43f5e"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradient}
      >
        {exchanging ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.row}>
            <Ionicons name="flash" size={20} color="#fff" />
            <Text style={styles.txt}>{label}</Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /** Rounded rect (not a full pill) — avoids a second “ring” look from borders + clipping. */
  hit: {
    alignSelf: "stretch",
    borderRadius: 14,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#f97316", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.22, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  hitDisabled: { opacity: 0.75 },
  hitPressed: { opacity: 0.92 },
  hitUnconfigured: { opacity: 0.78 },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  txt: { color: "#fff", fontWeight: "800", fontSize: typeScale.body },
});
