import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Link, useNavigate } from "react-router-dom";
import { useWebAuth } from "@/contexts/WebAuthContext";
import { useSubscriptionState } from "@/hooks/use-subscription-state";
import { useWebPreferences } from "@/contexts/WebPreferencesContext";
import { AppChrome } from "@/components/layout/AppChrome";
import {
  CURRENCY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  VOICE_INPUT_LANGUAGE_OPTIONS,
  type DateFormatId,
  type SavedLocation,
} from "@mobile-lib/preferences";

const primary = "#0f766e";

function csvValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
  const raw = String(v)
    .replace(/\r\n/g, " ")
    .replace(/[\r\n\t]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  const needsQuotes = raw.includes(",") || raw.includes('"');
  const escaped = raw.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function ConvexSettingsInner() {
  const { user, signOut } = useWebAuth();
  const navigate = useNavigate();
  const runtime = useQuery(api.admin.publicConfig, {});
  const sub = useSubscriptionState();
  const backupRows = useQuery(
    api.transactions.exportForBackup,
    user?.id && sub?.canExportCsv ? { userId: user.id } : "skip",
  );

  const {
    currency,
    setCurrency,
    dateFormat,
    setDateFormat,
    voiceInputLanguage,
    setVoiceInputLanguage,
    merchants,
    setMerchants,
    locations,
    setLocations,
    reimbursements,
    setReimbursements,
    txnNumber,
    setTxnNumber,
    scanPayment,
    setScanPayment,
    requirePay,
    setRequirePay,
    requireNotes,
    setRequireNotes,
  } = useWebPreferences();

  const [merchantInput, setMerchantInput] = useState("");
  const [locLabel, setLocLabel] = useState("");
  const [locAddress, setLocAddress] = useState("");

  function exportCsvDownload() {
    if (runtime?.exportEnabled === false) {
      window.alert("Export is currently disabled by admin.");
      return;
    }
    if (sub && !sub.canExportCsv) {
      window.alert("CSV export is included with Pro. Open Pricing to upgrade and download all your transactions.");
      return;
    }
    if (!user?.id) {
      window.alert("Sign in again to export your records.");
      return;
    }
    if (backupRows === undefined) {
      window.alert("Still loading your transactions. Try again in a moment.");
      return;
    }
    if (backupRows.length === 0) {
      window.alert("No transactions to export yet.");
      return;
    }
    const header = ["date", "type", "category", "amount", "merchant", "description", "payment_method", "workspace"].join(",");
    const body = backupRows
      .map((t) =>
        [
          csvValue(t.date),
          csvValue(t.type),
          csvValue(t.category),
          csvValue(t.amount),
          csvValue(t.merchant),
          csvValue(t.description),
          csvValue(t.payment_method),
          csvValue(t.workspace),
        ].join(","),
      )
      .join("\r\n");
    const csv = `\uFEFF${header}\r\n${body}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `receipt-cycle-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function addMerchant() {
    const n = merchantInput.trim();
    if (n.length < 2) {
      window.alert("Enter at least 2 characters.");
      return;
    }
    if (merchants.includes(n)) {
      window.alert("Already in the list.");
      return;
    }
    void setMerchants([...merchants, n]);
    setMerchantInput("");
  }

  function removeMerchant(name: string) {
    if (!window.confirm(`Remove "${name}"?`)) return;
    void setMerchants(merchants.filter((m) => m !== name));
  }

  function addLocation() {
    const label = locLabel.trim();
    const address = locAddress.trim();
    if (label.length < 2 || address.length < 4) {
      window.alert("Enter a label (2+ chars) and full address (4+ chars).");
      return;
    }
    const row: SavedLocation = {
      id: `loc_${Date.now()}`,
      label,
      address,
    };
    void setLocations([...locations, row]);
    setLocLabel("");
    setLocAddress("");
  }

  function removeLocation(id: string) {
    void setLocations(locations.filter((l) => l.id !== id));
  }

  const adminLock = runtime?.adminManagedPreferences;

  return (
    <div className="min-h-full bg-gradient-to-b from-white via-[#f0fdf9] to-[#f0fdfa] pb-16">
      <div className="border-b border-slate-200 bg-white px-4 py-4">
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          These settings match the mobile app and sync to your account when you&apos;re signed in.
        </p>
      </div>

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        {user && (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold text-white"
              style={{ backgroundColor: primary }}
            >
              {(user.email ?? "?").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{user.email}</p>
              <p className="text-xs text-slate-500">Signed in</p>
            </div>
          </div>
        )}

        <section>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Profile</p>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <Link
              to="/pricing"
              className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 text-sm hover:bg-slate-50"
            >
              <i className="fas fa-crown w-5 text-center text-amber-500" />
              <div className="flex-1">
                <p className="font-semibold text-slate-900">Upgrade to Premium</p>
                <p className="text-xs text-slate-500">View plans</p>
              </div>
              <i className="fas fa-chevron-right text-slate-400" />
            </Link>
            <div className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600">
              <i className="fas fa-user-lock w-5 text-center" />
              <div className="flex-1">
                <p className="font-semibold text-slate-900">Account security</p>
                <p className="text-xs text-slate-500">Use the mobile app for password changes, or sign out and use Forgot password on web.</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Enable features</p>
          <p className="mb-2 text-xs text-slate-500">
            {adminLock
              ? "These toggles are centrally managed by admin."
              : "Saved to your account and this browser."}
          </p>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <ToggleRow
              title="Reimbursements"
              sub="Allow expenses to be marked as reimbursable"
              value={reimbursements}
              disabled={adminLock}
              onChange={(v) => void setReimbursements(v)}
            />
            <ToggleRow
              title="Transaction number"
              sub="Show transaction number on each expense"
              value={txnNumber}
              disabled={adminLock}
              onChange={(v) => void setTxnNumber(v)}
            />
            <ToggleRow
              title="Scan payment method"
              sub="Show payment method picker on scanner"
              value={scanPayment}
              disabled={adminLock}
              onChange={(v) => void setScanPayment(v)}
            />
            <ToggleRow title="Require payment method" value={requirePay} disabled={adminLock} onChange={(v) => void setRequirePay(v)} />
            <ToggleRow title="Require expense notes" value={requireNotes} disabled={adminLock} onChange={(v) => void setRequireNotes(v)} />
          </div>
        </section>

        <section>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Localization</p>
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <label className="block text-xs font-semibold text-slate-600">Currency</label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={currency}
              onChange={(e) => void setCurrency(e.target.value)}
            >
              {CURRENCY_OPTIONS.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.label}
                </option>
              ))}
            </select>
            <label className="mt-3 block text-xs font-semibold text-slate-600">Date format</label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={dateFormat}
              onChange={(e) => void setDateFormat(e.target.value as DateFormatId)}
            >
              {DATE_FORMAT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
            <label className="mt-3 block text-xs font-semibold text-slate-600">Voice input language</label>
            <p className="mb-2 text-xs text-slate-500">
              Applies to voice dictation and the finance coach. Auto-detect works when you mix languages or are unsure.
            </p>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={voiceInputLanguage}
              onChange={(e) => void setVoiceInputLanguage(e.target.value)}
            >
              {VOICE_INPUT_LANGUAGE_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Merchants &amp; vendors</p>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Add merchant name"
                value={merchantInput}
                onChange={(e) => setMerchantInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMerchant()}
              />
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: primary }}
                onClick={addMerchant}
              >
                Add
              </button>
            </div>
            <ul className="mt-3 divide-y divide-slate-100">
              {merchants.length === 0 ? (
                <li className="py-3 text-sm text-slate-500">No saved merchants yet.</li>
              ) : (
                merchants.map((m) => (
                  <li key={m} className="flex items-center justify-between py-2 text-sm">
                    <span className="font-medium text-slate-900">{m}</span>
                    <button type="button" className="text-rose-600 hover:underline" onClick={() => removeMerchant(m)}>
                      Remove
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>

        <section>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Saved locations</p>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Label"
                value={locLabel}
                onChange={(e) => setLocLabel(e.target.value)}
              />
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
                placeholder="Address"
                value={locAddress}
                onChange={(e) => setLocAddress(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="mt-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: primary }}
              onClick={addLocation}
            >
              Add location
            </button>
            <ul className="mt-3 space-y-2">
              {locations.map((l) => (
                <li key={l.id} className="flex items-start justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-semibold text-slate-900">{l.label}</p>
                    <p className="text-xs text-slate-600">{l.address}</p>
                  </div>
                  <button type="button" className="shrink-0 text-rose-600 hover:underline" onClick={() => removeLocation(l.id)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Customize</p>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <Link to="/categories" className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 text-sm hover:bg-slate-50">
              <i className="fas fa-tags w-5 text-center text-slate-600" />
              <span className="flex-1 font-semibold text-slate-900">Categories</span>
              <i className="fas fa-chevron-right text-slate-400" />
            </Link>
            <Link to="/accounts" className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 text-sm hover:bg-slate-50">
              <i className="fas fa-wallet w-5 text-center text-slate-600" />
              <span className="flex-1 font-semibold text-slate-900">Accounts</span>
              <i className="fas fa-chevron-right text-slate-400" />
            </Link>
            <Link to="/insights" className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50">
              <i className="fas fa-chart-pie w-5 text-center text-slate-600" />
              <span className="flex-1 font-semibold text-slate-900">Analysis</span>
              <i className="fas fa-chevron-right text-slate-400" />
            </Link>
          </div>
        </section>

        <section>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Management</p>
          <button
            type="button"
            disabled={runtime?.exportEnabled === false || Boolean(sub && !sub.canExportCsv)}
            onClick={exportCsvDownload}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <i className="fas fa-download w-5 text-center text-slate-600" />
            <div>
              <p className="font-semibold text-slate-900">Export records</p>
              <p className="text-xs text-slate-500">
                {runtime?.exportEnabled === false
                  ? "Disabled by admin"
                  : sub && !sub.canExportCsv
                    ? "Pro only — trial and free plans can view data in the app"
                    : "Download CSV of all your transactions"}
              </p>
            </div>
          </button>
        </section>

        {user && (
          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate("/signin", { replace: true });
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-3 text-sm font-bold text-rose-700"
          >
            <i className="fas fa-right-from-bracket" />
            Sign out
          </button>
        )}

        <p className="text-center text-xs text-slate-400">Receipt Cycle</p>
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  sub,
  value,
  disabled,
  onChange,
}: {
  title: string;
  sub?: string;
  value: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {sub ? <p className="text-xs text-slate-500">{sub}</p> : null}
      </div>
      <button
        type="button"
        disabled={disabled}
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${value ? "bg-teal-600" : "bg-slate-200"} ${
          disabled ? "opacity-50" : ""
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${value ? "left-5" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}

export default function ConvexSettings() {
  const runtime = useQuery(api.admin.publicConfig, {});
  if (runtime?.maintenanceMode || runtime?.webSettingsEnabled === false) {
    return (
      <main style={{ minHeight: "100vh", background: "#f5fbf9", color: "#0f172a", padding: 20 }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, marginBottom: 10 }}>Settings unavailable</h2>
          <p style={{ color: "#64748b" }}>
            {runtime?.maintenanceMode ? "System is in maintenance mode." : "Settings page is disabled by admin."}
          </p>
        </div>
      </main>
    );
  }
  return (
    <AppChrome>
      <ConvexSettingsInner />
    </AppChrome>
  );
}
