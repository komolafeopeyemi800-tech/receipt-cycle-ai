import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// After a new deploy, an open tab can ask for a page file that no longer exists.
// Reload once to pick up the new version instead of leaving a blank page.
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  try {
    if (sessionStorage.getItem("rc-reloaded-for-chunk") === "1") return;
    sessionStorage.setItem("rc-reloaded-for-chunk", "1");
  } catch {
    /* storage blocked: still reload once below */
  }
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(<App />);

// Warm the most-visited pages in the background so clicking them is instant.
const warm = () => {
  void import("./pages/Pricing");
  void import("./pages/WebSignUp");
  void import("./pages/WebSignIn");
  void import("./pages/FaqPage");
};
if ("requestIdleCallback" in window) window.requestIdleCallback(warm, { timeout: 4000 });
else setTimeout(warm, 2000);
