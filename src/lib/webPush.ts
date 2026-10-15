/**
 * Browser push notifications through Firebase Cloud Messaging. Everything here is loaded only when someone turns
 * notifications on, so it adds nothing to normal page loads. The Firebase web settings are public by design.
 */
import { FIREBASE_VAPID_KEY, FIREBASE_WEB_CONFIG, webPushConfigured } from "@/lib/publicEnv";

const DEVICE_KEY = "receiptcycle_push_device_id";

export type WebPushStatus = "unsupported" | "not-configured" | "denied" | "ready" | "enabled";

export function webPushDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return `web-${Date.now()}`;
  }
}

export function webPushStatus(): WebPushStatus {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("Notification" in window) || !("PushManager" in window)) return "unsupported";
  if (!webPushConfigured()) return "not-configured";
  if (Notification.permission === "denied") return "denied";
  return Notification.permission === "granted" && localStorage.getItem("receiptcycle_web_push_on") === "1" ? "enabled" : "ready";
}

async function registerWorker() {
  // The worker reads the public Firebase settings from its own address, so it needs no build step.
  const cfg = encodeURIComponent(JSON.stringify(FIREBASE_WEB_CONFIG));
  const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?cfg=${cfg}`, { scope: "/firebase-cloud-messaging-push-scope" });
  // The browser can only subscribe once the worker is fully active, which takes a moment on first install.
  const worker = registration.installing ?? registration.waiting ?? registration.active;
  if (worker && worker.state !== "activated") {
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error("The notification service did not start. Reload the page and try again.")), 15000);
      worker.addEventListener("statechange", () => {
        if (worker.state === "activated") {
          window.clearTimeout(timer);
          resolve();
        } else if (worker.state === "redundant") {
          window.clearTimeout(timer);
          reject(new Error("The notification service could not start. Check your connection and try again."));
        }
      });
    });
  }
  return registration;
}

/** Asks the browser for permission and returns this browser's push token. Throws a readable message on failure. */
export async function enableWebPush(): Promise<{ token: string; permission: NotificationPermission }> {
  const status = webPushStatus();
  if (status === "unsupported") throw new Error("This browser does not support notifications.");
  if (status === "not-configured") throw new Error("Notifications are not set up on this website yet.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notifications are blocked. Allow them for this site in your browser settings, then try again.");
  const { initializeApp, getApps, getApp } = await import("firebase/app");
  const { getMessaging, getToken, isSupported } = await import("firebase/messaging");
  if (!(await isSupported())) throw new Error("This browser cannot receive push notifications.");
  const app = getApps().length ? getApp() : initializeApp(FIREBASE_WEB_CONFIG);
  const registration = await registerWorker();
  const token = await getToken(getMessaging(app), { vapidKey: FIREBASE_VAPID_KEY, serviceWorkerRegistration: registration });
  if (!token) throw new Error("The browser did not return a notification token.");
  localStorage.setItem("receiptcycle_web_push_on", "1");
  return { token, permission };
}

export function markWebPushOff() {
  try {
    localStorage.removeItem("receiptcycle_web_push_on");
  } catch {
    /* ignore */
  }
}
