import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useWebAuth } from "@/contexts/WebAuthContext";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { api, useQuery } from "@mobile-lib/api";
import { getWebLastEmail, getWebSessionUser, hasRememberedSession } from "@/lib/webSession";
import { needsWebOnboarding } from "@/lib/webOnboarding";

function safeInternalPath(raw: string | null, fallback: string): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}

export default function WebSignIn() {
  const { signIn, signInWithGoogle } = useWebAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeInternalPath(params.get("next"), "/dashboard");
  // Signed in within the last 30 days on this browser: go straight to the dashboard (decided once, on arrival).
  const [alreadySignedIn] = useState(() => hasRememberedSession());

  const [email, setEmail] = useState(() => getWebLastEmail());
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const config = useQuery(api.admin.publicConfig, {});
  const passwordsOn = config?.passwordAuthEnabled === true;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        setMsg(error.message);
        return;
      }
      const sessionUser = getWebSessionUser();
      if (sessionUser && needsWebOnboarding(sessionUser.id)) {
        toast.success("Signed in successfully");
        navigate("/onboarding", { replace: true });
        return;
      }
      toast.success("Signed in successfully");
      navigate(next, { replace: true });
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle(idToken: string) {
    setMsg(null);
    setBusy(true);
    try {
      const { error, isNewRegistration } = await signInWithGoogle(idToken);
      if (error) {
        setMsg(error.message);
        return;
      }
      const sessionUser = getWebSessionUser();
      if (sessionUser && (isNewRegistration || needsWebOnboarding(sessionUser.id))) {
        toast.success("Signed in successfully");
        navigate("/onboarding", { replace: true });
        return;
      }
      toast.success("Signed in successfully");
      navigate(next, { replace: true });
    } finally {
      setBusy(false);
    }
  }

  if (alreadySignedIn) return <Navigate to={next} replace />;

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to pick up where you left off. Same account on the web and mobile app.">
          <GoogleSignInButton mode="signin" className="" onCredential={onGoogle} onError={(m) => setMsg(m)} />
          {msg && !passwordsOn ? (
            <p className="mt-3 text-sm text-red-600" role="alert" aria-live="polite">
              {msg}
            </p>
          ) : null}
          {!passwordsOn ? (
            <p className="mt-6 rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-600">
              Email and password sign-in is temporarily unavailable. Please continue with Google.
            </p>
          ) : null}

          {passwordsOn ? (
          <>
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">or with email and password</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
            <label className="block text-left">
              <span className="text-xs font-semibold text-slate-600">Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-inner outline-none ring-primary/20 focus:border-teal-500 focus:ring-2"
              />
            </label>
            <label className="block text-left">
              <span className="text-xs font-semibold text-slate-600">Password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-inner outline-none ring-primary/20 focus:border-teal-500 focus:ring-2"
              />
            </label>
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            {msg ? (
              <p className="text-sm text-red-600" role="alert" aria-live="polite">
                {msg}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-gradient-to-r from-primary to-teal-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
          </>
          ) : null}

          <p className="mt-6 text-center text-sm text-slate-600">
            No account?{" "}
            <Link to={`/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-primary hover:underline">
              Create one
            </Link>
          </p>
    </AuthLayout>
  );
}
