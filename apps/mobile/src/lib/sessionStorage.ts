/**
 * Session token persistence: SecureStore on native; localStorage on web.
 * expo-secure-store's web stub exports an empty module, so setItemAsync throws
 * ("setValueWithKeyAsync is not a function") — never call it on web.
 */
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export const SESSION_TOKEN_KEY = "receiptcycle_session_token";

function webGet(): string | null {
  try {
    if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
      return globalThis.localStorage.getItem(SESSION_TOKEN_KEY);
    }
  } catch {
    /* private mode / SSR */
  }
  return null;
}

function webSet(value: string): void {
  try {
    if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
      globalThis.localStorage.setItem(SESSION_TOKEN_KEY, value);
    }
  } catch {
    /* ignore */
  }
}

function webRemove(): void {
  try {
    if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
      globalThis.localStorage.removeItem(SESSION_TOKEN_KEY);
    }
  } catch {
    /* ignore */
  }
}

export async function getSessionTokenAsync(): Promise<string | null> {
  if (Platform.OS === "web") {
    return webGet();
  }
  try {
    return await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setSessionTokenAsync(token: string): Promise<void> {
  if (Platform.OS === "web") {
    webSet(token);
    return;
  }
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
}

export async function clearSessionTokenAsync(): Promise<void> {
  if (Platform.OS === "web") {
    webRemove();
    return;
  }
  try {
    await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
