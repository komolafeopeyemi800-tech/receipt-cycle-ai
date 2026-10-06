import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@mobile-lib/api";
import { api } from "@mobile-lib/api";
import type { Id } from "@mobile-lib/api";
import { AppChrome } from "@/components/layout/AppChrome";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";
import {
  Field, IconBox, inputClass, Modal, PrimaryButton, SecondaryButton,
  Segmented, StatCard, Surface, SurfaceHeader, WorkspaceHeader,
} from "@/components/workspace/DesktopWorkspaceUI";
import { useWorkspace } from "@/contexts/WorkspaceContext";

const COLORS = ["#ef4444", "#2563eb", "#7c3aed", "#16a34a", "#f97316", "#db2777", "#0ea5e9", "#0f766e", "#64748b"];
type CatRow = { id: Id<"categories">; name: string; kind: "expense" | "income"; color: string };
type CategoryDraft = { id?: Id<"categories">; name: string; kind: "expense" | "income"; color: string };
const categoryIcons: Record<string, string> = {
  "food & dining": "fa-utensils", shopping: "fa-bag-shopping", transportation: "fa-car",
  bills: "fa-file-invoice-dollar", health: "fa-heart-pulse", entertainment: "fa-gamepad",
  education: "fa-graduation-cap", home: "fa-house", salary: "fa-money-bill-trend-up",
};

function CategoryWorkspace() {
  const { workspace, ready } = useWorkspace();
  const ensure = useMutation(api.categories.ensureSeed);
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const removeCategory = useMutation(api.categories.remove);
  const list = useQuery(api.categories.list, ready ? { workspace } : "skip") as CatRow[] | undefined;
  const [filter, setFilter] = useState<"all" | "expense" | "income">("all");
  const [editor, setEditor] = useState<CategoryDraft | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (ready) void ensure({ workspace }); }, [ready, workspace, ensure]);
  const filtered = useMemo(() => (list ?? []).filter((row) => filter === "all" || row.kind === filter), [list, filter]);
  const openCreate = () => setEditor({ name: "", kind: filter === "income" ? "income" : "expense", color: COLORS[7]! });

  async function save() {
    if (!editor || editor.name.trim().length < 2) { window.alert("Enter at least 2 characters."); return; }
    setBusy(true);
    try {
      if (editor.id) await updateCategory({ id: editor.id, name: editor.name.trim(), kind: editor.kind, color: editor.color });
      else await createCategory({ workspace, name: editor.name.trim(), kind: editor.kind, color: editor.color });
      setEditor(null);
    } catch (error) { window.alert(error instanceof Error ? error.message : "Could not save the category."); }
    finally { setBusy(false); }
  }

  async function remove(row: CatRow) {
    if (!window.confirm(`Remove “${row.name}”? This cannot be undone.`)) return;
    await removeCategory({ id: row.id });
    setEditor(null);
  }

  return <div className="min-h-full">
    <WorkspaceHeader eyebrow="Classification workspace" title="Categories" description="Maintain the shared expense and income taxonomy used by records, budgets, and reports." actions={<PrimaryButton onClick={openCreate}>Add category</PrimaryButton>} />
    <div className="grid gap-3 sm:grid-cols-3">
      <StatCard label="All categories" value={String((list ?? []).length)} icon="fa-tags" />
      <StatCard label="Expense" value={String((list ?? []).filter((row) => row.kind === "expense").length)} icon="fa-arrow-trend-down" tone="rose" />
      <StatCard label="Income" value={String((list ?? []).filter((row) => row.kind === "income").length)} icon="fa-arrow-trend-up" tone="blue" />
    </div>
    <Surface className="mt-4">
      <SurfaceHeader title="Category library" description="Choose a category to edit its name, type, or color." action={<Segmented value={filter} onChange={(value) => setFilter(value as typeof filter)} options={[{ value: "all", label: "All" }, { value: "expense", label: "Expense" }, { value: "income", label: "Income" }] as const} />} />
      {list === undefined ? <div className="flex justify-center py-16"><div className="h-24 w-full animate-pulse rounded-xl bg-slate-100" aria-hidden /></div> :
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((row) => <div key={String(row.id)} className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-teal-200 hover:shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${row.color}18`, color: row.color }}><i className={`fas ${categoryIcons[row.name.toLowerCase()] ?? "fa-tag"}`} /></div>
          <button type="button" onClick={() => setEditor({ ...row })} className="min-w-0 flex-1 text-left"><p className="truncate text-sm font-extrabold text-slate-900">{row.name}</p><p className="mt-1 text-xs capitalize text-slate-500">{row.kind} category</p></button>
          <button type="button" onClick={() => setEditor({ ...row })} className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-teal-700" aria-label={`Edit ${row.name}`}><i className="fas fa-pen text-xs" /></button>
        </div>)}</div>}
    </Surface>
    <Modal open={Boolean(editor)} onClose={() => setEditor(null)} title={editor?.id ? "Edit category" : "Add category"} description="This category becomes available across transaction forms, budgets, and reports.">
      {editor ? <>
        <Field label="Category name" required><input className={inputClass} value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value })} placeholder="e.g. Home office" /></Field>
        <Field label="Type" className="mt-4"><div className="mt-1.5"><Segmented value={editor.kind} onChange={(kind) => setEditor({ ...editor, kind })} options={[{ value: "expense", label: "Expense" }, { value: "income", label: "Income" }] as const} /></div></Field>
        <Field label="Color" className="mt-4"><div className="mt-2 flex flex-wrap gap-2">{COLORS.map((color) => <button key={color} type="button" onClick={() => setEditor({ ...editor, color })} className={`h-9 w-9 rounded-full border-2 ring-offset-2 ${editor.color === color ? "border-slate-900 ring-2 ring-slate-300" : "border-white"}`} style={{ backgroundColor: color }} aria-label={`Use ${color}`} />)}</div></Field>
        <Surface className="mt-5 flex items-center gap-3 p-4"><IconBox icon={categoryIcons[editor.name.toLowerCase()] ?? "fa-tag"} /><div><p className="text-sm font-extrabold">{editor.name || "Category preview"}</p><p className="text-xs capitalize text-slate-500">{editor.kind}</p></div></Surface>
        <div className="mt-5 flex flex-wrap justify-between gap-2"><div>{editor.id ? <SecondaryButton danger icon="fa-trash" onClick={() => void remove(editor as CatRow)}>Delete</SecondaryButton> : null}</div><div className="flex gap-2"><SecondaryButton onClick={() => setEditor(null)}>Cancel</SecondaryButton><PrimaryButton icon="fa-check" disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : "Save category"}</PrimaryButton></div></div>
      </> : null}
    </Modal>
  </div>;
}

function Unavailable() {
  const runtime = useQuery(api.admin.publicConfig, {});
  return <div className="p-8"><h1 className="text-xl font-bold">Categories unavailable</h1><p className="mt-2 text-sm text-slate-600">{runtime?.maintenanceMode ? "System maintenance is in progress." : "This page is disabled by admin."}</p></div>;
}

export default function ConvexCategories() {
  const runtime = useQuery(api.admin.publicConfig, {});
  if (runtime?.maintenanceMode || runtime?.webDashboardEnabled === false) { const inner = <Unavailable />; return <ResponsiveLayout variant="app" showSidebar mobileContent={inner}>{inner}</ResponsiveLayout>; }
  return <AppChrome><CategoryWorkspace /></AppChrome>;
}
