import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useScreenSize } from "@/hooks/use-screen-size";
import DesktopNav from "@/components/layout/DesktopNav";
import DesktopSidebar from "@/components/layout/DesktopSidebar";
import { useMonthlyTransactions, useRecentTransactions } from "@/hooks/use-transactions";
import { useAuth } from "@/contexts/AuthContext";
import QuickActions from "@/components/transactions/QuickActions";
import TransactionList from "@/components/transactions/TransactionList";
import EmptyState from "@/components/transactions/EmptyState";

const MobileDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { transactions, summary, loading } = useMonthlyTransactions();
  const { transactions: recentTransactions } = useRecentTransactions(5);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there';

  useEffect(() => {
    const initCharts = () => {
      try {
        if (typeof (window as any).Plotly !== 'undefined' && summary.categoryBreakdown.length > 0) {
          const Plotly = (window as any).Plotly;
          
          const pieData = [{
            values: summary.categoryBreakdown.map(c => c.amount),
            labels: summary.categoryBreakdown.map(c => c.category),
            type: 'pie',
            marker: {
              colors: ['#00B875', '#3B82F6', '#A855F7', '#F97316', '#14B8A6']
            },
            textinfo: 'percent',
            textposition: 'inside',
            hovertemplate: '<b>%{label}</b><br>$%{value:.2f}<br>%{percent}<extra></extra>'
          }];

          const pieLayout = {
            showlegend: false,
            margin: { t: 10, r: 10, b: 10, l: 10 },
            plot_bgcolor: 'rgba(0,0,0,0)',
            paper_bgcolor: 'rgba(0,0,0,0)',
            font: { family: 'Inter, sans-serif', size: 11 }
          };

          const pieConfig = {
            responsive: true,
            displayModeBar: false,
            displaylogo: false
          };

          const pieContainer = document.getElementById('dashboard-pie-chart');
          if (pieContainer) {
            Plotly.newPlot('dashboard-pie-chart', pieData, pieLayout, pieConfig);
          }
        }
      } catch(e) {
        console.error('Chart rendering error:', e);
      }
    };

    if (typeof (window as any).Plotly === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.plot.ly/plotly-3.1.1.min.js';
      script.onload = initCharts;
      document.head.appendChild(script);
    } else {
      initCharts();
    }
  }, [summary.categoryBreakdown]);

  return (
    <div className="font-sans bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 overflow-x-hidden min-h-screen">
      <style>{`::-webkit-scrollbar { display: none; }`}</style>

      <div id="status-bar" className="fixed top-0 left-0 right-0 h-10 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-between px-4 shadow-sm">
        <div className="text-xs font-semibold text-gray-900">9:41</div>
        <div className="flex items-center gap-1">
          <i className="fas fa-signal text-xs text-gray-900"></i>
          <i className="fas fa-wifi text-xs text-gray-900 ml-1"></i>
          <i className="fas fa-battery-full text-xs text-gray-900 ml-1"></i>
        </div>
      </div>

      <div id="root-container" className="pt-10 min-h-screen flex flex-col pb-20">
        <div id="header-top-bar" className="sticky top-10 bg-white/90 backdrop-blur-md z-40 px-4 py-3 shadow-sm border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shadow-md">
                <i className="fas fa-sync text-white text-sm"></i>
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">Receipt Cycle</h1>
                <p className="text-xs text-gray-500">Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/notification')}
                className="relative w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <i className="fas fa-bell text-gray-700"></i>
              </button>
              <button 
                onClick={() => navigate('/setting')}
                className="w-9 h-9 rounded-xl overflow-hidden shadow-md border-2 border-white"
              >
                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" alt="Profile" className="w-full h-full object-cover" />
              </button>
            </div>
          </div>
        </div>

        <div id="greeting-section" className="px-4 pt-5 pb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Good morning, {displayName}</h2>
          <p className="text-sm text-gray-600">Here's your financial snapshot for today</p>
        </div>

        <div id="key-metrics-cards" className="px-4 pb-5">
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <div className="min-w-[200px] bg-gradient-to-br from-primary to-teal-600 rounded-3xl p-5 shadow-xl shadow-primary/30">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xs text-white/80 font-medium mb-1">Net Balance</div>
                  <div className="text-3xl font-bold text-white">
                    ${summary.netBalance.toFixed(0)}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <i className="fas fa-wallet text-lg text-white"></i>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 bg-white/20 rounded-lg flex items-center gap-1">
                  <i className={`fas ${summary.savingsRate >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'} text-xs text-white`}></i>
                  <span className="text-xs font-semibold text-white">{Math.abs(summary.savingsRate).toFixed(1)}%</span>
                </div>
                <span className="text-xs text-white/80">savings rate</span>
              </div>
            </div>

            <div className="min-w-[180px] bg-white/70 backdrop-blur-sm rounded-3xl p-5 shadow-lg border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xs text-gray-500 font-medium mb-1">Total Expenses</div>
                  <div className="text-2xl font-bold text-gray-900">${summary.totalExpenses.toFixed(0)}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center">
                  <i className="fas fa-credit-card text-lg text-rose-600"></i>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">{summary.transactionCount} transactions</span>
              </div>
            </div>

            <div className="min-w-[180px] bg-white/70 backdrop-blur-sm rounded-3xl p-5 shadow-lg border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xs text-gray-500 font-medium mb-1">Total Income</div>
                  <div className="text-2xl font-bold text-gray-900">${summary.totalIncome.toFixed(0)}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                  <i className="fas fa-piggy-bank text-lg text-green-600"></i>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <i className="fas fa-check-circle text-xs text-primary"></i>
                <span className="text-xs text-primary font-semibold">This month</span>
              </div>
            </div>
          </div>
        </div>

        <div id="quick-actions" className="px-4 pb-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Quick Actions</h3>
          <QuickActions variant="horizontal" />
        </div>

        {loading ? (
          <div className="px-4 pb-5">
            <div className="bg-white/70 rounded-3xl p-5 shadow-lg border border-gray-100">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ) : summary.categoryBreakdown.length > 0 ? (
          <div id="spending-overview" className="px-4 pb-5">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-5 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900">Spending Overview</h3>
                <button 
                  onClick={() => navigate('/insight')}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  View All
                </button>
              </div>
              
              <div id="dashboard-pie-chart" style={{ height: '200px' }} className="mb-4"></div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Top Categories</h4>
                {summary.categoryBreakdown.slice(0, 3).map((cat, i) => (
                  <div key={cat.category} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        <i className={`fas fa-tag text-primary`}></i>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{cat.category}</div>
                        <div className="text-xs text-gray-500">{cat.count} transactions</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">${cat.amount.toFixed(0)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 pb-5">
            <EmptyState 
              title="No spending data yet"
              description="Add your first transaction to see spending insights"
              icon="fa-chart-pie"
            />
          </div>
        )}

        <div id="recent-transactions" className="px-4 pb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Recent Transactions</h3>
            <button 
              onClick={() => navigate('/transaction')}
              className="text-xs text-primary font-semibold hover:underline"
            >
              View All
            </button>
          </div>
          
          {recentTransactions.length > 0 ? (
            <TransactionList transactions={recentTransactions} variant="list" />
          ) : (
            <EmptyState 
              title="No transactions yet"
              description="Scan a receipt or add a transaction to get started"
            />
          )}
        </div>

        <div id="bottom-nav" className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-2xl shadow-gray-900/10 z-50">
          <div className="flex items-center justify-around px-4 py-3">
            <button className="flex flex-col items-center gap-1 text-primary active:scale-95 transition-transform">
              <i className="fas fa-home text-xl"></i>
              <span className="text-xs font-medium">Home</span>
            </button>
            <button onClick={() => navigate('/transaction')} className="flex flex-col items-center gap-1 text-gray-400 active:scale-95 transition-transform">
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

const DesktopDashboard = () => {
  const navigate = useNavigate();
  const { summary, loading } = useMonthlyTransactions();
  const { transactions: recentTransactions } = useRecentTransactions(5);

  return (
    <>
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-primary/10 to-teal-50 rounded-2xl p-5 border border-primary/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center">
              <i className="fas fa-wallet text-primary"></i>
            </div>
            <span className="text-sm text-gray-600 font-medium">Net Balance</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">${summary.netBalance.toFixed(0)}</div>
          <div className="text-xs text-primary mt-1">This month</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <i className="fas fa-arrow-up text-green-600"></i>
            </div>
            <span className="text-sm text-gray-600 font-medium">Income</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">${summary.totalIncome.toFixed(0)}</div>
          <div className="text-xs text-green-600 mt-1">Total this month</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <i className="fas fa-arrow-down text-rose-600"></i>
            </div>
            <span className="text-sm text-gray-600 font-medium">Expenses</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">${summary.totalExpenses.toFixed(0)}</div>
          <div className="text-xs text-rose-600 mt-1">{summary.transactionCount} transactions</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <i className="fas fa-percentage text-blue-600"></i>
            </div>
            <span className="text-sm text-gray-600 font-medium">Savings Rate</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{summary.savingsRate.toFixed(1)}%</div>
          <div className="text-xs text-primary mt-1">{summary.savingsRate >= 20 ? '✓ Above target' : 'Keep going!'}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <QuickActions variant="grid" />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Spending by Category</h2>
            <button 
              onClick={() => navigate('/insight')}
              className="text-sm text-primary font-medium hover:underline"
            >
              View All
            </button>
          </div>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded"></div>
              ))}
            </div>
          ) : summary.categoryBreakdown.length > 0 ? (
            <div className="space-y-3">
              {summary.categoryBreakdown.slice(0, 5).map((cat) => (
                <div key={cat.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <i className="fas fa-tag text-primary"></i>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{cat.category}</div>
                      <div className="text-xs text-gray-500">{cat.count} transactions</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-gray-900">${cat.amount.toFixed(2)}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState 
              title="No spending data"
              description="Add expenses to see your category breakdown"
              icon="fa-chart-pie"
            />
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
            <button 
              onClick={() => navigate('/transaction')}
              className="text-sm text-primary font-medium hover:underline"
            >
              View All
            </button>
          </div>
          {recentTransactions.length > 0 ? (
            <TransactionList transactions={recentTransactions} variant="list" />
          ) : (
            <EmptyState 
              title="No transactions yet"
              description="Scan a receipt or add a transaction to get started"
            />
          )}
        </div>
      </div>
    </>
  );
};

const Dashboard = () => {
  const { isMobileOrTablet } = useScreenSize();

  if (isMobileOrTablet) {
    return <MobileDashboard />;
  }

  return (
    <div className="font-sans bg-gradient-to-br from-gray-50 to-white min-h-screen">
      <DesktopNav variant="app" />
      <DesktopSidebar />
      <main className="pl-64 pt-16 min-h-screen">
        <div className="p-8 max-w-7xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Your financial overview for this month</p>
          </div>
          <DesktopDashboard />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
