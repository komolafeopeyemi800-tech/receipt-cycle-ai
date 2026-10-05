import { FormEvent, useState } from "react";
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
  const passwordsOn = useQuery(api.admin.publicConfig, {})?.passwordAuthEnabled === true;

  function afterCodeSignIn(isNewRegistration: boolean) {
    const sessionUser = getWebSessionUser();
    if (isNewRegistration && sessionUser) {
      setPendingWebOnboarding(sessionUser.id);
      navigate("/onboarding", { replace: true });
      return;
    }
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
        navigate("/onboarding", { replace: true });
        return;
      }
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
        navigate("/onboarding", { replace: true });
        return;
      }
      navigate(next, { replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="border-b border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-teal-600 text-white shadow-sm">
              <i className="fas fa-receipt text-sm" />
            </span>
            Receipt Cycle
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create account</h1>
            <p className="mt-2 text-sm text-slate-600">Use Google or email — same account on mobile and web.</p>
          </div>

          <GoogleSignInButton mode="signup" className="mt-8" onCredential={onGoogle} onError={(m) => setMsg(m)} />
          {msg && !passwordsOn ? (
            <p className="mt-3 text-sm text-red-600" role="alert" aria-live="polite">
              {msg}
            </p>
          ) : null}
          <div className="my-8 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">or with your email</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <EmailCodeForm mode="signup" initialEmail={email} onDone={(r) => afterCodeSignIn(r.isNewRegistration)} />

          {passwordsOn ? (
          <>
          <div className="my-8 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">or with a password</span>
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

          <p className="mt-8 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link to={`/signin?next=${encodeURIComponent(next)}`} className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
