import { Bell, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  userName?: string;
  showSearch?: boolean;
  notificationCount?: number;
}

export function AppHeader({ 
  userName = "there", 
  showSearch = true,
  notificationCount = 0 
}: AppHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <header className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm text-muted-foreground">{getGreeting()}</p>
        <h1 className="text-xl font-display font-bold text-foreground">
          Hey, {userName}! 👋
        </h1>
      </div>
      
      <div className="flex items-center gap-2">
        {showSearch && (
          <button className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
            <Search className="w-5 h-5" />
          </button>
        )}
        <button className="relative w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
