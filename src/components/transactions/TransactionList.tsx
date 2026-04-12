import type { Transaction } from "@/types/transaction";
import { useWebPreferences } from "@/contexts/WebPreferencesContext";
import { cn } from "@/lib/utils";

interface TransactionListProps {
  transactions: Transaction[];
  loading?: boolean;
  variant?: "table" | "list";
  onDelete?: (id: string) => void;
  /** Opens edit sheet (same as mobile detail → edit). */
  onSelect?: (tx: Transaction) => void;
}

const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    "Food & Dining": "fa-utensils",
    Shopping: "fa-shopping-cart",
    Transportation: "fa-car",
    Bills: "fa-home",
    Health: "fa-heartbeat",
    Entertainment: "fa-film",
    Education: "fa-graduation-cap",
    Income: "fa-dollar-sign",
    Other: "fa-ellipsis-h",
  };
  return icons[category] || icons.Other;
};

export const TransactionList = ({
  transactions,
  loading,
  variant = "list",
  onDelete,
  onSelect,
}: TransactionListProps) => {
  const { formatMoney, formatDate } = useWebPreferences();

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className="space-y-3">
        {/* Mobile / small tablet: tappable cards */}
        <div className="md:hidden space-y-2">
          {transactions.map((tx) => {
            const icon = getCategoryIcon(tx.category);
            return (
              <div
                key={tx.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect?.(tx)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect?.(tx);
                  }
                }}
                className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm outline-none ring-primary/30 focus-visible:ring-2"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50">
                    <i className={cn("fas text-teal-700", icon)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-gray-900">{tx.merchant || tx.category}</p>
                      <span
                        className={cn(
                          "shrink-0 text-sm font-bold tabular-nums",
                          tx.type === "expense" ? "text-rose-600" : "text-primary",
                        )}
                      >
                        {tx.type === "expense" ? "-" : "+"}
                        {formatMoney(tx.amount)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{tx.description || tx.payment_method || "—"}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {tx.category}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(tx.date)}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                      <span className="text-xs font-semibold text-primary">Tap to edit</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete?.(tx.id);
                        }}
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        <i className="fas fa-trash mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* md+: table */}
        <div className="hidden overflow-x-auto rounded-xl border border-gray-200 md:block">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 lg:px-6">
                  Transaction
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 lg:px-6">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 lg:px-6">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 lg:px-6">
                  Amount
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 lg:px-6">
                  Receipt
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 lg:px-6">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((tx) => {
                const icon = getCategoryIcon(tx.category);
                return (
                  <tr
                    key={tx.id}
                    onClick={() => onSelect?.(tx)}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-gray-50",
                      onSelect && "hover:bg-teal-50/40",
                    )}
                  >
                    <td className="px-4 py-4 lg:px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                          <i className={cn("fas text-teal-700", icon)} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{tx.merchant || tx.category}</div>
                          <div className="text-xs text-gray-500">
                            {tx.description || tx.payment_method || "No description"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 lg:px-6">
                      <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        {tx.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 lg:px-6">{formatDate(tx.date)}</td>
                    <td
                      className={cn(
                        "px-4 py-4 text-right text-sm font-bold lg:px-6",
                        tx.type === "expense" ? "text-rose-600" : "text-primary",
                      )}
                    >
                      {tx.type === "expense" ? "-" : "+"}
                      {formatMoney(tx.amount)}
                    </td>
                    <td className="px-4 py-4 text-center lg:px-6">
                      {tx.receipt_url ? (
                        <i className="fas fa-receipt text-primary" />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center lg:px-6">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete?.(tx.id);
                        }}
                        className="text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <i className="fas fa-trash" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => {
        const icon = getCategoryIcon(tx.category);
        return (
          <button
            key={tx.id}
            type="button"
            onClick={() => onSelect?.(tx)}
            className="w-full rounded-2xl border border-gray-100/50 bg-white/70 p-4 text-left shadow-md backdrop-blur-sm outline-none ring-primary/30 focus-visible:ring-2"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50">
                <i className={cn("fas text-lg text-teal-700", icon)} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <span className="truncate text-sm font-semibold text-gray-900">{tx.merchant || tx.category}</span>
                  <span className={cn("text-sm font-bold", tx.type === "expense" ? "text-rose-600" : "text-primary")}>
                    {tx.type === "expense" ? "-" : "+"}
                    {formatMoney(tx.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{tx.category}</span>
                  <span className="text-xs text-gray-400">{formatDate(tx.date)}</span>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default TransactionList;
