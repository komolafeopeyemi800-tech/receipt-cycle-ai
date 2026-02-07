import { useNavigate } from "react-router-dom";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";
import { useRecentTransactions } from "@/hooks/use-transactions";
import { format, parseISO } from "date-fns";
import EmptyState from "@/components/transactions/EmptyState";

const NotificationContent = () => {
  const navigate = useNavigate();
  const { transactions, loading } = useRecentTransactions(10);

  // Generate notifications from recent transactions
  const notifications = transactions.map((tx) => ({
    id: tx.id,
    type: tx.type === 'expense' ? 'expense' : 'income',
    title: tx.type === 'expense' ? 'Expense Recorded' : 'Income Received',
    message: `${tx.merchant || tx.category}: $${tx.amount.toFixed(2)}`,
    time: format(parseISO(tx.created_at), 'h:mm a'),
    date: format(parseISO(tx.created_at), 'MMM d'),
    icon: tx.type === 'expense' ? 'fa-credit-card' : 'fa-dollar-sign',
    color: tx.type === 'expense' ? 'rose' : 'green',
  }));

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Notifications</h1>
          <p className="text-sm text-gray-600">Stay updated with your finances</p>
        </div>
        <button 
          onClick={() => navigate('/add-transaction')}
          className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg shadow-md"
        >
          <i className="fas fa-plus mr-2"></i>Add Transaction
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-primary/10 to-teal-50 rounded-2xl p-6 border border-primary/20 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/80 flex items-center justify-center shadow-sm">
            <i className="fas fa-bell text-2xl text-primary"></i>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {notifications.length > 0 
                ? `You have ${notifications.length} recent activities`
                : 'No recent activity'
              }
            </h3>
            <p className="text-sm text-gray-600">
              {notifications.length > 0 
                ? 'Based on your recent transactions'
                : 'Add transactions to see activity here'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-24"></div>
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <div key={notif.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-start gap-4 p-5">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${notif.color}-50 to-${notif.color}-100 flex items-center justify-center flex-shrink-0`}>
                  <i className={`fas ${notif.icon} text-lg text-${notif.color}-600`}></i>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-900">{notif.title}</h3>
                    <span className="text-xs text-gray-500">{notif.date}</span>
                  </div>
                  <p className="text-sm text-gray-600">{notif.message}</p>
                </div>
              </div>
              <div className={`h-1 bg-gradient-to-r from-${notif.color}-500 to-${notif.color}-600`}></div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState 
          title="No notifications yet"
          description="Start adding transactions to see your activity here"
          icon="fa-bell"
        />
      )}
    </>
  );
};

const MobileNotification = () => {
  const navigate = useNavigate();
  const { transactions, loading } = useRecentTransactions(10);

  const notifications = transactions.map((tx) => ({
    id: tx.id,
    type: tx.type === 'expense' ? 'expense' : 'income',
    title: tx.type === 'expense' ? 'Expense Recorded' : 'Income Received',
    message: `${tx.merchant || tx.category}: $${tx.amount.toFixed(2)}`,
    time: format(parseISO(tx.created_at), 'h:mm a'),
    date: format(parseISO(tx.created_at), 'MMM d'),
    icon: tx.type === 'expense' ? 'fa-credit-card' : 'fa-dollar-sign',
    color: tx.type === 'expense' ? 'rose' : 'green',
  }));

  return (
    <div className="font-sans bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 overflow-x-hidden">
      <div className="fixed top-0 left-0 right-0 h-10 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-between px-4 shadow-sm">
        <div className="text-xs font-semibold text-gray-900">9:41</div>
        <div className="flex items-center gap-1">
          <i className="fas fa-signal text-xs text-gray-900"></i>
          <i className="fas fa-wifi text-xs text-gray-900 ml-1"></i>
          <i className="fas fa-battery-full text-xs text-gray-900 ml-1"></i>
        </div>
      </div>

      <div className="pt-10 min-h-screen flex flex-col pb-20">
        <div className="sticky top-10 bg-white/90 backdrop-blur-md shadow-sm z-40 px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-gray-100/80 flex items-center justify-center">
            <i className="fas fa-arrow-left text-gray-900"></i>
          </button>
          <h1 className="text-lg font-bold text-gray-900">Notifications</h1>
          <div className="w-10 h-10"></div>
        </div>

        <div className="px-4 pt-6 pb-4">
          <div className="bg-gradient-to-r from-primary/10 to-teal-50 rounded-2xl p-4 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center shadow-sm">
                <i className="fas fa-bell text-xl text-primary"></i>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  {notifications.length > 0 
                    ? `${notifications.length} recent activities`
                    : 'No activity yet'
                  }
                </h3>
                <p className="text-xs text-gray-600">
                  {notifications.length > 0 
                    ? 'Based on your transactions'
                    : 'Add transactions to see activity'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-6 space-y-3">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-20"></div>
            ))
          ) : notifications.length > 0 ? (
            notifications.map((notif) => (
              <div key={notif.id} className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-gray-100/50 overflow-hidden">
                <div className="flex items-start gap-3 p-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${notif.color}-50 to-${notif.color}-100 flex items-center justify-center flex-shrink-0`}>
                    <i className={`fas ${notif.icon} text-lg text-${notif.color}-600`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900">{notif.title}</h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap">{notif.date}</span>
                    </div>
                    <p className="text-xs text-gray-600">{notif.message}</p>
                  </div>
                </div>
                <div className={`h-1 bg-gradient-to-r from-${notif.color}-500 to-${notif.color}-600`}></div>
              </div>
            ))
          ) : (
            <EmptyState 
              title="No notifications"
              description="Add transactions to see activity"
              icon="fa-bell"
            />
          )}
        </div>

        {/* Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-2xl shadow-gray-900/10 z-50">
          <div className="flex items-center justify-around px-4 py-3">
            <button onClick={() => navigate('/dashboard')} className="flex flex-col items-center gap-1 text-gray-400">
              <i className="fas fa-home text-xl"></i>
              <span className="text-xs font-medium">Home</span>
            </button>
            <button onClick={() => navigate('/transaction')} className="flex flex-col items-center gap-1 text-gray-400">
              <i className="fas fa-list text-xl"></i>
              <span className="text-xs font-medium">Transactions</span>
            </button>
            <button onClick={() => navigate('/add-transaction')} className="relative -mt-6">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-teal-600 rounded-full shadow-lg shadow-primary/40 flex items-center justify-center">
                <i className="fas fa-plus text-white text-2xl"></i>
              </div>
            </button>
            <button onClick={() => navigate('/insight')} className="flex flex-col items-center gap-1 text-gray-400">
              <i className="fas fa-chart-pie text-xl"></i>
              <span className="text-xs font-medium">Insights</span>
            </button>
            <button onClick={() => navigate('/setting')} className="flex flex-col items-center gap-1 text-gray-400">
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

const Notification = () => {
  return (
    <ResponsiveLayout 
      variant="app" 
      showSidebar={true} 
      mobileContent={<MobileNotification />}
    >
      <NotificationContent />
    </ResponsiveLayout>
  );
};

export default Notification;
