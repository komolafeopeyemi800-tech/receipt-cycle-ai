import { Home, Receipt, PieChart, Wallet, Settings } from "lucide-react";
import { NavLink as RouterNavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Receipt, label: "Transactions", path: "/transactions" },
  { icon: PieChart, label: "Insights", path: "/insights" },
  { icon: Wallet, label: "Budgets", path: "/budgets" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function BottomNav() {
  return (
    <nav className="nav-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => (
          <RouterNavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex flex-col items-center gap-1 py-2 px-3 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon 
                  className={cn(
                    "w-5 h-5 transition-all",
                    isActive && "scale-110"
                  )} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-[10px] font-medium">{item.label}</span>
              </>
            )}
          </RouterNavLink>
        ))}
      </div>
    </nav>
  );
}
