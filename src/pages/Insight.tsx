import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";
import { useMonthlyTransactions } from "@/hooks/use-transactions";
import EmptyState from "@/components/transactions/EmptyState";

const InsightContent = () => {
  const navigate = useNavigate();
  const { summary, loading } = useMonthlyTransactions();

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
            font: { family: 'Inter, sans-serif', size: 12 }
          };

          const pieConfig = { responsive: true, displayModeBar: false };

          const pieContainer = document.getElementById('desktop-pie-chart');
          if (pieContainer) {
            Plotly.newPlot('desktop-pie-chart', pieData, pieLayout, pieConfig);
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

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-80 bg-gray-100 rounded-2xl"></div>
          <div className="h-80 bg-gray-100 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Time Range */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financial Insights</h1>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg">This Month</button>
          <button className="px-4 py-2 bg-white text-gray-600 text-sm font-semibold rounded-lg border border-gray-200">Last Month</button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-primary/10 to-teal-50 rounded-2xl p-5 border border-primary/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center">
              <i className="fas fa-chart-line text-primary"></i>
            </div>
            <span className="text-sm text-gray-600 font-medium">Net Balance</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">${summary.netBalance.toFixed(0)}</div>
          <div className="text-xs text-primary mt-1">This month</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <i className="fas fa-piggy-bank text-green-600"></i>
            </div>
            <span className="text-sm text-gray-600 font-medium">Total Income</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">${summary.totalIncome.toFixed(0)}</div>
          <div className="text-xs text-green-600 mt-1">This month</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <i className="fas fa-credit-card text-rose-600"></i>
            </div>
            <span className="text-sm text-gray-600 font-medium">Total Expenses</span>
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
          <div className="text-xs text-primary mt-1">{summary.savingsRate >= 20 ? '✓ Above target' : 'Keep saving!'}</div>
        </div>
      </div>

      {summary.categoryBreakdown.length > 0 ? (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Expense Distribution */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Expense Distribution</h2>
              </div>
              <div id="desktop-pie-chart" style={{ height: '280px' }}></div>
              <div className="mt-4 space-y-2">
                {summary.categoryBreakdown.slice(0, 4).map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                      <span className="text-sm text-gray-700">{cat.category}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">${cat.amount.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Categories */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Top Spending Categories</h2>
              </div>
              <div className="space-y-4">
                {summary.categoryBreakdown.slice(0, 5).map((cat, i) => {
                  const percentage = summary.totalExpenses > 0 
                    ? (cat.amount / summary.totalExpenses) * 100 
                    : 0;
                  return (
                    <div key={cat.category}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <i className="fas fa-tag text-sm text-primary"></i>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{cat.category}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">${cat.amount.toFixed(0)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-teal-500 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% of total expenses</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="bg-gradient-to-br from-primary/5 to-teal-50/50 rounded-2xl p-6 border border-primary/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center">
                <i className="fas fa-brain text-white"></i>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">AI Recommendations</h2>
                <p className="text-sm text-gray-600">Based on your spending patterns</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fas fa-lightbulb text-amber-500"></i>
                  <span className="text-sm font-semibold text-gray-900">Track More</span>
                </div>
                <p className="text-xs text-gray-600">Keep adding transactions to get personalized insights and recommendations.</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fas fa-sync-alt text-purple-500"></i>
                  <span className="text-sm font-semibold text-gray-900">Scan Receipts</span>
                </div>
                <p className="text-xs text-gray-600">Use AI-powered receipt scanning to automatically categorize expenses.</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fas fa-piggy-bank text-green-500"></i>
                  <span className="text-sm font-semibold text-gray-900">Set Goals</span>
                </div>
                <p className="text-xs text-gray-600">Create savings goals and track your progress over time.</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <EmptyState 
          title="No insights yet"
          description="Add some transactions to see spending insights and AI recommendations"
          icon="fa-chart-pie"
        />
      )}
    </>
  );
};

const MobileInsight = () => {
  const navigate = useNavigate();
  const { summary, loading } = useMonthlyTransactions();

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

          const pieConfig = { responsive: true, displayModeBar: false };

          const pieContainer = document.getElementById('pie-chart-container');
          if (pieContainer) {
            Plotly.newPlot('pie-chart-container', pieData, pieLayout, pieConfig);
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

      <div className="pt-10 min-h-screen flex flex-col pb-20">
        <div className="sticky top-10 bg-white/90 backdrop-blur-md z-40 px-4 py-4 shadow-sm border-b border-gray-100">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <i className="fas fa-arrow-left text-gray-700"></i>
            </button>
            <h1 className="text-lg font-bold text-gray-900">Insights</h1>
            <div className="w-9 h-9"></div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="px-4 pt-5 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-primary/10 to-teal-50 rounded-2xl p-4 border border-primary/20">
              <div className="text-xs text-gray-600 font-medium mb-1">Net Balance</div>
              <div className="text-xl font-bold text-gray-900">${summary.netBalance.toFixed(0)}</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="text-xs text-gray-600 font-medium mb-1">Savings Rate</div>
              <div className="text-xl font-bold text-gray-900">{summary.savingsRate.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="px-4 pb-5">
            <div className="animate-pulse space-y-4">
              <div className="h-64 bg-gray-100 rounded-2xl"></div>
            </div>
          </div>
        ) : summary.categoryBreakdown.length > 0 ? (
          <>
            {/* Spending Breakdown */}
            <div className="px-4 pb-5">
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-5 shadow-lg border border-gray-100">
                <h3 className="text-base font-bold text-gray-900 mb-4">Spending Breakdown</h3>
                <div id="pie-chart-container" style={{ height: '200px' }}></div>
                <div className="mt-4 space-y-2">
                  {summary.categoryBreakdown.slice(0, 4).map((cat) => (
                    <div key={cat.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <span className="text-sm text-gray-700">{cat.category}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">${cat.amount.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Categories */}
            <div className="px-4 pb-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Top Categories</h3>
              <div className="space-y-3">
                {summary.categoryBreakdown.slice(0, 3).map((cat) => {
                  const percentage = summary.totalExpenses > 0 
                    ? (cat.amount / summary.totalExpenses) * 100 
                    : 0;
                  return (
                    <div key={cat.category} className="bg-white/70 rounded-2xl p-4 shadow-md border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-900">{cat.category}</span>
                        <span className="text-sm font-bold text-gray-900">${cat.amount.toFixed(0)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-teal-500 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% of total</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="px-4 pb-5">
            <EmptyState 
              title="No insights yet"
              description="Add transactions to see your spending insights"
              icon="fa-chart-pie"
            />
          </div>
        )}

        {/* Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-2xl shadow-gray-900/10 z-50">
          <div className="flex items-center justify-around px-4 py-3">
            <button onClick={() => navigate('/dashboard')} className="flex flex-col items-center gap-1 text-gray-400 active:scale-95 transition-transform">
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
            <button className="flex flex-col items-center gap-1 text-primary active:scale-95 transition-transform">
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

const Insight = () => {
  return (
    <ResponsiveLayout 
      variant="app" 
      showSidebar={true} 
      mobileContent={<MobileInsight />}
    >
      <InsightContent />
    </ResponsiveLayout>
  );
};

export default Insight;
