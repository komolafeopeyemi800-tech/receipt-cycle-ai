import { useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";

const Setting = () => {
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

        <div id="header" className="sticky top-10 z-40 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100/50">
          <div className="flex items-center justify-between px-4 h-14">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-gray-100/80 flex items-center justify-center hover:bg-gray-200/80 transition-colors active:scale-95">
              <i className="fas fa-arrow-left text-gray-700"></i>
            </button>
            <h1 className="text-lg font-bold text-gray-900">Settings & Account</h1>
            <button className="w-9 h-9 rounded-xl bg-gray-100/80 flex items-center justify-center hover:bg-gray-200/80 transition-colors active:scale-95">
              <i className="fas fa-info-circle text-gray-700"></i>
            </button>
          </div>
        </div>

        <div id="profile-section" className="px-4 pt-6 pb-4">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100/50 p-5">
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
            <button className="w-full h-11 bg-gradient-to-r from-primary to-teal-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-primary/20 hover:shadow-lg transition-all active:scale-98">
              Edit Profile
            </button>
          </div>
        </div>

        <div id="subscription-section" className="px-4 pb-4">
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
            <button className="w-full h-9 bg-white text-primary text-xs font-semibold rounded-lg shadow-sm hover:shadow-md transition-all border border-primary/20 active:scale-98">
              Manage Subscription
            </button>
          </div>
        </div>

        <div id="user-management-section" className="px-4 pb-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 px-1">Team & Collaboration</h3>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md shadow-gray-200/40 border border-gray-100/50 overflow-hidden">
            
            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors active:bg-gray-100/50">
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

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>

            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors active:bg-gray-100/50">
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

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>

            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors active:bg-gray-100/50">
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

        <div id="notifications-section" className="px-4 pb-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 px-1">Notifications & Alerts</h3>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md shadow-gray-200/40 border border-gray-100/50 overflow-hidden">
            
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
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
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
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>

            <div className="flex items-center justify-between px-4 py-3.5">
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

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>

            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors active:bg-gray-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                  <i className="fas fa-cog text-green-600"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Custom Preferences</div>
                  <div className="text-xs text-gray-500">Push & email settings</div>
                </div>
              </div>
              <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
            </button>

          </div>
        </div>

        <div id="financial-settings-section" className="px-4 pb-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 px-1">Financial Settings</h3>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md shadow-gray-200/40 border border-gray-100/50 overflow-hidden">
            
            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors active:bg-gray-100/50">
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

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>

            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors active:bg-gray-100/50">
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

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>

            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors active:bg-gray-100/50">
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

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>

            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors active:bg-gray-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center">
                  <i className="fas fa-receipt text-teal-600"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Reimbursement</div>
                  <div className="text-xs text-gray-500">Settings & defaults</div>
                </div>
              </div>
              <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
            </button>

          </div>
        </div>

        <div id="transaction-settings-section" className="px-4 pb-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 px-1">Transaction Settings</h3>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md shadow-gray-200/40 border border-gray-100/50 overflow-hidden">
            
            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors active:bg-gray-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100 flex items-center justify-center">
                  <i className="fas fa-tags text-violet-600"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Default Categories</div>
                  <div className="text-xs text-gray-500">Income & expense types</div>
                </div>
              </div>
              <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
            </button>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>

            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors active:bg-gray-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center">
                  <i className="fas fa-store text-pink-600"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Vendors & Merchants</div>
                  <div className="text-xs text-gray-500">Custom vendor list</div>
                </div>
              </div>
              <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
            </button>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>

            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors active:bg-gray-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-50 to-sky-100 flex items-center justify-center">
                  <i className="fas fa-users text-sky-600"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Client List</div>
                  <div className="text-xs text-gray-500">For invoicing & tracking</div>
                </div>
              </div>
              <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
            </button>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>

            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors active:bg-gray-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-50 to-lime-100 flex items-center justify-center">
                  <i className="fas fa-credit-card text-lime-600"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Payment Methods</div>
                  <div className="text-xs text-gray-500">Cards, accounts & wallets</div>
                </div>
              </div>
              <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
            </button>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>

            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 flex items-center justify-center">
                  <i className="fas fa-robot text-fuchsia-600"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Auto-Categorization</div>
                  <div className="text-xs text-gray-500">AI suggestions enabled</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>

            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
                  <i className="fas fa-sticky-note text-red-600"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Require Notes</div>
                  <div className="text-xs text-gray-500">Mandatory expense notes</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

          </div>
        </div>

        <div id="receipt-scan-settings-section" className="px-4 pb-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 px-1">Receipt & Scan Settings</h3>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md shadow-gray-200/40 border border-gray-100/50 overflow-hidden">
            
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-teal-100 flex items-center justify-center">
                  <i className="fas fa-crop text-primary"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Auto-Crop</div>
                  <div className="text-xs text-gray-500">Receipt edge detection</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>

            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-teal-100 flex items-center justify-center">
                  <i className="fas fa-magic text-primary"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Category Suggestions</div>
                  <div className="text-xs text-gray-500">AI-powered detection</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>

            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-teal-100 flex items-center justify-center">
                  <i className="fas fa-paperclip text-primary"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Auto-Attach Receipts</div>
                  <div className="text-xs text-gray-500">Link to transactions</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>

            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors active:bg-gray-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-teal-100 flex items-center justify-center">
                  <i className="fas fa-layer-group text-primary"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Scan Limits</div>
                  <div className="text-xs text-gray-500">47 scans remaining this month</div>
                </div>
              </div>
              <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
            </button>

          </div>
        </div>

        <div id="security-privacy-section" className="px-4 pb-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 px-1">Security & Privacy</h3>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md shadow-gray-200/40 border border-gray-100/50 overflow-hidden">
            
            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors active:bg-gray-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
                  <i className="fas fa-key text-red-600"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Change Password</div>
                  <div className="text-xs text-gray-500">Update security credentials</div>
                </div>
              </div>
              <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
            </button>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>

            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors active:bg-gray-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                  <i className="fas fa-shield-alt text-green-600"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Two-Factor Auth</div>
                  <div className="text-xs text-primary font-medium">Enabled</div>
                </div>
              </div>
              <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
            </button>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>

            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors active:bg-gray-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                  <i className="fas fa-file-export text-blue-600"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Export Data</div>
                  <div className="text-xs text-gray-500">CSV, PDF, OFX formats</div>
                </div>
              </div>
              <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
            </button>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>

            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors active:bg-gray-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                  <i className="fas fa-laptop text-purple-600"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Connected Devices</div>
                  <div className="text-xs text-gray-500">3 active sessions</div>
                </div>
              </div>
              <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
            </button>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>

            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-red-50/50 transition-colors active:bg-red-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                  <i className="fas fa-trash-alt text-red-700"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-red-700">Delete Account</div>
                  <div className="text-xs text-red-500">Permanently remove data</div>
                </div>
              </div>
              <i className="fas fa-chevron-right text-red-400 text-sm"></i>
            </button>

          </div>
        </div>

        <div id="app-preferences-section" className="px-4 pb-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 px-1">App Preferences</h3>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md shadow-gray-200/40 border border-gray-100/50 overflow-hidden">
            
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                  <i className="fas fa-moon text-slate-600"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Dark Mode</div>
                  <div className="text-xs text-gray-500">System default</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>

            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors active:bg-gray-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center">
                  <i className="fas fa-home text-teal-600"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Default Home Page</div>
                  <div className="text-xs text-gray-500">Dashboard</div>
                </div>
              </div>
              <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
            </button>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>

            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors active:bg-gray-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center">
                  <i className="fas fa-language text-indigo-600"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Language</div>
                  <div className="text-xs text-gray-500">English (US)</div>
                </div>
              </div>
              <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
            </button>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>

            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors active:bg-gray-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                  <i className="fas fa-info-circle text-gray-600"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">App Version</div>
                  <div className="text-xs text-gray-500">v2.4.1 - Up to date</div>
                </div>
              </div>
              <i className="fas fa-sync-alt text-gray-400 text-sm"></i>
            </button>

          </div>
        </div>

        <div id="support-legal-section" className="px-4 pb-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 px-1">Support & Legal</h3>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md shadow-gray-200/40 border border-gray-100/50 overflow-hidden">
            
            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors active:bg-gray-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 flex items-center justify-center">
                  <i className="fas fa-question-circle text-cyan-600"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Help Center</div>
                  <div className="text-xs text-gray-500">FAQs & guides</div>
                </div>
              </div>
              <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
            </button>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>

            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors active:bg-gray-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-teal-100 flex items-center justify-center">
                  <i className="fas fa-headset text-primary"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Contact Support</div>
                  <div className="text-xs text-gray-500">Email or chat with us</div>
                </div>
              </div>
              <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
            </button>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>

            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors active:bg-gray-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
                  <i className="fas fa-star text-amber-600"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Send Feedback</div>
                  <div className="text-xs text-gray-500">Feature requests & ideas</div>
                </div>
              </div>
              <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
            </button>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>

            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors active:bg-gray-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                  <i className="fas fa-file-contract text-slate-600"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Terms of Service</div>
                  <div className="text-xs text-gray-500">Legal agreements</div>
                </div>
              </div>
              <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
            </button>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>

            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors active:bg-gray-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                  <i className="fas fa-user-shield text-slate-600"></i>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Privacy Policy</div>
                  <div className="text-xs text-gray-500">Data protection info</div>
                </div>
              </div>
              <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
            </button>

          </div>
        </div>

        <div id="logout-section" className="px-4 pb-8">
          <button className="w-full h-12 bg-white text-gray-700 text-sm font-semibold rounded-xl shadow-md shadow-gray-200/50 hover:shadow-lg transition-all border border-gray-200 active:scale-98 flex items-center justify-center gap-2">
            <i className="fas fa-sign-out-alt"></i>
            Log Out
          </button>
        </div>

      </div>

      <div id="bottom-navigation" className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/50 shadow-lg z-50">
        <div className="flex items-center justify-around h-16 px-2">
          
          <NavLink to="/" className="flex flex-col items-center justify-center w-16 h-12 rounded-xl hover:bg-gray-100/50 transition-colors active:scale-95">
            <i className="fas fa-home text-gray-400 text-lg mb-0.5"></i>
            <span className="text-[10px] text-gray-400 font-medium">Home</span>
          </NavLink>

          <NavLink to="/transaction" className="flex flex-col items-center justify-center w-16 h-12 rounded-xl hover:bg-gray-100/50 transition-colors active:scale-95">
            <i className="fas fa-receipt text-gray-400 text-lg mb-0.5"></i>
            <span className="text-[10px] text-gray-400 font-medium">Transactions</span>
          </NavLink>

          <NavLink to="/add-transaction" className="flex items-center justify-center w-14 h-14 -mt-6 rounded-2xl bg-gradient-to-br from-primary to-teal-600 shadow-xl shadow-primary/30 hover:shadow-2xl transition-all active:scale-95">
            <i className="fas fa-plus text-white text-xl"></i>
          </NavLink>

          <NavLink to="/insight" className="flex flex-col items-center justify-center w-16 h-12 rounded-xl hover:bg-gray-100/50 transition-colors active:scale-95">
            <i className="fas fa-chart-pie text-gray-400 text-lg mb-0.5"></i>
            <span className="text-[10px] text-gray-400 font-medium">Insights</span>
          </NavLink>

          <NavLink to="/setting" className="flex flex-col items-center justify-center w-16 h-12 rounded-xl bg-primary/5 transition-colors active:scale-95">
            <i className="fas fa-cog text-primary text-lg mb-0.5"></i>
            <span className="text-[10px] text-primary font-semibold">Settings</span>
          </NavLink>

        </div>
        <div className="h-6 bg-white"></div>
      </div>

    </div>
  );
};

export default Setting;
