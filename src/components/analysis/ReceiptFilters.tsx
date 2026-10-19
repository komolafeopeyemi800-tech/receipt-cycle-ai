import { Link } from "react-router-dom";
import type { DocTx } from "@/lib/transactionMath";
import { useWebExport } from "@/hooks/useWebExport";
import { NO_FILTER, applyReceiptFilters, filterChoices, filterFilePrefix, isFiltering, type ReceiptFilterState } from "@mobile-lib/receiptFilters";

export { NO_FILTER, applyReceiptFilters, isFiltering, type ReceiptFilterState };

type Props = {
  rows: DocTx[];
  filtered: DocTx[];
  filter: ReceiptFilterState;
  onChange: (next: ReceiptFilterState) => void;
  formatMoney: (n: number) => string;
  loading: boolean;
};

const field = "w-full border border-slate-300 bg-white px-3 py-2.5 text-base sm:py-2 sm:text-sm text-slate-900 focus:border-teal-600 focus:outline-none";

/** Filter the receipts on the Analysis page by category and merchant, see only those, and export exactly that list. */
export function ReceiptFilters({ rows, filtered, filter, onChange, formatMoney, loading }: Props) {
  const exporter = useWebExport();
  const { categories, merchants } = filterChoices(rows);
  const active = isFiltering(filter);
  const ids = new Set(filtered.map((t) => String(t.id)));
  const total = filtered.reduce((sum, t) => sum + (t.type === "income" ? 0 : t.amount), 0);
  const prefix = filterFilePrefix(filter);
  const busy = exporter.busy !== null;
  const nothing = filtered.length === 0;

  return (
    <section className="border border-slate-200 bg-white p-4" aria-labelledby="receipt-filters-title">
      <h2 id="receipt-filters-title" className="text-sm font-bold text-slate-900">Find receipts</h2>
      <p className="mt-1 text-xs text-slate-500">Pick a category or a merchant to see only those receipts, then export that exact list.</p>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="block text-xs font-semibold text-slate-600">
          Category
          <select className={`${field} mt-1`} value={filter.category} onChange={(e) => onChange({ ...filter, category: e.target.value })}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold text-slate-600">
          Merchant
          <input
            className={`${field} mt-1`}
            list="receipt-filter-merchants"
            placeholder="All merchants"
            value={filter.merchant}
            onChange={(e) => onChange({ ...filter, merchant: e.target.value })}
          />
          <datalist id="receipt-filter-merchants">
            {merchants.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </label>
        <label className="block text-xs font-semibold text-slate-600">
          Type
          <select className={`${field} mt-1`} value={filter.type} onChange={(e) => onChange({ ...filter, type: e.target.value as ReceiptFilterState["type"] })}>
            <option value="all">Expenses and income</option>
            <option value="expense">Expenses only</option>
            <option value="income">Income only</option>
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <p>
          {loading ? "Loading…" : `${filtered.length} ${filtered.length === 1 ? "receipt" : "receipts"}`}
          {active && !loading ? <span className="font-semibold text-slate-900"> · {formatMoney(total)} spent</span> : null}
        </p>
        {active ? (
          <button type="button" className="font-semibold text-teal-700 underline underline-offset-2" onClick={() => onChange(NO_FILTER)}>
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={busy || nothing || loading}
          onClick={() => void exporter.run("csv", ids, prefix)}
          className="min-h-11 w-full bg-slate-900 px-3 py-2 text-sm font-bold sm:w-auto sm:text-xs text-white disabled:opacity-50"
        >
          <i className="fas fa-file-csv mr-1.5" />Export receipts (CSV)
        </button>
        <button
          type="button"
          disabled={busy || nothing || loading}
          onClick={() => void exporter.run("items", ids, `${prefix}-items`)}
          className="min-h-11 w-full bg-teal-700 px-3 py-2 text-sm font-bold sm:w-auto sm:text-xs text-white disabled:opacity-50"
          title="One row per item bought, with the price change since the last time, for tracking prices across receipts"
        >
          <i className="fas fa-list-check mr-1.5" />Export items and prices (CSV)
        </button>
        <button
          type="button"
          disabled={busy || nothing || loading}
          onClick={() => void exporter.run("xlsx", ids, prefix)}
          className="min-h-11 w-full border border-slate-300 bg-white px-3 py-2 text-sm font-bold sm:w-auto sm:text-xs text-slate-800 disabled:opacity-50"
        >
          <i className="fas fa-file-excel mr-1.5" />Excel
        </button>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">Items and prices lists every line on the filtered receipts and shows how each item's price changed since you last bought it.</p>
      {exporter.error ? (
        <p className="mt-2 text-xs text-rose-600" role="alert">
          {exporter.error.message}{" "}
          {exporter.error.code === "pro" ? <Link to="/pricing" className="font-bold underline">View plans</Link> : null}
        </p>
      ) : null}
      {exporter.done ? <p className="mt-2 text-xs text-emerald-700" role="status">Exported {exporter.done.count} {exporter.done.count === 1 ? "receipt" : "receipts"}.</p> : null}

      {active && !loading ? (
        <ul className="mt-3 max-h-80 divide-y divide-slate-100 overflow-y-auto border border-slate-200" aria-label="Matching receipts">
          {nothing ? (
            <li className="p-3 text-sm text-slate-500">No receipts match these filters.</li>
          ) : (
            filtered.slice(0, 200).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-slate-900">{t.merchant || t.description || "Untitled"}</span>
                  <span className="block text-[11px] text-slate-500">{t.date} · {t.category}</span>
                </span>
                <span className={`shrink-0 font-bold tabular-nums ${t.type === "income" ? "text-emerald-700" : "text-slate-900"}`}>{formatMoney(t.amount)}</span>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </section>
  );
}
