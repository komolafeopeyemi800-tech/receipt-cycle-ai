import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useScreenSize } from "@/hooks/use-screen-size";
import DesktopNav from "@/components/layout/DesktopNav";
import DesktopSidebar from "@/components/layout/DesktopSidebar";

const MobileDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const initCharts = () => {
      try {
        if (typeof (window as any).Plotly !== 'undefined') {
          const Plotly = (window as any).Plotly;
          
          const pieData = [{
            values: [1245, 987, 876, 654, 891],
            labels: ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills'],
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

          const pieContainer = document.getElementById('dashboard-pie-chart');
          if (pieContainer) {
            Plotly.newPlot('dashboard-pie-chart', pieData, pieLayout, pieConfig);
          }

          const barData = [{
            x: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            y: [4200, 3800, 4500, 3200, 4800, 3953],
            type: 'bar',
            marker: {
              color: ['#00B875', '#00B875', '#00B875', '#00B875', '#00B875', '#14B8A6']
            },
            hovertemplate: '<b>%{x}</b><br>$%{y}<extra></extra>'
          }];

          const barLayout = {
            showlegend: false,
            margin: { t: 10, r: 10, b: 30, l: 45 },
            plot_bgcolor: 'rgba(0,0,0,0)',
            paper_bgcolor: 'rgba(0,0,0,0)',
            xaxis: { 
              showgrid: false,
              zeroline: false
            },
            yaxis: { 
              showgrid: true,
              gridcolor: 'rgba(0,0,0,0.05)',
              zeroline: false
            },
            font: { family: 'Inter, sans-serif', size: 10 }
          };

          const barConfig = {
            responsive: true,
            displayModeBar: false,
            displaylogo: false
          };

          const barContainer = document.getElementById('dashboard-bar-chart');
          if (barContainer) {
            Plotly.newPlot('dashboard-bar-chart', barData, barLayout, barConfig);
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00B875] to-teal-600 flex items-center justify-center shadow-md">
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
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-rose-500 to-red-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm">3</span>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Good morning, Alex</h2>
          <p className="text-sm text-gray-600">Here's your financial snapshot for today</p>
        </div>

        <div id="key-metrics-cards" className="px-4 pb-5">
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <div className="min-w-[200px] bg-gradient-to-br from-[#00B875] to-teal-600 rounded-3xl p-5 shadow-xl shadow-[#00B875]/30">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xs text-white/80 font-medium mb-1">Net Income</div>
                  <div className="text-3xl font-bold text-white">$4,287</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <i className="fas fa-wallet text-lg text-white"></i>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 bg-white/20 rounded-lg flex items-center gap-1">
                  <i className="fas fa-arrow-up text-xs text-white"></i>
                  <span className="text-xs font-semibold text-white">12.5%</span>
                </div>
                <span className="text-xs text-white/80">vs last month</span>
              </div>
            </div>

            <div className="min-w-[180px] bg-white/70 backdrop-blur-sm rounded-3xl p-5 shadow-lg border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xs text-gray-500 font-medium mb-1">Total Expenses</div>
                  <div className="text-2xl font-bold text-gray-900">$2,845</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center">
                  <i className="fas fa-credit-card text-lg text-rose-600"></i>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <i className="fas fa-arrow-up text-xs text-rose-600"></i>
                <span className="text-xs text-rose-600 font-semibold">8.3%</span>
                <span className="text-xs text-gray-500">vs last month</span>
              </div>
            </div>

            <div className="min-w-[180px] bg-white/70 backdrop-blur-sm rounded-3xl p-5 shadow-lg border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xs text-gray-500 font-medium mb-1">Savings Rate</div>
                  <div className="text-2xl font-bold text-gray-900">33.6%</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                  <i className="fas fa-piggy-bank text-lg text-blue-600"></i>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <i className="fas fa-check-circle text-xs text-[#00B875]"></i>
                <span className="text-xs text-[#00B875] font-semibold">Above target</span>
              </div>
            </div>
          </div>
        </div>

        <div id="quick-actions" className="px-4 pb-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Quick Actions</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <button 
              onClick={() => navigate('/add-transaction')}
              className="min-w-[120px] bg-gradient-to-br from-[#00B875]/10 to-teal-50 rounded-2xl p-4 shadow-md border border-[#00B875]/20 hover:shadow-lg transition-all active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00B875] to-teal-600 flex items-center justify-center shadow-md mb-3">
                <i className="fas fa-camera text-white"></i>
              </div>
              <div className="text-xs font-semibold text-gray-900">Scan Receipt</div>
              <div className="text-[10px] text-gray-500">AI-powered</div>
            </button>

            <button className="min-w-[120px] bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all active:scale-95">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-sm mb-3">
                <i className="fas fa-file-upload text-blue-600"></i>
              </div>
              <div className="text-xs font-semibold text-gray-900">Upload Statement</div>
              <div className="text-[10px] text-gray-500">CSV, PDF, OFX</div>
            </button>

            <button 
              onClick={() => navigate('/add-transaction')}
              className="min-w-[120px] bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center shadow-sm mb-3">
                <i className="fas fa-plus text-purple-600"></i>
              </div>
              <div className="text-xs font-semibold text-gray-900">Add Manually</div>
              <div className="text-[10px] text-gray-500">Quick entry</div>
            </button>

            <button className="min-w-[120px] bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all active:scale-95">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center shadow-sm mb-3">
                <i className="fas fa-bullseye text-amber-600"></i>
              </div>
              <div className="text-xs font-semibold text-gray-900">Set Budget</div>
              <div className="text-[10px] text-gray-500">New goal</div>
            </button>
          </div>
        </div>

        <div id="spending-overview" className="px-4 pb-5">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-5 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Spending Overview</h3>
              <button 
                onClick={() => navigate('/insight')}
                className="text-xs text-[#00B875] font-semibold hover:underline"
              >
                View All
              </button>
            </div>
            
            <div id="dashboard-pie-chart" style={{ height: '200px' }} className="mb-4"></div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Top Money Leaks</h4>
              
              <div className="flex items-center justify-between bg-gradient-to-r from-rose-50 to-orange-50 rounded-xl p-3 border border-rose-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <i className="fas fa-coffee text-rose-600"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Daily Coffee</div>
                    <div className="text-xs text-gray-500">15 purchases this month</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-rose-600">$87</div>
                  <div className="text-[10px] text-gray-500">/month</div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-3 border border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <i className="fas fa-film text-amber-600"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Streaming Services</div>
                    <div className="text-xs text-gray-500">4 active subscriptions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-amber-600">$52</div>
                  <div className="text-[10px] text-gray-500">/month</div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <i className="fas fa-utensils text-blue-600"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Food Delivery</div>
                    <div className="text-xs text-gray-500">8 orders this month</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-blue-600">$128</div>
                  <div className="text-[10px] text-gray-500">/month</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="spending-trend" className="px-4 pb-5">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-5 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Monthly Trend</h3>
              <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold">6 Months</button>
            </div>
            
            <div id="dashboard-bar-chart" style={{ height: '160px' }}></div>
          </div>
        </div>

        <div id="budgets-goals" className="px-4 pb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Budgets & Goals</h3>
            <button className="text-xs text-[#00B875] font-semibold hover:underline">View All</button>
          </div>
          
          <div className="space-y-3">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00B875]/10 to-teal-100 flex items-center justify-center">
                    <i className="fas fa-utensils text-sm text-[#00B875]"></i>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Food & Dining</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">$845 / $1,000</div>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#00B875] to-teal-500 rounded-full" style={{ width: '84.5%' }}></div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">84.5% used</span>
                <span className="text-xs text-[#00B875] font-semibold">$155 left</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-2xl p-4 shadow-md border border-blue-100/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                    <i className="fas fa-plane text-sm text-blue-600"></i>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">Vacation Fund</span>
                    <div className="text-xs text-gray-500">Target: $5,000</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">$3,250</div>
                </div>
              </div>
              <div className="h-3 bg-white/70 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: '65%' }}></div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">65% complete</span>
                <span className="text-xs text-blue-600 font-semibold">$1,750 to go</span>
              </div>
            </div>
          </div>
        </div>

        <div id="recent-transactions" className="px-4 pb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Recent Transactions</h3>
            <button 
              onClick={() => navigate('/transaction')}
              className="text-xs text-[#00B875] font-semibold hover:underline"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-3">
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

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50 hover:shadow-lg transition-all">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <i className="fas fa-coffee text-lg text-orange-600"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 truncate">Starbucks Coffee</h4>
                      <p className="text-xs text-gray-500">Food & Dining • Coffee</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-rose-600">-$6.45</div>
                      <div className="text-xs text-gray-500">Today, 8:12 AM</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-[10px] font-semibold rounded">Food</span>
                    <div className="flex items-center gap-1">
                      <i className="fas fa-sync text-[8px] text-purple-500"></i>
                      <span className="text-[10px] text-purple-600 font-medium">Recurring</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

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
          </div>
        </div>

        <div id="alerts-reminders" className="px-4 pb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Alerts & Reminders</h3>
            <button className="text-xs text-gray-500 font-medium">Mark all read</button>
          </div>
          
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-4 shadow-md border border-amber-100/50">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <i className="fas fa-calendar-alt text-amber-600"></i>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Rent Due Soon</h4>
                      <p className="text-xs text-gray-500">Due in 3 days • $1,850</p>
                    </div>
                    <button className="text-xs text-amber-600 font-semibold">Pay Now</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-4 shadow-md border border-rose-100/50">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <i className="fas fa-exclamation-triangle text-rose-600"></i>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Shopping Budget Alert</h4>
                      <p className="text-xs text-gray-500">You've used 92% of your budget</p>
                    </div>
                    <button className="text-xs text-rose-600 font-semibold">Review</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

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

        <button 
          id="floating-add-button" 
          onClick={() => navigate('/add-transaction')}
          className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-r from-[#00B875] to-teal-600 rounded-full shadow-xl shadow-[#00B875]/40 flex items-center justify-center hover:scale-110 transition-transform z-30"
        >
          <i className="fas fa-plus text-xl text-white"></i>
        </button>
      </div>

      <div id="bottom-navigation" className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 z-40 pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          <button className="flex flex-col items-center justify-center gap-1 flex-1 bg-[#00B875]/5 rounded-xl py-2">
            <i className="fas fa-home text-lg text-[#00B875]"></i>
            <span className="text-[10px] font-semibold text-[#00B875]">Dashboard</span>
          </button>
          <button 
            onClick={() => navigate('/transaction')}
            className="flex flex-col items-center justify-center gap-1 flex-1 hover:bg-gray-50 rounded-xl transition-colors py-2"
          >
            <i className="fas fa-list text-lg text-gray-400"></i>
            <span className="text-[10px] font-medium text-gray-500">Transactions</span>
          </button>
          <button 
            onClick={() => navigate('/add-transaction')}
            className="flex flex-col items-center justify-center gap-1 flex-1 py-2"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-[#00B875] to-teal-600 rounded-full flex items-center justify-center shadow-lg shadow-[#00B875]/30 -mt-6">
              <i className="fas fa-plus text-lg text-white"></i>
            </div>
          </button>
          <button 
            onClick={() => navigate('/insight')}
            className="flex flex-col items-center justify-center gap-1 flex-1 hover:bg-gray-50 rounded-xl transition-colors py-2"
          >
            <i className="fas fa-chart-line text-lg text-gray-400"></i>
            <span className="text-[10px] font-medium text-gray-500">Insights</span>
          </button>
          <button 
            onClick={() => navigate('/setting')}
            className="flex flex-col items-center justify-center gap-1 flex-1 hover:bg-gray-50 rounded-xl transition-colors py-2"
          >
            <i className="fas fa-cog text-lg text-gray-400"></i>
            <span className="text-[10px] font-medium text-gray-500">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const DesktopDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const initCharts = () => {
      try {
        if (typeof (window as any).Plotly !== 'undefined') {
          const Plotly = (window as any).Plotly;
          
          const pieData = [{
            values: [1245, 987, 876, 654, 891],
            labels: ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills'],
            type: 'pie',
            marker: {
              colors: ['#00B875', '#3B82F6', '#A855F7', '#F97316', '#14B8A6']
            },
            textinfo: 'percent',
            textposition: 'inside',
            hovertemplate: '<b>%{label}</b><br>$%{value}<br>%{percent}<extra></extra>'
          }];

          const pieLayout = {
            showlegend: true,
            legend: { orientation: 'v', x: 1.05, y: 0.5 },
            margin: { t: 20, r: 120, b: 20, l: 20 },
            plot_bgcolor: 'rgba(0,0,0,0)',
            paper_bgcolor: 'rgba(0,0,0,0)',
            font: { family: 'Inter, sans-serif', size: 12 }
          };

          const pieConfig = {
            responsive: true,
            displayModeBar: false,
            displaylogo: false
          };

          const pieContainer = document.getElementById('desktop-pie-chart');
          if (pieContainer) {
            Plotly.newPlot('desktop-pie-chart', pieData, pieLayout, pieConfig);
          }

          const barData = [{
            x: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            y: [4200, 3800, 4500, 3200, 4800, 3953],
            type: 'bar',
            marker: {
              color: '#00B875'
            },
            hovertemplate: '<b>%{x}</b><br>$%{y}<extra></extra>'
          }];

          const barLayout = {
            showlegend: false,
            margin: { t: 20, r: 20, b: 40, l: 60 },
            plot_bgcolor: 'rgba(0,0,0,0)',
            paper_bgcolor: 'rgba(0,0,0,0)',
            xaxis: { 
              showgrid: false,
              zeroline: false
            },
            yaxis: { 
              showgrid: true,
              gridcolor: 'rgba(0,0,0,0.05)',
              zeroline: false,
              tickprefix: '$'
            },
            font: { family: 'Inter, sans-serif', size: 12 }
          };

          const barConfig = {
            responsive: true,
            displayModeBar: false,
            displaylogo: false
          };

          const barContainer = document.getElementById('desktop-bar-chart');
          if (barContainer) {
            Plotly.newPlot('desktop-bar-chart', barData, barLayout, barConfig);
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
    <div className="font-sans bg-gradient-to-br from-gray-50 to-white min-h-screen">
      <DesktopNav variant="app" />
      <DesktopSidebar />
      
      <main className="pl-64 pt-16 min-h-screen">
        <div className="p-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Good morning, Alex</h1>
            <p className="text-gray-600">Here's your financial snapshot for today</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-primary to-teal-600 rounded-2xl p-6 shadow-lg text-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-sm text-white/80 font-medium mb-1">Net Income</div>
                  <div className="text-4xl font-bold">$4,287</div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <i className="fas fa-wallet text-xl text-white"></i>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 bg-white/20 rounded-lg flex items-center gap-1">
                  <i className="fas fa-arrow-up text-xs"></i>
                  <span className="text-sm font-semibold">12.5%</span>
                </div>
                <span className="text-sm text-white/80">vs last month</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-sm text-gray-500 font-medium mb-1">Total Expenses</div>
                  <div className="text-4xl font-bold text-gray-900">$2,845</div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center">
                  <i className="fas fa-credit-card text-xl text-rose-600"></i>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <i className="fas fa-arrow-up text-sm text-rose-600"></i>
                <span className="text-sm text-rose-600 font-semibold">8.3%</span>
                <span className="text-sm text-gray-500">vs last month</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-sm text-gray-500 font-medium mb-1">Savings Rate</div>
                  <div className="text-4xl font-bold text-gray-900">33.6%</div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <i className="fas fa-piggy-bank text-xl text-blue-600"></i>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <i className="fas fa-check-circle text-sm text-primary"></i>
                <span className="text-sm text-primary font-semibold">Above target</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Spending Overview</h3>
                <button 
                  onClick={() => navigate('/insight')}
                  className="text-sm text-primary font-semibold hover:underline"
                >
                  View All
                </button>
              </div>
              <div id="desktop-pie-chart" style={{ height: '280px' }}></div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Monthly Trend</h3>
                <select className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                  <option>6 Months</option>
                  <option>12 Months</option>
                </select>
              </div>
              <div id="desktop-bar-chart" style={{ height: '280px' }}></div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Money Leaks */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Top Money Leaks</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-rose-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      <i className="fas fa-coffee text-rose-600"></i>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Daily Coffee</div>
                      <div className="text-xs text-gray-500">15 purchases</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-rose-600">$87/mo</div>
                </div>

                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      <i className="fas fa-film text-amber-600"></i>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Streaming</div>
                      <div className="text-xs text-gray-500">4 subscriptions</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-amber-600">$52/mo</div>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      <i className="fas fa-utensils text-blue-600"></i>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Food Delivery</div>
                      <div className="text-xs text-gray-500">8 orders</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-blue-600">$128/mo</div>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
                <button 
                  onClick={() => navigate('/transaction')}
                  className="text-sm text-primary font-semibold hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <i className="fas fa-shopping-cart text-blue-600"></i>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">Amazon.com</div>
                    <div className="text-xs text-gray-500">Today, 2:34 PM</div>
                  </div>
                  <div className="text-sm font-bold text-rose-600">-$142.87</div>
                </div>

                <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                    <i className="fas fa-coffee text-orange-600"></i>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">Starbucks</div>
                    <div className="text-xs text-gray-500">Today, 8:12 AM</div>
                  </div>
                  <div className="text-sm font-bold text-rose-600">-$6.45</div>
                </div>

                <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <i className="fas fa-dollar-sign text-primary"></i>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">Salary Deposit</div>
                    <div className="text-xs text-gray-500">Yesterday</div>
                  </div>
                  <div className="text-sm font-bold text-primary">+$4,200</div>
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Alerts & Reminders</h3>
                <button className="text-sm text-gray-500 font-medium hover:text-gray-700">Mark all read</button>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      <i className="fas fa-calendar-alt text-amber-600"></i>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">Rent Due Soon</div>
                      <div className="text-xs text-gray-500">Due in 3 days • $1,850</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      <i className="fas fa-exclamation-triangle text-rose-600"></i>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">Budget Alert</div>
                      <div className="text-xs text-gray-500">92% of shopping budget used</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      <i className="fas fa-chart-line text-blue-600"></i>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">Unusual Spending</div>
                      <div className="text-xs text-gray-500">Dining +35% this month</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const Dashboard = () => {
  const { isMobileOrTablet } = useScreenSize();
  
  return isMobileOrTablet ? <MobileDashboard /> : <DesktopDashboard />;
};

export default Dashboard;
