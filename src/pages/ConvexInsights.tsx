import { useCallback, useMemo, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { api } from "@convex/_generated/api";
import { AppChrome } from "@/components/layout/AppChrome";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useWebAuth } from "@/contexts/WebAuthContext";
import { useWebPreferences } from "@/contexts/WebPreferencesContext";
import {
  addMonthsYm,
  formatMonthYearLabel,
  roundMoney,
  todayYm,
  type DocTx,
  ymToDateRange,
} from "@/lib/transactionMath";

const primary = "#0f766e";
const CAT_PALETTE = ["#0f766e", "#2563eb", "#7c3aed", "#ea580c", "#db2777", "#0ea5e9", "#64748b", "#059669"];

function ConvexInsightsInner() {
  const { workspace, ready } = useWorkspace();
  const { user } = useWebAuth();
  const { formatMoney, formatMoneyCompact } = useWebPreferences();
  const userId = user!.id;
  const [period, setPeriod] = useState<"month" | "all">("all");
  const [selectedYm, setSelectedYm] = useState(() => todayYm());

  const range =
    period === "month"
      ? (() => {
          const { start, end } = ymToDateRange(selectedYm);
          return { startStr: start, endStr: end };
        })()
      : null;

  const all = useQuery(
    api.transactions.list,
    ready
      ? {
          workspace,
          userId,
          startDate: range?.startStr,
          endDate: range?.endStr,
        }
      : "skip",
  );

  const leakScan = useAction(api.moneyLeak.analyzeMoneyLeaks);

  const [leakBusy, setLeakBusy] = useState(false);
  const [leakResult, setLeakResult] = useState<{
    summary: string;
    findings: { title: string; detail: string; severity: string }[];
    tips: string[];
    error?: string;
  } | null>(null);

  const { expense, income, byCategory, totalExp, pieSlices } = useMemo(() => {
    const raw = (all ?? []) as DocTx[];
    let exp = 0;
    let inc = 0;
    const map = new Map<string, number>();
    for (const t of raw) {
      if (t.type === "expense") {
        exp += t.amount;
        map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
      } else if (t.type === "income") inc += t.amount;
    }
    const pairs = [...map.entries()].sort((a, b) => b[1] - a[1]);
    const pieSlices = pairs.slice(0, 8).map(([label, value]) => ({ name: label, value }));
    return {
      expense: roundMoney(exp),
      income: roundMoney(inc),
      byCategory: pairs,
      totalExp: roundMoney(exp),
      pieSlices,
    };
  }, [all]);

  const loading = !ready || all === undefined;
  const periodLabel = period === "month" ? formatMonthYearLabel(selectedYm) : "All time (loaded data)";
  const net = roundMoney(income - expense);

  const runLeakScan = useCallback(async () => {
    const raw = (all ?? []) as DocTx[];
    if (raw.length === 0) {
      setLeakResult({ summary: "", findings: [], tips: [], error: "Add transactions first." });
      return;
    }
    setLeakBusy(true);
    setLeakResult(null);
    try {
      const rows = raw.slice(0, 400).map((t) => ({
        date: t.date,
        amount: t.amount,
        type: t.type,
        category: t.category,
        merchant: t.merchant ?? undefined,
        description: t.description ?? undefined,
      }));
      const out = await leakScan({ periodLabel, rows });
      if (!out.ok) {
        setLeakResult({
          summary: "",
          findings: [],
          tips: [],
          error: out.error ?? "Analysis failed.",
        });
        return;
      }
      setLeakResult({
        summary: out.summary,
        findings: out.findings ?? [],
        tips: out.tips ?? [],
      });
    } catch (e) {
      setLeakResult({
        summary: "",
        findings: [],
        tips: [],
        error: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setLeakBusy(false);
    }
  }, [all, leakScan, periodLabel]);

  return (
    <div className="min-h-full bg-gradient-to-b from-white via-[#f0fdf9] to-[#f0fdfa]">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <h1 className="text-lg font-bold text-slate-900">Analysis</h1>
        <p className="text-xs text-slate-500">Expense distribution &amp; money leak scan</p>
      </div>

      <div className="space-y-4 px-4 py-4 pb-24">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPeriod("month")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              period === "month" ? "bg-emerald-100 text-emerald-900" : "bg-slate-100 text-slate-600"
            }`}
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => setPeriod("all")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              period === "all" ? "bg-emerald-100 text-emerald-900" : "bg-slate-100 text-slate-600"
            }`}
          >
            All time
          </button>
        </div>

        {period === "month" ? (
          <div className="flex items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white py-2">
            <button
              type="button"
              className="rounded-lg p-2 hover:bg-slate-50"
              onClick={() => setSelectedYm((ym) => addMonthsYm(ym, -1))}
            >
              <i className="fas fa-chevron-left text-slate-700" />
            </button>
            <span className="text-sm font-bold text-slate-900">{formatMonthYearLabel(selectedYm)}</span>
            <button
              type="button"
              className="rounded-lg p-2 hover:bg-slate-50"
              onClick={() => setSelectedYm((ym) => addMonthsYm(ym, 1))}
            >
              <i className="fas fa-chevron-right text-slate-700" />
            </button>
          </div>
        ) : null}

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
            <p className="text-[10px] font-bold text-slate-500">EXPENSE</p>
            <p className="mt-1 text-sm font-bold text-rose-600">{formatMoneyCompact(expense)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
            <p className="text-[10px] font-bold text-slate-500">INCOME</p>
            <p className="mt-1 text-sm font-bold text-emerald-700">{formatMoneyCompact(income)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
            <p className="text-[10px] font-bold text-slate-500">NET</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{formatMoneyCompact(net)}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900">Expense distribution</h2>
          <p className="mt-1 text-xs text-slate-500">Share of expenses by category (top 8).</p>
          {loading ? (
            <div className="flex justify-center py-10">
              <i className="fas fa-circle-notch fa-spin text-2xl" style={{ color: primary }} />
            </div>
          ) : pieSlices.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No expense data in this period yet.</p>
          ) : (
            <div className="mt-4 h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieSlices} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {pieSlices.map((_, i) => (
                      <Cell key={`c-${i}`} fill={CAT_PALETTE[i % CAT_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatMoney(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900">Money leak detection</h2>
          <p className="mt-1 text-xs text-slate-500">
            AI checks recurring fees, duplicates, and unusual spikes for this period (requires Convex env with API
            key).
          </p>
          <button
            type="button"
            disabled={leakBusy || loading}
            onClick={() => void runLeakScan()}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${primary}, #0d9488)` }}
          >
            {leakBusy ? <i className="fas fa-circle-notch fa-spin" /> : <i className="fas fa-magic" />}
            Run AI analysis
          </button>
          {leakResult?.error ? (
            <p className="mt-3 text-sm text-rose-600">{leakResult.error}</p>
          ) : leakResult ? (
            <div className="mt-4 space-y-3 text-sm">
              <p className="text-slate-700">{leakResult.summary}</p>
              {leakResult.findings.map((f, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-3 ${
                    f.severity === "high"
                      ? "border-rose-200 bg-rose-50"
                      : f.severity === "medium"
                        ? "border-amber-200 bg-amber-50"
                        : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <p className="font-semibold text-slate-900">{f.title}</p>
                  <p className="mt-1 text-slate-600">{f.detail}</p>
                  <p className="mt-2 text-[10px] font-bold uppercase text-slate-500">{f.severity}</p>
                </div>
              ))}
              {leakResult.tips.length > 0 ? (
                <ul className="list-inside list-disc text-slate-600">
                  {leakResult.tips.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-900">By category</h2>
          <p className="text-xs text-slate-500">Open the transactions list to add or edit entries.</p>
          {loading ? (
            <div className="flex justify-center py-8">
              <i className="fas fa-circle-notch fa-spin text-2xl" style={{ color: primary }} />
            </div>
          ) : byCategory.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No expense data in this period yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {byCategory.map(([cat, amt], idx) => {
                const pct = totalExp > 0 ? (amt / totalExp) * 100 : 0;
                const border = CAT_PALETTE[idx % CAT_PALETTE.length];
                return (
                  <li key={cat}>
                    <Link
                      to="/transactions"
                      className="block rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:bg-slate-50"
                      style={{ borderLeftWidth: 4, borderLeftColor: border }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate font-semibold text-slate-900">{cat}</span>
                        <span className="shrink-0 text-sm font-bold tabular-nums text-slate-900">{formatMoney(amt)}</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: border }} />
                      </div>
                      <p className="mt-1 text-right text-[11px] text-slate-500">{pct.toFixed(1)}%</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Unavailable() {
  const runtime = useQuery(api.admin.publicConfig, {});
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">Analysis unavailable</h1>
      <p className="mt-2 text-sm text-slate-600">
        {runtime?.maintenanceMode ? "System is in maintenance mode." : "This page is disabled by admin."}
      </p>
    </div>
  );
}

export default function ConvexInsights() {
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
      <ConvexInsightsInner />
    </AppChrome>
  );
}
