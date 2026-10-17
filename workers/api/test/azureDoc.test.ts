import { env } from "cloudflare:test";
import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../src/index";
import { AZURE_TOO_LONG } from "../src/docs/azure";
import { azureReadDocument } from "../src/docs/azureDoc";
import { makeUser } from "./helpers";

afterEach(() => vi.unstubAllGlobals());

const azureEnv = { ...env, AZURE_DI_ENDPOINT: "https://qa-di.cognitiveservices.azure.com", AZURE_DI_KEY: "azure-test-key", OCR_PDF_ENABLED: "true" };
const OP = "https://qa-di.cognitiveservices.azure.com/documentintelligence/documentModels/x/analyzeResults/op1?api-version=2024-11-30";
const noSleep = async () => {};
const B64 = "QUJD".repeat(40);

const cur = (amount: number, confidence = 0.97) => ({ type: "currency", valueCurrency: { amount, currencyCode: "USD", currencySymbol: "$" }, content: `$${amount}`, confidence });
const str = (s: string, confidence = 0.97) => ({ type: "string", valueString: s, content: s, confidence });
const date = (d: string) => ({ type: "date", valueDate: d, content: d, confidence: 0.97 });
const num = (n: number) => ({ type: "number", valueNumber: n, content: String(n), confidence: 0.97 });
const obj = (o: Record<string, unknown>) => ({ type: "object", valueObject: o });

const receipt = () => ({
  status: "succeeded",
  analyzeResult: {
    pages: [{ pageNumber: 1 }],
    documents: [
      {
        docType: "receipt.retailMeal",
        confidence: 0.95,
        fields: {
          MerchantName: str("THE COPPER KETTLE GRILL"),
          MerchantAddress: str("412 Main Street Austin, TX 78701"),
          TransactionDate: date("2026-03-14"),
          TransactionTime: { type: "time", valueTime: "18:22:00", content: "6:22 PM", confidence: 0.9 },
          Subtotal: cur(46.9),
          TotalTax: cur(3.87),
          Tip: cur(9),
          Total: cur(59.77),
          ReceiptType: str("Meal"),
          Payments: { type: "array", valueArray: [obj({ Method: str("Visa") })] },
          Items: {
            type: "array",
            valueArray: [
              obj({ Description: str("BBQ BRISKET PLATE"), Quantity: num(1), Price: cur(18.95), TotalPrice: cur(18.95) }),
              obj({ Description: str("SWEET TEA"), Quantity: num(2), Price: cur(3.25), TotalPrice: cur(6.5) }),
            ],
          },
        },
      },
    ],
  },
});

const invoice = () => ({
  status: "succeeded",
  analyzeResult: {
    pages: [{ pageNumber: 1 }, { pageNumber: 2 }],
    documents: [
      {
        docType: "invoice",
        confidence: 0.96,
        fields: {
          VendorName: str("Cedar Ridge Industrial Supply Co."),
          CustomerName: str("Pinecrest Builders LLC"),
          InvoiceId: str("CR-77120"),
          InvoiceDate: date("2026-03-20"),
          DueDate: date("2026-04-19"),
          PurchaseOrder: str("PB-45019"),
          PaymentTerm: str("Net 30"),
          SubTotal: cur(9005),
          TotalTax: cur(630.35),
          InvoiceTotal: cur(9635.35),
          Items: {
            type: "array",
            valueArray: [
              obj({ Description: str("Part A100 - bracket"), Quantity: num(5), UnitPrice: cur(18.5), Amount: cur(92.5) }),
              obj({ Description: str("Part B101 - bracket"), Quantity: num(6), UnitPrice: cur(19.85), Amount: cur(119.1) }),
            ],
          },
        },
      },
    ],
  },
});

const empty = () => ({ status: "succeeded", analyzeResult: { pages: [{ pageNumber: 1 }], documents: [] } });

function stub(models: Record<string, () => unknown>) {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const u = String(url);
      if ((init.method ?? "GET") === "POST") {
        const model = /documentModels\/([^:]+):analyze/.exec(u)![1]!;
        calls.push(model);
        return new Response(null, { status: 202, headers: { "Operation-Location": OP.replace("/x/", `/${model}/`) } });
      }
      const model = /documentModels\/([^/]+)\/analyzeResults/.exec(u)![1]!;
      return new Response(JSON.stringify(models[model]!()), { status: 200 });
    }),
  );
  return calls;
}

