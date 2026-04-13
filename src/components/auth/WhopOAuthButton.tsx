import { useState } from "react";
import { getWhopPublicClientId, startWhopOAuthWeb } from "@/lib/whopOAuthPkce";

type WhopOAuthButtonProps = {
  /** Sign-in copy vs sign-up copy (Whop OAuth is the same flow for both). */
  mode: "signin" | "signup";
  className?: string;
  /** Called when redirect fails (e.g. missing env in dev). */
  onError?: (message: string) => void;
};

/**
 * Whop-branded OAuth button (coral / bolt). Renders even when OAuth is not configured so the UI is never empty in dev.
 */
export function WhopOAuthButton({ mode, className = "", onError }: WhopOAuthButtonProps) {
  const [busy, setBusy] = useState(false);
  const configured = Boolean(getWhopPublicClientId());
  const label =
    mode === "signup"
      ? busy
        ? "Redirecting…"
        : "Sign up with Whop"
      : busy
        ? "Redirecting…"
        : "Continue with Whop";

  async function handleClick() {
    if (!configured) {
      onError?.(
        "Whop client id is missing in the web build. Add VITE_WHOP_OAUTH_CLIENT_ID (or VITE_WHOP_CLIENT_ID, or WHOP_CLIENT_ID / WHOP_OAUTH_CLIENT_ID) to repo-root `.env` / `.env.local`, restart `npm run dev`. On Netlify: Site settings → Environment variables → redeploy.",
      );
      return;
    }
    setBusy(true);
    try {
      await startWhopOAuthWeb();
    } catch (e) {
      setBusy(false);
      onError?.(e instanceof Error ? e.message : "Could not start Whop");
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleClick()}
        title={!configured ? "Set VITE_WHOP_OAUTH_CLIENT_ID (or WHOP_CLIENT_ID in .env) and restart dev" : undefined}
        className={[
          "flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white shadow-md transition",
          "bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600",
          "disabled:cursor-not-allowed disabled:opacity-60",
          !configured ? "ring-2 ring-dashed ring-orange-300/80" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <i className="fas fa-bolt text-base" aria-hidden />
        {label}
      </button>
    </div>
  );
}
