import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "receiptcycle_last_signin_email";

function webGet(): string {
  try {
    return globalThis.localStorage?.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

function webSet(value: string): void {
  try {
    if (value) globalThis.localStorage?.setItem(KEY, value);
    else globalThis.localStorage?.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export async function getRememberedEmailAsync(): Promise<string> {
  if (Platform.OS === "web") return webGet();
  try {
    return (await AsyncStorage.getItem(KEY)) ?? "";
  } catch {
    return "";
  }
}

export async function setRememberedEmailAsync(email: string): Promise<void> {
  const v = email.trim().toLowerCase();
  if (Platform.OS === "web") {
    webSet(v);
    return;
  }
  try {
    if (v) await AsyncStorage.setItem(KEY, v);
    else await AsyncStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
