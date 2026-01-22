import { ReactNode } from "react";
import { useScreenSize } from "@/hooks/use-screen-size";
import DesktopNav from "@/components/layout/DesktopNav";
import DesktopSidebar from "@/components/layout/DesktopSidebar";

interface ResponsiveLayoutProps {
  children: ReactNode;
  mobileContent: ReactNode;
  variant?: 'app' | 'landing' | 'auth';
  showSidebar?: boolean;
}

const ResponsiveLayout = ({ 
  children, 
  mobileContent, 
  variant = 'app',
  showSidebar = true 
}: ResponsiveLayoutProps) => {
  const { isMobileOrTablet } = useScreenSize();

  if (isMobileOrTablet) {
    return <>{mobileContent}</>;
  }

  // Desktop layout
  if (variant === 'auth') {
    return (
      <div className="font-sans bg-gradient-to-br from-gray-50 to-white min-h-screen">
        <DesktopNav variant="landing" />
        <main className="pt-16 min-h-screen flex items-center justify-center">
          <div className="w-full max-w-md mx-auto p-8">
            {children}
          </div>
        </main>
      </div>
    );
  }

  if (variant === 'landing') {
    return (
      <div className="font-sans bg-gradient-to-br from-gray-50 to-white min-h-screen">
        <DesktopNav variant="landing" />
        <main className="pt-16 min-h-screen">
          <div className="p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="font-sans bg-gradient-to-br from-gray-50 to-white min-h-screen">
      <DesktopNav variant="app" />
      {showSidebar && <DesktopSidebar />}
      <main className={`${showSidebar ? 'pl-64' : ''} pt-16 min-h-screen`}>
        <div className="p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
};

export default ResponsiveLayout;
