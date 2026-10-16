import * as WebBrowser from "expo-web-browser";
import { useIdTokenAuthRequest } from "expo-auth-session/providers/google";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { colors, type as typeScale } from "../theme/tokens";

WebBrowser.maybeCompleteAuthSession();

type Props = {
  onError: (message: string) => void;
  disabled?: boolean;
  blocked?: boolean;
  onBlocked?: () => void;
};

/**
 * Native Google sign-in to an ID token accepted by the Cloudflare API.
 * Requires EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID / EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID.
 * Expo's installed-app redirect is used on Android (`com.receiptcycle.mobile:/oauthredirect`),
 * which is handled by MainActivity and returns the browser session to this component.
 */
export function GoogleSignInButton({ onError, disabled = false, blocked = false, onBlocked }: Props) {
  const { signInWithGoogle } = useAuth();
  const iosId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ?? "";
  const androidId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() ?? "";
  const configured = Platform.OS === "ios" ? Boolean(iosId) : Platform.OS === "android" ? Boolean(androidId) : false;

  const [request, response, promptAsync] = useIdTokenAuthRequest({
    iosClientId: iosId,
    androidClientId: androidId,
  });

  const [busy, setBusy] = useState(false);

  const handleParsedResponse = useCallback(
    async (idToken: string | undefined) => {
      if (!idToken) {
        onError("Could not get a Google sign-in token. Check OAuth client IDs and the redirect URI in Google Cloud.");
        return;
      }
      setBusy(true);
      try {
        const { error } = await signInWithGoogle(idToken);
        if (error) onError(error.message);
      } finally {
        setBusy(false);
      }
    },
    [onError, signInWithGoogle],
  );

  useEffect(() => {
    if (!response) return;
    if (response.type === "dismiss" || response.type === "cancel") return;
    if (response.type === "error") {
      onError(response.error?.message ?? "Google sign-in was cancelled or failed.");
      return;
    }
    if (response.type !== "success") return;

    const fromParams = response.params?.id_token;
    const idToken =
      (typeof fromParams === "string" && fromParams.length > 0 ? fromParams : undefined) ??
      response.authentication?.idToken ??
      undefined;

    void handleParsedResponse(idToken);
  }, [response, onError, handleParsedResponse]);

  return (
    <Pressable
      style={[styles.btn, styles.btnTall, (disabled || busy || (configured && !request)) && styles.btnDisabled]}
      disabled={disabled || busy || (configured && !request)}
      onPress={() => {
        if (blocked) {
          onBlocked?.();
          return;
        }
        if (!configured) {
          onError("Google sign-in needs the Android OAuth client ID for com.receiptcycle.mobile.");
          return;
        }
        void promptAsync();
      }}
    >
      {busy ? (
        <ActivityIndicator color={colors.gray800} />
      ) : (
        <>
          <Ionicons name="logo-google" size={20} color={colors.gray800} />
          <Text style={styles.btnTxt}>Continue with Google</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btnTall: { minHeight: 52 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.surface,
  },
  btnDisabled: { opacity: 0.65 },
  btnTxt: { fontSize: typeScale.body, fontWeight: "700", color: colors.gray900 },
});
