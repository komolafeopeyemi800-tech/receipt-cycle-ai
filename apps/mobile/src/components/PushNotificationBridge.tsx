import { useEffect } from "react";
import { AppState } from "react-native";
import * as Notifications from "expo-notifications";
import { api, useMutation } from "../lib/api";
import { existingPushRegistration } from "../lib/pushNotifications";
import { useAuth } from "../contexts/AuthContext";

export function PushNotificationBridge() {
  const { token } = useAuth();
  const register = useMutation(api.notifications.registerDevice);
  const opened = useMutation(api.notifications.opened);

  useEffect(() => {
    if (!token) return;
    void existingPushRegistration().then((device) => device && register({ token, pushToken: device.token, platform: device.platform, deviceId: device.deviceId, permissionStatus: device.permissionStatus })).catch(() => undefined);
    void opened({ token, kind: "app_opened" }).catch(() => undefined);
    const appState = AppState.addEventListener("change", (state) => { if (state === "active") void opened({ token, kind: "app_opened" }).catch(() => undefined); });
    const response = Notifications.addNotificationResponseReceivedListener((event) => {
      const jobId = event.notification.request.content.data?.jobId;
      void opened({ token, kind: "opened", ...(typeof jobId === "string" ? { jobId } : {}) }).catch(() => undefined);
    });
    // Firebase can change a phone's token at any time (reinstall, restore, refresh): tell the server straight away.
    const tokenRefresh = Notifications.addPushTokenListener((next) => {
      if (typeof next.data !== "string") return;
      void existingPushRegistration().then((device) => device && register({ token, pushToken: device.token, platform: device.platform, deviceId: device.deviceId, permissionStatus: device.permissionStatus })).catch(() => undefined);
    });
    return () => { appState.remove(); response.remove(); tokenRefresh.remove(); };
  }, [opened, register, token]);
  return null;
}
