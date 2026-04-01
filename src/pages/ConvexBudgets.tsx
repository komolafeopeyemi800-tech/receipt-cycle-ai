import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { AppChrome } from "@/components/layout/AppChrome";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useWebAuth } from "@/contexts/WebAuthContext";
import { useWebPreferences } from "@/contexts/WebPreferencesContext";
import { DocTx, expenseTotalsByCategory, roundMoney, ymToDateRange } from "@/lib/transactionMath";

const primary = "#0f766e";

function monthStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(ym: string, delta: number) {
  const [y, m] = ym.split("-").map((x) => parseInt(x, 10));
  const d = new Date(y, m - 1 + delta, 1);
  return monthStr(d);
}

type CatRow = { id: Id<"categories">; name: string; color: string };

function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map((x) => parseInt(x, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m)) return ym;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function ConvexBudgetsInner() {
  const { workspace, ready } = useWorkspace();
  const { user } = useWebAuth();
  const { formatMoney } = useWebPreferences();
  const userId = user!.id;
  const [month, setMonth] = useState(() => monthStr(new Date()));
  const range = useMemo(() => ymToDateRange(month), [month]);

  const cats = useQuery(api.categories.list, ready ? { workspace } : "skip");
  const budgets = useQuery(api.budgets.listForMonth, ready ? { workspace, month } : "skip");
  const txs = useQuery(
    api.transactions.list,
    ready ? { workspace, userId, startDate: range.start, endDate: range.end } : "skip",
  );
  const upsert = useMutation(api.budgets.upsert);
  const ensureCats = useMutation(api.categories.ensureSeed);

  const [draft, setDraft] = useState<Record<string, string>>({});
  const [budgetModal, setBudgetModal] = useState<CatRow | null>(null);
  const [modalLimit, setModalLimit] = useState("");

  useEffect(() => {
    if (!ready) return;
    void ensureCats({ workspace });
  }, [ready, workspace, ensureCats]);

  useEffect(() => {
    if (!budgets) return;
    setDraft((prev) => {
      const next = { ...prev };
      for (const b of budgets) {
        if (next[b.category] === undefined) next[b.category] = String(b.limitAmount);
      }
      return next;
    });
  }, [budgets, month]);

  const expenseCats = useMemo(() => (cats ?? []).filter((c) => c.kind === "expense"), [cats]);

  const budgetByCat = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of budgets ?? []) m.set(b.category, b.limitAmount);
    return m;
  }, [budgets]);

  const spentByCat = useMemo(() => {
    return expenseTotalsByCategory((txs ?? []) as DocTx[], range.start, range.end);
  }, [txs, range.start, range.end]);

  const totalBudget = useMemo(
    () => roundMoney((budgets ?? []).reduce((s, b) => s + b.limitAmount, 0)),
    [budgets],
  );

  const totalSpentBudgeted = useMemo(() => {
    if (!budgets?.length) return 0;
    let s = 0;
    for (const b of budgets) {
      s += spentByCat.get(b.category) ?? 0;
    }
    return roundMoney(s);
  }, [budgets, spentByCat]);

  const setBudget = async (category: string, raw?: string) => {
    const r = raw ?? draft[category] ?? "";
    const n = parseFloat(r.replace(/,/g, ""));
    if (!Number.isFinite(n) || n <= 0) {
      window.alert("Enter a positive amount.");
      return;
    }
    try {
      await upsert({ workspace, category, month, limitAmount: roundMoney(n) });
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not save");
    }
  };

  const loading = !ready || cats === undefined || budgets === undefined || txs === undefined;

  return (
    <div className="min-h-full bg-gradient-to-b from-white via-[#f0fdf9] to-[#f0fdfa]">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <h1 className="text-lg font-bold text-slate-900">Budgets</h1>
        <p className="text-xs text-slate-500">{month}</p>
      </div>

      <div className="flex items-center justify-center gap-4 border-b border-slate-200 bg-white/95 py-2">
        <button
          type="button"
          className="rounded-lg p-2 text-slate-800 hover:bg-slate-100"
          onClick={() => setMonth((m) => shiftMonth(m, -1))}
          aria-label="Previous month"
        >
          <i className="fas fa-chevron-left" />
        </button>
        <span className="min-w-[120px] text-center text-sm font-bold text-slate-900">{month}</span>
        <button
          type="button"
          className="rounded-lg p-2 text-slate-800 hover:bg-slate-100"
          onClick={() => setMonth((m) => shiftMonth(m, 1))}
          aria-label="Next month"
        >
          <i className="fas fa-chevron-right" />
        </button>
      </div>

      <div className="space-y-4 px-4 py-4 pb-24">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-[10px] border border-slate-200 bg-white p-3">
            <p className="text-[10px] font-bold tracking-wide text-slate-500">TOTAL BUDGET</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{formatMoney(totalBudget)}</p>
          </div>
          <div className="rounded-[10px] border border-slate-200 bg-white p-3">
            <p className="text-[10px] font-bold tracking-wide text-slate-500">SPENT (BUDGETED)</p>
            <p className="mt-1 text-sm font-bold text-rose-600">{formatMoney(totalSpentBudgeted)}</p>
          </div>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Totals compare only categories with a budget set for this month. Other spending is still shown per category
          below.
        </p>
        <p className="text-xs font-bold text-slate-800">Expense categories</p>

        {loading ? (
          <div className="flex justify-center py-8">
            <i className="fas fa-circle-notch fa-spin text-2xl" style={{ color: primary }} />
          </div>
        ) : (
          expenseCats.map((c) => {
            const limit = budgetByCat.get(c.name) ?? 0;
            const spent = spentByCat.get(c.name) ?? 0;
            const left = roundMoney(limit - spent);
            return (
              <div
                key={String(c.id)}
                className="flex flex-wrap items-center gap-2 border-b border-slate-200 py-3 last:border-0"
              >
                <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900">{c.name}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Spent {formatMoney(spent)} · Budget {formatMoney(limit)} ·{" "}
                    <span className={left >= 0 ? "font-bold text-green-600" : "font-bold text-rose-600"}>
                      {formatMoney(left)} left
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-lg border px-2.5 py-2 text-[10px] font-extrabold tracking-wide text-teal-800"
                  style={{ borderColor: primary, backgroundColor: "#ecfdf5" }}
                  onClick={() => {
                    const lim = draft[c.name] ?? String(budgetByCat.get(c.name) ?? "");
                    setModalLimit(lim);
                    setBudgetModal({ id: c.id, name: c.name, color: c.color });
                  }}
                >
                  SET BUDGET
                </button>
              </div>
            );
          })
        )}
      </div>

      {budgetModal ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 px-5">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            <h2 className="text-center text-[15px] font-bold text-slate-900">Set budget</h2>
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-100 px-3 py-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 bg-white"
                style={{ borderColor: budgetModal.color }}
              >
                <div className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: budgetModal.color }} />
              </div>
              <span className="flex-1 text-sm font-semibold text-slate-900">{budgetModal.name}</span>
            </div>
            <label className="mt-3 block">
              <span className="text-[11px] font-semibold text-slate-600">Limit</span>
              <input
                className="mt-1.5 w-full rounded-[10px] border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500/30"
                style={{ borderColor: primary }}
                value={modalLimit}
                onChange={(e) => setModalLimit(e.target.value)}
                inputMode="decimal"
                placeholder="0.00"
              />
            </label>
            <p className="mt-2 text-[11px] text-slate-500">Month: {monthLabel(month)}</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-[10px] border border-slate-200 bg-slate-100 py-2.5 text-xs font-bold uppercase text-slate-700"
                onClick={() => setBudgetModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 rounded-[10px] py-2.5 text-xs font-bold uppercase text-white"
                style={{ backgroundColor: primary }}
                onClick={async () => {
                  if (!budgetModal) return;
                  setDraft((d) => ({ ...d, [budgetModal.name]: modalLimit }));
                  await setBudget(budgetModal.name, modalLimit);
                  setBudgetModal(null);
                }}
              >
                Set
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Unavailable() {
  const runtime = useQuery(api.admin.publicConfig, {});
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">Budgets unavailable</h1>
      <p className="mt-2 text-sm text-slate-600">
        {runtime?.maintenanceMode ? "System is in maintenance mode." : "This page is disabled by admin."}
      </p>
    </div>
  );
}

export default function ConvexBudgets() {
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
      <ConvexBudgetsInner />
    </AppChrome>
  );
}
