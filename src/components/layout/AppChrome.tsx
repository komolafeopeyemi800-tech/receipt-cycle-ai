import { ReactNode, useEffect, useState } from "react";
import { useConvexConnectionState } from "convex/react";
import { Link, useLocation } from "react-router-dom";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";
import { useWebAuth } from "@/contexts/WebAuthContext";

type AppChromeProps = {
  children: ReactNode;
};

export function AppChrome({ children }: AppChromeProps) {
  const { user, loading, clearLocalSession } = useWebAuth();
  const conn = useConvexConnectionState();
  const [showStuckHint, setShowStuckHint] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      setShowStuckHint(false);
      return;
    }
    const id = window.setTimeout(() => setShowStuckHint(true), 5_000);
    return () => window.clearTimeout(id);
  }, [loading]);
  const returnTo = `${location.pathname}${location.search}`;
  const signInHref =
    returnTo && returnTo !== "/signin" && returnTo !== "/signup"
      ? `/signin?next=${encodeURIComponent(returnTo)}`
      : "/signin";

  const connLabel = conn.isWebSocketConnected
    ? "Connected"
    : conn.hasEverConnected
      ? "Reconnecting…"
      : conn.connectionRetries > 0
        ? "Can’t reach the server — check your connection"
        : "Connecting…";

  const inner =
    loading ? (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        <div className="max-w-sm px-4 text-center">
          <i className="fas fa-circle-notch fa-spin text-2xl text-primary mb-3" />
          <p className="text-sm font-medium">Loading your workspace…</p>
          <p className="mt-2 text-xs text-slate-500">{connLabel}</p>
          <p className="mt-2 text-xs text-slate-400">
            If loading takes unusually long, check your network or try refreshing the page.
          </p>
          {showStuckHint ? (
            <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left">
              <p className="text-xs text-slate-600">
                Still stuck? You can sign out locally and try signing in again. Your session also clears automatically
                if the server doesn’t respond.
              </p>
              <button
                type="button"
                onClick={() => clearLocalSession()}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100"
              >
                Clear local session
              </button>
            </div>
          ) : null}
        </div>
      </div>
    ) : !user ? (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <i className="fas fa-lock text-xl" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Sign in to open your dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">
          Use the same email and password as the mobile app to view your records and balances on the web.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            to={signInHref}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md"
          >
            Sign in
          </Link>
          <Link
            to={`/signup?next=${encodeURIComponent(returnTo)}`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
          >
            Create account
          </Link>
        </div>
        <Link to="/" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
          ← Back to home
        </Link>
      </div>
    ) : (
      children
    );

  return (
    <ResponsiveLayout variant="app" showSidebar={true} mobileContent={inner}>
      {inner}
    </ResponsiveLayout>
  );
}
