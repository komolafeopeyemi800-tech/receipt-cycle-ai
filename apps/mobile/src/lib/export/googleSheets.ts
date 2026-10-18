/**
 * Save an .xlsx workbook into the person's own Google Drive as a Google Sheet.
 *
 * Pure fetch + typed arrays: no browser-only or React Native APIs, so the website and the phone share it.
 * Only the limited drive.file permission is needed (files created by this app).
 */

export const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";
export const XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const GOOGLE_SHEET_MIME_TYPE = "application/vnd.google-apps.spreadsheet";

const UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";
const FILES_URL = "https://www.googleapis.com/drive/v3/files";

export type GoogleSheetsErrorCode =
  | "not_signed_in"
  | "permission_denied"
  | "api_disabled"
  | "quota"
  | "network"
  | "unknown";

export class GoogleSheetsError extends Error {
  readonly code: GoogleSheetsErrorCode;
  readonly status?: number;
  constructor(code: GoogleSheetsErrorCode, message: string, status?: number) {
    super(message);
    this.name = "GoogleSheetsError";
    this.code = code;
    this.status = status;
  }
}

export type SavedGoogleSheet = { id: string; webViewLink: string };

export type SaveToSheetsOptions = {
  /**
   * "multipart" (default, website): one request, Drive converts the file.
   * "copy" (React Native, where multipart bodies are unreliable): upload, copy as a Sheet, delete the temporary file.
   */
  mode?: "multipart" | "copy";
  /** Test hook / custom transport. Defaults to the global fetch. */
  fetchImpl?: typeof fetch;
};

/** "My report.xlsx" becomes "My report" so the Sheet is not named like a file. */
export function sheetNameFromFileName(fileName: string): string {
  const trimmed = fileName.trim().replace(/\.xlsx$/i, "");
  return trimmed || "Receipt Cycle report";
}

type DriveErrorBody = { error?: { message?: string; errors?: { reason?: string }[]; status?: string } };

async function toError(res: Response): Promise<GoogleSheetsError> {
  let body: DriveErrorBody = {};
  try {
    body = JSON.parse(await res.text()) as DriveErrorBody;
  } catch {
    /* not JSON */
  }
  const reason = body.error?.errors?.[0]?.reason ?? "";
  const detail = body.error?.message ?? "";
  const status = res.status;
  if (status === 401) {
    return new GoogleSheetsError("not_signed_in", "Your Google sign-in expired. Choose Save to Google again and sign in.", status);
  }
  if (status === 403 && (reason === "accessNotConfigured" || /has not been used|is disabled/i.test(detail))) {
    return new GoogleSheetsError("api_disabled", "Google Drive is not switched on for this app yet. Please contact support.", status);
  }
  if (status === 403 && (reason === "storageQuotaExceeded" || /storage quota/i.test(detail))) {
    return new GoogleSheetsError("quota", "Your Google Drive is full. Free up some space and try again.", status);
  }
  if (status === 429 || (status === 403 && /rate|limit/i.test(reason))) {
    return new GoogleSheetsError("quota", "Google is busy right now. Wait a minute and try again.", status);
  }
  if (status === 403) {
    return new GoogleSheetsError("permission_denied", "Google did not allow Receipt Cycle to save the file. Try again and allow access to files this app creates.", status);
  }
  return new GoogleSheetsError("unknown", detail || `Google Drive could not save the report (error ${status}).`, status);
}

async function call(f: typeof fetch, url: string, init: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await f(url, init);
  } catch {
    throw new GoogleSheetsError("network", "Could not reach Google. Check your connection and try again.");
  }
  if (!res.ok) throw await toError(res);
  return res;
}

function readLink(json: { id?: string; webViewLink?: string }): SavedGoogleSheet {
  if (!json.id) throw new GoogleSheetsError("unknown", "Google saved the file but did not return its address.");
  return { id: json.id, webViewLink: json.webViewLink || `https://docs.google.com/spreadsheets/d/${json.id}/edit` };
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

function randomBoundary(): string {
  return `rc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Build the multipart/related body: JSON metadata part, then the xlsx bytes. Exported for tests. */
export function buildMultipartBody(boundary: string, metadata: object, bytes: Uint8Array): Uint8Array {
  const enc = new TextEncoder();
  return concat([
    enc.encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`),
    enc.encode(`--${boundary}\r\nContent-Type: ${XLSX_MIME_TYPE}\r\n\r\n`),
    bytes,
    enc.encode(`\r\n--${boundary}--`),
  ]);
}

/**
 * Create a Google Sheet in the person's Drive from `bytes` (an .xlsx workbook).
 * Returns the file id and a link that opens it in Google Sheets.
 */
export async function saveWorkbookToGoogleSheets(
  accessToken: string,
  bytes: Uint8Array,
  fileName: string,
  options: SaveToSheetsOptions = {},
): Promise<SavedGoogleSheet> {
  const f = options.fetchImpl ?? fetch;
  const name = sheetNameFromFileName(fileName);
  const auth = { Authorization: `Bearer ${accessToken}` };

  if ((options.mode ?? "multipart") === "multipart") {
    const boundary = randomBoundary();
    const res = await call(f, `${UPLOAD_URL}?uploadType=multipart&fields=id,webViewLink`, {
      method: "POST",
      headers: { ...auth, "Content-Type": `multipart/related; boundary=${boundary}` },
      body: buildMultipartBody(boundary, { name, mimeType: GOOGLE_SHEET_MIME_TYPE }, bytes) as unknown as BodyInit,
    });
    return readLink((await res.json()) as { id?: string; webViewLink?: string });
  }

  // React Native path: media upload, rename, convert by copying, then remove the temporary xlsx.
  const up = await call(f, `${UPLOAD_URL}?uploadType=media&fields=id`, {
    method: "POST",
    headers: { ...auth, "Content-Type": XLSX_MIME_TYPE },
    body: bytes as unknown as BodyInit,
  });
  const tempId = ((await up.json()) as { id?: string }).id;
  if (!tempId) throw new GoogleSheetsError("unknown", "Google accepted the file but did not return its id.");

  const removeTemp = async () => {
    try {
      await f(`${FILES_URL}/${tempId}`, { method: "DELETE", headers: auth });
    } catch {
      /* a leftover temporary file is harmless */
    }
  };

  try {
    await call(f, `${FILES_URL}/${tempId}?fields=id,name`, {
      method: "PATCH",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ name: `${name}.xlsx` }),
    });
    const copy = await call(f, `${FILES_URL}/${tempId}/copy?fields=id,webViewLink`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ name, mimeType: GOOGLE_SHEET_MIME_TYPE }),
    });
    const saved = readLink((await copy.json()) as { id?: string; webViewLink?: string });
    await removeTemp();
    return saved;
  } catch (e) {
    await removeTemp();
    throw e;
  }
}
