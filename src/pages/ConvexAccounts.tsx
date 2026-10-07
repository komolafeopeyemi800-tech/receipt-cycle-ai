import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@mobile-lib/api";
import { api } from "@mobile-lib/api";
import type { Id } from "@mobile-lib/api";
import { AppChrome } from "@/components/layout/AppChrome";
import {
  Drawer, EmptyState, Field, IconBox, inputClass, Modal, PrimaryButton,
  SecondaryButton, StatCard, Surface, SurfaceHeader, WorkspaceHeader,
} from "@/components/workspace/DesktopWorkspaceUI";
import { useWebAuth } from "@/contexts/WebAuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useWebPreferences } from "@/contexts/WebPreferencesContext";

type AccountRow = { id: Id<"accounts">; name: string; balance: number; iconKey: string };
type AccountDraft = { id?: Id<"accounts">; name: string; balance: string; iconKey: string };
type AccountTransaction = {
  id: string;
  amount: number;
  type: "expense" | "income";
  category: string;
  merchant?: string;
  description?: string;
  date: string;
  accountId?: string | null;
};

function accountIcon(iconKey: string) {
  if (iconKey === "credit-card") return "fa-credit-card";
  if (iconKey === "piggy-bank") return "fa-piggy-bank";
  if (iconKey === "money-bill-wave") return "fa-money-bill-wave";
  return "fa-building-columns";
}

export default function ConvexAccounts() {
  const runtime = useQuery(api.admin.publicConfig, {});
  if (runtime?.maintenanceMode) {
    return <AppChrome><div className="p-8"><h1 className="text-xl font-bold">Accounts unavailable</h1><p className="mt-2 text-sm text-slate-500">System maintenance is in progress.</p></div></AppChrome>;
  }
  return <AppChrome><AccountsWorkspace /></AppChrome>;
}

