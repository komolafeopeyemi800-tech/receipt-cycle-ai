import { Linking } from "react-native";

/**
 * Open a URL in the browser / external app.
 * iOS: `Linking.canOpenURL("https://...")` is often false without `LSApplicationQueriesSchemes`,
 * so we skip the check for http(s) and open directly (Whop checkout, manage hub, etc.).
 */
export async function openHttpsOrExternalUrl(url: string): Promise<void> {
  const u = url.trim();
  if (!u) throw new Error("empty url");
  if (u.startsWith("https://") || u.startsWith("http://")) {
    await Linking.openURL(u);
    return;
  }
  const ok = await Linking.canOpenURL(u);
  if (!ok) throw new Error("cannot open");
  await Linking.openURL(u);
}
