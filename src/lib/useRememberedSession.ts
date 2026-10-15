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
 * on marketing pages. The page is rendered fresh in the browser (never hydrated), so reading storage on the
 * first render cannot cause a markup mismatch; the server snapshot is only a safe default.
 */
export function useRememberedSession(): boolean {
  return useSyncExternalStore(subscribe, hasRememberedSession, () => false);
}
