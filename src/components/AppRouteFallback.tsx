/** Shown while lazy-loaded app route chunks are loading (web only). */
export function AppRouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
      <div className="text-center">
        <i className="fas fa-circle-notch fa-spin text-2xl text-primary mb-3" />
        <p className="text-sm font-medium">Loading…</p>
      </div>
    </div>
  );
}
