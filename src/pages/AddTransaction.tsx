import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";

const AddTransactionContent = () => {
  const navigate = useNavigate();
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [isRecurring, setIsRecurring] = useState(false);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div id="root-container" className="pt-10 min-h-screen flex flex-col pb-20">
        <div id="header" className="sticky top-10 bg-white/80 backdrop-blur-md z-40 px-4 py-4 shadow-sm border-b border-gray-100/50">
          <div className="flex items-center justify-between">
            <button onClick={handleBack} className="w-10 h-10 rounded-xl bg-white shadow-md shadow-gray-200/50 flex items-center justify-center border border-gray-100/50 active:scale-95 transition-transform">
              <i className="fas fa-arrow-left text-gray-900"></i>
            </button>
            <h1 className="text-lg font-bold text-gray-900">Add Transaction</h1>
            <button className="w-10 h-10 rounded-xl bg-white shadow-md shadow-gray-200/50 flex items-center justify-center border border-gray-100/50 active:scale-95 transition-transform">
              <i className="fas fa-question-circle text-gray-500"></i>
            </button>
          </div>
        </div>

        <div id="transaction-type-selector" className="px-4 pt-6 pb-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-1.5 shadow-lg shadow-gray-200/50 border border-gray-100/50 flex gap-1.5">
            <button 
              onClick={() => setTransactionType('expense')}
              className={`flex-1 h-12 ${transactionType === 'expense' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/30' : 'bg-gray-50 text-gray-600'} text-sm font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform`}
            >
              <i className="fas fa-arrow-down"></i>
              Expense
            </button>
            <button 
              onClick={() => setTransactionType('income')}
              className={`flex-1 h-12 ${transactionType === 'income' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md shadow-green-500/30' : 'bg-gray-50 text-gray-600'} text-sm font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform`}
            >
              <i className="fas fa-arrow-up"></i>
              Income
            </button>
          </div>
        </div>

        <div id="amount-section" className="px-4 pb-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100/50">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">Amount</label>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-gray-400">$</div>
              <input type="text" placeholder="0.00" className="flex-1 text-4xl font-bold text-gray-900 bg-transparent border-none outline-none placeholder-gray-300" />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Last transaction</span>
                <span className="text-gray-700 font-semibold">$42.50 • Starbucks</span>
              </div>
            </div>
          </div>
        </div>

        <div id="date-section" className="px-4 pb-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">Date</label>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-teal-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-calendar text-primary"></i>
              </div>
              <input type="text" defaultValue="Today, Dec 15, 2024" className="flex-1 text-base font-semibold text-gray-900 bg-transparent border-none outline-none" />
              <i className="fas fa-chevron-down text-gray-400 text-sm"></i>
            </div>
          </div>
        </div>

        <div id="merchant-section" className="px-4 pb-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">Merchant / Payee</label>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-store text-blue-600"></i>
              </div>
              <input type="text" placeholder="Enter merchant name" className="flex-1 text-base font-medium text-gray-900 bg-transparent border-none outline-none placeholder-gray-400" />
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="text-xs font-semibold text-gray-500 mb-2">Recent Merchants</div>
              <div className="flex items-center gap-2 flex-wrap">
                <button className="px-3 py-1.5 bg-gray-50 text-gray-700 text-xs font-medium rounded-lg border border-gray-200 active:scale-95 transition-transform">Starbucks</button>
                <button className="px-3 py-1.5 bg-gray-50 text-gray-700 text-xs font-medium rounded-lg border border-gray-200 active:scale-95 transition-transform">Amazon</button>
                <button className="px-3 py-1.5 bg-gray-50 text-gray-700 text-xs font-medium rounded-lg border border-gray-200 active:scale-95 transition-transform">Uber</button>
                <button className="px-3 py-1.5 bg-gray-50 text-gray-700 text-xs font-medium rounded-lg border border-gray-200 active:scale-95 transition-transform">Walmart</button>
              </div>
            </div>
          </div>
        </div>

        <div id="category-section" className="px-4 pb-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</label>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                <i className="fas fa-sparkles text-purple-600 text-xs"></i>
                <span className="text-xs font-semibold text-purple-600">AI Suggested</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-utensils text-amber-600"></i>
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold text-gray-900">Food & Dining</div>
                <div className="text-xs text-gray-500">Auto-detected from merchant</div>
              </div>
              <i className="fas fa-chevron-down text-gray-400 text-sm"></i>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="text-xs font-semibold text-gray-500 mb-2">Quick Categories</div>
              <div className="grid grid-cols-4 gap-2">
                <button className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200/50 active:scale-95 transition-transform">
                  <i className="fas fa-utensils text-amber-600 text-sm"></i>
                  <span className="text-xs font-medium text-gray-700">Food</span>
                </button>
                <button className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-gray-50 border border-gray-200 active:scale-95 transition-transform">
                  <i className="fas fa-shopping-cart text-gray-600 text-sm"></i>
                  <span className="text-xs font-medium text-gray-700">Shopping</span>
                </button>
                <button className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-gray-50 border border-gray-200 active:scale-95 transition-transform">
                  <i className="fas fa-car text-gray-600 text-sm"></i>
                  <span className="text-xs font-medium text-gray-700">Transport</span>
                </button>
                <button className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-gray-50 border border-gray-200 active:scale-95 transition-transform">
                  <i className="fas fa-home text-gray-600 text-sm"></i>
                  <span className="text-xs font-medium text-gray-700">Bills</span>
                </button>
                <button className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-gray-50 border border-gray-200 active:scale-95 transition-transform">
                  <i className="fas fa-heartbeat text-gray-600 text-sm"></i>
                  <span className="text-xs font-medium text-gray-700">Health</span>
                </button>
                <button className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-gray-50 border border-gray-200 active:scale-95 transition-transform">
                  <i className="fas fa-film text-gray-600 text-sm"></i>
                  <span className="text-xs font-medium text-gray-700">Entertainment</span>
                </button>
                <button className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-gray-50 border border-gray-200 active:scale-95 transition-transform">
                  <i className="fas fa-graduation-cap text-gray-600 text-sm"></i>
                  <span className="text-xs font-medium text-gray-700">Education</span>
                </button>
                <button className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-gray-50 border border-gray-200 active:scale-95 transition-transform">
                  <i className="fas fa-ellipsis-h text-gray-600 text-sm"></i>
                  <span className="text-xs font-medium text-gray-700">Other</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div id="receipt-upload-section" className="px-4 pb-4">
          <div className="bg-gradient-to-br from-primary/5 to-teal-50/50 rounded-3xl p-5 border border-primary/10 shadow-lg shadow-primary/5">
            <div className="flex items-center gap-2 mb-4">
              <i className="fas fa-receipt text-primary"></i>
              <label className="text-sm font-semibold text-gray-900">Receipt / Supporting Document</label>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl shadow-md shadow-gray-200/40 border border-gray-100 active:scale-95 transition-transform">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-teal-100 flex items-center justify-center">
                  <i className="fas fa-camera text-primary text-lg"></i>
                </div>
                <span className="text-xs font-semibold text-gray-700 text-center">Scan Receipt</span>
              </button>
              
              <button className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl shadow-md shadow-gray-200/40 border border-gray-100 active:scale-95 transition-transform">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                  <i className="fas fa-images text-blue-600 text-lg"></i>
                </div>
                <span className="text-xs font-semibold text-gray-700 text-center">From Gallery</span>
              </button>
              
              <button className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl shadow-md shadow-gray-200/40 border border-gray-100 active:scale-95 transition-transform">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                  <i className="fas fa-file-upload text-purple-600 text-lg"></i>
                </div>
                <span className="text-xs font-semibold text-gray-700 text-center">Upload File</span>
              </button>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-primary/20">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <i className="fas fa-info-circle text-primary"></i>
                <span>OCR will auto-extract merchant, amount, date & tax details</span>
              </div>
            </div>
          </div>
        </div>

        <div id="payment-method-section" className="px-4 pb-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">Payment Method</label>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-credit-card text-indigo-600"></i>
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold text-gray-900">Chase Sapphire</div>
                <div className="text-xs text-gray-500">•••• 4242</div>
              </div>
              <i className="fas fa-chevron-down text-gray-400 text-sm"></i>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors active:scale-98">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-wallet text-green-600 text-sm"></i>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold text-gray-900">Cash</div>
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors active:scale-98">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-university text-blue-600 text-sm"></i>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold text-gray-900">Bank of America</div>
                    <div className="text-xs text-gray-500">•••• 8901</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div id="tags-notes-section" className="px-4 pb-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">Tags & Notes</label>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-tags text-rose-600"></i>
              </div>
              <input type="text" placeholder="Add tags (e.g., work, business)" className="flex-1 text-sm font-medium text-gray-900 bg-transparent border-none outline-none placeholder-gray-400" />
            </div>
            <div className="pt-3 border-t border-gray-100">
              <textarea placeholder="Add notes or description..." className="w-full text-sm text-gray-900 bg-transparent border-none outline-none placeholder-gray-400 resize-none" rows={2}></textarea>
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-lg border border-primary/20">#work</span>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg border border-blue-200">#business</span>
              <span className="px-3 py-1 bg-purple-50 text-purple-600 text-xs font-semibold rounded-lg border border-purple-200">#deductible</span>
            </div>
          </div>
        </div>

        <div id="recurring-section" className="px-4 pb-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-redo text-cyan-600"></i>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Repeat Transaction</div>
                  <div className="text-xs text-gray-500">Set as recurring expense</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isRecurring}
                  onChange={() => setIsRecurring(!isRecurring)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className={`pt-3 border-t border-gray-100 space-y-3 ${!isRecurring ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-500 w-20">Frequency</span>
                <div className="flex-1 flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Monthly</span>
                  <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-500 w-20">End Date</span>
                <div className="flex-1 flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">No end date</span>
                  <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="ai-suggestions-section" className="px-4 pb-4">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-4 shadow-md shadow-purple-200/40 border border-purple-200/50">
            <div className="flex items-center gap-2 mb-3">
              <i className="fas fa-lightbulb text-purple-600"></i>
              <span className="text-sm font-semibold text-gray-900">Smart Suggestions</span>
            </div>
            <div className="space-y-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-purple-100">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-purple-600 mb-1">Similar Transaction Detected</div>
                    <div className="text-sm text-gray-700">You spent $45.20 at Starbucks 3 days ago</div>
                  </div>
                  <button className="text-xs font-semibold text-primary active:scale-95 transition-transform">Copy</button>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-purple-100">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-purple-600 mb-1">Budget Alert</div>
                    <div className="text-sm text-gray-700">You've spent 78% of your Food & Dining budget this month</div>
                  </div>
                  <i className="fas fa-exclamation-triangle text-amber-500"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="transaction-summary-section" className="px-4 pb-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Transaction Summary</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Type</span>
                <span className={`font-semibold ${transactionType === 'expense' ? 'text-red-600' : 'text-green-600'}`}>{transactionType === 'expense' ? 'Expense' : 'Income'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Amount</span>
                <span className="font-semibold text-gray-900">$0.00</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Category</span>
                <span className="font-semibold text-gray-900">Food & Dining</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Payment</span>
                <span className="font-semibold text-gray-900">Chase •••• 4242</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Date</span>
                <span className="font-semibold text-gray-900">Today</span>
              </div>
            </div>
          </div>
        </div>

        <div id="action-buttons-section" className="px-4 pb-6">
          <button className="w-full h-14 bg-gradient-to-r from-primary to-teal-600 text-white text-base font-semibold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mb-3 flex items-center justify-center gap-2">
            <i className="fas fa-check-circle"></i>
            Save Transaction
          </button>
          
          <button className="w-full h-12 bg-white text-gray-700 text-sm font-semibold rounded-xl shadow-md shadow-gray-200/50 border border-gray-200 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2">
            <i className="fas fa-plus-circle"></i>
            Save & Add Another
          </button>
        </div>

        <div id="quick-tips-section" className="px-4 pb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-4 border border-blue-200/50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i className="fas fa-info text-white text-sm"></i>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900 mb-1">Pro Tip</div>
                <div className="text-xs text-gray-700 leading-relaxed">Scan your receipt to auto-fill all fields. Our AI extracts merchant, amount, date, and even line items with 99.8% accuracy.</div>
              </div>
            </div>
          </div>
        </div>

        <div id="recent-transactions-section" className="px-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Recent Transactions</h3>
            <button className="text-xs font-semibold text-primary">View All</button>
          </div>
          
          <div className="space-y-2">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-gray-100/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-coffee text-red-600"></i>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900">Starbucks</div>
                <div className="text-xs text-gray-500">Food & Dining • Today</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-red-600">-$42.50</div>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-gray-100/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-shopping-bag text-blue-600"></i>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900">Amazon</div>
                <div className="text-xs text-gray-500">Shopping • Yesterday</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-red-600">-$127.99</div>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-gray-100/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-arrow-up text-green-600"></i>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900">Salary Deposit</div>
                <div className="text-xs text-gray-500">Income • Dec 1</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-green-600">+$4,250.00</div>
              </div>
            </div>
          </div>
        </div>

        <div id="keyboard-shortcuts-section" className="px-4 pb-6">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-4 border border-gray-200/50">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</div>
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 active:scale-95 transition-transform">
                <i className="fas fa-copy text-gray-600 text-sm"></i>
                <span className="text-xs font-medium text-gray-700">Duplicate Last</span>
              </button>
              <button className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 active:scale-95 transition-transform">
                <i className="fas fa-history text-gray-600 text-sm"></i>
                <span className="text-xs font-medium text-gray-700">Templates</span>
              </button>
            </div>
          </div>
        </div>

        <div id="bottom-safe-area" className="h-4"></div>
      </div>
  );
};

const MobileAddTransaction = () => (
  <div className="font-sans bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 overflow-x-hidden">
    <div id="status-bar" className="fixed top-0 left-0 right-0 h-10 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-between px-4 shadow-sm">
      <div className="text-xs font-semibold text-gray-900">9:41</div>
      <div className="flex items-center gap-1">
        <i className="fas fa-signal text-xs text-gray-900"></i>
        <i className="fas fa-wifi text-xs text-gray-900 ml-1"></i>
        <i className="fas fa-battery-full text-xs text-gray-900 ml-1"></i>
      </div>
    </div>
    <AddTransactionContent />

    <div id="bottom-nav" className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-2xl shadow-gray-900/10 z-50">
      <div className="flex items-center justify-around px-4 py-3">
        <button className="flex flex-col items-center gap-1 text-gray-400 active:scale-95 transition-transform">
          <i className="fas fa-home text-xl"></i>
          <span className="text-xs font-medium">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400 active:scale-95 transition-transform">
          <i className="fas fa-list text-xl"></i>
          <span className="text-xs font-medium">Transactions</span>
        </button>
        <button className="relative -mt-6">
          <div className="w-16 h-16 bg-gradient-to-r from-primary to-teal-600 rounded-full shadow-lg shadow-primary/40 flex items-center justify-center active:scale-95 transition-transform">
            <i className="fas fa-plus text-white text-2xl"></i>
          </div>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400 active:scale-95 transition-transform">
          <i className="fas fa-chart-pie text-xl"></i>
          <span className="text-xs font-medium">Insights</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400 active:scale-95 transition-transform">
          <i className="fas fa-cog text-xl"></i>
          <span className="text-xs font-medium">Settings</span>
        </button>
      </div>
      <div className="h-6 bg-white"></div>
    </div>
  </div>
);

const DesktopAddTransaction = () => (
  <ResponsiveLayout variant="app" showSidebar={true} mobileContent={<MobileAddTransaction />}>
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Transaction</h1>
        <p className="text-gray-600">Capture, categorize, and attach receipts in one place.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
        <div className="p-6">
          <AddTransactionContent />
        </div>
      </div>
    </div>
  </ResponsiveLayout>
);

const AddTransaction = () => {
  return <DesktopAddTransaction />;
};

export default AddTransaction;
