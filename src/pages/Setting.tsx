import { useNavigate } from "react-router-dom";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";

const SettingContent = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* Profile Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" alt="Profile" className="w-20 h-20 rounded-2xl object-cover shadow-md" />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-br from-primary to-teal-600 rounded-lg flex items-center justify-center shadow-md cursor-pointer">
              <i className="fas fa-camera text-white text-xs"></i>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Michael Anderson</h2>
            <p className="text-sm text-gray-600 mb-2">michael.anderson@email.com</p>
            <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-amber-100 px-3 py-1.5 rounded-lg">
              <i className="fas fa-crown text-amber-600 text-sm"></i>
              <span className="text-sm font-semibold text-amber-700">Premium Plan</span>
            </div>
          </div>
          <button className="px-6 py-2.5 bg-gradient-to-r from-primary to-teal-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
            Edit Profile
          </button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Subscription */}
          <div className="bg-gradient-to-br from-primary/5 to-teal-50/50 rounded-2xl p-5 border border-primary/10">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Your Subscription</h3>
                <p className="text-sm text-gray-600">Yearly Plan - $38.30/year</p>
              </div>
              <div className="px-2.5 py-1 bg-primary/10 rounded-lg">
                <span className="text-xs font-semibold text-primary">Active</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
              <i className="fas fa-calendar-check text-primary"></i>
              <span>Renews on March 15, 2025</span>
            </div>
            <button onClick={() => navigate('/pricing')} className="w-full h-10 bg-white text-primary text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all border border-primary/20">
              Manage Subscription
            </button>
          </div>

          {/* Team & Collaboration */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Team & Collaboration</h3>
            </div>
            <div className="divide-y divide-gray-100">
              <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                    <i className="fas fa-user-plus text-blue-600"></i>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900">Invite Team Members</div>
                    <div className="text-xs text-gray-500">Share access with colleagues</div>
                  </div>
                </div>
                <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
              </button>
              <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                    <i className="fas fa-users-cog text-purple-600"></i>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900">Manage Users</div>
                    <div className="text-xs text-gray-500">2 active members</div>
                  </div>
                </div>
                <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
              </button>
              <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center">
                    <i className="fas fa-shield-alt text-indigo-600"></i>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900">Permissions</div>
                    <div className="text-xs text-gray-500">Control access levels</div>
                  </div>
                </div>
                <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
              </button>
            </div>
          </div>

          {/* Financial Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Financial Settings</h3>
            </div>
            <div className="divide-y divide-gray-100">
              <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                    <i className="fas fa-dollar-sign text-emerald-600"></i>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900">Default Currency</div>
                    <div className="text-xs text-gray-500">USD - United States Dollar</div>
                  </div>
                </div>
                <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
              </button>
              <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                    <i className="fas fa-calendar-alt text-blue-600"></i>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900">Date Format</div>
                    <div className="text-xs text-gray-500">MM/DD/YYYY</div>
                  </div>
                </div>
                <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
              </button>
              <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
                    <i className="fas fa-percentage text-orange-600"></i>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900">Tax Rate</div>
                    <div className="text-xs text-gray-500">Default: 8.5%</div>
                  </div>
                </div>
                <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Notifications & Alerts</h3>
            </div>
            <div className="divide-y divide-gray-100">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center">
                    <i className="fas fa-bell text-rose-600"></i>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900">Bill Reminders</div>
                    <div className="text-xs text-gray-500">Due date notifications</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
                    <i className="fas fa-exclamation-triangle text-amber-600"></i>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900">Spending Alerts</div>
                    <div className="text-xs text-gray-500">Budget & leak detection</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 flex items-center justify-center">
                    <i className="fas fa-chart-bar text-cyan-600"></i>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900">Weekly Summary</div>
                    <div className="text-xs text-gray-500">Spending overview</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Data & Privacy */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Data & Privacy</h3>
            </div>
            <div className="divide-y divide-gray-100">
              <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                    <i className="fas fa-download text-blue-600"></i>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900">Export Data</div>
                    <div className="text-xs text-gray-500">Download your data</div>
                  </div>
                </div>
                <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
              </button>
              <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                    <i className="fas fa-shield-alt text-green-600"></i>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900">Privacy Settings</div>
                    <div className="text-xs text-gray-500">Manage your privacy</div>
                  </div>
                </div>
                <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
              </button>
              <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
                    <i className="fas fa-trash-alt text-red-600"></i>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900">Delete Account</div>
                    <div className="text-xs text-gray-500">Permanently delete data</div>
                  </div>
                </div>
                <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
              </button>
            </div>
          </div>

          {/* Sign Out */}
          <button className="w-full h-12 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
            <i className="fas fa-sign-out-alt"></i>
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

const MobileSetting = () => {
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
        <div className="sticky top-10 z-40 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100/50">
          <div className="flex items-center justify-between px-4 h-14">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-gray-100/80 flex items-center justify-center">
              <i className="fas fa-arrow-left text-gray-700"></i>
            </button>
            <h1 className="text-lg font-bold text-gray-900">Settings & Account</h1>
            <button className="w-9 h-9 rounded-xl bg-gray-100/80 flex items-center justify-center">
              <i className="fas fa-info-circle text-gray-700"></i>
            </button>
          </div>
        </div>

        <div className="px-4 pt-6 pb-4">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-100/50 p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" alt="Profile" className="w-16 h-16 rounded-2xl object-cover shadow-md" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-primary to-teal-600 rounded-lg flex items-center justify-center shadow-md">
                  <i className="fas fa-camera text-white text-xs"></i>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-gray-900 mb-0.5">Michael Anderson</h2>
                <p className="text-sm text-gray-600 mb-1">michael.anderson@email.com</p>
                <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-amber-100 px-2.5 py-1 rounded-lg">
                  <i className="fas fa-crown text-amber-600 text-xs"></i>
                  <span className="text-xs font-semibold text-amber-700">Premium Plan</span>
                </div>
              </div>
            </div>
            <button className="w-full h-11 bg-gradient-to-r from-primary to-teal-600 text-white text-sm font-semibold rounded-xl shadow-md">
              Edit Profile
            </button>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="bg-gradient-to-br from-primary/5 to-teal-50/50 rounded-2xl p-4 border border-primary/10">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Your Subscription</h3>
                <p className="text-xs text-gray-600">Yearly Plan - $38.30/year</p>
              </div>
              <div className="px-2.5 py-1 bg-primary/10 rounded-lg">
                <span className="text-xs font-semibold text-primary">Active</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
              <i className="fas fa-calendar-check text-primary"></i>
              <span>Renews on March 15, 2025</span>
            </div>
            <button onClick={() => navigate('/pricing')} className="w-full h-9 bg-white text-primary text-xs font-semibold rounded-lg shadow-sm border border-primary/20">
              Manage Subscription
            </button>
          </div>
        </div>

        <div className="px-4 pb-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 px-1">Notifications & Alerts</h3>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-gray-100/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center">
                  <i className="fas fa-bell text-rose-600"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Bill Reminders</div>
                  <div className="text-xs text-gray-500">Due date notifications</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-amber-600"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Spending Alerts</div>
                  <div className="text-xs text-gray-500">Budget & leak detection</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
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
            <button className="flex flex-col items-center gap-1 p-2">
              <i className="fas fa-cog text-lg text-primary"></i>
              <span className="text-[10px] font-medium text-primary">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Setting = () => {
  return (
    <ResponsiveLayout
      mobileContent={<MobileSetting />}
      variant="app"
      showSidebar={true}
    >
      <SettingContent />
    </ResponsiveLayout>
  );
};

export default Setting;
