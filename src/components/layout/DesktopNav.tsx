import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useWebAuth } from "@/contexts/WebAuthContext";

interface DesktopNavProps {
  variant?: 'landing' | 'app';
}

const DesktopNav = ({ variant = 'landing' }: DesktopNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const inAdmin = location.pathname.startsWith("/admin");
  const { user, signOut } = useWebAuth();
  
  if (variant === 'app') {
    return (
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md z-50 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate('/dashboard')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shadow-md">
                <i className="fas fa-receipt text-white text-lg"></i>
              </div>
              <span className="text-lg font-bold text-gray-900">Receipt Cycle</span>
            </div>
            
            <nav className="flex items-center gap-1">
              <NavLink 
                to={inAdmin ? "/admin" : "/dashboard"} 
                className={({ isActive }) => 
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <i className="fas fa-home mr-2"></i>Dashboard
              </NavLink>
              <NavLink 
                to={inAdmin ? "/admin" : "/transactions"} 
                className={({ isActive }) => 
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <i className="fas fa-exchange-alt mr-2"></i>Transactions
              </NavLink>
              <NavLink 
                to={inAdmin ? "/admin" : "/insights"} 
                className={({ isActive }) => 
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <i className="fas fa-chart-line mr-2"></i>Analysis
              </NavLink>
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => navigate(inAdmin ? '/admin' : '/transactions#add-transaction')}
              className="h-10 px-4 bg-gradient-to-r from-primary to-teal-600 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <i className="fas fa-plus"></i>
              <span>Add Transaction</span>
            </button>
            <button 
              type="button"
              onClick={() => navigate(inAdmin ? '/admin' : '/settings')}
              className="relative w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              title="Notifications"
              aria-label="Notifications"
            >
              <i className="fas fa-bell text-gray-600"></i>
            </button>
            <button
              type="button"
              onClick={() => navigate(inAdmin ? '/admin' : '/settings')}
              className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-gray-100 bg-gray-50 text-sm font-semibold text-primary hover:border-primary transition-colors"
              title="Settings"
            >
              {user?.name?.trim()?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? (
                <i className="fas fa-user text-gray-500" />
              )}
            </button>
            {user ? (
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  navigate("/signin", { replace: true });
                }}
                className="h-10 px-3 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Sign out
              </button>
            ) : null}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md z-50 border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shadow-md">
            <i className="fas fa-receipt text-white text-lg"></i>
          </div>
          <span className="text-lg font-bold text-gray-900">Receipt Cycle</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">How It Works</a>
          <NavLink to="/pricing" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Pricing</NavLink>
          <a href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Testimonials</a>
        </nav>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/signin')}
            className="h-10 px-5 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={() => navigate('/signup')}
            className="h-10 px-5 bg-gradient-to-r from-primary to-teal-600 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            Get Started Free
          </button>
        </div>
      </div>
    </header>
  );
};

export default DesktopNav;
