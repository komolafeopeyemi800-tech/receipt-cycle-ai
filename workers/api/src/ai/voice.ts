/**
 * Voice and parsing helpers. Ported from apps/mobile/convex/voiceFinance.ts: prompts and parsing are
 * unchanged; `process.env` became the Worker `env` argument.
 */
import type { Env } from "../types";

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function requireOpenAiKey(env: Env): string | null {
  return env.OPENAI_API_KEY?.trim() || null;
}

export async function whisperTranscribe(
  env: Env,
  audioBase64: string,
  mimeType: string,
  language?: string | null,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const key = requireOpenAiKey(env);
  if (!key) {
    return { ok: false, error: "Add OPENAI_API_KEY to the API Worker for voice features." };
  }

  const buf = base64ToBytes(audioBase64);
  const ext =
    mimeType.includes("webm") ? "webm" : mimeType.includes("wav") ? "wav" : mimeType.includes("mp3") ? "mp3" : "m4a";
  const form = new FormData();
  form.append("file", new Blob([buf], { type: mimeType || "audio/m4a" }), `clip.${ext}`);
  form.append("model", "whisper-1");
  const lang = (language ?? "").trim().toLowerCase();
  if (lang && lang !== "auto") {
    const code = lang.length === 2 ? lang : lang.split(/[-_]/)[0] ?? lang;
    if (/^[a-z]{2}$/i.test(code)) {
      form.append("language", code.toLowerCase());
    }
  }

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });

  if (!res.ok) {
    const t = await res.text();
    return { ok: false, error: `Whisper (${res.status}): ${t.slice(0, 200)}` };
  }

  const data = (await res.json()) as { text?: string };
  const text = String(data.text ?? "").trim();
  if (!text) {
    return { ok: false, error: "Could not transcribe audio. Try again or type your purchase." };
  }
  return { ok: true, text };
}

export type VoiceParseHints = {
  expenseCategories?: string[];
  incomeCategories?: string[];
  accountNames?: string[];
};

export type TxDraft = {
  intent: "transaction" | "budget";
  amount: number | null;
  type: "expense" | "income";
  category: string;
  merchant: string | null;
  date: string | null;
  description: string | null;
  payment_method: string | null;
  confidence: "high" | "medium" | "low";
  budgetCategory: string | null;
  budgetLimit: number | null;
  budgetMonth: string | null;
};

function hintsBlock(hints?: VoiceParseHints | null): string {
  if (!hints) return "";
  const exp = (hints.expenseCategories ?? []).map((s) => s.trim()).filter(Boolean);
  const inc = (hints.incomeCategories ?? []).map((s) => s.trim()).filter(Boolean);
  const acc = (hints.accountNames ?? []).map((s) => s.trim()).filter(Boolean);
  const parts: string[] = [];
  if (exp.length)
    parts.push(
      `The user's saved EXPENSE category names (use an EXACT string from this list when the utterance matches; otherwise closest): ${exp.slice(0, 80).join(" | ")}`,
    );
  if (inc.length)
    parts.push(
      `The user's saved INCOME category names (exact match when possible): ${inc.slice(0, 40).join(" | ")}`,
    );
  if (acc.length)
    parts.push(
      `Account / payment labels the user uses — map payment_method to the closest from: ${acc.slice(0, 40).join(" | ")}`,
    );
  return parts.length ? `\n\n${parts.join("\n")}` : "";
}

export async function openaiParseTransaction(
  env: Env,
  transcript: string,
  hints?: VoiceParseHints | null,
): Promise<{ ok: true; draft: TxDraft } | { ok: false; error: string }> {
  const key = requireOpenAiKey(env);
  if (!key) {
    return { ok: false, error: "Add OPENAI_API_KEY to the API Worker." };
  }

  const todayUtc = new Date().toISOString().split("T")[0];
  const system = `You parse spoken or typed money notes into structured JSON for a personal receipt app.

Two intents:
1) "transaction" — a purchase, bill, refund, or income line they want to log (amount, merchant, category, date, etc.).
2) "budget" — they want a monthly spending cap for a category (e.g. "set groceries budget to 300", "cap food at 500 this month").

Rules for transaction:
- type: "expense" unless they clearly earned income.
- amount: positive number; null only if truly unclear.
- category: MUST prefer an EXACT match from the user's lists when provided; otherwise best short label.
- merchant: store or payee if inferable.
- date: YYYY-MM-DD from what they said (relative like "yesterday" vs today UTC ${todayUtc}) or null.
- description: short note or null.
- payment_method: how they paid ONLY if they say it (e.g. cash, card, Venmo) — match to their account list when provided; else null.

Rules for budget:
- intent "budget", budgetLimit = monthly cap as a positive number, budgetCategory = category name (match their list when possible), budgetMonth = YYYY-MM if they name a month/year else null (app will default to current month).
- Other fields can be null or sensible defaults.${hintsBlock(hints)}`;

  const jsonShape = `{"intent":"transaction"|"budget","amount":number|null,"type":"expense"|"income","category":"string","merchant":string|null,"date":"YYYY-MM-DD"|null,"description":string|null,"payment_method":string|null,"confidence":"high"|"medium"|"low","budgetCategory":string|null,"budgetLimit":number|null,"budgetMonth":"YYYY-MM"|null}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `Transcript:\n${transcript.slice(0, 4000)}\n\nReply with JSON only:\n${jsonShape}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    return { ok: false, error: `OpenAI (${res.status}): ${t.slice(0, 200)}` };
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) {
    return { ok: false, error: "Empty model response." };
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const intent = parsed.intent === "budget" ? "budget" : "transaction";
    const type = parsed.type === "income" ? "income" : "expense";
    let amount: number | null = null;
    if (parsed.amount !== null && parsed.amount !== undefined && Number.isFinite(Number(parsed.amount))) {
      amount = Math.round(Number(parsed.amount) * 100) / 100;
      if (amount <= 0) amount = null;
    }
    let budgetLimit: number | null = null;
    if (parsed.budgetLimit !== null && parsed.budgetLimit !== undefined && Number.isFinite(Number(parsed.budgetLimit))) {
      budgetLimit = Math.round(Number(parsed.budgetLimit) * 100) / 100;
      if (budgetLimit <= 0) budgetLimit = null;
    }
    const budgetMonth =
      parsed.budgetMonth != null && String(parsed.budgetMonth).trim()
        ? String(parsed.budgetMonth).trim().slice(0, 7)
        : null;
    const monthOk = budgetMonth && /^\d{4}-\d{2}$/.test(budgetMonth) ? budgetMonth : null;
    const catBudget =
      parsed.budgetCategory != null ? String(parsed.budgetCategory).trim() || null : null;
    const draft: TxDraft = {
      intent,
      amount,
      type,
      category: String(parsed.category ?? "Other").trim() || "Other",
      merchant: parsed.merchant != null ? String(parsed.merchant).trim() || null : null,
      date: parsed.date != null ? String(parsed.date).trim().slice(0, 10) || null : null,
      description: parsed.description != null ? String(parsed.description).trim() || null : null,
      payment_method: parsed.payment_method != null ? String(parsed.payment_method).trim() || null : null,
      confidence: parsed.confidence === "low" || parsed.confidence === "medium" ? parsed.confidence : "high",
      budgetCategory: intent === "budget" ? catBudget : null,
      budgetLimit: intent === "budget" ? budgetLimit : null,
      budgetMonth: intent === "budget" ? monthOk : null,
    };
    return { ok: true, draft };
  } catch {
    return { ok: false, error: "Could not parse transaction from speech." };
  }
}
