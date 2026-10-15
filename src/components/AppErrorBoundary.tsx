import { Component, type ErrorInfo, type ReactNode } from "react";

const CHUNK_ERROR = /dynamically imported module|Importing a module script failed|Loading chunk|Loading CSS chunk|error loading dynamically/i;
const RELOAD_STAMP = "rc-error-reload-at";

/** Reload at most once every 30 seconds, so a real bug can never trap the visitor in a reload loop. */
export function reloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_STAMP) ?? 0);
    if (Date.now() - last < 30_000) return false;
    sessionStorage.setItem(RELOAD_STAMP, String(Date.now()));
  } catch {
    /* storage blocked: still reload once below */
  }
  window.location.reload();
  return true;
}

type State = { error: Error | null };

/**
 * Top-level safety net: any error while rendering shows a short message with a Reload button instead of
 * a blank white page. A page file that disappeared after a new release reloads itself once.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Receipt Cycle render error:", error, info.componentStack);
    if (CHUNK_ERROR.test(String(error?.message ?? error))) reloadOnce();
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div
        role="alert"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 24,
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          background: "#f8fafc",
          color: "#0f172a",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Something went wrong.</h1>
        <p style={{ margin: 0, color: "#475569", maxWidth: 360 }}>
          The page could not be shown. Reloading usually fixes it.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{ marginTop: 8, padding: "10px 22px", borderRadius: 12, border: 0, background: "#0f9488", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
        >
          Reload
        </button>
      </div>
    );
  }
}
