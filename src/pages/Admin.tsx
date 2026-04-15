import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

const STORAGE_KEY = "receiptcycle_admin_secret";
const ADMIN_EMAIL_KEY = "receiptcycle_admin_email";
const PAGE_SIZE = 10;

type UserFilter = "all" | "active" | "premium" | "suspended";
type EditableUser = {
  id: string;
  name: string;
  role: string;
  status: string;
  plan: string;
  proSubscriptionActive: boolean;
};

function fmtNum(n: number) {
  return new Intl.NumberFormat().format(n);
}

function pct(n: number) {
  return `${n >= 0 ? "+" : ""}${n}%`;
}

function asJsonDownload(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Admin() {
  const [adminEmailInput, setAdminEmailInput] = useState(
    () => localStorage.getItem(ADMIN_EMAIL_KEY) ?? "",
  );
  const [adminEmail, setAdminEmail] = useState(
    () => localStorage.getItem(ADMIN_EMAIL_KEY) ?? "",
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
  const [filter, setFilter] = useState<UserFilter>("all");
  const [page, setPage] = useState(0);

  const authArgs = authReady && secret && adminEmail ? { secret, adminEmail } : null;
  const stats = useQuery(api.admin.dashboardStats, authArgs ? authArgs : "skip");
  const config = useQuery(api.admin.adminConfig, authArgs ? authArgs : "skip");
  const logs = useQuery(api.admin.recentAuditLogs, authArgs ? { ...authArgs, limit: 80 } : "skip");
  const users = useQuery(api.admin.recentUsers, authArgs ? { ...authArgs, limit: 200 } : "skip");
  const updateConfig = useMutation(api.admin.updateConfig);
  const updateUserManagement = useMutation(api.admin.updateUserManagement);
  const deleteUserMutation = useMutation(api.admin.deleteUser);
  const fetchHealth = useAction(api.admin.systemHealth);
  const validateAccess = useAction(api.admin.validateAccess);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditableUser | null>(null);

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

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = users ?? [];
    return source.filter((u) => {
      if (q && !u.email.toLowerCase().includes(q) && !(u.name ?? "").toLowerCase().includes(q)) return false;
      if (filter === "premium" && !u.proSubscriptionActive) return false;
      if (filter === "active" && (u.status ?? "active") !== "active") return false;
      if (filter === "suspended" && (u.status ?? "active") !== "suspended") return false;
      return true;
    });
  }, [filter, query, users]);

  const pagedUsers = filteredUsers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const hasPrev = page > 0;
  const hasNext = (page + 1) * PAGE_SIZE < filteredUsers.length;

  async function saveControls() {
    if (!authArgs) {
      setMsg("Unlock admin first.");
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await updateConfig({
        ...authArgs,
        actor: adminEmail,
        ...draft,
      });
      setMsg("Admin settings updated for web and mobile.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to update settings.");
    } finally {
      setSaving(false);
    }
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
    if (!authArgs) return;
    setHealthLoading(true);
    try {
      const out = await fetchHealth(authArgs);
      setHealth({ timestamp: out.timestamp, ocr: out.ocr });
      setMsg("System health refreshed.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to fetch health.");
    } finally {
      setHealthLoading(false);
    }
  }

  function onExportSnapshot() {
    if (!authReady) {
      setMsg("Unlock admin before export.");
      return;
    }
    asJsonDownload("admin-dashboard-export.json", {
      exportedAt: Date.now(),
      stats: stats ?? null,
      config: config ?? null,
      users: users ?? [],
      auditLogs: logs ?? [],
      health: health ?? null,
    });
    setMsg("Admin snapshot exported.");
  }

  function startEditUser(u: {
    id: string;
    name: string | null;
    role: string;
    status: string;
    plan: string;
    proSubscriptionActive: boolean;
  }) {
    setEditingUserId(u.id);
    setEditDraft({
      id: u.id,
      name: u.name ?? "",
      role: u.role || "user",
      status: u.status || "active",
      plan: u.plan || "free",
      proSubscriptionActive: u.proSubscriptionActive,
    });
  }

  async function saveUserEdit() {
    if (!authArgs || !editDraft) return;
    await updateUserManagement({
      ...authArgs,
      actor: adminEmail,
      userId: editDraft.id as never,
      name: editDraft.name,
      role: editDraft.role,
      status: editDraft.status,
      plan: editDraft.plan,
      proSubscriptionActive: editDraft.proSubscriptionActive,
    });
    setEditingUserId(null);
    setEditDraft(null);
    setMsg("User updated.");
  }

  async function quickDowngrade(u: { id: string }) {
    if (!authArgs) return;
    await updateUserManagement({
      ...authArgs,
      actor: adminEmail,
      userId: u.id as never,
      plan: "free",
      proSubscriptionActive: false,
    });
    setMsg("User downgraded to Free.");
  }

  async function deleteUser(u: { id: string; email: string }) {
    if (!authArgs) return;
    if (!window.confirm(`Delete user ${u.email}? This cannot be undone.`)) return;
    await deleteUserMutation({
      ...authArgs,
      actor: adminEmail,
      userId: u.id as never,
    });
    setMsg("User deleted.");
  }

  const monthly = stats?.monthly ?? [];
  const maxMonthly = Math.max(1, ...monthly.map((m) => m.users));

  return (
    <div className="font-sans bg-gray-50 min-h-screen">
      <main className="max-w-[1440px] mx-auto p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-600">One control center for web and mobile.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void onRefreshHealth()}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200"
            >
              {healthLoading ? "Refreshing..." : "Refresh"}
            </button>
            <button
              type="button"
              onClick={onExportSnapshot}
              className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90"
            >
              Export
            </button>
          </div>
        </div>

        <form onSubmit={onAuthSubmit} className="bg-white rounded-2xl p-4 border border-gray-100 mb-6">
          <div className="grid md:grid-cols-[1fr_1fr_auto] gap-3">
            <input
              value={adminEmailInput}
              onChange={(e) => setAdminEmailInput(e.target.value)}
              placeholder="Admin email"
              className="h-10 px-3 rounded-lg border border-gray-200 text-sm"
            />
            <input
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              placeholder="Admin secret"
              className="h-10 px-3 rounded-lg border border-gray-200 text-sm"
            />
            <button
              type="submit"
              disabled={authChecking}
              className="h-10 px-4 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-60"
            >
              {authChecking ? "Checking..." : "Unlock"}
            </button>
          </div>
          {msg ? <div className="mt-3 text-xs text-gray-700">{msg}</div> : null}
        </form>

        {!authReady ? (
          <div className="bg-white rounded-2xl p-6 border border-gray-100">Unlock admin to load live analytics and controls.</div>
        ) : (
          <>
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <StatCard title="Total Users" value={stats ? fmtNum(stats.totals.users) : "--"} sub={stats ? `+${fmtNum(stats.growth.users30)} this month` : "Loading..."} icon="fa-users" />
              <StatCard title="Active Users (30d)" value={stats ? fmtNum(stats.growth.activeUsers30) : "--"} sub={stats ? pct(stats.growth.activeGrowthPct) : "Loading..."} icon="fa-user-check" />
              <StatCard title="Transactions" value={stats ? fmtNum(stats.totals.transactions) : "--"} sub={stats ? `+${fmtNum(stats.growth.tx30)} this month` : "Loading..."} icon="fa-exchange-alt" />
              <StatCard title="User Growth" value={stats ? pct(stats.growth.userGrowthPct) : "--"} sub="vs previous 30d" icon="fa-arrow-trend-up" />
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">User Growth (Live)</h2>
                <div className="h-56 bg-gradient-to-t from-primary/10 to-transparent rounded-xl border border-gray-100 p-4">
                  <svg viewBox="0 0 100 40" className="w-full h-full">
                    <polyline
                      fill="none"
                      stroke="#0f766e"
                      strokeWidth="2"
                      points={monthly
                        .map((m, i) => `${(i / Math.max(1, monthly.length - 1)) * 100},${38 - (m.users / maxMonthly) * 30}`)
                        .join(" ")}
                    />
                  </svg>
                  <div className="text-xs text-gray-500 mt-2">{monthly.map((m) => m.month).join(" • ")}</div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-3">System Health</h2>
                <button
                  type="button"
                  onClick={() => void onRefreshHealth()}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-sm font-semibold text-gray-700 mb-3"
                >
                  {healthLoading ? "Checking..." : "Refresh health"}
                </button>
                {!health ? (
                  <p className="text-sm text-gray-500">Run health check to load OCR provider status.</p>
                ) : (
                  <pre className="text-xs bg-gray-50 rounded-lg border border-gray-100 p-3 max-h-56 overflow-auto whitespace-pre-wrap">
                    {JSON.stringify(health.ocr, null, 2)}
                  </pre>
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveControls();
                }}
                className="bg-white rounded-2xl p-5 border border-gray-100"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-3">Controls (Web + Mobile)</h3>
                <div className="grid md:grid-cols-2 gap-3 mb-3">
                  <Toggle label="Maintenance" checked={draft.maintenanceMode} onChange={(v) => setDraft((d) => ({ ...d, maintenanceMode: v }))} />
                  <Toggle label="Scanner" checked={draft.scannerEnabled} onChange={(v) => setDraft((d) => ({ ...d, scannerEnabled: v }))} />
                  <Toggle label="Upload" checked={draft.uploadEnabled} onChange={(v) => setDraft((d) => ({ ...d, uploadEnabled: v }))} />
                  <Toggle label="Manual Add" checked={draft.manualAddEnabled} onChange={(v) => setDraft((d) => ({ ...d, manualAddEnabled: v }))} />
                  <Toggle label="Export" checked={draft.exportEnabled} onChange={(v) => setDraft((d) => ({ ...d, exportEnabled: v }))} />
                  <Toggle label="Web Dashboard" checked={draft.webDashboardEnabled} onChange={(v) => setDraft((d) => ({ ...d, webDashboardEnabled: v }))} />
                  <Toggle label="Web Transactions" checked={draft.webTransactionsEnabled} onChange={(v) => setDraft((d) => ({ ...d, webTransactionsEnabled: v }))} />
                  <Toggle label="Web Upload" checked={draft.webUploadEnabled} onChange={(v) => setDraft((d) => ({ ...d, webUploadEnabled: v }))} />
                  <Toggle label="Web Settings" checked={draft.webSettingsEnabled} onChange={(v) => setDraft((d) => ({ ...d, webSettingsEnabled: v }))} />
                  <Toggle label="Mobile Scan Page" checked={draft.mobileScanPageEnabled} onChange={(v) => setDraft((d) => ({ ...d, mobileScanPageEnabled: v }))} />
                  <Toggle label="Mobile Upload Page" checked={draft.mobileUploadPageEnabled} onChange={(v) => setDraft((d) => ({ ...d, mobileUploadPageEnabled: v }))} />
                  <Toggle label="Mobile Add Page" checked={draft.mobileAddPageEnabled} onChange={(v) => setDraft((d) => ({ ...d, mobileAddPageEnabled: v }))} />
                </div>
                <h4 className="text-sm font-bold text-gray-900 mb-2">Settings Governance</h4>
                <div className="grid md:grid-cols-2 gap-3 mb-3">
                  <Toggle label="Admin-managed preferences" checked={draft.adminManagedPreferences} onChange={(v) => setDraft((d) => ({ ...d, adminManagedPreferences: v }))} />
                  <Toggle label="Reimbursements" checked={draft.prefReimbursements} onChange={(v) => setDraft((d) => ({ ...d, prefReimbursements: v }))} />
                  <Toggle label="Transaction Number" checked={draft.prefTxnNumber} onChange={(v) => setDraft((d) => ({ ...d, prefTxnNumber: v }))} />
                  <Toggle label="Scan Payment" checked={draft.prefScanPayment} onChange={(v) => setDraft((d) => ({ ...d, prefScanPayment: v }))} />
                  <Toggle label="Require Payment" checked={draft.prefRequirePay} onChange={(v) => setDraft((d) => ({ ...d, prefRequirePay: v }))} />
                  <Toggle label="Require Notes" checked={draft.prefRequireNotes} onChange={(v) => setDraft((d) => ({ ...d, prefRequireNotes: v }))} />
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
                <h3 className="text-lg font-bold text-gray-900 mb-3">Recent Audit Logs</h3>
                <div className="space-y-2 max-h-[520px] overflow-auto">
                  {(logs ?? []).map((l) => (
                    <div key={String(l._id)} className="p-3 rounded-lg bg-gray-50 border-l-4 border-primary">
                      <div className="text-sm font-semibold">{l.action}</div>
                      <div className="text-xs text-gray-500">{l.actor} • {new Date(l.createdAt).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-gray-900">User Management</h3>
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(0);
                  }}
                  placeholder="Search users..."
                  className="w-full md:w-64 h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm"
                />
              </div>
              <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2">
                <FilterButton label="All Users" active={filter === "all"} onClick={() => { setFilter("all"); setPage(0); }} />
                <FilterButton label="Active" active={filter === "active"} onClick={() => { setFilter("active"); setPage(0); }} />
                <FilterButton label="Premium" active={filter === "premium"} onClick={() => { setFilter("premium"); setPage(0); }} />
                <FilterButton label="Suspended" active={filter === "suspended"} onClick={() => { setFilter("suspended"); setPage(0); }} />
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Concurrent Jobs</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pagedUsers.map((u) => (
                    <tr key={String(u.id)} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{u.name ?? "No name"}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        {editingUserId === u.id && editDraft ? (
                          <select
                            value={editDraft.status}
                            onChange={(e) => setEditDraft({ ...editDraft, status: e.target.value })}
                            className="h-8 rounded-lg border border-gray-200 px-2 text-xs"
                          >
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 text-xs font-medium rounded-lg ${u.status === "suspended" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>
                            {u.status === "suspended" ? "Suspended" : "Active"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingUserId === u.id && editDraft ? (
                          <select
                            value={editDraft.plan}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                plan: e.target.value,
                                proSubscriptionActive: e.target.value !== "free",
                              })
                            }
                            className="h-8 rounded-lg border border-gray-200 px-2 text-xs"
                          >
                            <option value="free">Free</option>
                            <option value="pro_monthly">Pro Monthly</option>
                            <option value="pro_yearly">Pro Yearly</option>
                            <option value="cancelling">Cancelling</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 text-xs font-medium rounded-lg ${u.proSubscriptionActive ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-700"}`}>
                            {u.proSubscriptionActive ? "Pro" : "Free"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{u.concurrentJobs}</td>
                      <td className="px-6 py-4">
                        {editingUserId === u.id && editDraft ? (
                          <select
                            value={editDraft.role}
                            onChange={(e) => setEditDraft({ ...editDraft, role: e.target.value })}
                            className="h-8 rounded-lg border border-gray-200 px-2 text-xs"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg">
                            {u.role ?? "user"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {editingUserId === u.id ? (
                            <>
                              <button type="button" onClick={() => void saveUserEdit()} className="px-2 py-1 rounded bg-primary text-white text-xs font-semibold">Save</button>
                              <button type="button" onClick={() => { setEditingUserId(null); setEditDraft(null); }} className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-semibold">Cancel</button>
                            </>
                          ) : (
                            <>
                              <button type="button" onClick={() => startEditUser(u)} className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-semibold">Edit</button>
                              <button type="button" onClick={() => void quickDowngrade(u)} className="px-2 py-1 rounded bg-amber-100 text-amber-700 text-xs font-semibold">Downgrade</button>
                              <button type="button" onClick={() => void deleteUser(u)} className="px-2 py-1 rounded bg-rose-100 text-rose-700 text-xs font-semibold">Delete</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Showing {pagedUsers.length} of {filteredUsers.length} users
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => hasPrev && setPage((p) => p - 1)}
                    disabled={!hasPrev}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => hasNext && setPage((p) => p + 1)}
                    disabled={!hasNext}
                    className="px-3 py-1.5 bg-primary text-white text-sm rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function Limit({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
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

function StatCard({ title, value, sub, icon }: { title: string; value: string; sub: string; icon: string }) {
  return (
    <article className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-teal-100 flex items-center justify-center">
          <i className={`fas ${icon} text-primary text-lg`} />
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-xs text-primary font-medium mt-1">{sub}</div>
    </article>
  );
}

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${active ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
    >
      {label}
    </button>
  );
}
