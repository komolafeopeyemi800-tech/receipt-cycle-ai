import { useNavigate } from "react-router-dom";

const Transaction = () => {
  const navigate = useNavigate();

  return (
    <div className="font-sans bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 overflow-x-hidden min-h-screen">
      <style>{`
        ::-webkit-scrollbar { display: none; }
        #ien25 { width: 31.6%; }
        #in1j6l { width: 32.8%; }
        #iv6tlb { width: 21.9%; }
        #i0xy1q { width: 15.8%; }
        #irg4zz { width: 10.1%; }
        #irqrzf { width: 7.5%; }
        #idgdjv { width: 6.9%; }
        #iiovbg { height: 68%; }
        #invs3f { height: 75%; }
        #ij0g7j { height: 82%; }
        #i8k7lf { height: 71%; }
        #i2sqd9 { height: 88%; }
        #ipd4vb { height: 100%; }
        #ipq6qb { width: 111.5%; }
        #iaoyii { width: 92.4%; }
        #ihm4m9 { width: 75.6%; }
      `}</style>

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
            <div className="flex items-center gap-2">
              <button className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <i className="fas fa-search text-gray-700"></i>
              </button>
              <button className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <i className="fas fa-filter text-gray-700"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats Block */}
        <div id="summary-stats-block" className="px-4 pt-5 pb-4">
          <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-3xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Period Summary</h2>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors">
                <span>This Month</span>
                <i className="fas fa-chevron-down text-[10px]"></i>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1 font-medium">Income</div>
                <div className="text-lg font-bold text-[#00B875]">$8,240</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1 font-medium">Expenses</div>
                <div className="text-lg font-bold text-rose-600">$5,632</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1 font-medium">Net</div>
                <div className="text-lg font-bold text-gray-900">$2,608</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-medium">Savings Rate</span>
                <span className="text-gray-900 font-semibold">31.6%</span>
              </div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#00B875] to-teal-500 rounded-full" id="ien25"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Date Range Selector */}
        <div id="date-range-selector" className="px-4 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button className="px-4 py-2 bg-[#00B875] text-white text-xs font-semibold rounded-xl shadow-md shadow-[#00B875]/20 whitespace-nowrap">Today</button>
            <button className="px-4 py-2 bg-white text-gray-700 text-xs font-semibold rounded-xl border border-gray-200 whitespace-nowrap hover:bg-gray-50 transition-colors">This Week</button>
            <button className="px-4 py-2 bg-white text-gray-700 text-xs font-semibold rounded-xl border border-gray-200 whitespace-nowrap hover:bg-gray-50 transition-colors">This Month</button>
            <button className="px-4 py-2 bg-white text-gray-700 text-xs font-semibold rounded-xl border border-gray-200 whitespace-nowrap hover:bg-gray-50 transition-colors">Custom</button>
          </div>
        </div>

        {/* Quick Filters Block */}
        <div id="quick-filters-block" className="px-4 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button className="px-3 py-1.5 bg-white text-gray-700 text-xs font-medium rounded-lg border border-gray-200 whitespace-nowrap hover:bg-gray-50 transition-colors flex items-center gap-1.5">
              <i className="fas fa-circle text-[8px] text-rose-500"></i>
              Expenses
            </button>
            <button className="px-3 py-1.5 bg-white text-gray-700 text-xs font-medium rounded-lg border border-gray-200 whitespace-nowrap hover:bg-gray-50 transition-colors flex items-center gap-1.5">
              <i className="fas fa-circle text-[8px] text-[#00B875]"></i>
              Income
            </button>
            <button className="px-3 py-1.5 bg-white text-gray-700 text-xs font-medium rounded-lg border border-gray-200 whitespace-nowrap hover:bg-gray-50 transition-colors flex items-center gap-1.5">
              <i className="fas fa-sync text-[10px] text-purple-500"></i>
              Recurring
            </button>
            <button className="px-3 py-1.5 bg-white text-gray-700 text-xs font-medium rounded-lg border border-gray-200 whitespace-nowrap hover:bg-gray-50 transition-colors flex items-center gap-1.5">
              <i className="fas fa-paperclip text-[10px] text-blue-500"></i>
              With Receipt
            </button>
          </div>
        </div>

        {/* Transactions List Block */}
        <div id="transactions-list-block" className="px-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
            <button className="text-xs text-gray-500 font-medium hover:text-[#00B875] transition-colors">View All</button>
          </div>
          <div className="space-y-3">
            {/* Amazon Transaction */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50 hover:shadow-lg transition-all">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <i className="fas fa-shopping-cart text-lg text-blue-600"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 truncate">Amazon.com</h4>
                      <p className="text-xs text-gray-500">Shopping • Online</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-rose-600">-$142.87</div>
                      <div className="text-xs text-gray-500">Today, 2:34 PM</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded">Shopping</span>
                    <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center">
                      <i className="fas fa-receipt text-[10px] text-gray-500"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Salary Deposit */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50 hover:shadow-lg transition-all">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00B875]/10 to-teal-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <i className="fas fa-dollar-sign text-lg text-[#00B875]"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 truncate">Salary Deposit</h4>
                      <p className="text-xs text-gray-500">Income • Direct Deposit</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-[#00B875]">+$4,200.00</div>
                      <div className="text-xs text-gray-500">Yesterday</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-[#00B875]/10 text-[#00B875] text-[10px] font-semibold rounded">Income</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Starbucks Coffee */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50 hover:shadow-lg transition-all">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <i className="fas fa-utensils text-lg text-orange-600"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 truncate">Starbucks Coffee</h4>
                      <p className="text-xs text-gray-500">Food &amp; Dining • Coffee Shop</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-rose-600">-$6.45</div>
                      <div className="text-xs text-gray-500">Yesterday</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-[10px] font-semibold rounded">Food</span>
                    <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center">
                      <i className="fas fa-receipt text-[10px] text-gray-500"></i>
                    </div>
                    <div className="flex items-center gap-1">
                      <i className="fas fa-sync text-[8px] text-purple-500"></i>
                      <span className="text-[10px] text-purple-600 font-medium">Recurring</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Netflix Subscription */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50 hover:shadow-lg transition-all">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <i className="fas fa-film text-lg text-purple-600"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 truncate">Netflix Subscription</h4>
                      <p className="text-xs text-gray-500">Entertainment • Streaming</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-rose-600">-$15.99</div>
                      <div className="text-xs text-gray-500">Dec 12</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-semibold rounded">Entertainment</span>
                    <div className="flex items-center gap-1">
                      <i className="fas fa-sync text-[8px] text-purple-500"></i>
                      <span className="text-[10px] text-purple-600 font-medium">Monthly</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shell Gas Station */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50 hover:shadow-lg transition-all">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <i className="fas fa-gas-pump text-lg text-red-600"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 truncate">Shell Gas Station</h4>
                      <p className="text-xs text-gray-500">Transportation • Fuel</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-rose-600">-$52.30</div>
                      <div className="text-xs text-gray-500">Dec 11</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-semibold rounded">Transport</span>
                    <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center">
                      <i className="fas fa-receipt text-[10px] text-gray-500"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Planet Fitness */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50 hover:shadow-lg transition-all">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <i className="fas fa-heartbeat text-lg text-cyan-600"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 truncate">Planet Fitness</h4>
                      <p className="text-xs text-gray-500">Health &amp; Fitness • Gym</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-rose-600">-$22.99</div>
                      <div className="text-xs text-gray-500">Dec 10</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 text-[10px] font-semibold rounded">Fitness</span>
                    <div className="flex items-center gap-1">
                      <i className="fas fa-sync text-[8px] text-purple-500"></i>
                      <span className="text-[10px] text-purple-600 font-medium">Monthly</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Whole Foods Market */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50 hover:shadow-lg transition-all">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <i className="fas fa-shopping-bag text-lg text-green-600"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 truncate">Whole Foods Market</h4>
                      <p className="text-xs text-gray-500">Groceries • Supermarket</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-rose-600">-$87.23</div>
                      <div className="text-xs text-gray-500">Dec 9</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-semibold rounded">Groceries</span>
                    <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center">
                      <i className="fas fa-receipt text-[10px] text-gray-500"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Microsoft Office 365 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50 hover:shadow-lg transition-all">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <i className="fas fa-laptop text-lg text-indigo-600"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 truncate">Microsoft Office 365</h4>
                      <p className="text-xs text-gray-500">Software • Subscription</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-rose-600">-$9.99</div>
                      <div className="text-xs text-gray-500">Dec 8</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-semibold rounded">Software</span>
                    <div className="flex items-center gap-1">
                      <i className="fas fa-sync text-[8px] text-purple-500"></i>
                      <span className="text-[10px] text-purple-600 font-medium">Monthly</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Freelance Payment */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50 hover:shadow-lg transition-all">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00B875]/10 to-teal-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <i className="fas fa-briefcase text-lg text-[#00B875]"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 truncate">Freelance Payment</h4>
                      <p className="text-xs text-gray-500">Income • Consulting</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-[#00B875]">+$1,850.00</div>
                      <div className="text-xs text-gray-500">Dec 7</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-[#00B875]/10 text-[#00B875] text-[10px] font-semibold rounded">Income</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hair Salon */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50 hover:shadow-lg transition-all">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <i className="fas fa-cut text-lg text-pink-600"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 truncate">Hair Salon</h4>
                      <p className="text-xs text-gray-500">Personal Care • Beauty</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-rose-600">-$65.00</div>
                      <div className="text-xs text-gray-500">Dec 6</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-pink-50 text-pink-700 text-[10px] font-semibold rounded">Personal</span>
                    <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center">
                      <i className="fas fa-receipt text-[10px] text-gray-500"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Electric Bill */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50 hover:shadow-lg transition-all">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <i className="fas fa-bolt text-lg text-yellow-600"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 truncate">Electric Bill</h4>
                      <p className="text-xs text-gray-500">Utilities • Power</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-rose-600">-$134.56</div>
                      <div className="text-xs text-gray-500">Dec 5</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 text-[10px] font-semibold rounded">Utilities</span>
                    <div className="flex items-center gap-1">
                      <i className="fas fa-sync text-[8px] text-purple-500"></i>
                      <span className="text-[10px] text-purple-600 font-medium">Monthly</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pharmacy - CVS */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50 hover:shadow-lg transition-all">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <i className="fas fa-medkit text-lg text-teal-600"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 truncate">Pharmacy - CVS</h4>
                      <p className="text-xs text-gray-500">Healthcare • Prescription</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-rose-600">-$28.45</div>
                      <div className="text-xs text-gray-500">Dec 4</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-semibold rounded">Healthcare</span>
                    <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center">
                      <i className="fas fa-receipt text-[10px] text-gray-500"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Metro Transit Pass */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50 hover:shadow-lg transition-all">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <i className="fas fa-bus text-lg text-slate-600"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 truncate">Metro Transit Pass</h4>
                      <p className="text-xs text-gray-500">Transportation • Public Transit</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-rose-600">-$85.00</div>
                      <div className="text-xs text-gray-500">Dec 3</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-slate-50 text-slate-700 text-[10px] font-semibold rounded">Transport</span>
                    <div className="flex items-center gap-1">
                      <i className="fas fa-sync text-[8px] text-purple-500"></i>
                      <span className="text-[10px] text-purple-600 font-medium">Monthly</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Olive Garden */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50 hover:shadow-lg transition-all">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <i className="fas fa-wine-glass text-lg text-rose-600"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 truncate">Olive Garden</h4>
                      <p className="text-xs text-gray-500">Food &amp; Dining • Restaurant</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-rose-600">-$78.90</div>
                      <div className="text-xs text-gray-500">Dec 2</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-semibold rounded">Dining</span>
                    <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center">
                      <i className="fas fa-receipt text-[10px] text-gray-500"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Investment Dividend */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50 hover:shadow-lg transition-all">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00B875]/10 to-teal-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <i className="fas fa-hand-holding-usd text-lg text-[#00B875]"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 truncate">Investment Dividend</h4>
                      <p className="text-xs text-gray-500">Income • Investments</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-[#00B875]">+$125.50</div>
                      <div className="text-xs text-gray-500">Dec 1</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-[#00B875]/10 text-[#00B875] text-[10px] font-semibold rounded">Income</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Insights Mini Block */}
        <div id="insights-mini-block" className="px-4 pb-6">
          <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/60 backdrop-blur-sm rounded-3xl p-5 border border-amber-100/50 shadow-lg">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md">
                <i className="fas fa-lightbulb text-lg text-white"></i>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Money Leak Detected</h3>
                <p className="text-xs text-gray-700 leading-relaxed">You have 3 recurring subscriptions totaling <span className="font-semibold text-orange-700">$48.97/month</span> that haven't been used in 60+ days.</p>
              </div>
            </div>
            <button className="w-full h-10 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
              Review Subscriptions
            </button>
          </div>
        </div>

        {/* Spending by Category Block */}
        <div id="spending-by-category-block" className="px-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Top Categories</h3>
            <button className="text-xs text-gray-500 font-medium hover:text-[#00B875] transition-colors">See All</button>
          </div>
          <div className="space-y-3">
            {/* Shopping */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                    <i className="fas fa-shopping-cart text-sm text-blue-600"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Shopping</div>
                    <div className="text-xs text-gray-500">24 transactions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">$1,847</div>
                  <div className="text-xs text-gray-500">32.8%</div>
                </div>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" id="in1j6l"></div>
              </div>
            </div>

            {/* Groceries */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                    <i className="fas fa-shopping-bag text-sm text-green-600"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Groceries</div>
                    <div className="text-xs text-gray-500">18 transactions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">$1,234</div>
                  <div className="text-xs text-gray-500">21.9%</div>
                </div>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full" id="iv6tlb"></div>
              </div>
            </div>

            {/* Food & Dining */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
                    <i className="fas fa-utensils text-sm text-orange-600"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Food &amp; Dining</div>
                    <div className="text-xs text-gray-500">42 transactions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">$892</div>
                  <div className="text-xs text-gray-500">15.8%</div>
                </div>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full" id="i0xy1q"></div>
              </div>
            </div>

            {/* Transportation */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
                    <i className="fas fa-gas-pump text-sm text-red-600"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Transportation</div>
                    <div className="text-xs text-gray-500">12 transactions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">$567</div>
                  <div className="text-xs text-gray-500">10.1%</div>
                </div>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full" id="irg4zz"></div>
              </div>
            </div>

            {/* Entertainment */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                    <i className="fas fa-film text-sm text-purple-600"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Entertainment</div>
                    <div className="text-xs text-gray-500">8 transactions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">$423</div>
                  <div className="text-xs text-gray-500">7.5%</div>
                </div>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full" id="irqrzf"></div>
              </div>
            </div>

            {/* Utilities */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center">
                    <i className="fas fa-bolt text-sm text-yellow-600"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Utilities</div>
                    <div className="text-xs text-gray-500">6 transactions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">$389</div>
                  <div className="text-xs text-gray-500">6.9%</div>
                </div>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full" id="idgdjv"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions Block */}
        <div id="bulk-actions-block" className="px-4 pb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center gap-2 hover:shadow-md transition-all border border-gray-200">
                <i className="fas fa-check-square text-sm text-gray-700"></i>
                <span className="text-sm font-semibold text-gray-900">Multi-Select</span>
              </button>
              <button className="h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center gap-2 hover:shadow-md transition-all border border-gray-200">
                <i className="fas fa-file-export text-sm text-gray-700"></i>
                <span className="text-sm font-semibold text-gray-900">Export</span>
              </button>
              <button className="h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center gap-2 hover:shadow-md transition-all border border-gray-200">
                <i className="fas fa-tags text-sm text-gray-700"></i>
                <span className="text-sm font-semibold text-gray-900">Categorize</span>
              </button>
              <button className="h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center gap-2 hover:shadow-md transition-all border border-gray-200">
                <i className="fas fa-trash-alt text-sm text-gray-700"></i>
                <span className="text-sm font-semibold text-gray-900">Delete</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recurring Subscriptions Block */}
        <div id="recurring-subscriptions-block" className="px-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Recurring Subscriptions</h3>
            <button className="text-xs text-gray-500 font-medium hover:text-[#00B875] transition-colors">Manage</button>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                    <i className="fas fa-film text-sm text-purple-600"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Netflix</div>
                    <div className="text-xs text-gray-500">Monthly • Next: Dec 27</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-900">$15.99</div>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                    <i className="fas fa-music text-sm text-blue-600"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Spotify</div>
                    <div className="text-xs text-gray-500">Monthly • Next: Dec 22</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-900">$10.99</div>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-50 to-cyan-100 flex items-center justify-center">
                    <i className="fas fa-heartbeat text-sm text-cyan-600"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Planet Fitness</div>
                    <div className="text-xs text-gray-500">Monthly • Next: Jan 1</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-900">$22.99</div>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center">
                    <i className="fas fa-laptop text-sm text-indigo-600"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Office 365</div>
                    <div className="text-xs text-gray-500">Monthly • Next: Dec 30</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-900">$9.99</div>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                    <i className="fas fa-bus text-sm text-slate-600"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Metro Pass</div>
                    <div className="text-xs text-gray-500">Monthly • Next: Jan 3</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-900">$85.00</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center">
                    <i className="fas fa-bolt text-sm text-yellow-600"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Electric Bill</div>
                    <div className="text-xs text-gray-500">Monthly • Next: Jan 5</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-900">$134.56</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200/50 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Total Monthly</span>
              <span className="text-base font-bold text-rose-600">$279.52</span>
            </div>
          </div>
        </div>

        {/* Spending Trends Block */}
        <div id="spending-trends-block" className="px-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Spending Trends</h3>
            <button className="text-xs text-gray-500 font-medium hover:text-[#00B875] transition-colors">Last 6 Months</button>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-md shadow-gray-200/40 border border-gray-100/50">
            <div className="flex items-end justify-between gap-2 h-40">
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gradient-to-t from-[#00B875]/80 to-[#00B875] rounded-t-lg" id="iiovbg"></div>
                <span className="text-xs font-medium text-gray-600">Jul</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gradient-to-t from-[#00B875]/80 to-[#00B875] rounded-t-lg" id="invs3f"></div>
                <span className="text-xs font-medium text-gray-600">Aug</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gradient-to-t from-[#00B875]/80 to-[#00B875] rounded-t-lg" id="ij0g7j"></div>
                <span className="text-xs font-medium text-gray-600">Sep</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gradient-to-t from-[#00B875]/80 to-[#00B875] rounded-t-lg" id="i8k7lf"></div>
                <span className="text-xs font-medium text-gray-600">Oct</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gradient-to-t from-[#00B875]/80 to-[#00B875] rounded-t-lg" id="i2sqd9"></div>
                <span className="text-xs font-medium text-gray-600">Nov</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gradient-to-t from-rose-500/80 to-rose-500 rounded-t-lg" id="ipd4vb"></div>
                <span className="text-xs font-semibold text-rose-600">Dec</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Average Monthly</span>
                <span className="font-bold text-gray-900">$5,420</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-gray-600">This Month</span>
                <span className="font-bold text-rose-600">$5,632 <span className="text-gray-500">(+3.9%)</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Export Options Block */}
        <div id="export-options-block" className="px-4 pb-6">
          <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/60 backdrop-blur-sm rounded-2xl p-5 border border-indigo-100/50 shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                <i className="fas fa-file-export text-lg text-white"></i>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Export Transactions</h3>
                <p className="text-xs text-gray-600">Generate reports for tax or accounting</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button className="h-10 bg-white rounded-lg text-xs font-semibold text-gray-900 hover:bg-gray-50 transition-all border border-gray-200 flex items-center justify-center gap-1.5">
                <i className="fas fa-file-csv text-sm text-green-600"></i>
                CSV
              </button>
              <button className="h-10 bg-white rounded-lg text-xs font-semibold text-gray-900 hover:bg-gray-50 transition-all border border-gray-200 flex items-center justify-center gap-1.5">
                <i className="fas fa-file-pdf text-sm text-red-600"></i>
                PDF
              </button>
              <button className="h-10 bg-white rounded-lg text-xs font-semibold text-gray-900 hover:bg-gray-50 transition-all border border-gray-200 flex items-center justify-center gap-1.5">
                <i className="fas fa-file-excel text-sm text-blue-600"></i>
                Excel
              </button>
            </div>
          </div>
        </div>

        {/* Tax Insights Block */}
        <div id="tax-insights-block" className="px-4 pb-6">
          <div className="bg-gradient-to-br from-teal-50/80 to-emerald-50/60 backdrop-blur-sm rounded-2xl p-5 border border-teal-100/50 shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md">
                <i className="fas fa-file-invoice-dollar text-lg text-white"></i>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Tax-Deductible Expenses</h3>
                <p className="text-xs text-gray-600">Potential deductions this year</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-white/70 rounded-xl p-3">
                <div className="text-xs text-gray-600 mb-1">Business Expenses</div>
                <div className="text-base font-bold text-gray-900">$3,247</div>
              </div>
              <div className="bg-white/70 rounded-xl p-3">
                <div className="text-xs text-gray-600 mb-1">Healthcare</div>
                <div className="text-base font-bold text-gray-900">$1,856</div>
              </div>
            </div>
            <button className="w-full h-10 bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
              View Tax Report
            </button>
          </div>
        </div>

        {/* Duplicate Detection Block */}
        <div id="duplicate-detection-block" className="px-4 pb-6">
          <div className="bg-gradient-to-br from-red-50/80 to-rose-50/60 backdrop-blur-sm rounded-2xl p-5 border border-red-100/50 shadow-md">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center flex-shrink-0 shadow-md">
                <i className="fas fa-exclamation-triangle text-lg text-white"></i>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Potential Duplicate Charges</h3>
                <p className="text-xs text-gray-700 leading-relaxed">We detected 2 similar transactions on the same day that might be duplicates.</p>
              </div>
            </div>
            <div className="space-y-2 mb-3">
              <div className="bg-white/70 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-gray-900">Amazon.com</div>
                  <div className="text-xs text-gray-500">Dec 15, 2:34 PM</div>
                </div>
                <div className="text-sm font-bold text-rose-600">-$142.87</div>
              </div>
              <div className="bg-white/70 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-gray-900">Amazon.com</div>
                  <div className="text-xs text-gray-500">Dec 15, 2:36 PM</div>
                </div>
                <div className="text-sm font-bold text-rose-600">-$142.87</div>
              </div>
            </div>
            <button className="w-full h-10 bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
              Review Duplicates
            </button>
          </div>
        </div>

        {/* Budget Progress Block */}
        <div id="budget-progress-block" className="px-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Budget Progress</h3>
            <button className="text-xs text-gray-500 font-medium hover:text-[#00B875] transition-colors">View All</button>
          </div>
          <div className="space-y-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
                    <i className="fas fa-utensils text-sm text-orange-600"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Food &amp; Dining</div>
                    <div className="text-xs text-gray-500">$892 of $800</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-rose-600">+11.5%</div>
                  <div className="text-xs text-gray-500">Over budget</div>
                </div>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-full" id="ipq6qb"></div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                    <i className="fas fa-shopping-cart text-sm text-blue-600"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Shopping</div>
                    <div className="text-xs text-gray-500">$1,847 of $2,000</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-[#00B875]">92.4%</div>
                  <div className="text-xs text-gray-500">On track</div>
                </div>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#00B875] to-teal-600 rounded-full" id="iaoyii"></div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
                    <i className="fas fa-gas-pump text-sm text-red-600"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Transportation</div>
                    <div className="text-xs text-gray-500">$567 of $750</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-[#00B875]">75.6%</div>
                  <div className="text-xs text-gray-500">Doing well</div>
                </div>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#00B875] to-teal-600 rounded-full" id="ihm4m9"></div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendations Block */}
        <div id="ai-recommendations-block" className="px-4 pb-6">
          <div className="bg-gradient-to-br from-purple-50/80 to-indigo-50/60 backdrop-blur-sm rounded-2xl p-5 border border-purple-100/50 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
                <i className="fas fa-robot text-lg text-white"></i>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">AI Recommendations</h3>
                <p className="text-xs text-gray-600">Smart insights for you</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-white/70 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <i className="fas fa-check-circle text-[#00B875] text-sm mt-0.5"></i>
                  <p className="text-xs text-gray-700 leading-relaxed">Switch to annual billing for Netflix and save <span className="font-semibold text-[#00B875]">$47/year</span></p>
                </div>
              </div>
              <div className="bg-white/70 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <i className="fas fa-check-circle text-[#00B875] text-sm mt-0.5"></i>
                  <p className="text-xs text-gray-700 leading-relaxed">Your coffee spending is 45% higher than average users. Consider home brewing to save <span className="font-semibold text-[#00B875]">$120/month</span></p>
                </div>
              </div>
              <div className="bg-white/70 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <i className="fas fa-check-circle text-[#00B875] text-sm mt-0.5"></i>
                  <p className="text-xs text-gray-700 leading-relaxed">You're eligible for tax deductions on 3 business expenses totaling <span className="font-semibold text-[#00B875]">$847</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Branding */}
        <div id="footer-branding" className="px-4 pb-8 pt-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00B875] to-teal-600 flex items-center justify-center">
                <i className="fas fa-sync text-sm text-white"></i>
              </div>
              <span className="text-base font-bold text-gray-900">Receipt Cycle</span>
            </div>
            <p className="text-xs text-gray-500">Scan Once. Claim Your Tax Refund</p>
            <p className="text-xs text-gray-400 mt-2">AI-powered expense tracking</p>
          </div>
        </div>

        {/* Floating Add Button */}
        <button 
          id="floating-add-button" 
          onClick={() => navigate('/add-transaction')}
          className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-r from-[#00B875] to-teal-600 rounded-full shadow-xl shadow-[#00B875]/40 flex items-center justify-center hover:scale-110 transition-transform z-30"
        >
          <i className="fas fa-plus text-xl text-white"></i>
        </button>
      </div>

      {/* Bottom Navigation */}
      <div id="bottom-navigation" className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 z-40 pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          <button 
            onClick={() => navigate('/')}
            className="flex flex-col items-center justify-center gap-1 flex-1 hover:bg-gray-50 rounded-xl transition-colors py-2"
          >
            <i className="fas fa-home text-lg text-gray-400"></i>
            <span className="text-[10px] font-medium text-gray-500">Dashboard</span>
          </button>
          <button 
            onClick={() => navigate('/insight')}
            className="flex flex-col items-center justify-center gap-1 flex-1 hover:bg-gray-50 rounded-xl transition-colors py-2"
          >
            <i className="fas fa-chart-pie text-lg text-gray-400"></i>
            <span className="text-[10px] font-medium text-gray-500">Insights</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-1 flex-1 bg-[#00B875]/5 rounded-xl py-2">
            <i className="fas fa-list text-lg text-[#00B875]"></i>
            <span className="text-[10px] font-semibold text-[#00B875]">Transactions</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-1 flex-1 hover:bg-gray-50 rounded-xl transition-colors py-2">
            <i className="fas fa-cog text-lg text-gray-400"></i>
            <span className="text-[10px] font-medium text-gray-500">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Transaction;
