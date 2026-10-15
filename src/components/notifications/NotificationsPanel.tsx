import { useEffect, useState } from "react";
import { api, useAction, useMutation, useQuery, type PushPreferences } from "@mobile-lib/api";
import { useWebAuth } from "@/contexts/WebAuthContext";
import { IconBox, PrimaryButton, SecondaryButton, Surface } from "@/components/workspace/DesktopWorkspaceUI";
import { enableWebPush, markWebPushOff, webPushDeviceId, webPushStatus, type WebPushStatus } from "@/lib/webPush";

type Key = Exclude<keyof PushPreferences, "userId" | "timezone" | "updatedAt">;
const ROWS: { key: Key; title: string; detail: string; icon: string; tone: "blue" | "rose" | "teal" | "violet" }[] = [
  { key: "dailyReminder", title: "Daily reminder", detail: "A gentle nudge to keep your records current", icon: "fa-sun", tone: "teal" },
  { key: "invoiceReminders", title: "Invoice reminders", detail: "Before an invoice becomes due", icon: "fa-calendar", tone: "blue" },
  { key: "overdueReminders", title: "Overdue reminders", detail: "When an invoice passes its due date", icon: "fa-bell", tone: "rose" },
  { key: "paymentConfirmations", title: "Payment confirmations", detail: "When a customer payment is recorded", icon: "fa-circle-check", tone: "teal" },
  { key: "budgetAlerts", title: "Budget alerts", detail: "When spending approaches a limit", icon: "fa-chart-pie", tone: "rose" },
  { key: "weeklyReports", title: "Weekly reports", detail: "A weekly activity summary", icon: "fa-envelope", tone: "blue" },
  { key: "marketingUpdates", title: "Product updates", detail: "Tips, features, and company news", icon: "fa-bullhorn", tone: "violet" },
];

const zone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

/** Notification choices shared with the phone app, plus the switch for this browser. */
export function NotificationsPanel() {
  const { token } = useWebAuth();
  const prefs = useQuery(api.notifications.preferences, token ? { token } : "skip");
  const save = useMutation(api.notifications.savePreferences);
  const register = useMutation(api.notifications.registerDevice);
  const sendTest = useAction(api.notifications.test);
  const [status, setStatus] = useState<WebPushStatus>("unsupported");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => setStatus(webPushStatus()), []);

  async function toggle(key: Key) {
    if (!token || !prefs) return;
    await save({ token, ...prefs, [key]: !prefs[key], timezone: zone() });
  }

  async function turnOn() {
    if (!token) return;
    setBusy(true);
    setNote(null);
    try {
      const { token: pushToken, permission } = await enableWebPush();
      await register({ token, pushToken, platform: "web", deviceId: webPushDeviceId(), permissionStatus: permission });
      if (prefs) await save({ token, ...prefs, timezone: zone() });
      setStatus("enabled");
      setNote("Notifications are on for this browser.");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Could not turn notifications on.");
      setStatus(webPushStatus());
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    if (!token) return;
    setBusy(true);
    setNote(null);
    try {
      const r = await sendTest({ token });
      setNote(r.sent > 0 ? "Test sent. It should appear in a few seconds." : r.results.map((x) => x.error ?? "Not delivered").join(" "));
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Could not send the test.");
    } finally {
      setBusy(false);
    }
  }

  const detail: Record<WebPushStatus, string> = {
    unsupported: "This browser cannot show push notifications.",
    "not-configured": "Browser notifications are not switched on for this website yet.",
    denied: "Notifications are blocked for this site. Allow them in your browser settings, then reload.",
    ready: "Get reminders on this computer even when Receipt Cycle is closed.",
    enabled: "This browser will receive the reminders you choose below.",
  };

  return (
    <>
      <Surface className="mb-4 max-w-3xl">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <IconBox icon="fa-bell" tone="teal" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold">Browser notifications</p>
            <p className="mt-0.5 text-xs text-slate-500">{detail[status]}</p>
          </div>
          {status === "ready" ? <PrimaryButton onClick={() => void turnOn()}>{busy ? "Working…" : "Turn on"}</PrimaryButton> : null}
          {status === "enabled" ? (
            <>
              <SecondaryButton onClick={() => void test()}>{busy ? "Sending…" : "Send a test"}</SecondaryButton>
              <SecondaryButton onClick={() => { markWebPushOff(); setStatus("ready"); }}>Turn off here</SecondaryButton>
            </>
          ) : null}
        </div>
        {note ? <p className="border-t border-slate-100 px-4 py-3 text-xs font-semibold text-teal-700" role="status">{note}</p> : null}
      </Surface>

      <Surface className="max-w-3xl">
        <div>
          {ROWS.map((row) => (
            <div key={row.key} className="flex items-center gap-3 border-b border-slate-100 px-4 py-4 last:border-0">
              <IconBox icon={row.icon} tone={row.tone} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold">{row.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{row.detail}</p>
              </div>
              <button
                role="switch"
                aria-checked={prefs ? prefs[row.key] : false}
                aria-label={row.title}
                disabled={!prefs}
                onClick={() => void toggle(row.key)}
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${prefs?.[row.key] ? "bg-teal-600" : "bg-slate-200"}`}
              >
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${prefs?.[row.key] ? "left-5" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </Surface>
      <p className="mt-3 max-w-3xl text-xs leading-5 text-slate-500">These choices are saved to your account, so the web app and the phone app always match.</p>
    </>
  );
}
