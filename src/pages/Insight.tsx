import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";

const InsightContent = () => {
  useEffect(() => {
    const initCharts = () => {
      try {
        if (typeof (window as any).Plotly !== 'undefined') {
          const Plotly = (window as any).Plotly;
          
          const pieData = [{
            values: [1245, 987, 876, 654, 1891],
            labels: ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities'],
            type: 'pie',
            marker: {
              colors: ['#00B875', '#3B82F6', '#A855F7', '#F97316', '#14B8A6']
            },
            textinfo: 'percent',
            textposition: 'inside',
            hovertemplate: '<b>%{label}</b><br>$%{value}<br>%{percent}<extra></extra>'
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

          const lineData = [{
            x: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            y: [187, 234, 198, 487, 312, 398, 124],
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: '#00B875', width: 3, shape: 'spline' },
            marker: { color: '#00B875', size: 8 },
            fill: 'tozeroy',
            fillcolor: 'rgba(0, 184, 117, 0.1)',
            hovertemplate: '<b>%{x}</b><br>$%{y}<extra></extra>'
          }];

          const lineLayout = {
            showlegend: false,
            margin: { t: 20, r: 30, b: 50, l: 60 },
            plot_bgcolor: 'rgba(0,0,0,0)',
            paper_bgcolor: 'rgba(0,0,0,0)',
            xaxis: { showgrid: false, zeroline: false },
            yaxis: { title: 'Amount ($)', showgrid: true, gridcolor: 'rgba(0,0,0,0.05)', zeroline: false },
            font: { family: 'Inter, sans-serif', size: 12 }
          };

          const lineContainer = document.getElementById('desktop-line-chart');
          if (lineContainer) {
            Plotly.newPlot('desktop-line-chart', lineData, lineLayout, pieConfig);
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
  }, []);

  return (
    <>
      {/* Time Range */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financial Insights</h1>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg">This Month</button>
          <button className="px-4 py-2 bg-white text-gray-600 text-sm font-semibold rounded-lg border border-gray-200">Last Month</button>
          <button className="px-4 py-2 bg-white text-gray-600 text-sm font-semibold rounded-lg border border-gray-200">3 Months</button>
          <button className="px-4 py-2 bg-white text-gray-600 text-sm font-semibold rounded-lg border border-gray-200">Custom</button>
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
          <div className="text-2xl font-bold text-gray-900">+$2,847</div>
          <div className="text-xs text-primary mt-1">↑ 12% vs last month</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <i className="fas fa-piggy-bank text-green-600"></i>
            </div>
            <span className="text-sm text-gray-600 font-medium">Net Savings</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">$2,847</div>
          <div className="text-xs text-green-600 mt-1">↑ 12% vs last month</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <i className="fas fa-percentage text-blue-600"></i>
            </div>
            <span className="text-sm text-gray-600 font-medium">Savings Rate</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">33.5%</div>
          <div className="text-xs text-primary mt-1">✓ Above target</div>
        </div>
        <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-2xl p-5 border border-rose-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center">
              <i className="fas fa-exclamation-triangle text-rose-600"></i>
            </div>
            <span className="text-sm text-gray-600 font-medium">Money Leaks</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">$342</div>
          <div className="text-xs text-gray-600 mt-1">7 subscriptions found</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Expense Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Expense Distribution</h2>
            <button className="text-sm text-primary font-medium hover:underline">View All</button>
          </div>
          <div id="desktop-pie-chart" style={{ height: '280px' }}></div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-sm text-gray-700">Food & Dining</span>
              </div>
              <span className="text-sm font-bold text-gray-900">$1,245</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-700">Transportation</span>
              </div>
              <span className="text-sm font-bold text-gray-900">$987</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-sm text-gray-700">Shopping</span>
              </div>
              <span className="text-sm font-bold text-gray-900">$876</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-sm text-gray-700">Entertainment</span>
              </div>
              <span className="text-sm font-bold text-gray-900">$654</span>
            </div>
          </div>
        </div>

        {/* Spending Trends */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Spending Trends</h2>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold">Weekly</button>
              <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold">Monthly</button>
            </div>
          </div>
          <div id="desktop-line-chart" style={{ height: '280px' }}></div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl p-4 border border-rose-100">
              <div className="flex items-center gap-2 mb-1">
                <i className="fas fa-arrow-up text-rose-600 text-xs"></i>
                <span className="text-xs text-gray-600 font-medium">Highest Day</span>
              </div>
              <div className="text-lg font-bold text-gray-900">$487</div>
              <div className="text-xs text-gray-500">Last Thursday</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center gap-2 mb-1">
                <i className="fas fa-arrow-down text-green-600 text-xs"></i>
                <span className="text-xs text-gray-600 font-medium">Lowest Day</span>
              </div>
              <div className="text-lg font-bold text-gray-900">$124</div>
              <div className="text-xs text-gray-500">Last Sunday</div>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Progress */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Budget Progress</h2>
          <button className="text-sm text-primary font-medium hover:underline">Manage Budgets</button>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <i className="fas fa-utensils text-sm text-primary"></i>
                </div>
                <span className="text-sm font-semibold text-gray-900">Food & Dining</span>
              </div>
              <span className="text-sm font-bold text-gray-900">$1,245 / $1,500</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-teal-500 rounded-full" style={{ width: '83%' }}></div>
            </div>
            <div className="text-xs text-green-600 mt-1 font-semibold">$255 left</div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <i className="fas fa-car text-sm text-blue-600"></i>
                </div>
                <span className="text-sm font-semibold text-gray-900">Transportation</span>
              </div>
              <span className="text-sm font-bold text-gray-900">$987 / $1,000</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{ width: '98%' }}></div>
            </div>
            <div className="text-xs text-amber-600 mt-1 font-semibold">$13 left - Almost at limit!</div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <i className="fas fa-shopping-bag text-sm text-purple-600"></i>
                </div>
                <span className="text-sm font-semibold text-gray-900">Shopping</span>
              </div>
              <span className="text-sm font-bold text-gray-900">$876 / $800</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full" style={{ width: '100%' }}></div>
            </div>
            <div className="text-xs text-rose-600 mt-1 font-semibold">Over budget by $76!</div>
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
              <span className="text-sm font-semibold text-gray-900">Reduce Dining Out</span>
            </div>
            <p className="text-xs text-gray-600">You could save $120/month by cooking at home 2 more times per week.</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <i className="fas fa-sync-alt text-purple-500"></i>
              <span className="text-sm font-semibold text-gray-900">Review Subscriptions</span>
            </div>
            <p className="text-xs text-gray-600">3 subscriptions unused in 30+ days. Cancel to save $45/month.</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <i className="fas fa-piggy-bank text-green-500"></i>
              <span className="text-sm font-semibold text-gray-900">Increase Savings</span>
            </div>
            <p className="text-xs text-gray-600">Set up auto-transfer of $200 to savings on paydays.</p>
          </div>
        </div>
      </div>
    </>
  );
};

const MobileInsight = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const initCharts = () => {
      try {
        if (typeof (window as any).Plotly !== 'undefined') {
          const Plotly = (window as any).Plotly;
          
          const pieData = [{
            values: [1245, 987, 876, 654, 1891],
            labels: ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities'],
            type: 'pie',
            marker: {
              colors: ['#00B875', '#3B82F6', '#A855F7', '#F97316', '#14B8A6']
            },
            textinfo: 'percent',
            textposition: 'inside',
            hovertemplate: '<b>%{label}</b><br>$%{value}<br>%{percent}<extra></extra>'
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

          const lineData = [{
            x: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            y: [187, 234, 198, 487, 312, 398, 124],
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: '#00B875', width: 3, shape: 'spline' },
            marker: { color: '#00B875', size: 8 },
            fill: 'tozeroy',
            fillcolor: 'rgba(0, 184, 117, 0.1)',
            hovertemplate: '<b>%{x}</b><br>$%{y}<extra></extra>'
          }];

          const lineLayout = {
            showlegend: false,
            margin: { t: 10, r: 20, b: 40, l: 50 },
            plot_bgcolor: 'rgba(0,0,0,0)',
            paper_bgcolor: 'rgba(0,0,0,0)',
            xaxis: { showgrid: false, zeroline: false },
            yaxis: { title: 'Amount ($)', showgrid: true, gridcolor: 'rgba(0,0,0,0.05)', zeroline: false },
            font: { family: 'Inter, sans-serif', size: 11 }
          };

          const lineContainer = document.getElementById('line-chart-container');
          if (lineContainer) {
            Plotly.newPlot('line-chart-container', lineData, lineLayout, pieConfig);
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
  }, []);

  return (
    <div className="font-sans bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 overflow-x-hidden min-h-screen">
      <style>{`::-webkit-scrollbar { display: none; }`}</style>

      {/* Status Bar */}
      <div className="fixed top-0 left-0 right-0 h-10 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-between px-4 shadow-sm">
        <div className="text-xs font-semibold text-gray-900">9:41</div>
        <div className="flex items-center gap-1">
          <i className="fas fa-signal text-xs text-gray-900"></i>
          <i className="fas fa-wifi text-xs text-gray-900 ml-1"></i>
          <i className="fas fa-battery-full text-xs text-gray-900 ml-1"></i>
        </div>
      </div>

      {/* Header */}
      <div className="fixed top-10 left-0 right-0 bg-white/80 backdrop-blur-md z-40 shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
            <i className="fas fa-arrow-left text-gray-700"></i>
          </button>
          <h1 className="text-lg font-bold text-gray-900">Insights</h1>
          <button className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
            <i className="fas fa-info-circle text-gray-700"></i>
          </button>
        </div>
      </div>

      <div className="pt-[90px] pb-24 min-h-screen">
        {/* Time Range */}
        <div className="px-4 pb-4">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-1.5 shadow-md border border-gray-100 flex gap-1">
            <button className="flex-1 h-9 rounded-xl bg-gradient-to-r from-primary to-teal-600 text-white text-xs font-semibold shadow-sm">This Month</button>
            <button className="flex-1 h-9 rounded-xl bg-transparent text-gray-600 text-xs font-semibold">Last Month</button>
            <button className="flex-1 h-9 rounded-xl bg-transparent text-gray-600 text-xs font-semibold">3 Months</button>
            <button className="flex-1 h-9 rounded-xl bg-transparent text-gray-600 text-xs font-semibold">Custom</button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="px-4 pb-6">
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <div className="min-w-[280px] bg-gradient-to-br from-primary/10 to-teal-50 rounded-3xl p-5 shadow-lg border border-primary/20">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-2xl bg-white/70 flex items-center justify-center shadow-sm">
                  <i className="fas fa-chart-line text-lg text-primary"></i>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-600 font-medium mb-1">Income vs Expenses</div>
                  <div className="text-2xl font-bold text-gray-900">+$2,847</div>
                </div>
              </div>
            </div>
            <div className="min-w-[200px] bg-white/70 backdrop-blur-sm rounded-3xl p-5 shadow-lg border border-gray-100">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center shadow-sm mb-3">
                <i className="fas fa-piggy-bank text-lg text-green-600"></i>
              </div>
              <div className="text-xs text-gray-600 font-medium mb-1">Net Savings</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">$2,847</div>
              <div className="flex items-center gap-1">
                <i className="fas fa-arrow-up text-xs text-green-600"></i>
                <span className="text-xs text-green-600 font-semibold">12% vs last month</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="px-4 pb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-5 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Expense Distribution</h2>
              <button className="text-xs text-primary font-semibold">View All</button>
            </div>
            <div id="pie-chart-container" style={{ height: '280px' }}></div>
          </div>
        </div>

        {/* Line Chart */}
        <div className="px-4 pb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-5 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Spending Trends</h2>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold">Weekly</button>
                <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold">Monthly</button>
              </div>
            </div>
            <div id="line-chart-container" style={{ height: '240px' }}></div>
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
            <button className="flex flex-col items-center gap-1 p-2">
              <i className="fas fa-chart-pie text-lg text-primary"></i>
              <span className="text-[10px] font-medium text-primary">Insights</span>
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

const Insight = () => {
  return (
    <ResponsiveLayout
      mobileContent={<MobileInsight />}
      variant="app"
      showSidebar={true}
    >
      <InsightContent />
    </ResponsiveLayout>
  );
};

export default Insight;
