/**
 * Bank / card statement CSV → transaction rows (client-side).
 * Handles common column names and signed Amount, or Debit/Credit columns.
 */

export type ImportPreviewRow = {
  date: string;
  amount: number;
  type: "expense" | "income";
  description: string;
  merchant?: string;
};

export type ParseStatementResult =
  | { ok: true; rows: ImportPreviewRow[]; warnings: string[] }
  | { ok: false; error: string };

const MAX_ROWS = 500;

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else if (c === "\r" && !inQuotes) {
      continue;
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

function parseMoney(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  let t = s.replace(/[$€£\s]/g, "");
  if (/^\(.*\)$/.test(t)) {
    t = "-" + t.slice(1, -1);
  }
  const n = parseFloat(t.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Normalize to YYYY-MM-DD */
export function parseDateCell(s: string): string | null {
  const t = s.trim();
  if (!t) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const mdy = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(t);
  if (mdy) {
    let mm = parseInt(mdy[1]!, 10);
    let dd = parseInt(mdy[2]!, 10);
    let yy = parseInt(mdy[3]!, 10);
    if (yy < 100) yy += yy >= 70 ? 1900 : 2000;
    if (mm > 12 && dd <= 12) {
      const x = mm;
      mm = dd;
      dd = x;
    }
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
    return `${yy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  }
  const dmy = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(t);
  if (dmy) {
    const dd = parseInt(dmy[1]!, 10);
    const mm = parseInt(dmy[2]!, 10);
    const yy = parseInt(dmy[3]!, 10);
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
    return `${yy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  }
  return null;
}

type ColMap = {
  date: number;
  amount?: number;
  debit?: number;
  credit?: number;
  description: number;
};

function normHeader(h: string) {
  return h.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/\s+/g, " ");
}

function detectColumns(headers: string[]): ColMap | null {
  const norm = headers.map(normHeader);
  const idx = (pred: (h: string) => boolean) => norm.findIndex(pred);

  const dateIdx = idx(
    (h) =>
      h === "date" ||
      h.includes("transaction date") ||
      h.includes("posting date") ||
      h.includes("posted") ||
      (h.includes("date") && !h.includes("statement")),
  );
  if (dateIdx < 0) return null;

  let amountIdx = idx(
    (h) =>
      h === "amount" ||
      h === "transaction amount" ||
      (h.includes("amount") && !h.includes("balance")),
  );
  const debitIdx = idx((h) => h === "debit" || h.includes("withdrawal") || h === "payment");
  const creditIdx = idx((h) => h === "credit" || h.includes("deposit"));

  const descIdx = idx(
    (h) =>
      h.includes("description") ||
      h.includes("memo") ||
      h.includes("details") ||
      h.includes("narration") ||
      h === "payee" ||
      h.includes("merchant") ||
      h.includes("name"),
  );
  if (descIdx < 0) return null;

  if (amountIdx < 0 && (debitIdx >= 0 || creditIdx >= 0)) {
    return { date: dateIdx, debit: debitIdx >= 0 ? debitIdx : undefined, credit: creditIdx >= 0 ? creditIdx : undefined, description: descIdx };
  }
  if (amountIdx < 0) return null;

  return { date: dateIdx, amount: amountIdx, description: descIdx };
}

function rowToImport(cells: string[], map: ColMap, warnings: string[]): ImportPreviewRow | null {
  const dStr = cells[map.date] ?? "";
  const date = parseDateCell(dStr);
  if (!date) return null;

  let signed: number | null = null;
  if (map.amount !== undefined) {
    signed = parseMoney(cells[map.amount] ?? "");
  } else {
    const debit = map.debit !== undefined ? parseMoney(cells[map.debit] ?? "") : null;
    const credit = map.credit !== undefined ? parseMoney(cells[map.credit] ?? "") : null;
    if (debit != null && debit !== 0) signed = -Math.abs(debit);
    else if (credit != null && credit !== 0) signed = Math.abs(credit);
    else signed = null;
  }
  if (signed == null || signed === 0) return null;

  const abs = Math.abs(signed);
  const type: "expense" | "income" = signed < 0 ? "expense" : "income";
  const description = (cells[map.description] ?? "").replace(/\s+/g, " ").trim() || "Imported";

  return {
    date,
    amount: round2(abs),
    type,
    description: description.slice(0, 500),
    merchant: description.slice(0, 120),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function parseStatementCsv(text: string): ParseStatementResult {
  const warnings: string[] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { ok: false, error: "CSV is empty or has no data rows." };
  }

  const rows = lines.map(splitCsvLine);
  const headerRow = rows[0]!;
  const colMap = detectColumns(headerRow);
  if (!colMap) {
    return {
      ok: false,
      error:
        "Could not find required columns. Include headers such as Date, Amount (or Debit/Credit), and Description.",
    };
  }

  const out: ImportPreviewRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i]!;
    if (cells.length < 2) continue;
    const r = rowToImport(cells, colMap, warnings);
    if (r) out.push(r);
    if (out.length >= MAX_ROWS) {
      warnings.push(`Stopped at ${MAX_ROWS} rows (limit).`);
      break;
    }
  }

  if (out.length === 0) {
    return { ok: false, error: "No valid transaction rows found. Check date and amount formats." };
  }

  return { ok: true, rows: out, warnings };
}

/**
 * Best-effort parse from plain text (e.g. PDF extraction): lines with a date + amount.
 */
export function parseLooseStatementText(text: string): ParseStatementResult {
  const warnings: string[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: ImportPreviewRow[] = [];

  const dateRe = /(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})/;
  const amountRe = /[$€£]?\s*-?\(?[\d,]+\.?\d*\)?|\b-?[\d,]+\.\d{2}\b/;

  for (const line of lines) {
    if (line.length > 400) continue;
    const dm = dateRe.exec(line);
    if (!dm) continue;
    const date = parseDateCell(dm[1]!);
    if (!date) continue;

    const amounts: number[] = [];
    let m: RegExpExecArray | null;
    const re = new RegExp(amountRe.source, "g");
    while ((m = re.exec(line)) !== null) {
      const n = parseMoney(m[0]!);
      if (n != null && Math.abs(n) > 0.009) amounts.push(n);
    }
    if (amounts.length === 0) continue;
    const signed = amounts[amounts.length - 1]!;
    if (signed === 0) continue;
    const abs = Math.abs(signed);
    const type: "expense" | "income" = signed < 0 ? "expense" : "income";
    const description = line
      .replace(dm[0]!, "")
      .replace(amountRe, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500) || "Imported";

    out.push({
      date,
      amount: round2(abs),
      type,
      description,
      merchant: description.slice(0, 120),
    });

    if (out.length >= MAX_ROWS) {
      warnings.push(`Stopped at ${MAX_ROWS} rows (limit).`);
      break;
    }
  }

  if (out.length === 0) {
    return {
      ok: false,
      error: "Could not extract dated lines with amounts from this PDF/text. Try exporting CSV from your bank.",
    };
  }
  warnings.push("PDF/text import is approximate — review transactions in the app.");
  return { ok: true, rows: out, warnings };
}
