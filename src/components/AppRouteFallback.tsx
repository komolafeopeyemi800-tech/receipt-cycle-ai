/** Shown only if a lazy route chunk is still loading (web). Intentionally no spinner: just an empty page-colored area. */
export function AppRouteFallback() {
  return <div className="min-h-screen bg-slate-50" aria-hidden />;
}
