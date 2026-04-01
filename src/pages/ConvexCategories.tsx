import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { AppChrome } from "@/components/layout/AppChrome";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";
import { useWorkspace } from "@/contexts/WorkspaceContext";

const primary = "#0f766e";
const COLORS = ["#ef4444", "#2563eb", "#7c3aed", "#16a34a", "#f97316", "#db2777", "#0ea5e9", "#0f766e", "#64748b"];

type CatRow = { id: Id<"categories">; name: string; kind: "expense" | "income"; color: string };

function ConvexCategoriesInner() {
  const { workspace, ready } = useWorkspace();
  const ensure = useMutation(api.categories.ensureSeed);
  const createCat = useMutation(api.categories.create);
  const updateCat = useMutation(api.categories.update);
  const removeCat = useMutation(api.categories.remove);
  const list = useQuery(api.categories.list, ready ? { workspace } : "skip");

  const [newName, setNewName] = useState("");
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [editing, setEditing] = useState<CatRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(COLORS[0]!);

  useEffect(() => {
    if (!ready) return;
    void ensure({ workspace });
  }, [ready, workspace, ensure]);

  const { income, expense } = useMemo(() => {
    const rows = (list ?? []) as CatRow[];
    return {
      income: rows.filter((c) => c.kind === "income"),
      expense: rows.filter((c) => c.kind === "expense"),
    };
  }, [list]);

  const loading = !ready || list === undefined;

  async function addCategory() {
    const n = newName.trim();
    if (n.length < 2) {
      window.alert("Enter at least 2 characters.");
      return;
    }
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]!;
    try {
      await createCat({ workspace, name: n, kind, color });
      setNewName("");
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not create");
    }
  }

  function openEdit(c: CatRow) {
    setEditing(c);
    setEditName(c.name);
    setEditColor(c.color);
  }

  async function saveEdit() {
    if (!editing) return;
    const n = editName.trim();
    if (n.length < 2) {
      window.alert("Enter at least 2 characters.");
      return;
    }
    try {
      await updateCat({ id: editing.id, name: n, color: editColor });
      setEditing(null);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not update");
    }
  }

  function confirmDelete(c: CatRow) {
    if (!window.confirm(`Remove “${c.name}”? This cannot be undone.`)) return;
    void removeCat({ id: c.id });
  }

  function renderSection(title: string, rows: CatRow[]) {
    return (
      <div className="mt-6">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h2>
        <ul className="space-y-2">
          {rows.map((c) => (
            <li
              key={String(c.id)}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="truncate font-medium text-slate-900">{c.name}</span>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" className="text-xs font-semibold text-teal-700 hover:underline" onClick={() => openEdit(c)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="text-xs font-semibold text-rose-600 hover:underline"
                  onClick={() => confirmDelete(c)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-white via-[#f0fdf9] to-[#f0fdfa]">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <h1 className="text-lg font-bold text-slate-900">Categories</h1>
        <p className="text-xs text-slate-500">Expense and income categories — synced with mobile</p>
      </div>

      <div className="space-y-4 px-4 py-4 pb-24">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap gap-2">
            <input
              className="min-w-[160px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Category name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <select
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={kind}
              onChange={(e) => setKind(e.target.value as "expense" | "income")}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <button
              type="button"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: primary }}
              onClick={() => void addCategory()}
            >
              Add
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <i className="fas fa-circle-notch fa-spin text-2xl" style={{ color: primary }} />
          </div>
        ) : (
          <>
            {renderSection("Expense", expense)}
            {renderSection("Income", income)}
          </>
        )}
      </div>

      {editing ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            <h2 className="text-center text-base font-bold text-slate-900">Edit category</h2>
            <label className="mt-3 block text-xs font-semibold text-slate-600">Name</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <label className="mt-3 block text-xs font-semibold text-slate-600">Color</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`h-8 w-8 rounded-full border-2 ${editColor === c ? "border-slate-900" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setEditColor(c)}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" className="flex-1 rounded-lg border py-2 text-sm font-semibold" onClick={() => setEditing(null)}>
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
      <h1 className="text-xl font-bold">Categories unavailable</h1>
      <p className="mt-2 text-sm text-slate-600">
        {runtime?.maintenanceMode ? "System is in maintenance mode." : "This page is disabled by admin."}
      </p>
    </div>
  );
}

export default function ConvexCategories() {
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
      <ConvexCategoriesInner />
    </AppChrome>
  );
}
