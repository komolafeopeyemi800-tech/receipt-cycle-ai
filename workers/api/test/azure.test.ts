import { env } from "cloudflare:test";
import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../src/index";
import { AZURE_TOO_LONG, AzureError, SCAN_NO_BALANCES, SCAN_UNRELIABLE, azureReadStatement, plainText } from "../src/docs/azure";
import { makeUser } from "./helpers";

afterEach(() => vi.unstubAllGlobals());

const azureEnv = { ...env, AZURE_DI_ENDPOINT: "https://qa-di.cognitiveservices.azure.com/", AZURE_DI_KEY: "azure-test-key" };
const OP = "https://qa-di.cognitiveservices.azure.com/documentintelligence/documentModels/x/analyzeResults/op1?api-version=2024-11-30";
const noSleep = async () => {};
const B64 = "QUJD".repeat(40);

/** A bank-statement-model result shaped like Azure's JSON (documents[0].fields.Accounts[].Transactions[]). */
const num = (n: number, confidence = 0.98) => ({ type: "number", valueNumber: n, content: String(n), confidence });
const date = (iso: string, confidence = 0.98) => ({ type: "date", valueDate: iso, content: iso, confidence });
const str = (s: string, confidence = 0.98) => ({ type: "string", valueString: s, content: s, confidence });
function bankResult(opts: { pages?: number; txns?: any[]; period?: [string, string]; docConfidence?: number; opening?: number; closing?: number } = {}) {
  const txns = opts.txns ?? [
    { Date: date("2026-03-02"), Description: str("POS PURCHASE CHEVRON SAN JOSE CA"), WithdrawalAmount: num(174.35) },
    { Date: date("2026-03-07"), Description: str("STRIPE TRANSFER ST-2612ABC"), DepositAmount: num(2297.22) },
    { Date: date("2026-03-09", 0.4), Description: str("STARBUCKS"), WithdrawalAmount: num(17.17) },
  ];
  return {
    status: "succeeded",
    analyzeResult: {
      apiVersion: "2024-11-30",
      modelId: "prebuilt-bankStatement.us",
      pages: Array.from({ length: opts.pages ?? 1 }, (_, i) => ({ pageNumber: i + 1 })),
      documents: [
        {
          docType: "bankStatement.us",
          confidence: opts.docConfidence ?? 0.9,
          fields: {
            StatementStartDate: date((opts.period ?? ["2026-03-01", "2026-03-31"])[0]),
            StatementEndDate: date((opts.period ?? ["2026-03-01", "2026-03-31"])[1]),
            Accounts: {
              type: "array",
              valueArray: [
                {
                  type: "object",
                  valueObject: {
                    BeginningBalance: num(opts.opening ?? 5250.75),
                    EndingBalance: num(opts.closing ?? 7356.45),
                    Transactions: { type: "array", valueArray: txns.map((o) => ({ type: "object", valueObject: o })) },
                  },
                },
              ],
            },
          },
        },
      ],
    },
  };
}

/** Minimal prebuilt-layout result: one table over two pages' worth of rows plus the markdown text. */
function layoutResult(pages = 1) {
  const head = ["Date", "Description", "Debit", "Credit", "Balance"];
  const body = [
    ["03/01", "BEGINNING BALANCE", "", "", "1,000.00"],
    ["03/02", "COFFEE SHOP", "4.50", "", "995.50"],
    ["03/03", "PAYROLL", "", "200.00", "1,195.50"],
  ];
  const cells = [head, ...body].flatMap((row, r) => row.map((content, c) => ({ rowIndex: r, columnIndex: c, content, kind: r === 0 ? "columnHeader" : "content" })));
  return {
    status: "succeeded",
    analyzeResult: {
      pages: Array.from({ length: pages }, (_, i) => ({ pageNumber: i + 1 })),
      content: "Statement period: 03/01/2026 through 03/31/2026\nBeginning balance $1,000.00\nEnding balance $1,195.50",
      tables: [{ rowCount: 4, columnCount: 5, cells }],
    },
  };
}