function AccountsWorkspace() {
  const { workspace, ready } = useWorkspace();
  const { user } = useWebAuth();
  const { formatMoney, formatDate } = useWebPreferences();
  const list = useQuery(api.accounts.list, ready ? { workspace } : "skip") as AccountRow[] | undefined;
  const transactions = useQuery(
    api.transactions.list,
    ready && user ? { workspace, userId: user.id } : "skip",
  ) as AccountTransaction[] | undefined;
  const create = useMutation(api.accounts.create);
  const update = useMutation(api.accounts.update);
  const [selectedId, setSelectedId] = useState<Id<"accounts"> | null>(null);
  const [editor, setEditor] = useState<AccountDraft | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = (list ?? []).find((row) => row.id === selectedId) ?? null;
  const accountTransactions = useMemo(
    () => selected ? (transactions ?? []).filter((row) => row.accountId === String(selected.id)) : [],
    [transactions, selected],
  );
  const inflow = accountTransactions.filter((row) => row.type === "income").reduce((sum, row) => sum + row.amount, 0);
  const outflow = accountTransactions.filter((row) => row.type === "expense").reduce((sum, row) => sum + row.amount, 0);

  const trend = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index), 1);
      return { key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`, label: date.toLocaleString("en-US", { month: "short" }), net: 0 };
    });
    for (const row of accountTransactions) {
      const month = months.find((item) => row.date.startsWith(item.key));
      if (month) month.net += row.type === "income" ? row.amount : -row.amount;
    }
    return months;
  }, [accountTransactions]);
  const trendMax = Math.max(1, ...trend.map((month) => Math.abs(month.net)));

  async function save() {
    if (!editor || editor.name.trim().length < 2) return;
    const balance = Number(editor.balance);
    if (!Number.isFinite(balance)) return;
    setBusy(true);
    try {
      if (editor.id) await update({ id: editor.id, name: editor.name.trim(), balance, iconKey: editor.iconKey });
      else await create({ workspace, name: editor.name.trim(), balance, iconKey: editor.iconKey });
      setEditor(null);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not save account.");
    } finally { setBusy(false); }
  }

  const total = (list ?? []).reduce((sum, account) => sum + account.balance, 0);
  return <div className="min-h-full">
    <WorkspaceHeader eyebrow="Money workspace" title="Accounts" description="Balances, real transaction activity, and account setup synced with mobile." actions={<PrimaryButton onClick={() => setEditor({ name: "", balance: "0", iconKey: "wallet" })}>Add account</PrimaryButton>} />
    <div className="grid gap-3 sm:grid-cols-3">
      <StatCard label="Total balance" value={formatMoney(total)} icon="fa-wallet" />
      <StatCard label="Accounts" value={String((list ?? []).length)} icon="fa-building-columns" tone="blue" />
      <StatCard label="Positive balances" value={String((list ?? []).filter((account) => account.balance >= 0).length)} icon="fa-circle-check" />
    </div>
    <Surface className="mt-4">
      <SurfaceHeader title="Connected accounts" description="Open an account to review activity and edit its setup." />
      {list === undefined ? <p className="p-8 text-center text-sm text-slate-500">Loading accounts…</p> : list.length === 0 ?
        <EmptyState icon="fa-wallet" title="No accounts yet" description="Add the cash, card, bank, or wallet account you actually use. Receipt Cycle will not create balances for you." /> :
        <div className="grid md:grid-cols-2 xl:grid-cols-3">{list.map((account) => <button key={String(account.id)} type="button" onClick={() => setSelectedId(account.id)} className="flex items-center gap-3 border-b border-r border-slate-100 p-4 text-left hover:bg-slate-50">
          <IconBox icon={accountIcon(account.iconKey)} />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{account.name}</p><p className={`mt-1 text-base font-black ${account.balance >= 0 ? "text-teal-700" : "text-rose-700"}`}>{formatMoney(account.balance)}</p></div>
          <i className="fas fa-chevron-right text-xs text-slate-400" />
        </button>)}</div>}
    </Surface>

    <Drawer open={Boolean(selected)} onClose={() => setSelectedId(null)} title={selected?.name ?? "Account detail"} description="Account workspace" width="max-w-2xl">
      {selected ? <>
        <div className="rounded-xl bg-slate-950 p-6 text-white"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Current balance</p><p className={`mt-2 text-3xl font-black ${selected.balance >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{formatMoney(selected.balance)}</p></div>
        <div className="mt-4 grid grid-cols-3 gap-2"><StatCard label="Inflow" value={formatMoney(inflow)} icon="fa-arrow-down" /><StatCard label="Outflow" value={formatMoney(outflow)} icon="fa-arrow-up" tone="rose" /><StatCard label="Net activity" value={formatMoney(inflow - outflow)} icon="fa-wave-square" tone="blue" /></div>
        <Surface className="mt-4 p-5"><p className="text-sm font-extrabold">Six-month activity</p><div className="mt-5 flex h-36 items-end gap-3">{trend.map((month) => <div key={month.key} className="flex flex-1 flex-col items-center justify-end gap-2"><div className={`w-full rounded-t ${month.net < 0 ? "bg-rose-400" : "bg-teal-500"}`} style={{ height: `${Math.max(5, Math.abs(month.net) / trendMax * 100)}%` }} /><span className="text-[10px] font-bold text-slate-400">{month.label}</span></div>)}</div></Surface>
        <Surface className="mt-4"><SurfaceHeader title="Recent transactions" />{accountTransactions.length ? accountTransactions.slice(0, 6).map((row) => <div key={row.id} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0"><IconBox icon={row.type === "income" ? "fa-arrow-down" : "fa-arrow-up"} tone={row.type === "income" ? "teal" : "rose"} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{row.merchant || row.description || row.category}</p><p className="text-xs text-slate-500">{formatDate(row.date)} · {row.category}</p></div><strong className={row.type === "income" ? "text-teal-700" : "text-rose-700"}>{row.type === "income" ? "+" : "-"}{formatMoney(row.amount)}</strong></div>) : <EmptyState icon="fa-receipt" title="No linked transactions" description="Choose this account on a transaction to see its activity here." />}</Surface>
        <PrimaryButton icon="fa-pen" className="mt-4" onClick={() => setEditor({ id: selected.id, name: selected.name, balance: String(selected.balance), iconKey: selected.iconKey })}>Edit account</PrimaryButton>
      </> : null}
    </Drawer>

    <Modal open={Boolean(editor)} onClose={() => setEditor(null)} title={editor?.id ? "Edit account" : "Add account"} description="Create a cash, card, bank, or savings account">
      {editor ? <><div className="grid gap-4 sm:grid-cols-2"><Field label="Account name"><input className={inputClass} value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value })} placeholder="Business checking" /></Field><Field label="Opening balance"><input className={inputClass} value={editor.balance} onChange={(event) => setEditor({ ...editor, balance: event.target.value })} inputMode="decimal" /></Field><Field label="Account type" className="sm:col-span-2"><div className="mt-2 grid grid-cols-4 gap-2">{[["money-bill-wave", "fa-money-bill", "Cash"], ["credit-card", "fa-credit-card", "Card"], ["wallet", "fa-building-columns", "Bank"], ["piggy-bank", "fa-piggy-bank", "Savings"]].map(([key, icon, label]) => <button key={key} type="button" onClick={() => setEditor({ ...editor, iconKey: key })} className={`rounded-lg border p-3 text-center ${editor.iconKey === key ? "border-teal-600 bg-teal-50" : "border-slate-200"}`}><i className={`fas ${icon} text-teal-700`} /><p className="mt-1 text-[10px] font-bold">{label}</p></button>)}</div></Field></div><div className="mt-5 flex justify-end gap-2"><SecondaryButton onClick={() => setEditor(null)}>Cancel</SecondaryButton><PrimaryButton icon="fa-check" disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : "Save account"}</PrimaryButton></div></> : null}
    </Modal>
  </div>;
}
