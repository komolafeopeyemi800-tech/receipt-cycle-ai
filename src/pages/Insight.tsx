import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Insight = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize charts after component mounts
    const initCharts = () => {
      try {
        // Check if Plotly is available
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

          const pieConfig = {
            responsive: true,
            displayModeBar: false,
            displaylogo: false
          };

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
            xaxis: { 
              title: '',
              showgrid: false,
              zeroline: false
            },
            yaxis: { 
              title: 'Amount ($)',
              showgrid: true,
              gridcolor: 'rgba(0,0,0,0.05)',
              zeroline: false
            },
            font: { family: 'Inter, sans-serif', size: 11 }
          };

          const lineConfig = {
            responsive: true,
            displayModeBar: false,
            displaylogo: false
          };

          const lineContainer = document.getElementById('line-chart-container');
          if (lineContainer) {
            Plotly.newPlot('line-chart-container', lineData, lineLayout, lineConfig);
          }
        }
      } catch(e) {
        console.error('Chart rendering error:', e);
        const pieContainer = document.getElementById('pie-chart-container');
        const lineContainer = document.getElementById('line-chart-container');
        if (pieContainer) {
          pieContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6B7280;font-size:14px;">Chart unavailable</div>';
        }
        if (lineContainer) {
          lineContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6B7280;font-size:14px;">Chart unavailable</div>';
        }
      }
    };

    // Load Plotly script if not already loaded
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
      <style>{`
        ::-webkit-scrollbar { display: none; }
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

      {/* Header */}
      <div id="header" className="fixed top-10 left-0 right-0 bg-white/80 backdrop-blur-md z-40 shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <i className="fas fa-arrow-left text-gray-700"></i>
          </button>
          <h1 className="text-lg font-bold text-gray-900">Insights</h1>
          <button className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <i className="fas fa-info-circle text-gray-700"></i>
          </button>
        </div>
      </div>

      {/* Root Container */}
      <div id="root-container" className="pt-[90px] pb-24 min-h-screen">

        {/* Time Range Selector */}
        <div id="time-range-selector" className="px-4 pb-4">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-1.5 shadow-md border border-gray-100 flex gap-1">
            <button className="flex-1 h-9 rounded-xl bg-gradient-to-r from-[#00B875] to-teal-600 text-white text-xs font-semibold shadow-sm">This Month</button>
            <button className="flex-1 h-9 rounded-xl bg-transparent text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors">Last Month</button>
            <button className="flex-1 h-9 rounded-xl bg-transparent text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors">3 Months</button>
            <button className="flex-1 h-9 rounded-xl bg-transparent text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors">Custom</button>
          </div>
        </div>

        {/* Key Metrics Snapshot */}
        <div id="key-metrics-snapshot" className="px-4 pb-6">
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            
            <div className="min-w-[280px] bg-gradient-to-br from-[#00B875]/10 to-teal-50 rounded-3xl p-5 shadow-lg border border-[#00B875]/20">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-2xl bg-white/70 backdrop-blur-sm flex items-center justify-center shadow-sm">
                  <i className="fas fa-chart-line text-lg text-[#00B875]"></i>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-600 font-medium mb-1">Income vs Expenses</div>
                  <div className="text-2xl font-bold text-gray-900">+$2,847</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 font-medium">Income</span>
                  <span className="text-gray-900 font-semibold">$8,500</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 font-medium">Expenses</span>
                  <span className="text-gray-900 font-semibold">$5,653</span>
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

            <div className="min-w-[200px] bg-white/70 backdrop-blur-sm rounded-3xl p-5 shadow-lg border border-gray-100">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-sm mb-3">
                <i className="fas fa-percentage text-lg text-blue-600"></i>
              </div>
              <div className="text-xs text-gray-600 font-medium mb-1">Savings Rate</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">33.5%</div>
              <div className="flex items-center gap-1">
                <i className="fas fa-check-circle text-xs text-[#00B875]"></i>
                <span className="text-xs text-[#00B875] font-semibold">Above target</span>
              </div>
            </div>

            <div className="min-w-[200px] bg-gradient-to-br from-rose-50 to-orange-50 rounded-3xl p-5 shadow-lg border border-rose-100">
              <div className="w-11 h-11 rounded-2xl bg-white/70 backdrop-blur-sm flex items-center justify-center shadow-sm mb-3">
                <i className="fas fa-exclamation-triangle text-lg text-rose-600"></i>
              </div>
              <div className="text-xs text-gray-600 font-medium mb-1">Top Money Leaks</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">$342</div>
              <div className="text-xs text-gray-600 font-medium">7 subscriptions found</div>
            </div>

          </div>
        </div>

        {/* Spending Distribution Section */}
        <div id="spending-distribution-section" className="px-4 pb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-5 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Expense Distribution</h2>
              <button className="text-xs text-[#00B875] font-semibold hover:underline">View All</button>
            </div>
            
            <div id="pie-chart-container" style={{ height: '280px' }} className="mb-4"></div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#00B875]"></div>
                  <span className="text-sm text-gray-700 font-medium">Food & Dining</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">$1,245</div>
                  <div className="text-xs text-gray-500">22%</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-700 font-medium">Transportation</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">$987</div>
                  <div className="text-xs text-gray-500">17.5%</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm text-gray-700 font-medium">Shopping</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">$876</div>
                  <div className="text-xs text-gray-500">15.5%</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm text-gray-700 font-medium">Entertainment</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">$654</div>
                  <div className="text-xs text-gray-500">11.6%</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                  <span className="text-sm text-gray-700 font-medium">Bills & Utilities</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">$1,891</div>
                  <div className="text-xs text-gray-500">33.4%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Spending Trend Section */}
        <div id="spending-trend-section" className="px-4 pb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-5 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Spending Trends</h2>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-lg bg-[#00B875]/10 text-[#00B875] text-xs font-semibold">Weekly</button>
                <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold">Monthly</button>
              </div>
            </div>
            
            <div id="line-chart-container" style={{ height: '240px' }} className="mb-3"></div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-2xl p-3 border border-rose-100">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fas fa-arrow-up text-rose-600 text-xs"></i>
                  <span className="text-xs text-gray-600 font-medium">Highest Day</span>
                </div>
                <div className="text-lg font-bold text-gray-900">$487</div>
                <div className="text-xs text-gray-500">Last Thursday</div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-3 border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fas fa-arrow-down text-green-600 text-xs"></i>
                  <span className="text-xs text-gray-600 font-medium">Lowest Day</span>
                </div>
                <div className="text-lg font-bold text-gray-900">$124</div>
                <div className="text-xs text-gray-500">Last Sunday</div>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Progress Section */}
        <div id="budget-progress-section" className="px-4 pb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-5 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Budget Progress</h2>
              <button className="text-xs text-[#00B875] font-semibold hover:underline">Manage</button>
            </div>

            <div className="space-y-4">
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00B875]/10 to-teal-100 flex items-center justify-center">
                      <i className="fas fa-utensils text-sm text-[#00B875]"></i>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Food & Dining</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">$1,245 / $1,500</div>
                    <div className="text-xs text-green-600 font-semibold">$255 left</div>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#00B875] to-teal-500 rounded-full" style={{ width: '83%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                      <i className="fas fa-car text-sm text-blue-600"></i>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Transportation</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">$987 / $1,000</div>
                    <div className="text-xs text-green-600 font-semibold">$13 left</div>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{ width: '98.7%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center">
                      <i className="fas fa-shopping-bag text-sm text-rose-600"></i>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Shopping</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-rose-600">$876 / $800</div>
                    <div className="text-xs text-rose-600 font-semibold">$76 over</div>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                      <i className="fas fa-film text-sm text-purple-600"></i>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Entertainment</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">$654 / $900</div>
                    <div className="text-xs text-green-600 font-semibold">$246 left</div>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full" style={{ width: '72.7%' }}></div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* AI Recommendations Section */}
        <div id="ai-recommendations-section" className="px-4 pb-6">
          <div className="bg-gradient-to-br from-[#00B875]/5 to-teal-50/50 rounded-3xl p-5 shadow-lg border border-[#00B875]/10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00B875] to-teal-600 flex items-center justify-center shadow-md">
                <i className="fas fa-robot text-white text-lg"></i>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">AI Action Plan</h2>
                <p className="text-xs text-gray-600">Personalized savings recommendations</p>
              </div>
            </div>

            <div className="space-y-3">
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-lg bg-[#00B875]/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-[#00B875]">1</span>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900">Cancel Duplicate Subscriptions</h3>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed mb-2">You have 3 streaming services with overlapping content. Consider keeping only 1-2.</p>
                    <div className="flex items-center gap-2">
                      <i className="fas fa-piggy-bank text-[#00B875] text-xs"></i>
                      <span className="text-xs font-bold text-[#00B875]">Save $47/month</span>
                    </div>
                  </div>
                  <button className="ml-2 w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0">
                    <i className="fas fa-chevron-down text-gray-600 text-xs"></i>
                  </button>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 h-9 rounded-xl bg-gradient-to-r from-[#00B875] to-teal-600 text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all">
                    Apply Now
                  </button>
                  <button className="px-4 h-9 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors">
                    Mark Done
                  </button>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">2</span>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900">Switch to Annual Plans</h3>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed mb-2">4 monthly subscriptions offer 20-30% discount on annual plans. Switch to save.</p>
                    <div className="flex items-center gap-2">
                      <i className="fas fa-piggy-bank text-blue-600 text-xs"></i>
                      <span className="text-xs font-bold text-blue-600">Save $124/year</span>
                    </div>
                  </div>
                  <button className="ml-2 w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0">
                    <i className="fas fa-chevron-down text-gray-600 text-xs"></i>
                  </button>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 h-9 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all">
                    View Plans
                  </button>
                  <button className="px-4 h-9 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors">
                    Ignore
                  </button>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center">
                        <span className="text-xs font-bold text-purple-600">3</span>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900">Reduce Dining Out</h3>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed mb-2">You spent 22% more on dining this month. Try meal prep 2-3 times per week.</p>
                    <div className="flex items-center gap-2">
                      <i className="fas fa-piggy-bank text-purple-600 text-xs"></i>
                      <span className="text-xs font-bold text-purple-600">Save $280/month</span>
                    </div>
                  </div>
                  <button className="ml-2 w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0">
                    <i className="fas fa-chevron-down text-gray-600 text-xs"></i>
                  </button>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 h-9 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all">
                    Set Reminder
                  </button>
                  <button className="px-4 h-9 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors">
                    Not Now
                  </button>
                </div>
              </div>

            </div>

            <div className="mt-4 bg-white/50 rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-gray-900 mb-0.5">Total Potential Savings</div>
                  <div className="text-xs text-gray-600">If you apply all recommendations</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#00B875]">$451</div>
                  <div className="text-xs text-gray-600">/month</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Money Leaks Section */}
        <div id="money-leaks-section" className="px-4 pb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-5 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-50 to-orange-50 flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-rose-600"></i>
                </div>
                <h2 className="text-base font-bold text-gray-900">Money Leaks</h2>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 text-xs font-bold">7 Found</div>
            </div>

            <div className="space-y-3">
              
              <div className="bg-gradient-to-br from-rose-50/50 to-orange-50/50 rounded-2xl p-4 border border-rose-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <i className="fas fa-tv text-rose-600 text-sm"></i>
                      <h3 className="text-sm font-bold text-gray-900">Netflix Premium</h3>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">Recurring monthly charge • Unused for 3 months</p>
                    <div className="flex items-center gap-2">
                      <div className="text-base font-bold text-rose-700">$19.99</div>
                      <span className="text-xs text-gray-500">/month</span>
                    </div>
                  </div>
                  <button className="ml-2 w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                    <i className="fas fa-chevron-right text-gray-600 text-xs"></i>
                  </button>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 h-8 rounded-lg bg-rose-600 text-white text-xs font-semibold">View Transactions</button>
                  <button className="px-3 h-8 rounded-lg bg-white text-gray-700 text-xs font-semibold">Mark Reviewed</button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-rose-50/50 to-orange-50/50 rounded-2xl p-4 border border-rose-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <i className="fas fa-credit-card text-rose-600 text-sm"></i>
                      <h3 className="text-sm font-bold text-gray-900">Bank Transfer Fees</h3>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">Multiple small transfer charges • 8 transactions</p>
                    <div className="flex items-center gap-2">
                      <div className="text-base font-bold text-rose-700">$47.20</div>
                      <span className="text-xs text-gray-500">/month avg</span>
                    </div>
                  </div>
                  <button className="ml-2 w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                    <i className="fas fa-chevron-right text-gray-600 text-xs"></i>
                  </button>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 h-8 rounded-lg bg-rose-600 text-white text-xs font-semibold">View Transactions</button>
                  <button className="px-3 h-8 rounded-lg bg-white text-gray-700 text-xs font-semibold">Ignore</button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-rose-50/50 to-orange-50/50 rounded-2xl p-4 border border-rose-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <i className="fas fa-dumbbell text-rose-600 text-sm"></i>
                      <h3 className="text-sm font-bold text-gray-900">Gym Membership</h3>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">Last visit was 2 months ago • Consider canceling</p>
                    <div className="flex items-center gap-2">
                      <div className="text-base font-bold text-rose-700">$89.00</div>
                      <span className="text-xs text-gray-500">/month</span>
                    </div>
                  </div>
                  <button className="ml-2 w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                    <i className="fas fa-chevron-right text-gray-600 text-xs"></i>
                  </button>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 h-8 rounded-lg bg-rose-600 text-white text-xs font-semibold">View Details</button>
                  <button className="px-3 h-8 rounded-lg bg-white text-gray-700 text-xs font-semibold">Keep</button>
                </div>
              </div>

              <button className="w-full h-10 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                <span>View All Money Leaks</span>
                <i className="fas fa-arrow-right text-xs"></i>
              </button>

            </div>
          </div>
        </div>

        {/* Goal Tracking Section */}
        <div id="goal-tracking-section" className="px-4 pb-6">
          <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-3xl p-5 shadow-lg border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Savings Goals</h2>
              <button className="text-xs text-[#00B875] font-semibold hover:underline">Manage Goals</button>
            </div>

            <div className="space-y-4">
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#00B875]/10 to-teal-100 flex items-center justify-center">
                      <i className="fas fa-plane text-[#00B875] text-lg"></i>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Summer Vacation</h3>
                      <p className="text-xs text-gray-600">Target: Dec 2024</p>
                    </div>
                  </div>
                  <div className="relative w-14 h-14">
                    <svg className="transform -rotate-90" width="56" height="56">
                      <circle cx="28" cy="28" r="24" stroke="#e5e7eb" strokeWidth="4" fill="none"/>
                      <circle cx="28" cy="28" r="24" stroke="#00B875" strokeWidth="4" fill="none" strokeDasharray="150.8" strokeDashoffset="45.24" strokeLinecap="round"/>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-[#00B875]">70%</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-gray-600 font-medium">Progress</span>
                  <span className="text-gray-900 font-bold">$3,500 / $5,000</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#00B875] to-teal-500 rounded-full" style={{ width: '70%' }}></div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                      <i className="fas fa-laptop text-blue-600 text-lg"></i>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">New Laptop</h3>
                      <p className="text-xs text-gray-600">Target: Mar 2025</p>
                    </div>
                  </div>
                  <div className="relative w-14 h-14">
                    <svg className="transform -rotate-90" width="56" height="56">
                      <circle cx="28" cy="28" r="24" stroke="#e5e7eb" strokeWidth="4" fill="none"/>
                      <circle cx="28" cy="28" r="24" stroke="#3B82F6" strokeWidth="4" fill="none" strokeDasharray="150.8" strokeDashoffset="105.56" strokeLinecap="round"/>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">30%</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-gray-600 font-medium">Progress</span>
                  <span className="text-gray-900 font-bold">$450 / $1,500</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>

              <button className="w-full h-10 rounded-xl bg-gradient-to-r from-[#00B875] to-teal-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                <i className="fas fa-plus text-xs"></i>
                <span>Add New Goal</span>
              </button>

            </div>
          </div>
        </div>

        {/* Insights Summary Section */}
        <div id="insights-summary-section" className="px-4 pb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-5 shadow-lg border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
                <i className="fas fa-lightbulb text-amber-600 text-lg"></i>
              </div>
              <h2 className="text-base font-bold text-gray-900">Quick Insights</h2>
            </div>

            <div className="space-y-3">
              
              <div className="flex items-start gap-3 p-3 bg-gradient-to-br from-green-50/50 to-emerald-50/50 rounded-xl border border-green-100">
                <i className="fas fa-check-circle text-green-600 text-base flex-shrink-0 mt-0.5"></i>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Great Progress!</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">You're 12% ahead of your savings target this month. Keep it up!</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-xl border border-blue-100">
                <i className="fas fa-info-circle text-blue-600 text-base flex-shrink-0 mt-0.5"></i>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Spending Pattern</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">You spend most on weekends. Consider setting daily limits for better control.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-xl border border-purple-100">
                <i className="fas fa-star text-purple-600 text-base flex-shrink-0 mt-0.5"></i>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Best Category</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">Entertainment spending down 18% from last month. Excellent work!</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Export Reports Section */}
        <div id="export-reports-section" className="px-4 pb-6">
          <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-3xl p-5 shadow-lg border border-indigo-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                <i className="fas fa-file-export text-white text-lg"></i>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Export Reports</h2>
                <p className="text-xs text-gray-600">Download tax-ready reports</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              
              <button className="h-20 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-all">
                <i className="fas fa-file-pdf text-rose-600 text-xl"></i>
                <span className="text-xs font-semibold text-gray-900">PDF Report</span>
              </button>

              <button className="h-20 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-all">
                <i className="fas fa-file-excel text-green-600 text-xl"></i>
                <span className="text-xs font-semibold text-gray-900">Excel Export</span>
              </button>

              <button className="h-20 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-all">
                <i className="fas fa-file-csv text-blue-600 text-xl"></i>
                <span className="text-xs font-semibold text-gray-900">CSV Export</span>
              </button>

              <button className="h-20 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-all">
                <i className="fas fa-share-alt text-purple-600 text-xl"></i>
                <span className="text-xs font-semibold text-gray-900">Share Report</span>
              </button>

            </div>
          </div>
        </div>

        {/* Comparison Period Section */}
        <div id="comparison-period-section" className="px-4 pb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-5 shadow-lg border border-gray-100">
            <h2 className="text-base font-bold text-gray-900 mb-4">Month Comparison</h2>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-4 border border-gray-200">
                <div className="text-xs text-gray-600 font-medium mb-2">Last Month</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Income</span>
                    <span className="text-sm font-bold text-gray-900">$8,200</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Expenses</span>
                    <span className="text-sm font-bold text-gray-900">$5,965</span>
                  </div>
                  <div className="h-px bg-gray-200"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 font-semibold">Savings</span>
                    <span className="text-sm font-bold text-gray-900">$2,235</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#00B875]/5 to-teal-50/50 rounded-2xl p-4 border border-[#00B875]/20">
                <div className="text-xs text-[#00B875] font-semibold mb-2">This Month</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Income</span>
                    <span className="text-sm font-bold text-gray-900">$8,500</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Expenses</span>
                    <span className="text-sm font-bold text-gray-900">$5,653</span>
                  </div>
                  <div className="h-px bg-[#00B875]/20"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 font-semibold">Savings</span>
                    <span className="text-sm font-bold text-[#00B875]">$2,847</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="bg-gradient-to-br from-green-50/50 to-emerald-50/50 rounded-2xl p-4 border border-green-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="fas fa-arrow-up text-green-600 text-sm"></i>
                  <span className="text-sm font-semibold text-gray-900">Improvement</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">+$612</div>
                  <div className="text-xs text-gray-600">27% better</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Deep Dive Section */}
        <div id="category-deep-dive-section" className="px-4 pb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-5 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Category Insights</h2>
              <button className="text-xs text-[#00B875] font-semibold hover:underline">View All</button>
            </div>

            <div className="space-y-3">
              
              <div className="bg-gradient-to-br from-[#00B875]/5 to-teal-50/30 rounded-2xl p-4 border border-[#00B875]/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                      <i className="fas fa-utensils text-[#00B875] text-lg"></i>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Food & Dining</h3>
                      <p className="text-xs text-gray-600">45 transactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-gray-900">$1,245</div>
                    <div className="flex items-center gap-1 justify-end">
                      <i className="fas fa-arrow-up text-xs text-rose-600"></i>
                      <span className="text-xs text-rose-600 font-semibold">8%</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/70 rounded-lg p-2">
                    <div className="text-xs text-gray-600 mb-0.5">Avg/Day</div>
                    <div className="text-sm font-bold text-gray-900">$41</div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-2">
                    <div className="text-xs text-gray-600 mb-0.5">Top Vendor</div>
                    <div className="text-sm font-bold text-gray-900">Starbucks</div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-2">
                    <div className="text-xs text-gray-600 mb-0.5">Peak Day</div>
                    <div className="text-sm font-bold text-gray-900">Saturday</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50/30 to-indigo-50/30 rounded-2xl p-4 border border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                      <i className="fas fa-car text-blue-600 text-lg"></i>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Transportation</h3>
                      <p className="text-xs text-gray-600">28 transactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-gray-900">$987</div>
                    <div className="flex items-center gap-1 justify-end">
                      <i className="fas fa-arrow-down text-xs text-green-600"></i>
                      <span className="text-xs text-green-600 font-semibold">5%</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/70 rounded-lg p-2">
                    <div className="text-xs text-gray-600 mb-0.5">Avg/Day</div>
                    <div className="text-sm font-bold text-gray-900">$33</div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-2">
                    <div className="text-xs text-gray-600 mb-0.5">Top Vendor</div>
                    <div className="text-sm font-bold text-gray-900">Uber</div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-2">
                    <div className="text-xs text-gray-600 mb-0.5">Peak Day</div>
                    <div className="text-sm font-bold text-gray-900">Friday</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Bottom Navigation */}
      <div id="bottom-navigation" className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 z-40">
        <div className="flex items-center justify-around h-20 px-4">
          
          <button 
            onClick={() => navigate('/')}
            className="flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-[#00B875] transition-colors"
          >
            <i className="fas fa-home text-xl"></i>
            <span className="text-[10px] font-semibold">Dashboard</span>
          </button>

          <button 
            onClick={() => navigate('/transaction')}
            className="flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-[#00B875] transition-colors"
          >
            <i className="fas fa-receipt text-xl"></i>
            <span className="text-[10px] font-semibold">Transactions</span>
          </button>

          <button 
            onClick={() => navigate('/add-transaction')}
            className="relative -mt-6"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00B875] to-teal-600 shadow-lg shadow-[#00B875]/30 flex items-center justify-center">
              <i className="fas fa-plus text-white text-2xl"></i>
            </div>
          </button>

          <button className="flex flex-col items-center justify-center gap-1 text-[#00B875] transition-colors">
            <i className="fas fa-chart-pie text-xl"></i>
            <span className="text-[10px] font-semibold">Insights</span>
          </button>

          <button className="flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-[#00B875] transition-colors">
            <i className="fas fa-cog text-xl"></i>
            <span className="text-[10px] font-semibold">Settings</span>
          </button>

        </div>
      </div>

    </div>
  );
};

export default Insight;
