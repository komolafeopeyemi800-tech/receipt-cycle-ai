import { useCallback, useMemo, useState } from "react";
import { useConvexConnectionState, useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import { Link } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useWebAuth } from "@/contexts/WebAuthContext";
import { useWebPreferences } from "@/contexts/WebPreferencesContext";
import { AppChrome } from "@/components/layout/AppChrome";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";
import {
  addMonthsYm,
  buildSummary,
  formatMonthYearLabel,
  todayYm,
  ymToDateRange,
  type DocTx,
} from "@/lib/transactionMath";
import { FinancialPeriodSummaryWeb, type PeriodMode, type TxFilter } from "@/components/dashboard/FinancialPeriodSummaryWeb";
import { VoiceQuickAddWeb, type VoiceDraft } from "@/components/dashboard/VoiceQuickAddWeb";
import { FinanceCoachDialog, type CoachRow } from "@/components/dashboard/FinanceCoachDialog";
import { useSubscriptionState } from "@/hooks/use-subscription-state";
import type { Transaction } from "@/types/transaction";
import { TransactionEditDialog } from "@/components/transactions/TransactionEditDialog";

/** Matches `apps/mobile/src/theme/tokens.ts` */
const primary = "#0f766e";
const teal600 = "#0d9488";
const rose600 = "#e11d48";
const green600 = "#16a34a";

