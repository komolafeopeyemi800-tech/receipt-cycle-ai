import { useEffect, useMemo, useState } from "react";
import { api, useMutation } from "@mobile-lib/api";
import { useWebAuth } from "@/contexts/WebAuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { apiClient } from "@/lib/api";
import { money } from "@/lib/money";
import { DocumentPages, useDocumentLayout } from "@/components/documents/DocumentSheet";
import { AppChrome } from "@/components/layout/AppChrome";
import { VoiceQuickAddWeb, type VoiceDraft } from "@/components/dashboard/VoiceQuickAddWeb";
import { Drawer, EmptyState, Field, IconBox, MobileList, MobileRow, Modal, PrimaryButton, SecondaryButton, Segmented, StatCard, StatusPill, Surface, SurfaceHeader, WorkspaceHeader, inputClass, textareaClass } from "@/components/workspace/DesktopWorkspaceUI";
import {
  addDaysLocal,
  documentTotal,
  estimateStatus,
  invoiceBalance,
  invoiceStatus,
  invoiceSubtotal,
  localDate,
  nextDocNumber,
  openBalance,
  paymentTermDays,
  type DesktopEstimate,
  type DesktopCustomer,
  type DesktopInvoice,
  type DesktopLineItem,
  type DesktopPayment,
  useDesktopBusiness,
} from "@/contexts/DesktopBusinessContext";

const today = () => localDate();
const plusDays = (days: number) => addDaysLocal(days);
const normalizedItemName = (value: string) => value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
function inferCatalogKind(name: string, description: string): "service" | "product" {
  const value = `${name} ${description}`.toLocaleLowerCase();
  const productTerms = ["product", "item", "unit", "material", "equipment", "device", "part", "supply", "goods"];
  const serviceTerms = ["service", "consult", "design", "repair", "install", "audit", "training", "development", "maintenance", "labor"];
  const productScore = productTerms.filter((term) => value.includes(term)).length;
  const serviceScore = serviceTerms.filter((term) => value.includes(term)).length;
  return productScore > serviceScore ? "product" : "service";
}
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <AppChrome>
      <div className="min-h-full text-slate-900">{children}</div>
    </AppChrome>
  );
}
function customerName(
  id: string,
  customers: ReturnType<typeof useDesktopBusiness>["customers"],
) {
  return (
    customers.find((customer) => customer.id === id)?.company ??
    "Select customer"
  );
}

function CustomerCreator({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (customer: DesktopCustomer) => void }) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const submit = () => {
    if (!name.trim() && !company.trim()) return;
    onCreate({ id: `customer-${Date.now()}`, name: name.trim() || company.trim(), company: company.trim() || name.trim(), email: email.trim(), phone: phone.trim(), address: address.trim(), status: "active", notes: "" });
    setName(""); setCompany(""); setEmail(""); setPhone(""); setAddress("");
  };
  return <Modal open={open} onClose={onClose} title="Add New Customer" description="Enter the billing and contact details for this document." width="max-w-3xl">
    <div className="grid gap-6 pt-3 sm:grid-cols-2 grid-cols-1">
      <Field label="Customer name" required><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Business name"><input className={inputClass} value={company} onChange={(e) => setCompany(e.target.value)} /></Field>
      <Field label="Email"><input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      <Field label="Phone"><input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
      <Field label="Billing address" className="sm:col-span-2"><textarea className={textareaClass} value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
    </div>
    <div className="mt-6 flex justify-end gap-2"><SecondaryButton onClick={onClose}>Cancel</SecondaryButton><PrimaryButton icon="fa-user-plus" onClick={submit}>Add customer</PrimaryButton></div>
  </Modal>;
}
function newLine(): DesktopLineItem {
  return {
    id: `line-${Date.now()}-${Math.random()}`,
    name: "",
    description: "",
    quantity: 1,
    rate: 0,
  };
}

