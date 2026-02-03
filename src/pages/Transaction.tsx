import { useNavigate } from "react-router-dom";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";

const TransactionContent = () => {
  const navigate = useNavigate();

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
              <div className="text-2xl font-bold text-primary">$8,240</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-sm text-gray-500 mb-1 font-medium">Expenses</div>
              <div className="text-2xl font-bold text-rose-600">$5,632</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-sm text-gray-500 mb-1 font-medium">Net</div>
              <div className="text-2xl font-bold text-gray-900">$2,608</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-sm text-gray-500 mb-1 font-medium">Savings Rate</div>
              <div className="text-2xl font-bold text-primary">31.6%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg shadow-md">Today</button>
          <button className="px-4 py-2 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-200 hover:bg-gray-50">This Week</button>
          <button className="px-4 py-2 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-200 hover:bg-gray-50">This Month</button>
          <button className="px-4 py-2 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-200 hover:bg-gray-50">Custom</button>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-2">
            <i className="fas fa-search"></i>
            Search
          </button>
          <button className="px-3 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-2">
            <i className="fas fa-filter"></i>
            Filter
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-2 mb-6">
        <button className="px-3 py-1.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-2">
          <i className="fas fa-circle text-xs text-rose-500"></i>
          Expenses
        </button>
        <button className="px-3 py-1.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-2">
          <i className="fas fa-circle text-xs text-primary"></i>
          Income
        </button>
        <button className="px-3 py-1.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-2">
          <i className="fas fa-sync text-xs text-purple-500"></i>
          Recurring
        </button>
        <button className="px-3 py-1.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-2">
          <i className="fas fa-paperclip text-xs text-blue-500"></i>
          With Receipt
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <button className="text-sm text-primary font-medium hover:underline">Export</button>
        </div>
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
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                    <i className="fas fa-shopping-cart text-blue-600"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Amazon.com</div>
                    <div className="text-xs text-gray-500">Online Shopping</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">Shopping</span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">Today, 2:34 PM</td>
              <td className="px-6 py-4 text-right text-sm font-bold text-rose-600">-$142.87</td>
              <td className="px-6 py-4 text-center">
                <i className="fas fa-receipt text-gray-400"></i>
              </td>
              <td className="px-6 py-4 text-center">
                <button className="text-gray-400 hover:text-gray-600"><i className="fas fa-ellipsis-h"></i></button>
              </td>
            </tr>
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-teal-100 flex items-center justify-center">
                    <i className="fas fa-dollar-sign text-primary"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Salary Deposit</div>
                    <div className="text-xs text-gray-500">Direct Deposit</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">Income</span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">Yesterday</td>
              <td className="px-6 py-4 text-right text-sm font-bold text-primary">+$4,200.00</td>
              <td className="px-6 py-4 text-center">
                <span className="text-gray-300">—</span>
              </td>
              <td className="px-6 py-4 text-center">
                <button className="text-gray-400 hover:text-gray-600"><i className="fas fa-ellipsis-h"></i></button>
              </td>
            </tr>
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
                    <i className="fas fa-utensils text-orange-600"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Starbucks Coffee</div>
                    <div className="text-xs text-gray-500">Coffee Shop</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs font-semibold rounded">Food</span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">Yesterday</td>
              <td className="px-6 py-4 text-right text-sm font-bold text-rose-600">-$6.45</td>
              <td className="px-6 py-4 text-center">
                <i className="fas fa-receipt text-primary"></i>
              </td>
              <td className="px-6 py-4 text-center">
                <button className="text-gray-400 hover:text-gray-600"><i className="fas fa-ellipsis-h"></i></button>
              </td>
            </tr>
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                    <i className="fas fa-film text-purple-600"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Netflix Subscription</div>
                    <div className="text-xs text-gray-500">Streaming • <span className="text-purple-600">Monthly</span></div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded">Entertainment</span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">Dec 12</td>
              <td className="px-6 py-4 text-right text-sm font-bold text-rose-600">-$15.99</td>
              <td className="px-6 py-4 text-center">
                <span className="text-gray-300">—</span>
              </td>
              <td className="px-6 py-4 text-center">
                <button className="text-gray-400 hover:text-gray-600"><i className="fas fa-ellipsis-h"></i></button>
              </td>
            </tr>
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
                    <i className="fas fa-gas-pump text-red-600"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Shell Gas Station</div>
                    <div className="text-xs text-gray-500">Fuel</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded">Transport</span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">Dec 11</td>
              <td className="px-6 py-4 text-right text-sm font-bold text-rose-600">-$52.30</td>
              <td className="px-6 py-4 text-center">
                <i className="fas fa-receipt text-primary"></i>
              </td>
              <td className="px-6 py-4 text-center">
                <button className="text-gray-400 hover:text-gray-600"><i className="fas fa-ellipsis-h"></i></button>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">Showing 5 of 147 transactions</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200">Previous</button>
            <button className="px-3 py-1.5 bg-primary text-white text-sm rounded-lg">Next</button>
          </div>
        </div>
      </div>
    </>
  );
};

const MobileTransaction = () => {
  const navigate = useNavigate();

  return (
    <div className="font-sans bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 overflow-x-hidden min-h-screen">
      <style>{`
        ::-webkit-scrollbar { display: none; }
        #ien25 { width: 31.6%; }
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
                <div className="text-lg font-bold text-primary">$8,240</div>
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
                <div className="h-full bg-gradient-to-r from-primary to-teal-500 rounded-full" id="ien25"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Date Range Selector */}
        <div id="date-range-selector" className="px-4 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl shadow-md shadow-primary/20 whitespace-nowrap">Today</button>
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
              <i className="fas fa-circle text-[8px] text-primary"></i>
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

        {/* Transactions List */}
        <div id="transactions-list-block" className="px-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
            <button className="text-xs text-gray-500 font-medium hover:text-primary transition-colors">View All</button>
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
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/10 to-teal-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <i className="fas fa-dollar-sign text-lg text-primary"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 truncate">Salary Deposit</h4>
                      <p className="text-xs text-gray-500">Income • Direct Deposit</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-primary">+$4,200.00</div>
                      <div className="text-xs text-gray-500">Yesterday</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded">Income</span>
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

            {/* Netflix */}
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

            {/* Shell Gas */}
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
          </div>
        </div>

        {/* Bottom Navigation */}
        <div id="bottom-nav" className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-lg shadow-gray-200/50 border-t border-gray-100 z-50">
          <div className="flex items-center justify-around h-16 px-4 max-w-md mx-auto">
            <button onClick={() => navigate('/dashboard')} className="flex flex-col items-center gap-1 p-2">
              <i className="fas fa-home text-lg text-gray-400"></i>
              <span className="text-[10px] font-medium text-gray-400">Home</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-2">
              <i className="fas fa-exchange-alt text-lg text-primary"></i>
              <span className="text-[10px] font-medium text-primary">Transactions</span>
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

const Transaction = () => {
  return (
    <ResponsiveLayout
      mobileContent={<MobileTransaction />}
      variant="app"
      showSidebar={true}
    >
      <TransactionContent />
    </ResponsiveLayout>
  );
};

export default Transaction;
