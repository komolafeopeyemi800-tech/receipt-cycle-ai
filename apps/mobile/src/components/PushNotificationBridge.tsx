import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import * as Notifications from "expo-notifications";
import { api, useMutation } from "../lib/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PENDING_NOTIFICATION_PREFS_KEY, deviceId, existingPushRegistration } from "../lib/pushNotifications";
import { useAuth } from "../contexts/AuthContext";
import { openNotificationRoute } from "../lib/notificationRoutes";

export function PushNotificationBridge() {
  const { token } = useAuth();
  const register = useMutation(api.notifications.registerDevice);
  const opened = useMutation(api.notifications.opened);
  const savePrefs = useMutation(api.notifications.savePreferences);
  const savePrefsRef = useRef(savePrefs);
  savePrefsRef.current = savePrefs;
  // The mutation functions get a new identity on every render. Keeping them in refs stops this effect from re-running
  // (and calling the server again) over and over; it should only run when the person signs in or out.
  const registerRef = useRef(register);
  const openedRef = useRef(opened);
  registerRef.current = register;
  const lastToken = useRef<string | null>(null); // the token the server already has, so we never register the same one twice
  openedRef.current = opened;

  useEffect(() => {
    if (!token) return;
    void existingPushRegistration().then((device) => device && (lastToken.current = device.token, registerRef.current({ token, pushToken: device.token, platform: device.platform, deviceId: device.deviceId, permissionStatus: device.permissionStatus }))).catch(() => undefined);
    void openedRef.current({ token, kind: "app_opened" }).catch(() => undefined);
    // Choices made during setup are applied to the account as soon as the person is signed in.
    void AsyncStorage.getItem(PENDING_NOTIFICATION_PREFS_KEY).then(async (raw) => {
      if (!raw) return;
      await savePrefsRef.current({ token, ...JSON.parse(raw) });
      await AsyncStorage.removeItem(PENDING_NOTIFICATION_PREFS_KEY);
    }).catch(() => undefined);
    const appState = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      void openedRef.current({ token, kind: "app_opened" }).catch(() => undefined);
      // Permission can be granted after sign-in (onboarding, phone settings): connect the phone as soon as it is.
      void existingPushRegistration().then((device) => {
        if (!device || device.token === lastToken.current) return;
        lastToken.current = device.token;
        return registerRef.current({ token, pushToken: device.token, platform: device.platform, deviceId: device.deviceId, permissionStatus: device.permissionStatus });
      }).catch(() => undefined);
    });
    const response = Notifications.addNotificationResponseReceivedListener((event) => {
      const jobId = event.notification.request.content.data?.jobId;
      void openedRef.current({ token, kind: "opened", ...(typeof jobId === "string" ? { jobId } : {}) }).catch(() => undefined);
      openNotificationRoute(event.notification.request.content.data?.route);
    });
    // Firebase can change a phone's token at any time (reinstall, restore, refresh): tell the server straight away.
    // Firebase can change a phone's token at any time. The event itself carries the new token, so use it directly
    // (asking Firebase for the token again would fire this same event again, forever).
    const tokenRefresh = Notifications.addPushTokenListener((next) => {
      const fresh = typeof next.data === "string" ? next.data : null;
      if (!fresh || fresh === lastToken.current) return;
      lastToken.current = fresh;
      void deviceId().then((id) => registerRef.current({ token, pushToken: fresh, platform: "android", deviceId: id, permissionStatus: "granted" })).catch(() => undefined);
    });
    // The app was closed and a tap on a notification started it: open that screen too.
    void Notifications.getLastNotificationResponseAsync().then((event) => event && openNotificationRoute(event.notification.request.content.data?.route)).catch(() => undefined);
    return () => { appState.remove(); response.remove(); tokenRefresh.remove(); };
  }, [token]);
  return null;
}
