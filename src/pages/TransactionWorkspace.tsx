import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { compressImage } from "@/lib/compressImage";
import { useAction, useMutation, useQuery } from "@mobile-lib/api";
import { api } from "@mobile-lib/api";
import type { Id } from "@mobile-lib/api";
import { useLocation, useNavigate } from "react-router-dom";
import { AppChrome } from "@/components/layout/AppChrome";
import {
  VoiceQuickAddWeb,
  type VoiceDraft,
} from "@/components/dashboard/VoiceQuickAddWeb";
import { TransactionEditDialog } from "@/components/transactions/TransactionEditDialog";
import {
  Drawer,
  EmptyState,
  Field,
  IconBox,
  inputClass,
  Modal,
  PrimaryButton,
  SecondaryButton,
  Segmented,
  StatusPill,
  Surface,
  SurfaceHeader,
  textareaClass,
  WorkspaceHeader,
} from "@/components/workspace/DesktopWorkspaceUI";
import { MerchantIconBox } from "@/components/workspace/MerchantIconBox";
import { useWebAuth } from "@/contexts/WebAuthContext";
import { useWebPreferences } from "@/contexts/WebPreferencesContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { Transaction } from "@/types/transaction";
import { toLocalISODate } from "@/lib/transactionMath";
import { useSubscriptionState } from "@/hooks/use-subscription-state";

type EntryMode = "manual" | "ai" | "upload";
type EntryType = "expense" | "income";
type Draft = {
  amount: string;
  merchant: string;
  category: string;
  date: string;
  accountId: string;
  description: string;
  paymentMethod: string;
  type: EntryType;
};
type Filters = {
  search: string;
  type: "all" | EntryType;
  category: string;
  accountId: string;
  start: string;
  end: string;
  sort: "newest" | "oldest" | "highest";
};
type ReceiptTax = { type?: string; amount?: number; registration_number?: string };
type ReceiptItem = { name?: string; quantity?: number; unit_price?: number; price?: number; total?: number; category?: string };
export type ReceiptDetails = Record<string, unknown> & {
  transaction_type?: "expense" | "income"; account_name?: string; date?: string;
  merchant_name?: string; merchant_address?: string; receipt_number?: string; country?: string;
  currency?: string; subtotal?: number; tax_amount?: number; total_amount?: number;
  payment_method?: string; card_type?: string; card_last4?: string; description?: string;
  taxes?: ReceiptTax[]; items?: ReceiptItem[];
};
const TAX_TYPES = [
  "Sales Tax", "State Tax", "County Tax", "City Tax", "Local Tax", "Occupancy Tax", "Meals Tax", "Liquor Tax", "Other",
  "VAT", "GST", "HST", "PST", "QST", "RST", "CGST", "SGST", "IGST", "UGST", "Service Tax", "Consumption Tax", "PBT", "ICMS", "ISS", "IPI", "PIS", "COFINS",
];
const freshDraft = (type: EntryType = "expense"): Draft => ({
  amount: "",
  merchant: "",
  category: type === "expense" ? "Food & Dining" : "Salary",
  date: toLocalISODate(new Date()),
  accountId: "",
  description: "",
  paymentMethod: "Cash",
  type,
});
const blankFilters: Filters = {
  search: "",
  type: "all",
  category: "",
  accountId: "",
  start: "",
  end: "",
  sort: "newest",
};

function normalizeExtracted(data: unknown) {
  if (!data || typeof data !== "object") return {};
  const root = data as Record<string, unknown>;
  const source =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root.extracted_data && typeof root.extracted_data === "object"
        ? (root.extracted_data as Record<string, unknown>)
        : root;
  const number =
    typeof source.total_amount === "number"
      ? source.total_amount
      : Number(String(source.total_amount ?? "").replace(/[^0-9.-]/g, ""));
  return {
    amount: Number.isFinite(number) ? String(number) : "",
    merchant:
      typeof source.merchant_name === "string" ? source.merchant_name : "",
    category: typeof source.category === "string" ? source.category : "",
    date:
      typeof source.date === "string" && /^\d{4}-\d{2}-\d{2}/.test(source.date)
        ? source.date.slice(0, 10)
        : "",
    paymentMethod:
      typeof source.payment_method === "string" ? source.payment_method : "",
    transactionType:
      source.transaction_type === "income" ? "income" : "expense",
  };
}

