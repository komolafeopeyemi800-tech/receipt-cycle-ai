import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Admin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize Plotly charts if available
    const initCharts = () => {
      if (typeof (window as any).Plotly !== 'undefined') {
        try {
          const userGrowthData = [{
            type: 'scatter',
            mode: 'lines',
            x: ['Dec 1', 'Dec 3', 'Dec 5', 'Dec 7', 'Dec 9', 'Dec 11', 'Dec 13', 'Dec 15'],
            y: [8200, 8650, 9100, 9800, 10500, 11200, 11900, 12847],
            line: {
              color: '#00B875',
              width: 3
            },
            fill: 'tozeroy',
            fillcolor: 'rgba(0, 184, 117, 0.1)'
          }];

          const userGrowthLayout = {
            margin: { t: 10, r: 10, b: 40, l: 50 },
            plot_bgcolor: 'rgba(255,255,255,0)',
            paper_bgcolor: 'rgba(255,255,255,0)',
            xaxis: {
              showgrid: false,
              zeroline: false
            },
            yaxis: {
              showgrid: true,
              gridcolor: 'rgba(0,0,0,0.05)',
              zeroline: false
            },
            showlegend: false
          };

          const userGrowthConfig = {
            responsive: true,
            displayModeBar: false,
            displaylogo: false
          };

          (window as any).Plotly.newPlot('user-growth-chart', userGrowthData, userGrowthLayout, userGrowthConfig);

          const revenueData = [{
            type: 'pie',
            labels: ['Weekly', 'Monthly', 'Yearly'],
            values: [2800, 20400, 148500],
            marker: {
              colors: ['#00B875', '#33C78F', '#66D9A9']
            },
            hole: 0.5,
            textinfo: 'label+percent',
            textfont: {
              size: 11
            }
          }];

          const revenueLayout = {
            margin: { t: 10, r: 10, b: 10, l: 10 },
            plot_bgcolor: 'rgba(255,255,255,0)',
            paper_bgcolor: 'rgba(255,255,255,0)',
            showlegend: false
          };

          const revenueConfig = {
            responsive: true,
            displayModeBar: false,
            displaylogo: false
          };

          (window as any).Plotly.newPlot('revenue-chart', revenueData, revenueLayout, revenueConfig);
        } catch(e) {
          console.error('Chart rendering error:', e);
        }
      }
    };

    // Load Plotly script
    const script = document.createElement('script');
    script.src = 'https://cdn.plot.ly/plotly-3.1.1.min.js';
    script.onload = initCharts;
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

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

        <div id="admin-header" className="sticky top-10 bg-white/90 backdrop-blur-md shadow-sm z-40 px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-gray-100/80 flex items-center justify-center active:scale-95 transition-transform">
              <i className="fas fa-arrow-left text-gray-700 text-sm"></i>
            </button>
            <div className="text-center flex-1 px-3">
              <h1 className="text-base font-bold text-gray-900">Admin Panel</h1>
              <p className="text-xs text-gray-500">Developer Console</p>
            </div>
            <button className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/10 to-teal-100 flex items-center justify-center active:scale-95 transition-transform">
              <i className="fas fa-user-shield text-primary text-sm"></i>
            </button>
          </div>
        </div>

        <div id="admin-dashboard-overview" className="px-4 pt-5 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">App Overview</h2>
            <button className="text-xs font-semibold text-primary flex items-center gap-1">
              <span>Refresh</span>
              <i className="fas fa-sync-alt text-xs"></i>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                  <i className="fas fa-users text-blue-600"></i>
                </div>
                <i className="fas fa-arrow-up text-xs text-green-600"></i>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-0.5">12,847</div>
              <div className="text-xs text-gray-600">Total Users</div>
              <div className="text-xs text-green-600 font-medium mt-1">+342 this week</div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                  <i className="fas fa-user-check text-green-600"></i>
                </div>
                <i className="fas fa-arrow-up text-xs text-green-600"></i>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-0.5">8,924</div>
              <div className="text-xs text-gray-600">Active Users</div>
              <div className="text-xs text-green-600 font-medium mt-1">69.4% active</div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                  <i className="fas fa-exchange-alt text-purple-600"></i>
                </div>
                <i className="fas fa-arrow-up text-xs text-green-600"></i>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-0.5">1.2M</div>
              <div className="text-xs text-gray-600">Transactions</div>
              <div className="text-xs text-green-600 font-medium mt-1">+18.2k today</div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
                  <i className="fas fa-dollar-sign text-amber-600"></i>
                </div>
                <i className="fas fa-arrow-up text-xs text-green-600"></i>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-0.5">$48.2K</div>
              <div className="text-xs text-gray-600">Monthly Revenue</div>
              <div className="text-xs text-green-600 font-medium mt-1">+$4.1K vs last</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary/5 to-teal-50/50 rounded-2xl p-4 border border-primary/10 mb-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Subscription Stats</h3>
              <select className="text-xs font-medium text-gray-700 bg-white rounded-lg px-2 py-1 border border-gray-200">
                <option>This Month</option>
                <option>This Week</option>
                <option>This Year</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-gray-900">2,847</div>
                <div className="text-xs text-gray-600">Weekly</div>
                <div className="text-xs text-primary font-medium">$2.8K</div>
              </div>
              <div className="bg-white rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-gray-900">5,124</div>
                <div className="text-xs text-gray-600">Monthly</div>
                <div className="text-xs text-primary font-medium">$20.4K</div>
              </div>
              <div className="bg-white rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-gray-900">3,876</div>
                <div className="text-xs text-gray-600">Yearly</div>
                <div className="text-xs text-primary font-medium">$148.5K</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                  <i className="fas fa-check-circle text-green-600 text-sm"></i>
                </div>
                <div className="text-xs text-gray-600">System Status</div>
              </div>
              <div className="text-base font-bold text-green-600">Operational</div>
              <div className="text-xs text-gray-500 mt-1">99.97% uptime</div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-red-600 text-sm"></i>
                </div>
                <div className="text-xs text-gray-600">Money Leaks</div>
              </div>
              <div className="text-base font-bold text-red-600">142 Flagged</div>
              <div className="text-xs text-gray-500 mt-1">Review needed</div>
            </div>
          </div>
        </div>

        <div id="admin-quick-links" className="px-4 pb-6">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50 active:scale-95 transition-transform">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mb-2 mx-auto">
                <i className="fas fa-users text-blue-600"></i>
              </div>
              <div className="text-sm font-semibold text-gray-900 text-center">Users</div>
            </button>

            <button className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50 active:scale-95 transition-transform">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center mb-2 mx-auto">
                <i className="fas fa-exchange-alt text-purple-600"></i>
              </div>
              <div className="text-sm font-semibold text-gray-900 text-center">Transactions</div>
            </button>

            <button className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50 active:scale-95 transition-transform">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center mb-2 mx-auto">
                <i className="fas fa-cog text-green-600"></i>
              </div>
              <div className="text-sm font-semibold text-gray-900 text-center">Settings</div>
            </button>

            <button className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50 active:scale-95 transition-transform">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center mb-2 mx-auto">
                <i className="fas fa-paint-brush text-orange-600"></i>
              </div>
              <div className="text-sm font-semibold text-gray-900 text-center">Frontend</div>
            </button>
          </div>
        </div>

        <div id="user-management-section" className="px-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">User Management</h2>
            <button className="text-xs font-semibold text-primary">View All</button>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 relative">
                <input type="text" placeholder="Search users..." className="w-full h-10 pl-10 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
              </div>
              <button className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center active:scale-95 transition-transform">
                <i className="fas fa-filter text-gray-600 text-sm"></i>
              </button>
            </div>

            <div className="flex items-center gap-2 mb-3 overflow-x-auto">
              <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium whitespace-nowrap">All Users</button>
              <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium whitespace-nowrap">Active</button>
              <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium whitespace-nowrap">Premium</button>
              <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium whitespace-nowrap">Suspended</button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="flex items-center gap-3 mb-3">
                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg" alt="User" className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">Michael Chen</div>
                  <div className="text-xs text-gray-600">michael.chen@email.com</div>
                </div>
                <button className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center active:scale-95 transition-transform">
                  <i className="fas fa-ellipsis-v text-gray-600 text-sm"></i>
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-medium">Premium</span>
                <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">Admin</span>
                <span className="text-xs text-gray-500">Active 2h ago</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                <button className="flex-1 h-8 rounded-lg bg-primary/10 text-primary text-xs font-semibold active:scale-95 transition-transform">Edit</button>
                <button className="flex-1 h-8 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold active:scale-95 transition-transform">Activity</button>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="flex items-center gap-3 mb-3">
                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg" alt="User" className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">Sarah Mitchell</div>
                  <div className="text-xs text-gray-600">sarah.m@company.com</div>
                </div>
                <button className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center active:scale-95 transition-transform">
                  <i className="fas fa-ellipsis-v text-gray-600 text-sm"></i>
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-medium">Premium</span>
                <span className="px-2 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-medium">Moderator</span>
                <span className="text-xs text-gray-500">Active 15m ago</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                <button className="flex-1 h-8 rounded-lg bg-primary/10 text-primary text-xs font-semibold active:scale-95 transition-transform">Edit</button>
                <button className="flex-1 h-8 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold active:scale-95 transition-transform">Activity</button>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
              <div className="flex items-center gap-3 mb-3">
                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" alt="User" className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">David Rodriguez</div>
                  <div className="text-xs text-gray-600">d.rodriguez@mail.com</div>
                </div>
                <button className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center active:scale-95 transition-transform">
                  <i className="fas fa-ellipsis-v text-gray-600 text-sm"></i>
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">Free</span>
                <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">User</span>
                <span className="text-xs text-gray-500">Active 1d ago</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                <button className="flex-1 h-8 rounded-lg bg-primary/10 text-primary text-xs font-semibold active:scale-95 transition-transform">Edit</button>
                <button className="flex-1 h-8 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold active:scale-95 transition-transform">Activity</button>
              </div>
            </div>
          </div>
        </div>

        <div id="app-settings-section" className="px-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">App Configuration</h2>
            <button className="text-xs font-semibold text-primary">Save All</button>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50 mb-3">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Feature Toggles</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                    <i className="fas fa-brain text-purple-600 text-sm"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">AI Analysis</div>
                    <div className="text-xs text-gray-500">Smart categorization</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                    <i className="fas fa-camera text-blue-600 text-sm"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">OCR Scanning</div>
                    <div className="text-xs text-gray-500">Receipt extraction</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
                    <i className="fas fa-chart-pie text-amber-600 text-sm"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Budgeting</div>
                    <div className="text-xs text-gray-500">Budget tracking</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
                    <i className="fas fa-bell text-red-600 text-sm"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Notifications</div>
                    <div className="text-xs text-gray-500">Push alerts</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                    <i className="fas fa-lightbulb text-green-600 text-sm"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">AI Insights</div>
                    <div className="text-xs text-gray-500">Smart recommendations</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Subscription Management</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Weekly Plan Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input type="text" defaultValue="0.99" className="w-full h-10 pl-8 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Monthly Plan Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input type="text" defaultValue="3.99" className="w-full h-10 pl-8 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Yearly Plan Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input type="text" defaultValue="38.30" className="w-full h-10 pl-8 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Trial Period (Days)</label>
                <input type="number" defaultValue="7" className="w-full h-10 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
          </div>
        </div>

        <div id="frontend-control-section" className="px-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Frontend Editor</h2>
            <button className="text-xs font-semibold text-primary">Preview</button>
          </div>

          <div className="bg-gradient-to-br from-orange-50/50 to-amber-50/50 rounded-2xl p-4 border border-orange-100 mb-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                <i className="fas fa-paint-brush text-orange-600"></i>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900">Content Management</h3>
                <p className="text-xs text-gray-600">Edit screens & layouts</p>
              </div>
            </div>

            <div className="space-y-2">
              <button className="w-full h-10 bg-white rounded-xl text-left px-4 flex items-center justify-between shadow-sm active:scale-95 transition-transform">
                <span className="text-sm font-medium text-gray-900">Welcome Screen</span>
                <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
              </button>

              <button className="w-full h-10 bg-white rounded-xl text-left px-4 flex items-center justify-between shadow-sm active:scale-95 transition-transform">
                <span className="text-sm font-medium text-gray-900">Onboarding Flow</span>
                <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
              </button>

              <button className="w-full h-10 bg-white rounded-xl text-left px-4 flex items-center justify-between shadow-sm active:scale-95 transition-transform">
                <span className="text-sm font-medium text-gray-900">Dashboard Layout</span>
                <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
              </button>

              <button className="w-full h-10 bg-white rounded-xl text-left px-4 flex items-center justify-between shadow-sm active:scale-95 transition-transform">
                <span className="text-sm font-medium text-gray-900">Paywall Screen</span>
                <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
              </button>

              <button className="w-full h-10 bg-white rounded-xl text-left px-4 flex items-center justify-between shadow-sm active:scale-95 transition-transform">
                <span className="text-sm font-medium text-gray-900">Notification Templates</span>
                <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50 active:scale-95 transition-transform">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mb-2 mx-auto">
                <i className="fas fa-plus text-blue-600"></i>
              </div>
              <div className="text-sm font-semibold text-gray-900 text-center">Add Screen</div>
            </button>

            <button className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50 active:scale-95 transition-transform">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center mb-2 mx-auto">
                <i className="fas fa-history text-purple-600"></i>
              </div>
              <div className="text-sm font-semibold text-gray-900 text-center">Version History</div>
            </button>
          </div>
        </div>

        <div id="analytics-section" className="px-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Analytics & Insights</h2>
            <select className="text-xs font-medium text-gray-700 bg-white rounded-lg px-2 py-1 border border-gray-200">
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
              <option>Last 90 Days</option>
            </select>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50 mb-3">
            <h3 className="text-sm font-bold text-gray-900 mb-3">User Growth</h3>
            <div id="user-growth-chart" style={{ height: '220px' }}></div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50 mb-3">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Revenue Breakdown</h3>
            <div id="revenue-chart" style={{ height: '220px' }}></div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Key Metrics</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-700">Conversion Rate</span>
                </div>
                <div className="text-sm font-bold text-gray-900">8.4%</div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-700">Avg Session Time</span>
                </div>
                <div className="text-sm font-bold text-gray-900">12m 34s</div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span className="text-sm text-gray-700">Retention (30d)</span>
                </div>
                <div className="text-sm font-bold text-gray-900">73.2%</div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-sm text-gray-700">Avg Savings/User</span>
                </div>
                <div className="text-sm font-bold text-gray-900">$847</div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-sm text-gray-700">Churn Rate</span>
                </div>
                <div className="text-sm font-bold text-gray-900">2.1%</div>
              </div>
            </div>
          </div>
        </div>

        <div id="system-health-section" className="px-4 pb-24">
          <h2 className="text-lg font-bold text-gray-900 mb-3">System Health</h2>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md shadow-gray-200/40 border border-gray-100/50">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-700">API Server</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">99.97% uptime</span>
                  <span className="text-xs font-bold text-green-600">Healthy</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-700">Database</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">2.3ms avg</span>
                  <span className="text-xs font-bold text-green-600">Healthy</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-700">OCR Service</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">847 jobs/hr</span>
                  <span className="text-xs font-bold text-green-600">Healthy</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-sm text-gray-700">AI Processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">High load</span>
                  <span className="text-xs font-bold text-amber-600">Warning</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-700">Storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">68% used</span>
                  <span className="text-xs font-bold text-green-600">Healthy</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-700">Payment Gateway</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">100% success</span>
                  <span className="text-xs font-bold text-green-600">Healthy</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div id="admin-bottom-nav" className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 z-40">
        <div className="grid grid-cols-5 h-16">
          <button className="flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform">
            <i className="fas fa-chart-line text-primary"></i>
            <span className="text-xs font-medium text-primary">Overview</span>
          </button>

          <button className="flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform">
            <i className="fas fa-users text-gray-400"></i>
            <span className="text-xs font-medium text-gray-500">Users</span>
          </button>

          <button className="flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform">
            <i className="fas fa-cog text-gray-400"></i>
            <span className="text-xs font-medium text-gray-500">Settings</span>
          </button>

          <button className="flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform">
            <i className="fas fa-paint-brush text-gray-400"></i>
            <span className="text-xs font-medium text-gray-500">Frontend</span>
          </button>

          <button className="flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform">
            <i className="fas fa-chart-bar text-gray-400"></i>
            <span className="text-xs font-medium text-gray-500">Analytics</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default Admin;
