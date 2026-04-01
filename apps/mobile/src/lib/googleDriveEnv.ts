import { Platform } from "react-native";

/** Set in `apps/mobile/.env` (see `.env.example`). */
export function getGoogleOAuthClientId(): string | null {
  if (Platform.OS === "ios") {
    const id = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
    return id && id.length > 0 ? id : null;
  }
  const id = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim();
  return id && id.length > 0 ? id : null;
}

export function getConvexUrl(): string {
  const url = process.env.EXPO_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("Missing EXPO_PUBLIC_CONVEX_URL");
  return url;
}
