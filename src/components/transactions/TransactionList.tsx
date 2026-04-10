import type { Transaction } from "@/types/transaction";
import { useWebPreferences } from "@/contexts/WebPreferencesContext";

interface TransactionListProps {
  transactions: Transaction[];
  loading?: boolean;
  variant?: "table" | "list";
  onDelete?: (id: string) => void;
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

export const TransactionList = ({ transactions, loading, variant = "list", onDelete }: TransactionListProps) => {
  const { formatMoney, formatDate } = useWebPreferences();

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100"></div>
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Transaction</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Category</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Amount</th>
            <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Receipt</th>
            <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((tx) => {
            const icon = getCategoryIcon(tx.category);
            return (
              <tr key={tx.id} className="transition-colors hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                      <i className={`fas ${icon} text-teal-700`}></i>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{tx.merchant || tx.category}</div>
                      <div className="text-xs text-gray-500">{tx.description || tx.payment_method || "No description"}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{tx.category}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(tx.date)}</td>
                <td
                  className={`px-6 py-4 text-right text-sm font-bold ${tx.type === "expense" ? "text-rose-600" : "text-primary"}`}
                >
                  {tx.type === "expense" ? "-" : "+"}
                  {formatMoney(tx.amount)}
                </td>
                <td className="px-6 py-4 text-center">
                  {tx.receipt_url ? (
                    <i className="fas fa-receipt text-primary"></i>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <button onClick={() => onDelete?.(tx.id)} className="text-gray-400 hover:text-red-600" type="button">
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => {
        const icon = getCategoryIcon(tx.category);
        return (
          <div key={tx.id} className="rounded-2xl border border-gray-100/50 bg-white/70 p-4 shadow-md backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-teal-50">
                <i className={`fas ${icon} text-lg text-teal-700`}></i>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <span className="truncate text-sm font-semibold text-gray-900">{tx.merchant || tx.category}</span>
                  <span className={`text-sm font-bold ${tx.type === "expense" ? "text-rose-600" : "text-primary"}`}>
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
          </div>
        );
      })}
    </div>
  );
};

export default TransactionList;
