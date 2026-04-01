import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export const DRIVE_WEEKLY_KEY = "drive_weekly_backup_enabled";
export const DRIVE_LAST_BACKUP_KEY = "drive_last_backup_at_ms";

const SEC_REFRESH = "gdrive_refresh_token";
const SEC_USER_ID = "gdrive_convex_user_id";
const SEC_EMAIL = "gdrive_account_email";

export async function setDriveWeeklyEnabled(on: boolean) {
  await AsyncStorage.setItem(DRIVE_WEEKLY_KEY, on ? "1" : "0");
}

export async function getDriveWeeklyEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(DRIVE_WEEKLY_KEY);
  return v === "1";
}

export async function setLastDriveBackupAt(ms: number) {
  await AsyncStorage.setItem(DRIVE_LAST_BACKUP_KEY, String(ms));
}

export async function getLastDriveBackupAt(): Promise<number | null> {
  const v = await AsyncStorage.getItem(DRIVE_LAST_BACKUP_KEY);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function storeGoogleDriveSession(opts: {
  refreshToken: string;
  convexUserId: string;
  email?: string | null;
}) {
  await SecureStore.setItemAsync(SEC_REFRESH, opts.refreshToken, { keychainAccessible: SecureStore.WHEN_UNLOCKED });
  await SecureStore.setItemAsync(SEC_USER_ID, opts.convexUserId, { keychainAccessible: SecureStore.WHEN_UNLOCKED });
  if (opts.email) {
    await SecureStore.setItemAsync(SEC_EMAIL, opts.email, { keychainAccessible: SecureStore.WHEN_UNLOCKED });
  } else {
    await SecureStore.deleteItemAsync(SEC_EMAIL).catch(() => {});
  }
}

export async function clearGoogleDriveSession() {
  await SecureStore.deleteItemAsync(SEC_REFRESH).catch(() => {});
  await SecureStore.deleteItemAsync(SEC_USER_ID).catch(() => {});
  await SecureStore.deleteItemAsync(SEC_EMAIL).catch(() => {});
}

export async function getStoredRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SEC_REFRESH);
  } catch {
    return null;
  }
}

export async function getStoredConvexUserId(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SEC_USER_ID);
  } catch {
    return null;
  }
}

export async function getStoredDriveEmail(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SEC_EMAIL);
  } catch {
    return null;
  }
}
