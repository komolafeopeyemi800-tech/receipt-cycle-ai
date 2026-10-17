/**
 * Receipts and invoices (PDF or photo) read with Azure prebuilt-receipt / prebuilt-invoice (api-version 2024-11-30), returned
 * in the shape the receipt-review screen already uses, plus invoice fields (number, due date, PO, terms, customer).
 * Invoice details are also written into `description` and `formatted_receipt_text`, which the app saves as notes, so no
 * new database column is needed.
 */
import type { ExtractedShape } from "../ai/scan";
import { AzureError, type AzureOptions, type Json, amount, azureAnalyze, field, text } from "./azure";
import type { Env } from "../types";

export type DocumentKind = "receipt" | "invoice" | "auto";

export type AzureDocument = ExtractedShape & {
  tip?: number | null;
  invoice_number?: string;
  due_date?: string;
  po_number?: string;
  payment_terms?: string;
  bill_to?: string;
  source: "azure-receipt" | "azure-invoice";
};

const currencyCode = (f: Json | undefined): string | undefined => (typeof f?.valueCurrency?.currencyCode === "string" ? f.valueCurrency.currencyCode : undefined);
const dateOf = (f: Json | undefined): string | undefined => (typeof f?.valueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(f.valueDate) ? f.valueDate : undefined);
const conf = (f: Json | undefined): number => (typeof f?.confidence === "number" ? f.confidence : 1);
const money = (n: number | null | undefined, cur = "") => (n == null ? "" : `${cur ? `${cur} ` : ""}${n.toFixed(2)}`);
const fields = (result: Json): Json | undefined => (result.documents as Json[] | undefined)?.[0]?.fields;

const CATEGORY_BY_TYPE: Array<[RegExp, string]> = [
  [/meal|restaurant|food/i, "Food & Dining"],
  [/fuel|gas|parking|transport|taxi/i, "Transportation"],
  [/hotel|lodging/i, "Travel"],
];

function items(f: Json | undefined, priceName: string, totalName: string): NonNullable<ExtractedShape["items"]> {
  const out: NonNullable<ExtractedShape["items"]> = [];
  for (const it of (field(f, "Items")?.valueArray as Json[] | undefined) ?? []) {
    const o = it.valueObject as Json | undefined;
    const name = text(field(o, "Description")) || text(field(o, "ProductCode"));
    const quantity = typeof field(o, "Quantity")?.valueNumber === "number" ? field(o, "Quantity")!.valueNumber : 1;
    const total = amount(field(o, totalName));
    const unit = amount(field(o, priceName)) ?? (total !== null && quantity ? Math.round((total / quantity) * 100) / 100 : null);
    if (!name && total === null) continue;
    out.push({ name: name || "Item", quantity, ...(unit !== null ? { unit_price: unit, price: unit } : {}), ...(total !== null ? { total } : {}) });
  }
  return out;
}

