import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { formatAuthError } from "@mobile-lib/authErrors";

export default function WebResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const resetPasswordWithToken = useAction(api.authNode.resetPasswordWithToken);
  const token = useMemo(() => params.get("token")?.trim() ?? "", [params]);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (password.length < 6) {
      setMsg("Password must be at least 6 characters.");
      return;
    }
    if (password !== password2) {
      setMsg("Passwords do not match.");
      return;
    }
    if (token.length < 16) {
      setMsg("Invalid or missing reset token. Open the link from your email or paste the token into the URL.");
      return;
    }
    setBusy(true);
    try {
      await resetPasswordWithToken({ token, newPassword: password });
      navigate("/signin", { replace: true, state: { resetOk: true } });
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
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-xl font-bold text-slate-900">Set a new password</h1>
        <p className="mt-2 text-sm text-slate-600">Choose a new password for your account.</p>
        {msg ? (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {msg}
          </p>
        ) : null}
        <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">New password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Confirm password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-primary to-teal-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Update password"}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-slate-600">
          <Link to="/forgot-password" className="font-semibold text-primary hover:underline">
            Request a new link
          </Link>
          {" · "}
          <Link to="/signin" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