function ConvexDashboardInner() {
  const { workspace, ready } = useWorkspace();
  const { user } = useWebAuth();
  const sub = useSubscriptionState();
  const { formatMoney, formatMoneyCompact } = useWebPreferences();
  const conn = useConvexConnectionState();

  const [period, setPeriod] = useState<PeriodMode>("all");
  const [selectedYm, setSelectedYm] = useState(() => todayYm());
  const [txFilter, setTxFilter] = useState<TxFilter>("all");
  const [coachOpen, setCoachOpen] = useState(false);
  const [parsedDraft, setParsedDraft] = useState<VoiceDraft | null>(null);
  const [voiceSaveBusy, setVoiceSaveBusy] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const range =
    period === "month"
      ? (() => {
          const { start, end } = ymToDateRange(selectedYm);
          return { startStr: start, endStr: end };
        })()
      : null;

  const listArgs =
    ready && user?.id
      ? {
          workspace,
          userId: String(user.id),
          startDate: range?.startStr,
          endDate: range?.endStr,
        }
      : ("skip" as const);

  const all = useQuery(api.transactions.list, listArgs);
  const runtime = useQuery(api.admin.publicConfig, {});
  const createTx = useMutation(api.transactions.create);
  const budgetUpsert = useMutation(api.budgets.upsert);
  const catRows = useQuery(api.categories.list, ready ? { workspace } : "skip");
  const accRows = useQuery(api.accounts.list, ready ? { workspace } : "skip");

  const voiceHints = useMemo(
    () => ({
      expenseCategories: (catRows ?? []).filter((c) => c.kind === "expense").map((c) => c.name),
      incomeCategories: (catRows ?? []).filter((c) => c.kind === "income").map((c) => c.name),
      accountNames: (accRows ?? []).map((a) => a.name),
    }),
    [catRows, accRows],
  );

  const summary = useMemo(() => buildSummary((all ?? []) as DocTx[]), [all]);

  const recent = useMemo(() => {
    const raw = (all ?? []) as Transaction[];
    const f = txFilter === "all" ? raw : raw.filter((t) => t.type.toLowerCase() === txFilter);
    return f.slice(0, 5);
  }, [all, txFilter]);

  const periodLabel =
    period === "month" ? formatMonthYearLabel(selectedYm) : "All loaded transactions";

  const rowsForAi = useMemo((): CoachRow[] => {
    const raw = (all ?? []) as DocTx[];
    return raw.slice(0, 400).map((t) => ({
      date: t.date,
      amount: t.amount,
      type: t.type,
      category: t.category,
      merchant: t.merchant ?? undefined,
      description: t.description ?? undefined,
    }));
  }, [all]);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const displayName = "there";

  const listLoading = ready && Boolean(user?.id) && all === undefined;
  const connProblem = conn.hasEverConnected && !conn.isWebSocketConnected && conn.connectionRetries > 2;

  const onVoiceParsed = useCallback(
    async (draft: VoiceDraft) => {
      if (draft.intent === "budget" && draft.budgetLimit != null && draft.budgetLimit > 0 && user?.id) {
        if (sub && !sub.canMutateBudgets) {
          toast.error(sub.blockReason ?? "Upgrade to set budgets.");
          return;
        }
        const month = draft.budgetMonth ?? selectedYm;
        const cat = (draft.budgetCategory || draft.category || "Other").trim() || "Other";
        try {
          await budgetUpsert({
            workspace,
            userId: String(user.id),
            category: cat,
            month,
            limitAmount: draft.budgetLimit,
          });
          toast.success(`Budget for “${cat}” set to ${formatMoney(draft.budgetLimit)} (${month}).`);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Could not save budget.");
        }
        return;
      }
      setParsedDraft(draft);
    },
    [budgetUpsert, formatMoney, selectedYm, sub, user?.id, workspace],
  );

  const saveParsedDraft = useCallback(async () => {
    if (parsedDraft?.intent !== "transaction") return;
    if (!parsedDraft?.amount || parsedDraft.amount <= 0 || !user?.id) return;
    if (sub && !sub.canCreateTransaction) return;
    if (runtime?.maintenanceMode || runtime?.manualAddEnabled === false) return;
    setVoiceSaveBusy(true);
    try {
      await createTx({
        workspace,
        userId: String(user.id),
        amount: parsedDraft.amount,
        type: parsedDraft.type,
        category: parsedDraft.category || "Other",
        merchant: parsedDraft.merchant || undefined,
        date: parsedDraft.date || new Date().toISOString().split("T")[0],
        description: parsedDraft.description?.trim() || "Voice / quick text",
        payment_method: parsedDraft.payment_method?.trim() || "Manual",
        tags: [],
        is_recurring: false,
        entrySource: "manual",
      });
      setParsedDraft(null);
    } catch {
      /* surface via browser — optional toast */
    } finally {
      setVoiceSaveBusy(false);
    }
  }, [parsedDraft, user?.id, workspace, createTx, runtime?.maintenanceMode, runtime?.manualAddEnabled, sub]);

  const voiceBlocked = Boolean(sub && (!sub.canUseAiFeatures || !sub.canCreateTransaction));
  const addBlocked = Boolean(sub && !sub.canCreateTransaction);
  const budgetBlocked = Boolean(sub && !sub.canMutateBudgets);

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

        {sub && !sub.pro && sub.trialTimeActive && sub.canCreateTransaction ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-2.5 text-[12px] text-emerald-950">
            <p className="font-semibold">Pro trial</p>
            <p className="mt-0.5 text-emerald-900/90">
              {sub.trialAddsUsed} of {sub.trialAddsLimit} transactions used · AI and add share this limit.
            </p>
            <Link to="/pricing" className="mt-1 inline-block text-xs font-bold text-emerald-800 underline">
              Upgrade anytime
            </Link>
          </div>
        ) : null}

        {sub && !sub.pro && sub.blockReason ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-950">
            <p className="font-semibold">Subscription</p>
            <p className="mt-0.5 text-amber-900/90">{sub.blockReason}</p>
            <Link to="/pricing" className="mt-1 inline-block text-xs font-bold text-amber-900 underline">
              View plans
            </Link>
          </div>
        ) : null}

        {connProblem ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-semibold">Connection interrupted</p>
            <p className="mt-1 text-amber-900/90">
              Check your internet connection and refresh the page. If this keeps happening, try again in a few minutes.
            </p>
          </div>
        ) : listLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10">
            <i className="fas fa-circle-notch fa-spin text-2xl" style={{ color: primary }} />
            <p className="text-center text-xs text-slate-500">Loading transactions…</p>
          </div>
        ) : (
          <>
            <FinancialPeriodSummaryWeb
              mode={period}
              onModeChange={(m) => {
                setPeriod(m);
                if (m === "month") setSelectedYm(todayYm());
              }}
              monthLabel={formatMonthYearLabel(selectedYm)}
              onPrevMonth={() => setSelectedYm((ym) => addMonthsYm(ym, -1))}
              onNextMonth={() => setSelectedYm((ym) => addMonthsYm(ym, 1))}
              expense={summary.totalExpenses}
              income={summary.totalIncome}
              total={summary.netBalance}
              formatCompact={formatMoneyCompact}
              filter={txFilter}
              onFilterChange={setTxFilter}
            />

            <VoiceQuickAddWeb
              disabled={
                !user?.id ||
                runtime?.maintenanceMode ||
                runtime?.manualAddEnabled === false ||
                voiceBlocked
              }
              hints={voiceHints}
              onParsed={(d) => void onVoiceParsed(d)}
            />

            {parsedDraft ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm">
                <p className="text-[13px] font-extrabold text-slate-900">Parsed transaction</p>
                <p className="mt-1 text-[11px] text-slate-600">
                  Confidence: {parsedDraft.confidence}. Edit on Records if needed — or save here.
                </p>
                <dl className="mt-3 grid gap-2 text-[13px]">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Type</dt>
                    <dd className="font-semibold capitalize text-slate-900">{parsedDraft.type}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Amount</dt>
                    <dd className="font-bold tabular-nums text-slate-900">
                      {parsedDraft.amount != null ? formatMoney(parsedDraft.amount) : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Category</dt>
                    <dd className="text-right font-semibold text-slate-900">{parsedDraft.category}</dd>
                  </div>
                  {parsedDraft.merchant ? (
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Merchant</dt>
                      <dd className="text-right font-semibold text-slate-900">{parsedDraft.merchant}</dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Date</dt>
                    <dd className="font-semibold text-slate-900">{parsedDraft.date || "Today"}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={
                      voiceSaveBusy ||
                      !parsedDraft.amount ||
                      parsedDraft.amount <= 0 ||
                      runtime?.maintenanceMode ||
                      runtime?.manualAddEnabled === false ||
                      Boolean(sub && !sub.canCreateTransaction)
                    }
                    onClick={() => void saveParsedDraft()}
                    className="rounded-lg px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                    style={{ backgroundColor: primary }}
                  >
                    {voiceSaveBusy ? "Saving…" : "Save to ledger"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setParsedDraft(null)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Discard
                  </button>
                  <Link
                    to="/transactions#add-transaction"
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-[#0f766e] hover:bg-slate-50"
                  >
                    Open full form
                  </Link>
                </div>
              </div>
            ) : null}

            <button
              type="button"
              disabled={Boolean(sub && !sub.canUseAiFeatures)}
              onClick={() => setCoachOpen(true)}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-55"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#0f766e]"
                aria-hidden
              >
                <i className="fas fa-comments text-lg" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">Open finance coach</p>
                <p className="text-xs text-slate-500">Ask questions about this period — typed or by voice.</p>
              </div>
              <i className="fas fa-chevron-right text-xs text-slate-400" aria-hidden />
            </button>

            <FinanceCoachDialog
              open={coachOpen}
              onOpenChange={setCoachOpen}
              periodLabel={periodLabel}
              rowsForAi={rowsForAi}
              userId={user?.id}
            />

            <section>
              <h2 className="mb-2.5 text-sm font-bold text-slate-900">Quick Actions</h2>
              <div className="grid grid-cols-4 gap-1 px-0.5 sm:gap-2">
                <Link
                  to={addBlocked ? "/pricing" : "/transactions"}
                  className="flex flex-col items-center gap-1 rounded-lg py-1 transition hover:opacity-90"
                >
                  <div
                    className="mb-1 flex h-11 w-11 items-center justify-center rounded-full text-white shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${primary}, ${teal600})` }}
                  >
                    <i className="fas fa-camera text-[15px]" />
                  </div>
                  <span className="text-center text-[10px] font-semibold text-slate-600">Scan</span>
                </Link>
                <Link
                  to={addBlocked ? "/pricing" : "/upload-statement"}
                  className="flex flex-col items-center gap-1 rounded-lg py-1 transition hover:opacity-90"
                >
                  <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full border border-blue-200 bg-blue-100 text-blue-600">
                    <i className="fas fa-cloud-upload-alt text-[15px]" />
                  </div>
                  <span className="text-center text-[10px] font-semibold text-slate-600">Upload</span>
                </Link>
                <Link
                  to={addBlocked ? "/pricing" : "/transactions#add-transaction"}
                  className="flex flex-col items-center gap-1 rounded-lg py-1 transition hover:opacity-90"
                >
                  <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full border border-purple-200 bg-purple-100 text-purple-600">
                    <i className="fas fa-plus-circle text-[15px]" />
                  </div>
                  <span className="text-center text-[10px] font-semibold text-slate-600">Add</span>
                </Link>
                <Link
                  to={budgetBlocked ? "/pricing" : "/budgets"}
                  className="flex flex-col items-center gap-1 rounded-lg py-1 transition hover:opacity-90"
                >
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
                      <li key={cat.category}>
                        <Link
                          to={`/transactions?category=${encodeURIComponent(cat.category)}`}
                          title={`View and edit ${cat.category} in Records`}
                          className="flex items-center justify-between gap-3 rounded-[10px] bg-slate-100 px-2.5 py-2.5 transition hover:bg-slate-200/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
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
                          <span className="flex shrink-0 items-center gap-2">
                            <span className="text-sm font-bold tabular-nums text-slate-900">{formatMoney(cat.amount)}</span>
                            <i className="fas fa-chevron-right text-[10px] text-slate-400" aria-hidden />
                          </span>
                        </Link>
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
                      role="button"
                      tabIndex={0}
                      onClick={() => setEditTx(tx)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setEditTx(tx);
                        }
                      }}
                      className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm outline-none ring-primary/30 transition hover:border-teal-200 hover:bg-teal-50/30 focus-visible:ring-2"
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
                          {tx.category} · {tx.date}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-sm font-bold tabular-nums ${tx.type === "expense" ? "text-rose-600" : ""}`}
                        style={tx.type !== "expense" ? { color: green600 } : undefined}
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
      <TransactionEditDialog
        open={editTx !== null}
        transaction={editTx}
        onClose={() => setEditTx(null)}
        workspace={workspace}
        userId={String(user!.id)}
      />
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