export function receiptFrom(result: Json): AzureDocument | null {
  const f = fields(result);
  const total = amount(field(f, "Total"));
  if (!f || total === null || total <= 0) return null;
  const subtotal = amount(field(f, "Subtotal"));
  const tax = amount(field(f, "TotalTax"));
  const tip = amount(field(f, "Tip"));
  const merchant = text(field(f, "MerchantName"));
  const date = dateOf(field(f, "TransactionDate"));
  const time = text(field(f, "TransactionTime"));
  const method = text(((field(f, "Payments")?.valueArray as Json[] | undefined) ?? [])[0]?.valueObject?.Method);
  const type = text(field(f, "ReceiptType"));
  const lines = items(f, "Price", "TotalPrice");
  const cur = currencyCode(field(f, "Total"));
  const category = CATEGORY_BY_TYPE.find(([re]) => re.test(type))?.[1] ?? "Shopping";
  const taxes = ((field(f, "TaxDetails")?.valueArray as Json[] | undefined) ?? [])
    .map((t) => ({ type: text(field(t.valueObject, "Description")) || "Tax", amount: amount(field(t.valueObject, "Amount")) ?? undefined }))
    .filter((t) => t.amount !== undefined);
  const preview = [
    merchant.toUpperCase(),
    text(field(f, "MerchantAddress")),
    [date, time].filter(Boolean).join(" "),
    "-------------------------",
    ...lines.map((i) => `${i.name}${i.quantity && i.quantity !== 1 ? ` x${i.quantity}` : ""}  ${money(i.total ?? i.price)}`),
    "-------------------------",
    subtotal !== null ? `SUBTOTAL  ${money(subtotal)}` : "",
    tax !== null ? `TAX  ${money(tax)}` : "",
    tip ? `TIP  ${money(tip)}` : "",
    `TOTAL  ${money(total)}`,
    method ? `PAID  ${method}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const low = Math.min(conf(field(f, "Total")), conf(field(f, "MerchantName")), field(f, "TransactionDate") ? conf(field(f, "TransactionDate")) : 1);
  return {
    source: "azure-receipt",
    transaction_type: "expense",
    document_type: /meal/i.test(type) ? "restaurant_receipt" : "retail_receipt",
    merchant_name: merchant || undefined,
    merchant_address: text(field(f, "MerchantAddress")) || undefined,
    total_amount: total,
    subtotal,
    tax_amount: tax,
    tip,
    ...(date ? { date } : {}),
    ...(time ? { time } : {}),
    ...(method ? { payment_method: method } : {}),
    ...(cur ? { currency: cur } : {}),
    category,
    ...(taxes.length ? { taxes } : {}),
    items: lines,
    formatted_receipt_text: preview,
    ocr_confidence: low >= 0.85 ? "high" : low >= 0.6 ? "medium" : "low",
    tags: [],
  };
}

export function invoiceFrom(result: Json): AzureDocument | null {
  const f = fields(result);
  const total = amount(field(f, "InvoiceTotal")) ?? amount(field(f, "AmountDue"));
  if (!f || total === null || total <= 0) return null;
  const vendor = text(field(f, "VendorName"));
  const customer = text(field(f, "CustomerName"));
  const number = text(field(f, "InvoiceId"));
  const date = dateOf(field(f, "InvoiceDate"));
  const due = dateOf(field(f, "DueDate"));
  const po = text(field(f, "PurchaseOrder"));
  const terms = text(field(f, "PaymentTerm"));
  const subtotal = amount(field(f, "SubTotal"));
  const tax = amount(field(f, "TotalTax"));
  const cur = currencyCode(field(f, "InvoiceTotal")) ?? currencyCode(field(f, "AmountDue"));
  const lines = items(f, "UnitPrice", "Amount");
  const head = [number && `Invoice ${number}`, date && `dated ${date}`, due && `due ${due}`, po && `PO ${po}`, terms && `terms ${terms}`, customer && `bill to ${customer}`].filter(Boolean).join(", ");
  const preview = [
    vendor.toUpperCase(),
    head,
    "-------------------------",
    ...lines.map((i) => `${i.name}  ${i.quantity ?? 1} x ${money(i.unit_price)} = ${money(i.total)}`),
    "-------------------------",
    subtotal !== null ? `SUBTOTAL  ${money(subtotal)}` : "",
    tax !== null ? `TAX  ${money(tax)}` : "",
    `TOTAL  ${money(total)}`,
  ]
    .filter(Boolean)
    .join("\n");
  const low = Math.min(conf(field(f, "InvoiceTotal") ?? field(f, "AmountDue")), conf(field(f, "VendorName")));
  return {
    source: "azure-invoice",
    transaction_type: "expense",
    document_type: "invoice",
    merchant_name: vendor || undefined,
    total_amount: total,
    subtotal,
    tax_amount: tax,
    ...(date ? { date } : {}),
    ...(due ? { due_date: due } : {}),
    ...(number ? { invoice_number: number, receipt_number: number } : {}),
    ...(po ? { po_number: po } : {}),
    ...(terms ? { payment_terms: terms } : {}),
    ...(customer ? { bill_to: customer } : {}),
    ...(cur ? { currency: cur } : {}),
    category: "Bills",
    items: lines,
    description: head ? `${head}${lines.length ? `. ${lines.length} line item${lines.length === 1 ? "" : "s"}` : ""}` : undefined,
    formatted_receipt_text: preview,
    ocr_confidence: low >= 0.85 ? "high" : low >= 0.6 ? "medium" : "low",
    tags: [],
  };
}

/** Reads a receipt or invoice. "auto" tries the receipt model first and the invoice model when no receipt total was found. */
export async function azureReadDocument(env: Env, base64: string, kind: DocumentKind, opts: AzureOptions = {}): Promise<AzureDocument> {
  if (kind !== "invoice") {
    const r = receiptFrom(await azureAnalyze(env, "prebuilt-receipt", base64, opts));
    if (r) return r;
    if (kind === "receipt") throw new AzureError("No receipt total could be read. Take a clearer photo, or enter it manually.", 422, "Azure DI: prebuilt-receipt found no total");
  }
  const inv = invoiceFrom(await azureAnalyze(env, "prebuilt-invoice", base64, opts));
  if (!inv) throw new AzureError("No total could be read from this document. Take a clearer photo or scan, or enter it manually.", 422, "Azure DI: no total found");
  return inv;
}
