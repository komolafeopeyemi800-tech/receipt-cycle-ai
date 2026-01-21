import { NavLink, useNavigate } from "react-router-dom";

const DesktopSidebar = () => {
  const navigate = useNavigate();
  
  const navItems = [
    { path: '/dashboard', icon: 'fa-home', label: 'Dashboard' },
    { path: '/transaction', icon: 'fa-exchange-alt', label: 'Transactions' },
    { path: '/add-transaction', icon: 'fa-plus-circle', label: 'Add Transaction' },
    { path: '/insight', icon: 'fa-chart-line', label: 'Insights' },
    { path: '/notification', icon: 'fa-bell', label: 'Notifications' },
    { path: '/setting', icon: 'fa-cog', label: 'Settings' },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-100 z-40 overflow-y-auto">
      <div className="p-4">
        {/* Quick Stats */}
        <div className="bg-gradient-to-br from-primary/10 to-teal-50 rounded-xl p-4 mb-6">
          <div className="text-xs text-gray-600 font-medium mb-1">This Month's Savings</div>
          <div className="text-2xl font-bold text-gray-900">$1,442</div>
          <div className="flex items-center gap-1 mt-1">
            <i className="fas fa-arrow-up text-xs text-primary"></i>
            <span className="text-xs text-primary font-semibold">12.5% vs last month</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-primary text-white shadow-md shadow-primary/30' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <i className={`fas ${item.icon} w-5 text-center`}></i>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        {/* Upgrade Card */}
        <div className="mt-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <i className="fas fa-crown text-amber-400"></i>
            <span className="text-sm font-semibold">Upgrade to Pro</span>
          </div>
          <p className="text-xs text-gray-400 mb-3">Unlock unlimited scans, AI insights & more</p>
          <button 
            onClick={() => navigate('/pricing')}
            className="w-full h-9 bg-white text-gray-900 text-xs font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            View Plans
          </button>
        </div>
        
        {/* Admin Link (if applicable) */}
        <div className="mt-4">
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <i className="fas fa-user-shield w-5 text-center"></i>
            <span>Admin Panel</span>
          </NavLink>
        </div>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
