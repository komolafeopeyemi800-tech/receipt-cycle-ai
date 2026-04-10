import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { formatAuthError } from "@mobile-lib/authErrors";

export default function WebForgotPassword() {
  const requestPasswordReset = useAction(api.authNode.requestPasswordReset);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const res = await requestPasswordReset({ email: email.trim() });
      if (!res.emailSent) {
        setMsg(
          "If that address is registered, you’ll get an email shortly. (Password reset is not fully configured on the server if no email arrives.)",
        );
      } else {
        setMsg(null);
      }
      setDone(true);
    } catch (err) {
      setMsg(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-teal-600 text-white">
              <i className="fas fa-receipt text-sm" />
            </span>
            Receipt Cycle
          </Link>
        </div>
      </header>
      <main className="mx-auto flex max-w-md flex-1 flex-col px-4 py-12">
        <h1 className="text-xl font-bold text-slate-900">Forgot password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your account email. We’ll send a link to reset your password (web and mobile).
        </p>
        {done && !msg ? (
          <p className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            Check your inbox for the reset message. You can also use the token from the email on the reset page.
          </p>
        ) : null}
        {msg ? (
          <p className="mt-4 text-sm text-amber-800" role="alert">
            {msg}
          </p>
        ) : null}
        <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-primary to-teal-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-slate-600">
          <Link to="/signin" className="font-semibold text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
