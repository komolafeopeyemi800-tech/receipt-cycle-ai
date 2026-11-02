import { useSyncExternalStore } from "react";
import { hasRememberedSession, WEB_SESSION_TOKEN_KEY } from "@/lib/webSession";

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === WEB_SESSION_TOKEN_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener("focus", onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("focus", onChange);
  };
}

/**
 * True when someone signed in on this browser within the last 30 days. Needs no provider, so it also works
 * on marketing pages. The server snapshot keeps the initial public HTML and hydration consistent;
 * React reads the browser's remembered session after hydration.
 */
export function useRememberedSession(): boolean {
  return useSyncExternalStore(subscribe, hasRememberedSession, () => false);
}
