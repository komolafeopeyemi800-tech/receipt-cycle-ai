const DASHBOARD_URL = "https://receiptcycle.com/dashboard";
const SIGNIN_URL = "https://receiptcycle.com/signin";

async function toggleSidebarOnTab(tabId) {
  if (!tabId) return;

  await chrome.scripting.executeScript({
    target: { tabId },
    func: (dashboardUrl, signinUrl) => {
      const SIDEBAR_ID = "receiptcycle-sidebar";
      const STYLE_ID = "receiptcycle-sidebar-style";
      const OVERLAY_ID = "receiptcycle-sidebar-overlay";
      const DEFAULT_WIDTH = 420;
      const MIN_WIDTH = 320;
      const MAX_WIDTH = 680;

      const docEl = document.documentElement;
      const body = document.body;
      if (!docEl || !body) return;

      function restorePageLayout() {
        const prevWidth = docEl.dataset.rcPrevWidth;
        const prevTransition = docEl.dataset.rcPrevTransition;
        const prevOverflow = docEl.dataset.rcPrevOverflowX;

        if (prevWidth !== undefined) docEl.style.width = prevWidth;
        if (prevTransition !== undefined) docEl.style.transition = prevTransition;
        if (prevOverflow !== undefined) docEl.style.overflowX = prevOverflow;

        delete docEl.dataset.rcPrevWidth;
        delete docEl.dataset.rcPrevTransition;
        delete docEl.dataset.rcPrevOverflowX;
      }

      function removeSidebar() {
        document.getElementById(SIDEBAR_ID)?.remove();
        document.getElementById(STYLE_ID)?.remove();
        document.getElementById(OVERLAY_ID)?.remove();
        restorePageLayout();
      }

      const existingSidebar = document.getElementById(SIDEBAR_ID);
      if (existingSidebar) {
        removeSidebar();
        return;
      }

      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
        #${OVERLAY_ID} {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.08);
          backdrop-filter: blur(1.5px);
          z-index: 2147483644;
          pointer-events: none;
        }

        #${SIDEBAR_ID} {
          position: fixed;
          top: 0;
          right: 0;
          width: var(--rc-sidebar-width, ${DEFAULT_WIDTH}px);
          min-width: ${MIN_WIDTH}px;
          max-width: ${MAX_WIDTH}px;
          height: 100vh;
          background: #ffffff;
          border-left: 1px solid rgba(148, 163, 184, 0.35);
          box-shadow: -12px 0 36px rgba(15, 23, 42, 0.18);
          z-index: 2147483646;
          transform: translateX(100%);
          transition: transform 0.28s ease;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        #${SIDEBAR_ID}.open {
          transform: translateX(0);
        }

        #${SIDEBAR_ID} .rc-header {
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 10px 0 12px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.9);
          font-family: Arial, sans-serif;
        }

        #${SIDEBAR_ID} .rc-title {
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
        }

        #${SIDEBAR_ID} .rc-close {
          border: 0;
          background: transparent;
          color: #334155;
          font-size: 20px;
          line-height: 1;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
        }

        #${SIDEBAR_ID} .rc-close:hover {
          background: #f1f5f9;
        }

        #${SIDEBAR_ID} .rc-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 18px 14px;
          font-family: Arial, sans-serif;
          background: linear-gradient(180deg, #f8fafc 0%, #ffffff 42%);
        }

        #${SIDEBAR_ID} .rc-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: #ffffff;
          padding: 12px;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
        }

        #${SIDEBAR_ID} .rc-h2 {
          margin: 0 0 8px;
          font-size: 14px;
          color: #0f172a;
          font-weight: 700;
        }

        #${SIDEBAR_ID} .rc-p {
          margin: 0;
          font-size: 12px;
          line-height: 1.45;
          color: #334155;
        }

        #${SIDEBAR_ID} .rc-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 4px;
        }

        #${SIDEBAR_ID} .rc-btn {
          appearance: none;
          border: 1px solid transparent;
          border-radius: 10px;
          height: 36px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        #${SIDEBAR_ID} .rc-btn-primary {
          color: #fff;
          background: linear-gradient(135deg, #0f766e 0%, #0ea5e9 100%);
        }

        #${SIDEBAR_ID} .rc-btn-secondary {
          color: #0f172a;
          background: #fff;
          border-color: #cbd5e1;
        }

        #${SIDEBAR_ID} .rc-resizer {
          position: absolute;
          top: 0;
          left: 0;
          width: 6px;
          height: 100%;
          cursor: ew-resize;
          background: transparent;
        }
      `;
      document.head.appendChild(style);

      const overlay = document.createElement("div");
      overlay.id = OVERLAY_ID;
      body.appendChild(overlay);

      const sidebar = document.createElement("aside");
      sidebar.id = SIDEBAR_ID;
      sidebar.style.setProperty("--rc-sidebar-width", `${DEFAULT_WIDTH}px`);
      sidebar.innerHTML = `
        <div class="rc-resizer" aria-hidden="true"></div>
        <div class="rc-header">
          <span class="rc-title">Receipt Cycle</span>
          <button class="rc-close" type="button" aria-label="Close sidebar">&times;</button>
        </div>
        <div class="rc-body">
          <div class="rc-card">
            <h2 class="rc-h2">Mini Dashboard</h2>
            <p class="rc-p">Your website may block iframe embedding, so this panel uses an extension-native mini workspace.</p>
          </div>
          <div class="rc-card">
            <h2 class="rc-h2">Quick Actions</h2>
            <div class="rc-actions">
              <button class="rc-btn rc-btn-primary" data-action="open-dashboard" type="button">Open Dashboard</button>
              <button class="rc-btn rc-btn-secondary" data-action="open-signin" type="button">Open Sign In</button>
            </div>
          </div>
        </div>
      `;
      body.appendChild(sidebar);

      docEl.dataset.rcPrevWidth = docEl.style.width || "";
      docEl.dataset.rcPrevTransition = docEl.style.transition || "";
      docEl.dataset.rcPrevOverflowX = docEl.style.overflowX || "";

      docEl.style.transition = "width 0.28s ease";
      docEl.style.width = `calc(100% - ${DEFAULT_WIDTH}px)`;
      docEl.style.overflowX = "hidden";

      requestAnimationFrame(() => sidebar.classList.add("open"));

      const closeBtn = sidebar.querySelector(".rc-close");
      closeBtn?.addEventListener("click", removeSidebar);
      const dashboardBtn = sidebar.querySelector('[data-action="open-dashboard"]');
      const signinBtn = sidebar.querySelector('[data-action="open-signin"]');
      dashboardBtn?.addEventListener("click", () => window.open(dashboardUrl, "_blank", "noopener,noreferrer"));
      signinBtn?.addEventListener("click", () => window.open(signinUrl, "_blank", "noopener,noreferrer"));

      const resizer = sidebar.querySelector(".rc-resizer");
      let isDragging = false;

      const onMove = (event) => {
        if (!isDragging) return;
        const rawWidth = window.innerWidth - event.clientX;
        const nextWidth = Math.min(Math.max(rawWidth, MIN_WIDTH), MAX_WIDTH);
        sidebar.style.setProperty("--rc-sidebar-width", `${nextWidth}px`);
        docEl.style.width = `calc(100% - ${nextWidth}px)`;
      };

      const onUp = () => {
        isDragging = false;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      resizer?.addEventListener("mousedown", (event) => {
        event.preventDefault();
        isDragging = true;
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
      });
    },
    args: [DASHBOARD_URL, SIGNIN_URL],
  });
}

chrome.action.onClicked.addListener(async (tab) => {
  try {
    await toggleSidebarOnTab(tab.id);
  } catch (_error) {
    // Ignore restricted pages (chrome://, edge://) where injection is blocked.
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-sidebar") return;
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.id) return;
  try {
    await toggleSidebarOnTab(activeTab.id);
  } catch (_error) {
    // Ignore restricted pages where script injection is unavailable.
  }
});
