import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation } from "../lib/api";
import type { Id } from "../lib/api";
import { api } from "../lib/api";
import { createPaymentDraft, localInvoiceToPaymentInvoice, nextReceiptNumber, paymentInvoicePreview, paymentReference, type PaymentDraft, type PaymentInvoice, type SavedPayment } from "../features/payments/model";
import { useAuth } from "./AuthContext";
import { useInvoiceFlow } from "./InvoiceFlowContext";
import { useSalesSetup } from "./SalesSetupContext";
import { useWorkspace } from "./WorkspaceContext";

type State = { draft: PaymentDraft; payments: SavedPayment[] };
type Value = State & {
  ready: boolean;
  paymentInvoices: PaymentInvoice[];
  availableInvoices: PaymentInvoice[];
  startNewPayment: (invoiceNumber?: string) => void;
  updateDraft: (patch: Partial<PaymentDraft>) => void;
  recordPayment: (amountOverride?: number) => Promise<SavedPayment>;
  findPayment: (id: string) => SavedPayment | undefined;
};

const Context = createContext<Value | null>(null);

export function PaymentFlowProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const { workspace } = useWorkspace();
  const { invoices, applyPayment } = useInvoiceFlow();
  const { customers } = useSalesSetup();
  const createTransaction = useMutation(api.transactions.create);
  const [state, setState] = useState<State>(() => ({ draft: createPaymentDraft(), payments: [] }));
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const storageKey = `receipt_cycle_payment_flow_${user?.id ?? "guest"}_${workspace}`;

  useEffect(() => {
    let live = true;
    setLoadedKey(null);
    void AsyncStorage.getItem(storageKey).then((raw) => {
      if (!live) return;
      if (!raw) setState({ draft: createPaymentDraft(), payments: [] });
      else {
        try { const parsed = JSON.parse(raw) as Partial<State>; setState({ draft: parsed.draft?.paymentDate ? parsed.draft : createPaymentDraft(), payments: Array.isArray(parsed.payments) ? parsed.payments : [] }); }
        catch { setState({ draft: createPaymentDraft(), payments: [] }); }
      }
      setLoadedKey(storageKey);
    }).catch(() => { if (live) { setState({ draft: createPaymentDraft(), payments: [] }); setLoadedKey(storageKey); } });
    return () => { live = false; };
  }, [storageKey]);

  function update(recipe: (current: State) => State) {
    setState((current) => { const next = recipe(current); void AsyncStorage.setItem(storageKey, JSON.stringify(next)); return next; });
  }

  const paymentInvoices = useMemo<PaymentInvoice[]>(() => {
    const local = invoices
      .filter((invoice) => invoice.status !== "draft")
      .map((invoice) => {
        const row = localInvoiceToPaymentInvoice(invoice);
        const customer = customers.find((item) => item.id === invoice.customerId);
        return { ...row, customerEmail: customer?.email ?? "", customerAddress: customer?.billingAddress ?? "" };
      });
    const preview = paymentInvoicePreview.map((invoice) => {
      const newlyPaid = state.payments.filter((payment) => payment.invoiceNumber === invoice.invoiceNumber && payment.status !== "refunded").reduce((sum, payment) => sum + payment.amount, 0);
      return { ...invoice, amountPaid: Math.min(invoice.total, invoice.amountPaid + newlyPaid), status: invoice.amountPaid + newlyPaid > 0 ? "partially_paid" as const : invoice.status };
    });
    return [...local, ...preview];
  }, [customers, invoices, state.payments]);
  const availableInvoices = useMemo(() => paymentInvoices.filter((invoice) => invoice.amountPaid < invoice.total), [paymentInvoices]);

  const value = useMemo<Value>(() => ({
    ...state,
    ready: loadedKey === storageKey,
    paymentInvoices,
    availableInvoices,
    startNewPayment: (invoiceNumber) => update((current) => ({ ...current, draft: createPaymentDraft(invoiceNumber) })),
    updateDraft: (patch) => update((current) => ({ ...current, draft: { ...current.draft, ...patch } })),
    recordPayment: async (amountOverride) => {
      if (!user?.id || !token) throw new Error("Sign in to record a customer payment.");
      const invoice = availableInvoices.find((item) => item.invoiceNumber === state.draft.invoiceNumber);
      if (!invoice) throw new Error("Choose an open invoice.");
      const balance = Math.max(0, invoice.total - invoice.amountPaid);
      const paymentAmount = amountOverride ?? state.draft.amount;
      if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) throw new Error("Enter an amount greater than zero.");
      if (paymentAmount > balance) throw new Error(`The payment cannot exceed the remaining balance of ${balance.toFixed(2)}.`);
      if (!state.draft.accountId || !state.draft.accountName) throw new Error("Choose the account receiving this payment.");
      const transactionId = await createTransaction({
        workspace, userId: user.id, token, amount: paymentAmount, type: "income", category: "Client Payment", merchant: invoice.customerName,
        date: state.draft.paymentDate, description: state.draft.note || `Payment for ${invoice.invoiceNumber}`, payment_method: state.draft.method,
        accountId: state.draft.accountId as Id<"accounts">, tags: ["payment", invoice.invoiceNumber], is_recurring: false, entrySource: "manual",
      });
      const remainingBalance = Math.max(0, balance - paymentAmount);
      const payment: SavedPayment = {
        ...state.draft, amount: paymentAmount, id: `payment-${Date.now()}`, receiptNumber: nextReceiptNumber(state.payments), customerId: invoice.customerId,
        customerName: invoice.customerName, customerEmail: invoice.customerEmail, customerAddress: invoice.customerAddress,
        invoiceTotal: invoice.total, previousPaid: invoice.amountPaid, remainingBalance, reference: paymentReference(state.draft.method),
        status: remainingBalance > 0 ? "partial" : "received", transactionId: String(transactionId), createdAt: new Date().toISOString(),
      };
      update((current) => ({ draft: current.draft, payments: [payment, ...current.payments] }));
      if (!invoice.preview) applyPayment(invoice.invoiceNumber, paymentAmount);
      return payment;
    },
    findPayment: (id) => state.payments.find((payment) => payment.id === id),
  }), [state, loadedKey, storageKey, paymentInvoices, availableInvoices, user?.id, token, workspace, createTransaction, applyPayment]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePaymentFlow() {
  const value = useContext(Context);
  if (!value) throw new Error("usePaymentFlow requires PaymentFlowProvider");
  return value;
}
