import { useEffect, useRef, useState } from "react";

type GoogleCredentialResponse = { credential?: string };
type GoogleId = {
  initialize: (config: { client_id: string; callback: (r: GoogleCredentialResponse) => void }) => void;
  renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
};
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

const GIS_SRC = "https://accounts.google.com/gsi/client";
let gisLoading: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  gisLoading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gisLoading = null;
      reject(new Error("Could not load Google sign-in. Check your connection and try again."));
    };
    document.head.appendChild(script);
  });
  return gisLoading;
}

type GoogleSignInButtonProps = {
  mode: "signin" | "signup";
  /** Called with the Google ID token; the server verifies it. */
  onCredential: (idToken: string) => void | Promise<void>;
  onError?: (message: string) => void;
  className?: string;
};

/** Google's own button (Google Identity Services). Needs VITE_GOOGLE_WEB_CLIENT_ID. */
export function GoogleSignInButton({ mode, onCredential, onError, className = "" }: GoogleSignInButtonProps) {
  const clientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as string | undefined;
  const holder = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const callbacks = useRef({ onCredential, onError });
  callbacks.current = { onCredential, onError };

  useEffect(() => {
    if (!clientId || !holder.current) return;
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !holder.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (r) => {
            if (r.credential) void callbacks.current.onCredential(r.credential);
            else callbacks.current.onError?.("Google did not return a sign-in token. Please try again.");
          },
        });
        window.google.accounts.id.renderButton(holder.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: mode === "signup" ? "signup_with" : "continue_with",
          width: Math.min(holder.current.clientWidth || 340, 400),
        });
      })
      .catch((e: unknown) => {
        setFailed(true);
        callbacks.current.onError?.(e instanceof Error ? e.message : "Could not load Google sign-in.");
      });
    return () => {
      cancelled = true;
    };
  }, [clientId, mode]);

  if (!clientId) {
    return (
      <button
        type="button"
        onClick={() =>
          onError?.("Google sign-in is not set up yet. Add VITE_GOOGLE_WEB_CLIENT_ID to the web build configuration.")
        }
        className={`flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white py-3.5 text-sm font-semibold text-slate-700 ${className}`}
      >
        <i className="fab fa-google" aria-hidden />
        {mode === "signup" ? "Sign up with Google" : "Continue with Google"}
      </button>
    );
  }

  return (
    <div className={`flex w-full justify-center ${className}`}>
      <div ref={holder} className="w-full" aria-busy={!failed} />
    </div>
  );
}
