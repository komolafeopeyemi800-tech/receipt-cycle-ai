import { useNavigate } from "react-router-dom";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";

const NotificationContent = () => {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Notifications</h1>
          <p className="text-sm text-gray-600">Stay updated with your finances</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5 rounded-lg transition-colors">
            Mark all read
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors">
            <i className="fas fa-cog mr-2"></i>Settings
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-primary/10 to-teal-50 rounded-2xl p-6 border border-primary/20 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/80 flex items-center justify-center shadow-sm">
            <i className="fas fa-bell text-2xl text-primary"></i>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">You have 8 new notifications</h3>
            <p className="text-sm text-gray-600">3 budget alerts • 2 reminders • 3 system updates</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold shadow-md">
          <i className="fas fa-th-large mr-2"></i>All
        </button>
        <button className="px-4 py-2 rounded-xl bg-white text-gray-700 text-sm font-semibold border border-gray-200 hover:bg-gray-50">
          <i className="fas fa-exclamation-triangle mr-2"></i>Alerts
        </button>
        <button className="px-4 py-2 rounded-xl bg-white text-gray-700 text-sm font-semibold border border-gray-200 hover:bg-gray-50">
          <i className="fas fa-clock mr-2"></i>Reminders
        </button>
        <button className="px-4 py-2 rounded-xl bg-white text-gray-700 text-sm font-semibold border border-gray-200 hover:bg-gray-50">
          <i className="fas fa-info-circle mr-2"></i>System
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {/* Budget Exceeded */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-start gap-4 p-5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-exclamation-circle text-lg text-red-600"></i>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Monthly Budget Exceeded</h3>
                <span className="text-xs text-gray-500">2h ago</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">You've spent $2,847 this month, exceeding your $2,500 budget by $347. Consider reviewing your dining expenses.</p>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90">View Details</button>
                <button className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200">Dismiss</button>
              </div>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
        </div>

        {/* Bill Reminder */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-start gap-4 p-5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-bell text-lg text-amber-600"></i>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Bill Payment Reminder</h3>
                <span className="text-xs text-gray-500">5h ago</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">Your electricity bill of $187.50 is due in 3 days. Tap to schedule payment now.</p>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90">Pay Now</button>
                <button className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200">Snooze</button>
              </div>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-600"></div>
        </div>

        {/* Money Leak */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-start gap-4 p-5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-fire text-lg text-orange-600"></i>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Money Leak Detected</h3>
                <span className="text-xs text-gray-500">8h ago</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">Found duplicate subscription: Netflix charged twice this month ($15.99 each). Review and request refund.</p>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90">Take Action</button>
                <button className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200">Ignore</button>
              </div>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
        </div>

        {/* Receipt Processed */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-start gap-4 p-5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-receipt text-lg text-blue-600"></i>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Receipt Processed Successfully</h3>
                <span className="text-xs text-gray-500">12h ago</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">Your receipt from Whole Foods Market ($124.67) has been scanned and categorized as Groceries.</p>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90">View Receipt</button>
              </div>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
        </div>

        {/* Weekly Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-start gap-4 p-5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-chart-line text-lg text-purple-600"></i>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Weekly Spending Summary Ready</h3>
                <span className="text-xs text-gray-500">1d ago</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">You spent $487 this week, 12% less than last week. Great job! Top category: Dining ($156).</p>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90">View Report</button>
              </div>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
        </div>
      </div>

      {/* Older Notifications */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Older Notifications</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/80 rounded-xl p-4 border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-piggy-bank text-sm text-teal-600"></i>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Savings Goal Reached</h4>
              <p className="text-xs text-gray-600 truncate">You've saved $1,000 toward your vacation fund!</p>
            </div>
            <span className="text-xs text-gray-400">3d ago</span>
          </div>
          <div className="bg-white/80 rounded-xl p-4 border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-tag text-sm text-pink-600"></i>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Category Suggestion</h4>
              <p className="text-xs text-gray-600 truncate">Auto-categorized 5 Uber transactions as Transport</p>
            </div>
            <span className="text-xs text-gray-400">3d ago</span>
          </div>
        </div>
      </div>
    </>
  );
};

const MobileNotification = () => {
  const navigate = useNavigate();

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
          <button className="w-10 h-10 rounded-xl bg-gray-100/80 flex items-center justify-center">
            <i className="fas fa-cog text-gray-900"></i>
          </button>
        </div>

        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Recent Activity</h2>
              <p className="text-sm text-gray-600">Stay updated with your finances</p>
            </div>
            <button className="text-sm font-semibold text-primary">Mark all read</button>
          </div>
          <div className="bg-gradient-to-r from-primary/10 to-teal-50 rounded-2xl p-4 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center shadow-sm">
                <i className="fas fa-bell text-xl text-primary"></i>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">You have 8 new notifications</h3>
                <p className="text-xs text-gray-600">3 budget alerts • 2 reminders • 3 system updates</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold shadow-md whitespace-nowrap">
              <i className="fas fa-th-large mr-1.5"></i>All
            </button>
            <button className="px-4 py-2 rounded-xl bg-white/60 text-gray-700 text-sm font-semibold border border-gray-200 whitespace-nowrap">
              <i className="fas fa-exclamation-triangle mr-1.5"></i>Alerts
            </button>
            <button className="px-4 py-2 rounded-xl bg-white/60 text-gray-700 text-sm font-semibold border border-gray-200 whitespace-nowrap">
              <i className="fas fa-clock mr-1.5"></i>Reminders
            </button>
            <button className="px-4 py-2 rounded-xl bg-white/60 text-gray-700 text-sm font-semibold border border-gray-200 whitespace-nowrap">
              <i className="fas fa-info-circle mr-1.5"></i>System
            </button>
          </div>
        </div>

        <div className="px-4 pb-6 space-y-3">
          {/* Notification Items */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-gray-100/50 overflow-hidden">
            <div className="flex items-start gap-3 p-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-exclamation-circle text-lg text-red-600"></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">Monthly Budget Exceeded</h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap">2h ago</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-3">You've spent $2,847 this month, exceeding your $2,500 budget by $347.</p>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold">View Details</button>
                  <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold">Dismiss</button>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-gray-100/50 overflow-hidden">
            <div className="flex items-start gap-3 p-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-bell text-lg text-amber-600"></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">Bill Payment Reminder</h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap">5h ago</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-3">Your electricity bill of $187.50 is due in 3 days.</p>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold">Pay Now</button>
                  <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold">Snooze</button>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-600"></div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-gray-100/50 overflow-hidden">
            <div className="flex items-start gap-3 p-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-fire text-lg text-orange-600"></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">Money Leak Detected</h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap">8h ago</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-3">Found duplicate Netflix charge ($15.99 each). Review and request refund.</p>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold">Take Action</button>
                  <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold">Ignore</button>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-lg border-t border-gray-100 z-50">
          <div className="flex items-center justify-around h-16 px-4 max-w-md mx-auto">
            <button onClick={() => navigate('/dashboard')} className="flex flex-col items-center gap-1 p-2">
              <i className="fas fa-home text-lg text-gray-400"></i>
              <span className="text-[10px] font-medium text-gray-400">Home</span>
            </button>
            <button onClick={() => navigate('/transaction')} className="flex flex-col items-center gap-1 p-2">
              <i className="fas fa-exchange-alt text-lg text-gray-400"></i>
              <span className="text-[10px] font-medium text-gray-400">Transactions</span>
            </button>
            <button onClick={() => navigate('/add-transaction')} className="w-14 h-14 -mt-6 rounded-2xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shadow-lg shadow-primary/30">
              <i className="fas fa-plus text-white text-xl"></i>
            </button>
            <button onClick={() => navigate('/insight')} className="flex flex-col items-center gap-1 p-2">
              <i className="fas fa-chart-pie text-lg text-gray-400"></i>
              <span className="text-[10px] font-medium text-gray-400">Insights</span>
            </button>
            <button onClick={() => navigate('/setting')} className="flex flex-col items-center gap-1 p-2">
              <i className="fas fa-cog text-lg text-gray-400"></i>
              <span className="text-[10px] font-medium text-gray-400">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Notification = () => {
  return (
    <ResponsiveLayout
      mobileContent={<MobileNotification />}
      variant="app"
      showSidebar={true}
    >
      <NotificationContent />
    </ResponsiveLayout>
  );
};

export default Notification;
