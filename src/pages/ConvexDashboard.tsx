import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Link } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useWebAuth } from "@/contexts/WebAuthContext";
import { useWebPreferences } from "@/contexts/WebPreferencesContext";
import { AppChrome } from "@/components/layout/AppChrome";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";
import { buildSummary, filterByMonth, type DocTx } from "@/lib/transactionMath";

/** Matches `apps/mobile/src/theme/tokens.ts` */
const primary = "#0f766e";
const teal600 = "#0d9488";
const rose600 = "#e11d48";
const green600 = "#16a34a";

function ConvexDashboardInner() {
  const { workspace, ready } = useWorkspace();
  const { user } = useWebAuth();
  const { formatMoney, formatDate } = useWebPreferences();
  const userId = user!.id;

  const all = useQuery(api.transactions.list, ready ? { workspace, userId } : "skip");

  const { recent, summary } = useMemo(() => {
    const list = (all ?? []) as DocTx[];
    const monthlyTx = filterByMonth(list);
    return {
      recent: list.slice(0, 5),
      summary: buildSummary(monthlyTx),
    };
  }, [all]);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  /** Mobile `DashboardScreen` uses a generic greeting — keep web aligned */
  const displayName = "there";

  const loading = !ready || all === undefined;

  return (
    <div className="min-h-full bg-gradient-to-b from-white via-[#f0fdf9] to-[#f0fdfa]">
      <div className="border-b border-slate-200 bg-white px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-white shadow-sm"
              style={{ background: `linear-gradient(135deg, ${primary}, ${teal600})` }}
            >
              <i className="fas fa-sync-alt text-sm" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-bold leading-tight text-slate-900">Receipt Cycle</p>
              <p className="text-xs text-slate-500">Dashboard</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Link
              to="/settings"
              className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200"
              aria-label="Notifications"
            >
              <i className="far fa-bell text-[15px]" />
            </Link>
            <Link
              to="/settings"
              className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
              aria-label="Settings"
            >
              <i className="far fa-user text-[15px]" />
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4 pb-10 pt-3 sm:px-5">
        <div>
          <h1 className="text-[17px] font-bold text-slate-900">
            {greet}, {displayName}
          </h1>
          <p className="mt-1 text-[13px] text-slate-600">Here&apos;s your financial snapshot for today</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <i className="fas fa-circle-notch fa-spin text-2xl" style={{ color: primary }} />
          </div>
        ) : (
          <>
            <div className="-mx-1 flex gap-2.5 overflow-x-auto pb-1 pt-0.5 [scrollbar-width:thin]">
              <div
                className="flex w-[176px] shrink-0 flex-col rounded-[18px] p-4 text-white shadow-md"
                style={{ background: `linear-gradient(135deg, ${primary}, ${teal600})` }}
              >
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-white/90">Net Balance</p>
                    <p className="mt-0.5 truncate text-xl font-bold tabular-nums">{formatMoney(summary.netBalance)}</p>
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/20">
                    <i className="fas fa-wallet text-lg" />
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-white/20 px-1.5 py-0.5 text-[11px] font-bold">
                    <i className={`fas fa-arrow-${summary.savingsRate >= 0 ? "up" : "down"} text-[10px]`} aria-hidden />
                    {Math.abs(summary.savingsRate).toFixed(1)}%
                  </span>
                  <span className="text-[11px] text-white/90">savings rate</span>
                </div>
              </div>

              <div className="flex w-[158px] shrink-0 flex-col rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-500">Total Expenses</p>
                    <p className="mt-0.5 truncate text-lg font-bold tabular-nums text-slate-900">
                      {formatMoney(summary.totalExpenses)}
                    </p>
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-rose-100">
                    <i className="far fa-credit-card" style={{ color: rose600 }} />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">{summary.transactionCount} transactions</p>
              </div>

              <div className="flex w-[158px] shrink-0 flex-col rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-500">Total Income</p>
                    <p className="mt-0.5 truncate text-lg font-bold tabular-nums text-slate-900">
                      {formatMoney(summary.totalIncome)}
                    </p>
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-emerald-100">
                    <i className="fas fa-money-bill-wave" style={{ color: green600 }} />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: primary }}>
                  <i className="far fa-check-circle text-xs" />
                  This month
                </div>
              </div>
            </div>

            <section>
              <h2 className="mb-2.5 text-sm font-bold text-slate-900">Quick Actions</h2>
              <div className="grid grid-cols-4 gap-1 px-0.5 sm:gap-2">
                <Link to="/transactions" className="flex flex-col items-center gap-1 rounded-lg py-1 transition hover:opacity-90">
                  <div
                    className="mb-1 flex h-11 w-11 items-center justify-center rounded-full text-white shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${primary}, ${teal600})` }}
                  >
                    <i className="fas fa-camera text-[15px]" />
                  </div>
                  <span className="text-center text-[10px] font-semibold text-slate-600">Scan</span>
                </Link>
                <Link to="/upload-statement" className="flex flex-col items-center gap-1 rounded-lg py-1 transition hover:opacity-90">
                  <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full border border-blue-200 bg-blue-100 text-blue-600">
                    <i className="fas fa-cloud-upload-alt text-[15px]" />
                  </div>
                  <span className="text-center text-[10px] font-semibold text-slate-600">Upload</span>
                </Link>
                <Link
                  to="/transactions#add-transaction"
                  className="flex flex-col items-center gap-1 rounded-lg py-1 transition hover:opacity-90"
                >
                  <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full border border-purple-200 bg-purple-100 text-purple-600">
                    <i className="fas fa-plus-circle text-[15px]" />
                  </div>
                  <span className="text-center text-[10px] font-semibold text-slate-600">Add</span>
                </Link>
                <Link to="/budgets" className="flex flex-col items-center gap-1 rounded-lg py-1 transition hover:opacity-90">
                  <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-600">
                    <i className="fas fa-chart-pie text-[15px]" />
                  </div>
                  <span className="text-center text-[10px] font-semibold text-slate-600">Budget</span>
                </Link>
              </div>
            </section>

            {summary.categoryBreakdown.length > 0 ? (
              <section>
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-slate-900">Spending Overview</h2>
                  <Link to="/insights" className="text-xs font-semibold hover:underline" style={{ color: primary }}>
                    View All
                  </Link>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
                  <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">TOP CATEGORIES</p>
                  <ul className="space-y-1.5">
                    {summary.categoryBreakdown.slice(0, 3).map((cat) => (
                      <li
                        key={cat.category}
                        className="flex items-center justify-between gap-3 rounded-[10px] bg-slate-100 px-2.5 py-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-slate-200 bg-white">
                            <i className="fas fa-tag text-xs" style={{ color: primary }} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{cat.category}</p>
                            <p className="text-xs text-slate-500">{cat.count} transactions</p>
                          </div>
                        </div>
                        <span className="shrink-0 text-sm font-bold tabular-nums text-slate-900">{formatMoney(cat.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center shadow-sm">
                <i className="fas fa-chart-pie text-3xl text-slate-400" />
                <p className="mt-2.5 text-sm font-bold text-slate-900">No spending data yet</p>
                <p className="mt-1 text-sm text-slate-600">Add your first transaction to see spending insights</p>
              </div>
            )}

            <section>
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-slate-900">Recent Transactions</h2>
                <Link to="/transactions" className="text-xs font-semibold hover:underline" style={{ color: primary }}>
                  View All
                </Link>
              </div>
              {recent.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-600 shadow-sm">
                  No transactions yet — scan a receipt or add one.
                </div>
              ) : (
                <ul className="space-y-2">
                  {recent.map((tx) => (
                    <li
                      key={tx.id}
                      className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm"
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: "rgb(236 253 245)" }}
                      >
                        <i className="fas fa-receipt text-sm" style={{ color: primary }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{tx.merchant || tx.category}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {tx.category} · {formatDate(tx.date)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-sm font-bold tabular-nums ${tx.type === "expense" ? "text-rose-600" : ""}`}
                        style={tx.type !== "expense" ? { color: primary } : undefined}
                      >
                        {tx.type === "expense" ? "-" : "+"}
                        {formatMoney(tx.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function Unavailable() {
  const runtime = useQuery(api.admin.publicConfig, {});
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">Dashboard unavailable</h1>
      <p className="mt-2 text-sm text-slate-600">
        {runtime?.maintenanceMode ? "System is in maintenance mode." : "Dashboard page is disabled by admin."}
      </p>
    </div>
  );
}

export default function ConvexDashboard() {
  const runtime = useQuery(api.admin.publicConfig, {});

  if (runtime?.maintenanceMode || runtime?.webDashboardEnabled === false) {
    const inner = <Unavailable />;
    return (
      <ResponsiveLayout variant="app" showSidebar={true} mobileContent={inner}>
        {inner}
      </ResponsiveLayout>
    );
  }

  return (
    <AppChrome>
      <ConvexDashboardInner />
    </AppChrome>
  );
}
