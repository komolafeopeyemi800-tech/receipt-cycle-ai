import { useCallback, useEffect, useMemo, useState } from "react";
import { api, useMutation } from "@mobile-lib/api";

type Tpl = {
  key: string; name: string; category: string; title: string; body: string; route: string; enabled: boolean; kind: string; toggle: string; audience: string; weight: number;
  cooldownDays: number; bodyWebMention: string | null; sequenceDay: number | null; windowStart: number | null; windowEnd: number | null; delayMinutes: number | null; channels: string; version: number;
};
type Stat = { sent: number; failed: number; skipped: number; queued: number; opened: number };
type Campaign = { id: string; name: string; templateKey: string; status: string; queued: number; sendMode: string; sendAt: number | null; createdAt: number };
type Overview = { settings: Record<string, number | boolean | string>; templates: Tpl[]; stats: Record<string, Stat>; campaigns: Campaign[]; mergeFields: Record<string, number>; devices: { android: number; web: number; removed: number }; firebase: boolean };
type LogRow = { id: string; email: string; templateKey: string; category: string; title: string; status: string; reason: string | null; updatedAt: number };

const TITLE_MAX = 40, BODY_MAX = 100;
const KINDS = [["sequence", "Trial sequence"], ["pool", "Daily reminders"], ["event", "Events"], ["quota", "Quota"], ["campaign", "Campaigns"]] as const;
const SAMPLE: Record<string, string> = { first_name: "Alexander", amount: "$1,250.00", client: "Northwind Traders", invoice_no: "INV-0042", days: "3", category: "Groceries", percent: "80", count: "4", total: "$3,400.00", remaining: "5", limit: "25", offer_name: "Spring special", end_date: "May 30" };

function fill(text: string, extra: Record<string, string> = {}) {
  const v = { ...SAMPLE, ...extra };
  return text.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_m, k: string) => v[k] ?? "");
}
function worst(text: string, fields: Record<string, number>) {
  return text.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_m, k: string) => "x".repeat(fields[k] ?? 0)).length;
}
const ago = (t: number) => new Date(t).toLocaleString();

function Phone({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 w-full max-w-xs">
      <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-1"><span className="w-4 h-4 rounded bg-primary inline-block" />Receipt Cycle · now</div>
      <div className="text-sm font-semibold text-gray-900 break-words">{title || "Title"}</div>
      <div className="text-sm text-gray-700 break-words">{body || "Message"}</div>
    </div>
  );
}

