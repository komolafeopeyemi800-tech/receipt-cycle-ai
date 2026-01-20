import { useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";

const Notification = () => {
  const navigate = useNavigate();

  return (
    <div className="font-sans bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 overflow-x-hidden">

      <div id="status-bar" className="fixed top-0 left-0 right-0 h-10 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-between px-4 shadow-sm">
        <div className="text-xs font-semibold text-gray-900">9:41</div>
        <div className="flex items-center gap-1">
          <i className="fas fa-signal text-xs text-gray-900"></i>
          <i className="fas fa-wifi text-xs text-gray-900 ml-1"></i>
          <i className="fas fa-battery-full text-xs text-gray-900 ml-1"></i>
        </div>
      </div>

      <div id="root-container" className="pt-10 min-h-screen flex flex-col pb-20">
        
        <div id="header" className="sticky top-10 bg-white/90 backdrop-blur-md shadow-sm z-40 px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-gray-100/80 flex items-center justify-center hover:bg-gray-200/80 transition-colors active:scale-95">
            <i className="fas fa-arrow-left text-gray-900"></i>
          </button>
          <h1 className="text-lg font-bold text-gray-900">Notifications</h1>
          <button className="w-10 h-10 rounded-xl bg-gray-100/80 flex items-center justify-center hover:bg-gray-200/80 transition-colors active:scale-95">
            <i className="fas fa-cog text-gray-900"></i>
          </button>
        </div>

        <div id="notifications-header-section" className="px-4 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Recent Activity</h2>
              <p className="text-sm text-gray-600">Stay updated with your finances</p>
            </div>
            <button className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors">
              Mark all read
            </button>
          </div>
          <div className="bg-gradient-to-r from-primary/10 to-teal-50 rounded-2xl p-4 border border-primary/20 shadow-sm">
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

        <div id="filter-tabs-section" className="px-4 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold shadow-md shadow-primary/30 whitespace-nowrap flex-shrink-0 active:scale-95 transition-transform">
              <i className="fas fa-th-large mr-1.5"></i>All
            </button>
            <button className="px-4 py-2 rounded-xl bg-white/60 backdrop-blur-sm text-gray-700 text-sm font-semibold border border-gray-200 whitespace-nowrap flex-shrink-0 hover:bg-white transition-colors active:scale-95">
              <i className="fas fa-exclamation-triangle mr-1.5"></i>Alerts
            </button>
            <button className="px-4 py-2 rounded-xl bg-white/60 backdrop-blur-sm text-gray-700 text-sm font-semibold border border-gray-200 whitespace-nowrap flex-shrink-0 hover:bg-white transition-colors active:scale-95">
              <i className="fas fa-clock mr-1.5"></i>Reminders
            </button>
            <button className="px-4 py-2 rounded-xl bg-white/60 backdrop-blur-sm text-gray-700 text-sm font-semibold border border-gray-200 whitespace-nowrap flex-shrink-0 hover:bg-white transition-colors active:scale-95">
              <i className="fas fa-info-circle mr-1.5"></i>System
            </button>
          </div>
        </div>

        <div id="notifications-list-section" className="px-4 pb-6 space-y-3">
          
          <div id="notification-item-1" className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md shadow-gray-200/40 border border-gray-100/50 overflow-hidden">
            <div className="flex items-start gap-3 p-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                <i className="fas fa-exclamation-circle text-lg text-red-600"></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">Monthly Budget Exceeded</h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap">2h ago</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-3">You've spent $2,847 this month, exceeding your $2,500 budget by $347. Consider reviewing your dining expenses.</p>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold shadow-sm hover:bg-primary-dark transition-colors active:scale-95">
                    View Details
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors active:scale-95">
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
          </div>

          <div id="notification-item-2" className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md shadow-gray-200/40 border border-gray-100/50 overflow-hidden">
            <div className="flex items-start gap-3 p-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                <i className="fas fa-bell text-lg text-amber-600"></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">Bill Payment Reminder</h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap">5h ago</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-3">Your electricity bill of $187.50 is due in 3 days. Tap to schedule payment now.</p>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold shadow-sm hover:bg-primary-dark transition-colors active:scale-95">
                    Pay Now
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors active:scale-95">
                    Snooze
                  </button>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-600"></div>
          </div>

          <div id="notification-item-3" className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md shadow-gray-200/40 border border-gray-100/50 overflow-hidden">
            <div className="flex items-start gap-3 p-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                <i className="fas fa-fire text-lg text-orange-600"></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">Money Leak Detected</h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap">8h ago</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-3">Found duplicate subscription: Netflix charged twice this month ($15.99 each). Review and request refund.</p>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold shadow-sm hover:bg-primary-dark transition-colors active:scale-95">
                    Take Action
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors active:scale-95">
                    Ignore
                  </button>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
          </div>

          <div id="notification-item-4" className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md shadow-gray-200/40 border border-gray-100/50 overflow-hidden">
            <div className="flex items-start gap-3 p-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                <i className="fas fa-receipt text-lg text-blue-600"></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">Receipt Processed Successfully</h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap">12h ago</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-3">Your receipt from Whole Foods Market ($124.67) has been scanned and categorized as Groceries.</p>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold shadow-sm hover:bg-primary-dark transition-colors active:scale-95">
                    View Receipt
                  </button>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
          </div>

          <div id="notification-item-5" className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md shadow-gray-200/40 border border-gray-100/50 overflow-hidden">
            <div className="flex items-start gap-3 p-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                <i className="fas fa-chart-line text-lg text-purple-600"></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">Weekly Spending Summary Ready</h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap">1d ago</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-3">You spent $487 this week, 12% less than last week. Great job! Top category: Dining ($156).</p>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold shadow-sm hover:bg-primary-dark transition-colors active:scale-95">
                    View Report
                  </button>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
          </div>

          <div id="notification-item-6" className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md shadow-gray-200/40 border border-gray-100/50 overflow-hidden">
            <div className="flex items-start gap-3 p-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                <i className="fas fa-check-circle text-lg text-green-600"></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">Bank Statement Imported</h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap">1d ago</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-3">Successfully imported 47 transactions from Chase Bank (October 2024). All transactions categorized.</p>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold shadow-sm hover:bg-primary-dark transition-colors active:scale-95">
                    Review
                  </button>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
          </div>

          <div id="notification-item-7" className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md shadow-gray-200/40 border border-gray-100/50 overflow-hidden">
            <div className="flex items-start gap-3 p-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                <i className="fas fa-sync-alt text-lg text-cyan-600"></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">Recurring Transaction Detected</h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap">2d ago</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-3">Spotify Premium ($9.99) detected as monthly subscription. Would you like to track this automatically?</p>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold shadow-sm hover:bg-primary-dark transition-colors active:scale-95">
                    Track
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors active:scale-95">
                    Not Now
                  </button>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-cyan-500 to-cyan-600"></div>
          </div>

          <div id="notification-item-8" className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md shadow-gray-200/40 border border-gray-100/50 overflow-hidden">
            <div className="flex items-start gap-3 p-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                <i className="fas fa-sparkles text-lg text-indigo-600"></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">New Feature Available</h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap">2d ago</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-3">Line-item extraction is now available! Extract individual items from receipts for detailed tracking.</p>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold shadow-sm hover:bg-primary-dark transition-colors active:scale-95">
                    Try Now
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors active:scale-95">
                    Later
                  </button>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
          </div>

        </div>

        <div id="older-notifications-section" className="px-4 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Older Notifications</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          </div>
          <div className="space-y-2">
            <div id="older-notification-1" className="bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-gray-100/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-piggy-bank text-sm text-teal-600"></i>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-gray-900 mb-0.5">Savings Goal Reached</h4>
                <p className="text-xs text-gray-600">You've saved $1,000 toward your vacation fund!</p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">3d ago</span>
            </div>
            <div id="older-notification-2" className="bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-gray-100/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-tag text-sm text-pink-600"></i>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-gray-900 mb-0.5">Category Updated</h4>
                <p className="text-xs text-gray-600">Amazon transaction recategorized to Electronics</p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">4d ago</span>
            </div>
            <div id="older-notification-3" className="bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-gray-100/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-file-invoice text-sm text-yellow-600"></i>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-gray-900 mb-0.5">Tax Report Generated</h4>
                <p className="text-xs text-gray-600">Q4 2024 expense report ready for download</p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">5d ago</span>
            </div>
            <div id="older-notification-4" className="bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-gray-100/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-shield-check text-sm text-gray-600"></i>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-gray-900 mb-0.5">Security Update</h4>
                <p className="text-xs text-gray-600">Your data backup completed successfully</p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">6d ago</span>
            </div>
          </div>
        </div>

        <div id="notification-preferences-section" className="px-4 pb-6">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-3xl p-6 border border-gray-200/50 shadow-lg">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fas fa-sliders-h text-primary"></i>
              Notification Preferences
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Budget Alerts</h4>
                  <p className="text-xs text-gray-600">Get notified when you exceed budgets</p>
                </div>
                <div className="w-12 h-6 bg-primary rounded-full relative flex-shrink-0 shadow-inner">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                </div>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Money Leak Alerts</h4>
                  <p className="text-xs text-gray-600">Detect duplicate charges and subscriptions</p>
                </div>
                <div className="w-12 h-6 bg-primary rounded-full relative flex-shrink-0 shadow-inner">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                </div>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Bill Reminders</h4>
                  <p className="text-xs text-gray-600">Upcoming payment due date notifications</p>
                </div>
                <div className="w-12 h-6 bg-primary rounded-full relative flex-shrink-0 shadow-inner">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                </div>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Weekly Summary</h4>
                  <p className="text-xs text-gray-600">Spending insights every Monday</p>
                </div>
                <div className="w-12 h-6 bg-gray-300 rounded-full relative flex-shrink-0 shadow-inner">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                </div>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-0.5">System Updates</h4>
                  <p className="text-xs text-gray-600">New features and app improvements</p>
                </div>
                <div className="w-12 h-6 bg-primary rounded-full relative flex-shrink-0 shadow-inner">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                </div>
              </div>
            </div>
            <button className="w-full mt-5 h-11 bg-white text-gray-900 text-sm font-semibold rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors active:scale-98">
              Advanced Settings
            </button>
          </div>
        </div>

        <div id="notification-schedule-section" className="px-4 pb-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100/50">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fas fa-moon text-indigo-600"></i>
              Quiet Hours
            </h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">Set a schedule to mute non-urgent notifications during specific hours.</p>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-900">Enable Quiet Hours</span>
              <div className="w-12 h-6 bg-gray-300 rounded-full relative flex-shrink-0 shadow-inner">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <label className="text-xs text-gray-600 mb-1 block">Start Time</label>
                <div className="text-sm font-semibold text-gray-400">10:00 PM</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <label className="text-xs text-gray-600 mb-1 block">End Time</label>
                <div className="text-sm font-semibold text-gray-400">7:00 AM</div>
              </div>
            </div>
          </div>
        </div>

        <div id="notification-delivery-section" className="px-4 pb-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100/50">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fas fa-paper-plane text-blue-600"></i>
              Delivery Methods
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                    <i className="fas fa-mobile-alt text-blue-600"></i>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Push Notifications</h4>
                    <p className="text-xs text-gray-600">Real-time alerts on your device</p>
                  </div>
                </div>
                <i className="fas fa-check-circle text-primary text-lg"></i>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                    <i className="fas fa-envelope text-purple-600"></i>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Email Digest</h4>
                    <p className="text-xs text-gray-600">Daily summary via email</p>
                  </div>
                </div>
                <i className="fas fa-circle text-gray-300 text-lg"></i>
              </div>
            </div>
          </div>
        </div>

        <div id="notification-history-section" className="px-4 pb-6">
          <div className="bg-gradient-to-br from-primary/5 to-teal-50/50 rounded-3xl p-6 border border-primary/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Notification History</h3>
              <button className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors">
                View All
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/80 rounded-xl p-3 text-center shadow-sm">
                <div className="text-2xl font-bold text-gray-900 mb-1">47</div>
                <div className="text-xs text-gray-600">This Week</div>
              </div>
              <div className="bg-white/80 rounded-xl p-3 text-center shadow-sm">
                <div className="text-2xl font-bold text-gray-900 mb-1">182</div>
                <div className="text-xs text-gray-600">This Month</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Budget Alerts</span>
                <span className="font-semibold text-gray-900">18</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Money Leaks</span>
                <span className="font-semibold text-gray-900">5</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Bill Reminders</span>
                <span className="font-semibold text-gray-900">12</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">System Updates</span>
                <span className="font-semibold text-gray-900">12</span>
              </div>
            </div>
          </div>
        </div>

        <div id="clear-notifications-section" className="px-4 pb-6">
          <button className="w-full h-12 bg-white/60 backdrop-blur-sm text-red-600 text-sm font-semibold rounded-xl shadow-md shadow-gray-200/40 border border-red-200 hover:bg-red-50 transition-colors active:scale-98 flex items-center justify-center gap-2">
            <i className="fas fa-trash-alt"></i>
            Clear All Notifications
          </button>
        </div>

      </div>

      <div id="bottom-navigation" className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md shadow-lg border-t border-gray-200 z-40">
        <div className="flex items-center justify-around px-4 py-3">
          <NavLink to="/" className="flex flex-col items-center gap-1 text-gray-400 hover:text-primary transition-colors active:scale-95">
            <i className="fas fa-home text-xl"></i>
            <span className="text-xs font-medium">Dashboard</span>
          </NavLink>
          <NavLink to="/transaction" className="flex flex-col items-center gap-1 text-gray-400 hover:text-primary transition-colors active:scale-95">
            <i className="fas fa-list text-xl"></i>
            <span className="text-xs font-medium">Transactions</span>
          </NavLink>
          <NavLink to="/add-transaction" className="w-14 h-14 -mt-8 bg-gradient-to-br from-primary to-teal-600 rounded-2xl shadow-xl shadow-primary/40 flex items-center justify-center hover:scale-105 transition-transform active:scale-95">
            <i className="fas fa-plus text-white text-2xl"></i>
          </NavLink>
          <NavLink to="/insight" className="flex flex-col items-center gap-1 text-gray-400 hover:text-primary transition-colors active:scale-95">
            <i className="fas fa-chart-pie text-xl"></i>
            <span className="text-xs font-medium">Insights</span>
          </NavLink>
          <NavLink to="/notification" className="flex flex-col items-center gap-1 text-primary transition-colors active:scale-95">
            <div className="relative">
              <i className="fas fa-bell text-xl"></i>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
            </div>
            <span className="text-xs font-medium">Alerts</span>
          </NavLink>
        </div>
      </div>

    </div>
  );
};

export default Notification;
