import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LegalLayout } from "./LegalLayout";

const STORAGE_KEY = "receiptcycle_cookie_consent_v1";

type Consent = {
  necessary: true;
  analytics: boolean;
  version: number;
};

function loadConsent(): Consent {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { necessary: true, analytics: false, version: 1 };
    return { ...JSON.parse(raw), necessary: true as const };
  } catch {
    return { necessary: true, analytics: false, version: 1 };
  }
}

export default function CookieSettings() {
  const [analytics, setAnalytics] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const c = loadConsent();
    setAnalytics(Boolean(c.analytics));
  }, []);

  function save(next: boolean) {
    const v: Consent = { necessary: true, analytics: next, version: 1 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
    setAnalytics(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <LegalLayout title="Cookie Settings">
      <p>
        Choose whether we may use optional analytics cookies on this marketing site. Strictly necessary cookies may still be used for
        security and operation.
      </p>
      <div className="not-prose mt-8 space-y-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="font-semibold text-slate-900">Strictly necessary</p>
            <p className="text-sm text-slate-600">Always on. Required for basic site reliability.</p>
          </div>
          <span className="shrink-0 rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700">On</span>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-900">Analytics &amp; performance</p>
            <p className="text-sm text-slate-600">
              Optional. Helps us understand traffic (only if/when tags are installed on this site).
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
            />
            <span className="text-sm font-medium text-slate-800">Allow</span>
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => save(analytics)}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Save preferences
          </button>
          <button
            type="button"
            onClick={() => save(false)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Reject optional
          </button>
        </div>
        {saved ? <p className="text-sm font-medium text-teal-700">Preferences saved.</p> : null}
      </div>
      <p className="mt-8">
        Learn more in our <Link to="/cookies">Cookie Policy</Link>.
      </p>
    </LegalLayout>
  );
}