type Step = { match: RegExp; method?: string; respond: () => Response };
/** Routes fetch calls to canned Azure responses and records every call. */
function stubAzure(steps: Step[]) {
  const calls: { url: string; method: string; headers: Record<string, string>; body: any }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const method = (init.method ?? "GET").toUpperCase();
      calls.push({ url: String(url), method, headers: (init.headers ?? {}) as Record<string, string>, body: init.body ? JSON.parse(String(init.body)) : null });
      const step = steps.find((s) => s.match.test(String(url)) && (s.method ?? method) === method);
      if (!step) throw new Error(`unexpected fetch ${method} ${url}`);
      return step.respond();
    }),
  );
  return calls;
}
const accepted = () => new Response(null, { status: 202, headers: { "Operation-Location": OP } });
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status });
/** Poll answers in order: running first, then the final body. */
function polls(...bodies: unknown[]) {
  let i = 0;
  return () => json(bodies[Math.min(i++, bodies.length - 1)]);
}

describe("Azure bank statement model", () => {
  it("submits with the key, polls, and converts transactions to positive amounts and in/out", async () => {
    const calls = stubAzure([
      { match: /bankStatement\.us:analyze/, method: "POST", respond: accepted },
      { match: /analyzeResults\/op1/, respond: polls({ status: "running" }, bankResult()) },
    ]);
    const out = await azureReadStatement(azureEnv, B64, { sleep: noSleep, expectedPages: 1 });
    expect(out.model).toBe("prebuilt-bankStatement.us");
    expect(out.rows).toEqual([
      { date: "2026-03-02", amount: 174.35, type: "expense", category: "Other", merchant: "POS PURCHASE CHEVRON SAN JOSE CA" },
      { date: "2026-03-07", amount: 2297.22, type: "income", category: "Other", merchant: "STRIPE TRANSFER ST-2612ABC" },
      { date: "2026-03-09", amount: 17.17, type: "expense", category: "Other", merchant: "STARBUCKS" },
    ]);
    expect(out.opening).toBe(5250.75);
    expect(out.closing).toBe(7356.45);
    expect(out.warnings.join(" ")).toMatch(/unsure about 1 row \(row 3\)/);
    const submit = calls[0]!;
    expect(submit.url).toContain("https://qa-di.cognitiveservices.azure.com/documentintelligence/documentModels/prebuilt-bankStatement.us:analyze?api-version=2024-11-30");
    expect(submit.headers["Ocp-Apim-Subscription-Key"]).toBe("azure-test-key");
    expect(submit.headers["Content-Type"]).toBe("application/json");
    expect(submit.body).toEqual({ base64Source: B64 });
    expect(calls).toHaveLength(3); // submit + 2 polls
    expect(calls[1]!.headers["Ocp-Apim-Subscription-Key"]).toBe("azure-test-key");
  });

  it("puts a yearless date in the statement period's year when Azure guessed another year", async () => {
    stubAzure([
      { match: /:analyze/, method: "POST", respond: accepted },
      { match: /analyzeResults/, respond: polls(bankResult({ txns: [{ Date: date("2024-03-02"), Description: str("X"), WithdrawalAmount: num(5) }], opening: 100, closing: 95 })) },
    ]);
    const out = await azureReadStatement(azureEnv, B64, { sleep: noSleep });
    expect(out.rows[0]!.date).toBe("2026-03-02");
  });
});

describe("layout fallback", () => {
  it("reads the tables with the existing text path when the statement model finds no transactions", async () => {
    const calls = stubAzure([
      { match: /bankStatement\.us:analyze/, method: "POST", respond: accepted },
      { match: /prebuilt-layout:analyze/, method: "POST", respond: accepted },
      { match: /analyzeResults\/op1/, respond: polls(bankResult({ txns: [] }), layoutResult()) },
    ]);
    const out = await azureReadStatement(azureEnv, B64, { sleep: noSleep, expectedPages: 1 });
    expect(out.model).toBe("prebuilt-layout");
    expect(out.rows.map((r) => [r.date, r.amount, r.type])).toEqual([
      ["2026-03-02", 4.5, "expense"],
      ["2026-03-03", 200, "income"],
    ]);
    expect(out.opening).toBe(1000);
    expect(out.closing).toBe(1195.5);
    expect(calls.find((c) => /prebuilt-layout/.test(c.url))!.url).toContain("outputContentFormat=markdown");
  });
});

