import { describe, expect, it } from "vitest";
import {
  GOOGLE_SHEET_MIME_TYPE,
  GoogleSheetsError,
  XLSX_MIME_TYPE,
  buildMultipartBody,
  saveWorkbookToGoogleSheets,
  sheetNameFromFileName,
} from "./googleSheets";

type Call = { url: string; method: string; headers: Record<string, string>; body: unknown };

function mockFetch(responses: Array<{ status?: number; json?: unknown; text?: string } | Error>) {
  const calls: Call[] = [];
  const impl = (async (url: string, init: RequestInit) => {
    calls.push({ url, method: init.method ?? "GET", headers: init.headers as Record<string, string>, body: init.body });
    const next = responses.shift();
    if (!next) throw new Error("unexpected extra request");
    if (next instanceof Error) throw next;
    const status = next.status ?? 200;
    const text = next.text ?? JSON.stringify(next.json ?? {});
    return { ok: status >= 200 && status < 300, status, text: async () => text, json: async () => JSON.parse(text) } as Response;
  }) as unknown as typeof fetch;
  return { impl, calls };
}

const bytes = new Uint8Array([80, 75, 3, 4, 1, 2, 3]);
const dec = (b: unknown) => new TextDecoder("latin1").decode(b as Uint8Array);

describe("sheetNameFromFileName", () => {
  it("drops the .xlsx extension and falls back to a default", () => {
    expect(sheetNameFromFileName("report-2026-01-02.xlsx")).toBe("report-2026-01-02");
    expect(sheetNameFromFileName(" .xlsx")).toBe("Receipt Cycle report");
  });
});

describe("saveWorkbookToGoogleSheets (web, multipart)", () => {
  it("sends one multipart/related upload that asks Drive to convert to a Google Sheet", async () => {
    const { impl, calls } = mockFetch([{ json: { id: "abc", webViewLink: "https://docs.google.com/spreadsheets/d/abc/edit" } }]);
    const out = await saveWorkbookToGoogleSheets("tok", bytes, "report.xlsx", { fetchImpl: impl });
    expect(out).toEqual({ id: "abc", webViewLink: "https://docs.google.com/spreadsheets/d/abc/edit" });
    expect(calls).toHaveLength(1);
    const c = calls[0];
    expect(c.url).toBe("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink");
    expect(c.method).toBe("POST");
    expect(c.headers.Authorization).toBe("Bearer tok");
    expect(c.headers["Content-Type"]).toMatch(/^multipart\/related; boundary=/);
    const text = dec(c.body);
    expect(text).toContain(JSON.stringify({ name: "report", mimeType: GOOGLE_SHEET_MIME_TYPE }));
    expect(text).toContain(`Content-Type: ${XLSX_MIME_TYPE}`);
    expect(text).toContain("PK\u0003\u0004\u0001\u0002\u0003");
  });

  it("closes the multipart body with the final boundary", () => {
    const body = dec(buildMultipartBody("B", { name: "x" }, bytes));
    expect(body.startsWith("--B\r\n")).toBe(true);
    expect(body.endsWith("\r\n--B--")).toBe(true);
  });

  it("builds a fallback link when Drive omits webViewLink", async () => {
    const { impl } = mockFetch([{ json: { id: "zzz" } }]);
    const out = await saveWorkbookToGoogleSheets("t", bytes, "a.xlsx", { fetchImpl: impl });
    expect(out.webViewLink).toBe("https://docs.google.com/spreadsheets/d/zzz/edit");
  });
});

describe("saveWorkbookToGoogleSheets (React Native, copy)", () => {
  it("uploads media, names it, copies as a Sheet, then deletes the temporary xlsx", async () => {
    const { impl, calls } = mockFetch([
      { json: { id: "tmp1" } },
      { json: { id: "tmp1", name: "r.xlsx" } },
      { json: { id: "sheet9", webViewLink: "https://docs.google.com/spreadsheets/d/sheet9/edit" } },
      { status: 204, text: "" },
    ]);
    const out = await saveWorkbookToGoogleSheets("tok", bytes, "r.xlsx", { mode: "copy", fetchImpl: impl });
    expect(out.id).toBe("sheet9");
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      "POST https://www.googleapis.com/upload/drive/v3/files?uploadType=media&fields=id",
      "PATCH https://www.googleapis.com/drive/v3/files/tmp1?fields=id,name",
      "POST https://www.googleapis.com/drive/v3/files/tmp1/copy?fields=id,webViewLink",
      "DELETE https://www.googleapis.com/drive/v3/files/tmp1",
    ]);
    expect(calls[0].headers["Content-Type"]).toBe(XLSX_MIME_TYPE);
    expect(calls[0].body).toBe(bytes);
    expect(JSON.parse(calls[2].body as string)).toEqual({ name: "r", mimeType: GOOGLE_SHEET_MIME_TYPE });
  });

  it("still deletes the temporary file when the copy fails", async () => {
    const { impl, calls } = mockFetch([
      { json: { id: "tmp2" } },
      { json: {} },
      { status: 500, text: "boom" },
      { status: 204, text: "" },
    ]);
    await expect(saveWorkbookToGoogleSheets("t", bytes, "r.xlsx", { mode: "copy", fetchImpl: impl })).rejects.toBeInstanceOf(GoogleSheetsError);
    expect(calls[calls.length - 1].method).toBe("DELETE");
  });
});

describe("error mapping", () => {
  const run = async (res: { status: number; json?: unknown } | Error) => {
    const { impl } = mockFetch([res]);
    try {
      await saveWorkbookToGoogleSheets("t", bytes, "a.xlsx", { fetchImpl: impl });
    } catch (e) {
      return e as GoogleSheetsError;
    }
    throw new Error("expected failure");
  };

  it("maps 401 to not_signed_in", async () => {
    expect((await run({ status: 401, json: {} })).code).toBe("not_signed_in");
  });
  it("maps 403 to permission_denied", async () => {
    expect((await run({ status: 403, json: { error: { message: "no", errors: [{ reason: "forbidden" }] } } })).code).toBe("permission_denied");
  });
  it("maps a disabled Drive API to api_disabled", async () => {
    const e = await run({ status: 403, json: { error: { message: "Google Drive API has not been used in project 1", errors: [{ reason: "accessNotConfigured" }] } } });
    expect(e.code).toBe("api_disabled");
  });
  it("maps a full Drive and rate limits to quota", async () => {
    expect((await run({ status: 403, json: { error: { errors: [{ reason: "storageQuotaExceeded" }] } } })).code).toBe("quota");
    expect((await run({ status: 429, json: {} })).code).toBe("quota");
  });
  it("maps a thrown fetch to network", async () => {
    expect((await run(new TypeError("Failed to fetch"))).code).toBe("network");
  });
  it("keeps other statuses as unknown with the status", async () => {
    const e = await run({ status: 500, json: { error: { message: "internal" } } });
    expect(e.code).toBe("unknown");
    expect(e.status).toBe(500);
  });
});
