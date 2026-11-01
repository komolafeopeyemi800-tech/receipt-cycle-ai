import { useState } from "react";
import { apiClient } from "@/lib/api";

type Step = { name: string; ok: boolean; changed: boolean; detail: string };
type Result = { apply: boolean; ok: boolean; steps: Step[] };

/**
 * Checks, and on request fixes, the Polar billing setup: the webhook events that Pro Lifetime needs (order.paid and
 * order.refunded) and the Pro benefit on the monthly, yearly and lifetime products. It runs on the API with the API's own
 * Polar token, so the token is never shown here.
 */
export default function PolarSetup({ secret }: { secret: string }) {
  const [busy, setBusy] = useState<"check" | "fix" | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(apply: boolean) {
    setBusy(apply ? "fix" : "check");
    setError(null);
    try {
      setResult(await apiClient.request<Result>("POST", "/api/admin/polar/setup", { adminSecret: secret, body: { apply } }));
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "Could not run the check.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5 mb-6" aria-labelledby="polar-setup-title">
      <h3 id="polar-setup-title" className="text-base font-semibold text-gray-900">Polar billing setup</h3>
      <p className="mt-1 text-sm text-gray-600">
        Checks that Polar sends the events Pro Lifetime needs (order.paid and order.refunded) and that the Pro benefit is on the
        monthly, yearly and lifetime products. “Fix what is missing” only adds things. It never deletes or changes your secrets.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void run(false)}
          className="px-4 py-2 text-sm font-semibold border border-gray-300 rounded-lg bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-60"
        >
          {busy === "check" ? "Checking…" : "Check Polar setup"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void run(true)}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {busy === "fix" ? "Fixing…" : "Fix what is missing"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-red-600" role="alert">{error}</p> : null}
      {result ? (
        <div className="mt-4" role="status">
          <p className={`text-sm font-semibold ${result.ok ? "text-emerald-700" : "text-amber-700"}`}>
            {result.ok ? "Everything is set up." : result.apply ? "Some steps still need attention." : "Something is missing. Press “Fix what is missing”."}
          </p>
          <ul className="mt-2 divide-y divide-gray-100 border border-gray-100 rounded-lg">
            {result.steps.map((s) => (
              <li key={s.name} className="p-3 text-sm flex gap-3">
                <span aria-hidden="true" className={s.ok ? "text-emerald-600" : "text-red-600"}>{s.ok ? "✔" : "✖"}</span>
                <span className="min-w-0">
                  <span className="block font-semibold text-gray-900">
                    {s.name}
                    {s.changed ? <span className="ml-2 text-xs font-semibold text-teal-700">changed</span> : null}
                  </span>
                  <span className="block text-gray-600 break-words">{s.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
