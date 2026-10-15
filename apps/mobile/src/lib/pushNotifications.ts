import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const DEVICE_ID_KEY = "receiptcycle_push_device_id";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export async function deviceId() {
  const current = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (current) return current;
  const created = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await AsyncStorage.setItem(DEVICE_ID_KEY, created);
  return created;
}

const CHANNELS: [string, string][] = [
  ["reminders", "Reminders"], ["invoices", "Invoices"], ["payments", "Payments"], ["budgets", "Budgets"], ["reports", "Weekly reports"], ["updates", "Tips and updates"],
];

export async function configurePushChannel() {
  if (Platform.OS !== "android") return;
  for (const [id, name] of CHANNELS) {
    await Notifications.setNotificationChannelAsync(id, {
      name,
      importance: id === "updates" ? Notifications.AndroidImportance.LOW : Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200, 120, 200],
      lightColor: "#149184",
    });
  }
}

export async function requestPushRegistration() {
  await configurePushChannel();
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return { granted: false as const, status: permission.status };
  const nativeToken = await Notifications.getDevicePushTokenAsync();
  if (typeof nativeToken.data !== "string") throw new Error("This device did not return a push token.");
  return { granted: true as const, status: permission.status, token: nativeToken.data, deviceId: await deviceId(), platform: Platform.OS === "ios" ? "ios" as const : "android" as const };
}

export async function existingPushRegistration() {
  await configurePushChannel();
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return null;
  const nativeToken = await Notifications.getDevicePushTokenAsync();
  return typeof nativeToken.data === "string" ? { token: nativeToken.data, deviceId: await deviceId(), permissionStatus: permission.status, platform: Platform.OS === "ios" ? "ios" as const : "android" as const } : null;
}


export const PENDING_NOTIFICATION_PREFS_KEY = "pendingNotificationPrefs";

/** Asks the phone for permission without registering anything; registration follows once the person is signed in. */
export async function requestNotificationPermission() {
  await configurePushChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}
