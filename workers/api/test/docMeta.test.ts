import { describe, expect, it } from "vitest";
import { buildStatementMeta, documentMeta, last4Of, statementTextMeta } from "../../../apps/mobile/src/lib/statementParse/docMeta";
import { receiptDocument, statementDocument, storeOriginal } from "../../../apps/mobile/src/lib/statementParse/original";
import { parseCsvText } from "../../../apps/mobile/src/lib/statementParse/csv";

const bank = `# Northfield Community Bank

Account Statement Account ending in 1893 Statement period: 03/01/2026 through 03/31/2026

## Summary of account activity

|Beginning balance|$5,250.75|
|---|---|
|Total deposits and credits|$11,356.99|
|Total withdrawals and debits|$5,810.80|
|Ending balance|$10,796.94|`;

const card = `# Harborview Card Services

Platinum Rewards Visa Credit Card Statement Account ending in 4411 Statement Closing Date: 03/14/2026 Billing Cycle: 02/15/2026 - 03/14/2026

## Account Summary

|Previous Balance|$1,812.40|Payment Due Date: 04/08/2026|
|---|---|---|
|Payments and Credits|$640.00|Minimum Payment Due: $35.00|
|New Charges|$3,395.11|Credit Limit: $8,000.00|
|Fees Charged|$0.00|Available Credit: $3,432.49|
|Interest Charged New Balance|$0.00 $4,567.51|Purchase APR: 24.99% (v)|`;

describe("statement details", () => {
  it("reads a bank statement's details and keeps only the last 4 digits of the account", () => {
    const t = statementTextMeta(bank.replace("Account ending in 1893", "Account Number: 000012341893"));
    expect(t.kind).toBe("bank_statement");
    expect(t.meta).toMatchObject({ currency: "USD", bankName: "Northfield Community Bank", accountLast4: "1893", periodStart: "2026-03-01", periodEnd: "2026-03-31", openingBalance: 5250.75, totalDeposits: 11356.99, totalWithdrawals: 5810.8, closingBalance: 10796.94 });
    expect(JSON.stringify(t)).not.toContain("000012341893");
  });

  it("reads a US card statement: issuer, last 4, closing and due dates, balances, minimum, limit, APR (and the merged New Balance cell)", () => {
    const t = statementTextMeta(card);
    expect(t.kind).toBe("card_statement");
    expect(t.meta).toMatchObject({
      issuer: "Harborview Card Services",
      last4: "4411",
      periodStart: "2026-02-15",
      periodEnd: "2026-03-14",
      closingDate: "2026-03-14",
      paymentDueDate: "2026-04-08",
      previousBalance: 1812.4,
      paymentsAndCredits: 640,
      newCharges: 3395.11,
      newBalance: 4567.51,
      minimumPaymentDue: 35,
      creditLimit: 8000,
      apr: 24.99,
    });
    expect(String(t.meta.cardName)).toMatch(/Platinum Rewards Visa/);
  });

  it("finds account and card last 4 in the usual US phrasings and never keeps more", () => {
    for (const s of ["Account ending in 1893", "Acct #...1893", "Card: ****1893", "Account Number: XXXXXX1893", "ending in 1893", "Card Number XXXX XXXX XXXX 1893"]) expect(last4Of(s), s).toBe("1893");
  });

  it("works out period, totals and count from the rows when the file prints nothing (CSV / Excel)", async () => {
    const r = await parseCsvText("Date,Description,Amount\n03/01/2026,Coffee,-4.50\n03/09/2026,Pay,100.00\n03/05/2026,Lunch,-10.00\n");
    const d = statementDocument(r);
    expect(d.kind).toBe("bank_statement");
    expect(d.meta).toMatchObject({ currency: "USD", periodStart: "2026-03-01", periodEnd: "2026-03-09", transactionCount: 3, totalDeposits: 100, totalWithdrawals: 14.5 });
  });

  it("calls a card-style export a card statement and an all-positive expense list a spreadsheet", async () => {
    const cardCsv = await parseCsvText("Date,Description,Amount\n03/01/2026,AMAZON,54.20\n03/02/2026,UBER,18.00\n03/03/2026,SHELL,40.00\n03/04/2026,ONLINE PAYMENT THANK YOU,-100.00\n");
    expect(statementDocument(cardCsv).kind).toBe("card_statement");
    expect(statementDocument(cardCsv).meta).toMatchObject({ newCharges: 112.2, paymentsAndCredits: 100 });
    const sheet = await parseCsvText("Date,Vendor,Amount\n03/01/2026,Uber,8.20\n03/02/2026,Lunch,14.00\n");
    expect(statementDocument(sheet).kind).toBe("spreadsheet");
  });

  it("buildStatementMeta prefers what the statement prints over the rows", () => {
    const rows = [{ date: "2026-03-02", amount: 5, type: "expense" as const, category: "Other" }];
    const { meta } = buildStatementMeta({ rows, text: bank });
    expect(meta).toMatchObject({ totalWithdrawals: 5810.8, openingBalance: 5250.75, transactionCount: 1 });
  });
});