describe("rows that do not add up to the printed balances", () => {
  const slid = [
    { Date: date("2026-03-01"), Description: str("BEGINNING BALANCE"), WithdrawalAmount: num(4.5) },
    { Date: date("2026-03-02"), Description: str("COFFEE SHOP"), WithdrawalAmount: num(200) },
  ];
  it("tries the layout model and uses it when its rows reconcile (a skewed photo)", async () => {
    stubAzure([
      { match: /bankStatement\.us:analyze/, method: "POST", respond: accepted },
      { match: /prebuilt-layout:analyze/, method: "POST", respond: accepted },
      { match: /analyzeResults\/op1/, respond: polls(bankResult({ txns: slid, opening: 1000, closing: 1195.5 }), layoutResult()) },
    ]);
    const out = await azureReadStatement(azureEnv, B64, { sleep: noSleep, expectedPages: 1 });
    expect(out.model).toBe("prebuilt-layout");
    expect(out.rows.map((r) => [r.amount, r.type])).toEqual([[4.5, "expense"], [200, "income"]]);
    expect(out.opening).toBe(1000);
  });

  it("refuses the scan when neither read adds up (never shows wrong rows)", async () => {
    stubAzure([
      { match: /bankStatement\.us:analyze/, method: "POST", respond: accepted },
      { match: /prebuilt-layout:analyze/, method: "POST", respond: accepted },
      { match: /analyzeResults\/op1/, respond: polls(bankResult({ txns: slid, opening: 1000, closing: 5000 }), (() => { const l = layoutResult(); (l.analyzeResult as any).content = "Beginning balance $1,000.00 Ending balance $5,000.00"; return l; })()) },
    ]);
    const err = (await azureReadStatement(azureEnv, B64, { sleep: noSleep, expectedPages: 1 }).catch((e) => e)) as AzureError;
    expect(err.userMessage).toBe(SCAN_UNRELIABLE);
    expect(err.status).toBe(422);
  });

  it("refuses a statement that prints no balances", async () => {
    const noBalances = bankResult();
    const acct = (noBalances.analyzeResult.documents[0]!.fields.Accounts.valueArray[0] as any).valueObject;
    delete acct.BeginningBalance;
    delete acct.EndingBalance;
    stubAzure([
      { match: /:analyze/, method: "POST", respond: accepted },
      { match: /analyzeResults/, respond: polls(noBalances) },
    ]);
    const err = (await azureReadStatement(azureEnv, B64, { sleep: noSleep }).catch((e) => e)) as AzureError;
    expect(err.userMessage).toBe(SCAN_NO_BALANCES);
  });
});

describe("layout fallback with HTML tables in the markdown", () => {
  it("never lets raw HTML reach a merchant name", async () => {
    const html = layoutResult();
    (html.analyzeResult as any).content =
      "Statement period: 03/01/2026 through 03/31/2026\n<!-- PageBreak -->\n<table><tr><th>Date</th><th>Description</th><th>Amount</th></tr><tr><td>03/02/2026</td><td>A &amp; B Hardware</td><td>-18.50</td></tr><tr><td>03/03/2026</td><td>Cafe &lt;Main&gt;</td><td>-4.00</td></tr></table>\nBeginning balance $1,000.00 Ending balance $977.50";
    // tables that are not statements: the text path must still not echo markup
    (html.analyzeResult as any).tables = [];
    stubAzure([
      { match: /bankStatement\.us:analyze/, method: "POST", respond: accepted },
      { match: /prebuilt-layout:analyze/, method: "POST", respond: accepted },
      { match: /analyzeResults\/op1/, respond: polls(bankResult({ txns: [] }), html) },
    ]);
    const out = await azureReadStatement(azureEnv, B64, { sleep: noSleep }).catch((e) => e);
    expect(out).not.toBeInstanceOf(Error);
    const rows = out instanceof Error ? [] : out.rows;
    expect(rows.length).toBe(2);
    expect(rows[0]!.merchant).toBe("A & B Hardware");
    for (const r of rows) expect(`${r.merchant ?? ""}`).not.toMatch(/<\/?t[dhr]|<table|<!--/);
    expect(plainText("<table><tr><td>A &amp; B</td></tr></table><!-- x -->")).not.toMatch(/[<]/);
    expect(plainText("<td>A &amp; B</td>")).toContain("A & B");
  });
});

