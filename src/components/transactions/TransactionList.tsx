import { Transaction } from '@/hooks/use-transactions';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

interface TransactionListProps {
  transactions: Transaction[];
  loading?: boolean;
  variant?: 'table' | 'list';
  onDelete?: (id: string) => void;
}

const getCategoryIcon = (category: string) => {
  const icons: Record<string, { icon: string; color: string }> = {
    'Food & Dining': { icon: 'fa-utensils', color: 'orange' },
    'Shopping': { icon: 'fa-shopping-cart', color: 'blue' },
    'Transportation': { icon: 'fa-car', color: 'purple' },
    'Bills': { icon: 'fa-home', color: 'green' },
    'Health': { icon: 'fa-heartbeat', color: 'red' },
    'Entertainment': { icon: 'fa-film', color: 'pink' },
    'Education': { icon: 'fa-graduation-cap', color: 'indigo' },
    'Income': { icon: 'fa-dollar-sign', color: 'emerald' },
    'Other': { icon: 'fa-ellipsis-h', color: 'gray' },
  };
  return icons[category] || icons['Other'];
};

const formatDate = (dateString: string) => {
  const date = parseISO(dateString);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
};

export const TransactionList = ({ transactions, loading, variant = 'list', onDelete }: TransactionListProps) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-20"></div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Receipt</th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((tx) => {
            const { icon, color } = getCategoryIcon(tx.category);
            return (
              <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-${color}-50 to-${color}-100 flex items-center justify-center`}>
                      <i className={`fas ${icon} text-${color}-600`}></i>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{tx.merchant || tx.category}</div>
                      <div className="text-xs text-gray-500">{tx.description || tx.payment_method || 'No description'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 bg-${color}-50 text-${color}-700 text-xs font-semibold rounded`}>
                    {tx.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(tx.date)}</td>
                <td className={`px-6 py-4 text-right text-sm font-bold ${tx.type === 'expense' ? 'text-rose-600' : 'text-primary'}`}>
                  {tx.type === 'expense' ? '-' : '+'}${tx.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-center">
                  {tx.receipt_url ? (
                    <i className="fas fa-receipt text-primary"></i>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => onDelete?.(tx.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
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

  // Mobile list variant
  return (
    <div className="space-y-3">
      {transactions.map((tx) => {
        const { icon, color } = getCategoryIcon(tx.category);
        return (
          <div key={tx.id} className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md border border-gray-100/50">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${color}-50 to-${color}-100 flex items-center justify-center flex-shrink-0`}>
                <i className={`fas ${icon} text-lg text-${color}-600`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {tx.merchant || tx.category}
                  </span>
                  <span className={`text-sm font-bold ${tx.type === 'expense' ? 'text-rose-600' : 'text-primary'}`}>
                    {tx.type === 'expense' ? '-' : '+'}${tx.amount.toFixed(2)}
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
