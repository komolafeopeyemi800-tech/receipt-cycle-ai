import { useState, useEffect } from "react";

/** Sidebar drawer + compact top bar below this width (Tailwind `xl` ≈ 1280px). */
const APP_SHELL_COMPACT_PX = 1280;

export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop">("mobile");
  const [appShellCompact, setAppShellCompact] = useState(false);

  useEffect(() => {
    const updateSize = () => {
      const w = window.innerWidth;
      setAppShellCompact(w < APP_SHELL_COMPACT_PX);
      // Marketing / paywall breakpoints.
      if (w >= 900) {
        setScreenSize("desktop");
      } else if (w >= 768) {
        setScreenSize("tablet");
      } else {
        setScreenSize("mobile");
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return {
    screenSize,
    isMobile: screenSize === "mobile",
    isTablet: screenSize === "tablet",
    isDesktop: screenSize === "desktop",
    isMobileOrTablet: screenSize === "mobile" || screenSize === "tablet",
    /** Below 1280px — drawer sidebar + menu trigger for web app chrome. */
    isAppShellCompact: appShellCompact,
  };
};
