import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useWebAuth } from "@/contexts/WebAuthContext";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { EmailCodeForm } from "@/components/auth/EmailCodeForm";
import { api, useQuery } from "@mobile-lib/api";
import { getWebLastEmail, getWebSessionUser } from "@/lib/webSession";
import { setPendingWebOnboarding } from "@/lib/webOnboarding";

function safeInternalPath(raw: string | null, fallback: string): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}

export default function WebSignUp() {
  const { signUp, signInWithGoogle } = useWebAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeInternalPath(params.get("next"), "/dashboard");

  const [name, setName] = useState("");
  const [email, setEmail] = useState(() => getWebLastEmail());
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const config = useQuery(api.admin.publicConfig, {});
  const passwordsOn = config?.passwordAuthEnabled === true;
  const emailCodesOn = config?.emailCodesEnabled !== false; // shown while loading; hidden only when the server says no

  function afterCodeSignIn(isNewRegistration: boolean) {
    const sessionUser = getWebSessionUser();
    if (isNewRegistration && sessionUser) {
      setPendingWebOnboarding(sessionUser.id);
      toast.success("Welcome to Receipt Cycle");
      navigate("/onboarding", { replace: true });
      return;
    }
    toast.success("Welcome to Receipt Cycle");
    navigate(next, { replace: true });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const { error, isNewRegistration } = await signUp(email, password, name || undefined);
      if (error) {
        setMsg(error.message);
        return;
      }
      const sessionUser = getWebSessionUser();
      if (isNewRegistration && sessionUser) {
        setPendingWebOnboarding(sessionUser.id);
        toast.success("Welcome to Receipt Cycle");
        navigate("/onboarding", { replace: true });
        return;
      }
      toast.success("Welcome to Receipt Cycle");
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
      if (isNewRegistration && sessionUser) {
        setPendingWebOnboarding(sessionUser.id);
        toast.success("Welcome to Receipt Cycle");
        navigate("/onboarding", { replace: true });
        return;
      }
      toast.success("Welcome to Receipt Cycle");
      navigate(next, { replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Free to start. Use Google or your email, it takes under a minute.">
          <GoogleSignInButton mode="signup" className="" onCredential={onGoogle} onError={(m) => setMsg(m)} />
          {msg && !passwordsOn ? (
            <p className="mt-3 text-sm text-red-600" role="alert" aria-live="polite">
              {msg}
            </p>
          ) : null}
          {emailCodesOn ? (
          <>
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">or with your email</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <EmailCodeForm mode="signup" initialEmail={email} onDone={(r) => afterCodeSignIn(r.isNewRegistration)} />
          </>
          ) : passwordsOn ? null : (
            <p className="mt-6 rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-600">
              Email sign-in is not available yet. Please continue with Google.
            </p>
          )}

          {passwordsOn ? (
          <>
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">or with email and password</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
            <label className="block text-left">
              <span className="text-xs font-semibold text-slate-600">Name (optional)</span>
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-inner outline-none focus:border-teal-500 focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="block text-left">
              <span className="text-xs font-semibold text-slate-600">Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-inner outline-none focus:border-teal-500 focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="block text-left">
              <span className="text-xs font-semibold text-slate-600">Password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-inner outline-none focus:border-teal-500 focus:ring-2 focus:ring-primary/20"
              />
            </label>
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
              {busy ? "Creating…" : "Create account"}
            </button>
          </form>
          </>
          ) : null}

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link to={`/signin?next=${encodeURIComponent(next)}`} className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
    </AuthLayout>
  );
}
