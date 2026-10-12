import { CSSProperties, ReactNode, useEffect, useState } from "react";
import { useScreenSize } from "@/hooks/use-screen-size";
import DesktopNav from "@/components/layout/DesktopNav";
import DesktopSidebar from "@/components/layout/DesktopSidebar";

interface ResponsiveLayoutProps {
  children: ReactNode;
  /** @deprecated Unused — app shell is responsive for all viewports. */
  mobileContent?: ReactNode;
  variant?: "app" | "landing" | "auth";
  showSidebar?: boolean;
  promoOffset?: boolean;
}

const ResponsiveLayout = ({ children, variant = "app", showSidebar = true, promoOffset = false }: ResponsiveLayoutProps) => {
  const { isAppShellCompact } = useScreenSize();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isAppShellCompact) setSidebarOpen(false);
  }, [isAppShellCompact]);

  if (variant === "auth") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white font-sans">
        <DesktopNav variant="landing" />
        <main className="flex min-h-screen items-center justify-center px-4 pb-8 pt-16 sm:px-6">
          <div className="mx-auto w-full max-w-md">{children}</div>
        </main>
      </div>
    );
  }

  if (variant === "landing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white font-sans">
        <DesktopNav variant="landing" />
        <main className="min-h-screen px-4 pb-10 pt-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    );
  }

  const drawer = Boolean(showSidebar && isAppShellCompact);

  const shellStyle = {
    "--app-shell-left": showSidebar && !isAppShellCompact ? (sidebarCollapsed ? "5rem" : "16rem") : "0rem",
    "--app-shell-top": promoOffset ? "6.5rem" : "4rem",
  } as CSSProperties;

  return (
    <div className="min-h-screen bg-[#f7f8fa] font-sans" style={shellStyle}>
      <DesktopNav
        variant="app"
        showSidebarTrigger={drawer}
        onSidebarTrigger={() => setSidebarOpen(true)}
        promoOffset={promoOffset}
        sidebarCollapsed={sidebarCollapsed}
        onSidebarCollapse={() => setSidebarCollapsed((value) => !value)}
      />
      {drawer && sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[35] bg-slate-900/40 backdrop-blur-[1px]"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
      {showSidebar ? (
        <DesktopSidebar
          drawerMode={drawer}
          drawerOpen={drawer && sidebarOpen}
          onNavigate={() => setSidebarOpen(false)}
          promoOffset={promoOffset}
          collapsed={!drawer && sidebarCollapsed}
        />
      ) : null}
      <main
        className={`min-h-screen ${promoOffset ? "pt-[104px]" : "pt-16"} ${showSidebar && !isAppShellCompact ? (sidebarCollapsed ? "pl-20" : "pl-64") : ""} transition-[padding] duration-200 ease-out`}
      >
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-5 sm:py-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
};

export default ResponsiveLayout;
