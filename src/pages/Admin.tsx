import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";

const AdminContent = () => {
  useEffect(() => {
    const initCharts = () => {
      if (typeof (window as any).Plotly !== 'undefined') {
        try {
          const userGrowthData = [{
            type: 'scatter',
            mode: 'lines',
            x: ['Dec 1', 'Dec 3', 'Dec 5', 'Dec 7', 'Dec 9', 'Dec 11', 'Dec 13', 'Dec 15'],
            y: [8200, 8650, 9100, 9800, 10500, 11200, 11900, 12847],
            line: { color: '#00B875', width: 3 },
            fill: 'tozeroy',
            fillcolor: 'rgba(0, 184, 117, 0.1)'
          }];

          const userGrowthLayout = {
            margin: { t: 20, r: 20, b: 50, l: 60 },
            plot_bgcolor: 'rgba(255,255,255,0)',
            paper_bgcolor: 'rgba(255,255,255,0)',
            xaxis: { showgrid: false, zeroline: false },
            yaxis: { showgrid: true, gridcolor: 'rgba(0,0,0,0.05)', zeroline: false },
            showlegend: false
          };

          const config = { responsive: true, displayModeBar: false };

          const userGrowthContainer = document.getElementById('desktop-user-growth-chart');
          if (userGrowthContainer) {
            (window as any).Plotly.newPlot('desktop-user-growth-chart', userGrowthData, userGrowthLayout, config);
          }

          const revenueData = [{
            type: 'pie',
            labels: ['Weekly', 'Monthly', 'Yearly'],
            values: [2800, 20400, 148500],
            marker: { colors: ['#00B875', '#33C78F', '#66D9A9'] },
            hole: 0.5,
            textinfo: 'label+percent',
            textfont: { size: 12 }
          }];

          const revenueLayout = {
            margin: { t: 20, r: 20, b: 20, l: 20 },
            plot_bgcolor: 'rgba(255,255,255,0)',
            paper_bgcolor: 'rgba(255,255,255,0)',
            showlegend: false
          };

          const revenueContainer = document.getElementById('desktop-revenue-chart');
          if (revenueContainer) {
            (window as any).Plotly.newPlot('desktop-revenue-chart', revenueData, revenueLayout, config);
          }
        } catch(e) {
          console.error('Chart rendering error:', e);
        }
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-600">Developer Console & Analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 flex items-center gap-2">
            <i className="fas fa-sync-alt"></i>Refresh
          </button>
          <button className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 flex items-center gap-2">
            <i className="fas fa-download"></i>Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
              <i className="fas fa-users text-blue-600 text-lg"></i>
            </div>
            <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
              <i className="fas fa-arrow-up"></i>+2.7%
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">12,847</div>
          <div className="text-sm text-gray-600">Total Users</div>
          <div className="text-xs text-green-600 font-medium mt-1">+342 this week</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
              <i className="fas fa-user-check text-green-600 text-lg"></i>
            </div>
            <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
              <i className="fas fa-arrow-up"></i>+1.2%
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">8,924</div>
          <div className="text-sm text-gray-600">Active Users</div>
          <div className="text-xs text-green-600 font-medium mt-1">69.4% active</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
              <i className="fas fa-exchange-alt text-purple-600 text-lg"></i>
            </div>
            <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
              <i className="fas fa-arrow-up"></i>+5.8%
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">1.2M</div>
          <div className="text-sm text-gray-600">Transactions</div>
          <div className="text-xs text-green-600 font-medium mt-1">+18.2k today</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
              <i className="fas fa-dollar-sign text-amber-600 text-lg"></i>
            </div>
            <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
              <i className="fas fa-arrow-up"></i>+8.5%
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">$48.2K</div>
          <div className="text-sm text-gray-600">Monthly Revenue</div>
          <div className="text-xs text-green-600 font-medium mt-1">+$4.1K vs last month</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">User Growth</h2>
            <select className="text-sm font-medium text-gray-700 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
              <option>Last 15 Days</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
            </select>
          </div>
          <div id="desktop-user-growth-chart" style={{ height: '280px' }}></div>
        </div>

        {/* Revenue Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Revenue by Plan</h2>
            <select className="text-sm font-medium text-gray-700 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
              <option>This Month</option>
              <option>This Quarter</option>
              <option>This Year</option>
            </select>
          </div>
          <div id="desktop-revenue-chart" style={{ height: '280px' }}></div>
        </div>
      </div>

      {/* Subscription Stats */}
      <div className="bg-gradient-to-br from-primary/5 to-teal-50/50 rounded-2xl p-6 border border-primary/10 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Subscription Breakdown</h3>
          <select className="text-sm font-medium text-gray-700 bg-white rounded-lg px-3 py-1.5 border border-gray-200">
            <option>This Month</option>
            <option>This Week</option>
            <option>This Year</option>
          </select>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 text-center shadow-sm">
            <div className="text-3xl font-bold text-gray-900 mb-1">2,847</div>
            <div className="text-sm text-gray-600 mb-2">Weekly Plans</div>
            <div className="text-lg font-bold text-primary">$2.8K</div>
          </div>
          <div className="bg-white rounded-xl p-5 text-center shadow-sm">
            <div className="text-3xl font-bold text-gray-900 mb-1">5,124</div>
            <div className="text-sm text-gray-600 mb-2">Monthly Plans</div>
            <div className="text-lg font-bold text-primary">$20.4K</div>
          </div>
          <div className="bg-white rounded-xl p-5 text-center shadow-sm">
            <div className="text-3xl font-bold text-gray-900 mb-1">3,876</div>
            <div className="text-sm text-gray-600 mb-2">Yearly Plans</div>
            <div className="text-lg font-bold text-primary">$148.5K</div>
          </div>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">User Management</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input type="text" placeholder="Search users..." className="w-64 h-10 pl-10 pr-4 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
            </div>
            <button className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2">
              <i className="fas fa-filter"></i>Filter
            </button>
          </div>
        </div>
        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium">All Users</button>
          <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200">Active</button>
          <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200">Premium</button>
          <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200">Suspended</button>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Active</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg" alt="User" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Michael Chen</div>
                    <div className="text-xs text-gray-500">michael.chen@email.com</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg">Active</span>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-lg">Premium</span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">2 hours ago</td>
              <td className="px-6 py-4 text-center">
                <button className="text-gray-400 hover:text-gray-600"><i className="fas fa-ellipsis-h"></i></button>
              </td>
            </tr>
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg" alt="User" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Sarah Mitchell</div>
                    <div className="text-xs text-gray-500">sarah.m@company.com</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg">Active</span>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-lg">Premium</span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">5 hours ago</td>
              <td className="px-6 py-4 text-center">
                <button className="text-gray-400 hover:text-gray-600"><i className="fas fa-ellipsis-h"></i></button>
              </td>
            </tr>
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" alt="User" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">James Wilson</div>
                    <div className="text-xs text-gray-500">james.w@email.com</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">Inactive</span>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">Free</span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">3 days ago</td>
              <td className="px-6 py-4 text-center">
                <button className="text-gray-400 hover:text-gray-600"><i className="fas fa-ellipsis-h"></i></button>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">Showing 3 of 12,847 users</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200">Previous</button>
            <button className="px-3 py-1.5 bg-primary text-white text-sm rounded-lg">Next</button>
          </div>
        </div>
      </div>
    </>
  );
};

const MobileAdmin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const initCharts = () => {
      if (typeof (window as any).Plotly !== 'undefined') {
        try {
          const userGrowthData = [{
            type: 'scatter',
            mode: 'lines',
            x: ['Dec 1', 'Dec 3', 'Dec 5', 'Dec 7', 'Dec 9', 'Dec 11', 'Dec 13', 'Dec 15'],
            y: [8200, 8650, 9100, 9800, 10500, 11200, 11900, 12847],
            line: { color: '#00B875', width: 3 },
            fill: 'tozeroy',
            fillcolor: 'rgba(0, 184, 117, 0.1)'
          }];

          const userGrowthLayout = {
            margin: { t: 10, r: 10, b: 40, l: 50 },
            plot_bgcolor: 'rgba(255,255,255,0)',
            paper_bgcolor: 'rgba(255,255,255,0)',
            xaxis: { showgrid: false, zeroline: false },
            yaxis: { showgrid: true, gridcolor: 'rgba(0,0,0,0.05)', zeroline: false },
            showlegend: false
          };

          const config = { responsive: true, displayModeBar: false };

          (window as any).Plotly.newPlot('user-growth-chart', userGrowthData, userGrowthLayout, config);

          const revenueData = [{
            type: 'pie',
            labels: ['Weekly', 'Monthly', 'Yearly'],
            values: [2800, 20400, 148500],
            marker: { colors: ['#00B875', '#33C78F', '#66D9A9'] },
            hole: 0.5,
            textinfo: 'label+percent',
            textfont: { size: 11 }
          }];

          const revenueLayout = {
            margin: { t: 10, r: 10, b: 10, l: 10 },
            plot_bgcolor: 'rgba(255,255,255,0)',
            paper_bgcolor: 'rgba(255,255,255,0)',
            showlegend: false
          };

          (window as any).Plotly.newPlot('revenue-chart', revenueData, revenueLayout, config);
        } catch(e) {
          console.error('Chart rendering error:', e);
        }
      }
    };

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
      <div className="fixed top-0 left-0 right-0 h-10 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-between px-4 shadow-sm">
        <div className="text-xs font-semibold text-gray-900">9:41</div>
        <div className="flex items-center gap-1">
          <i className="fas fa-signal text-xs text-gray-900"></i>
          <i className="fas fa-wifi text-xs text-gray-900 ml-1"></i>
          <i className="fas fa-battery-full text-xs text-gray-900 ml-1"></i>
        </div>
      </div>

      <div className="pt-10 min-h-screen flex flex-col pb-20">
        <div className="sticky top-10 bg-white/90 backdrop-blur-md shadow-sm z-40 px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-gray-100/80 flex items-center justify-center">
              <i className="fas fa-arrow-left text-gray-700 text-sm"></i>
            </button>
            <div className="text-center flex-1 px-3">
              <h1 className="text-base font-bold text-gray-900">Admin Panel</h1>
              <p className="text-xs text-gray-500">Developer Console</p>
            </div>
            <button className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/10 to-teal-100 flex items-center justify-center">
              <i className="fas fa-user-shield text-primary text-sm"></i>
            </button>
          </div>
        </div>

        <div className="px-4 pt-5 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">App Overview</h2>
            <button className="text-xs font-semibold text-primary flex items-center gap-1">
              <span>Refresh</span>
              <i className="fas fa-sync-alt text-xs"></i>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md border border-gray-100/50">
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
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md border border-gray-100/50">
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
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md border border-gray-100/50">
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
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-md border border-gray-100/50">
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

const Admin = () => {
  return (
    <ResponsiveLayout
      mobileContent={<MobileAdmin />}
      variant="app"
      showSidebar={true}
    >
      <AdminContent />
    </ResponsiveLayout>
  );
};

export default Admin;
