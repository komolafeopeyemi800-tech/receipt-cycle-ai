import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: "https://api.whop.com/oauth/authorize",
  tokenEndpoint: "https://api.whop.com/oauth/token",
};

export function getWhopNativeClientId(): string {
  return (
    process.env.EXPO_PUBLIC_WHOP_OAUTH_CLIENT_ID?.trim() ||
    process.env.EXPO_PUBLIC_WHOP_CLIENT_ID?.trim() ||
    ""
  );
}

export function getWhopNativeRedirectUri(): string {
  const explicit = process.env.EXPO_PUBLIC_WHOP_OAUTH_REDIRECT_URI?.trim();
  if (explicit) return explicit;

  const path = (process.env.EXPO_PUBLIC_WHOP_OAUTH_REDIRECT_PATH?.trim() || "oauth/whop").replace(/^\/+/, "");
  const native = `receiptcycle://${path}`;
  return AuthSession.makeRedirectUri({
    scheme: "receiptcycle",
    path,
    native,
  });
}

/** Returns { authUrl } for opening in browser, plus request to read codeVerifier after success. */
export function useWhopAuthRequest(): [
  AuthSession.AuthRequest | null,
  AuthSession.AuthSessionResult | null,
  (options?: AuthSession.AuthRequestPromptOptions) => Promise<AuthSession.AuthSessionResult>,
] {
  const clientId = getWhopNativeClientId();
  const redirectUri = getWhopNativeRedirectUri();
  return AuthSession.useAuthRequest(
    {
      clientId,
      scopes: ["openid", "profile", "email"],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
    },
    discovery,
  );
}
