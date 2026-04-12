import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { Transaction } from "@/types/transaction";
import type { WorkspaceId } from "@/contexts/WorkspaceContext";
import { cn } from "@/lib/utils";

type Props = {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
  workspace: WorkspaceId;
  userId: string;
};

export function TransactionEditDialog({ transaction, open, onClose, workspace, userId }: Props) {
  const updateTx = useMutation(api.transactions.update);
  const removeTx = useMutation(api.transactions.remove);

  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!transaction) return;
    setAmount(String(transaction.amount));
    setMerchant(transaction.merchant ?? "");
    setCategory(transaction.category);
    setDate(transaction.date);
    setType(transaction.type === "income" ? "income" : "expense");
    setDescription(transaction.description ?? "");
    setPaymentMethod(transaction.payment_method ?? "");
    setErr(null);
  }, [transaction]);

  if (!open || !transaction) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    setBusy(true);
    setErr(null);
    try {
      await updateTx({
        id: transaction.id as Id<"transactions">,
        workspace,
        userId,
        amount: n,
        type,
        category,
        merchant: merchant.trim() || undefined,
        date,
        description: description.trim() || undefined,
        payment_method: paymentMethod.trim() || undefined,
        accountId: transaction.accountId ? (transaction.accountId as Id<"accounts">) : undefined,
        tags: transaction.tags ?? undefined,
        is_recurring: transaction.is_recurring ?? undefined,
      });
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this transaction? This cannot be undone.")) return;
    setBusy(true);
    setErr(null);
    try {
      await removeTx({ id: transaction.id as Id<"transactions">, userId });
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not delete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50"
        aria-label="Close"
        onClick={() => !busy && onClose()}
      />
      <div className="relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Edit transaction</h2>
            <p className="mt-0.5 text-xs text-slate-500">Changes sync with the mobile app.</p>
          </div>
          <button
            type="button"
            onClick={() => !busy && onClose()}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {err ? <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p> : null}

        <form onSubmit={(e) => void handleSave(e)} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-medium text-slate-600">
              Type
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "expense" | "income")}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600">
              Amount
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
                inputMode="decimal"
                required
              />
            </label>
          </div>
          <label className="block text-xs font-medium text-slate-600">
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Merchant
            <input
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Category
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Description (optional)
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Payment method (optional)
            <input
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
            />
          </label>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={busy}
              className={cn(
                "rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50",
                busy && "opacity-50",
              )}
            >
              Delete
            </button>
            <div className="flex gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => !busy && onClose()}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
