import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type PeriodMode = "month" | "all";
export type TxFilter = "all" | "expense" | "income";

type Props = {
  mode: PeriodMode;
  onModeChange: (m: PeriodMode) => void;
  monthLabel: string;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  expense: number;
  income: number;
  total: number;
  formatCompact: (n: number) => string;
  filter: TxFilter;
  onFilterChange: (f: TxFilter) => void;
};

/** Port of `apps/mobile/src/components/FinancialPeriodSummary.tsx` for web dashboard. */
export function FinancialPeriodSummaryWeb({
  mode,
  onModeChange,
  monthLabel,
  onPrevMonth,
  onNextMonth,
  expense,
  income,
  total,
  formatCompact,
  filter,
  onFilterChange,
}: Props) {
  const [filterOpen, setFilterOpen] = useState(false);
  const monthNavDisabled = false;
  const canNav = mode === "month" && !monthNavDisabled;

  return (
    <div className="mb-2.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2.5">
      <div className="mb-2 flex gap-1.5">
        {(["month", "all"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onModeChange(m)}
            className={`rounded-full border px-2.5 py-1 text-[10px] font-bold transition-colors ${
              mode === m
                ? "border-[#0f766e] bg-[#0f766e] text-white"
                : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            {m === "month" ? "Month" : "All time"}
          </button>
        ))}
      </div>

      <div className="mb-2.5 flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous month"
          disabled={!canNav}
          onClick={() => canNav && onPrevMonth?.()}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-opacity ${
            canNav ? "text-slate-800 hover:bg-slate-50" : "cursor-not-allowed opacity-45 text-slate-400"
          }`}
        >
          <i className="fas fa-chevron-left text-sm" aria-hidden />
        </button>

        <p className="min-w-0 flex-1 text-center text-xs font-bold text-slate-900">
          {mode === "month" ? monthLabel : "All dates in view"}
        </p>

        <button
          type="button"
          aria-label="Next month"
          disabled={!canNav}
          onClick={() => canNav && onNextMonth?.()}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-opacity ${
            canNav ? "text-slate-800 hover:bg-slate-50" : "cursor-not-allowed opacity-45 text-slate-400"
          }`}
        >
          <i className="fas fa-chevron-right text-sm" aria-hidden />
        </button>

        <button
          type="button"
          aria-label="Filter transactions"
          onClick={() => setFilterOpen(true)}
          className="ml-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-50"
        >
          <i className="fas fa-sliders text-sm" aria-hidden />
        </button>
      </div>

      <div className="flex gap-1 border-t border-slate-200 pt-2.5">
        <div className="min-w-0 flex-1 px-0.5 text-center">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Expense</p>
          <p className="truncate text-[13px] font-bold tabular-nums text-rose-600">{formatCompact(expense)}</p>
        </div>
        <div className="min-w-0 flex-1 px-0.5 text-center">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Income</p>
          <p className="truncate text-[13px] font-bold tabular-nums text-green-600">{formatCompact(income)}</p>
        </div>
        <div className="min-w-0 flex-1 px-0.5 text-center">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Total</p>
          <p
            className={`truncate text-[13px] font-bold tabular-nums ${total < 0 ? "text-rose-600" : "text-slate-900"}`}
          >
            {formatCompact(total)}
          </p>
        </div>
      </div>

      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="max-w-sm gap-0 p-4">
          <DialogHeader className="mb-3 text-left">
            <DialogTitle className="text-base">Show transactions</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            {(["all", "expense", "income"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  onFilterChange(f);
                  setFilterOpen(false);
                }}
                className={`flex items-center justify-between rounded-[10px] border px-2.5 py-3 text-left text-[13px] font-semibold ${
                  filter === f
                    ? "border-[#0f766e] bg-emerald-50 text-[#0f766e]"
                    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                }`}
              >
                {f === "all" ? "All" : f === "expense" ? "Expenses only" : "Income only"}
                {filter === f ? <i className="fas fa-check text-[#0f766e]" aria-hidden /> : <span />}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setFilterOpen(false)}
            className="mt-3 w-full py-3 text-center text-[11px] font-semibold text-slate-600 hover:text-slate-900"
          >
            Close
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