describe("Azure failures", () => {
  it("reports a failed analysis without leaking Azure details", async () => {
    stubAzure([
      { match: /:analyze/, method: "POST", respond: accepted },
      { match: /analyzeResults/, respond: polls({ status: "failed", error: { code: "InvalidContent", message: "The file is corrupted." } }) },
    ]);
    const err = (await azureReadStatement(azureEnv, B64, { sleep: noSleep }).catch((e) => e)) as AzureError;
    expect(err).toBeInstanceOf(AzureError);
    expect(err.userMessage).toMatch(/could not be read/);
    expect(err.userMessage).not.toMatch(/corrupted|InvalidContent/);
    expect(err.message).toMatch(/InvalidContent/);
  });

  it("treats a bad key (401) as unavailable and never shows the key", async () => {
    stubAzure([{ match: /:analyze/, method: "POST", respond: () => json({ error: { code: "401", message: "Access denied due to invalid subscription key." } }, 401) }]);
    const err = (await azureReadStatement(azureEnv, B64, { sleep: noSleep }).catch((e) => e)) as AzureError;
    expect(err.status).toBe(503);
    expect(err.userMessage).toMatch(/cannot be read right now/);
    expect(err.userMessage).not.toContain("azure-test-key");
  });

  it("refuses a partial read when Azure analysed fewer pages than the PDF has (free F0 tier)", async () => {
    stubAzure([
      { match: /:analyze/, method: "POST", respond: accepted },
      { match: /analyzeResults/, respond: polls(bankResult({ pages: 2 })) },
    ]);
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = (await azureReadStatement(azureEnv, B64, { sleep: noSleep, expectedPages: 7 }).catch((e) => e)) as AzureError;
    expect(err.userMessage).toBe(AZURE_TOO_LONG);
    expect(log.mock.calls.flat().join(" ")).toMatch(/only the first 2 of 7 pages.*upgrade the Azure tier/);
    log.mockRestore();
  });

  it("times out instead of waiting forever", async () => {
    stubAzure([
      { match: /:analyze/, method: "POST", respond: accepted },
      { match: /analyzeResults/, respond: () => json({ status: "running" }) },
    ]);
    const err = (await azureReadStatement(azureEnv, B64, { timeoutMs: 25, pollMs: 10, sleep: (ms) => new Promise((r) => setTimeout(r, ms)) }).catch((e) => e)) as AzureError;
    expect(err.status).toBe(504);
    expect(err.userMessage).toMatch(/took too long/);
  });

  it("stops before the Workers subrequest limit", async () => {
    const calls = stubAzure([
      { match: /:analyze/, method: "POST", respond: accepted },
      { match: /analyzeResults/, respond: () => json({ status: "running" }) },
    ]);
    const err = (await azureReadStatement(azureEnv, B64, { timeoutMs: 1e9, sleep: noSleep }).catch((e) => e)) as AzureError;
    expect(err.status).toBe(504);
    expect(calls.length).toBeLessThanOrEqual(40);
  });

  it("never sends the key to a different host", async () => {
    stubAzure([{ match: /:analyze/, method: "POST", respond: () => new Response(null, { status: 202, headers: { "Operation-Location": "https://evil.example.com/op" } }) }]);
    const err = (await azureReadStatement(azureEnv, B64, { sleep: noSleep }).catch((e) => e)) as AzureError;
    expect(err).toBeInstanceOf(AzureError);
  });

  it("is unavailable when the Azure settings are missing", async () => {
    const err = (await azureReadStatement(env, B64, { sleep: noSleep }).catch((e) => e)) as AzureError;
    expect(err.status).toBe(503);
  });
});

describe("POST /api/uploads/ai/ocr-pdf", () => {
  async function post(token: string, body: unknown, e: typeof env = azureEnv as never) {
    const res = await app.request("/api/uploads/ai/ocr-pdf", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify(body) }, e);
    return { status: res.status, json: (await res.json()) as any };
  }
  const happy = () =>
    stubAzure([
      { match: /:analyze/, method: "POST", respond: accepted },
      { match: /analyzeResults/, respond: polls(bankResult()) },
    ]);

  it("returns rows, opening and closing for a PDF, with no OpenAI key needed", async () => {
    const { token } = await makeUser();
    happy();
    const r = await post(token, { pdfBase64: B64, pageCount: 1 });
    expect(r.status).toBe(200);
    expect(r.json).toMatchObject({ opening: 5250.75, closing: 7356.45, pages: 1 });
    expect(r.json.rows).toHaveLength(3);
  });

  it("reads a photo of a statement when kind is statement", async () => {
    const { token } = await makeUser();
    const calls = happy();
    const r = await post(token, { fileBase64: B64, kind: "statement", mimeType: "image/jpeg" });
    expect(r.status).toBe(200);
    expect(calls[0]!.body.base64Source).toBe(B64);
  });

  it("gives the long-PDF message when the page count does not match", async () => {
    const { token } = await makeUser();
    stubAzure([
      { match: /:analyze/, method: "POST", respond: accepted },
      { match: /analyzeResults/, respond: polls(bankResult({ pages: 2 })) },
    ]);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await post(token, { pdfBase64: B64, pageCount: 9 });
    expect(r.status).toBe(400);
    expect(r.json.error).toBe(AZURE_TOO_LONG);
  });

  it("stays off unless OCR_PDF_ENABLED is true, and without Azure settings", async () => {
    const { token } = await makeUser();
    const spy = happy();
    expect((await post(token, { pdfBase64: B64 }, { ...azureEnv, OCR_PDF_ENABLED: "false" } as never)).status).toBe(400);
    expect((await post(token, { pdfBase64: B64 }, { ...env, OCR_PDF_ENABLED: "true" } as never)).status).toBe(503);
    expect(spy).toHaveLength(0);
  });
});