export default function NotificationCenter({ secret, adminEmail }: { secret: string; adminEmail: string }) {
  const call = useMutation(api.admin.notificationAdminCall);
  const [tab, setTab] = useState<"templates" | "campaigns" | "log" | "user" | "settings">("templates");
  const [data, setData] = useState<Overview | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async (method: "GET" | "POST" | "PUT", path: string, body?: unknown, query?: Record<string, string>) =>
    (await call({ secret, adminEmail, actor: adminEmail, method, path, body, query })) as any, [call, secret, adminEmail]);
  const say = (ok: boolean, text: string) => setMsg({ ok, text });
  const guard = async <T,>(fn: () => Promise<T>, ok?: string): Promise<T | undefined> => {
    setBusy(true);
    try { const r = await fn(); if (ok) say(true, ok); return r; } catch (e) { say(false, e instanceof Error ? e.message : "Something went wrong."); } finally { setBusy(false); }
  };
  const load = useCallback(async () => { try { setData(await run("GET", "")); } catch (e) { say(false, e instanceof Error ? e.message : "Could not load."); } }, [run]);
  useEffect(() => { void load(); }, [load]);

  const btn = "h-9 px-3 rounded-lg text-sm font-semibold disabled:opacity-60";
  const input = "h-9 w-full rounded-lg border border-gray-200 px-2 text-sm";

  return (
    <section className="bg-white rounded-2xl p-5 border border-gray-100 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div><h3 className="text-lg font-bold text-gray-900">Notification Center</h3>
          <p className="text-sm text-gray-500">Every message the app can send: edit, switch off, re-time, preview, and see what was delivered.</p></div>
        {data && <div className="text-xs text-gray-600 text-right">
          <div>Firebase: <b className={data.firebase ? "text-emerald-700" : "text-red-600"}>{data.firebase ? "connected" : "not configured"}</b></div>
          <div>Devices: {data.devices.android} phone · {data.devices.web} browser</div></div>}
      </div>
      {data && !data.settings.globalEnabled && <div className="mb-3 rounded-lg bg-amber-50 text-amber-800 text-sm p-3">Sending is paused. Nothing is sent to anyone until you turn on “Global sending” in the Settings tab.</div>}
      {msg && <div className={`mb-3 rounded-lg text-sm p-3 ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{msg.text}</div>}
      <div className="flex flex-wrap gap-2 mb-4">
        {(["templates", "campaigns", "log", "user", "settings"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`${btn} ${tab === t ? "bg-primary text-white" : "bg-gray-100 text-gray-700"}`}>{({ templates: "Messages", campaigns: "Campaigns", log: "Delivery log", user: "Find a user", settings: "Settings" })[t]}</button>
        ))}
      </div>
      {!data ? <p className="text-sm text-gray-500">Loading…</p> : tab === "templates" ? <Templates data={data} run={run} guard={guard} reload={load} btn={btn} input={input} />
        : tab === "campaigns" ? <Campaigns data={data} run={run} guard={guard} reload={load} say={say} btn={btn} input={input} />
        : tab === "log" ? <Log run={run} guard={guard} btn={btn} input={input} />
        : tab === "user" ? <UserLookup run={run} guard={guard} btn={btn} input={input} />
        : <Settings data={data} run={run} guard={guard} reload={load} busy={busy} btn={btn} input={input} />}
    </section>
  );
}

type Common = { run: (m: "GET" | "POST" | "PUT", p: string, b?: unknown, q?: Record<string, string>) => Promise<any>; guard: <T>(f: () => Promise<T>, ok?: string) => Promise<T | undefined>; btn: string; input: string };

function Templates({ data, run, guard, reload, btn, input }: Common & { data: Overview; reload: () => Promise<void> }) {
  const [kind, setKind] = useState<string>("sequence");
  const [open, setOpen] = useState<string | null>(null);
  const list = useMemo(() => data.templates.filter((t) => t.kind === kind), [data, kind]);
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">{KINDS.map(([k, label]) => <button key={k} onClick={() => setKind(k)} className={`${btn} ${kind === k ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}>{label}</button>)}</div>
      <div className="space-y-2">
        {list.map((t) => {
          const s = data.stats[t.key];
          return (
            <div key={t.key} className="border border-gray-100 rounded-xl p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button className="text-left" onClick={() => setOpen(open === t.key ? null : t.key)}>
                  <div className="text-sm font-semibold text-gray-900">{t.sequenceDay ? `Day ${t.sequenceDay} · ` : ""}{t.name} <span className="text-xs text-gray-400">v{t.version}</span></div>
                  <div className="text-xs text-gray-500">{fill(t.title)} — {fill(t.body)}</div>
                </button>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {s && <span>{s.sent} sent · {s.opened} opened · {s.failed} failed · {s.skipped} skipped</span>}
                  <label className="flex items-center gap-1"><input type="checkbox" checked={t.enabled} disabled={t.enabled === undefined}
                    onChange={(e) => void guard(async () => { await run("PUT", `/templates/${t.key}`, { ...t, enabled: e.target.checked }); await reload(); }, e.target.checked ? "Turned on." : "Turned off.")} />On</label>
                </div>
              </div>
              {open === t.key && <Editor t={t} fields={data.mergeFields} run={run} guard={guard} reload={reload} btn={btn} input={input} />}
            </div>
          );
        })}
        {!list.length && <p className="text-sm text-gray-500">No messages in this group.</p>}
      </div>
    </div>
  );
}

