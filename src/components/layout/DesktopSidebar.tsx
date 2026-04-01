import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useConvexMonthlySummary } from "@/hooks/use-convex-monthly-summary";
import { useWebPreferences } from "@/contexts/WebPreferencesContext";
import { useWebAuth } from "@/contexts/WebAuthContext";

/** Primary app navigation — mirrors mobile tabs + dashboard home (SaaS-style sidebar). */
const DesktopSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const inAdmin = location.pathname.startsWith("/admin");
  const { user } = useWebAuth();
  const { summary, loading: summaryLoading, hasUser } = useConvexMonthlySummary();
  const { formatMoney } = useWebPreferences();

  const savingsAmount = summary && summary.netBalance > 0 ? summary.netBalance : summary?.netBalance ?? 0;
  const displayBalance = !hasUser ? "—" : summaryLoading || !summary ? "…" : formatMoney(Math.max(0, savingsAmount));
  const rateDisplay =
    !hasUser || summaryLoading || !summary ? "—" : `${Math.abs(summary.savingsRate).toFixed(1)}% savings rate`;

  const mainNav = [
    { path: inAdmin ? "/admin" : "/dashboard", icon: "fa-gauge-high", label: "Dashboard" },
    { path: inAdmin ? "/admin" : "/transactions#add-transaction", icon: "fa-plus", label: "Add record" },
    { path: inAdmin ? "/admin" : "/transactions", icon: "fa-file-lines", label: "Records" },
    { path: inAdmin ? "/admin" : "/insights", icon: "fa-chart-line", label: "Analysis" },
    { path: inAdmin ? "/admin" : "/budgets", icon: "fa-chart-pie", label: "Budgets" },
    { path: inAdmin ? "/admin" : "/accounts", icon: "fa-wallet", label: "Accounts" },
    { path: inAdmin ? "/admin" : "/categories", icon: "fa-tags", label: "Categories" },
    { path: inAdmin ? "/admin" : "/upload-statement", icon: "fa-cloud-arrow-up", label: "Upload statement" },
    { path: inAdmin ? "/admin" : "/settings", icon: "fa-gear", label: "Settings" },
  ];

  return (
    <aside className="fixed bottom-0 left-0 top-16 z-40 w-64 overflow-y-auto border-r border-slate-100 bg-white">
      <div className="flex flex-col p-4">
        <div className="mb-5 rounded-xl border border-teal-100 bg-gradient-to-br from-primary/10 to-teal-50 p-4">
          <div className="text-xs font-medium text-slate-600">This month (net)</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{displayBalance}</div>
          <div className="mt-1 flex items-center gap-1">
            {hasUser && summary && !summaryLoading ? (
              <i
                className={`fas text-xs text-primary ${summary.savingsRate >= 0 ? "fa-arrow-trend-up" : "fa-arrow-trend-down"}`}
              />
            ) : null}
            <span className="text-xs font-semibold text-primary">{rateDisplay}</span>
          </div>
        </div>

        <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Menu</p>
        <nav className="space-y-0.5">
          {mainNav.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-primary text-white shadow-md shadow-primary/25" : "text-slate-600 hover:bg-slate-50"
                }`
              }
            >
              <i className={`fas ${item.icon} w-5 shrink-0 text-center ${inAdmin ? "" : ""}`} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white">
          <div className="mb-1 flex items-center gap-2">
            <i className="fas fa-crown text-amber-400" />
            <span className="text-sm font-semibold">Upgrade</span>
          </div>
          <p className="mb-3 text-xs text-slate-400">Unlimited scans, AI analysis &amp; more</p>
          <button
            type="button"
            onClick={() => navigate("/pricing")}
            className="h-9 w-full rounded-lg bg-white text-xs font-semibold text-slate-900 hover:bg-slate-100"
          >
            View plans
          </button>
        </div>

        {user?.email ? (
          <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <p className="truncate text-xs font-medium text-slate-700">{user.email}</p>
          </div>
        ) : null}

        <div className="mt-4 border-t border-slate-100 pt-4">
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? "bg-purple-100 text-purple-800" : "text-slate-600 hover:bg-slate-50"
              }`
            }
          >
            <i className="fas fa-user-shield w-5 text-center" />
            <span>Admin</span>
          </NavLink>
        </div>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
