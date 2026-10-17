import { useCallback, useEffect, useState } from "react";
import { api, useMutation } from "@mobile-lib/api";

type Spender = { userId: string; email: string | null; micros: number; calls: number };
type Locked = { userId: string; email: string | null; lockedUntil: number; reason: string; strikes: number; spentTodayMicros: number; spentMonthMicros: number };
type Settings = { dailyBudgetCents: number; monthlyBudgetCents: number; burstCalls: number; enabled: boolean };
type Overview = { settings: Settings; lockedUsers: Locked[]; topToday: Spender[]; topMonth: Spender[]; now: number };

const usd = (micros: number) => `$${(micros / 1_000_000).toFixed(2)}`;
const until = (t: number, now: number) => {
  const h = Math.max(1, Math.ceil((t - now) / 3_600_000));
  return h >= 48 ? `${Math.ceil(h / 24)} days` : `${h} hours`;
};

function Spenders({ title, rows }: { title: string; rows: Spender[] }) {
  return (
    <div className="min-w-0">
      <h4 className="text-sm font-semibold text-gray-900 mb-2">{title}</h4>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">No smart-feature use yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs">
                <th className="py-1 pr-2">Person</th>
                <th className="py-1 pr-2 text-right">Spent</th>
                <th className="py-1 text-right">Calls</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.userId} className="border-t border-gray-100">
                  <td className="py-1 pr-2 break-all">{r.email ?? r.userId}</td>
                  <td className="py-1 pr-2 text-right">{usd(r.micros)}</td>
                  <td className="py-1 text-right">{r.calls}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AiCostGuard({ secret, adminEmail }: { secret: string; adminEmail: string }) {
  const call = useMutation(api.admin.aiGuardCall);
  const [data, setData] = useState<Overview | null>(null);
  const [daily, setDaily] = useState("");
  const [monthly, setMonthly] = useState("");
  const [burst, setBurst] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (method: "GET" | "POST" | "PUT", path: string, body?: unknown) => (await call({ secret, adminEmail, actor: adminEmail, method, path, body })) as any,
    [call, secret, adminEmail],
  );
  const load = useCallback(async () => {
    try {
      const d = (await run("GET", "")) as Overview;
      setData(d);
      setDaily((d.settings.dailyBudgetCents / 100).toFixed(2));
      setMonthly((d.settings.monthlyBudgetCents / 100).toFixed(2));
      setBurst(String(d.settings.burstCalls));
      setEnabled(d.settings.enabled);
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Could not load." });
    }
  }, [run]);
  useEffect(() => {
    void load();
  }, [load]);

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      setMsg({ ok: true, text: ok });
      await load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  };

  const input = "h-9 w-full rounded-lg border border-gray-200 px-2 text-sm";
  const btn = "h-9 px-3 rounded-lg text-sm font-semibold disabled:opacity-60";

  return (
    <section className="bg-white rounded-2xl p-5 border border-gray-100 mb-6">
      <h3 className="text-lg font-bold text-gray-900">Smart-feature cost guard</h3>
      <p className="text-sm text-gray-500 mb-3">
        If someone uses scanning, voice or document reading far more than a normal person, or in rapid back-to-back bursts, those features pause for 24 hours (then 72 hours, then 7 days if it
        repeats). They stay subscribed and can still add transactions by hand.
      </p>
      {msg && <div className={`mb-3 rounded-lg text-sm p-3 ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{msg.text}</div>}
      {!data ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <>
          <form
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end mb-5"
            onSubmit={(e) => {
              e.preventDefault();
              void act(
                () =>
                  run("PUT", "/settings", {
                    dailyBudgetCents: Math.round(Number(daily) * 100),
                    monthlyBudgetCents: Math.round(Number(monthly) * 100),
                    burstCalls: Math.round(Number(burst)),
                    enabled,
                  }),
                "Saved.",
              );
            }}
          >
            <label className="text-sm text-gray-700">
              Daily smart-feature budget per person ($)
              <input className={input} type="number" min="0.01" step="0.01" value={daily} onChange={(e) => setDaily(e.target.value)} />
            </label>
            <label className="text-sm text-gray-700">
              Monthly budget per person ($)
              <input className={input} type="number" min="0.01" step="0.01" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
            </label>
            <label className="text-sm text-gray-700">
              Burst limit (calls per 10 minutes)
              <input className={input} type="number" min="1" step="1" value={burst} onChange={(e) => setBurst(e.target.value)} />
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
                Guard is {enabled ? "on" : "off"}
              </label>
              <button type="submit" disabled={busy} className={`${btn} bg-primary text-white`}>
                Save
              </button>
            </div>
          </form>

          <h4 className="text-sm font-semibold text-gray-900 mb-2">Paused right now</h4>
          {data.lockedUsers.length === 0 ? (
            <p className="text-sm text-gray-500 mb-5">Nobody is paused.</p>
          ) : (
            <div className="overflow-x-auto mb-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 text-xs">
                    <th className="py-1 pr-2">Person</th>
                    <th className="py-1 pr-2">Back in</th>
                    <th className="py-1 pr-2">Why</th>
                    <th className="py-1 pr-2">Times</th>
                    <th className="py-1 pr-2 text-right">Today</th>
                    <th className="py-1 pr-2 text-right">This month</th>
                    <th className="py-1" />
                  </tr>
                </thead>
                <tbody>
                  {data.lockedUsers.map((l) => (
                    <tr key={l.userId} className="border-t border-gray-100">
                      <td className="py-1 pr-2 break-all">{l.email ?? l.userId}</td>
                      <td className="py-1 pr-2">{until(l.lockedUntil, data.now)}</td>
                      <td className="py-1 pr-2">{l.reason}</td>
                      <td className="py-1 pr-2">{l.strikes}</td>
                      <td className="py-1 pr-2 text-right">{usd(l.spentTodayMicros)}</td>
                      <td className="py-1 pr-2 text-right">{usd(l.spentMonthMicros)}</td>
                      <td className="py-1 text-right">
                        <button disabled={busy} className={`${btn} bg-gray-100 text-gray-800`} onClick={() => void act(() => run("POST", "/unlock", { userId: l.userId }), "Unlocked.")}>
                          Unlock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <Spenders title="Top spenders today" rows={data.topToday} />
            <Spenders title="Top spenders this month" rows={data.topMonth} />
          </div>
        </>
      )}
    </section>
  );
}