function Editor({ t, fields, run, guard, reload, btn, input }: Common & { t: Tpl; fields: Record<string, number>; reload: () => Promise<void> }) {
  const [d, setD] = useState<Tpl>(t);
  const [problems, setProblems] = useState<string[]>([]);
  const [hist, setHist] = useState<{ version: number; updatedAt: number; updatedBy: string }[] | null>(null);
  const set = <K extends keyof Tpl>(k: K, v: Tpl[K]) => setD((x) => ({ ...x, [k]: v }));
  const tw = worst(d.title, fields), bw = worst(d.body, fields);
  const num = (v: string) => (v === "" ? null : Number(v));
  const save = async () => {
    setProblems([]);
    try { await guard(async () => { await run("PUT", `/templates/${t.key}`, d); await reload(); }, "Saved. The next messages use the new wording."); }
    catch { /* guard reports */ }
  };
  return (
    <div className="mt-3 grid md:grid-cols-2 gap-4 grid-cols-1">
      <div className="space-y-2">
        <label className="block text-xs text-gray-600">Title <span className={tw > TITLE_MAX ? "text-red-600 font-bold" : ""}>(longest case {tw}/{TITLE_MAX})</span>
          <input className={input} value={d.title} onChange={(e) => set("title", e.target.value)} /></label>
        <label className="block text-xs text-gray-600">Message <span className={bw > BODY_MAX ? "text-red-600 font-bold" : ""}>(longest case {bw}/{BODY_MAX})</span>
          <textarea className={`${input} h-20 py-1`} value={d.body} onChange={(e) => set("body", e.target.value)} /></label>
        <label className="block text-xs text-gray-600">Wording for web (optional)
          <textarea className={`${input} h-16 py-1`} value={d.bodyWebMention ?? ""} onChange={(e) => set("bodyWebMention", e.target.value || null)} /></label>
        <p className="text-[11px] text-gray-400">Fields: {Object.keys(fields).map((k) => `{{${k}}}`).join(" ")}</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-gray-600">Opens
            <input className={input} value={d.route} onChange={(e) => set("route", e.target.value)} /></label>
          <label className="text-xs text-gray-600">Audience
            <input className={input} value={d.audience} onChange={(e) => set("audience", e.target.value)} /></label>
          <label className="text-xs text-gray-600">Where
            <select className={input} value={d.channels} onChange={(e) => set("channels", e.target.value)}><option value="android,web">Phone + web</option><option value="android">Phone only</option><option value="web">Web only</option></select></label>
          {d.kind === "pool" && <>
            <label className="text-xs text-gray-600">How often it is picked (weight)
              <input type="number" className={input} value={d.weight} onChange={(e) => set("weight", Number(e.target.value))} /></label>
            <label className="text-xs text-gray-600">Do not repeat for (days)
              <input type="number" className={input} value={d.cooldownDays} onChange={(e) => set("cooldownDays", Number(e.target.value))} /></label>
          </>}
          {(d.kind === "sequence" || d.kind === "pool") && <>
            <label className="text-xs text-gray-600">Earliest hour (local)
              <input type="number" className={input} value={d.windowStart ?? ""} onChange={(e) => set("windowStart", num(e.target.value))} /></label>
            <label className="text-xs text-gray-600">Latest hour (local)
              <input type="number" className={input} value={d.windowEnd ?? ""} onChange={(e) => set("windowEnd", num(e.target.value))} /></label>
          </>}
          {d.kind === "event" && <label className="text-xs text-gray-600">Delay after the event (minutes)
            <input type="number" className={input} value={d.delayMinutes ?? ""} onChange={(e) => set("delayMinutes", num(e.target.value))} /></label>}
        </div>
        {problems.length > 0 && <ul className="text-xs text-red-600 list-disc pl-4">{problems.map((p) => <li key={p}>{p}</li>)}</ul>}
        <div className="flex flex-wrap gap-2">
          <button className={`${btn} bg-primary text-white`} onClick={() => void save()}>Save</button>
          <button className={`${btn} bg-gray-100 text-gray-700`} onClick={() => setD(t)}>Undo changes</button>
          <button className={`${btn} bg-gray-100 text-gray-700`} onClick={() => void guard(async () => setHist(await run("GET", `/templates/${t.key}/history`)))}>History</button>
        </div>
        {hist && <ul className="text-xs text-gray-600 space-y-1">{hist.map((h) => (
          <li key={h.version} className="flex justify-between gap-2"><span>v{h.version} · {ago(h.updatedAt)} · {h.updatedBy}</span>
            <button className="text-primary font-semibold" onClick={() => void guard(async () => { await run("POST", `/templates/${t.key}/restore`, { version: h.version }); await reload(); }, `Restored v${h.version}.`)}>Restore</button></li>))}
          {!hist.length && <li>No earlier versions.</li>}</ul>}
      </div>
      <div className="space-y-3">
        <div className="text-xs text-gray-500">Preview with sample values</div>
        <Phone title={fill(d.title)} body={fill(d.body)} />
        {d.bodyWebMention && <><div className="text-xs text-gray-500">Web wording</div><Phone title={fill(d.title)} body={fill(d.bodyWebMention)} /></>}
      </div>
    </div>
  );
}

