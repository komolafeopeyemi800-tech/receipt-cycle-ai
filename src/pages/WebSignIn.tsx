import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useWebAuth } from "@/contexts/WebAuthContext";
import { getWhopPublicClientId, startWhopOAuthWeb } from "@/lib/whopOAuthPkce";
import { getWebLastEmail } from "@/lib/webSession";

function safeInternalPath(raw: string | null, fallback: string): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}

export default function WebSignIn() {
  const { signIn } = useWebAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeInternalPath(params.get("next"), "/dashboard");

  const [email, setEmail] = useState(() => getWebLastEmail());
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [whopBusy, setWhopBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const whopConfigured = Boolean(getWhopPublicClientId());

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
      navigate(next, { replace: true });
    } finally {
      setBusy(false);
    }
  }

  async function onWhop() {
    setMsg(null);
    setWhopBusy(true);
    try {
      await startWhopOAuthWeb();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not start Whop sign-in");
      setWhopBusy(false);
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-600">Sign in with your email or Whop — same account as the mobile app.</p>
          </div>

          {whopConfigured ? (
            <>
              <button
                type="button"
                disabled={whopBusy}
                onClick={() => void onWhop()}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
              >
                <span className="font-black">W</span>
                {whopBusy ? "Redirecting…" : "Continue with Whop"}
              </button>
              <div className="my-8 flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">or email</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
            </>
          ) : null}

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

          <p className="mt-8 text-center text-sm text-slate-600">
            No account?{" "}
            <Link to={`/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-primary hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