describe("receipt and invoice details", () => {
  it("keeps everything the reader returned, with a card number cut to its last 4", () => {
    const m = documentMeta({
      merchant_name: "THE COPPER KETTLE GRILL",
      merchant_address: "412 Main Street Austin, TX 78701",
      country: "US",
      currency: "USD",
      date: "2026-03-14",
      subtotal: 46.9,
      tax_amount: 3.87,
      tip: 9,
      total_amount: 59.77,
      payment_method: "Visa",
      card_last4: "**** **** **** 4411",
      items: [{ name: "BBQ BRISKET PLATE", quantity: 1, unit_price: 18.95, total: 18.95 }],
      formatted_receipt_text: "ignored",
    });
    expect(m).toMatchObject({ merchant_address: "412 Main Street Austin, TX 78701", country: "US", tip: 9, tax_amount: 3.87, card_last4: "4411" });
    expect(m).not.toHaveProperty("formatted_receipt_text");
    expect((m.items as unknown[]).length).toBe(1);
  });

  it("tells an invoice from a receipt and keeps all invoice fields", () => {
    const d = receiptDocument({ document_type: "invoice", merchant_name: "Cedar Ridge", invoice_number: "CR-77120", due_date: "2026-04-19", po_number: "PB-45019", payment_terms: "Net 30", bill_to: "Pinecrest Builders LLC", items: [{ name: "A" }, { name: "B" }] });
    expect(d.kind).toBe("invoice");
    expect(d.meta).toMatchObject({ invoice_number: "CR-77120", due_date: "2026-04-19", po_number: "PB-45019", payment_terms: "Net 30", bill_to: "Pinecrest Builders LLC" });
    expect(receiptDocument({ merchant_name: "Cafe" }).kind).toBe("receipt");
  });
});

describe("keeping the original", () => {
  it("returns the stored key, and never throws when storing fails (the import goes on with a note)", async () => {
    const ok = await storeOriginal(async () => ({ id: "d1", key: "receipts/u/d1.csv" }), new Blob(["x"]) as never, "a.csv", "bank_statement", {});
    expect(ok).toEqual({ key: "receipts/u/d1.csv", note: null });
    const failed = await storeOriginal(async () => { throw new Error("offline"); }, new Blob(["x"]) as never, "a.csv", "bank_statement", {});
    expect(failed.key).toBeNull();
    expect(failed.note).toMatch(/original file could not be saved/);
  });
});

import { paymentFromText } from "../../../apps/mobile/src/lib/statementParse/docMeta";

describe("payment method and last 4 from receipt text", () => {
  const cases: Array<[string, { method?: string; last4?: string }]> = [
    ["SUBTOTAL 46.90 TAX 3.87 TIP 9.00 TOTAL 59.77 VISA ****4411 APPROVED", { method: "Visa", last4: "4411" }],
    ["TOTAL 17.93 AMEX XXXXXXXXXXX1007 Thank you", { method: "Amex", last4: "1007" }],
    ["TOTAL 41.72 DEBIT CARD ending in 3318 AUTH 004411", { method: "Debit", last4: "3318" }],
    ["TOTAL 140.81 Mastercard Acct #...2290", { method: "Mastercard", last4: "2290" }],
    ["TOTAL 53.90 Paid by: VISA Card: ...6642", { method: "Visa", last4: "6642" }],
    ["TOTAL 16.45 CASH TENDERED 20.00 CHANGE 3.55", { method: "Cash" }],
    ["TOTAL 35.81 Cash 40.81 Change 5.00", { method: "Cash" }],
    ["Total 12.00 Paid with Apple Pay", { method: "Apple Pay" }],
    ["Total 9.99 Discover XXXX 9981", { method: "Discover", last4: "9981" }],
    ["Total 80.00 Check #1042", { method: "Check" }],
    ["Total 5.00 ************1234", { method: "Card", last4: "1234" }],
    ["Total 63.05 Thank you for shopping, cashier Ana", {}],
  ];
  for (const [text, want] of cases) {
    it(text.slice(0, 48), () => expect(paymentFromText(text)).toEqual(want));
  }
});