function Campaigns({ data, run, guard, reload, say, btn, input }: Common & { data: Overview; reload: () => Promise<void>; say: (ok: boolean, t: string) => void }) {
  const templates = data.templates.filter((t) => t.kind === "campaign");
  const [name, setName] = useState("");
  const [key, setKey] = useState(templates[0]?.key ?? "");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [plan, setPlan] = useState("all");
  const [platform, setPlatform] = useState("any");
  const [mode, setMode] = useState("now");
  const [at, setAt] = useState("");
  const [info, setInfo] = useState<Record<string, string>>({});
  const t = templates.find((x) => x.key === key);
  const needed = t ? [...new Set([...(t.title + t.body).matchAll(/\{\{\s*([a-z_]+)\s*\}\}/g)].map((m) => m[1]).filter((f) => f !== "first_name"))] : [];
  const create = () => guard(async () => {
    await run("POST", "/campaigns", { name, templateKey: key, fields, audience: { plan, platform }, sendMode: mode, sendAt: mode === "at" && at ? new Date(at).getTime() : null });
    setName(""); await reload();
  }, "Draft saved.");
  return (
    <div className="space-y-4">
      <div className="border border-gray-100 rounded-xl p-3 space-y-2">
        <div className="text-sm font-semibold">New campaign</div>
        <div className="grid md:grid-cols-3 grid-cols-1 gap-2">
          <input className={input} placeholder="Campaign name" value={name} onChange={(e) => setName(e.target.value)} />
          <select className={input} value={key} onChange={(e) => { setKey(e.target.value); setFields({}); }}>{templates.map((x) => <option key={x.key} value={x.key}>{x.name}</option>)}</select>
          <select className={input} value={plan} onChange={(e) => setPlan(e.target.value)}><option value="all">Everyone</option><option value="trial">In trial</option><option value="paid">Paid</option><option value="expired_free">Trial ended, free</option><option value="cancelled">Cancelled</option></select>
          <select className={input} value={platform} onChange={(e) => setPlatform(e.target.value)}><option value="any">Phone + web</option><option value="android">Phone</option><option value="web">Web</option></select>
          <select className={input} value={mode} onChange={(e) => setMode(e.target.value)}><option value="now">Send now</option><option value="at">Send at a time</option><option value="local">10:00 in each person's time</option></select>
          {mode === "at" && <input type="datetime-local" className={input} value={at} onChange={(e) => setAt(e.target.value)} />}
        </div>
        {needed.length > 0 && <div className="grid md:grid-cols-3 grid-cols-1 gap-2">{needed.map((f) => (
          <label key={f} className="text-xs text-gray-600">{f} <span className="text-gray-400">(max {data.mergeFields[f] ?? "?"})</span>
            <input className={input} value={fields[f] ?? ""} onChange={(e) => setFields({ ...fields, [f]: e.target.value })} /></label>))}</div>}
        {t && <Phone title={fill(t.title, fields)} body={fill(t.body, fields)} />}
        <button disabled={!name || !key} className={`${btn} bg-primary text-white`} onClick={() => void create()}>Save draft</button>
      </div>
      <div className="space-y-2">
        {data.campaigns.map((c) => (
          <div key={c.id} className="border border-gray-100 rounded-xl p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><b>{c.name}</b> <span className="text-xs text-gray-500">· {c.status} · {c.queued} queued · {ago(c.createdAt)}</span>
                {info[c.id] && <div className="text-xs text-gray-600">{info[c.id]}</div>}</div>
              <div className="flex flex-wrap gap-2">
                <button className={`${btn} bg-gray-100`} onClick={() => void guard(async () => { const r = await run("POST", `/campaigns/${c.id}/audience`); setInfo({ ...info, [c.id]: `${r.recipients} people will receive it. ${r.excludedMarketingOff} left out (marketing off), ${r.excludedByFilter} not in the audience.` }); })}>Who gets it</button>
                <button className={`${btn} bg-gray-100`} onClick={() => void guard(async () => { const r = await run("POST", `/campaigns/${c.id}/test`); say(true, `Test sent to ${r.sent} of your devices.`); })}>Send to me</button>
                {["draft", "scheduled"].includes(c.status) && <button className={`${btn} bg-emerald-600 text-white`} onClick={() => { if (confirm(`Send “${c.name}” to the audience?`)) void guard(async () => { const r = await run("POST", `/campaigns/${c.id}/send`); say(true, `${r.queued} messages queued.`); await reload(); }); }}>Send</button>}
                {["sending", "scheduled"].includes(c.status) && <button className={`${btn} bg-red-50 text-red-700`} onClick={() => void guard(async () => { await run("POST", `/campaigns/${c.id}/cancel`); await reload(); }, "Cancelled. Waiting messages will not be sent.")}>Cancel</button>}
              </div>
            </div>
          </div>))}
        {!data.campaigns.length && <p className="text-sm text-gray-500">No campaigns yet.</p>}
        <button className={`${btn} bg-red-50 text-red-700`} onClick={() => { if (confirm("Cancel every waiting campaign message?")) void guard(async () => { const r = await run("POST", "/campaigns-pause-all"); say(true, `${r.cancelled} waiting messages cancelled.`); }); }}>Pause all campaigns</button>
      </div>
    </div>
  );
}

