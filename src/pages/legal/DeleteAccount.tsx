import { useState } from "react";
import { LegalLayout } from "./LegalLayout";
import { SUPPORT_EMAIL } from "@/content/site";
import { apiClient } from "@/lib/api";
import { clearWebSessionToken, clearWebSessionUser, getWebSessionToken } from "@/lib/webSession";

/** Public page Google Play points to for "delete your account and data". Works for signed-in users and explains the email route for everyone else. */
export default function DeleteAccount() {
  const [token] = useState(() => getWebSessionToken());
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!token || confirm.trim().toUpperCase() !== "DELETE") return;
    setBusy(true);
    setError(null);
    try {
      await apiClient.request("DELETE", "/api/me", { token });
      clearWebSessionToken();
      clearWebSessionUser();
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete the account. Please try again or email us.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <LegalLayout title="Delete your Receipt Cycle account" updated="October 16, 2026">
      <p>
        You can permanently delete your Receipt Cycle account and the data stored with it at any time. This page works for
        the website and the Android app, because both use the same account.
      </p>

      <h2>Delete it yourself</h2>
      <ul>
        <li><strong>In the Android app:</strong> open Me, then Security, then Delete account, and confirm.</li>
        <li><strong>On this page:</strong> sign in on this browser, then use the delete box below.</li>
        <li><strong>Cannot sign in?</strong> Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> from the address on the account with the subject "Delete my account". We confirm it is you and delete the account within 30 days.</li>
      </ul>

      <h2>What is deleted</h2>
      <p>
        Your profile and sign-in sessions, transactions, receipts and receipt images, budgets, accounts, categories,
        customers, invoices, estimates, payments, shared invoice links, notification devices and preferences, and your
        profile picture. Copies in protected backups disappear on their normal cycle, within about 30 days.
      </p>

      <h2>What may be kept</h2>
      <p>
        Payment records that our payment provider must keep for tax or legal reasons stay with that provider under its own
        policy. If you have a paid plan, cancel it before deleting so you are not billed again. Deleting the app from your
        phone does not delete your account.
      </p>
      <p>Tip: download your transactions as a spreadsheet first (Backup &amp; Export in the app, or Settings on the website). Deletion cannot be undone.</p>

      <h2>Delete my account now</h2>
      {done ? (
        <p><strong>Your account has been deleted.</strong> Thank you for trying Receipt Cycle.</p>
      ) : token ? (
        <div className="not-prose rounded-xl border border-rose-200 bg-rose-50 p-5">
          <p className="text-sm font-semibold text-rose-900">This permanently deletes the account you are signed in to on this browser.</p>
          <label className="mt-3 block text-sm text-rose-900" htmlFor="confirm-delete">Type DELETE to confirm</label>
          <input id="confirm-delete" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" className="mt-1 h-11 w-full max-w-xs rounded-lg border border-rose-300 bg-white px-3 text-base" />
          {error ? <p className="mt-2 text-sm text-rose-700" role="alert">{error}</p> : null}
          <button type="button" onClick={() => void remove()} disabled={busy || confirm.trim().toUpperCase() !== "DELETE"} className="mt-4 h-11 rounded-lg bg-rose-600 px-5 text-sm font-bold text-white disabled:opacity-50">
            {busy ? "Deleting..." : "Delete my account"}
          </button>
        </div>
      ) : (
        <p><a href="/signin?next=/delete-account">Sign in</a> on this browser to delete your account here, or use one of the other options above.</p>
      )}
    </LegalLayout>
  );
}
