import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";
import { useTransactions, useMonthlyTransactions } from "@/hooks/use-transactions";
import TransactionList from "@/components/transactions/TransactionList";
import EmptyState from "@/components/transactions/EmptyState";
import { useToast } from "@/hooks/use-toast";

const TransactionContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { transactions, summary, loading, deleteTransaction } = useMonthlyTransactions();
  const [filter, setFilter] = useState<'all' | 'expense' | 'income'>('all');

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      toast({ title: 'Transaction deleted' });
    } catch (error) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  return (
    <>
      {/* Summary Stats Block */}
      <div className="mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Period Summary</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
              <span>This Month</span>
              <i className="fas fa-chevron-down text-xs"></i>
            </button>
          </div>
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-sm text-gray-500 mb-1 font-medium">Income</div>
              <div className="text-2xl font-bold text-primary">${summary.totalIncome.toFixed(0)}</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-sm text-gray-500 mb-1 font-medium">Expenses</div>
              <div className="text-2xl font-bold text-rose-600">${summary.totalExpenses.toFixed(0)}</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-sm text-gray-500 mb-1 font-medium">Net</div>
              <div className="text-2xl font-bold text-gray-900">${summary.netBalance.toFixed(0)}</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-sm text-gray-500 mb-1 font-medium">Savings Rate</div>
              <div className="text-2xl font-bold text-primary">{summary.savingsRate.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg ${filter === 'all' ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('expense')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg ${filter === 'expense' ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
          >
            Expenses
          </button>
          <button 
            onClick={() => setFilter('income')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg ${filter === 'income' ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
          >
            Income
          </button>
        </div>
        <button 
          onClick={() => navigate('/add-transaction')}
          className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          Add Transaction
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {filter === 'all' ? 'All Transactions' : filter === 'expense' ? 'Expenses' : 'Income'}
          </h3>
          <span className="text-sm text-gray-500">{filteredTransactions.length} transactions</span>
        </div>
        
        {loading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        ) : filteredTransactions.length > 0 ? (
          <TransactionList 
            transactions={filteredTransactions} 
            variant="table" 
            onDelete={handleDelete}
          />
        ) : (
          <EmptyState 
            title="No transactions found"
            description={filter !== 'all' 
              ? `No ${filter} transactions yet. Add one to get started.` 
              : "Start tracking your finances by adding your first transaction."
            }
          />
        )}
      </div>
    </>
  );
};

const MobileTransaction = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { transactions, summary, loading, deleteTransaction } = useMonthlyTransactions();
  const [filter, setFilter] = useState<'all' | 'expense' | 'income'>('all');

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  return (
    <div className="font-sans bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 overflow-x-hidden min-h-screen">
      <style>{`::-webkit-scrollbar { display: none; }`}</style>

      {/* Status Bar */}
      <div id="status-bar" className="fixed top-0 left-0 right-0 h-10 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-between px-4 shadow-sm">
        <div className="text-xs font-semibold text-gray-900">9:41</div>
        <div className="flex items-center gap-1">
          <i className="fas fa-signal text-xs text-gray-900"></i>
          <i className="fas fa-wifi text-xs text-gray-900 ml-1"></i>
          <i className="fas fa-battery-full text-xs text-gray-900 ml-1"></i>
        </div>
      </div>

      {/* Root Container */}
      <div id="root-container" className="pt-10 min-h-screen flex flex-col pb-20">
        
        {/* Header Nav */}
        <div id="header-nav" className="sticky top-10 bg-white/90 backdrop-blur-md z-40 px-4 py-4 shadow-sm border-b border-gray-100">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <i className="fas fa-arrow-left text-gray-700"></i>
            </button>
            <h1 className="text-lg font-bold text-gray-900">Transactions</h1>
            <button 
              onClick={() => navigate('/add-transaction')}
              className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center"
            >
              <i className="fas fa-plus text-white"></i>
            </button>
          </div>
        </div>

        {/* Summary Stats Block */}
        <div id="summary-stats-block" className="px-4 pt-5 pb-4">
          <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-3xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">This Month</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1 font-medium">Income</div>
                <div className="text-lg font-bold text-primary">${summary.totalIncome.toFixed(0)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1 font-medium">Expenses</div>
                <div className="text-lg font-bold text-rose-600">${summary.totalExpenses.toFixed(0)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1 font-medium">Net</div>
                <div className="text-lg font-bold text-gray-900">${summary.netBalance.toFixed(0)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div id="filter-tabs" className="px-4 pb-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap ${filter === 'all' ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('expense')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap flex items-center gap-2 ${filter === 'expense' ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200'}`}
            >
              <i className="fas fa-circle text-rose-500 text-[8px]"></i>
              Expenses
            </button>
            <button 
              onClick={() => setFilter('income')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap flex items-center gap-2 ${filter === 'income' ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200'}`}
            >
              <i className="fas fa-circle text-primary text-[8px]"></i>
              Income
            </button>
          </div>
        </div>

        {/* Transactions List */}
        <div id="transactions-list" className="px-4 pb-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-20"></div>
              ))}
            </div>
          ) : filteredTransactions.length > 0 ? (
            <TransactionList transactions={filteredTransactions} variant="list" />
          ) : (
            <EmptyState 
              title="No transactions yet"
              description="Tap the + button to add your first transaction"
            />
          )}
        </div>

        {/* Bottom Nav */}
        <div id="bottom-nav" className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-2xl shadow-gray-900/10 z-50">
          <div className="flex items-center justify-around px-4 py-3">
            <button onClick={() => navigate('/dashboard')} className="flex flex-col items-center gap-1 text-gray-400 active:scale-95 transition-transform">
              <i className="fas fa-home text-xl"></i>
              <span className="text-xs font-medium">Home</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-primary active:scale-95 transition-transform">
              <i className="fas fa-list text-xl"></i>
              <span className="text-xs font-medium">Transactions</span>
            </button>
            <button onClick={() => navigate('/add-transaction')} className="relative -mt-6">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-teal-600 rounded-full shadow-lg shadow-primary/40 flex items-center justify-center">
                <i className="fas fa-plus text-white text-2xl"></i>
              </div>
            </button>
            <button onClick={() => navigate('/insight')} className="flex flex-col items-center gap-1 text-gray-400 active:scale-95 transition-transform">
              <i className="fas fa-chart-pie text-xl"></i>
              <span className="text-xs font-medium">Insights</span>
            </button>
            <button onClick={() => navigate('/setting')} className="flex flex-col items-center gap-1 text-gray-400 active:scale-95 transition-transform">
              <i className="fas fa-cog text-xl"></i>
              <span className="text-xs font-medium">Settings</span>
            </button>
          </div>
          <div className="h-6 bg-white"></div>
        </div>
      </div>
    </div>
  );
};

const Transaction = () => {
  return (
    <ResponsiveLayout 
      variant="app" 
      showSidebar={true} 
      mobileContent={<MobileTransaction />}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-600">View and manage all your transactions</p>
      </div>
      <TransactionContent />
    </ResponsiveLayout>
  );
};

export default Transaction;