describe("details printed on the statement", () => {
  it("come back with the rows, with only the last 4 digits of the account number", async () => {
    const r = bankResult();
    const f = (r.analyzeResult.documents[0] as any).fields;
    f.BankName = str("Northfield Community Bank");
    f.AccountHolderName = str("Ada Lovelace");
    f.Accounts.valueArray[0].valueObject.AccountNumber = str("000012341893");
    stubAzure([
      { match: /:analyze/, method: "POST", respond: accepted },
      { match: /analyzeResults/, respond: polls(r) },
    ]);
    const out = await azureReadStatement(azureEnv, B64, { sleep: noSleep });
    expect(out.meta).toMatchObject({ bankName: "Northfield Community Bank", accountHolder: "Ada Lovelace", accountLast4: "1893", periodStart: "2026-03-01", periodEnd: "2026-03-31", openingBalance: 5250.75, closingBalance: 7356.45 });
    expect(JSON.stringify(out.meta)).not.toContain("000012341893");
  });
});

describe("cheap text read first (AZURE_READ_FIRST)", () => {
  const readEnv = { ...azureEnv, AZURE_READ_FIRST: "true" };
  const table = "Date Description Debit Credit Balance 03/02/2026 COFFEE SHOP 4.50 995.50 03/03/2026 PAYROLL 200.00 1,195.50 Beginning balance $1,000.00 Ending balance $1,195.50";
  const readResult = (content: string) => ({ status: "succeeded", analyzeResult: { pages: [{ pageNumber: 1 }], content } });
  function byModel(models: Record<string, () => unknown>) {
    const asked: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit = {}) => {
        const u = String(url);
        if ((init.method ?? "GET") === "POST") {
          const model = /documentModels\/([^:]+):analyze/.exec(u)![1]!;
          asked.push(model);
          return new Response(null, { status: 202, headers: { "Operation-Location": OP.replace("/x/", `/${model}/`) } });
        }
        return new Response(JSON.stringify(models[/documentModels\/([^/]+)\/analyzeResults/.exec(u)![1]!]!()), { status: 200 });
      }),
    );
    return asked;
  }

  it("is off unless switched on: the statement model is asked first", async () => {
    const asked = byModel({ "prebuilt-bankStatement.us": () => bankResult(), "prebuilt-read": () => readResult(table) });
    const out = await azureReadStatement(azureEnv, B64, { sleep: noSleep, expectedPages: 1 });
    expect(asked).toEqual(["prebuilt-bankStatement.us"]);
    expect(out.model).toBe("prebuilt-bankStatement.us");
  });

  it("accepts the plain read when its rows add up to the printed balances, and never asks the dearer model", async () => {
    const asked = byModel({ "prebuilt-read": () => readResult(table), "prebuilt-bankStatement.us": () => bankResult() });
    const out = await azureReadStatement(readEnv, B64, { sleep: noSleep, expectedPages: 1 });
    expect(asked).toEqual(["prebuilt-read"]);
    expect(out.model).toBe("prebuilt-read");
    expect(out.rows.map((r) => [r.amount, r.type])).toEqual([[4.5, "expense"], [200, "income"]]);
  });

  it("falls through to the statement model when the plain read does not add up", async () => {
    const asked = byModel({ "prebuilt-read": () => readResult(table.replace("Ending balance $1,195.50", "Ending balance $1,500.00")), "prebuilt-bankStatement.us": () => bankResult() });
    const out = await azureReadStatement(readEnv, B64, { sleep: noSleep, expectedPages: 1 });
    expect(asked).toEqual(["prebuilt-read", "prebuilt-bankStatement.us"]);
    expect(out.model).toBe("prebuilt-bankStatement.us");
  });
});