function DocumentAutomationControls({
  noun,
  recurring,
  frequency,
  startDate,
  reminders,
  onRecurring,
  onFrequency,
  onStartDate,
  onReminders,
}: {
  noun: "invoice" | "estimate";
  recurring: boolean;
  frequency: NonNullable<DesktopInvoice["recurrenceFrequency"]>;
  startDate: string;
  reminders: boolean;
  onRecurring: (value: boolean) => void;
  onFrequency: (value: NonNullable<DesktopInvoice["recurrenceFrequency"]>) => void;
  onStartDate: (value: string) => void;
  onReminders: (value: boolean) => void;
}) {
  const Toggle = ({ value, onChange, label }: { value: boolean; onChange: (value: boolean) => void; label: string }) => (
    <button type="button" role="switch" aria-checked={value} aria-label={label} onClick={() => onChange(!value)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${value ? "bg-teal-700" : "bg-slate-200"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${value ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
  return <Surface className="mt-6 overflow-hidden">
    <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
      <IconBox icon="fa-arrows-rotate" tone="blue" />
      <div className="min-w-0 flex-1"><p className="text-sm font-extrabold text-slate-900">Make this a recurring {noun}</p><p className="mt-1 text-xs text-slate-500">Automatically create the next {noun} on your schedule.</p></div>
      <Toggle value={recurring} onChange={onRecurring} label={`Recurring ${noun}`} />
    </div>
    {recurring ? <div className="grid gap-5 border-t border-slate-100 bg-slate-50/40 px-5 py-5 sm:grid-cols-2 sm:px-6 grid-cols-1">
      <Field label="Frequency"><select className={inputClass} value={frequency} onChange={(event) => onFrequency(event.target.value as NonNullable<DesktopInvoice["recurrenceFrequency"]>)}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option></select></Field>
      <Field label="Start date"><input type="date" className={inputClass} value={startDate} onChange={(event) => onStartDate(event.target.value)} /></Field>
    </div> : null}
    <div className="flex items-center gap-4 border-t border-slate-100 px-5 py-5 sm:px-6">
      <IconBox icon="fa-bell" tone="violet" />
      <div className="min-w-0 flex-1"><p className="text-sm font-extrabold text-slate-900">Automated reminders</p><p className="mt-1 text-xs text-slate-500">Send automatic follow-ups if this {noun} becomes overdue.</p></div>
      <Toggle value={reminders} onChange={onReminders} label={`Automated ${noun} reminders`} />
    </div>
  </Surface>;
}

function ProgressSteps({
  labels,
  current,
}: {
  labels: string[];
  current: number;
}) {
  return (
    <div className="mb-5 flex items-start">
      {labels.map((label, index) => (
        <div key={label} className="flex flex-1 items-start">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold ${index + 1 <= current ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-500"}`}
            >
              {index + 1 < current ? <i className="fas fa-check" /> : index + 1}
            </div>
            <span
              className={`mt-1 text-[10px] font-bold ${index + 1 === current ? "text-teal-700" : "text-slate-400"}`}
            >
              {label}
            </span>
          </div>
          {index < labels.length - 1 ? (
            <div
              className={`mt-4 h-px flex-1 ${index + 1 < current ? "bg-teal-600" : "bg-slate-200"}`}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function InvoiceBuilder({
  open,
  onClose,
  invoice,
}: {
  open: boolean;
  onClose: () => void;
  invoice?: DesktopInvoice | null;
}) {
  const {
    customers,
    items: catalog,
    invoices,
    invoicePreferences,
    saveItem,
    saveInvoice,
    saveCustomer,
    ready,
  } = useDesktopBusiness();
  const [step, setStep] = useState(1);
  const [customerId, setCustomerId] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [issueDate, setIssueDate] = useState(today());
  const [dueDate, setDueDate] = useState(plusDays(30));
  const [lines, setLines] = useState<DesktopLineItem[]>([newLine()]);
  const [discountPct, setDiscount] = useState(0);
  const [taxPct, setTax] = useState(invoicePreferences.taxRate);
  const [notes, setNotes] = useState(invoicePreferences.notes);
  const [recurringEnabled, setRecurringEnabled] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<NonNullable<DesktopInvoice["recurrenceFrequency"]>>("monthly");
  const [recurrenceStartDate, setRecurrenceStartDate] = useState(today());
  const [automatedReminders, setAutomatedReminders] = useState(true);
  const number =
    invoice?.number ??
    nextDocNumber(
      invoicePreferences.prefix || "INV",
      invoices.map((row) => row.number),
    );
  // Local data loads after mount and this drawer stays mounted while closed: start every opening from fresh defaults.
  useEffect(() => {
    if (!open || !ready) return;
    setStep(1);
    setCustomerId(invoice?.customerId ?? "");
    setTitle(invoice?.title ?? "");
    setIssueDate(invoice?.issueDate ?? today());
    setDueDate(
      invoice?.dueDate ??
        plusDays(paymentTermDays(invoicePreferences.paymentTerms)),
    );
    setLines(invoice?.items.map((line) => ({ ...line })) ?? [newLine()]);
    setDiscount(invoice?.discountPct ?? 0);
    setTax(invoice?.taxPct ?? invoicePreferences.taxRate);
    setNotes(invoice?.notes ?? invoicePreferences.notes);
    setRecurringEnabled(invoice?.recurringEnabled ?? false);
    setRecurrenceFrequency(invoice?.recurrenceFrequency ?? "monthly");
    setRecurrenceStartDate(invoice?.recurrenceStartDate ?? invoice?.issueDate ?? today());
    setAutomatedReminders(invoice?.automatedReminders ?? true);
  }, [open, ready, invoice]); // eslint-disable-line react-hooks/exhaustive-deps
  const updateLine = (id: string, patch: Partial<DesktopLineItem>) =>
    setLines(
      lines.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
  const addFromCatalog = (id: string) => {
    const item = catalog.find((row) => row.id === id);
    if (item)
      setLines([
        ...lines.filter((line) => line.name || line.rate),
        {
          id: newLine().id,
          name: item.name,
          description: item.description,
          quantity: 1,
          rate: item.price,
          catalogItemId: item.id,
        },
      ]);
  };
  const save = (status: DesktopInvoice["status"]) => {
    const validLines = lines.filter(
      (line) => line.name && line.rate > 0 && line.quantity > 0,
    );
    const catalogLines = validLines.map((line) => {
      if (line.catalogItemId) return line;
      const existing = catalog.find((item) => normalizedItemName(item.name) === normalizedItemName(line.name));
      if (existing) return { ...line, catalogItemId: existing.id };
      const catalogItemId = `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      saveItem({ id: catalogItemId, name: line.name.trim(), description: line.description.trim(), kind: inferCatalogKind(line.name, line.description), price: line.rate, category: "Uncategorized", active: true });
      return { ...line, catalogItemId };
    });
    const next: DesktopInvoice = {
      id: invoice?.id ?? `inv-${Date.now()}`,
      number,
      title: title.trim() || undefined,
      customerId,
      issueDate,
      dueDate,
      status:
        invoice?.status === "paid" || invoice?.status === "partially_paid"
          ? invoice.status
          : status,
      items: catalogLines,
      discountPct,
      discountFixed: invoice?.discountFixed,
      shipping: invoice?.shipping,
      taxPct,
      paidAmount: invoice?.paidAmount ?? 0,
      notes,
      recurringEnabled,
      recurrenceFrequency,
      recurrenceStartDate,
      automatedReminders,
      // Keep everything the phone stored on this invoice (signature, terms, tax label, attachment...); a new invoice
      // starts with the signature line on when the person chose that in the invoice style settings.
      _raw: invoice?._raw ?? (invoicePreferences.docOptions?.INVOICE?.signatureDefault ? { signatureEnabled: true } : undefined),
    };
    if (next.dueDate < next.issueDate || (status !== "draft" && (!next.customerId || !next.items.length)))
      return;
    saveInvoice(next);
    onClose();
  };
  const previewInvoice = useMemo<DesktopInvoice | null>(
    () => step === 4 ? { id: invoice?.id ?? "preview", number, title: title.trim() || undefined, customerId, issueDate, dueDate, status: "draft", items: lines.filter((line) => line.name || line.rate), discountPct, discountFixed: invoice?.discountFixed, shipping: invoice?.shipping, taxPct, paidAmount: invoice?.paidAmount ?? 0, notes, _raw: invoice?._raw ?? (invoicePreferences.docOptions?.INVOICE?.signatureDefault ? { signatureEnabled: true } : undefined) } : null,
    [step, invoice, number, title, customerId, issueDate, dueDate, lines, discountPct, taxPct, notes, invoicePreferences.docOptions],
  );
  const { layout: previewLayout } = useDocumentLayout("INVOICE", previewInvoice);
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={invoice ? "Edit invoice" : "Create invoice"}
      description={`${number} · ${invoice ? "Update" : "Draft"}`}
      width="max-w-none"
    >
      <VoiceQuickAddWeb onParsed={(draft: VoiceDraft) => {
        if (draft.customerName) {
          const match = customers.find((customer) => `${customer.name} ${customer.company}`.toLowerCase().includes(draft.customerName!.toLowerCase()));
          if (match) setCustomerId(match.id);
        }
        if (draft.itemName || draft.description) setLines([{ ...newLine(), name: draft.itemName || draft.description || "Service", description: draft.description || "", quantity: draft.quantity && draft.quantity > 0 ? draft.quantity : 1, rate: draft.rate ?? draft.amount ?? 0 }]);
        if (draft.dueDate) setDueDate(draft.dueDate);
        if (draft.description) setNotes(draft.description);
      }} />
      <div className="h-5" />
      <ProgressSteps
        labels={["Basic info", "Items", "Totals", "Review"]}
        current={step}
      />
      {step === 1 ? (
        <Surface className="p-5">
          <div className="grid gap-4 sm:grid-cols-3 grid-cols-1">
            <Field label="Invoice number">
              <input className={inputClass} value={number} disabled />
            </Field>
            <Field label="Issue date">
              <input
                type="date"
                className={inputClass}
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </Field>
            <Field label="Due date">
              <input
                type="date"
                min={issueDate}
                className={inputClass}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </Field>
            <Field label="Invoice title (optional)" className="sm:col-span-3">
              <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Website design project" />
            </Field>
            <Field label="Customer" required className="sm:col-span-3">
              <div className="mb-2 flex justify-end"><button type="button" onClick={() => setCustomerOpen(true)} className="text-sm font-bold text-indigo-600"><i className="fas fa-user-plus mr-2" />Add New Customer</button></div>
              <select
                className={inputClass}
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">{customers.length ? "Select a customer" : "No customers found"}</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.company} · {customer.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Surface>
      ) : null}
      <CustomerCreator open={customerOpen} onClose={() => setCustomerOpen(false)} onCreate={(customer) => { saveCustomer(customer); setCustomerId(customer.id); setCustomerOpen(false); }} />
      {step === 2 ? (
        <Surface>
          <SurfaceHeader
            title="Items & services"
            action={
              <select
                className="h-9 rounded-lg border border-slate-200 px-2 text-xs font-bold"
                defaultValue=""
                onChange={(e) => {
                  addFromCatalog(e.target.value);
                  e.target.value = "";
                }}
              >
                <option value="">Add from catalog…</option>
                {catalog.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            }
          />
          <div className="divide-y divide-slate-100">
            {lines.map((line) => (
              <div
                key={line.id}
                className="grid gap-2 p-4 sm:grid-cols-[1fr_90px_120px_40px] grid-cols-1"
              >
                <input
                  className={`${inputClass} mt-0`}
                  placeholder="Item or service"
                  value={line.name}
                  onChange={(e) =>
                    updateLine(line.id, { name: e.target.value })
                  }
                />
                <input
                  className={`${inputClass} mt-0`}
                  type="number"
                  min="1"
                  value={line.quantity}
                  onChange={(e) =>
                    updateLine(line.id, { quantity: Number(e.target.value) })
                  }
                />
                <input
                  className={`${inputClass} mt-0`}
                  type="number"
                  value={line.rate}
                  onChange={(e) =>
                    updateLine(line.id, { rate: Number(e.target.value) })
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    setLines(lines.filter((row) => row.id !== line.id))
                  }
                  className="h-10 rounded-lg text-rose-600 hover:bg-rose-50"
                >
                  <i className="fas fa-trash" />
                </button>
                <input
                  className={`${inputClass} mt-0 sm:col-span-3`}
                  placeholder="Description"
                  value={line.description}
                  onChange={(e) =>
                    updateLine(line.id, { description: e.target.value })
                  }
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            className="m-4 text-xs font-extrabold text-teal-700"
            onClick={() => setLines([...lines, newLine()])}
          >
            <i className="fas fa-plus mr-2" />
            Add line item
          </button>
        </Surface>
      ) : null}
      {step === 3 ? (
        <><div className="grid gap-6 lg:grid-cols-2 grid-cols-1">
          <Surface className="p-5">
            <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 grid-cols-1">
              <Field label="Discount %">
                <input
                  className={inputClass}
                  type="number"
                  value={discountPct}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </Field>
              <Field label="Tax %">
                <input
                  className={inputClass}
                  type="number"
                  value={taxPct}
                  onChange={(e) => setTax(Number(e.target.value))}
                />
              </Field>
              <Field label="Notes & terms" className="sm:col-span-2">
                <textarea
                  className={textareaClass}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Field>
            </div>
          </Surface>
          <Surface className="p-5">
            <p className="text-xs font-bold uppercase text-slate-400">
              Invoice total
            </p>
            <p className="mt-2 text-3xl font-black text-teal-800">
              {money(documentTotal({ items: lines, discountPct, taxPct }))}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Subtotal {money(invoiceSubtotal({ items: lines }))}
            </p>
          </Surface>
        </div><DocumentAutomationControls noun="invoice" recurring={recurringEnabled} frequency={recurrenceFrequency} startDate={recurrenceStartDate} reminders={automatedReminders} onRecurring={setRecurringEnabled} onFrequency={setRecurrenceFrequency} onStartDate={setRecurrenceStartDate} onReminders={setAutomatedReminders} /></>
      ) : null}
      {step === 4 ? (
        <DocumentPages layout={previewLayout} />
      ) : null}
      <div className="mt-8 flex flex-col-reverse justify-between gap-3 border-t border-slate-200 pt-5 sm:flex-row">
        <SecondaryButton
          icon="fa-arrow-left"
          onClick={() => (step === 1 ? onClose() : setStep(step - 1))}
        >
          {step === 1 ? "Cancel" : "Back"}
        </SecondaryButton>
        <div className="flex flex-col-reverse gap-2 sm:flex-row"><SecondaryButton icon="fa-floppy-disk" onClick={() => save("draft")}>Save as draft</SecondaryButton>{step < 4 ? (
          <PrimaryButton
            icon="fa-arrow-right"
            onClick={() => setStep(step + 1)}
          >
            Continue
          </PrimaryButton>
        ) : (
          <div className="flex gap-2">
            <PrimaryButton icon="fa-paper-plane" onClick={() => save("sent")}>
              Save & send
            </PrimaryButton>
          </div>
        )}</div>
      </div>
    </Drawer>
  );
}

export function InvoicesPage() {
  const {
    invoices,
    customers,
    payments,
    saveInvoice,
    recordPayment,
    removeInvoice,
  } = useDesktopBusiness();
  const { user, token } = useWebAuth();
  const { workspace } = useWorkspace();
  const createTx = useMutation(api.transactions.create);
  const params = new URLSearchParams(window.location.search);
  const [builder, setBuilder] = useState(params.get("create") === "1");
  const [selectedId, setSelectedId] = useState<string | null>(
    params.get("invoice"),
  );
  const [preview, setPreview] = useState<DesktopInvoice | null>(null);
  const { layout: previewLayout, print: printPreview } = useDocumentLayout("INVOICE", preview);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [method, setMethod] = useState("Bank Transfer");
  const [successPayment, setSuccessPayment] = useState<DesktopPayment | null>(
    null,
  );
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<DesktopInvoice | null>(null);
  const selected =
    invoices.find((invoice) => invoice.id === selectedId) ?? null;
  const shown = invoices.filter(
    (invoice) => filter === "all" || invoiceStatus(invoice) === filter,
  );
  const selectedPayments = selected
    ? payments.filter((payment) => payment.invoiceId === selected.id)
    : [];
  const duplicateInvoice = (source: DesktopInvoice) => {
    const prefix = source.number.split("-")[0] || "INV";
    const copy: DesktopInvoice = {
      ...source,
      id: `inv-${Date.now()}`,
      number: nextDocNumber(
        prefix,
        invoices.map((row) => row.number),
      ),
      status: "draft",
      paidAmount: 0,
      issueDate: today(),
      dueDate: plusDays(30),
      items: source.items.map((item) => ({ ...item, id: newLine().id })),
    };
    saveInvoice(copy);
    setSelectedId(copy.id);
  };
  const submitPayment = () => {
    if (!selected) return;
    const payment = recordPayment(selected.id, paymentAmount, method);
    if (payment) {
      setPaymentOpen(false);
      setSuccessPayment(payment);
      if (user?.id && token)
        void createTx({
          workspace,
          userId: String(user.id),
          token,
          amount: payment.amount,
          type: "income",
          category: "Client Payment",
          merchant:
            customers.find((c) => c.id === selected.customerId)?.name ??
            selected.number,
          date: payment.date,
          description: `Payment for ${selected.number}`,
          payment_method: method,
          tags: ["payment", selected.number],
          is_recurring: false,
          entrySource: "manual",
        }).catch(() => undefined);
    }
  };
  return (
    <Shell>
      <WorkspaceHeader
        eyebrow="Sales documents"
        title="Invoices"
        description="Open an invoice workspace to preview, send, share, or review payment history."
        actions={
          <PrimaryButton
            onClick={() => {
              setEditing(null);
              setBuilder(true);
            }}
          >
            Create invoice
          </PrimaryButton>
        }
      />
      <Surface>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Segmented
            options={
              [
                { value: "all", label: "All" },
                { value: "draft", label: "Draft" },
                { value: "sent", label: "Sent" },
                { value: "paid", label: "Paid" },
                { value: "partially_paid", label: "Partial" },
                { value: "overdue", label: "Overdue" },
              ] as const
            }
            value={filter}
            onChange={setFilter}
          />
          <p className="text-xs text-slate-500">{shown.length} invoices</p>
        </div>
        <MobileList>
          {shown.map((invoice) => {
            const owed = invoiceBalance(invoice);
            const status = invoiceStatus(invoice);
            return (
              <MobileRow
                key={invoice.id}
                onClick={() => setSelectedId(invoice.id)}
                label={`Open invoice ${invoice.number}`}
                lead={<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><i className="fas fa-file-invoice-dollar" /></span>}
                title={customerName(invoice.customerId, customers)}
                subtitle={invoice.number}
                lines={[`Due ${invoice.dueDate}`, owed > 0 && status !== "draft" ? `Balance ${money(owed)}` : null]}
                amount={money(documentTotal(invoice))}
                badge={<StatusPill status={status} />}
              />
            );
          })}
        </MobileList>
        <div className="hidden overflow-x-auto xl:block">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th>Customer</th>
                <th>Issue date</th>
                <th>Due date</th>
                <th>Status</th>
                <th>Total</th>
                <th>Balance</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => setSelectedId(invoice.id)}
                >
                  <td className="px-4 py-3 font-extrabold text-slate-900">
                    {invoice.number}
                  </td>
                  <td>{customerName(invoice.customerId, customers)}</td>
                  <td>{invoice.issueDate}</td>
                  <td>{invoice.dueDate}</td>
                  <td>
                    <StatusPill status={invoiceStatus(invoice)} />
                  </td>
                  <td className="font-bold">{money(documentTotal(invoice))}</td>
                  <td className="font-extrabold">
                    {money(invoiceBalance(invoice))}
                  </td>
                  <td>
                    <i className="fas fa-chevron-right text-xs text-slate-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>
      <InvoiceBuilder
        open={builder}
        invoice={editing}
        onClose={() => {
          setBuilder(false);
          setEditing(null);
        }}
      />
      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected?.number ?? "Invoice detail"}
        description={
          selected ? customerName(selected.customerId, customers) : undefined
        }
        width="max-w-none"
      >
        {selected ? (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              <PrimaryButton icon="fa-eye" onClick={() => setPreview(selected)}>
                Preview
              </PrimaryButton>
              <SecondaryButton
                icon="fa-pen"
                onClick={() => {
                  setEditing(selected);
                  setBuilder(true);
                }}
              >
                Edit
              </SecondaryButton>
              <SecondaryButton
                icon="fa-copy"
                onClick={() => duplicateInvoice(selected)}
              >
                Duplicate
              </SecondaryButton>
              <SecondaryButton
                icon="fa-paper-plane"
                onClick={() => {
                  if (selected.status === "draft")
                    saveInvoice({ ...selected, status: "sent" });
                  window.location.href = `mailto:?subject=${encodeURIComponent(selected.number)}&body=${encodeURIComponent(`Please find invoice ${selected.number} for ${money(documentTotal(selected))}.`)}`;
                }}
              >
                Send
              </SecondaryButton>
              <SecondaryButton
                icon="fa-credit-card"
                onClick={() => {
                  setPaymentAmount(invoiceBalance(selected));
                  setPaymentOpen(true);
                }}
              >
                Record payment
              </SecondaryButton>
              <SecondaryButton
                danger
                icon="fa-trash"
                onClick={() => {
                  if (
                    window.confirm(
                      "Delete this invoice? This also removes it from your mobile app.",
                    )
                  ) {
                    removeInvoice(selected.id);
                    setSelectedId(null);
                  }
                }}
              >
                Delete
              </SecondaryButton>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 grid-cols-1">
              <StatCard
                label="Total"
                value={money(documentTotal(selected))}
                icon="fa-file-invoice-dollar"
                tone="blue"
              />
              <StatCard
                label="Paid"
                value={money(selected.paidAmount)}
                icon="fa-circle-check"
              />
              <StatCard
                label="Balance"
                value={money(invoiceBalance(selected))}
                icon="fa-clock"
                tone="rose"
              />
            </div>
            <Surface className="mt-4">
              <SurfaceHeader title="Line items" />
              <div>
                {selected.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between border-b border-slate-100 px-4 py-3 text-sm last:border-0"
                  >
                    <div>
                      <p className="font-bold">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        {item.quantity} × {money(item.rate)}
                      </p>
                    </div>
                    <strong>{money(item.quantity * item.rate)}</strong>
                  </div>
                ))}
              </div>
            </Surface>
            <Surface className="mt-4">
              <SurfaceHeader title="Payment history" />
              <div>
                {selectedPayments.length ? (
                  selectedPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0"
                    >
                      <IconBox icon="fa-circle-check" />
                      <div className="flex-1">
                        <p className="text-sm font-bold">{payment.date}</p>
                        <p className="text-xs text-slate-500">
                          {payment.method} · {payment.reference}
                        </p>
                      </div>
                      <strong>{money(payment.amount)}</strong>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    icon="fa-credit-card"
                    title="No payments yet"
                    description="Record a payment to create a receipt and update the balance."
                  />
                )}
              </div>
            </Surface>
          </>
        ) : null}
      </Drawer>
      <Modal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title="Invoice preview"
        width="max-w-3xl"
      >
        {preview ? (
          <>
            <DocumentPages layout={previewLayout} />
            <div className="mt-4 flex justify-end gap-2">
              <SecondaryButton
                icon="fa-download"
                onClick={printPreview}
              >
                Download / Print
              </SecondaryButton>
              <PrimaryButton
                icon="fa-share-nodes"
                onClick={async () => {
                  const result = await apiClient.request<{ url: string }>(
                    "POST",
                    "/api/public-documents",
                    {
                      token: token ?? undefined,
                      body: {
                        workspace,
                        kind: "invoice",
                        documentId: `inv:${preview.number}`,
                      },
                    },
                  );
                  await navigator.clipboard.writeText(result.url);
                  window.alert(
                    "Public invoice link copied. Anyone with the link can view it.",
                  );
                }}
              >
                Copy share link
              </PrimaryButton>
            </div>
          </>
        ) : null}
      </Modal>
      <Drawer
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title="Record payment"
        description={selected?.number}
        width="max-w-none"
      >
        <Surface>
          <SurfaceHeader
            title="Payment details"
            description="Record the amount received and keep the invoice balance accurate."
          />
          <div className="grid gap-5 p-5 md:grid-cols-2 grid-cols-1">
            <Field label="Amount received">
              <input
                className={inputClass}
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
              />
              {selected ? (
                <button
                  type="button"
                  className="mt-2 text-xs font-bold text-teal-700 hover:underline"
                  onClick={() => setPaymentAmount(invoiceBalance(selected))}
                >
                  Pay full balance ({money(invoiceBalance(selected))})
                </button>
              ) : null}
            </Field>
            <Field label="Payment method">
              <select
                className={inputClass}
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option>Bank Transfer</option>
                <option>Card</option>
                <option>Cash</option>
                <option>Mobile Money</option>
              </select>
            </Field>
          </div>
          <div className="flex flex-col-reverse justify-end gap-2 border-t border-slate-200 p-5 sm:flex-row">
            <SecondaryButton onClick={() => setPaymentOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton icon="fa-check" onClick={submitPayment}>
              Record payment
            </PrimaryButton>
          </div>
        </Surface>
      </Drawer>
      <ReceiptSuccess
        payment={successPayment}
        onClose={() => setSuccessPayment(null)}
      />
    </Shell>
  );
}

function EstimateBuilder({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    customers,
    items: catalog,
    estimates,
    invoicePreferences,
    saveItem,
    saveEstimate,
    saveCustomer,
    ready,
  } = useDesktopBusiness();
  const [step, setStep] = useState(1);
  const [customerId, setCustomerId] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [issueDate, setIssueDate] = useState(today());
  const [validUntil, setValidUntil] = useState(plusDays(30));
  const [lines, setLines] = useState<DesktopLineItem[]>([newLine()]);
  const [discountPct, setDiscount] = useState(0);
  const [taxPct, setTax] = useState(invoicePreferences.taxRate);
  const [recurringEnabled, setRecurringEnabled] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<NonNullable<DesktopEstimate["recurrenceFrequency"]>>("monthly");
  const [recurrenceStartDate, setRecurrenceStartDate] = useState(today());
  const [automatedReminders, setAutomatedReminders] = useState(true);
  useEffect(() => {
    if (!open || !ready) return;
    setStep(1);
    setCustomerId("");
    setTitle("");
    setIssueDate(today());
    setValidUntil(plusDays(30));
    setLines([newLine()]);
    setDiscount(0);
    setTax(invoicePreferences.taxRate);
    setRecurringEnabled(false);
    setRecurrenceFrequency("monthly");
    setRecurrenceStartDate(today());
    setAutomatedReminders(true);
  }, [open, ready]); // eslint-disable-line react-hooks/exhaustive-deps
  const [terms, setTerms] = useState(
    "This estimate is valid for 30 days from the issue date.",
  );
  const number = nextDocNumber(
    "EST",
    estimates.map((row) => row.number),
  );
  const updateLine = (id: string, patch: Partial<DesktopLineItem>) =>
    setLines(
      lines.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
  const save = (status: DesktopEstimate["status"]) => {
    const validLines = lines.filter(
      (line) => line.name && line.rate > 0 && line.quantity > 0,
    );
    const catalogLines = validLines.map((line) => {
      if (line.catalogItemId) return line;
      const existing = catalog.find((item) => normalizedItemName(item.name) === normalizedItemName(line.name));
      if (existing) return { ...line, catalogItemId: existing.id };
      const catalogItemId = `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      saveItem({ id: catalogItemId, name: line.name.trim(), description: line.description.trim(), kind: inferCatalogKind(line.name, line.description), price: line.rate, category: "Uncategorized", active: true });
      return { ...line, catalogItemId };
    });
    const estimate: DesktopEstimate = {
      id: `est-${Date.now()}`,
      number,
      title: title.trim() || undefined,
      customerId,
      issueDate,
      validUntil,
      status,
      items: catalogLines,
      discountPct,
      taxPct,
      terms,
      recurringEnabled,
      recurrenceFrequency,
      recurrenceStartDate,
      automatedReminders,
    };
    if (status !== "draft" && (!estimate.customerId || !estimate.items.length)) return;
    saveEstimate(estimate);
    onClose();
  };
  const previewEstimate = useMemo<DesktopEstimate | null>(
    () => step === 4 ? { id: "preview", number, title: title.trim() || undefined, customerId, issueDate, validUntil, status: "draft", items: lines.filter((line) => line.name || line.rate), discountPct, taxPct, terms } : null,
    [step, number, title, customerId, issueDate, validUntil, lines, discountPct, taxPct, terms],
  );
  const { layout: previewLayout } = useDocumentLayout("ESTIMATE", previewEstimate);
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Create estimate"
      description={number}
      width="max-w-none"
    >
      <VoiceQuickAddWeb onParsed={(draft: VoiceDraft) => {
        if (draft.customerName) {
          const match = customers.find((customer) => `${customer.name} ${customer.company}`.toLowerCase().includes(draft.customerName!.toLowerCase()));
          if (match) setCustomerId(match.id);
        }
        if (draft.itemName || draft.description) setLines([{ ...newLine(), name: draft.itemName || draft.description || "Service", description: draft.description || "", quantity: draft.quantity && draft.quantity > 0 ? draft.quantity : 1, rate: draft.rate ?? draft.amount ?? 0 }]);
        if (draft.description) setTerms(draft.description);
      }} />
      <div className="h-5" />
      <ProgressSteps
        labels={["Basic info", "Items", "Totals", "Preview"]}
        current={step}
      />
      {step === 1 ? (
        <Surface className="p-5">
          <div className="grid gap-4 sm:grid-cols-3 grid-cols-1">
            <Field label="Estimate number">
              <input className={inputClass} value={number} disabled />
            </Field>
            <Field label="Estimate date">
              <input type="date" className={inputClass} value={issueDate} onChange={(e) => { setIssueDate(e.target.value); if (validUntil < e.target.value) setValidUntil(e.target.value); }} />
            </Field>
            <Field label="Valid until">
              <input type="date" min={issueDate} className={inputClass} value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </Field>
            <Field label="Estimate title (optional)" className="sm:col-span-3"><input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Website redesign proposal" /></Field>
            <Field label="Customer" className="sm:col-span-3">
              <div className="mb-2 flex justify-end"><button type="button" onClick={() => setCustomerOpen(true)} className="text-sm font-bold text-indigo-600"><i className="fas fa-user-plus mr-2" />Add New Customer</button></div>
              <select
                className={inputClass}
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">{customers.length ? "Select a customer" : "No customers found"}</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.company}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Surface>
      ) : null}
      <CustomerCreator open={customerOpen} onClose={() => setCustomerOpen(false)} onCreate={(customer) => { saveCustomer(customer); setCustomerId(customer.id); setCustomerOpen(false); }} />
      {step === 2 ? (
        <Surface>
          <SurfaceHeader
            title="Estimate items"
            action={
              <select
                className="h-9 rounded-lg border px-2 text-xs"
                defaultValue=""
                onChange={(e) => {
                  const item = catalog.find((row) => row.id === e.target.value);
                  if (item)
                    setLines([
                      ...lines.filter((line) => line.name),
                      {
                        id: newLine().id,
                        name: item.name,
                        description: item.description,
                        quantity: 1,
                        rate: item.price,
                        catalogItemId: item.id,
                      },
                    ]);
                  e.target.value = "";
                }}
              >
                <option value="">Add from catalog…</option>
                {catalog.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            }
          />
          <div>
            {lines.map((line) => (
              <div
                key={line.id}
                className="grid gap-2 border-b border-slate-100 p-4 sm:grid-cols-[1fr_90px_120px] grid-cols-1"
              >
                <input
                  className={`${inputClass} mt-0`}
                  value={line.name}
                  placeholder="Service or product"
                  onChange={(e) =>
                    updateLine(line.id, { name: e.target.value })
                  }
                />
                <input
                  className={`${inputClass} mt-0`}
                  type="number"
                  value={line.quantity}
                  onChange={(e) =>
                    updateLine(line.id, { quantity: Number(e.target.value) })
                  }
                />
                <input
                  className={`${inputClass} mt-0`}
                  type="number"
                  value={line.rate}
                  onChange={(e) =>
                    updateLine(line.id, { rate: Number(e.target.value) })
                  }
                />
              </div>
            ))}
          </div>
          <button
            className="m-4 text-xs font-bold text-teal-700"
            onClick={() => setLines([...lines, newLine()])}
          >
            <i className="fas fa-plus mr-2" />
            Add item
          </button>
        </Surface>
      ) : null}
      {step === 3 ? (
        <><div className="grid gap-6 lg:grid-cols-2 grid-cols-1">
          <Surface className="p-5">
            <Field label="Discount %">
              <input
                className={inputClass}
                type="number"
                value={discountPct}
                onChange={(e) => setDiscount(Number(e.target.value))}
              />
            </Field>
            <Field label="Tax %" className="mt-3">
              <input
                className={inputClass}
                type="number"
                value={taxPct}
                onChange={(e) => setTax(Number(e.target.value))}
              />
            </Field>
            <Field label="Terms & conditions" className="mt-3">
              <textarea
                className={textareaClass}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
              />
            </Field>
          </Surface>
          <Surface className="p-5">
            <p className="text-xs font-bold text-slate-400">TOTAL</p>
            <p className="mt-2 text-3xl font-black text-teal-800">
              {money(documentTotal({ items: lines, discountPct, taxPct }))}
            </p>
          </Surface>
        </div><DocumentAutomationControls noun="estimate" recurring={recurringEnabled} frequency={recurrenceFrequency} startDate={recurrenceStartDate} reminders={automatedReminders} onRecurring={setRecurringEnabled} onFrequency={setRecurrenceFrequency} onStartDate={setRecurrenceStartDate} onReminders={setAutomatedReminders} /></>
      ) : null}
      {step === 4 ? (
        <DocumentPages layout={previewLayout} />
      ) : null}
      <div className="mt-8 flex flex-col-reverse justify-between gap-3 border-t border-slate-200 pt-5 sm:flex-row">
        <SecondaryButton
          icon="fa-arrow-left"
          onClick={() => (step === 1 ? onClose() : setStep(step - 1))}
        >
          {step === 1 ? "Cancel" : "Back"}
        </SecondaryButton>
        <div className="flex flex-col-reverse gap-2 sm:flex-row"><SecondaryButton icon="fa-floppy-disk" onClick={() => save("draft")}>Save as draft</SecondaryButton>{step < 4 ? (
          <PrimaryButton
            icon="fa-arrow-right"
            onClick={() => setStep(step + 1)}
          >
            Continue
          </PrimaryButton>
        ) : (
          <div className="flex gap-2">
            <PrimaryButton icon="fa-paper-plane" onClick={() => save("sent")}>
              Create estimate
            </PrimaryButton>
          </div>
        )}</div>
      </div>
    </Drawer>
  );
}

export function EstimatesPage() {
  const { estimates, customers, convertEstimate, removeEstimate } =
    useDesktopBusiness();
  const { token } = useWebAuth();
  const { workspace } = useWorkspace();
  const params = new URLSearchParams(window.location.search);
  const [builder, setBuilder] = useState(params.get("create") === "1");
  const [selected, setSelected] = useState<DesktopEstimate | null>(null);
  const [preview, setPreview] = useState<DesktopEstimate | null>(null);
  const { layout: previewLayout, print: printPreview } = useDocumentLayout("ESTIMATE", preview);
  const [converted, setConverted] = useState<DesktopInvoice | null>(null);
  return (
    <Shell>
      <WorkspaceHeader
        eyebrow="Sales documents"
        title="Estimates & quotations"
        description="Build full estimates, preview the customer document, and convert accepted work into an invoice."
        actions={
          <PrimaryButton onClick={() => setBuilder(true)}>
            Create estimate
          </PrimaryButton>
        }
      />
      <Surface>
        <MobileList>
          {estimates.map((estimate) => (
            <MobileRow
              key={estimate.id}
              onClick={() => setSelected(estimate)}
              label={`Open estimate ${estimate.number}`}
              lead={<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><i className="fas fa-file-signature" /></span>}
              title={customerName(estimate.customerId, customers)}
              subtitle={estimate.number}
              lines={[`Valid until ${estimate.validUntil}`]}
              amount={money(documentTotal(estimate))}
              badge={<StatusPill status={estimateStatus(estimate)} />}
            />
          ))}
        </MobileList>
        <div className="hidden overflow-x-auto xl:block">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Estimate</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Valid until</th>
                <th>Status</th>
                <th>Total</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {estimates.map((estimate) => (
                <tr
                  key={estimate.id}
                  onClick={() => setSelected(estimate)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-extrabold">
                    {estimate.number}
                  </td>
                  <td>{customerName(estimate.customerId, customers)}</td>
                  <td>{estimate.issueDate}</td>
                  <td>{estimate.validUntil}</td>
                  <td>
                    <StatusPill status={estimateStatus(estimate)} />
                  </td>
                  <td className="font-extrabold">
                    {money(documentTotal(estimate))}
                  </td>
                  <td>
                    <i className="fas fa-chevron-right text-xs text-slate-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>
      <EstimateBuilder open={builder} onClose={() => setBuilder(false)} />
      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.number ?? "Estimate detail"}
        description={
          selected ? customerName(selected.customerId, customers) : undefined
        }
        width="max-w-none"
      >
        {selected ? (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              <PrimaryButton icon="fa-eye" onClick={() => setPreview(selected)}>
                Preview
              </PrimaryButton>
              <SecondaryButton
                icon="fa-paper-plane"
                onClick={() =>
                  (window.location.href = `mailto:?subject=${selected.number}`)
                }
              >
                Send
              </SecondaryButton>
              <SecondaryButton
                icon="fa-file-invoice"
                onClick={() => setConverted(convertEstimate(selected.id))}
              >
                Convert to invoice
              </SecondaryButton>
              <SecondaryButton
                danger
                icon="fa-trash"
                onClick={() => {
                  if (
                    window.confirm(
                      "Delete this estimate? This also removes it from your mobile app.",
                    )
                  ) {
                    removeEstimate(selected.id);
                    setSelected(null);
                  }
                }}
              >
                Delete
              </SecondaryButton>
            </div>
            <Surface>
              <div className="grid grid-cols-2 gap-3 p-4">
                <StatCard
                  label="Items"
                  value={String(selected.items.length)}
                  icon="fa-list"
                  tone="violet"
                />
                <StatCard
                  label="Total"
                  value={money(documentTotal(selected))}
                  icon="fa-dollar-sign"
                />
              </div>
              {selected.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between border-t border-slate-100 px-4 py-3 text-sm"
                >
                  <span>{item.name}</span>
                  <strong>{money(item.quantity * item.rate)}</strong>
                </div>
              ))}
            </Surface>
          </>
        ) : null}
      </Drawer>
      <Modal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title="Estimate preview"
        width="max-w-3xl"
      >
        {preview ? (
          <>
            <DocumentPages layout={previewLayout} />
            <div className="mt-4 flex justify-end gap-2">
              <SecondaryButton
                icon="fa-download"
                onClick={printPreview}
              >
                Download
              </SecondaryButton>
              <SecondaryButton
                icon="fa-link"
                onClick={async () => {
                  const result = await apiClient.request<{ url: string }>(
                    "POST",
                    "/api/public-documents",
                    {
                      token: token ?? undefined,
                      body: {
                        workspace,
                        kind: "estimate",
                        documentId: `est:${preview.number}`,
                      },
                    },
                  );
                  await navigator.clipboard.writeText(result.url);
                  window.alert(
                    "Public estimate link copied. Anyone with the link can view it.",
                  );
                }}
              >
                Copy public link
              </SecondaryButton>
              <PrimaryButton
                icon="fa-paper-plane"
                onClick={() =>
                  (window.location.href = `mailto:?subject=${preview.number}`)
                }
              >
                Send estimate
              </PrimaryButton>
            </div>
          </>
        ) : null}
      </Modal>
      <Modal
        open={Boolean(converted)}
        onClose={() => setConverted(null)}
        title="Invoice created successfully"
      >
        <div className="py-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-3xl text-emerald-600">
            <i className="fas fa-check" />
          </div>
          <p className="mt-4 text-lg font-extrabold">{converted?.number}</p>
          <p className="mt-1 text-sm text-slate-500">
            The estimate is now an editable invoice draft.
          </p>
          <a
            href={`/invoices?invoice=${converted?.id}`}
            className="mt-5 inline-flex h-10 items-center rounded-lg bg-teal-700 px-5 text-sm font-bold text-white"
          >
            View invoice
          </a>
        </div>
      </Modal>
    </Shell>
  );
}

function ReceiptSuccess({
  payment,
  onClose,
}: {
  payment: DesktopPayment | null;
  onClose: () => void;
}) {
  const { invoices, customers, business } = useDesktopBusiness();
  const invoice = payment
    ? invoices.find((row) => row.id === payment.invoiceId)
    : null;
  const customer = invoice
    ? customerName(invoice.customerId, customers)
    : "Customer";
  const share = async () => {
    const text = `${payment?.receiptNumber} · ${money(payment?.amount ?? 0)} received for ${invoice?.number}`;
    if (navigator.share)
      await navigator.share({ title: `${business.name || "Payment"} receipt`, text });
    else await navigator.clipboard?.writeText(text);
  };
  return (
    <Modal
      open={Boolean(payment)}
      onClose={onClose}
      title="Payment recorded"
      width="max-w-2xl"
    >
      {payment ? (
        <>
          <div className="mb-5 py-3 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
              <i className="fas fa-check" />
            </div>
            <h3 className="mt-3 text-xl font-black text-slate-950">
              Payment recorded!
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              A receipt is ready to generate and share.
            </p>
          </div>
          <div className="mx-auto max-w-lg border border-dashed border-slate-300 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between border-b border-dashed border-slate-300 pb-4">
              <div>
                <p className="font-black text-teal-800">{business.name}</p>
                <p className="text-[10px] text-slate-500">PAYMENT RECEIPT</p>
              </div>
              <div className="text-right text-xs">
                <p className="font-extrabold">{payment.receiptNumber}</p>
                <p>{payment.date}</p>
              </div>
            </div>
            <div className="space-y-2 py-5 text-sm">
              <div className="flex justify-between">
                <span>Received from</span>
                <strong>{customer}</strong>
              </div>
              <div className="flex justify-between">
                <span>Invoice</span>
                <strong>{invoice?.number}</strong>
              </div>
              <div className="flex justify-between">
                <span>Payment method</span>
                <strong>{payment.method}</strong>
              </div>
              <div className="flex justify-between">
                <span>Reference</span>
                <strong>{payment.reference}</strong>
              </div>
              <div className="flex justify-between border-t border-dashed border-slate-300 pt-3 text-lg">
                <span>Amount received</span>
                <strong className="text-teal-800">
                  {money(payment.amount)}
                </strong>
              </div>
            </div>
            <p className="text-center text-xs italic text-slate-500">
              Thank you for your payment.
            </p>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <SecondaryButton icon="fa-print" onClick={() => window.print()}>
              Print / PDF
            </SecondaryButton>
            <PrimaryButton icon="fa-share-nodes" onClick={() => void share()}>
              Share receipt
            </PrimaryButton>
          </div>
        </>
      ) : null}
    </Modal>
  );
}

export function PaymentsPage() {
  const { payments, invoices, customers } = useDesktopBusiness();
  const [receipt, setReceipt] = useState<DesktopPayment | null>(null);
  const received = payments.reduce((sum, payment) => sum + payment.amount, 0);
  return (
    <Shell>
      <WorkspaceHeader
        eyebrow="Sales cycle"
        title="Payments & receipts"
        description="Payment success states and generated receipts remain connected to invoice history."
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-3 grid-cols-1">
        <StatCard
          label="Total received"
          value={money(received)}
          detail={`${payments.length} payments`}
          icon="fa-circle-check"
        />
        <StatCard
          label="Open balances"
          value={money(
            invoices.reduce((sum, invoice) => sum + openBalance(invoice), 0),
          )}
          icon="fa-clock"
          tone="blue"
        />
        <StatCard
          label="Receipts"
          value={String(payments.length)}
          icon="fa-receipt"
          tone="violet"
        />
      </div>
      <Surface>
        <SurfaceHeader
          title="Payment history"
          description="Open a completed payment to regenerate or share its receipt"
        />
        <MobileList>
          {payments.map((payment) => {
            const invoice = invoices.find((row) => row.id === payment.invoiceId);
            return (
              <MobileRow
                key={payment.id}
                onClick={() => setReceipt(payment)}
                label={`Open receipt ${payment.receiptNumber}`}
                lead={<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><i className="fas fa-receipt" /></span>}
                title={invoice ? customerName(invoice.customerId, customers) : "Customer"}
                subtitle={`${payment.receiptNumber}${invoice ? ` · ${invoice.number}` : ""}`}
                lines={[`${payment.date} · ${payment.method}`]}
                amount={money(payment.amount)}
                amountClassName="text-emerald-700"
                badge={<StatusPill status="received" />}
              />
            );
          })}
        </MobileList>
        <div className="hidden overflow-x-auto xl:block">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Receipt</th>
                <th>Customer</th>
                <th>Invoice</th>
                <th>Date</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((payment) => {
                const invoice = invoices.find(
                  (row) => row.id === payment.invoiceId,
                );
                return (
                  <tr
                    key={payment.id}
                    onClick={() => setReceipt(payment)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-extrabold">
                      {payment.receiptNumber}
                    </td>
                    <td>
                      {invoice
                        ? customerName(invoice.customerId, customers)
                        : "Customer"}
                    </td>
                    <td>{invoice?.number}</td>
                    <td>{payment.date}</td>
                    <td>{payment.method}</td>
                    <td className="font-extrabold">{money(payment.amount)}</td>
                    <td>
                      <StatusPill status="received" />
                    </td>
                    <td>
                      <i className="fas fa-chevron-right text-xs text-slate-400" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Surface>
      <ReceiptSuccess payment={receipt} onClose={() => setReceipt(null)} />
    </Shell>
  );
}
