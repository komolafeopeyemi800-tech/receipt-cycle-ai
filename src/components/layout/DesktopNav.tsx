import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useWebAuth } from "@/contexts/WebAuthContext";

interface DesktopNavProps {
  variant?: "landing" | "app";
  /** When true, show menu button to open the app sidebar (narrow viewports). */
  showSidebarTrigger?: boolean;
  onSidebarTrigger?: () => void;
}

const DesktopNav = ({ variant = "landing", showSidebarTrigger, onSidebarTrigger }: DesktopNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const inAdmin = location.pathname.startsWith("/admin");
  const { user, signOut } = useWebAuth();
  
  if (variant === 'app') {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-8">
            {showSidebarTrigger ? (
              <button
                type="button"
                onClick={() => onSidebarTrigger?.()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                aria-label="Open menu"
              >
                <i className="fas fa-bars text-lg" />
              </button>
            ) : null}
            <div
              className="flex min-w-0 cursor-pointer items-center gap-2 sm:gap-3"
              onClick={() => navigate("/dashboard")}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shadow-md">
                <i className="fas fa-receipt text-white text-lg"></i>
              </div>
              <span className="truncate text-base font-bold text-gray-900 sm:text-lg">Receipt Cycle</span>
            </div>

            {/* When the drawer is active, all section links live in the sidebar — avoids a crowded top bar. */}
            <nav className={showSidebarTrigger ? "hidden" : "hidden items-center gap-1 md:flex"}>
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
              <NavLink 
                to="/pricing" 
                className={({ isActive }) => 
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <i className="fas fa-tag mr-2"></i>Pricing
              </NavLink>
            </nav>
          </div>
          
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate(inAdmin ? "/admin" : "/transactions#add-transaction")}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-teal-600 px-2.5 text-xs font-semibold text-white shadow-md transition-all hover:shadow-lg sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
            >
              <i className="fas fa-plus" />
              <span className="hidden sm:inline">Add</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(inAdmin ? "/admin" : "/settings")}
              className={`relative hidden h-10 w-10 items-center justify-center rounded-lg bg-gray-100 transition-colors hover:bg-gray-200 sm:flex ${showSidebarTrigger ? "md:hidden xl:flex" : ""}`}
              title="Notifications"
              aria-label="Notifications"
            >
              <i className="fas fa-bell text-gray-600" />
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
                className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold text-slate-600 transition-colors hover:bg-gray-50 hover:text-slate-900 sm:h-10 sm:w-auto sm:px-3"
                title="Sign out"
                aria-label="Sign out"
              >
                <i className="fas fa-right-from-bracket sm:hidden" aria-hidden />
                <span className="hidden sm:inline">Sign out</span>
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
          <a href="/#features" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
            Features
          </a>
          <a href="/#how" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
            How it works
          </a>
          <NavLink to="/pricing" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
            Pricing
          </NavLink>
          <a href="/#reviews" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
            Reviews
          </a>
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
