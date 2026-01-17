import { ReactNode } from "react";
import { BottomNav } from "@/components/ui/BottomNav";
import { ScanFAB } from "@/components/ui/ScanFAB";

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
  showFAB?: boolean;
}

export function AppLayout({ children, showNav = true, showFAB = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="page-container">
        {children}
      </main>
      {showFAB && <ScanFAB />}
      {showNav && <BottomNav />}
    </div>
  );
}
