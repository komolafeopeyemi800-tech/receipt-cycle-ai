import { FormEvent, useEffect, useState } from "react";
import { useWebAuth } from "@/contexts/WebAuthContext";

type Props = {
  mode: "signin" | "signup";
  /** Called after the code is accepted and the session is stored. */
  onDone: (result: { isNewRegistration: boolean }) => void;
  initialEmail?: string;
};

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-inner outline-none ring-primary/20 focus:border-teal-500 focus:ring-2";

/** Passwordless sign-in: enter your email, then the 6-digit code we send. Creates the account on first use. */
export function EmailCodeForm({ mode, onDone, initialEmail = "" }: Props) {
  const { sendEmailCode, signInWithEmailCode } = useWebAuth();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  async function request(e?: FormEvent) {
    e?.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const { error } = await sendEmailCode(email);
      if (error) {
        setMsg(error.message);
        return;
      }
      setStep("code");
      setCooldown(30);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const { error, isNewRegistration } = await signInWithEmailCode(email, code.trim());
      if (error) {
        setMsg(error.message);
        return;
      }
      onDone({ isNewRegistration: isNewRegistration === true });
    } finally {
      setBusy(false);
    }
  }

  const verb = mode === "signup" ? "Email me a sign-up code" : "Email me a sign-in code";

  if (step === "code") {
    return (
      <form onSubmit={(e) => void verify(e)} className="space-y-4">
        <p className="text-sm text-slate-600">
          We sent a 6-digit code to <strong className="text-slate-900">{email}</strong>. It works for 10 minutes.
        </p>
        <label className="block text-left">
          <span className="text-xs font-semibold text-slate-600">6-digit code</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
            autoFocus
            className={`${inputClass} text-center font-mono text-lg tracking-[0.4em]`}
          />
        </label>
        {msg ? (
          <p className="text-sm text-red-600" role="alert" aria-live="polite">
            {msg}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy || code.length !== 6}
          className="w-full rounded-xl bg-gradient-to-r from-primary to-teal-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
        >
          {busy ? "Checking…" : "Continue"}
        </button>
        <div className="flex items-center justify-between text-xs font-semibold text-primary">
          <button type="button" onClick={() => { setStep("email"); setCode(""); setMsg(null); }} className="hover:underline">
            Use a different email
          </button>
          <button type="button" disabled={busy || cooldown > 0} onClick={() => void request()} className="hover:underline disabled:opacity-50">
            {cooldown > 0 ? `Send again in ${cooldown}s` : "Send a new code"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={(e) => void request(e)} className="space-y-4">
      <label className="block text-left">
        <span className="text-xs font-semibold text-slate-600">Email</span>
        <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
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
        {busy ? "Sending…" : verb}
      </button>
    </form>
  );
}
