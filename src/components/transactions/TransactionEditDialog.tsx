import { useMutation, useQuery } from "@mobile-lib/api";
import { useEffect, useState } from "react";
import { api } from "@mobile-lib/api";
import type { Id } from "@mobile-lib/api";
import type { Transaction } from "@/types/transaction";
import type { WorkspaceId } from "@/contexts/WorkspaceContext";
import { Drawer, Field, inputClass, PrimaryButton, SecondaryButton, Surface, SurfaceHeader, textareaClass } from "@/components/workspace/DesktopWorkspaceUI";

type Props = { transaction: Transaction | null; open: boolean; onClose: () => void; workspace: WorkspaceId; userId: string; token: string | null };

export function TransactionEditDialog({ transaction, open, onClose, workspace, userId, token }: Props) {
  const updateTx = useMutation(api.transactions.update);
  const removeTx = useMutation(api.transactions.remove);
  const accounts = useQuery(api.accounts.list, { workspace });
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [accountId, setAccountId] = useState("");
  const [receiptData, setReceiptData] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!transaction) return;
    setAmount(String(transaction.amount)); setMerchant(transaction.merchant ?? ""); setCategory(transaction.category); setDate(transaction.date);
    setType(transaction.type === "income" ? "income" : "expense"); setDescription(transaction.description ?? ""); setPaymentMethod(transaction.payment_method ?? ""); setAccountId(transaction.accountId ?? ""); setReceiptData(transaction.receipt_data && typeof transaction.receipt_data === "object" ? { ...(transaction.receipt_data as Record<string, unknown>) } : {}); setErr(null);
  }, [transaction]);
  if (!open || !transaction) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); const n = parseFloat(amount); if (!Number.isFinite(n) || n <= 0) return;
    setBusy(true); setErr(null);
    try {
      if (!token) throw new Error("Sign in required.");
      await updateTx({ id: transaction.id as Id<"transactions">, workspace, userId, token, amount: n, type, category, merchant: merchant.trim() || undefined, date, description: description.trim() || undefined, payment_method: paymentMethod.trim() || undefined, accountId: accountId ? accountId as Id<"accounts"> : undefined, tags: transaction.tags ?? undefined, is_recurring: transaction.is_recurring ?? undefined, receipt_data: { ...receiptData, transaction_type: type, total_amount: n, merchant_name: merchant.trim(), date, category, payment_method: paymentMethod.trim(), description: description.trim() } });
      onClose();
    } catch (error) { setErr(error instanceof Error ? error.message : "Could not save"); } finally { setBusy(false); }
  }
  async function handleDelete() {
    if (!window.confirm("Delete this transaction? This cannot be undone.")) return;
    setBusy(true); setErr(null);
    try { if (!token) throw new Error("Sign in required."); await removeTx({ id: transaction.id as Id<"transactions">, userId, token }); onClose(); }
    catch (error) { setErr(error instanceof Error ? error.message : "Could not delete"); } finally { setBusy(false); }
  }

  return <Drawer open={open} onClose={() => !busy && onClose()} title="Edit transaction" description="Changes sync with the mobile app" width="max-w-none">
    {err ? <p className="mb-6 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">{err}</p> : null}
    <form onSubmit={(e) => void handleSave(e)} className="space-y-10">
      <Surface><SurfaceHeader title="Transaction details" description="Update this record and connect it to the correct account." /><div className="grid gap-x-10 gap-y-8 p-6 md:grid-cols-2 lg:p-8 grid-cols-1">
        <Field label="Type"><select value={type} onChange={(e) => setType(e.target.value as "expense" | "income")} className={inputClass}><option value="expense">Expense</option><option value="income">Income</option></select></Field>
        <Field label="Amount" required><input value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} inputMode="decimal" required /></Field>
        <Field label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} /></Field>
        <Field label="Merchant"><input value={merchant} onChange={(e) => setMerchant(e.target.value)} className={inputClass} /></Field>
        <Field label="Category"><input value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} /></Field>
        <Field label="Payment method"><input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputClass} placeholder="Visa, Mastercard, cash…" /></Field>
        <Field label="Linked account"><select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputClass}><option value="">No linked account</option>{(accounts ?? []).map((account) => <option key={String(account.id)} value={String(account.id)}>{account.name}</option>)}</select></Field>
        <Field label="Notes" className="md:col-span-2"><textarea value={description} onChange={(e) => setDescription(e.target.value)} className={textareaClass} /></Field>
      </div></Surface>
      {transaction.receipt_data ? <Surface><SurfaceHeader title="Extracted receipt details" description="Every OCR field remains attached to this transaction unless you delete the transaction." /><div className="grid gap-x-10 gap-y-8 p-6 md:grid-cols-2 lg:p-8 grid-cols-1">
        {[['currency','Currency'],['merchant_address','Vendor address'],['receipt_number','Receipt number'],['country','Country'],['card_type','Card type'],['card_last4','Card last 4']].map(([key,label]) => <Field key={key} label={label}><input className={inputClass} value={String(receiptData[key] ?? '')} onChange={(e) => setReceiptData({ ...receiptData, [key]: e.target.value })} /></Field>)}
        {[['subtotal','Sub total'],['tax_amount','Tax total']].map(([key,label]) => <Field key={key} label={label}><input type="number" className={inputClass} value={receiptData[key] ?? ''} onChange={(e) => setReceiptData({ ...receiptData, [key]: e.target.value === '' ? undefined : Number(e.target.value) })} /></Field>)}
        <div className="md:col-span-2"><p className="mb-3 text-sm font-extrabold">Tax lines</p><div className="space-y-3">{(receiptData.taxes ?? []).map((tax: Record<string, any>, index: number) => <div key={index} className="grid gap-3 sm:grid-cols-[1fr_160px_44px] grid-cols-1"><input className={inputClass} value={tax.type ?? ''} onChange={(e) => setReceiptData({ ...receiptData, taxes: receiptData.taxes.map((row: Record<string, any>, i: number) => i === index ? { ...row, type: e.target.value } : row) })} /><input type="number" className={inputClass} value={tax.amount ?? ''} onChange={(e) => setReceiptData({ ...receiptData, taxes: receiptData.taxes.map((row: Record<string, any>, i: number) => i === index ? { ...row, amount: Number(e.target.value) } : row) })} /><button type="button" className="text-rose-600" onClick={() => setReceiptData({ ...receiptData, taxes: receiptData.taxes.filter((_: unknown, i: number) => i !== index) })}><i className="fas fa-trash" /></button></div>)}</div><button type="button" className="mt-3 text-sm font-bold text-teal-700" onClick={() => setReceiptData({ ...receiptData, taxes: [...(receiptData.taxes ?? []), { type: 'Sales Tax', amount: 0 }] })}>+ Add tax line</button></div>
        <div className="md:col-span-2"><p className="mb-3 text-sm font-extrabold">Line items</p><div className="space-y-3">{(receiptData.items ?? []).map((item: Record<string, any>, index: number) => <div key={index} className="grid gap-3 lg:grid-cols-[1fr_90px_120px_120px_1fr_44px] grid-cols-1"><input className={inputClass} value={item.name ?? ''} onChange={(e) => setReceiptData({ ...receiptData, items: receiptData.items.map((row: Record<string, any>, i: number) => i === index ? { ...row, name: e.target.value } : row) })} /><input type="number" className={inputClass} value={item.quantity ?? 1} onChange={(e) => setReceiptData({ ...receiptData, items: receiptData.items.map((row: Record<string, any>, i: number) => i === index ? { ...row, quantity: Number(e.target.value) } : row) })} /><input type="number" className={inputClass} value={item.unit_price ?? item.price ?? ''} onChange={(e) => setReceiptData({ ...receiptData, items: receiptData.items.map((row: Record<string, any>, i: number) => i === index ? { ...row, unit_price: Number(e.target.value), price: Number(e.target.value) } : row) })} /><input type="number" className={inputClass} value={item.total ?? ''} onChange={(e) => setReceiptData({ ...receiptData, items: receiptData.items.map((row: Record<string, any>, i: number) => i === index ? { ...row, total: Number(e.target.value) } : row) })} /><input className={inputClass} value={item.category ?? category} onChange={(e) => setReceiptData({ ...receiptData, items: receiptData.items.map((row: Record<string, any>, i: number) => i === index ? { ...row, category: e.target.value } : row) })} /><button type="button" className="text-rose-600" onClick={() => setReceiptData({ ...receiptData, items: receiptData.items.filter((_: unknown, i: number) => i !== index) })}><i className="fas fa-trash" /></button></div>)}</div></div>
      </div></Surface> : null}
      <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row"><SecondaryButton danger icon="fa-trash" onClick={() => void handleDelete()} disabled={busy}>Delete transaction</SecondaryButton><div className="flex gap-2"><SecondaryButton onClick={() => !busy && onClose()}>Cancel</SecondaryButton><PrimaryButton type="submit" icon="fa-check" disabled={busy}>{busy ? "Saving…" : "Save changes"}</PrimaryButton></div></div>
    </form>
  </Drawer>;
}
