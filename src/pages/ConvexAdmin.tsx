import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Link, useNavigate } from "react-router-dom";

const STORAGE_KEY = "receiptcycle_admin_secret";
const ADMIN_EMAIL_KEY = "receiptcycle_admin_email";

function fmtNum(n: number) {
  return new Intl.NumberFormat().format(n);
}

function pct(n: number) {
  return `${n >= 0 ? "+" : ""}${n}%`;
}

export default function ConvexAdmin() {
  const navigate = useNavigate();
  const [adminEmailInput, setAdminEmailInput] = useState(
    () => localStorage.getItem(ADMIN_EMAIL_KEY) ?? "komolafebamidele@rocketmail.com",
  );
  const [adminEmail, setAdminEmail] = useState(
    () => localStorage.getItem(ADMIN_EMAIL_KEY) ?? "komolafebamidele@rocketmail.com",
  );
  const [secretInput, setSecretInput] = useState(() => localStorage.getItem(STORAGE_KEY) ?? "");
  const [secret, setSecret] = useState(() => localStorage.getItem(STORAGE_KEY) ?? "");
  const [authChecking, setAuthChecking] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [health, setHealth] = useState<null | { timestamp: number; ocr: unknown }>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [query, setQuery] = useState("");

  const authArgs = authReady && secret && adminEmail ? { secret, adminEmail } : null;
  const stats = useQuery(api.admin.dashboardStats, authArgs ? authArgs : "skip");
  const config = useQuery(api.admin.adminConfig, authArgs ? authArgs : "skip");
  const logs = useQuery(api.admin.recentAuditLogs, authArgs ? { ...authArgs, limit: 40 } : "skip");
  const users = useQuery(api.admin.recentUsers, authArgs ? { ...authArgs, limit: 12 } : "skip");
  const updateConfig = useMutation(api.admin.updateConfig);
  const fetchHealth = useAction(api.admin.systemHealth);
  const validateAccess = useAction(api.admin.validateAccess);
  const monthly = stats?.monthly ?? [];
  const maxMonthly = Math.max(1, ...monthly.map((m) => m.users));
  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users ?? [];
    return (users ?? []).filter((u) => u.email.toLowerCase().includes(q) || (u.name ?? "").toLowerCase().includes(q));
  }, [query, users]);

  const [draft, setDraft] = useState({
    maintenanceMode: false,
    scannerEnabled: true,
    uploadEnabled: true,
    manualAddEnabled: true,
    exportEnabled: true,
    webDashboardEnabled: true,
    webTransactionsEnabled: true,
    webUploadEnabled: true,
    webSettingsEnabled: true,
    mobileScanPageEnabled: true,
    mobileUploadPageEnabled: true,
    mobileAddPageEnabled: true,
    adminManagedPreferences: false,
    prefReimbursements: false,
    prefTxnNumber: false,
    prefScanPayment: true,
    prefRequirePay: false,
    prefRequireNotes: false,
    freeCameraLimit: 20,
    freeUploadLimit: 20,
    freeManualLimit: 60,
  });

  useEffect(() => {
    if (!config) return;
    setDraft({
      maintenanceMode: config.maintenanceMode,
      scannerEnabled: config.scannerEnabled,
      uploadEnabled: config.uploadEnabled,
      manualAddEnabled: config.manualAddEnabled,
      exportEnabled: config.exportEnabled,
      webDashboardEnabled: config.webDashboardEnabled,
      webTransactionsEnabled: config.webTransactionsEnabled,
      webUploadEnabled: config.webUploadEnabled,
      webSettingsEnabled: config.webSettingsEnabled,
      mobileScanPageEnabled: config.mobileScanPageEnabled,
      mobileUploadPageEnabled: config.mobileUploadPageEnabled,
      mobileAddPageEnabled: config.mobileAddPageEnabled,
      adminManagedPreferences: config.adminManagedPreferences,
      prefReimbursements: config.prefReimbursements ?? false,
      prefTxnNumber: config.prefTxnNumber ?? false,
      prefScanPayment: config.prefScanPayment ?? true,
      prefRequirePay: config.prefRequirePay ?? false,
      prefRequireNotes: config.prefRequireNotes ?? false,
      freeCameraLimit: config.freeCameraLimit,
      freeUploadLimit: config.freeUploadLimit,
      freeManualLimit: config.freeManualLimit,
    });
  }, [config]);

  async function saveControls() {
    const effectiveSecret = (secret || secretInput).trim();
    const effectiveEmail = (adminEmail || adminEmailInput).trim().toLowerCase();
    if (!effectiveSecret || !effectiveEmail) {
      setMsg("Enter admin email and secret first.");
      return;
    }
    if (!secret || !adminEmail) {
      setSecret(effectiveSecret);
      setAdminEmail(effectiveEmail);
      localStorage.setItem(STORAGE_KEY, effectiveSecret);
      localStorage.setItem(ADMIN_EMAIL_KEY, effectiveEmail);
    }
    setSaving(true);
    setMsg(null);
    try {
      await updateConfig({
        secret: effectiveSecret,
        adminEmail: effectiveEmail,
        actor: "admin-web",
        ...draft,
      });
      setMsg("Admin settings updated.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to update settings.");
    } finally {
      setSaving(false);
    }
  }

  async function onSaveSubmit(e: FormEvent) {
    e.preventDefault();
    await saveControls();
  }

  async function onAuthSubmit(e: FormEvent) {
    e.preventDefault();
    const s = secretInput.trim();
    const email = adminEmailInput.trim().toLowerCase();
    if (!s || !email) {
      setMsg("Enter admin email and secret.");
      return;
    }
    setAuthChecking(true);
    setMsg(null);
    try {
      await validateAccess({ secret: s, adminEmail: email });
      setSecret(s);
      setAdminEmail(email);
      setAuthReady(true);
      localStorage.setItem(STORAGE_KEY, s);
      localStorage.setItem(ADMIN_EMAIL_KEY, email);
      setMsg("Admin unlocked.");
    } catch (err) {
      setAuthReady(false);
      setMsg(err instanceof Error ? err.message : "Access denied.");
    } finally {
      setAuthChecking(false);
    }
  }

  async function onRefreshHealth() {
    const effectiveSecret = (secret || secretInput).trim();
    const effectiveEmail = (adminEmail || adminEmailInput).trim().toLowerCase();
    if (!effectiveSecret || !effectiveEmail) {
      setMsg("Enter admin email and secret first.");
      return;
    }
    setHealthLoading(true);
    try {
      const out = await fetchHealth({ secret: effectiveSecret, adminEmail: effectiveEmail });
      setHealth({ timestamp: out.timestamp, ocr: out.ocr });
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed to load system health.");
    } finally {
      setHealthLoading(false);
    }
  }

  return (
    <div className="font-sans bg-gray-50 min-h-screen">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-50">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center">
                <i className="fas fa-receipt text-white text-sm" />
              </div>
              <span className="font-bold text-gray-900">Receipt Cycle</span>
            </div>
            <nav className="flex items-center gap-2 text-sm">
              <Link to="/dashboard" className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50"><i className="fas fa-home mr-2" />Dashboard</Link>
              <Link to="/transactions" className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50"><i className="fas fa-exchange-alt mr-2" />Transactions</Link>
              <Link to="/admin" className="px-3 py-2 rounded-lg bg-primary/10 text-primary font-semibold"><i className="fas fa-user-shield mr-2" />Admin</Link>
            </nav>
          </div>
          <button
            type="button"
            onClick={() => navigate("/transactions")}
            className="h-10 px-4 bg-gradient-to-r from-primary to-teal-600 text-white rounded-lg text-sm font-semibold"
          >
            + Add Transaction
          </button>
        </div>
      </header>

      <aside className="fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-100 p-4 overflow-y-auto">
        <div className="bg-gradient-to-br from-primary/10 to-teal-50 rounded-xl p-4 mb-5">
          <div className="text-xs text-gray-600">This Month's Balance</div>
          <div className="text-2xl font-bold text-gray-900">$0</div>
          <div className="text-xs text-primary font-semibold">0.0% savings rate</div>
        </div>
        <nav className="space-y-1 text-sm mb-5">
          <button type="button" onClick={() => navigate("/dashboard")} className="w-full text-left px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50">Dashboard</button>
          <button type="button" onClick={() => navigate("/transactions")} className="w-full text-left px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50">Transactions</button>
          <button type="button" onClick={() => navigate("/transactions")} className="w-full text-left px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50">Add Transaction</button>
          <button type="button" onClick={() => navigate("/dashboard")} className="w-full text-left px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50">Insights</button>
          <button type="button" onClick={() => navigate("/dashboard")} className="w-full text-left px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50">Notifications</button>
          <button type="button" onClick={() => navigate("/settings")} className="w-full text-left px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50">Settings</button>
        </nav>
        <div className="bg-gray-900 text-white rounded-xl p-4 mb-4">
          <div className="font-semibold text-sm mb-1">Upgrade to Pro</div>
          <div className="text-xs text-gray-300 mb-3">Unlock unlimited scans, AI insights & more</div>
          <button type="button" onClick={() => navigate("/pricing")} className="w-full h-9 rounded-lg bg-white text-gray-900 text-xs font-semibold">View Plans</button>
        </div>
        <div className="px-3 py-2 rounded-lg bg-purple-100 text-purple-700 text-sm font-semibold">Admin Panel</div>
      </aside>

      <main className="pl-64 pt-16">
        <div className="p-6 max-w-[1400px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Developer Console & Analytics</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => void onRefreshHealth()} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold text-gray-700">Refresh</button>
              <button type="button" onClick={() => void saveControls()} className="px-4 py-2 bg-primary rounded-lg text-sm font-semibold text-white">Save Controls</button>
            </div>
          </div>

          <form onSubmit={onAuthSubmit} className="bg-white rounded-2xl p-4 border border-gray-100 mb-4">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-3">
              <input value={adminEmailInput} onChange={(e) => setAdminEmailInput(e.target.value)} placeholder="Admin email" className="h-10 px-3 rounded-lg border border-gray-200 text-sm" />
              <input value={secretInput} onChange={(e) => setSecretInput(e.target.value)} placeholder="Admin secret" className="h-10 px-3 rounded-lg border border-gray-200 text-sm" />
              <button disabled={authChecking} className="h-10 px-4 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-60">
                {authChecking ? "Checking..." : "Unlock"}
              </button>
            </div>
            {msg ? <div className={`mt-3 text-xs ${msg.includes("updated") ? "text-emerald-600" : "text-rose-600"}`}>{msg}</div> : null}
          </form>

          {!authReady ? (
            <div className="bg-white rounded-2xl p-6 border border-gray-100">Unlock admin to load all controls and analytics.</div>
          ) : (
            <>
              <section className="grid grid-cols-4 gap-4 mb-6">
                <StatCard title="Total Users" value={stats ? fmtNum(stats.totals.users) : "--"} sub={stats ? `+${fmtNum(stats.growth.users30)} this month` : "loading"} icon="fa-users" />
                <StatCard title="Active Users (30d)" value={stats ? fmtNum(stats.growth.activeUsers30) : "--"} sub={stats ? `${pct(stats.growth.activeGrowthPct)}` : "loading"} icon="fa-user-check" />
                <StatCard title="Transactions" value={stats ? fmtNum(stats.totals.transactions) : "--"} sub={stats ? `+${fmtNum(stats.growth.tx30)} this month` : "loading"} icon="fa-exchange-alt" />
                <StatCard title="New User Growth" value={stats ? pct(stats.growth.userGrowthPct) : "--"} sub="vs previous 30d" icon="fa-arrow-trend-up" />
              </section>

              <section className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">User Growth</h2>
                    <span className="text-sm text-gray-500">Last 6 months</span>
                  </div>
                  <div className="h-64 bg-gradient-to-t from-primary/10 to-transparent rounded-xl border border-gray-100 p-4">
                    <svg viewBox="0 0 100 40" className="w-full h-full">
                      <polyline
                        fill="none"
                        stroke="#0f766e"
                        strokeWidth="2"
                        points={monthly.map((m, i) => `${(i / Math.max(1, monthly.length - 1)) * 100},${38 - (m.users / maxMonthly) * 30}`).join(" ")}
                      />
                    </svg>
                    <div className="text-xs text-gray-500 mt-2">{monthly.map((m) => m.month).join(" • ")}</div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Revenue by Plan</h2>
                    <span className="text-sm text-gray-500">This Month</span>
                  </div>
                  <div className="h-64 flex items-center justify-center">
                    <div className="w-48 h-48 rounded-full" style={{ background: "conic-gradient(#10b981 0 62%, #34d399 62% 86%, #a7f3d0 86% 100%)" }}>
                      <div className="w-24 h-24 rounded-full bg-white m-auto mt-12" />
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-gradient-to-br from-primary/5 to-teal-50 rounded-2xl p-6 border border-primary/10 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Subscription Breakdown</h3>
                  <span className="text-sm text-gray-500">This Month</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <SmallCard label="Weekly Plans" value={fmtNum(Math.max(0, Math.floor((stats?.totals.users ?? 0) * 0.2)))} sub="$2.8K" />
                  <SmallCard label="Monthly Plans" value={fmtNum(Math.max(0, Math.floor((stats?.totals.users ?? 0) * 0.35)))} sub="$20.4K" />
                  <SmallCard label="Yearly Plans" value={fmtNum(Math.max(0, Math.floor((stats?.totals.users ?? 0) * 0.25)))} sub="$148.5K" />
                </div>
              </section>

              <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">User Management</h3>
                  <div className="flex items-center gap-3">
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users..." className="w-64 h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm" />
                    <button type="button" className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700">Filter</button>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Last Active</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((u) => (
                      <tr key={String(u.id)} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{u.name ?? u.email.split("@")[0]}</div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700">Active</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary">
                            {u.googleLinked ? "Premium" : "Free"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{new Date(u.createdAt).toLocaleString()}</td>
                        <td className="px-6 py-4 text-center text-gray-400">
                          <i className="fas fa-ellipsis-h" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                  <span>Showing {filteredUsers.length} of {(users ?? []).length} users</span>
                  <div className="flex gap-2">
                    <button type="button" className="px-3 py-1.5 bg-gray-100 rounded-lg">Previous</button>
                    <button type="button" className="px-3 py-1.5 bg-primary text-white rounded-lg">Next</button>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-2 gap-6">
                <form onSubmit={onSaveSubmit} className="bg-white rounded-2xl p-5 border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">System Controls</h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <Toggle label="Maintenance" checked={draft.maintenanceMode} onChange={(v) => setDraft((d) => ({ ...d, maintenanceMode: v }))} />
                    <Toggle label="Scanner" checked={draft.scannerEnabled} onChange={(v) => setDraft((d) => ({ ...d, scannerEnabled: v }))} />
                    <Toggle label="Upload" checked={draft.uploadEnabled} onChange={(v) => setDraft((d) => ({ ...d, uploadEnabled: v }))} />
                    <Toggle label="Manual Add" checked={draft.manualAddEnabled} onChange={(v) => setDraft((d) => ({ ...d, manualAddEnabled: v }))} />
                    <Toggle label="Web Dashboard" checked={draft.webDashboardEnabled} onChange={(v) => setDraft((d) => ({ ...d, webDashboardEnabled: v }))} />
                    <Toggle label="Web Transactions" checked={draft.webTransactionsEnabled} onChange={(v) => setDraft((d) => ({ ...d, webTransactionsEnabled: v }))} />
                    <Toggle label="Web Upload" checked={draft.webUploadEnabled} onChange={(v) => setDraft((d) => ({ ...d, webUploadEnabled: v }))} />
                    <Toggle label="Web Settings" checked={draft.webSettingsEnabled} onChange={(v) => setDraft((d) => ({ ...d, webSettingsEnabled: v }))} />
                    <Toggle label="Mobile Scan Page" checked={draft.mobileScanPageEnabled} onChange={(v) => setDraft((d) => ({ ...d, mobileScanPageEnabled: v }))} />
                    <Toggle label="Mobile Upload Page" checked={draft.mobileUploadPageEnabled} onChange={(v) => setDraft((d) => ({ ...d, mobileUploadPageEnabled: v }))} />
                    <Toggle label="Mobile Add Page" checked={draft.mobileAddPageEnabled} onChange={(v) => setDraft((d) => ({ ...d, mobileAddPageEnabled: v }))} />
                    <Toggle label="Export" checked={draft.exportEnabled} onChange={(v) => setDraft((d) => ({ ...d, exportEnabled: v }))} />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 mb-2 mt-2">Settings Governance</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <Toggle
                      label="Admin manages user settings"
                      checked={draft.adminManagedPreferences}
                      onChange={(v) => setDraft((d) => ({ ...d, adminManagedPreferences: v }))}
                    />
                    <Toggle label="Reimbursements" checked={draft.prefReimbursements} onChange={(v) => setDraft((d) => ({ ...d, prefReimbursements: v }))} />
                    <Toggle label="Transaction number" checked={draft.prefTxnNumber} onChange={(v) => setDraft((d) => ({ ...d, prefTxnNumber: v }))} />
                    <Toggle label="Scan payment method" checked={draft.prefScanPayment} onChange={(v) => setDraft((d) => ({ ...d, prefScanPayment: v }))} />
                    <Toggle label="Require payment method" checked={draft.prefRequirePay} onChange={(v) => setDraft((d) => ({ ...d, prefRequirePay: v }))} />
                    <Toggle label="Require expense notes" checked={draft.prefRequireNotes} onChange={(v) => setDraft((d) => ({ ...d, prefRequireNotes: v }))} />
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <Limit label="Camera limit" value={draft.freeCameraLimit} onChange={(v) => setDraft((d) => ({ ...d, freeCameraLimit: v }))} />
                    <Limit label="Upload limit" value={draft.freeUploadLimit} onChange={(v) => setDraft((d) => ({ ...d, freeUploadLimit: v }))} />
                    <Limit label="Manual limit" value={draft.freeManualLimit} onChange={(v) => setDraft((d) => ({ ...d, freeManualLimit: v }))} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button disabled={saving} className="h-10 px-4 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-60">
                      {saving ? "Saving..." : "Save controls"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          maintenanceMode: false,
                          scannerEnabled: true,
                          uploadEnabled: true,
                          manualAddEnabled: true,
                          exportEnabled: true,
                          webDashboardEnabled: true,
                          webTransactionsEnabled: true,
                          webUploadEnabled: true,
                          webSettingsEnabled: true,
                          mobileScanPageEnabled: true,
                          mobileUploadPageEnabled: true,
                          mobileAddPageEnabled: true,
                        }))
                      }
                      className="h-10 px-4 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold"
                    >
                      Enable all pages
                    </button>
                  </div>
                </form>

                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">System Health</h3>
                  <button type="button" onClick={() => void onRefreshHealth()} className="px-4 py-2 rounded-lg bg-gray-100 text-sm font-semibold text-gray-700 mb-3">
                    {healthLoading ? "Checking..." : "Refresh health"}
                  </button>
                  {!health ? (
                    <p className="text-sm text-gray-500">Run check to load OCR provider health.</p>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500 mb-2">Updated: {new Date(health.timestamp).toLocaleString()}</p>
                      <pre className="text-xs bg-gray-50 rounded-lg border border-gray-100 p-3 max-h-64 overflow-auto whitespace-pre-wrap">
                        {JSON.stringify(health.ocr, null, 2)}
                      </pre>
                    </>
                  )}
                  <div className="mt-4">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Recent audit logs</h4>
                    <div className="space-y-2 max-h-40 overflow-auto">
                      {(logs ?? []).slice(0, 8).map((l) => (
                        <div key={String(l._id)} className="p-2 rounded-lg bg-gray-50 border-l-4 border-primary">
                          <div className="text-sm font-semibold">{l.action}</div>
                          <div className="text-xs text-gray-500">{l.actor} • {new Date(l.createdAt).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function Limit({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-gray-600 font-semibold">{label}</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number.parseInt(e.target.value || "0", 10) || 0))}
        className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 text-sm"
      />
    </label>
  );
}

function StatCard({
  title,
  value,
  sub,
  icon,
}: {
  title: string;
  value: string;
  sub: string;
  icon: string;
}) {
  return (
    <article className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-teal-100 flex items-center justify-center">
          <i className={`fas ${icon} text-primary text-lg`} />
        </div>
        <span className="text-xs text-green-600 font-semibold">{sub.includes("%") ? sub : "+2.7%"}</span>
      </div>
      <div className="text-4xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-xs text-primary font-medium mt-1">{sub}</div>
    </article>
  );
}

function SmallCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-xl p-5 text-center shadow-sm">
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-lg font-bold text-primary">{sub}</div>
    </div>
  );
}