function Log({ run, guard, btn, input }: Common) {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const load = useCallback(() => guard(async () => setRows(await run("GET", "/log", undefined, { ...(status ? { status } : {}), ...(q ? { q } : {}) }))), [run, guard, status, q]);
  useEffect(() => { void load(); }, [load]);
  const csv = () => {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const text = ["time,user,template,category,status,reason,title", ...rows.map((r) => [new Date(r.updatedAt).toISOString(), r.email, r.templateKey, r.category, r.status, r.reason, r.title].map(esc).join(","))].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" })); a.download = "notification-log.csv"; a.click();
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        <select className={`${input} !w-40`} value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All results</option><option value="sent">Sent</option><option value="skipped">Skipped</option><option value="failed">Failed</option><option value="cancelled">Cancelled</option><option value="queued">Waiting</option></select>
        <input className={`${input} !w-56`} placeholder="Search by email" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className={`${btn} bg-gray-100`} onClick={() => void load()}>Refresh</button>
        <button className={`${btn} bg-gray-100`} onClick={csv}>Download CSV</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs"><thead><tr className="text-left text-gray-500"><th className="p-1">When</th><th>User</th><th>Message</th><th>Result</th><th>Why</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id} className="border-t border-gray-100"><td className="p-1 whitespace-nowrap">{ago(r.updatedAt)}</td><td>{r.email}</td><td>{r.templateKey}</td><td>{r.status}</td><td>{r.reason ?? ""}</td></tr>)}</tbody></table>
        {!rows.length && <p className="text-sm text-gray-500 p-2">Nothing here yet.</p>}
      </div>
    </div>
  );
}

