import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AppErrorBoundary, reloadOnce } from "@/components/AppErrorBoundary";

// After a new deploy, an open tab can ask for a page file that no longer exists.
// Reload once to pick up the new version instead of leaving a blank page.
window.addEventListener("vite:preloadError", (event) => {
  // Reloads (at most once per 30 s); otherwise the error reaches the error boundary, which shows a Reload button.
  if (reloadOnce()) event.preventDefault();
});

const app = (
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);

const root = document.getElementById("root")!;
if (root.dataset.prerendered === "true") hydrateRoot(root, app, {
  identifierPrefix: "rc-",
  onRecoverableError(error, info) { console.error("Receipt Cycle hydration error:", error, info.componentStack); },
});
else createRoot(root).render(app);
