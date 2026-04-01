import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { AppChrome } from "@/components/layout/AppChrome";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useWebPreferences } from "@/contexts/WebPreferencesContext";

const primary = "#0f766e";

type AccRow = { id: Id<"accounts">; name: string; balance: number; iconKey: string };

function ConvexAccountsInner() {
  const { workspace, ready } = useWorkspace();
  const { formatMoney } = useWebPreferences();
  const ensure = useMutation(api.accounts.ensureSeed);
  const createAcc = useMutation(api.accounts.create);
  const updateAcc = useMutation(api.accounts.update);
  const list = useQuery(api.accounts.list, ready ? { workspace } : "skip");

  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<AccRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editBalance, setEditBalance] = useState("");

  useEffect(() => {
    if (!ready) return;
    void ensure({ workspace });
  }, [ready, workspace, ensure]);

  const loading = !ready || list === undefined;

  async function addAccount() {
    const n = newName.trim();
    if (n.length < 2) {
      window.alert("Enter at least 2 characters.");
      return;
    }
    try {
      await createAcc({ workspace, name: n, balance: 0, iconKey: "wallet" });
      setNewName("");
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not create");
    }
  }

  function openEdit(a: AccRow) {
    setEditing(a);
    setEditName(a.name);
    setEditBalance(String(a.balance));
  }

  async function saveEdit() {
    if (!editing) return;
    const n = editName.trim();
    if (n.length < 2) {
      window.alert("Enter at least 2 characters.");
      return;
    }
    const bal = parseFloat(editBalance);
    if (!Number.isFinite(bal)) {
      window.alert("Enter a valid balance.");
      return;
    }
    try {
      await updateAcc({ id: editing.id, name: n, balance: bal });
      setEditing(null);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not update");
    }
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-white via-[#f0fdf9] to-[#f0fdfa]">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <h1 className="text-lg font-bold text-slate-900">Accounts</h1>
        <p className="text-xs text-slate-500">Cash, card, savings — same data as the mobile app</p>
      </div>

      <div className="space-y-4 px-4 py-4 pb-24">
        <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3">
          <input
            className="min-w-[200px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="New account name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            type="button"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: primary }}
            onClick={() => void addAccount()}
          >
            Add
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <i className="fas fa-circle-notch fa-spin text-2xl" style={{ color: primary }} />
          </div>
        ) : (
          <ul className="space-y-2">
            {(list as AccRow[]).map((a) => (
              <li
                key={String(a.id)}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50">
                    <i className="fas fa-wallet text-teal-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{a.name}</p>
                    <p className="text-sm text-slate-600">{formatMoney(a.balance)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-sm font-semibold text-teal-700 hover:underline"
                  onClick={() => openEdit(a)}
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            <h2 className="text-center text-base font-bold text-slate-900">Edit account</h2>
            <label className="mt-3 block text-xs font-semibold text-slate-600">Name</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <label className="mt-3 block text-xs font-semibold text-slate-600">Balance</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={editBalance}
              onChange={(e) => setEditBalance(e.target.value)}
              inputMode="decimal"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: primary }}
                onClick={() => void saveEdit()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Unavailable() {
  const runtime = useQuery(api.admin.publicConfig, {});
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">Accounts unavailable</h1>
      <p className="mt-2 text-sm text-slate-600">
        {runtime?.maintenanceMode ? "System is in maintenance mode." : "This page is disabled by admin."}
      </p>
    </div>
  );
}

export default function ConvexAccounts() {
  const runtime = useQuery(api.admin.publicConfig, {});
  if (runtime?.maintenanceMode) {
    const inner = <Unavailable />;
    return (
      <ResponsiveLayout variant="app" showSidebar={true} mobileContent={inner}>
        {inner}
      </ResponsiveLayout>
    );
  }
  return (
    <AppChrome>
      <ConvexAccountsInner />
    </AppChrome>
  );
}