describe("Azure receipt and invoice reader", () => {
  it("reads a receipt into the review-screen shape with tip, tax, payment method and items", async () => {
    stub({ "prebuilt-receipt": receipt });
    const r = await azureReadDocument(azureEnv, B64, "receipt", { sleep: noSleep });
    expect(r).toMatchObject({
      source: "azure-receipt",
      merchant_name: "THE COPPER KETTLE GRILL",
      date: "2026-03-14",
      subtotal: 46.9,
      tax_amount: 3.87,
      tip: 9,
      total_amount: 59.77,
      currency: "USD",
      payment_method: "Visa",
      document_type: "restaurant_receipt",
      category: "Food & Dining",
      transaction_type: "expense",
    });
    expect(r.items).toEqual([
      { name: "BBQ BRISKET PLATE", quantity: 1, unit_price: 18.95, price: 18.95, total: 18.95 },
      { name: "SWEET TEA", quantity: 2, unit_price: 3.25, price: 3.25, total: 6.5 },
    ]);
    expect(r.formatted_receipt_text).toMatch(/TOTAL {2}59\.77/);
  });

  it("reads an invoice with number, dates, PO, terms, customer and every line item", async () => {
    stub({ "prebuilt-invoice": invoice });
    const r = await azureReadDocument(azureEnv, B64, "invoice", { sleep: noSleep, expectedPages: 2 });
    expect(r).toMatchObject({
      source: "azure-invoice",
      merchant_name: "Cedar Ridge Industrial Supply Co.",
      invoice_number: "CR-77120",
      date: "2026-03-20",
      due_date: "2026-04-19",
      po_number: "PB-45019",
      payment_terms: "Net 30",
      bill_to: "Pinecrest Builders LLC",
      subtotal: 9005,
      tax_amount: 630.35,
      total_amount: 9635.35,
      document_type: "invoice",
    });
    expect(r.items).toHaveLength(2);
    expect(r.items![1]).toMatchObject({ name: "Part B101 - bracket", quantity: 6, unit_price: 19.85, total: 119.1 });
    expect(r.description).toMatch(/Invoice CR-77120.*due 2026-04-19.*PO PB-45019.*terms Net 30/);
    expect(r.formatted_receipt_text).toMatch(/Part A100 - bracket {2}5 x 18\.50 = 92\.50/);
  });

  it("auto: tries the receipt model, then the invoice model when no receipt total is found", async () => {
    const calls = stub({ "prebuilt-receipt": empty, "prebuilt-invoice": invoice });
    const r = await azureReadDocument(azureEnv, B64, "auto", { sleep: noSleep });
    expect(calls).toEqual(["prebuilt-receipt", "prebuilt-invoice"]);
    expect(r.source).toBe("azure-invoice");
  });

  it("refuses with a plain message when no total can be read", async () => {
    stub({ "prebuilt-receipt": empty });
    const err = await azureReadDocument(azureEnv, B64, "receipt", { sleep: noSleep }).catch((e) => e);
    expect(err.userMessage).toMatch(/No receipt total could be read/);
  });

  it("never returns a partial multi-page document (free tier reads 2 pages)", async () => {
    stub({ "prebuilt-invoice": invoice });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const err = await azureReadDocument(azureEnv, B64, "invoice", { sleep: noSleep, expectedPages: 6 }).catch((e) => e);
    expect(err.userMessage).toBe(AZURE_TOO_LONG);
  });
});

describe("POST /api/uploads/ai/read-document", () => {
  async function post(token: string, body: unknown, e: typeof env = azureEnv as never) {
    const res = await app.request("/api/uploads/ai/read-document", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify(body) }, e);
    return { status: res.status, json: (await res.json()) as any };
  }

  it("returns extracted_data for a PDF invoice with no OpenAI key needed", async () => {
    const { token } = await makeUser();
    stub({ "prebuilt-invoice": invoice });
    const r = await post(token, { fileBase64: B64, kind: "invoice", pageCount: 2 });
    expect(r.status).toBe(200);
    expect(r.json.extracted_data).toMatchObject({ invoice_number: "CR-77120", total_amount: 9635.35 });
  });

  it("needs sign-in, the switch and the Azure settings", async () => {
    const { token } = await makeUser();
    stub({ "prebuilt-receipt": receipt });
    expect((await post(token, { fileBase64: B64 }, { ...azureEnv, OCR_PDF_ENABLED: "false" } as never)).status).toBe(400);
    expect((await post(token, { fileBase64: B64 }, { ...env, OCR_PDF_ENABLED: "true" } as never)).status).toBe(503);
    const anon = await app.request("/api/uploads/ai/read-document", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fileBase64: B64 }) }, azureEnv as never);
    expect(anon.status).toBe(401);
  });
});