function UserLookup({ run, guard, btn, input }: Common) {
  const [email, setEmail] = useState("");
  const [r, setR] = useState<any>(null);
  return (
    <div className="space-y-3">
      <div className="flex gap-2"><input className={input} placeholder="user@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className={`${btn} bg-primary text-white`} onClick={() => void guard(async () => setR(await run("GET", "/user", undefined, { email })))}>Look up</button></div>
      {r && <div className="text-sm space-y-2">
        <div><b>{r.user.name}</b> · {r.user.email} · {r.plan}</div>
        <div className="text-xs text-gray-600">Devices: {r.devices.map((d: any) => `${d.platform}${d.active ? "" : " (off)"}`).join(", ") || "none"} · Last opened: {r.lastOpenAt ? ago(r.lastOpenAt) : "never"} · Time zone: {r.prefs?.timezone ?? "unknown"}</div>
        <div className="text-xs text-gray-600">Switches: {r.prefs ? Object.entries(r.prefs).filter(([, v]) => typeof v === "boolean").map(([k, v]) => `${k}: ${v ? "on" : "off"}`).join(" · ") : "defaults"}</div>
        <table className="w-full text-xs"><thead><tr className="text-left text-gray-500"><th>Message</th><th>Result</th><th>Why</th><th>Planned for</th></tr></thead>
          <tbody>{r.jobs.map((j: any) => <tr key={j.id} className="border-t border-gray-100"><td>{j.template}</td><td>{j.status}</td><td>{j.reason ?? ""}</td><td>{ago(j.scheduledFor)}</td></tr>)}</tbody></table>
      </div>}
    </div>
  );
}

const SWITCHES: [string, string][] = [["globalEnabled", "Global sending"], ["lifecycleEnabled", "Trial sequence"], ["remindersEnabled", "Daily reminders"], ["transactionalEnabled", "Event messages"], ["marketingEnabled", "Campaigns"], ["androidOfferCampaignsEnabled", "Offer campaigns on phone"], ["backoffEnabled", "Slow down for people who ignore us"], ["webAccessMentionsAndroid", "Mention web access on phone"]];
const NUMBERS: [string, string, number, number][] = [["quietHoursStart", "Quiet from (hour)", 0, 23], ["quietHoursEnd", "Quiet until (hour)", 0, 23], ["combinedDailyCap", "Max per person per day", 1, 50], ["transactionalDailyCap", "Max event messages per day", 1, 50], ["lifecycleDailyCap", "Max trial messages per day", 1, 10], ["dailyReminderCap", "Max reminders per day", 1, 10], ["marketingDailyCap", "Max campaigns per day", 1, 10], ["campaignsPerWeek", "Max campaigns per week", 1, 21], ["campaignMinGapHours", "Hours between campaigns", 0, 240], ["jobExpiryHours", "Drop a message after (hours)", 1, 72]];

function Settings({ data, run, guard, reload, btn, input }: Common & { data: Overview; reload: () => Promise<void>; busy: boolean }) {
  const [s, setS] = useState<Record<string, any>>(() => { const { key: _k, updatedAt: _u, updatedBy: _b, ...rest } = data.settings as Record<string, any>; return rest; });
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 grid-cols-1 gap-2">{SWITCHES.map(([k, label]) => (
        <label key={k} className="flex items-center gap-2 text-sm border border-gray-100 rounded-lg p-2"><input type="checkbox" checked={Boolean(s[k])} onChange={(e) => setS({ ...s, [k]: e.target.checked })} />{label}</label>))}</div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">{NUMBERS.map(([k, label, min, max]) => (
        <label key={k} className="text-xs text-gray-600">{label}<input type="number" min={min} max={max} className={input} value={s[k] ?? ""} onChange={(e) => setS({ ...s, [k]: Number(e.target.value) })} /></label>))}</div>
      <button className={`${btn} bg-primary text-white`} onClick={() => void guard(async () => { await run("PUT", "/settings", s); await reload(); }, "Settings saved.")}>Save settings</button>
    </div>
  );
}