function isCardPayment(value: string) {
  return /\b(visa|master\s?card|amex|american express|discover|verve|debit|credit|card)\b/i.test(
    value,
  );
}
async function fileToBase64(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result ?? "");
      resolve(value.includes(",") ? value.split(",")[1]! : value);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function TransactionWorkspace() {
  const { workspace, ready } = useWorkspace();
  const { user, token } = useWebAuth();
  const { formatMoney, formatDate } = useWebPreferences();
  const subscription = useSubscriptionState();
  const runtime = useQuery(api.admin.publicConfig, {});
  const location = useLocation();
  const navigate = useNavigate();
  const rows = useQuery(
    api.transactions.list,
    ready && user ? { workspace, userId: user.id } : "skip",
  ) as Transaction[] | undefined;
  const categories = useQuery(
    api.categories.list,
    ready ? { workspace } : "skip",
  );
  const accounts = useQuery(api.accounts.list, ready ? { workspace } : "skip");
  const createTx = useMutation(api.transactions.create);
  const removeTx = useMutation(api.transactions.remove);
  const scan = useAction(api.scanReceipt.scanFromBase64);
  const uploadReceipt = useAction(api.receipts.upload);
  const [addOpen, setAddOpen] = useState(false);
  const [mode, setMode] = useState<EntryMode>("upload");
  const [entrySource, setEntrySource] = useState<"manual" | "upload">("manual");
  const [draft, setDraft] = useState<Draft>(() => freshDraft());
  const [filters, setFilters] = useState<Filters>(blankFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0);
  const [fileName, setFileName] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState("");
  const [receiptData, setReceiptData] = useState<ReceiptDetails | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (location.hash === "#add-manual") openAdd("expense", "manual");
    if (location.hash === "#add-transaction" || location.hash === "#upload-document")
      openAdd("expense", "upload");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.hash]);
  useEffect(() => {
    const incoming = (location.state as { uploadFile?: File } | null)?.uploadFile;
    if (!(incoming instanceof File)) return;
    openAdd("expense", "upload");
    void prepareUpload(incoming);
    navigate(`${location.pathname}#upload-document`, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);
  useEffect(() => {
    const openFromShell = () => setAddOpen(true);
    window.addEventListener("receipt-cycle:add-transaction", openFromShell);
    return () =>
      window.removeEventListener(
        "receipt-cycle:add-transaction",
        openFromShell,
      );
  }, []);
  useEffect(
    () => () => {
      if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl);
    },
    [receiptPreviewUrl],
  );
  const categoryNames = (categories ?? [])
    .filter((category) => category.kind === draft.type)
    .map((category) => category.name);
  const hints = {
    expenseCategories: (categories ?? [])
      .filter((c) => c.kind === "expense")
      .map((c) => c.name),
    incomeCategories: (categories ?? [])
      .filter((c) => c.kind === "income")
      .map((c) => c.name),
    accountNames: (accounts ?? []).map((a) => a.name),
  };
  const shown = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return [...(rows ?? [])]
      .filter(
        (row) =>
          !query ||
          `${row.merchant ?? ""} ${row.description ?? ""} ${row.category}`
            .toLowerCase()
            .includes(query),
      )
      .filter((row) => filters.type === "all" || row.type === filters.type)
      .filter((row) => !filters.category || row.category === filters.category)
      .filter(
        (row) => !filters.accountId || row.accountId === filters.accountId,
      )
      .filter((row) => !filters.start || row.date >= filters.start)
      .filter((row) => !filters.end || row.date <= filters.end)
      .sort((a, b) =>
        filters.sort === "oldest"
          ? a.date.localeCompare(b.date)
          : filters.sort === "highest"
            ? b.amount - a.amount
            : b.date.localeCompare(a.date),
      );
  }, [rows, filters]);
  const activeFilterCount = [
    filters.type !== "all",
    Boolean(filters.category),
    Boolean(filters.accountId),
    Boolean(filters.start),
    Boolean(filters.end),
  ].filter(Boolean).length;

  const openAdd = (
    type: EntryType = "expense",
    nextMode: EntryMode = "upload",
  ) => {
    if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl);
    setReceiptPreviewUrl("");
    setReceiptFile(null);
    setReceiptData(null);
    setDraft(freshDraft(type));
    setMode(nextMode);
    setEntrySource("manual");
    setMessage(null);
    setAddOpen(true);
  };
  const closeAdd = () => {
    setAddOpen(false);
    if (location.hash) navigate("/transactions", { replace: true });
  };
  const applyVoiceDraft = useCallback((parsed: VoiceDraft) => {
    if (parsed.intent !== "transaction") {
      setMessage(
        "This workspace is ready for a transaction. Open Budgets to save a budget limit.",
      );
      return;
    }
    setDraft((current) => ({
      ...current,
      type: parsed.type,
      amount: parsed.amount ? String(parsed.amount) : current.amount,
      merchant: parsed.merchant ?? "",
      category: parsed.category || current.category,
      date: parsed.date ?? current.date,
      description: parsed.description ?? "",
      paymentMethod: parsed.payment_method ?? current.paymentMethod,
    }));
    setMode("manual");
    setMessage("AI filled the form. Review each field before saving.");
  }, []);
  async function save(e: FormEvent) {
    e.preventDefault();
    const amount = Number(draft.amount);
    if (!user || !token || !Number.isFinite(amount) || amount <= 0) {
      setMessage("Enter a valid amount and make sure you are signed in.");
      return;
    }
    const category =
      categoryNames.length && !categoryNames.includes(draft.category)
        ? categoryNames[0]!
        : draft.category;
    setBusy(true);
    setMessage(null);
    try {
      let receiptKey: string | undefined;
      if (receiptFile) {
        try {
          receiptKey = (
            await uploadReceipt({
              file: receiptFile,
              fileName: receiptFile.name,
            })
          ).key;
        } catch {
          receiptKey = undefined;
        }
      }
      await createTx({
        workspace,
        userId: user.id,
        token,
        amount,
        type: draft.type,
        category,
        merchant: draft.merchant.trim() || undefined,
        date: draft.date,
        description: draft.description.trim() || undefined,
        payment_method: draft.paymentMethod || undefined,
        accountId: draft.accountId
          ? (draft.accountId as Id<"accounts">)
          : undefined,
        tags: [],
        is_recurring: false,
        entrySource,
        receipt_url: receiptKey,
        receipt_data: receiptData ?? undefined,
      });
      setReceiptFile(null);
      setReceiptData(null);
      setDraft(freshDraft(draft.type));
      closeAdd();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not save transaction.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function prepareUpload(picked: File) {
    if (!picked.type.startsWith("image/")) {
      navigate("/upload-statement", { state: { uploadFile: picked } });
      return;
    }
    const file = await compressImage(picked);
    setFileName(file.name);
    if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl);
    setReceiptFile(file);
    setReceiptData(null);
    setReceiptPreviewUrl(URL.createObjectURL(file));
    setMessage("Preview ready. Confirm the image, then extract the receipt details.");
  }
  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (picked) await prepareUpload(picked);
  }

  async function scanSelectedReceipt() {
    if (!receiptFile || !token) return;
    setProcessing(true);
    setProcessStep(1);
    try {
      const base64 = await fileToBase64(receiptFile);
      setProcessStep(2);
      if (runtime?.scannerEnabled === false)
        throw new Error("Receipt scanner is currently unavailable.");
      const result = await scan({
        imageBase64: base64,
        mimeType: receiptFile.type || "image/jpeg",
        sessionToken: token,
      });
      setProcessStep(3);
      if ("error" in result && result.error) throw new Error(result.error);
      const extracted = normalizeExtracted(result.extracted_data);
      const raw = result.extracted_data && typeof result.extracted_data === "object"
        ? (result.extracted_data as Record<string, unknown>)
        : null;
      setReceiptData(raw && raw.data && typeof raw.data === "object" ? raw.data as Record<string, unknown> : raw);
      setDraft((current) => ({
        ...current,
        amount: extracted.amount || current.amount,
        merchant: extracted.merchant || current.merchant,
        category: extracted.category || current.category,
        date: extracted.date || current.date,
        paymentMethod: extracted.paymentMethod || current.paymentMethod,
        type: extracted.transactionType === "income" ? "income" : "expense",
        accountId: String(
          (accounts ?? []).find((account) => {
            const payment = extracted.paymentMethod.toLowerCase();
            if (isCardPayment(payment)) return account.iconKey === "credit-card" || /card|visa|mastercard|amex/i.test(account.name);
            if (/cash/i.test(payment)) return account.iconKey === "money-bill-wave" || /cash/i.test(account.name);
            return payment && account.name.toLowerCase().includes(payment);
          })?.id ?? current.accountId,
        ),
      }));
      setEntrySource("upload");
      setProcessStep(4);
      setMode("manual");
      setMessage("Receipt fields extracted. Review the draft before saving.");
      window.setTimeout(() => setProcessing(false), 650);
    } catch (error) {
      setProcessing(false);
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not process the document.",
      );
    }
  }
  async function remove(row: Transaction) {
    if (
      !user ||
      !token ||
      !window.confirm(`Delete ${row.merchant || row.category}?`)
    )
      return;
    try {
      await removeTx({
        id: row.id as Id<"transactions">,
        userId: user.id,
        token,
      });
      setSelected(null);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Could not delete transaction.",
      );
    }
  }

  const allShownSelected = shown.length > 0 && shown.every((row) => selectedIds.has(String(row.id)));
  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAllShown = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allShownSelected) shown.forEach((row) => next.delete(String(row.id)));
      else shown.forEach((row) => next.add(String(row.id)));
      return next;
    });
  };
  const downloadSelected = () => {
    if (!subscription?.canExportCsv) {
      window.dispatchEvent(new Event("receipt-cycle:open-pricing"));
      return;
    }
    const selectedRows = (rows ?? []).filter((row) => selectedIds.has(String(row.id)));
    if (!selectedRows.length) return;
    const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [
      ["Date", "Type", "Merchant", "Description", "Category", "Amount", "Payment method", "Account", "Evidence"],
      ...selectedRows.map((row) => {
        const account = (accounts ?? []).find((item) => String(item.id) === row.accountId);
        return [row.date, row.type, row.merchant, row.description, row.category, row.amount, row.payment_method, account?.name, row.evidence_url ?? ""];
      }),
    ].map((line) => line.map(escape).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `receipt-cycle-transactions-${toLocalISODate(new Date())}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const deleteSelected = async () => {
    if (!user || !token || !selectedIds.size || !window.confirm(`Delete ${selectedIds.size} selected transaction(s)? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await Promise.all([...selectedIds].map((id) => removeTx({ id: id as Id<"transactions">, userId: user.id, token })));
      setSelectedIds(new Set());
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not delete the selected transactions.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppChrome>
      <div className="min-h-full text-slate-900">
        <WorkspaceHeader
          eyebrow="Records workspace"
          title="Transactions"
          description="Search, capture, review, edit, and filter every saved business record."
          actions={
            <>
              <SecondaryButton
                icon="fa-wand-magic-sparkles"
                onClick={() => openAdd("expense", "ai")}
              >
                AI entry
              </SecondaryButton>
              <PrimaryButton onClick={() => openAdd()}>
                Add transaction
              </PrimaryButton>
            </>
          }
        />
        <Surface>
          {selectedIds.size ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-teal-50 px-4 py-3">
              <p className="text-sm font-extrabold text-teal-900">{selectedIds.size} selected</p>
              <div className="flex flex-wrap gap-2">
                <SecondaryButton icon="fa-download" onClick={downloadSelected}>Download CSV</SecondaryButton>
                <button type="button" disabled={busy} onClick={() => void deleteSelected()} className="inline-flex h-10 items-center gap-2 rounded-md border border-rose-200 bg-white px-4 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"><i className="fas fa-trash" />Delete</button>
              </div>
            </div>
          ) : null}
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <i className="fas fa-search absolute left-3 top-3 text-xs text-slate-400" />
              <input
                className={`${inputClass} mt-0 pl-9`}
                placeholder="Search transactions, merchants, categories…"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>
            <Segmented
              options={
                [
                  { value: "all", label: "All" },
                  { value: "expense", label: "Expenses" },
                  { value: "income", label: "Income" },
                ] as const
              }
              value={filters.type}
              onChange={(type) => setFilters({ ...filters, type })}
            />
            <SecondaryButton
              icon="fa-sliders"
              onClick={() => setFilterOpen(true)}
            >
              Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
            </SecondaryButton>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" checked={allShownSelected} onChange={toggleAllShown} aria-label="Select all visible transactions" />
                  </th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Account</th>
                  <th>Type</th>
                  <th className="text-right">Amount</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map((row) => {
                  const account = (accounts ?? []).find(
                    (a) => String(a.id) === row.accountId,
                  );
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelected(row)}
                      className="cursor-pointer hover:bg-slate-50"
                    >
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input type="checkbox" checked={selectedIds.has(String(row.id))} onChange={() => toggleSelected(String(row.id))} aria-label={`Select ${row.merchant || row.category}`} />
                      </td>
                      <td className="whitespace-nowrap text-slate-500">
                        {formatDate(row.date)}
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <MerchantIconBox
                            merchant={row.merchant}
                            category={row.category}
                            type={row.type === "income" ? "income" : "expense"}
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900">
                              {row.merchant || row.description || row.category}
                            </p>
                            <p className="max-w-[260px] truncate text-xs text-slate-400">
                              {row.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>{row.category}</td>
                      <td>{account?.name ?? "—"}</td>
                      <td>
                        <StatusPill status={row.type} />
                      </td>
                      <td
                        className={`text-right font-extrabold tabular-nums ${row.type === "income" ? "text-emerald-700" : "text-rose-700"}`}
                      >
                        {row.type === "income" ? "+" : "-"}
                        {formatMoney(row.amount)}
                      </td>
                      <td>
                        <i className="fas fa-chevron-right text-xs text-slate-400" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {shown.length === 0 ? (
              <EmptyState
                icon="fa-receipt"
                title="No matching transactions"
                description="Adjust the filters or add a new expense or income record."
              />
            ) : null}
          </div>
        </Surface>
        <Drawer
          open={addOpen}
          onClose={closeAdd}
          title={mode === "upload" && !receiptPreviewUrl ? "Add documents" : draft.type === "expense" ? "Add expense" : "Add income"}
          description={mode === "upload" && !receiptPreviewUrl ? "Upload a source document and Receipt Cycle will prepare it for review." : "Save directly to the same ledger used by mobile"}
          width="max-w-none"
        >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Segmented
              options={
                [
                  { value: "expense", label: "Expense" },
                  { value: "income", label: "Income" },
                ] as const
              }
              value={draft.type}
              onChange={(type) =>
                setDraft({
                  ...draft,
                  type,
                  category: type === "expense" ? "Food & Dining" : "Salary",
                })
              }
            />
            <Segmented
              options={
                [
                  { value: "upload", label: "Upload" },
                  { value: "manual", label: "Manual" },
                  { value: "ai", label: "AI voice / text" },
                ] as const
              }
              value={mode}
              onChange={(value) => setMode(value as EntryMode)}
            />
          </div>
          {mode === "ai" ? (
            <VoiceQuickAddWeb
              disabled={busy}
              hints={hints}
              onParsed={applyVoiceDraft}
            />
          ) : null}
          {mode === "upload" ? (
            <Surface className={receiptPreviewUrl ? "border-dashed border-teal-300 bg-teal-50/50 p-6 lg:p-9" : "border-0 bg-transparent p-0 shadow-none"}>
              {receiptPreviewUrl ? (
                <div className="grid gap-8 lg:grid-cols-[minmax(280px,0.8fr)_1fr] lg:items-center grid-cols-1">
                  <div className="flex min-h-96 items-center justify-center rounded-md border border-slate-200 bg-slate-100 p-5">
                    <img
                      src={receiptPreviewUrl}
                      alt="Receipt selected for extraction"
                      className="max-h-[34rem] w-full object-contain"
                    />
                  </div>
                  <div className="text-left">
                    <IconBox icon="fa-receipt" className="h-14 w-14 text-lg" />
                    <h3 className="mt-5 text-xl font-extrabold">Review the receipt first</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Confirm that the merchant, totals, and item lines are readable before AI extraction begins.
                    </p>
                    <p className="mt-5 rounded-md border border-teal-200 bg-white px-4 py-3 text-sm font-bold text-teal-800">
                      {fileName}
                    </p>
                    <div className="mt-7 flex flex-wrap gap-3">
                      <label className="inline-flex h-11 cursor-pointer items-center rounded-md border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700">
                        <input type="file" accept="image/*,.pdf" onChange={(e) => void upload(e)} hidden />
                        Choose another
                      </label>
                      <PrimaryButton icon="fa-wand-magic-sparkles" onClick={() => void scanSelectedReceipt()}>
                        Extract receipt
                      </PrimaryButton>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mx-auto w-full max-w-5xl py-2">
                  <label
                    className="flex min-h-[410px] cursor-pointer flex-col items-center justify-center rounded-[8px] border-2 border-dashed border-slate-300 bg-white px-6 text-center transition hover:border-teal-500 hover:bg-teal-50/30"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const picked = event.dataTransfer.files?.[0];
                      if (picked) void prepareUpload(picked);
                    }}
                  >
                    <input type="file" accept="image/*,.pdf,.csv,.xlsx,.xls" onChange={(e) => void upload(e)} hidden />
                    <span className="flex h-20 w-20 items-center justify-center text-[62px] text-slate-400"><i className="far fa-folder-open" /></span>
                    <h3 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900">Upload your files</h3>
                    <p className="mt-2 text-base text-slate-600">Drag and drop files or <span className="font-semibold text-blue-600 underline underline-offset-2">browse</span></p>
                    <p className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-500">
                      <span>Upload any</span>
                      <span className="rounded-[5px] bg-blue-50 px-2 py-1 font-semibold text-blue-600">receipt</span>
                      <span className="rounded-[5px] bg-violet-50 px-2 py-1 font-semibold text-violet-600">invoice</span>
                      <span className="rounded-[5px] bg-orange-50 px-2 py-1 font-semibold text-orange-700">credit card statement</span>
                      <span>or</span>
                      <span className="rounded-[5px] bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">bank statement</span>
                    </p>
                    <p className="mt-4 text-sm font-medium text-slate-400">PDF, CSV, XLS, XLSX, JPG or PNG · up to 12 MB</p>
                  </label>
                  <div className="mt-6 flex min-h-16 items-center justify-between rounded-[8px] border border-slate-200 bg-white px-6">
                    <div className="flex items-center gap-3 text-slate-700"><i className="far fa-envelope text-slate-400" /><i className="far fa-comment-dots text-slate-400" /><span className="text-sm font-semibold">Other ways to add documents</span></div>
                    <button type="button" onClick={() => setMode("manual")} className="flex h-9 w-9 items-center justify-center text-slate-400 hover:text-teal-700" aria-label="Add a transaction manually"><i className="fas fa-chevron-right" /></button>
                  </div>
                </div>
              )}
            </Surface>
          ) : null}
          {mode === "manual" ? (
            <form onSubmit={(e) => void save(e)}>
              <Surface className="p-6 lg:p-9">
                <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 grid-cols-1">
                  <Field label="Amount" required>
                    <input
                      className={inputClass}
                      type="number"
                      inputMode="decimal"
                      value={draft.amount}
                      onChange={(e) =>
                        setDraft({ ...draft, amount: e.target.value })
                      }
                    />
                  </Field>
                  <Field
                    label={draft.type === "income" ? "Source" : "Merchant"}
                  >
                    <input
                      className={inputClass}
                      value={draft.merchant}
                      onChange={(e) =>
                        setDraft({ ...draft, merchant: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Category">
                    <select
                      className={inputClass}
                      value={draft.category}
                      onChange={(e) =>
                        setDraft({ ...draft, category: e.target.value })
                      }
                    >
                      {categoryNames.length ? (
                        categoryNames.map((name) => (
                          <option key={name}>{name}</option>
                        ))
                      ) : (
                        <option>{draft.category}</option>
                      )}
                    </select>
                  </Field>
                  <Field label="Date">
                    <input
                      className={inputClass}
                      type="date"
                      value={draft.date}
                      onChange={(e) =>
                        setDraft({ ...draft, date: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Account">
                    <select
                      className={inputClass}
                      value={draft.accountId}
                      onChange={(e) =>
                        setDraft({ ...draft, accountId: e.target.value })
                      }
                    >
                      <option value="">No linked account</option>
                      {(accounts ?? []).map((account) => (
                        <option
                          key={String(account.id)}
                          value={String(account.id)}
                        >
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Paid from / account">
                    <input
                      className={inputClass}
                      value={draft.paymentMethod}
                      onChange={(e) =>
                        setDraft({ ...draft, paymentMethod: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Notes" className="sm:col-span-2">
                    <textarea
                      className={textareaClass}
                      value={draft.description}
                      onChange={(e) =>
                        setDraft({ ...draft, description: e.target.value })
                      }
                    />
                  </Field>
                </div>
              </Surface>
              {receiptData ? (
                <ReceiptReview
                  imageUrl={receiptPreviewUrl}
                  data={receiptData}
                  onChange={setReceiptData}
                  categories={categoryNames}
                  formatMoney={formatMoney}
                />
              ) : (
                <Surface className="mt-6 p-6 lg:p-9">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="font-extrabold text-slate-900">Financial, vendor, tax and line-item details</h3>
                      <p className="mt-1 text-sm text-slate-500">Optional details for complete bookkeeping and tax evidence.</p>
                    </div>
                    <SecondaryButton icon="fa-plus" onClick={() => setReceiptData({ transaction_type: draft.type, merchant_name: draft.merchant, date: draft.date, payment_method: draft.paymentMethod, description: draft.description, currency: "USD", taxes: [], items: [] })}>Add details</SecondaryButton>
                  </div>
                </Surface>
              )}
              {message ? (
                <p className="mt-3 rounded-lg bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800">
                  {message}
                </p>
              ) : null}
              <div className="mt-5 flex justify-end gap-2">
                <SecondaryButton onClick={() => setAddOpen(false)}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton type="submit" icon="fa-check" disabled={busy}>
                  {busy ? "Saving…" : "Save transaction"}
                </PrimaryButton>
              </div>
            </form>
          ) : message ? (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              {message}
            </p>
          ) : null}
        </Drawer>
        <Drawer
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          title="Advanced filters"
          description="Narrow records without leaving the workspace"
        >
          <div className="space-y-4">
            <Field label="Category">
              <select
                className={inputClass}
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
              >
                <option value="">All categories</option>
                {(categories ?? []).map((category) => (
                  <option key={String(category.id)}>{category.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Account">
              <select
                className={inputClass}
                value={filters.accountId}
                onChange={(e) =>
                  setFilters({ ...filters, accountId: e.target.value })
                }
              >
                <option value="">All accounts</option>
                {(accounts ?? []).map((account) => (
                  <option key={String(account.id)} value={String(account.id)}>
                    {account.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="From">
                <input
                  type="date"
                  className={inputClass}
                  value={filters.start}
                  onChange={(e) =>
                    setFilters({ ...filters, start: e.target.value })
                  }
                />
              </Field>
              <Field label="To">
                <input
                  type="date"
                  className={inputClass}
                  value={filters.end}
                  onChange={(e) =>
                    setFilters({ ...filters, end: e.target.value })
                  }
                />
              </Field>
            </div>
            <Field label="Sort">
              <select
                className={inputClass}
                value={filters.sort}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    sort: e.target.value as Filters["sort"],
                  })
                }
              >
                <option value="newest">Date: newest first</option>
                <option value="oldest">Date: oldest first</option>
                <option value="highest">Amount: highest first</option>
              </select>
            </Field>
            <div className="flex justify-end gap-2">
              <SecondaryButton
                onClick={() =>
                  setFilters({ ...blankFilters, search: filters.search })
                }
              >
                Reset
              </SecondaryButton>
              <PrimaryButton
                icon="fa-check"
                onClick={() => setFilterOpen(false)}
              >
                Show results ({shown.length})
              </PrimaryButton>
            </div>
          </div>
        </Drawer>
        <Drawer
          open={Boolean(selected)}
          onClose={() => setSelected(null)}
          title="Transaction detail"
          description={selected?.id}
          width="max-w-none"
        >
          {selected ? (
            <>
              {!selected.receipt_data ? <>
              <div className="mb-5 rounded-xl bg-slate-950 p-5 text-white">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {selected.type}
                </p>
                <p
                  className={`mt-1 text-3xl font-black ${selected.type === "income" ? "text-emerald-300" : "text-rose-300"}`}
                >
                  {selected.type === "income" ? "+" : "-"}
                  {formatMoney(selected.amount)}
                </p>
                <p className="mt-2 text-sm font-bold">
                  {selected.merchant || selected.category}
                </p>
                <p className="text-xs text-slate-400">
                  {formatDate(selected.date)}
                </p>
              </div>
              <Surface>
                <div className="grid divide-y divide-slate-100">
                  <Detail
                    label="Category"
                    value={selected.category}
                    icon="fa-tags"
                  />
                  <Detail
                    label="Account"
                    value={
                      (accounts ?? []).find(
                        (account) => String(account.id) === selected.accountId,
                      )?.name ?? "No linked account"
                    }
                    icon="fa-wallet"
                  />
                  <Detail
                    label="Payment method"
                    value={selected.payment_method || "Not specified"}
                    icon="fa-credit-card"
                  />
                  <Detail
                    label="Notes"
                    value={selected.description || "No notes"}
                    icon="fa-note-sticky"
                  />
                </div>
              </Surface>
              </> : null}
              {selected.receipt_url || selected.receipt_data ? (
                <ReceiptReview
                  imageUrl={selected.evidence_url ?? ""}
                  data={{ ...((selected.receipt_data && typeof selected.receipt_data === "object" ? selected.receipt_data : {}) as ReceiptDetails), transaction_type: selected.type === "income" ? "income" : "expense", date: selected.date, category: selected.category, payment_method: selected.payment_method ?? undefined, account_name: (accounts ?? []).find((account) => String(account.id) === selected.accountId)?.name ?? "No linked account", total_amount: selected.amount }}
                  categories={(categories ?? []).filter((category) => category.kind === "expense").map((category) => category.name)}
                  formatMoney={formatMoney}
                  receiptUrl={selected.receipt_url ?? ""}
                />
              ) : null}
              {false && (selected.receipt_url || selected.receipt_data) ? (
                <Surface className="mt-4 p-4">
                  <SurfaceHeader title="Original evidence" />
                  {selected.evidence_url ? (
                    /\.pdf(?:\?|$)/i.test(selected.receipt_url || "") ? (
                      <iframe title="Original receipt document" src={selected.evidence_url} className="mt-3 h-80 w-full rounded-lg border border-slate-200" />
                    ) : (
                      <img src={selected.evidence_url} alt="Original uploaded receipt" className="mt-3 max-h-80 w-full rounded-lg bg-slate-100 object-contain" />
                    )
                  ) : (
                    <div className="mt-3 flex h-40 items-center justify-center rounded-lg bg-slate-100 text-slate-400"><i className="fas fa-receipt text-4xl" /></div>
                  )}
                  {selected.evidence_url ? <a href={selected.evidence_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-teal-700"><i className="fas fa-up-right-from-square" />Open full evidence</a> : null}
                  {(() => {
                    const data = selected.receipt_data && typeof selected.receipt_data === "object" ? selected.receipt_data as { subtotal?: number; tax_amount?: number; items?: Array<{ name?: string; quantity?: number; price?: number }> } : null;
                    if (!data) return null;
                    return <div className="mt-4 border-t border-slate-100 pt-3">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-500">Extracted details</p>
                      {data.subtotal != null ? <Detail label="Subtotal" value={formatMoney(data.subtotal)} icon="fa-calculator" /> : null}
                      {data.tax_amount != null ? <Detail label="Tax" value={formatMoney(data.tax_amount)} icon="fa-receipt" /> : null}
                      {data.items?.map((item, index) => <div key={`${item.name}-${index}`} className="flex justify-between gap-3 border-t border-slate-100 py-2 text-sm"><span>{item.name || `Item ${index + 1}`}{item.quantity && item.quantity !== 1 ? ` × ${item.quantity}` : ""}</span><strong>{item.price != null ? formatMoney(item.price) : "—"}</strong></div>)}
                    </div>;
                  })()}
                </Surface>
              ) : null}
              <div className="mt-5 flex gap-2">
                <PrimaryButton
                  icon="fa-pen"
                  onClick={() => setEditing(selected)}
                >
                  Edit transaction
                </PrimaryButton>
                <SecondaryButton
                  danger
                  icon="fa-trash"
                  onClick={() => void remove(selected)}
                >
                  Delete
                </SecondaryButton>
              </div>
            </>
          ) : null}
        </Drawer>
        <TransactionEditDialog
          open={Boolean(editing)}
          transaction={editing}
          onClose={() => setEditing(null)}
          workspace={workspace}
          userId={user?.id ?? ""}
          token={token}
        />
        <Modal
          open={processing}
          onClose={() => {}}
          title="Processing receipt"
          description={fileName}
        >
          <div className="grid gap-5 sm:grid-cols-[180px_1fr] grid-cols-1">
            <div className="flex h-64 items-center justify-center overflow-hidden rounded-xl bg-slate-100 p-3">
              {receiptPreviewUrl ? <img src={receiptPreviewUrl} alt="Receipt being processed" className="h-full w-full object-contain" /> : <div className="text-center"><i className="fas fa-receipt text-4xl text-slate-400" /><p className="mt-3 text-xs font-bold">{fileName}</p></div>}
            </div>
            <div className="space-y-4">
              {[
                "Analyzing image",
                "Detecting receipt text",
                "Extracting fields",
                "Preparing review",
              ].map((label, index) => (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${processStep > index ? "bg-teal-600 text-white" : processStep === index ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-400"}`}
                  >
                    {processStep > index ? (
                      <i className="fas fa-check text-xs" />
                    ) : processStep === index ? (
                      <i className="fas fa-circle-notch fa-spin text-xs" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <p
                    className={`text-sm font-bold ${processStep >= index ? "text-slate-900" : "text-slate-400"}`}
                  >
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-teal-600 transition-all"
              style={{ width: `${processStep * 25}%` }}
            />
          </div>
        </Modal>
      </div>
    </AppChrome>
  );
}

function Detail({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <IconBox icon={icon} tone="blue" />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

export function ReceiptReview({
  imageUrl,
  data,
  onChange,
  categories,
  formatMoney,
  receiptUrl,
}: {
  imageUrl: string;
  data: ReceiptDetails;
  onChange?: (data: ReceiptDetails) => void;
  categories: string[];
  formatMoney: (value: number) => string;
  receiptUrl?: string;
}) {
  const [showMore, setShowMore] = useState(true);
  const [categorizeItems, setCategorizeItems] = useState(true);
  const taxes = data.taxes?.length
    ? data.taxes
    : data.tax_amount != null
      ? [{ type: "Sales Tax", amount: data.tax_amount }]
      : [];
  const items = data.items ?? [];
  const change = (next: Partial<ReceiptDetails>) => onChange?.({ ...data, ...next });

  return (
    <Surface className="overflow-hidden">
      <SurfaceHeader
        title={data.merchant_name || "Extracted receipt details"}
        description="Compare every extracted field with the original evidence before saving."
      />
      <div className="grid min-h-[38rem] lg:grid-cols-[minmax(320px,0.9fr)_minmax(520px,1.1fr)] grid-cols-1">
        <div className="border-b border-slate-200 bg-slate-100 p-6 lg:border-b-0 lg:border-r lg:p-8">
          <div className="sticky top-8 flex min-h-[32rem] items-start justify-center rounded-md bg-white p-5 shadow-sm">
            {imageUrl ? (
              /\.pdf(?:\?|$)/i.test(receiptUrl || imageUrl) ? (
                <iframe title="Original receipt document" src={imageUrl} className="h-[42rem] w-full" />
              ) : (
                <img src={imageUrl} alt="Original receipt evidence" className="max-h-[48rem] w-full object-contain" />
              )
            ) : (
              <div className="flex min-h-80 items-center justify-center text-slate-400"><i className="fas fa-receipt text-5xl" /></div>
            )}
          </div>
          {imageUrl ? <a href={imageUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-teal-700"><i className="fas fa-up-right-from-square" />Open full evidence</a> : null}
        </div>
        <div className="space-y-10 p-6 lg:p-9">
          <section>
            <h3 className="text-base font-extrabold">Basic information</h3>
            <div className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2 grid-cols-1">
              <Info label="Transaction type" value={data.transaction_type === "income" ? "Income" : "Expense"} />
              <Info label="Date" value={data.date || "Not detected"} />
              <Info label="Currency" value={data.currency || "Not detected"} />
              <Info label="Category" value={String(data.category || "Not detected")} />
              <Info label="Linked account" value={data.account_name || "No linked account"} />
              <Info label="Payment method" value={data.payment_method || "Not detected"} />
            </div>
            <div className="mt-6 flex items-center justify-between gap-5 border-t border-slate-100 pt-5">
              <div><p className="text-sm font-bold">Line-item categorization</p><p className="mt-1 text-xs text-slate-500">Categorize every purchased item separately.</p></div>
              <button type="button" role="switch" aria-checked={categorizeItems} onClick={() => setCategorizeItems((value) => !value)} className={`relative h-7 w-12 rounded-full transition ${categorizeItems ? "bg-teal-600" : "bg-slate-300"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${categorizeItems ? "left-6" : "left-1"}`} /></button>
            </div>
          </section>

          <section className="border-t border-slate-200 pt-8">
            <h3 className="text-base font-extrabold">Financial details</h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-3 grid-cols-1">
              <Info label="Subtotal" value={data.subtotal != null ? formatMoney(data.subtotal) : "—"} />
              <Info label="Tax total" value={data.tax_amount != null ? formatMoney(data.tax_amount) : "—"} />
              <Info label="Total amount" value={data.total_amount != null ? formatMoney(data.total_amount) : "—"} strong />
            </div>
            <button type="button" onClick={() => setShowMore((value) => !value)} className="mt-6 h-11 rounded-md border border-slate-300 px-5 text-sm font-bold text-slate-700"><i className={`fas ${showMore ? "fa-chevron-up" : "fa-chevron-down"} mr-2 text-xs`} />{showMore ? "Hide" : "Show"} additional details</button>
          </section>

          {showMore ? <>
            <section className="border-t border-slate-200 pt-8">
              <h3 className="text-base font-extrabold">Vendor details</h3>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 grid-cols-1"><Info label="Vendor address" value={data.merchant_address || "Not detected"} /><Info label="Receipt number" value={data.receipt_number || "Not detected"} /><Info label="Country" value={data.country || "Not detected"} /></div>
            </section>
            <section className="border-t border-slate-200 pt-8">
              <h3 className="text-base font-extrabold">Payment and tax details</h3>
              <div className="mt-5 grid gap-5 sm:grid-cols-3 grid-cols-1"><Info label="Payment method" value={data.payment_method || "Not detected"} /><Info label="Card type" value={data.card_type || "Not detected"} /><Info label="Card last 4" value={data.card_last4 || "Not detected"} /></div>
              <div className="mt-7 space-y-3">
                {taxes.map((tax, index) => <div key={`${tax.type}-${index}`} className="grid items-center gap-3 rounded-md bg-slate-50 p-4 sm:grid-cols-[1fr_140px_auto] grid-cols-1">
                  <select disabled={!onChange} className={inputClass} value={tax.type || "Other"} onChange={(event) => change({ taxes: taxes.map((row, rowIndex) => rowIndex === index ? { ...row, type: event.target.value } : row) })}>{TAX_TYPES.map((type) => <option key={type}>{type}</option>)}</select>
                  <input disabled={!onChange} className={inputClass} type="number" value={tax.amount ?? ""} onChange={(event) => change({ taxes: taxes.map((row, rowIndex) => rowIndex === index ? { ...row, amount: Number(event.target.value) } : row) })} />
                  {onChange ? <button type="button" aria-label="Delete tax line" onClick={() => change({ taxes: taxes.filter((_, rowIndex) => rowIndex !== index) })} className="h-11 w-11 text-rose-600"><i className="fas fa-trash" /></button> : null}
                </div>)}
                {onChange ? <button type="button" onClick={() => change({ taxes: [...taxes, { type: "Sales Tax", amount: 0 }] })} className="text-sm font-bold text-teal-700"><i className="fas fa-plus mr-2" />Add tax line</button> : null}
              </div>
            </section>
            <section className="border-t border-slate-200 pt-8"><h3 className="text-base font-extrabold">Additional information</h3><div className="mt-5 grid gap-5 sm:grid-cols-2 grid-cols-1"><Info label="Description" value={data.description || "Not detected"} /><Info label="Country" value={data.country || "Not detected"} /></div></section>
          </> : null}

          <section className="border-t border-slate-200 pt-8">
            <div className="grid grid-cols-[minmax(0,1fr)_70px_100px_100px_minmax(130px,0.7fr)_40px] gap-3 px-3 text-[10px] font-black uppercase tracking-wider text-slate-500"><span>Description</span><span>Qty</span><span>Unit price</span><span>Total</span><span>{categorizeItems ? "Category" : ""}</span><span /></div>
            <div className="mt-2 divide-y divide-slate-100 rounded-md border border-slate-200">
              {items.map((item, index) => {
                const unit = item.unit_price ?? item.price ?? 0;
                const total = item.total ?? unit * (item.quantity ?? 1);
                return <div key={`${item.name}-${index}`} className="grid grid-cols-[minmax(0,1fr)_70px_100px_100px_minmax(130px,0.7fr)_40px] items-center gap-3 p-3 text-sm"><span className="font-bold">{item.name || `Item ${index + 1}`}</span><span>{item.quantity ?? 1}</span><span>{formatMoney(unit)}</span><span>{formatMoney(total)}</span><span>{categorizeItems ? (onChange ? <select className={inputClass} value={item.category || String(data.category || categories[0] || "Other")} onChange={(event) => change({ items: items.map((row, rowIndex) => rowIndex === index ? { ...row, category: event.target.value } : row) })}>{categories.map((category) => <option key={category}>{category}</option>)}</select> : item.category || String(data.category || "Other")) : ""}</span>{onChange ? <button type="button" aria-label={`Delete ${item.name || "item"}`} onClick={() => change({ items: items.filter((_, rowIndex) => rowIndex !== index) })} className="text-rose-600"><i className="fas fa-trash" /></button> : <span />}</div>;
              })}
              {!items.length ? <p className="p-6 text-sm text-slate-500">No line items were detected. Review the original receipt before saving.</p> : null}
            </div>
          </section>
        </div>
      </div>
    </Surface>
  );
}

function Info({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className={`mt-1 text-sm ${strong ? "font-black text-slate-950" : "font-semibold text-slate-700"}`}>{value}</p></div>;
}
