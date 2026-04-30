(function bootstrapGoogleLauncher() {
  const ROOT_ID = "receiptcycle-extension-root";
  const DASHBOARD_URL = "https://receiptcycle.com/dashboard";

  function isGoogleSearchPage() {
    return window.location.hostname === "www.google.com" && window.location.pathname === "/search";
  }

  function removeExisting() {
    document.getElementById(ROOT_ID)?.remove();
  }

  function openDashboard() {
    const w = window.open(DASHBOARD_URL, "_blank", "noopener,noreferrer");
    if (!w) window.location.assign(DASHBOARD_URL);
  }

  function inject() {
    removeExisting();
    if (!isGoogleSearchPage()) return;

    const root = document.createElement("div");
    root.id = ROOT_ID;
    root.className = "receiptcycle-root";
    root.innerHTML = `
      <button type="button" class="receiptcycle-toolbar__button" aria-label="Open Receipt Cycle">
        RC
      </button>
    `;
    root.querySelector("button")?.addEventListener("click", openDashboard);
    document.body.appendChild(root);
  }

  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href === lastUrl) return;
    lastUrl = window.location.href;
    inject();
  });

  inject();
  observer.observe(document.documentElement, { subtree: true, childList: true });
})();
