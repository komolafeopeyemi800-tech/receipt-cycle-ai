import { useEffect } from "react";

const ALLOWED_SCREENS = new Set(["Records", "Analysis", "Budgets", "Accounts", "Categories"]);

function parseTargetScreen(params: URLSearchParams): string {
  const raw = (params.get("screen") ?? "").trim();
  return ALLOWED_SCREENS.has(raw) ? raw : "Records";
}

function isMobileUserAgent(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  return /android|iphone|ipad|ipod/.test(ua);
}

export default function CheckoutReturn() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const screen = parseTargetScreen(params);
    const status = (params.get("status") ?? "").trim().toLowerCase();
    const whopFlag = params.get("whop_checkout") === "1" ? "&whop_checkout=1" : "";
    const fallback = `/dashboard?screen=${encodeURIComponent(screen)}${whopFlag}${status ? `&status=${encodeURIComponent(status)}` : ""}`;

    if (status && status !== "success") {
      window.location.replace(fallback);
      return;
    }

    if (!isMobileUserAgent()) {
      window.location.replace(fallback);
      return;
    }

    const deepLink = `receiptcycle://post-checkout?screen=${encodeURIComponent(screen)}`;
    const timeoutId = window.setTimeout(() => {
      window.location.replace(fallback);
    }, 1500);

    window.location.href = deepLink;
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Receipt Cycle</p>
        <h1 className="mt-2 text-xl font-bold">Finishing checkout...</h1>
        <p className="mt-2 text-sm text-slate-600">Returning you to the app or dashboard now.</p>
      </div>
    </div>
  );
}
