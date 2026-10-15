import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AppErrorBoundary, reloadOnce } from "@/components/AppErrorBoundary";

// After a new deploy, an open tab can ask for a page file that no longer exists.
// Reload once to pick up the new version instead of leaving a blank page.
window.addEventListener("vite:preloadError", (event) => {
  // Reloads (at most once per 30 s); otherwise the error reaches the error boundary, which shows a Reload button.
  if (reloadOnce()) event.preventDefault();
});

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);

// Warm the most-visited pages in the background so clicking them is instant.
const warm = () => {
  void import("./pages/Pricing");
  void import("./pages/WebSignUp");
  void import("./pages/WebSignIn");
  void import("./pages/FaqPage");
};
if ("requestIdleCallback" in window) window.requestIdleCallback(warm, { timeout: 4000 });
else setTimeout(warm, 2000);
